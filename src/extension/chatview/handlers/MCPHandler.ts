/**
 * MCP消息处理器 (修改版)
 * 
 * 修改点：
 * 1. 工具执行结果通过独立通道返回，不再混入chat消息
 * 2. Agent执行采用流式增量输出，而非整体替换
 * 3. 添加执行结果的结构化返回
 */

import * as vscode from 'vscode';
import { ChatViewContext, MessageHandler } from '../types';
import { Message, generateId } from '../../../types/shared';
import {
  MCPRegistry,
  MCPExecutor,
  MCPAgent,
  AutonomousAgent,
  MCPParser,
  MCPToolDefinition,
  MCPToolCallParams,
  MCPAgentRequest,
  AutonomousAgentRequest,
  MCPConfig,
  ExecutionHistory,
  AgentStatus,
  AgentStep,
  IterationRecord,
} from '../../mcp';

/**
 * 执行结果消息类型
 */
export interface ExecutionResultMessage {
  id: string;
  type: 'mcp_execution' | 'skill_execution' | 'agent_execution';
  toolId?: string;
  skillId?: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: number;
}

/**
 * Agent流式更新类型
 */
export interface AgentStreamUpdate {
  messageId: string;
  phase: 'thinking' | 'executing' | 'observing' | 'complete';
  iteration?: number;
  chunk: string;
  isAppend: boolean;  // true=追加, false=替换该phase的内容
  toolExecution?: {
    toolId: string;
    toolName: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    result?: any;
  };
}

/**
 * MCP处理器
 */
export class MCPHandler implements MessageHandler {
  private registry: MCPRegistry;
  private executor: MCPExecutor;
  private agent: MCPAgent;
  private autonomousAgent: AutonomousAgent;
  
