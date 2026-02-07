import { Message, ModelConfig, Provider, AVAILABLE_MODELS } from '../../types/shared';
import { BaseAdapter, StreamCallback, RequestOptions } from './BaseAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { KimiAdapter, OpenRouterAdapter } from './OtherAdapters';

export class ChatService {
  private adapter: BaseAdapter | null = null;
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    this.createAdapter();
  }

  private createAdapter(): void {
    switch (this.config.provider) {
      case 'openai':
        this.adapter = new OpenAIAdapter(this.config);
        break;
      case 'deepseek':
        this.adapter = new DeepSeekAdapter(this.config);
        break;
      case 'anthropic':
        this.adapter = new AnthropicAdapter(this.config);
        break;
      case 'kimi':
        this.adapter = new KimiAdapter(this.config);
        break;
      case 'openrouter':
        this.adapter = new OpenRouterAdapter(this.config);
        break;
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  updateConfig(config: ModelConfig): void {
    this.config = config;
    this.createAdapter();
  }

  async sendMessage(messages: Message[], callbacks: StreamCallback, options?: RequestOptions): Promise<void> {
    if (!this.adapter) {
      throw new Error('No adapter configured');
    }
    if (!this.config.apiKey) {
      throw new Error('API Key not configured');
    }
    await this.adapter.sendMessage(messages, callbacks, options);
  }

  /**
   * 同步发送消息并等待完整响应
   * 用于Agent等需要完整响应的场景
   */
  async sendMessageSync(messages: Message[], options?: RequestOptions): Promise<string> {
    if (!this.adapter) {
      throw new Error('No adapter configured');
    }
    if (!this.config.apiKey) {
      throw new Error('API Key not configured');
    }

    let fullContent = '';
    
    await this.adapter.sendMessage(
      messages,
      {
        onToken: (token: string) => {
          fullContent += token;
        },
        onComplete: (content: string) => {
          fullContent = content;
        },
        onError: (error: Error) => {
          throw error;
        },
      },
      options
    );

    return fullContent;
  }

  /**
   * ✅ 新增：取消特定请求
   * @param requestId 请求ID，对应不同任务类型
   */
  cancelRequest(requestId: string): void {
    this.adapter?.cancelRequest(requestId);
  }

  /**
   * ✅ 取消所有请求（保留向后兼容）
   */
  cancel(): void {
    this.adapter?.cancel();
  }

  supportsVision(): boolean {
    const models = AVAILABLE_MODELS[this.config.provider];
    const model = models?.find((m) => m.id === this.config.model);
    return model?.supportVision ?? false;
  }

  getProvider(): Provider {
    return this.config.provider;
  }

  getModel(): string {
    return this.config.model;
  }
}
