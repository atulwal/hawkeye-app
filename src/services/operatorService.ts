import AsyncStorage from '@react-native-async-storage/async-storage';

const OPERATOR_KEY = '@hawkeye_operator_name';
const DEFAULT_OPERATOR = 'Atulya';

export const operatorService = {
  async getOperatorName(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(OPERATOR_KEY);
      if (stored && stored.trim().length > 0) {
        return stored;
      }
      return DEFAULT_OPERATOR;
    } catch {
      return DEFAULT_OPERATOR;
    }
  },

  async setOperatorName(name: string): Promise<void> {
    try {
      const cleanName = name.trim() || DEFAULT_OPERATOR;
      await AsyncStorage.setItem(OPERATOR_KEY, cleanName);
    } catch (e) {
      console.warn('Failed to persist operator name to storage:', e);
    }
  },
};
