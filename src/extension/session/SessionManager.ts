import * as vscode from 'vscode';
import {
  Session,
  SessionSummary,
  Message,
  generateId,
  estimateTokens,
  truncateText,
} from '../../types/shared';

const SESSIONS_KEY = 'aiAssistant.sessions';
const CURRENT_SESSION_KEY = 'aiAssistant.currentSessionId';

/**
 * 会话管理器
 * 负责会话的创建、保存、加载、压缩等操作
 */
export class SessionManager {
  private _context: vscode.ExtensionContext;
  private _currentSession: Session | null = null;
  private _messageHistory: string[] = []; // 用于↑↓翻历史

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  /**
   * 获取当前会话
   */
  get currentSession(): Session | null {
    return this._currentSession;
  }

  /**
   * 获取消息历史（用于↑↓翻历史）
   */
  get messageHistory(): string[] {
    return this._messageHistory;
  }

  /**
   * 创建新会话
   * ✅ 添加日志以便调试
   */
  createSession(title?: string): Session {
    const session: Session = {
      id: generateId(),
      title: title || `对话 ${new Date().toLocaleString('zh-CN')}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {},
    };
    this._currentSession = session;
    this._messageHistory = [];
    // 同步保存 sessionId（不等待完成，因为这个方法是同步的）
    this._context.globalState.update(CURRENT_SESSION_KEY, session.id);
    console.log('[SessionManager] New session created:', session.id);
    return session;
  }

  /**
   * 加载指定会话
   * ✅ 修复：添加详细日志
   */
  async loadSession(sessionId: string): Promise<Session | null> {
    console.log('[SessionManager] Loading session:', sessionId);
    const sessions = this._getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      this._currentSession = session;
      this._messageHistory = session.messages
        .filter(m => m.role === 'user')
        .map(m => m.content);
      await this._saveCurrentSessionId(session.id);
      console.log('[SessionManager] Session loaded successfully:', session.id, 'messages:', session.messages.length);
      return session;
    }
    console.log('[SessionManager] Session not found:', sessionId);
    return null;
  }

  /**
   * 继续上次对话 (-c 参数)
   * ✅ 修复：添加详细日志和错误处理
   */
  async continueLastSession(): Promise<Session | null> {
    try {
      const lastSessionId = this._context.globalState.get<string>(CURRENT_SESSION_KEY);
      console.log('[SessionManager] Attempting to continue last session, ID:', lastSessionId);
      
      if (lastSessionId) {
        const session = await this.loadSession(lastSessionId);
        if (session) {
          console.log('[SessionManager] Successfully loaded session:', session.id, 'with', session.messages.length, 'messages');
          return session;
        }
        console.log('[SessionManager] Failed to load session by ID, it may have been deleted');
      }
      
      // 如果没有上次会话ID或加载失败，尝试获取最近的会话
      const sessions = this._getAllSessions();
      console.log('[SessionManager] Total sessions in storage:', sessions.length);
      
      if (sessions.length > 0) {
        const sorted = sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        console.log('[SessionManager] Loading most recent session:', sorted[0].id);
        return this.loadSession(sorted[0].id);
      }
      
      console.log('[SessionManager] No sessions found in storage');
      return null;
    } catch (error) {
      console.error('[SessionManager] Error in continueLastSession:', error);
      return null;
    }
  }

  /**
   * 保存当前会话
   * ✅ 修复：确保每次保存都更新 currentSessionId
   * ✅ 修复：返回 Promise 以确保保存完成
   */
  async saveCurrentSession(): Promise<void> {
    if (!this._currentSession) {
      console.log('[SessionManager] No current session to save');
      return;
    }
    
    this._currentSession.updatedAt = Date.now();
    
    // 自动生成标题
    if (this._currentSession.messages.length > 0 && 
        this._currentSession.title.startsWith('对话 ')) {
      const firstUserMsg = this._currentSession.messages.find(m => m.role === 'user');
      if (firstUserMsg) {
        this._currentSession.title = truncateText(firstUserMsg.content, 30);
      }
    }
    
    const sessions = this._getAllSessions();
    const existingIndex = sessions.findIndex(s => s.id === this._currentSession!.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = this._currentSession;
    } else {
      sessions.push(this._currentSession);
    }
    
    // 限制会话数量
    const maxSessions = vscode.workspace.getConfiguration('aiAssistant')
      .get<number>('sessionHistory.maxSessions', 50);
    
    if (sessions.length > maxSessions) {
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      sessions.splice(maxSessions);
    }
    
    // ✅ 等待保存完成，确保状态一致
    await this._context.globalState.update(SESSIONS_KEY, sessions);
    await this._saveCurrentSessionId(this._currentSession.id);
    
    console.log('[SessionManager] Session saved:', this._currentSession.id, 'messages:', this._currentSession.messages.length);
  }

  /**
   * 添加消息到当前会话
   * ✅ 修复：改为异步方法以确保保存完成
   */
  async addMessage(message: Message): Promise<void> {
    if (!this._currentSession) {
      this.createSession();
    }
    
    this._currentSession!.messages.push(message);
    
    // 添加到历史（仅用户消息）
    if (message.role === 'user') {
      this._messageHistory.push(message.content);
    }
    
    // 检查是否需要自动压缩
    const compressionEnabled = vscode.workspace.getConfiguration('aiAssistant')
      .get<boolean>('contextCompression.enabled', true);
    const maxMessages = vscode.workspace.getConfiguration('aiAssistant')
      .get<number>('contextCompression.maxMessages', 20);
    
    if (compressionEnabled && this._currentSession!.messages.length > maxMessages) {
      // 标记需要压缩，但不立即执行（避免阻塞）
      vscode.commands.executeCommand('aiAssistant.compactContext');
    }
    
    await this.saveCurrentSession();
  }

  /**
   * 更新最后一条消息（用于流式响应）
   * ✅ 修复：改为异步方法，确保保存完成
   */
  async updateLastMessage(content: string, isComplete: boolean = false, forceSave: boolean = false): Promise<void> {
    if (!this._currentSession || this._currentSession.messages.length === 0) return;
    
    const lastMsg = this._currentSession.messages[this._currentSession.messages.length - 1];
    lastMsg.content = content;
    lastMsg.isStreaming = !isComplete;
    
    // ✅ 修复：等待保存完成，确保数据一致性
    if (isComplete || forceSave) {
      await this.saveCurrentSession();
    }
  }

  /**
   * 压缩上下文
   * 将历史消息压缩为摘要，只保留最近几条
   */
  async compactContext(generateSummary: (messages: Message[]) => Promise<string>): Promise<{
    originalCount: number;
    compressedCount: number;
    savedTokens: number;
  }> {
    if (!this._currentSession) {
      return { originalCount: 0, compressedCount: 0, savedTokens: 0 };
    }
    
    const keepRecent = vscode.workspace.getConfiguration('aiAssistant')
      .get<number>('contextCompression.keepRecent', 4);
    
    const messages = this._currentSession.messages;
    const originalCount = messages.length;
    
    if (originalCount <= keepRecent) {
      return { originalCount, compressedCount: originalCount, savedTokens: 0 };
    }
    
    // 计算原始 token 数
    const originalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    
    // 分离要压缩的消息和要保留的消息
    const toCompress = messages.slice(0, -keepRecent);
    const toKeep = messages.slice(-keepRecent);
    
    // 生成摘要
    const summary = await generateSummary(toCompress);
    
    // 创建摘要消息
    const summaryMessage: Message = {
      id: generateId(),
      role: 'system',
      content: `[对话摘要]\n${summary}\n\n---\n以上是之前对话的摘要，请基于此继续对话。`,
      timestamp: Date.now(),
    };
    
    // 更新会话
    this._currentSession.messages = [summaryMessage, ...toKeep];
    this._currentSession.metadata = {
      ...this._currentSession.metadata,
      summary,
    };
    
    // 计算压缩后 token 数
    const compressedTokens = this._currentSession.messages
      .reduce((sum, m) => sum + estimateTokens(m.content), 0);
    
    this.saveCurrentSession();
    
    return {
      originalCount,
      compressedCount: this._currentSession.messages.length,
      savedTokens: originalTokens - compressedTokens,
    };
  }

  /**
   * 清除当前会话消息
   */
  clearCurrentSession(): void {
    if (this._currentSession) {
      this._currentSession.messages = [];
      this._currentSession.updatedAt = Date.now();
      this.saveCurrentSession();
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    const sessions = this._getAllSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    this._context.globalState.update(SESSIONS_KEY, filtered);
    
    if (this._currentSession?.id === sessionId) {
      this._currentSession = null;
    }
  }

  /**
   * 重命名会话
   */
  renameSession(sessionId: string, newTitle: string): boolean {
    const sessions = this._getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      session.title = newTitle;
      session.updatedAt = Date.now();
      this._context.globalState.update(SESSIONS_KEY, sessions);
      
      // 如果是当前会话，也更新当前会话对象
      if (this._currentSession?.id === sessionId) {
        this._currentSession.title = newTitle;
      }
      return true;
    }
    return false;
  }

  /**
   * 获取所有会话摘要列表
   */
  getSessionList(): SessionSummary[] {
    const sessions = this._getAllSessions();
    return sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(s => ({
        id: s.id,
        title: s.title,
        preview: this._getSessionPreview(s),
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
  }

  /**
   * 获取消息历史（用于↑↓键）
   */
  getMessageHistory(): string[] {
    return [...this._messageHistory];
  }

  /**
   * 获取当前会话的消息列表
   */
  getMessages(): Message[] {
    return this._currentSession?.messages || [];
  }

  /**
   * 移除最后一条消息
   */
  removeLastMessage(): Message | null {
    if (!this._currentSession || this._currentSession.messages.length === 0) {
      return null;
    }
    
    const removedMessage = this._currentSession.messages.pop() || null;
    this.saveCurrentSession();
    return removedMessage;
  }

  /**
   * 通过ID移除消息
   */
  removeMessageById(messageId: string): Message | null {
    if (!this._currentSession) {
      return null;
    }
    
    const index = this._currentSession.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      return null;
    }
    
    const [removedMessage] = this._currentSession.messages.splice(index, 1);
    
    // 如果是用户消息，也从历史中移除
    if (removedMessage.role === 'user') {
      const historyIndex = this._messageHistory.findIndex(h => h === removedMessage.content);
      if (historyIndex !== -1) {
        this._messageHistory.splice(historyIndex, 1);
      }
    }
    
    this.saveCurrentSession();
    return removedMessage;
  }

  /**
   * 获取所有会话（完整对象）
   */
  getAllSessions(): Session[] {
    return this._getAllSessions();
  }

  /**
   * 根据ID获取会话（不加载为当前会话）
   */
  getSessionById(sessionId: string): Session | null {
    const sessions = this._getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  /**
   * 清理旧会话
   */
  cleanupOldSessions(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const sessions = this._getAllSessions();
    const cutoff = Date.now() - maxAge;
    const filtered = sessions.filter(s => s.updatedAt > cutoff);
    const removed = sessions.length - filtered.length;
    
    if (removed > 0) {
      this._context.globalState.update(SESSIONS_KEY, filtered);
    }
    
    return removed;
  }

  // ============================================
  // 私有方法
  // ============================================

  private _getAllSessions(): Session[] {
    return this._context.globalState.get<Session[]>(SESSIONS_KEY, []);
  }

  private async _saveCurrentSessionId(sessionId: string): Promise<void> {
    await this._context.globalState.update(CURRENT_SESSION_KEY, sessionId);
  }

  private _getSessionPreview(session: Session): string {
    const lastUserMsg = [...session.messages]
      .reverse()
      .find(m => m.role === 'user');
    
    if (lastUserMsg) {
      return truncateText(lastUserMsg.content, 50);
    }
    return '空对话';
  }
}
