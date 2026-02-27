import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiConfig {
  apiKey: string;
  modelCode: string;
  apiUrl: string;
}

const SETTINGS_STORAGE_KEY = '@app_settings';

const DEFAULT_CONFIG: ApiConfig = {
  apiKey: '',
  modelCode: 'wan2.6-t2i',
  apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
};

export const SettingsService = {
  getApiConfig: async (): Promise<ApiConfig> => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        return { ...DEFAULT_CONFIG, ...parsedSettings };
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_CONFIG;
    }
  },

  saveApiConfig: async (config: ApiConfig): Promise<void> => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },
};
