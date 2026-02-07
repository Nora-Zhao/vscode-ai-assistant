import * as vscode from 'vscode';
import { ChatViewContext, MessageHandler } from '../types';
import { i18n } from '../../i18n';

/**
 * 配置处理器
 * 处理配置、模型切换、API Key等
 */
export class ConfigHandler implements MessageHandler {
  constructor(private ctx: ChatViewContext) {}

  async handle(data: any): Promise<boolean> {
    switch (data.type) {
      case 'getConfig':
        this.sendConfig();
        return true;
      case 'updateModel':
        await this.updateModel(data.provider, data.model);
        return true;
      case 'setApiKey':
        await this.setApiKey(data.provider, data.apiKey);
        return true;
      case 'getApiKeyStatus':
        await this.getApiKeyStatus();
        return true;
      case 'setLanguage':
        await this.setLanguage(data.language);
        return true;
      case 'getLanguage':
        this.sendLanguage();
        return true;
      case 'getHistory':
        this.sendMessageHistory(data.direction);
        return true;
      case 'getSuggestions':
        this.sendCommandSuggestions(data.input);
        return true;
      case 'searchMessages':
        this.searchMessages(data.query);
        return true;
      default:
        return false;
    }
  }

  /**
   * 发送配置
   */
  sendConfig(): void {
    const modelConfig = this.ctx.configManager.getModelConfig();
    const allModels = this.ctx.configManager.getAllModels();
    this.ctx.postMessage({
      type: 'config',
      modelConfig,
      allModels,
    });
  }

  /**
   * 更新模型
   */
  async updateModel(provider: string, model: string): Promise<void> {
    await this.ctx.configManager.updateModelConfig({ provider: provider as any, model });
    
    // 重新创建ChatService
    const config = await this.ctx.configManager.getFullModelConfig();
    if (config.apiKey) {
      const { ChatService } = await import('../../api/ChatService');
      this.ctx.chatService = new ChatService(config);
    }
    
    this.sendConfig();
    vscode.window.showInformationMessage(`已切换到模型: ${model}`);
  }

  /**
   * 设置API Key
   */
  async setApiKey(provider: string, apiKey: string): Promise<void> {
    await this.ctx.configManager.setApiKey(provider as any, apiKey);
    
    // 重新初始化ChatService
    const config = await this.ctx.configManager.getFullModelConfig();
    if (config.apiKey) {
      const { ChatService } = await import('../../api/ChatService');
      this.ctx.chatService = new ChatService(config);
    }
    
    await this.getApiKeyStatus();
    vscode.window.showInformationMessage(`${provider} API Key 已保存`);
  }

  /**
   * 获取API Key状态
   */
  async getApiKeyStatus(): Promise<void> {
    const providers = ['deepseek', 'openai', 'anthropic', 'kimi', 'openrouter'];
    const status: Record<string, boolean> = {};
    
    for (const provider of providers) {
      const key = await this.ctx.configManager.getApiKey(provider as any);
      status[provider] = !!key && key.length > 0;
    }
    
    this.ctx.postMessage({ type: 'apiKeyStatus', status });
  }

  /**
   * 设置语言
   */
  async setLanguage(language: string): Promise<void> {
    // 将 'en' 映射为 'en-US' 以兼容旧的调用
    const langCode = language === 'en' ? 'en-US' : language;
    i18n.setLanguage(langCode as 'zh-CN' | 'en-US');
    await this.ctx.extensionContext.globalState.update('aiAssistant.language', langCode);
    this.ctx.postMessage({ type: 'languageChanged', language: langCode });
    vscode.window.showInformationMessage(
      langCode === 'zh-CN' ? '语言已切换为中文' : 'Language switched to English'
    );
  }

  /**
   * 发送语言设置
   */
  sendLanguage(): void {
    const language = i18n.getCurrentLanguage();
    this.ctx.postMessage({ type: 'language', language });
  }

  /**
   * 发送消息历史（用于上下键浏览）
   */
  sendMessageHistory(direction: 'up' | 'down'): void {
    const history = this.ctx.messageHistory;
    
    if (history.length === 0) {
      this.ctx.postMessage({ type: 'historyItem', content: '' });
      return;
    }

    if (direction === 'up') {
      if (this.ctx.historyIndex < history.length - 1) {
        this.ctx.historyIndex++;
      }
    } else {
      if (this.ctx.historyIndex > -1) {
        this.ctx.historyIndex--;
      }
    }

    const content = this.ctx.historyIndex >= 0 
      ? history[history.length - 1 - this.ctx.historyIndex] 
      : '';
    
    this.ctx.postMessage({ type: 'historyItem', content });
  }

