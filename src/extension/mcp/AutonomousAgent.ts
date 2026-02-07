/**
 * MCP Autonomous Agent (ReAct Pattern)
 * 
 * 自主循环Agent，采用ReAct模式（Reasoning + Acting）
 * 
 * 核心能力：
 * 1. 自主思考-行动循环，直到任务完成
 * 2. 支持并行调用多个工具
 * 3. 基于执行结果动态调整策略
 * 4. 工具间数据传递和上下文积累
 * 5. 智能终止条件判断
 */

import * as vscode from 'vscode';
import {
  MCPToolDefinition,
  MCPToolResult,
  MCPToolCallParams,
} from './types';
import { MCPRegistry } from './MCPRegistry';
import { MCPExecutor } from './MCPExecutor';
import { ChatService } from '../api/ChatService';
import { ConfigManager } from '../ConfigManager';

// ============================================
// 类型定义
// ============================================

/**
 * Agent运行状态
 */
export type AutonomousAgentStatus = 
  | 'idle'           // 空闲
  | 'thinking'       // 思考中
  | 'executing'      // 执行工具中
  | 'reflecting'     // 反思结果中
  | 'completed'      // 完成
  | 'failed'         // 失败
  | 'cancelled';     // 已取消

/**
 * 单次工具调用
 */
export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  params: Record<string, any>;
  reason: string;           // 为什么调用这个工具
  dependsOn?: string[];     // 依赖哪些前置调用的结果
}

/**
 * 思考步骤
 */
export interface ThoughtStep {
  iteration: number;
  thought: string;          // Agent的思考过程
  analysis: string;         // 对当前状态的分析
  decision: 'continue' | 'complete' | 'need_clarification';
  toolCalls: ToolCall[];    // 本轮要执行的工具（可以多个）
  parallelizable: boolean;  // 这些工具是否可以并行执行
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  callId: string;
  toolId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

/**
 * 迭代记录
 */
export interface IterationRecord {
  iteration: number;
  thought: ThoughtStep;
  executions: ExecutionResult[];
  observation: string;      // Agent对结果的观察总结
  timestamp: number;
}

/**
 * Agent任务请求
 */
export interface AutonomousAgentRequest {
  task: string;
  context?: {
    workspaceRoot?: string;
    activeFile?: string;
    selectedCode?: string;
    additionalContext?: string;
  };
  config?: {
    maxIterations?: number;     // 最大迭代次数，默认10
    maxParallelCalls?: number;  // 最大并行调用数，默认5
    timeout?: number;           // 总超时时间(ms)，默认120000
    autoApprove?: boolean;      // 是否自动批准危险操作，默认false
  };
}

/**
 * Agent任务结果
 */
export interface AutonomousAgentResult {
  success: boolean;
  task: string;
  iterations: IterationRecord[];
  finalAnswer: string;
  totalDuration: number;
  toolsUsed: string[];
  stats: {
    totalIterations: number;
    totalToolCalls: number;
    successfulCalls: number;
    failedCalls: number;
  };
}

// ============================================
// 自主循环Agent实现
// ============================================

export class AutonomousAgent {
  private static instance: AutonomousAgent | null = null;
  
  private context: vscode.ExtensionContext;
  private registry: MCPRegistry;
  private executor: MCPExecutor;
  private configManager: ConfigManager;
  private chatService: ChatService | null = null;
  
  private status: AutonomousAgentStatus = 'idle';
  private abortController: AbortController | null = null;
  
  // 运行时状态
  private currentTask: string = '';
  private iterations: IterationRecord[] = [];
  private accumulatedContext: string = '';  // 积累的上下文
  private toolResultsMap: Map<string, any> = new Map();  // 工具结果缓存
  
  // 事件
  private _onStatusChange = new vscode.EventEmitter<AutonomousAgentStatus>();
  private _onIteration = new vscode.EventEmitter<IterationRecord>();
  private _onThought = new vscode.EventEmitter<ThoughtStep>();
  private _onToolExecution = new vscode.EventEmitter<{ call: ToolCall; result?: ExecutionResult }>();
  private _onProgress = new vscode.EventEmitter<{ message: string; progress: number; detail?: string }>();
  
