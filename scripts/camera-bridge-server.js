/**
 * HAWKEYE Live Webcam Stream Bridge Server
 * 
 * Synchronizes real-time webcam video feed from the Hawkeye Web Dashboard / Website
 * to the Hawkeye Expo React Native Mobile App over WebSocket & HTTP MJPEG.
 * 
 * Run with: npm run stream:server  OR  node scripts/camera-bridge-server.js
 */

const http = require('http');
const os = require('os');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server || WebSocket.WebSocketServer;

const PORT = parseInt(process.env.PORT || '8080', 10);

// Get Local LAN IP addresses for display
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ interface: name, address: iface.address });
      }
    }
  }
  return addresses;
}

const localIps = getLocalIpAddresses();
const primaryIp = localIps.length > 0 ? localIps[0].address : 'localhost';

// Global stream state
let latestFrame = null;
let latestTimestamp = Date.now();
let frameCount = 0;
let currentFps = 0;
let lastFpsCheck = Date.now();
let mjpegSubscribers = new Set();

// Recalculate FPS every second
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - lastFpsCheck) / 1000;
  if (elapsed >= 1) {
    currentFps = Math.round(frameCount / elapsed);
    frameCount = 0;
    lastFpsCheck = now;
  }
}, 1000);

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // 1. JSON Status API
  if (url === '/status' || url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      activeStream: latestFrame !== null && (Date.now() - latestTimestamp < 4000),
      fps: currentFps,
      lastFrameAgeMs: Date.now() - latestTimestamp,
      wsPort: PORT,
      wsUrlLocal: `ws://localhost:${PORT}`,
      wsUrlLan: `ws://${primaryIp}:${PORT}`,
      wsUrlAndroidEmulator: `ws://10.0.2.2:${PORT}`,
      localIps,
      timestamp: Date.now(),
    }));
    return;
  }

  // 2. Latest Snapshot JPEG
  if (url === '/snapshot' || url === '/snapshot.jpg') {
    if (!latestFrame) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('No frame received yet from webcam');
      return;
    }
    const base64Data = latestFrame.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(buffer);
    return;
  }

  // 3. Multipart MJPEG Stream
  if (url === '/stream.mjpg' || url === '/video_feed') {
    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=--frameboundary',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'close',
      'Pragma': 'no-cache',
    });

    const subscriber = (frameBuffer) => {
      try {
        res.write(`--frameboundary\r\n`);
        res.write(`Content-Type: image/jpeg\r\n`);
        res.write(`Content-Length: ${frameBuffer.length}\r\n\r\n`);
        res.write(frameBuffer);
        res.write(`\r\n`);
      } catch (e) {
        mjpegSubscribers.delete(subscriber);
      }
    };

    mjpegSubscribers.add(subscriber);

    // Initial frame if available
    if (latestFrame) {
      const base64Data = latestFrame.replace(/^data:image\/\w+;base64,/, '');
      subscriber(Buffer.from(base64Data, 'base64'));
    }

    req.on('close', () => {
      mjpegSubscribers.delete(subscriber);
    });
    return;
  }

  // 4. Web Dashboard & Built-in Webcam Broadcaster
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml(primaryIp, PORT, localIps));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

// Create WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;

  // Send current status immediately upon connection
  ws.send(JSON.stringify({
    type: 'connected',
    server: 'Hawkeye Webcam Stream Bridge',
    hasActiveStream: latestFrame !== null && (Date.now() - latestTimestamp < 3000),
    fps: currentFps,
  }));

  // If we already have a recent frame, send it immediately
  if (latestFrame && (Date.now() - latestTimestamp < 3000)) {
    ws.send(JSON.stringify({
      type: 'frame',
      data: latestFrame,
      timestamp: latestTimestamp,
    }));
  }

  ws.on('message', (message) => {
    try {
      const text = message.toString();
      let frameData = null;
      let timestamp = Date.now();

      if (text.startsWith('data:image/')) {
        frameData = text;
      } else {
        try {
          const parsed = JSON.parse(text);
          if (parsed.type === 'frame' || parsed.data || parsed.image) {
            frameData = parsed.data || parsed.image;
            timestamp = parsed.timestamp || Date.now();
          } else if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            return;
          }
        } catch {
          if (text.length > 200) {
            frameData = `data:image/jpeg;base64,${text}`;
          }
        }
      }

      if (frameData) {
        latestFrame = frameData;
        latestTimestamp = timestamp;
        frameCount++;

        // Broadcast to all other connected WebSocket clients (the mobile apps)
        const outgoing = JSON.stringify({
          type: 'frame',
          data: frameData,
          timestamp,
        });

        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(outgoing);
          }
        });

        // Broadcast to MJPEG HTTP subscribers if any
        if (mjpegSubscribers.size > 0) {
          const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          mjpegSubscribers.forEach((sendMjpeg) => {
            sendMjpeg(buffer);
          });
        }
      }
    } catch (e) {
      console.warn('Error handling incoming WS message:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.warn(`WebSocket error from ${clientIp}:`, err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('   HAWKEYE LIVE WEBCAM STREAM BRIDGE SERVER STARTED');
  console.log('======================================================');
  console.log(`> Web Dashboard & Stream Test:  http://localhost:${PORT}`);
  console.log(`> Local WebSocket URL:         ws://localhost:${PORT}`);
  console.log(`> LAN / Mobile App URL:        ws://${primaryIp}:${PORT}`);
  console.log(`> Android Emulator URL:        ws://10.0.2.2:${PORT}`);
  console.log(`> MJPEG Stream URL:            http://${primaryIp}:${PORT}/stream.mjpg`);
  console.log('======================================================\n');
});

