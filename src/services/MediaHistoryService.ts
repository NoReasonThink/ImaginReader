import AsyncStorage from '@react-native-async-storage/async-storage';

export type MediaType = 'image' | 'video';
export type MediaStatus = 'pending' | 'completed' | 'failed';

export interface MediaItem {
  id: string;
  type: MediaType;
  status: MediaStatus;
  url?: string;
  prompt: string;
  timestamp: number;
  localPath?: string;
  thumbnail?: string;
  taskId?: string; // For tracking async tasks
}

const MEDIA_HISTORY_KEY = '@media_history';

export const MediaHistoryService = {
  getHistory: async (): Promise<MediaItem[]> => {
    try {
      const stored = await AsyncStorage.getItem(MEDIA_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load media history:', error);
      return [];
    }
  },

  addItem: async (item: Omit<MediaItem, 'id' | 'timestamp' | 'status'> & { status?: MediaStatus }): Promise<MediaItem> => {
    try {
      const newItem: MediaItem = {
        status: 'completed', // Default
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      const currentHistory = await MediaHistoryService.getHistory();
      const updatedHistory = [newItem, ...currentHistory];
      await AsyncStorage.setItem(MEDIA_HISTORY_KEY, JSON.stringify(updatedHistory));
      return newItem;
    } catch (error) {
      console.error('Failed to add media item:', error);
      throw error;
    }
  },

  updateItem: async (id: string, updates: Partial<MediaItem>): Promise<void> => {
    try {
      const currentHistory = await MediaHistoryService.getHistory();
      const updatedHistory = currentHistory.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      await AsyncStorage.setItem(MEDIA_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to update media item:', error);
      throw error;
    }
  },

  removeItem: async (id: string): Promise<void> => {
    try {
      const currentHistory = await MediaHistoryService.getHistory();
      const updatedHistory = currentHistory.filter(item => item.id !== id);
      await AsyncStorage.setItem(MEDIA_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove media item:', error);
      throw error;
    }
  },

  clearHistory: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(MEDIA_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear media history:', error);
      throw error;
    }
  },
};