  public readonly onStatusChange = this._onStatusChange.event;
  public readonly onIteration = this._onIteration.event;
  public readonly onThought = this._onThought.event;
  public readonly onToolExecution = this._onToolExecution.event;
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
  ): AutonomousAgent {
    if (!AutonomousAgent.instance) {
      AutonomousAgent.instance = new AutonomousAgent(context, registry, executor, configManager);
    }
    return AutonomousAgent.instance;
  }
  
  /**
   * 执行自主任务
   */
  async execute(request: AutonomousAgentRequest): Promise<AutonomousAgentResult> {
    if (this.status !== 'idle') {
      throw new Error('Agent is busy with another task');
    }
    
    const startTime = Date.now();
    const config = {
      maxIterations: request.config?.maxIterations ?? 10,
      maxParallelCalls: request.config?.maxParallelCalls ?? 5,
      timeout: request.config?.timeout ?? 120000,
      autoApprove: request.config?.autoApprove ?? false,
    };
    
    // 初始化
    this.abortController = new AbortController();
    this.currentTask = request.task;
    this.iterations = [];
    this.accumulatedContext = '';
    this.toolResultsMap.clear();
    
    const toolsUsed = new Set<string>();
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    
    try {
      // 确保ChatService可用
      await this.ensureChatService();
      if (!this.chatService) {
        return this.createFailedResult(request.task, '请先配置API Key', startTime);
      }
      
      this._onProgress.fire({ message: '开始分析任务...', progress: 5 });
      
      // ========== ReAct循环 ==========
      for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
        // 检查取消和超时
        if (this.abortController.signal.aborted) {
          this.setStatus('cancelled');
          break;
        }
        
        if (Date.now() - startTime > config.timeout) {
          this._onProgress.fire({ message: '任务超时', progress: 100 });
          break;
        }
        
        const iterationProgress = 5 + (iteration / config.maxIterations) * 85;
        this._onProgress.fire({ 
          message: `第 ${iteration} 轮思考...`, 
          progress: iterationProgress,
          detail: `已执行 ${totalCalls} 次工具调用`
        });
        
        // ===== 1. 思考阶段 =====
        this.setStatus('thinking');
        const thought = await this.think(request, iteration);
        this._onThought.fire(thought);
        
        // 检查是否完成
        if (thought.decision === 'complete') {
          const finalAnswer = await this.generateFinalAnswer(request);
          this.setStatus('completed');
          
          return {
            success: true,
            task: request.task,
            iterations: this.iterations,
            finalAnswer,
            totalDuration: Date.now() - startTime,
            toolsUsed: Array.from(toolsUsed),
            stats: {
              totalIterations: iteration,
              totalToolCalls: totalCalls,
              successfulCalls,
              failedCalls,
            },
          };
        }
        
        if (thought.decision === 'need_clarification') {
          // 需要用户澄清
          this.setStatus('completed');
          return {
            success: true,
            task: request.task,
            iterations: this.iterations,
            finalAnswer: thought.thought,
            totalDuration: Date.now() - startTime,
            toolsUsed: Array.from(toolsUsed),
            stats: {
              totalIterations: iteration,
              totalToolCalls: totalCalls,
              successfulCalls,
              failedCalls,
            },
          };
        }
        
        // ===== 2. 执行阶段 =====
        if (thought.toolCalls.length > 0) {
          this.setStatus('executing');
          
          let executions: ExecutionResult[];
          
          if (thought.parallelizable && thought.toolCalls.length > 1) {
            // 并行执行
            executions = await this.executeToolsInParallel(
              thought.toolCalls, 
              config.maxParallelCalls,
              request.context
            );
          } else {
            // 串行执行（有依赖关系）
            executions = await this.executeToolsSequentially(
              thought.toolCalls,
              request.context
            );
          }
          
          // 统计
          for (const exec of executions) {
            totalCalls++;
            toolsUsed.add(exec.toolId);
            if (exec.success) {
              successfulCalls++;
              // 缓存结果供后续使用
              this.toolResultsMap.set(exec.callId, exec.data);
            } else {
              failedCalls++;
            }
          }
          
          // ===== 3. 反思阶段 =====
          this.setStatus('reflecting');
          const observation = await this.observe(thought, executions);
          
          // 记录本轮迭代
          const record: IterationRecord = {
            iteration,
            thought,
            executions,
            observation,
            timestamp: Date.now(),
          };
          
          this.iterations.push(record);
          this._onIteration.fire(record);
          
          // 更新积累上下文
          this.accumulatedContext += `\n\n--- Iteration ${iteration} ---\n`;
          this.accumulatedContext += `Thought: ${thought.thought}\n`;
          this.accumulatedContext += `Actions: ${thought.toolCalls.map(c => c.toolId).join(', ')}\n`;
          this.accumulatedContext += `Observation: ${observation}\n`;
        }
      }
      
      // 达到最大迭代次数
      this.setStatus('completed');
      const finalAnswer = await this.generateFinalAnswer(request);
      
      return {
        success: true,
        task: request.task,
        iterations: this.iterations,
        finalAnswer,
        totalDuration: Date.now() - startTime,
        toolsUsed: Array.from(toolsUsed),
        stats: {
          totalIterations: this.iterations.length,
          totalToolCalls: totalCalls,
          successfulCalls,
          failedCalls,
        },
      };
      
    } catch (error) {
      this.setStatus('failed');
      return this.createFailedResult(
        request.task, 
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    } finally {
      this.abortController = null;
      this.setStatus('idle');
    }
  }
  
