import * as vscode from 'vscode';
import { ChatViewContext, MessageHandler } from '../types';
import { Message, generateId } from '../../../types/shared';

/**
 * 会话处理器
 * 处理会话相关的操作：创建、加载、删除、重命名等
 */
export class SessionHandler implements MessageHandler {
  constructor(private ctx: ChatViewContext) {}

  async handle(data: any): Promise<boolean> {
    switch (data.type) {
      case 'newChat':
        await this.createNewChat();
        return true;
      case 'clearChat':
        await this.clearChat();
        return true;
      case 'renameSession':
        this.renameSession(data.sessionId, data.newTitle);
        return true;
      case 'deleteSession':
        this.deleteSession(data.sessionId);
        return true;
      case 'getSessionList':
        this.sendSessionList();
        return true;
      case 'loadSession':
        await this.loadSession(data.sessionId);
        return true;
      case 'verifySessionState':
        await this.verifySessionState(data.sessionId);
        return true;
      default:
        return false;
    }
  }

  /**
   * 创建新会话
   */
  async createNewChat(): Promise<void> {
    const newSession = this.ctx.sessionManager.createSession();
    console.log('[SessionHandler] Created new chat session:', newSession.id);
    this.ctx.postMessage({
      type: 'chatCleared',
      sessionId: newSession.id,
    });
  }

  /**
   * 清空当前会话
   */
  async clearChat(): Promise<void> {
    await this.createNewChat();
  }

  /**
   * 重命名会话
   */
  renameSession(sessionId: string, newTitle: string): void {
    const success = this.ctx.sessionManager.renameSession(sessionId, newTitle);
    if (success) {
      this.sendSessionList();
      vscode.window.showInformationMessage(`会话已重命名为: ${newTitle}`);
    } else {
      vscode.window.showErrorMessage('重命名失败');
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    this.ctx.sessionManager.deleteSession(sessionId);
    this.sendSessionList();
    vscode.window.showInformationMessage('会话已删除');
  }

  /**
   * 发送会话列表
   */
  sendSessionList(): void {
    const sessions = this.ctx.sessionManager.getSessionList();
    this.ctx.postMessage({ type: 'sessionList', sessions });
  }

  /**
   * 加载会话
   */
  async loadSession(sessionId: string): Promise<void> {
    const session = await this.ctx.sessionManager.loadSession(sessionId);
    if (session) {
      this.ctx.postMessage({
        type: 'sessionLoaded',
        messages: session.messages || [],
        sessionId: session.id,
        sessionTitle: session.title,
      });
      vscode.window.showInformationMessage(`已切换到会话: ${session.title}`);
    } else {
      vscode.window.showErrorMessage('无法加载会话');
    }
  }

  /**
   * 验证会话状态
   * 处理前端和后端会话状态同步
   */
  async verifySessionState(requestedSessionId?: string): Promise<void> {
    console.log('[SessionHandler] Verifying session state, requested sessionId:', requestedSessionId);
    
    // 如果前端传来了特定的sessionId，优先尝试恢复该会话
    if (requestedSessionId) {
      const currentSession = this.ctx.sessionManager.currentSession;
      
      // 情况1：后端当前会话就是请求的会话 -> 直接返回
      if (currentSession && currentSession.id === requestedSessionId) {
        console.log('[SessionHandler] Session already matches, no action needed');
        return;
      }
      
      // 情况2：后端会话不匹配或丢失 -> 尝试从存储加载
      console.log('[SessionHandler] Loading requested session from storage:', requestedSessionId);
      const loaded = await this.ctx.sessionManager.loadSession(requestedSessionId);
      if (loaded) {
        console.log('[SessionHandler] Session restored successfully:', loaded.id, 'messages:', loaded.messages.length);
        this.ctx.postMessage({
          type: 'sessionLoaded',
          messages: loaded.messages || [],
          sessionId: loaded.id,
          sessionTitle: loaded.title,
        });
        return;
      }
      
      // 情况3：请求的会话不存在（可能被删除了）
      console.log('[SessionHandler] Requested session not found, trying last session...');
    }
    
    // 如果没有指定sessionId或加载失败，尝试恢复最后一个会话
    if (!this.ctx.sessionManager.currentSession) {
      console.log('[SessionHandler] No current session, restoring last session...');
      const restored = await this.ctx.sessionManager.continueLastSession();
      if (restored) {
        console.log('[SessionHandler] Last session restored:', restored.id);
        this.ctx.postMessage({
          type: 'sessionLoaded',
          messages: restored.messages || [],
          sessionId: restored.id,
          sessionTitle: restored.title,
        });
        return;
      }
      
      // 真的没有任何会话 -> 创建新会话
      console.log('[SessionHandler] No sessions available, creating new session');
      const newSession = this.ctx.sessionManager.createSession();
      this.ctx.postMessage({
        type: 'chatCleared',
        sessionId: newSession.id,
      });
    }
  }

  /**
   * 显示会话选择器
   */
  async showSessionPicker(): Promise<void> {
    const sessions = this.ctx.sessionManager.getSessionList();
    
    if (sessions.length === 0) {
      vscode.window.showInformationMessage('暂无会话历史');
      return;
    }
    
    const items: vscode.QuickPickItem[] = sessions.map(s => ({
      label: s.title,
      description: `${s.messageCount} 条消息`,
      detail: new Date(s.updatedAt).toLocaleString(),
      id: s.id,
    }));
    
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择一个会话恢复',
      matchOnDescription: true,
    });
    
