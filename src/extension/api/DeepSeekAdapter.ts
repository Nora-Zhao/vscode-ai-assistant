import { OpenAIAdapter } from './OpenAIAdapter';

export class DeepSeekAdapter extends OpenAIAdapter {
  getEndpoint(): string {
    return 'https://api.deepseek.com/v1/chat/completions';
  }
}