  /**
   * 思考阶段 - 决定下一步行动
   */
  private async think(request: AutonomousAgentRequest, iteration: number): Promise<ThoughtStep> {
    const tools = this.registry.getAgentTools();
    const toolDescriptions = this.formatToolsForAI(tools);
    
    const prompt = this.buildThinkingPrompt(request, iteration, toolDescriptions);
    
    try {
      const response = await this.chatService!.sendMessageSync([
        {
          id: `think_${iteration}`,
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ]);
      
      return this.parseThinkingResponse(response, iteration, tools);
    } catch (error) {
      console.error('[AutonomousAgent] Thinking failed:', error);
      // 返回完成决定以避免无限循环
      return {
        iteration,
        thought: 'Unable to process the task due to an error.',
        analysis: 'Error occurred during thinking phase.',
        decision: 'complete',
        toolCalls: [],
        parallelizable: false,
      };
    }
  }
  
  /**
   * 构建思考提示词
   */
  private buildThinkingPrompt(
    request: AutonomousAgentRequest, 
    iteration: number,
    toolDescriptions: string
  ): string {
    const contextParts: string[] = [];
    
    if (request.context?.workspaceRoot) {
      contextParts.push(`Workspace: ${request.context.workspaceRoot}`);
    }
    if (request.context?.activeFile) {
      contextParts.push(`Active file: ${request.context.activeFile}`);
    }
    if (request.context?.selectedCode) {
      contextParts.push(`Selected code:\n\`\`\`\n${request.context.selectedCode.slice(0, 1000)}\n\`\`\``);
    }
    if (request.context?.additionalContext) {
      contextParts.push(`Additional context: ${request.context.additionalContext}`);
    }
    
    const previousIterations = this.iterations.length > 0 
      ? this.formatPreviousIterations()
      : 'None yet.';
    
    return `You are an autonomous AI agent that can use tools to complete tasks. You operate in a ReAct loop (Reasoning + Acting).

## Your Task
${request.task}

## Current Context
${contextParts.join('\n') || 'No additional context.'}

## Available Tools
${toolDescriptions}

## Previous Iterations
${previousIterations}

## Accumulated Results
${this.formatAccumulatedResults()}

## Current Iteration: ${iteration}

## Instructions
Analyze the current state and decide what to do next. You can:
1. Call one or more tools (they can run in parallel if independent)
2. Decide the task is complete
3. Ask for clarification if needed

Think step by step:
1. What has been accomplished so far?
2. What still needs to be done?
3. Which tools should be used next and why?
4. Can multiple tools be run in parallel?

## Response Format (JSON)
\`\`\`json
{
  "thought": "Your reasoning process...",
  "analysis": "Analysis of current state...",
  "decision": "continue" | "complete" | "need_clarification",
  "toolCalls": [
    {
      "id": "unique_call_id",
      "toolId": "tool_id",
      "params": { "param1": "value1" },
      "reason": "Why this tool is needed",
      "dependsOn": ["previous_call_id"] // optional, for sequential execution
    }
  ],
  "parallelizable": true | false
}
\`\`\`

If decision is "complete", toolCalls should be empty and thought should contain the final answer.
If decision is "need_clarification", thought should contain the clarifying question.

Important:
- You can call MULTIPLE tools at once if they are independent
- Use "dependsOn" if a tool needs results from another tool
- Set "parallelizable": true if tools can run simultaneously
- Be efficient - don't repeat the same tool calls
- If the task seems complete based on results, set decision to "complete"`;
  }
  
  /**
   * 格式化之前的迭代记录
   */
  private formatPreviousIterations(): string {
    if (this.iterations.length === 0) return 'None yet.';
    
    return this.iterations.map(iter => {
      const execSummary = iter.executions.map(e => 
        `  - ${e.toolId}: ${e.success ? 'SUCCESS' : 'FAILED'}`
      ).join('\n');
      
      return `### Iteration ${iter.iteration}
Thought: ${iter.thought.thought}
Actions:
${execSummary}
Observation: ${iter.observation}`;
    }).join('\n\n');
  }
  
  /**
   * 格式化积累的结果
   */
  private formatAccumulatedResults(): string {
    if (this.toolResultsMap.size === 0) return 'No results yet.';
    
    const results: string[] = [];
    this.toolResultsMap.forEach((value, key) => {
      const preview = JSON.stringify(value).slice(0, 500);
      results.push(`${key}: ${preview}${preview.length >= 500 ? '...' : ''}`);
    });
    
    return results.join('\n');
  }
  
  /**
   * 格式化工具描述
   */
  private formatToolsForAI(tools: MCPToolDefinition[]): string {
    return tools.map(t => {
      const params = t.parameters.map(p => 
        `    - ${p.name} (${p.type}${p.required ? ', required' : ''}): ${p.description}`
      ).join('\n');
      
      return `### ${t.id}
  Name: ${t.name}
  Description: ${t.description}
  ${t.aiHints?.whenToUse ? `When to use: ${t.aiHints.whenToUse}` : ''}
  Parameters:
${params || '    (none)'}`;
    }).join('\n\n');
  }
  
  /**
   * 解析思考响应
   */
  private parseThinkingResponse(
    response: string, 
    iteration: number,
    tools: MCPToolDefinition[]
  ): ThoughtStep {
    // 提取JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (!jsonMatch) {
      // 尝试直接解析
      try {
        const parsed = JSON.parse(response);
        return this.validateThoughtStep(parsed, iteration, tools);
      } catch {
        // 无法解析，返回完成状态
        return {
          iteration,
          thought: response,
          analysis: 'Could not parse structured response.',
          decision: 'complete',
          toolCalls: [],
          parallelizable: false,
        };
      }
    }
    
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return this.validateThoughtStep(parsed, iteration, tools);
    } catch (error) {
      console.error('[AutonomousAgent] Failed to parse thinking response:', error);
      return {
        iteration,
        thought: response,
        analysis: 'Parse error.',
        decision: 'complete',
        toolCalls: [],
        parallelizable: false,
      };
    }
  }
  
  /**
   * 验证思考步骤
   */
  private validateThoughtStep(
    parsed: any, 
    iteration: number,
    tools: MCPToolDefinition[]
  ): ThoughtStep {
    const toolMap = new Map(tools.map(t => [t.id, t]));
    
    const validToolCalls: ToolCall[] = (parsed.toolCalls || [])
      .filter((call: any) => call.toolId && toolMap.has(call.toolId))
      .map((call: any, index: number) => ({
        id: call.id || `call_${iteration}_${index}`,
        toolId: call.toolId,
        toolName: toolMap.get(call.toolId)!.name,
        params: call.params || {},
        reason: call.reason || '',
        dependsOn: call.dependsOn,
      }));
    
    return {
      iteration,
      thought: parsed.thought || '',
      analysis: parsed.analysis || '',
      decision: ['continue', 'complete', 'need_clarification'].includes(parsed.decision) 
        ? parsed.decision 
        : 'continue',
      toolCalls: validToolCalls,
      parallelizable: parsed.parallelizable ?? (validToolCalls.length > 1),
    };
  }
  
  /**
   * 并行执行工具
   */
  private async executeToolsInParallel(
    calls: ToolCall[],
    maxParallel: number,
    context?: AutonomousAgentRequest['context']
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    // 分批执行
    for (let i = 0; i < calls.length; i += maxParallel) {
      const batch = calls.slice(i, i + maxParallel);
      
      const batchPromises = batch.map(async (call) => {
        this._onToolExecution.fire({ call });
        
        const startTime = Date.now();
        try {
          const result = await this.executor.execute({
            toolId: call.toolId,
            arguments: this.resolveParams(call.params, call.dependsOn),
            caller: 'agent',
            requestId: call.id,
            context: {
              workspaceRoot: context?.workspaceRoot,
              activeFile: context?.activeFile,
            },
          });
          
          const execResult: ExecutionResult = {
            callId: call.id,
            toolId: call.toolId,
            success: result.success,
            data: result.data,
            error: result.error?.message,
            duration: Date.now() - startTime,
          };
          
          this._onToolExecution.fire({ call, result: execResult });
          return execResult;
          
        } catch (error) {
          const execResult: ExecutionResult = {
            callId: call.id,
            toolId: call.toolId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime,
          };
          
          this._onToolExecution.fire({ call, result: execResult });
          return execResult;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * 串行执行工具（有依赖关系）
   */
  private async executeToolsSequentially(
    calls: ToolCall[],
    context?: AutonomousAgentRequest['context']
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const localResults = new Map<string, any>();
    
    for (const call of calls) {
      this._onToolExecution.fire({ call });
      
      const startTime = Date.now();
      try {
        // 解析参数，替换依赖的结果
        const resolvedParams = this.resolveParams(
          call.params, 
          call.dependsOn,
          localResults
        );
        
        const result = await this.executor.execute({
          toolId: call.toolId,
          arguments: resolvedParams,
          caller: 'agent',
          requestId: call.id,
          context: {
            workspaceRoot: context?.workspaceRoot,
            activeFile: context?.activeFile,
          },
        });
        
        const execResult: ExecutionResult = {
          callId: call.id,
          toolId: call.toolId,
          success: result.success,
          data: result.data,
          error: result.error?.message,
          duration: Date.now() - startTime,
        };
        
        if (result.success) {
          localResults.set(call.id, result.data);
        }
        
        results.push(execResult);
        this._onToolExecution.fire({ call, result: execResult });
        
      } catch (error) {
        const execResult: ExecutionResult = {
          callId: call.id,
          toolId: call.toolId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        };
        
        results.push(execResult);
        this._onToolExecution.fire({ call, result: execResult });
      }
    }
    
    return results;
  }
  
  /**
   * 解析参数，替换依赖引用
   */
  private resolveParams(
    params: Record<string, any>,
    dependsOn?: string[],
    localResults?: Map<string, any>
  ): Record<string, any> {
    const resolved = { ...params };
    
    // 替换 {{callId}} 或 {{callId.path}} 格式的引用
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string') {
        const refMatch = value.match(/\{\{(\w+)(?:\.(.+?))?\}\}/);
        if (refMatch) {
          const [, refId, path] = refMatch;
          let refValue = localResults?.get(refId) ?? this.toolResultsMap.get(refId);
          
          if (refValue !== undefined && path) {
            // 支持路径访问，如 {{callId.data.items}}
            const pathParts = path.split('.');
            for (const part of pathParts) {
              refValue = refValue?.[part];
            }
          }
          
          resolved[key] = refValue ?? value;
        }
      }
    }
    
    return resolved;
  }
  
  /**
   * 观察阶段 - 分析执行结果
   */
  private async observe(thought: ThoughtStep, executions: ExecutionResult[]): Promise<string> {
    // 构建结果摘要
    const resultsSummary = executions.map(e => {
      if (e.success) {
        const dataStr = JSON.stringify(e.data).slice(0, 1000);
        return `✓ ${e.toolId} (${e.duration}ms): ${dataStr}`;
      } else {
        return `✗ ${e.toolId}: ${e.error}`;
      }
    }).join('\n');
    
    // 如果所有调用都失败，返回简单观察
    if (executions.every(e => !e.success)) {
      return `All tool calls failed. Errors: ${executions.map(e => e.error).join('; ')}`;
    }
    
    // 让AI生成观察总结
    try {
      const observePrompt = `Based on the tool execution results, provide a brief observation summary.

Tool Calls:
${thought.toolCalls.map(c => `- ${c.toolId}: ${c.reason}`).join('\n')}

Results:
${resultsSummary}

Provide a 1-2 sentence observation about what was learned or accomplished.`;

      const observation = await this.chatService!.sendMessageSync([
        {
          id: 'observe',
          role: 'user',
          content: observePrompt,
          timestamp: Date.now(),
        },
      ]);
      
      return observation.slice(0, 500);
    } catch {
      // 回退到简单摘要
      const successCount = executions.filter(e => e.success).length;
      return `Executed ${executions.length} tools: ${successCount} succeeded, ${executions.length - successCount} failed.`;
    }
  }
  
  /**
   * 生成最终答案
   */
  private async generateFinalAnswer(request: AutonomousAgentRequest): Promise<string> {
    if (this.iterations.length === 0) {
      return 'No actions were taken for this task.';
    }
    
    const iterationsSummary = this.iterations.map(iter => 
      `Iteration ${iter.iteration}: ${iter.thought.thought}\nResults: ${iter.observation}`
    ).join('\n\n');
    
    const prompt = `Based on the following task execution, provide a comprehensive final answer.

## Original Task
${request.task}

## Execution Summary
${iterationsSummary}

## All Results
${this.formatAccumulatedResults()}

## Instructions
Provide a clear, helpful answer that:
1. Directly addresses the user's task
2. Summarizes what was accomplished
3. Includes relevant data from the tool results
4. Notes any issues or limitations

Respond in the same language as the task.`;

    try {
      return await this.chatService!.sendMessageSync([
        {
          id: 'final',
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      // 回退答案
      const successCount = this.iterations.flatMap(i => i.executions).filter(e => e.success).length;
      return `任务执行完成。共进行 ${this.iterations.length} 轮迭代，成功执行 ${successCount} 次工具调用。`;
    }
  }
  
  /**
   * 创建失败结果
   */
  private createFailedResult(task: string, error: string, startTime: number): AutonomousAgentResult {
    return {
      success: false,
      task,
      iterations: this.iterations,
      finalAnswer: `任务执行失败: ${error}`,
      totalDuration: Date.now() - startTime,
      toolsUsed: [],
      stats: {
        totalIterations: this.iterations.length,
        totalToolCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
      },
    };
  }
  
  /**
   * 取消任务
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.setStatus('cancelled');
    }
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): AutonomousAgentStatus {
    return this.status;
  }
  
  /**
   * 获取当前迭代记录
   */
  getIterations(): IterationRecord[] {
    return [...this.iterations];
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
  private setStatus(status: AutonomousAgentStatus): void {
    this.status = status;
    this._onStatusChange.fire(status);
  }
}
