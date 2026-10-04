import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToleranceConfig } from '../types/inspection';

const TOLERANCE_KEY = '@hawkeye_tolerance_config';
const STREAM_CONFIG_KEY = '@hawkeye_stream_config';

export type CameraMode = 'AUTO' | 'WEBCAM' | 'MOCK';

export type StreamConfig = {
  streamUrl: string;
  autoConnect: boolean;
  cameraMode: CameraMode;
};

export const DEFAULT_TOLERANCES: ToleranceConfig = {
  length: { nominal: 1000, tolerance: 5 }, // 1000 ± 5 mm
  width: { nominal: 120, tolerance: 1 },    // 120 ± 1 mm
  height: { nominal: 120, tolerance: 1 },   // 120 ± 1 mm
  ocrThreshold: 0.90,                       // 90% confidence threshold
  pixelsPerMm: 2.45,                        // calibration ratio
};

export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  streamUrl: 'ws://192.168.137.129:8080',
  autoConnect: false,
  cameraMode: 'MOCK',
};

export const settingsService = {
  async getTolerances(): Promise<ToleranceConfig> {
    try {
      const stored = await AsyncStorage.getItem(TOLERANCE_KEY);
      if (stored) {
        return { ...DEFAULT_TOLERANCES, ...JSON.parse(stored) };
      }
      return { ...DEFAULT_TOLERANCES };
    } catch {
      return { ...DEFAULT_TOLERANCES };
    }
  },

  async saveTolerances(config: ToleranceConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(TOLERANCE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist tolerances to storage:', e);
    }
  },

  async getStreamConfig(): Promise<StreamConfig> {
    try {
      const stored = await AsyncStorage.getItem(STREAM_CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_STREAM_CONFIG, ...JSON.parse(stored) };
      }
      return { ...DEFAULT_STREAM_CONFIG };
    } catch {
      return { ...DEFAULT_STREAM_CONFIG };
    }
  },

  async saveStreamConfig(config: StreamConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to persist stream config to storage:', e);
    }
  },
};
