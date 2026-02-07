import * as vscode from 'vscode';
import { ChatViewContext, MessageHandler, CodeActionContext } from '../types';
import { Message, generateId, Attachment } from '../../../types/shared';
import { ChatService } from '../../api/ChatService';
import { i18n } from '../../i18n';
import { MemoryManager } from '../../memory/MemoryManager';
import { IntentClassifier, IntentResult } from '../../agent/IntentClassifier';

/**
 * 聊天消息处理器
 * 
 * 核心改进：
 * 1. 集成 IntentClassifier 做意图识别，区分 chat / tool / command
 * 2. 精简记忆集成：只用 MemoryManager.buildContextString() 注入
 * 3. MCP/Skill 执行结果通过 chat 消息返回
 */
export class ChatMessageHandler implements MessageHandler {
  private memoryManager: MemoryManager;
  private intentClassifier: IntentClassifier;
  
  constructor(private ctx: ChatViewContext) {
    this.memoryManager = MemoryManager.getInstance(ctx.extensionContext);
    this.intentClassifier = new IntentClassifier();
  }

  async handle(data: any): Promise<boolean> {
    switch (data.type) {
      case 'sendMessage':
        await this.handleSendMessage(data.message, data.attachments);
        return true;
      case 'cancelRequest':
        await this.stopCurrentTask();
        return true;
      case 'regenerate':
        await this.handleRegenerate();
        return true;
      default:
        return false;
    }
  }

