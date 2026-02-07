import * as vscode from 'vscode';
import { Message, generateId } from '../../types/shared';
import { ChatService } from '../api/ChatService';
import { ConfigManager } from '../ConfigManager';
import { SessionManager } from '../session/SessionManager';
import { CommandParser } from '../commands/CommandParser';
import { DiagramGenerator } from '../diagram/DiagramGenerator';
import { TestGenerator } from '../test-generator/TestGenerator';
import { AutoFixService } from '../services/AutoFixService';
import { EnhancedProjectAnalyzer } from '../analyzer/EnhancedProjectAnalyzer';
import { SmartInputParser } from '../commands/SmartInputParser';
import { 
  ChatViewContext, 
  TaskType, 
  TaskStatus, 
  TaskState,
  CodeActionContext 
} from './types';
import { TaskStateManager } from './utils/TaskStateManager';
import {
  SessionHandler,
  ChatMessageHandler,
  DiagramHandler,
  TestHandler,
  CommandHandler,
  ConfigHandler,
  MCPHandler,
} from './handlers';
import { MCPParser } from '../mcp';
import { SkillManager } from '../skills/package/SkillManager';
import { SkillExecutor } from '../skills/package/SkillExecutor';

/**
 * Skill执行结果类型
 */
interface SkillExecutionResult {
  id: string;
  skillId: string;
  skillName: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  logs: Array<{ level: string; message: string; timestamp: number }>;
  mcpCalls: Array<{ toolId: string; params: any; result: any }>;
}