// HTML Web Dashboard
function getDashboardHtml(ip, port, ips) {
  const ipList = ips.map(i => `<code>ws://${i.address}:${port}</code> (${i.interface})`).join('<br/>') || `<code>ws://localhost:${port}</code>`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hawkeye Webcam Stream Bridge</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0B0F17;
      color: #F1F5F9;
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      background: #064E3B;
      color: #34D399;
      border: 1px solid #059669;
    }
    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #34D399;
      margin-right: 6px;
      animation: blink 1.5s infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: #131B26;
      border: 1px solid #1E293B;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    }
    h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #38BDF8; }
    video, canvas, #previewImg {
      width: 100%;
      height: 240px;
      background: #000;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid #334155;
    }
    button {
      background: #0284C7;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      margin-top: 12px;
      transition: background 0.2s;
    }
    button:hover { background: #0369A1; }
    button.stop { background: #DC2626; }
    button.stop:hover { background: #B91C1C; }
    pre {
      background: #0F172A;
      padding: 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      color: #E2E8F0;
      overflow-x: auto;
      border: 1px solid #334155;
      margin-top: 8px;
    }
    code { font-family: monospace; color: #38BDF8; background: #1E293B; padding: 2px 6px; border-radius: 4px; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1E293B; font-size: 13px; }
    .stat-label { color: #94A3B8; }
    .stat-val { font-weight: 600; color: #F1F5F9; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1 style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">HAWKEYE WEBCAM BRIDGE</h1>
        <p style="font-size: 12px; color: #94A3B8;">Real-time sync between Web Camera & Mobile App</p>
      </div>
      <div class="badge">
        <div class="pulse"></div> SERVER ACTIVE :${port}
      </div>
    </header>

    <div class="grid">
      <!-- Broadcaster Card -->
      <div class="card">
        <h2>Webcam Broadcaster Test</h2>
        <p style="font-size: 13px; color: #94A3B8; margin-bottom: 10px;">
          Click below to test broadcasting your computer's webcam to the mobile app directly.
        </p>
        <video id="webcam" autoplay playsinline muted></video>
        <div style="display:flex; gap:10px;">
          <button id="startBtn" onclick="startWebcam()">Start Webcam Broadcast</button>
          <button id="stopBtn" class="stop" onclick="stopWebcam()" style="display:none;">Stop Broadcast</button>
        </div>
      </div>

      <!-- Live Stream Receiver Preview -->
      <div class="card">
        <h2>Live App Stream Preview</h2>
        <p style="font-size: 13px; color: #94A3B8; margin-bottom: 10px;">
          Real-time frames received by connected Hawkeye mobile apps:
        </p>
        <img id="previewImg" alt="Waiting for webcam stream..." />
        
        <div style="margin-top: 14px;">
          <div class="stat-row">
            <span class="stat-label">Live Broadcast FPS</span>
            <span class="stat-val" id="fpsStat">0 FPS</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Mobile App WS URL</span>
            <span class="stat-val">ws://${ip}:${port}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">HTTP MJPEG Feed</span>
            <span class="stat-val"><a href="/stream.mjpg" target="_blank" style="color:#38BDF8;">/stream.mjpg</a></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Connection Info & Website Integration Snippet -->
    <div class="card" style="margin-top: 20px;">
      <h2>How to Sync from your Website</h2>
      <p style="font-size: 13px; color: #CBD5E1; margin-bottom: 8px;">
        Add this lightweight snippet to your existing website where your webcam <code>&lt;video&gt;</code> element runs:
      </p>
      <pre><code>// 1. Connect to the Hawkeye Bridge Server
const streamWs = new WebSocket('ws://${ip}:${port}');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// 2. Broadcast video frames at ~30 FPS
setInterval(() => {
  const video = document.querySelector('video'); // Your webcam &lt;video&gt;
  if (video && video.readyState >= 2 && streamWs.readyState === WebSocket.OPEN) {
    canvas.width = 640;
    canvas.height = 360;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/jpeg', 0.65);
    streamWs.send(JSON.stringify({
      type: 'frame',
      data: frameData,
      timestamp: Date.now()
    }));
  }
}, 33); // 30 FPS</code></pre>
    </div>
  </div>

  <script>
    let localStream = null;
    let streamInterval = null;
    let ws = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function connectWs() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(\`\${proto}//\${location.host}\`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'frame' && msg.data) {
            document.getElementById('previewImg').src = msg.data;
          }
        } catch (err) {}
      };
      ws.onclose = () => setTimeout(connectWs, 2000);
    }
    connectWs();

    async function startWebcam() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        });
        const video = document.getElementById('webcam');
        video.srcObject = localStream;
        await video.play();

        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'inline-block';

        let broadcastWs = new WebSocket(\`\${location.protocol === 'https:' ? 'wss:' : 'ws:'}//\${location.host}\`);
        
        broadcastWs.onopen = () => {
          streamInterval = setInterval(() => {
            if (video.videoWidth > 0 && broadcastWs.readyState === WebSocket.OPEN) {
              canvas.width = 640;
              canvas.height = 360;
              ctx.drawImage(video, 0, 0, 640, 360);
              const frame = canvas.toDataURL('image/jpeg', 0.65);
              broadcastWs.send(JSON.stringify({
                type: 'frame',
                data: frame,
                timestamp: Date.now()
              }));
            }
          }, 33);
        };
      } catch (err) {
        alert('Could not access webcam: ' + err.message);
      }
    }

    function stopWebcam() {
      if (streamInterval) clearInterval(streamInterval);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
      document.getElementById('startBtn').style.display = 'inline-block';
      document.getElementById('stopBtn').style.display = 'none';
    }

    setInterval(async () => {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        document.getElementById('fpsStat').innerText = (data.fps || 0) + ' FPS';
      } catch (e) {}
    }, 1000);
  </script>
</body>
</html>`;
}