  /**
   * 处理发送消息 - 入口，做意图识别
   */
  async handleSendMessage(content: string, attachments?: Attachment[]): Promise<void> {
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // 历史记录
    if (content?.trim()) {
      this.ctx.messageHistory.push(content);
      if (this.ctx.messageHistory.length > 100) {
        this.ctx.messageHistory.shift();
      }
      this.ctx.historyIndex = -1;
    }

    // 如果正在处理中，先打断
    if (this.ctx.isTaskRunning('chat')) {
      await this.stopChatTask();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 解析输入（保持原有的命令/shell检测）
    const parsed = this.ctx.inputParser.parse(content);

    if (parsed.type === 'command') {
      const commandParsed = this.ctx.commandParser.parse(content);
      if (commandParsed) {
        return; // 命令由CommandHandler处理
      }
    }

    // ========== 意图识别 ==========
    const editor = vscode.window.activeTextEditor;
    const intentResult = this.intentClassifier.classify(content, {
      hasSelectedCode: editor ? !editor.selection.isEmpty : false,
      currentFile: editor?.document.fileName,
    });

    // 根据意图路由（仅在没有显式 @mcp/@skill 前缀时使用）
    // @mcp 和 @skill 由 ChatViewProvider._handleSendMessage 已经先拦截了
    // 这里处理的是自然语言输入的意图识别
    if (intentResult.type === 'skill' && intentResult.skillId) {
      // 意图识别判断需要调用技能时，提示用户或自动调用
      const hint = `💡 检测到你可能想使用技能 \`@skill:${intentResult.skillId}\`，正在为你调用...`;
      this.ctx.postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: hint,
          timestamp: Date.now(),
          metadata: { type: 'intent_hint' },
        },
      });
      // 这里不直接调用技能（避免循环），而是将意图信息传递给chat
      // 让AI在回复中建议使用技能或直接在prompt中引导
    }

    // 默认：发送给AI
    await this.sendAIRequest(content, attachments);
  }

  /**
   * 发送AI请求（集成简化记忆）
   */
  async sendAIRequest(
    content: string, 
    attachments?: Attachment[],
    options?: { skipUserMessage?: boolean; displayContent?: string }
  ): Promise<void> {
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: 'error',
        message: 'Please configure an API key first',
      });
      return;
    }

    this.ctx.updateTaskStatus('chat', 'running', '正在思考...');
    this.ctx.setProcessingContext(true);

    // 添加用户消息
    if (!options?.skipUserMessage) {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: options?.displayContent || content,
        timestamp: Date.now(),
        attachments,
      };
      await this.ctx.sessionManager.addMessage(userMessage);
      this.ctx.postMessage({ type: 'addMessage', message: userMessage });
      
      // 从用户消息中提取记忆
      this.memoryManager.extractFromMessage(userMessage);
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    
    this.ctx.currentStreamingMessage = assistantMessage;
    await this.ctx.sessionManager.addMessage(assistantMessage);
    
    let lastSaveTime = Date.now();
    const SAVE_INTERVAL = 1000;

    this.ctx.postMessage({ type: 'addMessage', message: assistantMessage, streaming: true });

    // 构建消息列表
    const messages = this.ctx.sessionManager.getMessages();
    const messagesForAI = messages.map((msg, index) => {
      if (index === messages.length - 1 && msg.role === 'user' && options?.displayContent) {
        return { ...msg, content };
      }
      return msg;
    });

    // 构建系统提示（含记忆上下文）
    const systemPromptBase = i18n.getAISystemPrompt('general');
    const languageInstruction = i18n.isChinese() 
      ? '\n\n=== 语言设置（最高优先级）===\n你必须使用简体中文回复所有内容。\n- 所有解释、说明必须用中文\n- 代码注释使用中文\n- 专业术语可保留英文但需附带中文解释\n- 绝对不要使用英文回复（除非是代码本身）'
      : '\n\n=== Language Setting (Highest Priority) ===\nYou MUST respond in English for all content.\n- All explanations must be in English\n- Code comments in English\n- Do not respond in Chinese';
    
    // 简化的记忆注入
    const memoryContext = this.memoryManager.buildContextString(content);
    
    const systemMessage: Message = {
      id: 'system-language',
      role: 'system' as const,
      content: systemPromptBase + memoryContext + languageInstruction,
      timestamp: Date.now(),
    };
    const messagesWithSystem = [systemMessage, ...messagesForAI];

    try {
      await chatService.sendMessage(messagesWithSystem, {
        onToken: async (token) => {
          assistantMessage.content += token;
          if (this.ctx.currentStreamingMessage) {
            this.ctx.currentStreamingMessage.content = assistantMessage.content;
          }
          this.ctx.postMessage({
            type: 'updateMessage',
            messageId: assistantMessage.id,
            content: assistantMessage.content,
          });
          
          const now = Date.now();
          if (now - lastSaveTime > SAVE_INTERVAL && assistantMessage.content.length > 0) {
            lastSaveTime = now;
            await this.ctx.sessionManager.updateLastMessage(assistantMessage.content, false, true);
          }
        },
        onComplete: async (fullResponse) => {
          assistantMessage.content = fullResponse;
          assistantMessage.isStreaming = false;
          this.ctx.currentStreamingMessage = null;
          
          await this.ctx.sessionManager.updateLastMessage(fullResponse, true);
          
          this.ctx.postMessage({
            type: 'completeMessage',
            messageId: assistantMessage.id,
            content: fullResponse,
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus('chat', 'success', '回复完成');
        },
        onError: (error) => {
          this.ctx.currentStreamingMessage = null;
          this.ctx.postMessage({
            type: 'error',
            message: error.message,
            messageId: assistantMessage.id,
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus('chat', 'error', error.message);
        },
      }, { requestId: 'chat' });
    } catch (error) {
      this.ctx.currentStreamingMessage = null;
      this.ctx.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      this.ctx.setProcessingContext(false);
      this.ctx.updateTaskStatus('chat', 'error', error instanceof Error ? error.message : '未知错误');
    }
  }

  /**
   * 处理重新生成
   */
  async handleRegenerate(): Promise<void> {
    const messages = this.ctx.sessionManager.getMessages();
    
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) {
      this.ctx.postMessage({ type: 'error', message: '没有可重新生成的消息' });
      return;
    }

    const lastUserMessage = messages[lastUserMessageIndex];

    for (let i = messages.length - 1; i > lastUserMessageIndex; i--) {
      this.ctx.postMessage({ type: 'removeMessage', messageId: messages[i].id });
    }
    
    while (this.ctx.sessionManager.getMessages().length > lastUserMessageIndex + 1) {
      await this.ctx.sessionManager.removeLastMessage();
    }

    await this.sendAIRequest(lastUserMessage.content, lastUserMessage.attachments, {
      skipUserMessage: true,
    });
  }

  /**
   * 停止所有正在运行的任务
   */
  async stopCurrentTask(): Promise<void> {
    let hasRunningTask = false;
    
    if (this.ctx.isTaskRunning('chat')) {
      hasRunningTask = true;
      await this.stopChatTaskInternal();
    }
    
    const otherTaskTypes: Array<'diagram' | 'test' | 'command' | 'skill'> = ['diagram', 'test', 'command', 'skill'];
    for (const taskType of otherTaskTypes) {
      if (this.ctx.isTaskRunning(taskType)) {
        hasRunningTask = true;
        this.ctx.updateTaskStatus(taskType, 'idle', '已取消');
      }
    }
    
    if (hasRunningTask && this.ctx.chatService) {
      this.ctx.chatService.cancel();
    }
    
    this.ctx.postMessage({ type: 'taskStopped' });
  }

  async stopChatTask(): Promise<void> {
    if (!this.ctx.isTaskRunning('chat')) {
      return;
    }
    await this.stopChatTaskInternal();
    
    if (this.ctx.chatService) {
      this.ctx.chatService.cancelRequest('chat');
    }
  }

  private async stopChatTaskInternal(): Promise<void> {
    if (this.ctx.currentStreamingMessage) {
      const hasContent = this.ctx.currentStreamingMessage.content.trim().length > 0;
      
      const session = this.ctx.sessionManager.currentSession;
      if (session) {
        const existingMsg = session.messages.find(m => m.id === this.ctx.currentStreamingMessage!.id);
        
        if (hasContent) {
          if (!existingMsg) {
            await this.ctx.sessionManager.addMessage(this.ctx.currentStreamingMessage);
          } else if (existingMsg.content !== this.ctx.currentStreamingMessage.content) {
            await this.ctx.sessionManager.updateLastMessage(this.ctx.currentStreamingMessage.content, true);
          }
        } else if (existingMsg) {
          const msgIndex = session.messages.findIndex(m => m.id === this.ctx.currentStreamingMessage!.id);
          if (msgIndex !== -1) {
            session.messages.splice(msgIndex, 1);
            await this.ctx.sessionManager.saveCurrentSession();
          }
        }
      }
      
      this.ctx.postMessage({
        type: 'completeMessage',
        messageId: this.ctx.currentStreamingMessage.id,
        content: this.ctx.currentStreamingMessage.content,
        interrupted: true,
      });
      
      this.ctx.currentStreamingMessage = null;
    }
    
    this.ctx.updateTaskStatus('chat', 'idle', '已停止');
    this.ctx.setProcessingContext(false);
  }

  /**
   * 发送带系统上下文的消息（用于代码操作）
   */
  async sendMessageWithContext(
    displayLabel: string, 
    systemContext: CodeActionContext
  ): Promise<void> {
    if (this.ctx.isTaskRunning('chat')) {
      await this.stopChatTask();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: 'error',
        message: '请先配置 API Key',
      });
      return;
    }

    this.ctx.updateTaskStatus('chat', 'running', `正在${displayLabel}...`);
    this.ctx.setProcessingContext(true);

    const codePreview = systemContext.code.length > 150 
      ? systemContext.code.slice(0, 150) + '...' 
      : systemContext.code;
    
    const displayMessage = `${displayLabel}\n\n\`\`\`${systemContext.language}\n${codePreview}\n\`\`\``;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: displayMessage,
      timestamp: Date.now(),
    };

    await this.ctx.sessionManager.addMessage(userMessage);
    this.ctx.postMessage({ type: 'addMessage', message: userMessage });

    const fullPrompt = this.buildCodeActionPrompt(systemContext);
    
    const messagesForAI = this.ctx.sessionManager.getMessages().map(msg => {
      if (msg.id === userMessage.id) {
        return { ...msg, content: fullPrompt };
      }
      return msg;
    });

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    await this.ctx.sessionManager.addMessage(assistantMessage);
    this.ctx.currentStreamingMessage = assistantMessage;
    
    let lastSaveTime = Date.now();
    const SAVE_INTERVAL = 1000;

    this.ctx.postMessage({ type: 'addMessage', message: assistantMessage, streaming: true });

    const systemPromptBase = i18n.getAISystemPrompt('code');
    const languageInstruction = i18n.isChinese() 
      ? '\n\n=== 语言设置（最高优先级）===\n你必须使用简体中文回复所有内容。'
      : '\n\n=== Language Setting (Highest Priority) ===\nYou MUST respond in English.';
    
    const memoryContext = this.memoryManager.buildContextString(displayLabel + ' ' + systemContext.code);
    
    const systemMessage: Message = {
      id: 'system-language',
      role: 'system' as const,
      content: systemPromptBase + memoryContext + languageInstruction,
      timestamp: Date.now(),
    };
    const messagesWithSystem = [systemMessage, ...messagesForAI];

    try {
      await chatService.sendMessage(messagesWithSystem, {
        onToken: (token) => {
          assistantMessage.content += token;
          if (this.ctx.currentStreamingMessage) {
            this.ctx.currentStreamingMessage.content = assistantMessage.content;
          }
          this.ctx.postMessage({
            type: 'updateMessage',
            messageId: assistantMessage.id,
            content: assistantMessage.content,
          });
          
          const now = Date.now();
          if (now - lastSaveTime > SAVE_INTERVAL && assistantMessage.content.length > 0) {
            lastSaveTime = now;
            this.ctx.sessionManager.updateLastMessage(assistantMessage.content, false, true);
          }
        },
        onComplete: async (fullResponse) => {
          assistantMessage.content = fullResponse;
          assistantMessage.isStreaming = false;
          this.ctx.currentStreamingMessage = null;
          this.ctx.sessionManager.updateLastMessage(fullResponse, true);
          
          this.ctx.postMessage({
            type: 'completeMessage',
            messageId: assistantMessage.id,
            content: fullResponse,
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus('chat', 'success', `${displayLabel}完成`);
        },
        onError: (error) => {
          this.ctx.currentStreamingMessage = null;
          this.ctx.postMessage({
            type: 'error',
            message: error.message,
          });
          this.ctx.setProcessingContext(false);
          this.ctx.updateTaskStatus('chat', 'error', error.message);
        },
      }, { requestId: 'chat' });
    } catch (error) {
      this.ctx.currentStreamingMessage = null;
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      this.ctx.postMessage({
        type: 'error',
        message: errorMsg,
      });
      this.ctx.setProcessingContext(false);
      this.ctx.updateTaskStatus('chat', 'error', errorMsg);
    }
  }

  private buildCodeActionPrompt(ctx: CodeActionContext): string {
    const isChinese = i18n.isChinese();
    
    let prompt = `${ctx.prompt}

**${isChinese ? '文件' : 'File'}:** \`${ctx.fileName}\`
**${isChinese ? '语言' : 'Language'}:** ${ctx.language}

\`\`\`${ctx.language}
${ctx.code}
\`\`\``;
    
    if (ctx.useSearchReplace) {
      if (isChinese) {
        prompt += `

**回复要求：**
1. 首先，简要分析代码存在的问题或可以改进的地方（2-4点）
2. 然后，说明你的修改思路
3. 最后，使用以下格式返回代码修改：

\`\`\`
<<<<<<< SEARCH
[要查找的原始代码]
=======
[替换后的新代码]
>>>>>>> REPLACE
\`\`\`

4. 在代码修改后，简要总结主要修改内容`;
      } else {
        prompt += `

**Response Requirements:**
1. First, briefly analyze the issues or improvements in the code
2. Then, explain your modification approach
3. Finally, use the SEARCH/REPLACE format to return code changes
4. After the code changes, briefly summarize the modifications`;
      }
    }
    
    return prompt;
  }
  
  getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  getIntentClassifier(): IntentClassifier {
    return this.intentClassifier;
  }
}
