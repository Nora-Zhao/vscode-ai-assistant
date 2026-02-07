import * as vscode from 'vscode';
import { ModelConfig, Provider, AVAILABLE_MODELS } from '../types/shared';

export class ConfigManager {
  private context: vscode.ExtensionContext;
  private static readonly API_KEY_PREFIX = 'aiAssistant.apiKey.';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async getApiKey(provider: Provider): Promise<string | undefined> {
    return this.context.secrets.get(ConfigManager.API_KEY_PREFIX + provider);
  }

  async setApiKey(provider: Provider, apiKey: string): Promise<void> {
    if (apiKey) {
      await this.context.secrets.store(ConfigManager.API_KEY_PREFIX + provider, apiKey);
    } else {
      await this.context.secrets.delete(ConfigManager.API_KEY_PREFIX + provider);
    }
  }

  async hasAnyApiKey(): Promise<boolean> {
    const providers: Provider[] = ['deepseek', 'openai', 'anthropic', 'kimi', 'openrouter'];
    for (const provider of providers) {
      const key = await this.getApiKey(provider);
      if (key) return true;
    }
    return false;
  }

  /**
   * 获取所有API Key的状态（是否已保存及预览）
   */
  async getAllApiKeyStatus(): Promise<Record<string, { saved: boolean; preview: string }>> {
    const providers: Provider[] = ['deepseek', 'openai', 'anthropic', 'kimi', 'openrouter'];
    const status: Record<string, { saved: boolean; preview: string }> = {};
    
    for (const provider of providers) {
      const key = await this.getApiKey(provider);
      if (key) {
        // 显示前10个字符作为预览
        status[provider] = {
          saved: true,
          preview: key.slice(0, 10)
        };
      } else {
        status[provider] = {
          saved: false,
          preview: ''
        };
      }
    }
    
    return status;
  }

  getModelConfig(): ModelConfig {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      provider: config.get<Provider>('defaultProvider', 'deepseek'),
      model: config.get<string>('defaultModel', 'deepseek-chat'),
      temperature: config.get<number>('temperature', 0.7),
      maxTokens: config.get<number>('maxTokens', 8192),  // 提高默认值，避免测试代码截断
    };
  }

  async getFullModelConfig(): Promise<ModelConfig> {
    const config = this.getModelConfig();
    config.apiKey = await this.getApiKey(config.provider);
    return config;
  }

  async updateModelConfig(updates: Partial<ModelConfig>): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    if (updates.provider !== undefined) {
      await config.update('defaultProvider', updates.provider, vscode.ConfigurationTarget.Global);
    }
    if (updates.model !== undefined) {
      await config.update('defaultModel', updates.model, vscode.ConfigurationTarget.Global);
    }
    if (updates.temperature !== undefined) {
      await config.update('temperature', updates.temperature, vscode.ConfigurationTarget.Global);
    }
    if (updates.maxTokens !== undefined) {
      await config.update('maxTokens', updates.maxTokens, vscode.ConfigurationTarget.Global);
    }
  }

  getAvailableModels(provider: Provider) {
    return AVAILABLE_MODELS[provider] || [];
  }

  getAllModels() {
    return AVAILABLE_MODELS;
  }

  supportsVision(provider: Provider, model: string): boolean {
    const models = this.getAvailableModels(provider);
    const modelInfo = models.find((m) => m.id === model);
    return modelInfo?.supportVision ?? false;
  }

  getSessionConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      maxSessions: config.get<number>('sessionHistory.maxSessions', 50),
      autoSave: config.get<boolean>('sessionHistory.autoSave', true),
    };
  }

  getCompressionConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      enabled: config.get<boolean>('contextCompression.enabled', true),
      maxMessages: config.get<number>('contextCompression.maxMessages', 20),
    };
  }

  getDiagramConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      defaultFormat: config.get<'mermaid' | 'plantuml' | 'd2'>('diagram.defaultFormat', 'mermaid'),
    };
  }

  getVoiceConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      language: config.get<string>('voice.language', 'zh-CN'),
    };
  }

  getTestConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      framework: config.get<string>('testGenerator.framework', 'auto'),
    };
  }

  // ==================== V16 新功能配置 ====================

  /**
   * 获取语言配置
   */
  getLanguageConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      language: config.get<'zh-CN' | 'en-US'>('language', 'zh-CN'),
      autoDetect: config.get<boolean>('language.autoDetect', true),
    };
  }

  /**
   * 设置语言
   */
  async setLanguage(language: 'zh-CN' | 'en-US'): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    await config.update('language', language, vscode.ConfigurationTarget.Global);
  }

  /**
   * 获取并行任务配置
   */
  getParallelConfig() {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    return {
      maxConcurrency: config.get<number>('parallel.maxConcurrency', 3),
      stopOnError: config.get<boolean>('parallel.stopOnError', false),
    };
  }

  /**
   * 设置并行任务配置
   */
  async setParallelConfig(updates: { maxConcurrency?: number; stopOnError?: boolean }): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiAssistant');
    if (updates.maxConcurrency !== undefined) {
      await config.update('parallel.maxConcurrency', updates.maxConcurrency, vscode.ConfigurationTarget.Global);
    }
    if (updates.stopOnError !== undefined) {
      await config.update('parallel.stopOnError', updates.stopOnError, vscode.ConfigurationTarget.Global);
    }
  }
}
