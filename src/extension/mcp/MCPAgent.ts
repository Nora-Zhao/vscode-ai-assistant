/**
 * MCP Agent
 * 
 * 智能代理，能够理解用户任务，自动选择合适的工具并执行
 * 支持多步骤任务规划和执行
 */

import * as vscode from 'vscode';
import {
  MCPToolDefinition,
  MCPAgentRequest,
  MCPAgentResult,
  MCPAgentToolSelection,
  MCPToolCallParams,
  MCPToolResult,
} from './types';
import { MCPRegistry } from './MCPRegistry';
import { MCPExecutor } from './MCPExecutor';
import { ChatService } from '../api/ChatService';
import { ConfigManager } from '../ConfigManager';
import { Message } from '../../types/shared';

/**
 * Agent执行状态
 */
export type AgentStatus = 'idle' | 'planning' | 'executing' | 'completed' | 'failed';

/**
 * Agent执行步骤
 */
export interface AgentStep {
  step: number;
  toolId: string;
  toolName: string;
  description: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: MCPToolResult;
}

/**
 * MCP Agent
 */
export class MCPAgent {
  private static instance: MCPAgent | null = null;
  
  private context: vscode.ExtensionContext;
  private registry: MCPRegistry;
  private executor: MCPExecutor;
  private configManager: ConfigManager;
  private chatService: ChatService | null = null;
  
  private status: AgentStatus = 'idle';
  private currentSteps: AgentStep[] = [];
  private abortController: AbortController | null = null;
  
  // 事件
  private _onStatusChange = new vscode.EventEmitter<AgentStatus>();
  private _onStepUpdate = new vscode.EventEmitter<AgentStep>();
  private _onProgress = new vscode.EventEmitter<{ message: string; progress?: number }>();
  
  public readonly onStatusChange = this._onStatusChange.event;
  public readonly onStepUpdate = this._onStepUpdate.event;
  public readonly onProgress = this._onProgress.event;
  
  private constructor(
    context: vscode.ExtensionContext,
    registry: MCPRegistry,
    executor: MCPExecutor,
    configManager: ConfigManager
  ) {
    this.context = context;
    this.registry = registry;
    this.executor = executor;
    this.configManager = configManager;
  }
  
  static getInstance(
    context: vscode.ExtensionContext,
    registry: MCPRegistry,
    executor: MCPExecutor,
    configManager: ConfigManager
  ): MCPAgent {
    if (!MCPAgent.instance) {
      MCPAgent.instance = new MCPAgent(context, registry, executor, configManager);
    }
    return MCPAgent.instance;
  }
  
