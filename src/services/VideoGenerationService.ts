import { SettingsService } from './SettingsService';
import { MediaHistoryService, MediaItem } from './MediaHistoryService';

const POLLING_INTERVAL = 5000; // 5 seconds

export const VideoGenerationService = {
  generateVideo: async (prompt: string): Promise<void> => {
    try {
      const config = await SettingsService.getApiConfig();
      const apiKey = config.videoApiKey || config.apiKey;
      
      if (!apiKey) {
        throw new Error('API Key not configured');
      }

      // 1. Submit Task
      const response = await fetch(config.videoApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: config.videoModelCode,
          input: {
            prompt: prompt,
          },
          parameters: {
            size: "1280*720", // Default size
            duration: 5,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.output || !data.output.task_id) {
        throw new Error(data.message || 'Failed to submit video task');
      }

      const taskId = data.output.task_id;

      // 2. Add to History
      const newItem = await MediaHistoryService.addItem({
        type: 'video',
        prompt: prompt,
        status: 'pending',
        taskId: taskId,
      });

      // 3. Start Polling
      VideoGenerationService.pollTask(newItem.id, taskId, apiKey);

    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  },

  pollTask: async (itemId: string, taskId: string, apiKey: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          await MediaHistoryService.updateItem(itemId, { status: 'failed' });
          return;
        }

        const taskStatus = data.output.task_status;

        if (taskStatus === 'SUCCEEDED') {
            // Find video url
            // Usually in output.video_url or output.results[0].url
            // For Wanxiang, it's typically output.video_url
            const videoUrl = data.output.video_url || (data.output.results && data.output.results[0] && data.output.results[0].url);
            
            if (videoUrl) {
                await MediaHistoryService.updateItem(itemId, { 
                    status: 'completed', 
                    url: videoUrl 
                });
            } else {
                await MediaHistoryService.updateItem(itemId, { status: 'failed' });
            }
        } else if (taskStatus === 'FAILED' || taskStatus === 'CANCELED') {
          await MediaHistoryService.updateItem(itemId, { status: 'failed' });
        } else {
          // PENDING or RUNNING
          setTimeout(checkStatus, POLLING_INTERVAL);
        }
      } catch (error) {
        console.error('Polling failed:', error);
        // Don't fail immediately on network error, retry
        setTimeout(checkStatus, POLLING_INTERVAL);
      }
    };

    setTimeout(checkStatus, POLLING_INTERVAL);
  },

  resumePendingTasks: async () => {
    const history = await MediaHistoryService.getHistory();
    const pendingItems = history.filter(item => item.status === 'pending' && item.type === 'video' && item.taskId);
    
    if (pendingItems.length === 0) return;

    const config = await SettingsService.getApiConfig();
    const apiKey = config.videoApiKey || config.apiKey;

    if (!apiKey) return;

    pendingItems.forEach(item => {
      if (item.taskId) {
        VideoGenerationService.pollTask(item.id, item.taskId, apiKey);
      }
    });
  }
};
