import { Platform } from 'react-native';
import { settingsService } from './settingsService';

export type StreamStatus = 'CONNECTED' | 'CONNECTING' | 'OFFLINE' | 'ERROR';

export type StreamFrame = {
  uri: string;
  timestamp: number;
  width?: number;
  height?: number;
  latencyMs?: number;
};

export type StreamStats = {
  fps: number;
  latencyMs: number;
  status: StreamStatus;
  url: string;
  lastFrameTime: number | null;
  frameCount: number;
};

type FrameListener = (frame: StreamFrame) => void;
type StatusListener = (status: StreamStatus, stats: StreamStats) => void;

class CameraStreamService {
  private ws: WebSocket | null = null;
  private currentUrl: string =
    Platform.OS === 'web' ? 'ws://localhost:8080' : 'ws://192.168.137.129:8080';
  private status: StreamStatus = 'OFFLINE';
  private frameListeners: Set<FrameListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private shouldReconnect = true;

  // FPS calculation
  private frameCount = 0;
  private lastFpsCalcTime = Date.now();
  private currentFps = 0;
  private lastLatencyMs = 0;
  private lastFrameTime: number | null = null;
  private latestFrame: StreamFrame | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const config = await settingsService.getStreamConfig();
      if (config.streamUrl) {
        this.currentUrl = config.streamUrl;
      }
      if (config.autoConnect) {
        this.connect(this.currentUrl);
      }
    } catch {
      // Ignore init errors
    }
  }

  public getStats(): StreamStats {
    return {
      fps: this.currentFps,
      latencyMs: this.lastLatencyMs,
      status: this.status,
      url: this.currentUrl,
      lastFrameTime: this.lastFrameTime,
      frameCount: this.frameCount,
    };
  }

  public getLatestFrame(): StreamFrame | null {
    return this.latestFrame;
  }

  public getStatus(): StreamStatus {
    return this.status;
  }

  public connect(url?: string) {
    if (url) {
      this.currentUrl = url;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.ws.url === this.currentUrl) {
        return;
      }
      this.disconnect();
    }

    this.shouldReconnect = true;
    this.setStatus('CONNECTING');

    try {
      // Normalize WebSocket URL
      let wsUrl = this.currentUrl.trim();
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        wsUrl = `ws://${wsUrl}`;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        // Send client handshake identification
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(JSON.stringify({ type: 'subscribe', client: 'hawkeye-mobile-app' }));
          } catch {
            // ignore
          }
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (e) => {
        console.warn('Camera stream WebSocket error:', e);
        this.setStatus('ERROR');
      };

      this.ws.onclose = () => {
        this.setStatus('OFFLINE');
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.warn('Failed to initiate WebSocket connection:', err);
      this.setStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.setStatus('OFFLINE');
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private handleMessage(data: any) {
    try {
      const now = Date.now();
      let frameUri = '';
      let frameTimestamp = now;
      let width: number | undefined;
      let height: number | undefined;

      if (typeof data === 'string') {
        if (data.startsWith('data:image/') || data.startsWith('http://') || data.startsWith('https://')) {
          frameUri = data;
        } else {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'frame' || parsed.image || parsed.data) {
              frameUri = parsed.data || parsed.image;
              if (parsed.timestamp) {
                frameTimestamp = parsed.timestamp;
                this.lastLatencyMs = Math.max(0, now - parsed.timestamp);
              }
              width = parsed.width;
              height = parsed.height;
            } else if (parsed.type === 'ping') {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'pong', timestamp: now }));
              }
              return;
            }
          } catch {
            // raw base64 without prefix
            if (data.length > 100) {
              frameUri = `data:image/jpeg;base64,${data}`;
            }
          }
        }
      }

      if (frameUri) {
        this.frameCount++;
        this.lastFrameTime = now;

        // Calculate dynamic FPS every 1000ms
        const elapsed = now - this.lastFpsCalcTime;
        if (elapsed >= 1000) {
          this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
          this.frameCount = 0;
          this.lastFpsCalcTime = now;
          this.notifyStatusListeners();
        }

        const frame: StreamFrame = {
          uri: frameUri,
          timestamp: frameTimestamp,
          width,
          height,
          latencyMs: this.lastLatencyMs,
        };

        this.latestFrame = frame;

        // Broadcast to listeners
        for (const listener of this.frameListeners) {
          try {
            listener(frame);
          } catch (e) {
            console.error('Error in frame listener:', e);
          }
        }
      }
    } catch (e) {
      console.warn('Error handling stream frame:', e);
    }
  }

  private setStatus(newStatus: StreamStatus) {
    this.status = newStatus;
    this.notifyStatusListeners();
  }

  private notifyStatusListeners() {
    const stats = this.getStats();
    for (const listener of this.statusListeners) {
      try {
        listener(this.status, stats);
      } catch (e) {
        console.error('Error in stream status listener:', e);
      }
    }
  }

  public subscribe(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    if (this.latestFrame) {
      listener(this.latestFrame);
    }
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.getStats());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public async pingTest(testUrl?: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    const target = testUrl || this.currentUrl;
    const startTime = Date.now();
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { testWs.close(); } catch {}
          resolve({ success: false, latencyMs: 0, error: 'Connection timed out (3000ms)' });
        }
      }, 3000);

      let wsUrl = target.trim();
      if (wsUrl.startsWith('http://')) wsUrl = wsUrl.replace('http://', 'ws://');
      else if (wsUrl.startsWith('https://')) wsUrl = wsUrl.replace('https://', 'wss://');
      else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) wsUrl = `ws://${wsUrl}`;

      const testWs = new WebSocket(wsUrl);

      testWs.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const latency = Date.now() - startTime;
          try { testWs.close(); } catch {}
          resolve({ success: true, latencyMs: latency });
        }
      };

      testWs.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ success: false, latencyMs: 0, error: 'Could not connect to WebSocket endpoint' });
        }
      };
    });
  }
}

export const cameraStreamService = new CameraStreamService();
