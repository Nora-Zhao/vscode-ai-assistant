import { Message } from '../../types/shared';
import { BaseAdapter, StreamCallback, RequestOptions } from './BaseAdapter';

export class OpenAIAdapter extends BaseAdapter {
  getEndpoint(): string {
    return 'https://api.openai.com/v1/chat/completions';
  }

  async sendMessage(messages: Message[], callbacks: StreamCallback, options?: RequestOptions): Promise<void> {
    // ✅ 修复：使用 createAbortController 方法，支持 requestId 隔离
    const requestId = options?.requestId;
    const abortController = this.createAbortController(requestId);
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: this.buildMessageContent(msg),
    }));

    // 使用options中的值，否则使用config中的默认值
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;
    const temperature = options?.temperature ?? this.config.temperature;

    try {
      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: formattedMessages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal: abortController.signal,  // ✅ 使用正确的 controller
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      // ✅ 传入 requestId 以便正确检查取消状态
      await this.handleSSEStream(response, callbacks, (data) => {
        return data.choices?.[0]?.delta?.content || null;
      }, requestId);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        callbacks.onError(error);
      }
    } finally {
      // ✅ 清理请求（如果 handleSSEStream 没有处理的话）
      this.cleanupRequest(requestId);
    }
  }
}