  constructor(private ctx: ChatViewContext) {
    // 初始化MCP组件
    this.registry = MCPRegistry.getInstance(ctx.extensionContext);
    this.executor = MCPExecutor.getInstance(ctx.extensionContext, this.registry);
    this.agent = MCPAgent.getInstance(
      ctx.extensionContext,
      this.registry,
      this.executor,
      ctx.configManager
    );
    
    // 初始化自主循环Agent
    this.autonomousAgent = AutonomousAgent.getInstance(
      ctx.extensionContext,
      this.registry,
      this.executor,
      ctx.configManager
    );
    
    // 监听执行完成事件
    this.executor.onExecutionComplete((history: ExecutionHistory) => {
      this.ctx.postMessage({
        type: 'mcp:executionComplete',
        history,
      });
    });
    
    // 监听传统Agent状态变化
    this.agent.onStatusChange((status: AgentStatus) => {
      this.ctx.postMessage({
        type: 'mcp:agentStatusChange',
        status,
      });
    });
    
    this.agent.onStepUpdate((step: AgentStep) => {
      this.ctx.postMessage({
        type: 'mcp:agentStepUpdate',
        step,
      });
    });
    
    this.agent.onProgress((progress: { message: string; progress?: number }) => {
      this.ctx.postMessage({
        type: 'mcp:agentProgress',
        ...progress,
      });
    });
    
    // 监听自主Agent事件
    this.autonomousAgent.onStatusChange((status) => {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentStatusChange',
        status,
      });
    });
    
    this.autonomousAgent.onIteration((iteration: IterationRecord) => {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentIteration',
        iteration,
      });
    });
    
    this.autonomousAgent.onThought((thought) => {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentThought',
        thought,
      });
    });
    
    this.autonomousAgent.onToolExecution(({ call, result }) => {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentToolExecution',
        call,
        result,
      });
    });
    
    this.autonomousAgent.onProgress((progress) => {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentProgress',
        ...progress,
      });
    });
  }
  
  async handle(data: any): Promise<boolean> {
    // 检查是否是MCP消息
    if (!data.type?.startsWith('mcp:')) {
      return false;
    }
    
    switch (data.type) {
      // 工具管理
      case 'mcp:getTools':
        await this.handleGetTools();
        return true;
      
      case 'mcp:getTool':
        await this.handleGetTool(data.toolId);
        return true;
      
      case 'mcp:registerTool':
        await this.handleRegisterTool(data.tool);
        return true;
      
      case 'mcp:updateTool':
        await this.handleUpdateTool(data.tool);
        return true;
      
      case 'mcp:deleteTool':
        await this.handleDeleteTool(data.toolId);
        return true;
      
      case 'mcp:toggleTool':
        await this.handleToggleTool(data.toolId, data.enabled);
        return true;
      
      // 工具执行
      case 'mcp:testTool':
        await this.handleTestTool(data.toolId, data.testParams);
        return true;
      
      case 'mcp:executeTool':
        await this.handleExecuteTool(data.params);
        return true;
      
      // Agent
      case 'mcp:agentRequest':
        await this.handleAgentRequest(data.request);
        return true;
      
      case 'mcp:cancelAgent':
        this.agent.cancelTask();
        return true;
      
      // 自主循环Agent
      case 'mcp:autonomousAgentRequest':
        await this.handleAutonomousAgentRequest(data.request);
        return true;
      
      case 'mcp:cancelAutonomousAgent':
        this.autonomousAgent.cancel();
        return true;
      
      case 'mcp:getAutonomousAgentStatus':
        this.ctx.postMessage({
          type: 'mcp:autonomousAgentStatus',
          status: this.autonomousAgent.getStatus(),
          iterations: this.autonomousAgent.getIterations(),
        });
        return true;
      
      // 配置
      case 'mcp:getConfig':
        this.handleGetConfig();
        return true;
      
      case 'mcp:updateConfig':
        await this.handleUpdateConfig(data.config);
        return true;
      
      // 导入导出
      case 'mcp:importTools':
        await this.handleImportTools(data.data);
        return true;
      
      case 'mcp:exportTools':
        this.handleExportTools(data.toolIds);
        return true;
      
      // 历史
      case 'mcp:getExecutionHistory':
        this.handleGetExecutionHistory(data.limit);
        return true;
      
      default:
        return false;
    }
  }
  
  /**
   * 处理聊天消息中的MCP指令
   * 从ChatMessageHandler调用
   */
  async handleMCPCommand(input: string): Promise<boolean> {
    const parseResult = MCPParser.parse(input);
    
    if (parseResult.type === 'none') {
      return false;
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    await this.ctx.sessionManager.addMessage(userMessage);
    this.ctx.postMessage({ type: 'addMessage', message: userMessage });
    
    // 根据解析结果处理
    switch (parseResult.type) {
      case 'help':
        await this.sendAssistantMessage(MCPParser.getHelpText());
        break;
      
      case 'list':
        await this.sendToolList();
        break;
      
      case 'search':
        await this.sendSearchResults(parseResult.searchQuery || '');
        break;
      
      case 'manage':
        this.ctx.postMessage({ type: 'mcp:openManagePanel' });
        await this.sendAssistantMessage('已打开MCP工具管理面板。');
        break;
      
      case 'history':
        await this.sendExecutionHistory();
        break;
      
      case 'call':
        // 工具执行结果通过chat消息完整返回
        this.ctx.updateTaskStatus('mcp', 'running', `执行工具: ${parseResult.toolId}`);
        await this.executeToolFromChat(parseResult);
        break;
      
      case 'agent':
        // [修改] Agent采用流式输出
        await this.executeAgentFromChat(parseResult);
        break;
    }
    
    return true;
  }
  
  // ============================================
  // 工具管理处理 (保持原有实现)
  // ============================================
  
  private async handleGetTools(): Promise<void> {
    const tools = this.registry.getAllTools();
    this.ctx.postMessage({
      type: 'mcp:toolList',
      tools,
    });
  }
  
  private async handleGetTool(toolId: string): Promise<void> {
    const tool = this.registry.getTool(toolId);
    this.ctx.postMessage({
      type: 'mcp:toolDetail',
      tool: tool || null,
    });
  }
  
  private async handleRegisterTool(tool: MCPToolDefinition): Promise<void> {
    try {
      await this.registry.registerTool(tool);
      this.ctx.postMessage({ type: 'mcp:toolRegistered', toolId: tool.id });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  private async handleUpdateTool(tool: MCPToolDefinition): Promise<void> {
    try {
      await this.registry.updateTool(tool);
      this.ctx.postMessage({ type: 'mcp:toolUpdated', toolId: tool.id });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  private async handleDeleteTool(toolId: string): Promise<void> {
    try {
      await this.registry.deleteTool(toolId);
      this.ctx.postMessage({ type: 'mcp:toolDeleted', toolId });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  private async handleToggleTool(toolId: string, enabled: boolean): Promise<void> {
    try {
      await this.registry.toggleTool(toolId, enabled);
      this.ctx.postMessage({ type: 'mcp:toolToggled', toolId, enabled });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  private async handleTestTool(toolId: string, testParams: Record<string, any>): Promise<void> {
    const result = await this.executor.execute({
      toolId,
      arguments: testParams,
      caller: 'test',
      context: {
        workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      },
    });
    
    this.ctx.postMessage({
      type: 'mcp:testResult',
      toolId,
      result,
    });
  }
  
  private async handleExecuteTool(params: MCPToolCallParams): Promise<void> {
    const result = await this.executor.execute(params);
    
    // [修改] 通过独立通道返回执行结果
    this.ctx.postMessage({
      type: 'mcp:executionResult',
      result,
    });
  }
  
  private async handleAgentRequest(request: MCPAgentRequest): Promise<void> {
    try {
      const result = await this.agent.execute(request);
      this.ctx.postMessage({
        type: 'mcp:agentResult',
        result,
      });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:agentError',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  private handleGetConfig(): void {
    // 实现获取配置
    this.ctx.postMessage({
      type: 'mcp:config',
      config: {},
    });
  }
  
  private async handleUpdateConfig(config: Partial<MCPConfig>): Promise<void> {
    // 实现更新配置
    this.ctx.postMessage({ type: 'mcp:configUpdated' });
  }
  
  private async handleImportTools(data: any): Promise<void> {
    // 实现导入工具
    this.ctx.postMessage({ type: 'mcp:importComplete' });
  }
  
  private handleExportTools(toolIds: string[]): void {
    // 实现导出工具
    const tools = toolIds.map(id => this.registry.getTool(id)).filter(Boolean);
    this.ctx.postMessage({
      type: 'mcp:exportData',
      data: tools,
    });
  }
  
  private handleGetExecutionHistory(limit?: number): void {
    const history = this.executor.getHistory(limit);
    this.ctx.postMessage({
      type: 'mcp:executionHistory',
      history,
    });
  }
  
  /**
   * 发送助手消息
   */
  private async sendAssistantMessage(content: string): Promise<void> {
    const message: Message = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    await this.ctx.sessionManager.addMessage(message);
    this.ctx.postMessage({ type: 'addMessage', message });
  }
  
  /**
   * 发送工具列表
   */
  private async sendToolList(): Promise<void> {
    const allTools = this.registry.getAllTools();
    
    if (allTools.length === 0) {
      await this.sendAssistantMessage('当前没有可用的MCP工具。使用 `@mcp:manage` 打开管理面板添加工具。');
      return;
    }
    
    // 按分类分组
    const byCategory = new Map<string, typeof allTools>();
    allTools.forEach(reg => {
      const cat = reg.tool.category || 'custom';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(reg);
    });
    
    let content = '# 🔧 可用MCP工具\n\n';
    
    byCategory.forEach((tools, category) => {
      content += `## ${this.getCategoryName(category)}\n\n`;
      tools.forEach(reg => {
        const status = reg.enabled ? '✅' : '⏸️';
        content += `${status} **${reg.tool.name}** (\`@mcp:${reg.tool.id}\`)\n`;
        content += `   ${reg.tool.description}\n\n`;
      });
    });
    
    content += '\n使用 `@mcp:工具ID {参数}` 调用工具';
    
    await this.sendAssistantMessage(content);
  }
  
  /**
   * 发送搜索结果
   */
  private async sendSearchResults(query: string): Promise<void> {
    const results = this.registry.searchTools(query);
    
    if (results.length === 0) {
      await this.sendAssistantMessage(`没有找到匹配 "${query}" 的工具。`);
      return;
    }
    
    let content = `# 🔍 搜索结果: "${query}"\n\n`;
    results.forEach(reg => {
      const status = reg.enabled ? '✅' : '⏸️';
      content += `${status} **${reg.tool.name}** (\`@mcp:${reg.tool.id}\`)\n`;
      content += `   ${reg.tool.description}\n\n`;
    });
    
    await this.sendAssistantMessage(content);
  }
  
  /**
   * 发送执行历史
   */
  private async sendExecutionHistory(): Promise<void> {
    const history = this.executor.getHistory(10);
    
    if (history.length === 0) {
      await this.sendAssistantMessage('暂无执行历史。');
      return;
    }
    
    let content = '# 📜 最近执行历史\n\n';
    
    for (const h of history) {
      const status = h.success ? '✅' : '❌';
      const time = new Date(h.timestamp).toLocaleString();
      const duration = h.duration;
      
      content += `${status} **${h.toolName}** - ${time} (${duration}ms)\n`;
      content += `\`@mcp:${h.toolId}\`\n\n`;
    }
    
    await this.sendAssistantMessage(content);
  }
  
  /**
   * [修改] 从聊天执行工具 - 结果通过chat消息完整返回
   */
  private async executeToolFromChat(parseResult: any): Promise<void> {
    const { toolId, params } = parseResult;
    
    // 检查工具是否存在
    const registration = this.registry.getTool(toolId);
    if (!registration) {
      await this.sendAssistantMessage(`工具 \`${toolId}\` 不存在。使用 \`@mcp:list\` 查看可用工具。`);
      return;
    }
    
    if (!registration.enabled) {
      await this.sendAssistantMessage(`工具 \`${toolId}\` 已禁用。`);
      return;
    }
    
    // 通知前端工具开始执行
    this.ctx.updateTaskStatus('chat', 'running', `正在执行 ${registration.tool.name}...`);
    this.ctx.postMessage({
      type: 'mcp:toolExecutionStart',
      toolId,
      toolName: registration.tool.name,
      params,
    });
    
    // 执行工具
    const startTime = Date.now();
    const result = await this.executor.execute({
      toolId,
      arguments: params,
      caller: 'user',
      context: {
        workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        activeFile: vscode.window.activeTextEditor?.document.fileName,
      },
    });
    
    const duration = Date.now() - startTime;
    
    // 同时通过独立通道发送原始结果（供面板使用）
    const executionResult: ExecutionResultMessage = {
      id: generateId(),
      type: 'mcp_execution',
      toolId,
      success: result.success,
      data: result.data,
      error: result.error?.message,
      duration,
      timestamp: Date.now(),
    };
    
    this.ctx.postMessage({
      type: 'mcp:toolExecutionResult',
      result: executionResult,
      toolName: registration.tool.name,
    });
    
    // [核心修改] 将完整执行结果作为chat消息返回
    let chatContent: string;
    if (result.success) {
      const dataStr = result.data != null
        ? (typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2))
        : '(无返回数据)';
      const truncated = dataStr.length > 3000 ? dataStr.slice(0, 3000) + '\n...(结果已截断)' : dataStr;
      
      chatContent = `✅ **${registration.tool.name}** 执行成功 (${duration}ms)\n\n`;
      chatContent += `\`\`\`json\n${truncated}\n\`\`\``;
    } else {
      chatContent = `❌ **${registration.tool.name}** 执行失败 (${duration}ms)\n\n`;
      chatContent += `**错误**: ${result.error?.message || '未知错误'}`;
    }
    
    await this.sendAssistantMessage(chatContent);
    this.ctx.updateTaskStatus('chat', result.success ? 'success' : 'error', 
      result.success ? `${registration.tool.name} 执行完成` : `${registration.tool.name} 执行失败`);
  }
  /**
   * 从聊天执行Agent（使用自主循环Agent）
   */
  private async executeAgentFromChat(parseResult: any): Promise<void> {
    const task = parseResult.agentTask;
    
    // 使用新的流式自主Agent
    await this.executeAutonomousAgentStreamingFromChat(task);
  }
  
  /**
   * 获取分类名称
   */
  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      file: '📁 文件操作',
      code: '💻 代码相关',
      api: '🌐 API调用',
      database: '🗄️ 数据库',
      shell: '⌨️ Shell命令',
      web: '🔗 Web请求',
      ai: '🤖 AI服务',
      utility: '🔧 工具类',
      custom: '📦 自定义',
    };
    return names[category] || category;
  }
  
  /**
   * 获取Registry实例（供外部使用）
   */
  getRegistry(): MCPRegistry {
    return this.registry;
  }
  
  /**
   * 获取Executor实例（供外部使用）
   */
  getExecutor(): MCPExecutor {
    return this.executor;
  }
  
  /**
   * 获取Agent实例（供外部使用）
   */
  getAgent(): MCPAgent {
    return this.agent;
  }
  
  /**
   * 获取自主Agent实例（供外部使用）
   */
  getAutonomousAgent(): AutonomousAgent {
    return this.autonomousAgent;
  }
  
  // ============================================
  // 自主循环Agent处理
  // ============================================
  
  /**
   * 处理自主Agent请求
   */
  private async handleAutonomousAgentRequest(request: AutonomousAgentRequest): Promise<void> {
    try {
      const result = await this.autonomousAgent.execute(request);
      
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentResult',
        result,
      });
    } catch (error) {
      this.ctx.postMessage({
        type: 'mcp:autonomousAgentError',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  /**
   * [新增] 从聊天执行自主Agent - 流式输出版本
   * 输出格式：结构化步骤 + 折叠thinking + 清晰结果
   */
  private async executeAutonomousAgentStreamingFromChat(task: string): Promise<void> {
    if (!task) {
      await this.sendAssistantMessage('请提供任务描述，例如: `@mcp:agent 帮我查找所有TODO注释`');
      return;
    }
    
    // 更新任务状态
    this.ctx.updateTaskStatus('mcp', 'running', `Agent执行中: ${task.slice(0, 30)}...`);
    
    // 创建初始消息
    const messageId = generateId();
    const initialMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      metadata: {
        type: 'agent_execution',
        task,
      },
    };
    
    await this.ctx.sessionManager.addMessage(initialMessage);
    this.ctx.postMessage({ type: 'addMessage', message: initialMessage, streaming: true });
    
    // 内容累积器
    let accumulatedContent = '';
    let stepNumber = 0;
    
    // 发送流式更新的辅助函数
    const sendStreamUpdate = (chunk: string, isAppend: boolean = true) => {
      if (isAppend) {
        accumulatedContent += chunk;
      }
      this.ctx.postMessage({
        type: 'updateMessage',
        messageId,
        content: accumulatedContent,
      });
    };
    
    // 输出任务头部
    sendStreamUpdate(`🤖 **Agent 任务**: ${task}\n\n`);
    sendStreamUpdate(`---\n\n`);
    
    // 设置流式进度更新
    const progressHandler = this.autonomousAgent.onProgress((progress) => {
      this.ctx.postMessage({
        type: 'mcp:agentStreamUpdate',
        messageId,
        phase: 'progress',
        progress: progress.progress,
        message: progress.message,
      });
    });
    
    // 设置流式思考更新 - 折叠格式
    const thoughtHandler = this.autonomousAgent.onThought((thought) => {
      stepNumber++;
      sendStreamUpdate(`**步骤 ${stepNumber}** — `);
      
      if (thought.decision === 'complete') {
        sendStreamUpdate(`✅ 任务完成\n\n`);
      } else if (thought.decision === 'clarify') {
        sendStreamUpdate(`❓ 需要澄清\n\n`);
      } else {
        sendStreamUpdate(`执行中\n\n`);
      }
      
      // 思考过程折叠展示
      sendStreamUpdate(`<details>\n<summary>💭 思考过程</summary>\n\n`);
      sendStreamUpdate(`${thought.analysis}\n\n`);
      if (thought.toolCalls.length > 0) {
        sendStreamUpdate(`**计划**:\n`);
        for (const call of thought.toolCalls) {
          sendStreamUpdate(`- 🔧 ${call.toolName} — ${call.reason}\n`);
        }
      }
      sendStreamUpdate(`\n</details>\n\n`);
    });
    
    // 设置流式工具执行更新
    const toolExecutionHandler = this.autonomousAgent.onToolExecution(({ call, result }) => {
      if (!result) {
        // 工具开始执行
        sendStreamUpdate(`> ⚡ **${call.toolName}** — ${call.reason}\n`);
      } else {
        // 工具执行完成
        const status = result.success ? '✅' : '❌';
        const duration = result.duration ? ` (${result.duration}ms)` : '';
        
        if (result.success && result.data) {
          const dataStr = typeof result.data === 'string' 
            ? result.data 
            : JSON.stringify(result.data, null, 2);
          const truncated = dataStr.length > 300 
            ? dataStr.slice(0, 300) + '\n...' 
            : dataStr;
          sendStreamUpdate(`> ${status} 完成${duration}\n>\n> \`\`\`\n> ${truncated.split('\n').join('\n> ')}\n> \`\`\`\n\n`);
        } else if (!result.success) {
          sendStreamUpdate(`> ${status} 失败${duration}: ${result.error}\n\n`);
        } else {
          sendStreamUpdate(`> ${status} 完成${duration}\n\n`);
        }
      }
    });
    
    // 设置流式迭代更新 - 简洁的观察总结
    const iterationHandler = this.autonomousAgent.onIteration((iteration) => {
      // 观察结果折叠
      sendStreamUpdate(`<details>\n<summary>👁 第${iteration.iteration}轮观察</summary>\n\n`);
      sendStreamUpdate(`${iteration.observation}\n\n`);
      sendStreamUpdate(`</details>\n\n`);
    });
    
    try {
      // 执行自主Agent任务
      const result = await this.autonomousAgent.execute({
        task,
        context: {
          workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
          activeFile: vscode.window.activeTextEditor?.document.fileName,
          selectedCode: vscode.window.activeTextEditor?.document.getText(
            vscode.window.activeTextEditor.selection
          ),
        },
        config: {
          maxIterations: 10,
          maxParallelCalls: 5,
          timeout: 120000,
        },
      });
      
      // 输出简洁的最终结果
      sendStreamUpdate(`---\n\n`);
      sendStreamUpdate(`## ✅ 结果\n\n`);
      sendStreamUpdate(`${result.finalAnswer}\n\n`);
      
      // 统计信息折叠
      sendStreamUpdate(`<details>\n<summary>📊 执行统计</summary>\n\n`);
      sendStreamUpdate(`- 迭代: ${result.stats.totalIterations} 轮\n`);
      sendStreamUpdate(`- 工具调用: ${result.stats.totalToolCalls} 次 (成功 ${result.stats.successfulCalls} / 失败 ${result.stats.failedCalls})\n`);
      sendStreamUpdate(`- 耗时: ${(result.totalDuration / 1000).toFixed(1)}s\n`);
      if (result.toolsUsed.length > 0) {
        sendStreamUpdate(`- 使用工具: ${result.toolsUsed.join(', ')}\n`);
      }
      sendStreamUpdate(`\n</details>\n`);
      
      // 完成消息
      initialMessage.content = accumulatedContent;
      initialMessage.isStreaming = false;
      await this.ctx.sessionManager.updateLastMessage(accumulatedContent, true);
      this.ctx.postMessage({
        type: 'completeMessage',
        messageId,
        content: accumulatedContent,
      });
      
      this.ctx.updateTaskStatus('mcp', 'success', 'Agent任务完成');
      
    } catch (error) {
      sendStreamUpdate(`\n---\n\n`);
      sendStreamUpdate(`## ❌ 执行失败\n\n`);
      sendStreamUpdate(`${error instanceof Error ? error.message : '未知错误'}\n`);
      
      initialMessage.content = accumulatedContent;
      initialMessage.isStreaming = false;
      await this.ctx.sessionManager.updateLastMessage(accumulatedContent, true);
      this.ctx.postMessage({
        type: 'completeMessage',
        messageId,
        content: accumulatedContent,
        error: true,
      });
      
      this.ctx.updateTaskStatus('mcp', 'error', error instanceof Error ? error.message : '执行失败');
    } finally {
      // 清理事件监听
      progressHandler.dispose();
      thoughtHandler.dispose();
      toolExecutionHandler.dispose();
      iterationHandler.dispose();
    }
  }
}