  /**
   * 发送命令建议
   */
  sendCommandSuggestions(input: string): void {
    if (!input.startsWith('/')) {
      this.ctx.postMessage({ type: 'suggestions', suggestions: [] });
      return;
    }

    const query = input.slice(1).toLowerCase();
    const commands = [
      { command: '/clear', description: '清空当前对话' },
      { command: '/init', description: '分析项目结构' },
      { command: '/diagram', description: '生成图表' },
      { command: '/gentest', description: '生成测试' },
      { command: '/run', description: '执行命令' },
      { command: '/search', description: '搜索代码' },
      { command: '/file', description: '读取文件' },
      { command: '/help', description: '显示帮助' },
      { command: '/gst', description: 'git status' },
      { command: '/gpl', description: 'git pull' },
      { command: '/gps', description: 'git push' },
      { command: '/gcm', description: 'git commit -m' },
    ];

    const suggestions = commands
      .filter(c => c.command.toLowerCase().includes(query))
      .slice(0, 5);

    this.ctx.postMessage({ type: 'suggestions', suggestions });
  }

  /**
   * 搜索消息
   */
  searchMessages(query: string): void {
    if (!query || query.trim().length === 0) {
      this.ctx.postMessage({ type: 'searchResults', results: [], query: '' });
      return;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    const session = this.ctx.sessionManager.currentSession;
    let results: Array<{
      id: string;
      role: string;
      preview: string;
      timestamp: number;
      sessionId?: string;
      sessionTitle?: string;
      score: number;
    }> = [];

    if (session) {
      const sessionResults = this.searchInSession(session, queryWords, normalizedQuery);
      results.push(...sessionResults);
    }

    // 搜索历史会话
    const sessionList = this.ctx.sessionManager.getSessionList();
    for (const sessionInfo of sessionList) {
      if (sessionInfo.id === session?.id) continue;
      
      const historicalSession = this.ctx.sessionManager.getSessionById(sessionInfo.id);
      if (historicalSession) {
        const sessionResults = this.searchInSession(
          historicalSession, 
          queryWords, 
          normalizedQuery, 
          sessionInfo.id, 
          sessionInfo.title
        );
        results.push(...sessionResults);
      }
    }

    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 50);

    const finalResults = results.map(({ score, ...rest }) => rest);
    this.ctx.postMessage({ type: 'searchResults', results: finalResults, query });
  }

  /**
   * 在单个会话中搜索消息
   */
  private searchInSession(
    session: any,
    queryWords: string[],
    normalizedQuery: string,
    sessionId?: string,
    sessionTitle?: string
  ): Array<{
    id: string;
    role: string;
    preview: string;
    timestamp: number;
    sessionId?: string;
    sessionTitle?: string;
    score: number;
  }> {
    const results: Array<{
      id: string;
      role: string;
      preview: string;
      timestamp: number;
      sessionId?: string;
      sessionTitle?: string;
      score: number;
    }> = [];

    for (const m of session.messages) {
      const contentLower = m.content.toLowerCase();
      
      let score = 0;
      let matchStart = -1;
      
      const exactMatchIndex = contentLower.indexOf(normalizedQuery);
      if (exactMatchIndex !== -1) {
        score += 10;
        matchStart = exactMatchIndex;
      }
      
      let wordMatches = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          wordMatches++;
          if (matchStart === -1) {
            matchStart = contentLower.indexOf(word);
          }
        }
      }
      
      if (wordMatches > 0) {
        score += wordMatches * 2;
        if (wordMatches === queryWords.length) {
          score += 5;
        }
      }

      if (score > 0) {
        results.push({
          id: m.id,
          role: m.role,
          preview: this.getSearchPreview(m.content, normalizedQuery, matchStart),
          timestamp: m.timestamp,
          sessionId,
          sessionTitle,
          score,
        });
      }
    }

    return results;
  }

  /**
   * 获取搜索预览
   */
  private getSearchPreview(content: string, query: string, matchStart: number): string {
    const maxLength = 120;
    
    if (matchStart >= 0) {
      const start = Math.max(0, matchStart - 30);
      const end = Math.min(content.length, start + maxLength);
      let preview = content.slice(start, end);
      if (start > 0) preview = '...' + preview;
      if (end < content.length) preview += '...';
      return preview;
    }
    
    return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
}
