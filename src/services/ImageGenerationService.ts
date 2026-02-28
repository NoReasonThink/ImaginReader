import { SettingsService } from './SettingsService';

export const generateImageFromText = async (text: string): Promise<string> => {
  const config = await SettingsService.getApiConfig();
  const { apiKey: DASHSCOPE_API_KEY, apiUrl, modelCode } = config;

  // 如果没有配置 API Key，则使用模拟数据
  if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('Using mock image generation service (No API Key provided)');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const seed = text.length + text.charCodeAt(0);
    return `https://picsum.photos/seed/${seed}/800/800`;
  }

  try {
    console.log(`Starting image generation with DashScope (${modelCode})...`);
    
    // 1. 提交生成任务 (Wan 2.6 支持同步调用)
    const submitResponse = await fetch(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          // Wan 2.6 默认为同步调用，不需要 X-DashScope-Async 头
        },
        body: JSON.stringify({
          model: modelCode,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    text: text
                  }
                ]
              }
            ]
          },
          parameters: {
            size: '1024*1024',
            n: 1,
          },
        }),
      }
    );

    const submitData = await submitResponse.json();

    if (!submitResponse.ok) {
      throw new Error(`Generation failed: ${JSON.stringify(submitData)}`);
    }

    // Wan 2.6 同步调用直接返回结果
    if (submitData.output && submitData.output.choices && submitData.output.choices.length > 0) {
       const firstChoice = submitData.output.choices[0];
       if (firstChoice.message && firstChoice.message.content && firstChoice.message.content.length > 0) {
         const content = firstChoice.message.content[0];
         // 检查 image 字段 (Wan 2.6 返回格式)
         if (content.image) {
            return content.image;
         }
         // 检查 img_url 字段 (可能的备用格式)
         if (content.img_url) {
            return content.img_url;
         }
       }
    }
    
    // 兼容旧的或异步返回 (如果有 task_id)
    if (submitData.output && submitData.output.task_id) {
       console.log(`Async task started. Task ID: ${submitData.output.task_id}`);
       return await pollTaskResult(submitData.output.task_id, DASHSCOPE_API_KEY);
    }
    
    // 尝试读取 output.results (Wan 2.5 风格)
    if (submitData.output && submitData.output.results && submitData.output.results.length > 0) {
        return submitData.output.results[0].url;
    }

    throw new Error(`No image URL found in response: ${JSON.stringify(submitData)}`);

  } catch (error) {
    console.error('Image generation error:', error);
    // 出错时回退到 Mock，或者抛出错误让 UI 处理
    // 这里为了演示稳定性，如果出错可以回退到 Mock，但为了让用户知道配置可能有误，最好抛出
    throw error;
  }
};

// 轮询任务结果
const pollTaskResult = async (taskId: string, apiKey: string): Promise<string> => {
  const maxRetries = 30; // 最大轮询次数 (30 * 2s = 60s timeout)
  const interval = 2000; // 2秒轮询一次

  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Polling failed: ${JSON.stringify(data)}`);
    }

    const status = data.output.task_status;
    console.log(`Polling task ${taskId}: ${status}`);

    if (status === 'SUCCEEDED') {
      if (data.output.results && data.output.results.length > 0) {
        return data.output.results[0].url;
      }
      throw new Error('Task succeeded but no results found');
    } else if (status === 'FAILED' || status === 'CANCELED') {
      throw new Error(`Task failed with status: ${status}, code: ${data.output.code}, message: ${data.output.message}`);
    }
    
    // 如果是 PENDING 或 RUNNING，继续循环
  }

  throw new Error('Image generation timed out');
};

