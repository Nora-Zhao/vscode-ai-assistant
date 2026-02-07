import { Message } from '../../types/shared';
import { BaseAdapter, StreamCallback, RequestOptions } from './BaseAdapter';

export class AnthropicAdapter extends BaseAdapter {
  getEndpoint(): string {
    return 'https://api.anthropic.com/v1/messages';
  }

  async sendMessage(messages: Message[], callbacks: StreamCallback, options?: RequestOptions): Promise<void> {
    // ✅ 修复：使用 createAbortController 方法，支持 requestId 隔离
    const requestId = options?.requestId;
    const abortController = this.createAbortController(requestId);

    // Anthropic uses separate system parameter
    let systemPrompt = '';
    const formattedMessages: Array<{ role: string; content: any }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += (systemPrompt ? '\n' : '') + msg.content;
      } else {
        formattedMessages.push({
          role: msg.role,
          content: this.buildAnthropicContent(msg),
        });
      }
    }

    // 使用options中的值，否则使用config中的默认值
    const maxTokens = options?.maxTokens ?? this.config.maxTokens ?? 4096;

    try {
      const body: any = {
        model: this.config.model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        stream: true,
      };

      if (systemPrompt) {
        body.system = systemPrompt;
      }

      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: abortController.signal,  // ✅ 使用正确的 controller
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      // ✅ 传入 requestId 以便正确检查取消状态
      await this.handleAnthropicStream(response, callbacks, requestId);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        callbacks.onError(error);
      }
    } finally {
      // ✅ 清理请求
      this.cleanupRequest(requestId);
    }
  }

  private buildAnthropicContent(message: Message): any {
    if (!message.attachments || message.attachments.length === 0) {
      return message.content;
    }

    const content: any[] = [{ type: 'text', text: message.content }];

    for (const attachment of message.attachments) {
      if (attachment.type === 'image') {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: attachment.mimeType,
            data: attachment.data.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }
    }

    return content;
  }

  private async handleAnthropicStream(
    response: Response,
    callbacks: StreamCallback,
    requestId?: string  // ✅ 新增：传入 requestId
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    // ✅ 修复：存储 reader 以便取消时能主动中断
    if (requestId) {
      this.activeReaders.set(requestId, reader);
    } else {
      this.defaultReader = reader;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    // ✅ 获取正确的 AbortController
    const controller = requestId 
      ? this.abortControllers.get(requestId) 
      : this.defaultAbortController;

    try {
      while (true) {
        // ✅ 检查正确的 controller 是否已被取消
        if (controller?.signal.aborted) {
          try {
            reader.cancel();
          } catch (e) {}
          return; // 直接返回，不调用onComplete
        }

        const { done, value } = await reader.read();
        if (done) break;

        // ✅ 再次检查是否被取消（在读取后）
        if (controller?.signal.aborted) {
          try {
            reader.cancel();
          } catch (e) {}
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta') {
                const text = data.delta?.text || '';
                if (text) {
                  fullResponse += text;
                  callbacks.onToken(text);
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      callbacks.onComplete(fullResponse);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 被取消时不调用onComplete，直接返回
        return;
      } else {
        throw error;
      }
    } finally {
      // ✅ 清理 reader
      this.cleanupRequest(requestId);
    }
  }
}
