import { OpenAIAdapter } from './OpenAIAdapter';

export class KimiAdapter extends OpenAIAdapter {
  getEndpoint(): string {
    return 'https://api.moonshot.cn/v1/chat/completions';
  }
}

export class OpenRouterAdapter extends OpenAIAdapter {
  getEndpoint(): string {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }
}