    if (selected) {
      await this.loadSession((selected as any).id);
    }
  }

  /**
   * 继续上一个会话
   */
  async continueLastSession(): Promise<void> {
    await this.ctx.sessionManager.continueLastSession();
    this.sendCurrentState();
  }

  /**
   * 发送当前状态
   */
  sendCurrentState(): void {
    const session = this.ctx.sessionManager.currentSession;
    const modelConfig = this.ctx.configManager.getModelConfig();

    this.ctx.postMessage({
      type: 'init',
      messages: session?.messages || [],
      modelConfig,
      allModels: this.ctx.configManager.getAllModels(),
      sessionId: session?.id || null,
    });
  }

  /**
   * 发送当前状态（包括流式消息）
   */
  sendCurrentStateWithStreaming(): void {
    const session = this.ctx.sessionManager.currentSession;
    const modelConfig = this.ctx.configManager.getModelConfig();
    
    let messages = [...(session?.messages || [])];
    
    // 如果有正在进行的流式消息，确保使用最新内容
    if (this.ctx.currentStreamingMessage) {
      const streamingMsgId = this.ctx.currentStreamingMessage.id;
      const savedMsgIndex = messages.findIndex(m => m.id === streamingMsgId);
      
      if (savedMsgIndex !== -1) {
        messages[savedMsgIndex] = { ...this.ctx.currentStreamingMessage };
        console.log('[SessionHandler] Using latest streaming message content:', streamingMsgId);
      }
    }

    this.ctx.postMessage({
      type: 'init',
      messages,
      modelConfig,
      allModels: this.ctx.configManager.getAllModels(),
      sessionId: session?.id || null,
      isStreaming: this.ctx.isTaskRunning('chat') && !!this.ctx.currentStreamingMessage,
    });
    
    // 如果有正在进行的流式消息，继续发送流式更新
    if (this.ctx.isTaskRunning('chat') && this.ctx.currentStreamingMessage) {
      this.ctx.postMessage({
        type: 'resumeStreaming',
        messageId: this.ctx.currentStreamingMessage.id,
        content: this.ctx.currentStreamingMessage.content,
      });
    }
  }

  /**
   * 清空所有数据并重置状态
   */
  clearAllDataAndReset(): void {
    const newSession = this.ctx.sessionManager.createSession();
    this.ctx.postMessage({ 
      type: 'chatCleared',
      sessionId: newSession.id,
    });
    console.log('[SessionHandler] All data cleared, new session created:', newSession.id);
  }
}