/**
 * ChatViewProvider - 主类 (修改版)
 * 
 * 修改点：
 * 1. Skill执行结果通过独立通道返回，不混入chat
 * 2. 集成SkillManager和SkillExecutor
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiAssistant.chatView';

  private _view?: vscode.WebviewView;
  private _chatService?: ChatService;
  
  // 服务实例
  private _configManager: ConfigManager;
  private _sessionManager: SessionManager;
  private _commandParser: CommandParser;
  private _diagramGenerator: DiagramGenerator;
  private _testGenerator: TestGenerator;
  private _autoFixService: AutoFixService;
  private _projectAnalyzer: EnhancedProjectAnalyzer;
  private _inputParser: SmartInputParser;
  
  // [新增] Skill相关
  private _skillManager: SkillManager | null;
  private _skillExecutor: SkillExecutor;
  
  // 状态管理
  private _taskStateManager: TaskStateManager;
  private _currentStreamingMessage: Message | null = null;
  private _messageHistory: string[] = [];
  private _historyIndex = -1;
  private _projectContext?: string;
  private _lastGeneratedDiagram?: any;
  private _lastGeneratedTest?: any;
  
  // 处理器实例
  private _sessionHandler!: SessionHandler;
  private _chatMessageHandler!: ChatMessageHandler;
  private _diagramHandler!: DiagramHandler;
  private _testHandler!: TestHandler;
  private _commandHandler!: CommandHandler;
  private _configHandler!: ConfigHandler;
  private _mcpHandler!: MCPHandler;
  
  // 防止监听器重复注册
  private _visibilityListenerRegistered = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    // 初始化服务
    this._configManager = new ConfigManager(_context);
    this._sessionManager = new SessionManager(_context);
    this._commandParser = new CommandParser();
    this._diagramGenerator = new DiagramGenerator(_context);
    this._testGenerator = new TestGenerator(_context);
    this._autoFixService = new AutoFixService(_context);
    this._projectAnalyzer = new EnhancedProjectAnalyzer();
    this._inputParser = new SmartInputParser();
    
    // [修改] Skill组件将在MCPHandler初始化后延迟初始化
    // 因为SkillManager需要MCPRegistry和MCPExecutor
    this._skillManager = null as any;
    this._skillExecutor = SkillExecutor.getInstance(_context);
    
    // 初始化任务状态管理器
    this._taskStateManager = new TaskStateManager((msg) => this._postMessage(msg));
  }

  /**
   * 创建共享上下文
   */
  private _createContext(): ChatViewContext {
    return {
      extensionUri: this._extensionUri,
      extensionContext: this._context,
      view: this._view,
      
      chatService: this._chatService,
      configManager: this._configManager,
      sessionManager: this._sessionManager,
      diagramGenerator: this._diagramGenerator,
      testGenerator: this._testGenerator,
      autoFixService: this._autoFixService,
      projectAnalyzer: this._projectAnalyzer,
      inputParser: this._inputParser,
      commandParser: this._commandParser,
      
      taskStates: this._taskStateManager.getTaskStates(),
      currentStreamingMessage: this._currentStreamingMessage,
      messageHistory: this._messageHistory,
      historyIndex: this._historyIndex,
      projectContext: this._projectContext,
      lastGeneratedDiagram: this._lastGeneratedDiagram,
      lastGeneratedTest: this._lastGeneratedTest,
      
      postMessage: (msg) => this._postMessage(msg),
      updateTaskStatus: (type, status, msg) => this._taskStateManager.updateStatus(type, status, msg),
      isTaskRunning: (type) => this._taskStateManager.isRunning(type),
      setProcessingContext: (processing) => this._setProcessingContext(processing),
      ensureChatService: () => this._ensureChatService(),
    };
  }

  /**
   * 初始化处理器
   */
  private _initializeHandlers(): void {
    const ctx = this._createContext();
    
    // 创建处理器时，使用getter来获取最新的上下文值
    const createDynamicContext = (): ChatViewContext => ({
      ...ctx,
      view: this._view,
      chatService: this._chatService,
      currentStreamingMessage: this._currentStreamingMessage,
      messageHistory: this._messageHistory,
      historyIndex: this._historyIndex,
      projectContext: this._projectContext,
      lastGeneratedDiagram: this._lastGeneratedDiagram,
      lastGeneratedTest: this._lastGeneratedTest,
    });
    
    // 使用Proxy来动态获取上下文
    const dynamicCtx = new Proxy({} as ChatViewContext, {
      get: (_, prop) => {
        const currentCtx = createDynamicContext();
        const value = (currentCtx as any)[prop];
        
        // 特殊处理：更新共享状态
        if (prop === 'currentStreamingMessage') {
          return this._currentStreamingMessage;
        }
        if (prop === 'historyIndex') {
          return this._historyIndex;
        }
        
        return value;
      },
      set: (_, prop, value) => {
        // 允许Handler更新共享状态
        if (prop === 'currentStreamingMessage') {
          this._currentStreamingMessage = value;
          return true;
        }
        if (prop === 'historyIndex') {
          this._historyIndex = value;
          return true;
        }
        if (prop === 'projectContext') {
          this._projectContext = value;
          return true;
        }
        if (prop === 'lastGeneratedDiagram') {
          this._lastGeneratedDiagram = value;
          return true;
        }
        if (prop === 'lastGeneratedTest') {
          this._lastGeneratedTest = value;
          return true;
        }
        if (prop === 'chatService') {
          this._chatService = value;
          return true;
        }
        return false;
      }
    });
    
    this._sessionHandler = new SessionHandler(dynamicCtx);
    this._chatMessageHandler = new ChatMessageHandler(dynamicCtx);
    this._diagramHandler = new DiagramHandler(dynamicCtx);
    this._testHandler = new TestHandler(dynamicCtx);
    this._commandHandler = new CommandHandler(dynamicCtx);
    this._configHandler = new ConfigHandler(dynamicCtx);
    this._mcpHandler = new MCPHandler(dynamicCtx);
    
    // [修改] MCPHandler初始化后，用其Registry和Executor初始化SkillManager
    try {
      const registry = this._mcpHandler.getRegistry();
      const executor = this._mcpHandler.getExecutor();
      this._skillManager = SkillManager.getInstance(this._context, registry, executor);
      // 初始化内置skill包并注册管理命令
      this._skillManager.initialize().then(() => {
        console.log('[ChatViewProvider] SkillManager初始化完成');
      }).catch(e => console.error('[SkillManager] 初始化失败:', e));
      this._skillManager.registerCommands(this._context);
    } catch (err) {
      console.error('[ChatViewProvider] SkillManager初始化失败:', err);
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.title = 'AI Chat';
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 初始化ChatService
    const config = await this._configManager.getFullModelConfig();
    if (config.apiKey) {
      this._chatService = new ChatService(config);
    }

    // 初始化处理器
    this._initializeHandlers();

    // 加载或创建会话
    if (!this._sessionManager.currentSession) {
      await this._sessionManager.continueLastSession();
    }
    if (!this._sessionManager.currentSession) {
      this._sessionManager.createSession();
    }

    // 消息处理
    webviewView.webview.onDidReceiveMessage(async (data: { type: string; [key: string]: any }) => {
      await this._handleMessage(data);
    });

    // 监听可见性变化
    if (!this._visibilityListenerRegistered) {
      this._visibilityListenerRegistered = true;
      webviewView.onDidChangeVisibility(async () => {
        if (webviewView.visible) {
          this._sessionHandler.sendCurrentStateWithStreaming();
        }
      });
    }

    // 发送初始状态
    this._sessionHandler.sendCurrentStateWithStreaming();
  }

  /**
   * 消息路由
   */
  private async _handleMessage(data: any): Promise<void> {
    // 尝试各个处理器
    
    // 会话相关
    if (await this._sessionHandler.handle(data)) return;
    
    // 配置相关
    if (await this._configHandler.handle(data)) return;
    
    // MCP相关
    if (await this._mcpHandler.handle(data)) return;
    
    // 图表相关
    if (await this._diagramHandler.handle(data)) return;
    
    // 测试相关
    if (await this._testHandler.handle(data)) return;
    
    // 聊天消息相关
    if (data.type === 'sendMessage') {
      await this._handleSendMessage(data.message, data.attachments);
      return;
    }
    if (await this._chatMessageHandler.handle(data)) return;
    
    // 代码操作相关
    if (data.type === 'saveCodeToFile') {
      await this._saveCodeToFile(data.code, data.filename, data.language);
      return;
    }
    if (data.type === 'insertCode') {
      await this._insertCodeToEditor(data.code);
      return;
    }
    if (data.type === 'replaceCode') {
      await this._replaceCodeInEditor(data.original, data.replacement);
      return;
    }
    
    // [修改] Agent技能相关 - 通过独立通道处理
    if (data.type === 'executeSkill') {
      await this._executeSkillDirect(data.skillId, data.params);
      return;
    }
    if (data.type === 'getAvailableSkills') {
      await this._getAvailableSkills();
      return;
    }
    if (data.type === 'cancelSkill') {
      this._cancelSkill(data.skillId);
      return;
    }
    
    // Skill管理操作
    if (data.type === 'skill:enable') {
      await this._handleSkillEnable(data.skillId);
      return;
    }
    if (data.type === 'skill:disable') {
      await this._handleSkillDisable(data.skillId);
      return;
    }
    if (data.type === 'skill:uninstall') {
      await this._handleSkillUninstall(data.skillId);
      return;
    }
    if (data.type === 'skill:installFromUrl') {
      await this._handleSkillInstallFromUrl(data.url);
      return;
    }
    if (data.type === 'skill:openInstallDialog') {
      vscode.commands.executeCommand('aiAssistant.skill.install');
      return;
    }
    if (data.type === 'skill:openCreateDialog') {
      vscode.commands.executeCommand('aiAssistant.skill.create');
      return;
    }

    console.warn('[ChatViewProvider] Unhandled message type:', data.type);
  }

  /**
   * 处理发送消息 - 集成意图识别
   * 
   * 路由优先级:
   * 1. 显式前缀 @mcp:xxx / @skill:xxx → 直接路由到对应处理器
   * 2. 斜杠命令 /xxx → CommandHandler
   * 3. 自然语言输入 → IntentClassifier 判断是 chat 还是需要调用工具
   */
  private async _handleSendMessage(content: string, attachments?: any[]): Promise<void> {
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    // 添加到历史记录
    if (content?.trim()) {
      this._messageHistory.push(content);
      if (this._messageHistory.length > 100) {
        this._messageHistory.shift();
      }
      this._historyIndex = -1;
    }

    // === 1. 显式前缀路由 ===
    
    // @mcp 指令
    if (MCPParser.isMCPCommand(content)) {
      const handled = await this._mcpHandler.handleMCPCommand(content);
      if (handled) return;
    }
    
    // @skill 指令
    if (this._isSkillCommand(content)) {
      await this._handleSkillCommand(content);
      return;
    }

    // === 2. 斜杠命令 ===
    const parsed = this._inputParser.parse(content);
    if (parsed.type === 'command') {
      const commandParsed = this._commandParser.parse(content);
      if (commandParsed) {
        await this._commandHandler.executeCommand(
          commandParsed, 
          this._diagramHandler, 
          this._testHandler, 
          this._sessionHandler
        );
        return;
      }
    }

    // === 3. 自然语言意图识别 ===
    // IntentClassifier 在 ChatMessageHandler.handleSendMessage 中已集成
    // 它会判断是纯 chat 还是需要提示用户使用工具
    await this._chatMessageHandler.handleSendMessage(content, attachments);
  }
  
  /**
   * 检查是否是Skill命令
   */
  private _isSkillCommand(input: string): boolean {
    return input.trim().toLowerCase().startsWith('@skill');
  }
  
  /**
   * [修改] 处理Skill命令 - 结果通过独立通道返回
   */
  private async _handleSkillCommand(input: string): Promise<void> {
    const trimmed = input.trim();
    
    // 解析skill命令
    const match = trimmed.match(/^@skill:?(\w+[-\w]*)?(?:\s+(.*))?$/i);
    
    // 添加用户消息（仅显示用户输入）
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    await this._sessionManager.addMessage(userMessage);
    this._postMessage({ type: 'addMessage', message: userMessage });
    
    if (!match) {
      // 显示skill帮助
      this._postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: this._getSkillHelpText(),
          timestamp: Date.now(),
        }
      });
      return;
    }
    
    const skillId = match[1];
    const params = match[2];
    
    if (!skillId) {
      // 显示skill帮助
      this._postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: this._getSkillHelpText(),
          timestamp: Date.now(),
        }
      });
      return;
    }
    
    // 特殊命令
    if (skillId.toLowerCase() === 'list') {
      await this._showSkillList();
      return;
    }
    
    // [修改] 直接执行skill，结果通过独立通道返回
    await this._executeSkillDirect(skillId, params ? { input: params } : undefined);
  }
  
  /**
   * 直接执行Skill - 脚本执行，不调用LLM
   */
  private async _executeSkillDirect(skillId: string, params?: Record<string, any>): Promise<void> {
    this._taskStateManager.updateStatus('skill', 'running', `执行技能: ${skillId}`);
    
    // 发送执行开始通知
    this._postMessage({
      type: 'skill:executionStart',
      skillId,
      params,
    });
    
    const startTime = Date.now();
    
    try {
      // 检查SkillManager是否已初始化
      if (!this._skillManager) {
        throw new Error('SkillManager未初始化，请检查MCP配置');
      }
      
      const skill = this._skillManager.getSkill(skillId);
      
      if (!skill) {
        // Skill未安装 - 返回提示信息，不调用LLM
        const duration = Date.now() - startTime;
        const errorMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ 技能 \`${skillId}\` 未安装。\n\n请使用 \`@skill:list\` 查看可用技能，或通过Skill包管理安装:\n- 本地安装: 将skill包放入 skills 目录\n- Git安装: 提供skill包的Git仓库地址`,
          timestamp: Date.now(),
        };
        
        await this._sessionManager.addMessage(errorMsg);
        this._postMessage({ type: 'addMessage', message: errorMsg });
        this._taskStateManager.updateStatus('skill', 'error', `技能 ${skillId} 未安装`);
        return;
      }
      
      const editor = vscode.window.activeTextEditor;
      const workspaceContext = {
        workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        activeFile: editor?.document.fileName,
        selectedCode: editor?.selection.isEmpty ? undefined : editor?.document.getText(editor.selection),
      };
      
      // 直接执行skill脚本
      const result = await this._skillExecutor.execute(skill, params, workspaceContext);
      const duration = Date.now() - startTime;
      
      // 通过独立通道发送结果（供面板使用）
      const executionResult: SkillExecutionResult = {
        id: generateId(),
        skillId,
        skillName: skill.manifest.name,
        success: result.success,
        output: result.output,
        error: result.error,
        duration,
        logs: result.logs || [],
        mcpCalls: result.mcpCalls || [],
      };
      
      this._postMessage({
        type: 'skill:executionResult',
        result: executionResult,
      });
      
      // 将结果作为chat消息返回
      let chatContent: string;
      if (result.success) {
        const outputStr = result.output != null
          ? (typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2))
          : '(执行完成，无输出)';
        const truncated = outputStr.length > 3000 ? outputStr.slice(0, 3000) + '\n...(已截断)' : outputStr;
        
        chatContent = `✅ **${skill.manifest.name}** 执行完成 (${duration}ms)\n\n`;
        chatContent += `\`\`\`\n${truncated}\n\`\`\``;
        
        // 如果有日志，折叠展示
        if (result.logs && result.logs.length > 0) {
          chatContent += `\n\n<details>\n<summary>📋 执行日志 (${result.logs.length}条)</summary>\n\n`;
          for (const log of result.logs) {
            const icon = log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : 'ℹ️';
            chatContent += `${icon} ${log.message}\n`;
          }
          chatContent += `\n</details>`;
        }
      } else {
        chatContent = `❌ **${skill.manifest.name}** 执行失败 (${duration}ms)\n\n${result.error}`;
      }
      
      const resultMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: chatContent,
        timestamp: Date.now(),
        metadata: {
          type: 'skill_result',
          skillId,
          resultId: executionResult.id,
        },
      };
      
      await this._sessionManager.addMessage(resultMessage);
      this._postMessage({ type: 'addMessage', message: resultMessage });
      
      this._taskStateManager.updateStatus('skill', result.success ? 'success' : 'error', 
        result.success ? '技能执行完成' : result.error || '执行失败');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const duration = Date.now() - startTime;
      
      this._postMessage({
        type: 'skill:executionError',
        skillId,
        error: errorMessage,
        duration,
      });
      
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `❌ 技能 \`${skillId}\` 执行失败 (${duration}ms): ${errorMessage}`,
        timestamp: Date.now(),
      };
      
      await this._sessionManager.addMessage(errorMsg);
      this._postMessage({ type: 'addMessage', message: errorMsg });
      
      this._taskStateManager.updateStatus('skill', 'error', errorMessage);
    }
  }
  
  /**
   * [新增] 获取可用技能列表
   */
  private async _getAvailableSkills(): Promise<void> {
    const allSkills: Array<{ id: string; name: string; desc: string; type: string; version?: string; status?: string }> = [];
    
    if (this._skillManager) {
      const installed = this._skillManager.getInstalledSkills();
      for (const s of installed) {
        allSkills.push({
          id: s.manifest.id,
          name: s.manifest.name,
          desc: s.manifest.description,
          type: s.installedAt === 0 ? 'builtin' : 'installed',
          version: s.manifest.version,
          status: s.status,
        });
      }
    }
    
    this._postMessage({
      type: 'skill:availableSkills',
      skills: allSkills,
    });
  }
  
  /**
   * [新增] 取消技能执行
   */
  private _cancelSkill(skillId: string): void {
    const cancelled = this._skillExecutor.cancel(skillId);
    
    this._postMessage({
      type: 'skill:cancelled',
      skillId,
      success: cancelled,
    });
    
    if (cancelled) {
      this._taskStateManager.updateStatus('skill', 'idle', '已取消');
    }
  }

  // ========== Skill管理操作 ==========

  private async _handleSkillEnable(skillId: string): Promise<void> {
    if (!this._skillManager) return;
    const result = await this._skillManager.enable(skillId);
    this._postMessage({
      type: 'skill:operationResult',
      operation: 'enable',
      skillId,
      success: result.success,
      error: result.error,
    });
    if (result.success) {
      await this._getAvailableSkills(); // 刷新技能列表
    }
  }

  private async _handleSkillDisable(skillId: string): Promise<void> {
    if (!this._skillManager) return;
    const result = await this._skillManager.disable(skillId);
    this._postMessage({
      type: 'skill:operationResult',
      operation: 'disable',
      skillId,
      success: result.success,
      error: result.error,
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }

  private async _handleSkillUninstall(skillId: string): Promise<void> {
    if (!this._skillManager) return;
    const result = await this._skillManager.uninstall(skillId);
    this._postMessage({
      type: 'skill:operationResult',
      operation: 'uninstall',
      skillId,
      success: result.success,
      error: result.error,
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }

  private async _handleSkillInstallFromUrl(url: string): Promise<void> {
    if (!this._skillManager) return;
    this._postMessage({ type: 'skill:installProgress', status: 'downloading', url });
    const result = await this._skillManager.installFromUrl(url);
    this._postMessage({
      type: 'skill:operationResult',
      operation: 'install',
      success: result.success,
      error: result.error,
      skill: result.skill ? {
        id: result.skill.manifest.id,
        name: result.skill.manifest.name,
        version: result.skill.manifest.version,
      } : undefined,
    });
    if (result.success) {
      await this._getAvailableSkills();
    }
  }
  
  /**
   * 获取Skill帮助文本
   */
  private _getSkillHelpText(): string {
    let text = `# Skill 技能使用帮助

## 基本语法
\`@skill\` - 显示此帮助
\`@skill:list\` - 列出所有可用技能

## 调用技能
\`@skill:技能ID\` - 调用指定技能
\`@skill:技能ID 参数\` - 带参数调用

## 可用技能

| 技能ID | 名称 | 说明 |
|--------|------|------|
`;
    if (this._skillManager) {
      const skills = this._skillManager.getInstalledSkills();
      for (const s of skills) {
        const icon = s.installedAt === 0 ? '📦' : '📥';
        text += `| \`${s.manifest.id}\` | ${icon} ${s.manifest.name} | ${s.manifest.description} |\n`;
      }
    }

    if (!this._skillManager || this._skillManager.getInstalledSkills().length === 0) {
      text += '| - | (无可用技能) | 请等待初始化完成或安装技能包 |\n';
    }

    text += `
## 管理技能
- 命令面板: \`Ctrl+Shift+P\` → 搜索 "Skill"
- 安装: \`aiAssistant.skill.install\`
- 管理: \`aiAssistant.skill.manage\`
- 创建: \`aiAssistant.skill.create\`

## 示例
\`@skill:code-reviewer\`
\`@skill:test-architect src/utils.ts\`
\`@skill:dependency-guardian\`
`;
    return text;
  }
  
  /**
   * 显示可用技能列表
   */
  private async _showSkillList(): Promise<void> {
    const installedSkills = this._skillManager ? this._skillManager.getInstalledSkills() : [];
    
    let content = '# 📦 可用技能列表\n\n';
    
    // 分类：内置 vs 用户安装
    const builtins = installedSkills.filter(s => s.installedAt === 0);
    const userInstalled = installedSkills.filter(s => s.installedAt > 0);
    
    if (builtins.length > 0) {
      content += '## 内置技能\n\n';
      content += '| 技能ID | 名称 | 说明 | 状态 |\n';
      content += '|--------|------|------|------|\n';
      for (const skill of builtins) {
        const statusIcon = skill.status === 'active' ? '✅' : skill.status === 'disabled' ? '⏸️' : '❌';
        content += `| \`${skill.manifest.id}\` | ${skill.manifest.name} | ${skill.manifest.description} | ${statusIcon} |\n`;
      }
    } else {
      content += '> ⚠️ 没有找到内置技能。请确认扩展安装完整。\n\n';
    }
    
    if (userInstalled.length > 0) {
      content += '\n## 已安装技能\n\n';
      content += '| 技能ID | 名称 | 版本 | 状态 |\n';
      content += '|--------|------|------|------|\n';
      for (const skill of userInstalled) {
        const statusIcon = skill.status === 'active' ? '✅' : skill.status === 'disabled' ? '⏸️' : '❌';
        content += `| \`${skill.manifest.id}\` | ${skill.manifest.name} | ${skill.manifest.version} | ${statusIcon} |\n`;
      }
    }
    
    content += '\n---\n';
    content += '使用方式: `@skill:技能ID [参数]`\n';
    content += '管理技能: 命令面板 `Ctrl+Shift+P` → 搜索 "Skill"\n';
    
    this._postMessage({
      type: 'addMessage',
      message: {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      }
    });
  }

  /**
   * 确保ChatService可用
   */
  private async _ensureChatService(): Promise<ChatService | null> {
    if (!this._chatService) {
      const config = await this._configManager.getFullModelConfig();
      if (!config.apiKey) {
        return null;
      }
      this._chatService = new ChatService(config);
    }
    return this._chatService;
  }

  /**
   * 保存代码到文件
   */
  private async _saveCodeToFile(code: string, filename: string, language: string): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('请先打开工作区');
        return;
      }

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${workspaceRoot}/${filename}`),
        filters: { 'All Files': ['*'] },
      });

      if (saveUri) {
        const fs = require('fs');
        fs.writeFileSync(saveUri.fsPath, code, 'utf-8');
        
        const document = await vscode.workspace.openTextDocument(saveUri);
        await vscode.window.showTextDocument(document);
        
        vscode.window.showInformationMessage(`文件已保存: ${saveUri.fsPath}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 插入代码到编辑器
   */
  private async _insertCodeToEditor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('请先打开一个文件');
      return;
    }

    await editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, code);
    });
  }

  /**
   * 替换编辑器中的代码
   */
  private async _replaceCodeInEditor(original: string, replacement: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('请先打开一个文件');
      return;
    }

    const document = editor.document;
    const fullText = document.getText();
    const index = fullText.indexOf(original);
    
    if (index === -1) {
      vscode.window.showWarningMessage('未找到要替换的代码');
      return;
    }

    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + original.length);
    const range = new vscode.Range(startPos, endPos);

    await editor.edit(editBuilder => {
      editBuilder.replace(range, replacement);
    });
    
    vscode.window.showInformationMessage('代码已替换');
  }

  private _setProcessingContext(processing: boolean): void {
    vscode.commands.executeCommand('setContext', 'aiAssistant.isProcessing', processing);
  }

  private _postMessage(message: any): void {
    this._view?.webview.postMessage(message);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: https: blob: https://mermaid.ink; font-src ${webview.cspSource}; frame-src blob: https:; connect-src https: https://mermaid.ink; worker-src 'none';">
  <link href="${styleUri}" rel="stylesheet">
  <title>AI Assistant</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  // ==================== 公共方法 ====================

  public async newChat(): Promise<void> {
    await this._sessionHandler.createNewChat();
  }

  public stopTask(): void {
    this._chatMessageHandler.stopCurrentTask();
  }

  public async continueLastSession(): Promise<void> {
    await this._sessionHandler.continueLastSession();
  }

  public async showSessionPicker(): Promise<void> {
    await this._sessionHandler.showSessionPicker();
  }

  public clearAllDataAndReset(): void {
    this._sessionHandler.clearAllDataAndReset();
  }

  public async sendMessage(content: string): Promise<void> {
    if (!this._view) {
      vscode.window.showWarningMessage('聊天视图尚未准备好，请稍后再试');
      return;
    }
    await this._handleSendMessage(content);
  }

  public async sendMessageWithContext(
    displayLabel: string, 
    systemContext: CodeActionContext
  ): Promise<void> {
    await this._chatMessageHandler.sendMessageWithContext(displayLabel, systemContext);
  }
}