  /**
   * 执行Agent任务
   */
  async executeTask(request: MCPAgentRequest): Promise<MCPAgentResult> {
    if (this.status !== 'idle') {
      return {
        success: false,
        task: request.task,
        executions: [],
        answer: 'Agent is busy with another task',
      };
    }
    
    this.abortController = new AbortController();
    this.currentSteps = [];
    
    try {
      // 确保ChatService可用
      await this.ensureChatService();
      if (!this.chatService) {
        return {
          success: false,
          task: request.task,
          executions: [],
          answer: '请先配置API Key',
        };
      }
      
      // 阶段1: 规划
      this.setStatus('planning');
      this._onProgress.fire({ message: '正在分析任务...', progress: 10 });
      
      const plan = await this.planTask(request);
      
      if (!plan.length) {
        this.setStatus('idle');
        return {
          success: true,
          task: request.task,
          executions: [],
          answer: '无需使用工具，我可以直接回答这个问题。',
        };
      }
      
      this.currentSteps = plan;
      this._onProgress.fire({ message: `已规划 ${plan.length} 个步骤`, progress: 30 });
      
      // 阶段2: 执行
      this.setStatus('executing');
      const executions: Array<{ toolId: string; result: MCPToolResult }> = [];
      
      for (let i = 0; i < plan.length; i++) {
        if (this.abortController.signal.aborted) {
          break;
        }
        
        const step = plan[i];
        step.status = 'running';
        this._onStepUpdate.fire(step);
        this._onProgress.fire({ 
          message: `正在执行: ${step.toolName}`, 
          progress: 30 + (i / plan.length) * 50 
        });
        
        try {
          const result = await this.executor.execute({
            toolId: step.toolId,
            arguments: step.params,
            caller: 'agent',
            context: request.context,
          });
          
          step.result = result;
          step.status = result.success ? 'success' : 'failed';
          executions.push({ toolId: step.toolId, result });
          
          // 如果失败且是关键步骤，可能需要中断
          if (!result.success && this.isCriticalStep(step, plan)) {
            console.log(`[MCPAgent] Critical step failed: ${step.toolId}`);
            break;
          }
        } catch (error) {
          step.status = 'failed';
          step.result = {
            success: false,
            toolId: step.toolId,
            error: {
              code: 'EXECUTION_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
            stats: {
              startTime: Date.now(),
              endTime: Date.now(),
              duration: 0,
            },
          };
          executions.push({ toolId: step.toolId, result: step.result });
        }
        
        this._onStepUpdate.fire(step);
      }
      
      // 阶段3: 总结
      this._onProgress.fire({ message: '正在生成总结...', progress: 90 });
      
      const summary = await this.generateSummary(request.task, executions);
      
      this.setStatus('completed');
      this._onProgress.fire({ message: '完成', progress: 100 });
      
      return {
        success: executions.every(e => e.result.success),
        task: request.task,
        plan: plan.map(s => ({
          step: s.step,
          toolId: s.toolId,
          description: s.description,
          params: s.params,
        })),
        executions,
        answer: summary.answer,
        summary: summary.summary,
      };
      
    } catch (error) {
      this.setStatus('failed');
      return {
        success: false,
        task: request.task,
        executions: [],
        answer: `执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * 取消当前任务
   */
  cancelTask(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.setStatus('idle');
    }
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * 获取当前执行步骤
   */
  getCurrentSteps(): AgentStep[] {
    return [...this.currentSteps];
  }
  
  /**
   * 规划任务
   */
  private async planTask(request: MCPAgentRequest): Promise<AgentStep[]> {
    const tools = this.registry.getAgentTools();
    
    // 应用约束
    let availableTools = tools;
    if (request.constraints) {
      if (request.constraints.allowedCategories) {
        availableTools = availableTools.filter(t => 
          request.constraints!.allowedCategories!.includes(t.category)
        );
      }
      if (request.constraints.excludeTools) {
        availableTools = availableTools.filter(t => 
          !request.constraints!.excludeTools!.includes(t.id)
        );
      }
    }
    
    if (availableTools.length === 0) {
      return [];
    }
    
    // 构建工具描述
    const toolDescriptions = availableTools.map(t => this.formatToolForAI(t)).join('\n\n');
    
    // 构建上下文
    const contextInfo = this.buildContextInfo(request.context);
    
    // 请求AI规划
    const planPrompt = this.buildPlanningPrompt(request.task, toolDescriptions, contextInfo);
    
    try {
      const response = await this.chatService!.sendMessageSync([
        {
          id: 'plan',
          role: 'user',
          content: planPrompt,
          timestamp: Date.now(),
        },
      ]);
      
      return this.parsePlanResponse(response, availableTools);
    } catch (error) {
      console.error('[MCPAgent] Planning failed:', error);
      return [];
    }
  }
  
  /**
   * 格式化工具描述给AI
   */
  private formatToolForAI(tool: MCPToolDefinition): string {
    const params = tool.parameters.map(p => 
      `  - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`
    ).join('\n');
    
    return `### ${tool.id}
Name: ${tool.name}
Description: ${tool.description}
Category: ${tool.category}
${tool.aiHints?.whenToUse ? `When to use: ${tool.aiHints.whenToUse}` : ''}
Parameters:
${params || '  (none)'}
Returns: ${tool.returns.description}`;
  }
  
  /**
   * 构建上下文信息
   */
  private buildContextInfo(context?: MCPAgentRequest['context']): string {
    if (!context) return '';
    
    const parts: string[] = [];
    
    if (context.workspaceRoot) {
      parts.push(`Workspace: ${context.workspaceRoot}`);
    }
    if (context.activeFile) {
      parts.push(`Active file: ${context.activeFile}`);
    }
    if (context.selectedCode) {
      parts.push(`Selected code:\n\`\`\`\n${context.selectedCode.slice(0, 500)}\n\`\`\``);
    }
    if (context.recentTools?.length) {
      parts.push(`Recently used tools: ${context.recentTools.join(', ')}`);
    }
    
    return parts.length ? `\n\nContext:\n${parts.join('\n')}` : '';
  }
  
  /**
   * 构建规划提示
   */
  private buildPlanningPrompt(task: string, tools: string, context: string): string {
    return `You are an AI assistant with access to various tools. Your task is to analyze the user's request and create an execution plan.

## Available Tools:
${tools}

## User Task:
${task}
${context}

## Instructions:
1. Analyze what the user wants to accomplish
2. Determine which tools (if any) are needed
3. Create a step-by-step execution plan
4. For each step, specify the tool and its parameters

## Response Format:
If no tools are needed, respond with:
NO_TOOLS_NEEDED

If tools are needed, respond with a JSON array:
\`\`\`json
[
  {
    "step": 1,
    "toolId": "tool_id",
    "description": "What this step does",
    "params": {
      "param1": "value1"
    }
  }
]
\`\`\`

Important:
- Only use tools from the available list
- Provide complete parameter values based on the task context
- Keep the plan concise (usually 1-3 steps)
- If the task is a simple question, NO_TOOLS_NEEDED is appropriate`;
  }
  
  /**
   * 解析规划响应
   */
  private parsePlanResponse(response: string, tools: MCPToolDefinition[]): AgentStep[] {
    if (response.includes('NO_TOOLS_NEEDED')) {
      return [];
    }
    
    // 提取JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // 尝试直接解析
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) {
          return this.validateAndEnrichSteps(parsed, tools);
        }
      } catch {
        console.error('[MCPAgent] Failed to parse plan response');
      }
      return [];
    }
    
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (!Array.isArray(parsed)) {
        return [];
      }
      
      return this.validateAndEnrichSteps(parsed, tools);
    } catch (error) {
      console.error('[MCPAgent] Failed to parse plan JSON:', error);
      return [];
    }
  }
  
  /**
   * 验证和丰富步骤
   */
  private validateAndEnrichSteps(
    steps: any[],
    tools: MCPToolDefinition[]
  ): AgentStep[] {
    const toolMap = new Map(tools.map(t => [t.id, t]));
    
    return steps
      .filter(s => s.toolId && toolMap.has(s.toolId))
      .map((s, index) => ({
        step: s.step || index + 1,
        toolId: s.toolId,
        toolName: toolMap.get(s.toolId)!.name,
        description: s.description || `Execute ${toolMap.get(s.toolId)!.name}`,
        params: s.params || {},
        status: 'pending' as const,
      }));
  }
  
  /**
   * 判断是否是关键步骤
   */
  private isCriticalStep(step: AgentStep, allSteps: AgentStep[]): boolean {
    // 第一步通常是关键的
    if (step.step === 1) return true;
    
    // 如果后续步骤依赖此步骤的输出，也是关键的
    // 简化实现：假设所有步骤都是顺序依赖的
    return step.step < allSteps.length;
  }
  
  /**
   * 生成执行总结
   */
  private async generateSummary(
    task: string,
    executions: Array<{ toolId: string; result: MCPToolResult }>
  ): Promise<{ answer: string; summary: string }> {
    if (executions.length === 0) {
      return {
        answer: '任务完成，但没有执行任何工具。',
        summary: '',
      };
    }
    
    // 构建执行结果摘要
    const executionSummary = executions.map(e => {
      const tool = this.registry.getTool(e.toolId);
      const toolName = tool?.tool.name || e.toolId;
      
      if (e.result.success) {
        const dataPreview = JSON.stringify(e.result.data).slice(0, 500);
        return `✓ ${toolName}: ${dataPreview}${dataPreview.length >= 500 ? '...' : ''}`;
      } else {
        return `✗ ${toolName}: ${e.result.error?.message || 'Failed'}`;
      }
    }).join('\n');
    
    // 请求AI生成总结
    const summaryPrompt = `Based on the following tool execution results, provide a concise answer to the user's task.

## Original Task:
${task}

## Execution Results:
${executionSummary}

## Instructions:
1. Summarize what was accomplished
2. Provide the relevant information the user asked for
3. Note any failures if they affected the result
4. Keep the response concise and helpful

Response in the user's language (Chinese if the task is in Chinese).`;
    
    try {
      const response = await this.chatService!.sendMessageSync([
        {
          id: 'summary',
          role: 'user',
          content: summaryPrompt,
          timestamp: Date.now(),
        },
      ]);
      
      return {
        answer: response,
        summary: executionSummary,
      };
    } catch (error) {
      // 如果AI总结失败，返回基本信息
      const successCount = executions.filter(e => e.result.success).length;
      return {
        answer: `已执行 ${executions.length} 个工具，${successCount} 个成功。`,
        summary: executionSummary,
      };
    }
  }
  
  /**
   * 确保ChatService可用
   */
  private async ensureChatService(): Promise<void> {
    if (this.chatService) return;
    
    const config = await this.configManager.getFullModelConfig();
    if (config.apiKey) {
      this.chatService = new ChatService(config);
    }
  }
  
  /**
   * 设置状态
   */
  private setStatus(status: AgentStatus): void {
    this.status = status;
    this._onStatusChange.fire(status);
  }
  
  /**
   * 直接选择工具（不执行）
   * 用于用户查看AI会选择哪些工具
   */
  async selectTools(task: string): Promise<MCPAgentToolSelection[]> {
    await this.ensureChatService();
    if (!this.chatService) {
      return [];
    }
    
    const tools = this.registry.getAgentTools();
    const toolDescriptions = tools.map(t => this.formatToolForAI(t)).join('\n\n');
    
    const prompt = `Given the following task and available tools, select the most appropriate tools and explain why.

## Task:
${task}

## Available Tools:
${toolDescriptions}

## Instructions:
Select 1-3 tools that would be most helpful for this task.
For each selected tool, provide:
1. Tool ID
2. Confidence score (0-1)
3. Reason for selection
4. Suggested parameter values

Response format:
\`\`\`json
[
  {
    "toolId": "tool_id",
    "confidence": 0.9,
    "reason": "Why this tool is appropriate",
    "suggestedParams": { "param1": "value1" }
  }
]
\`\`\``;
    
    try {
      const response = await this.chatService.sendMessageSync([
        {
          id: 'select',
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ]);
      
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return [];
    } catch {
      return [];
    }
  }
}
