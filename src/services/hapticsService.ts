import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const hapticsService = {
  /**
   * Triggers error / notification haptic pulse only on FAIL events.
   * REWORK and PASS do not trigger alert haptics to avoid alarm fatigue.
   */
  async triggerFailHaptic(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics not supported on device/simulator - safely ignore
    }
  },

  async triggerLightFeedback(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Safely ignore
    }
  },
};
