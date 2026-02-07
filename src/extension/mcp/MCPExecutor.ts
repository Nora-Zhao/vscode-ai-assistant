/**
 * MCP工具执行器
 * 
 * 负责实际执行工具调用，支持多种执行方式：
 * - HTTP请求
 * - 命令行执行
 * - 内置函数
 * - 脚本执行
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  MCPToolDefinition,
  MCPToolCallParams,
  MCPToolResult,
  MCPHttpConfig,
  MCPCommandConfig,
  MCPScriptConfig,
  MCPConfig,
} from './types';
import { MCPRegistry } from './MCPRegistry';
import { builtinFunctions } from './builtins';
import { additionalBuiltinFunctions } from './additionalBuiltins';

// 合并所有内置函数
const allBuiltinFunctions = { ...builtinFunctions, ...additionalBuiltinFunctions };

const execAsync = promisify(exec);

/**
 * 执行历史记录
 */
export interface ExecutionHistory {
  id: string;
  toolId: string;
  toolName: string;
  params: Record<string, any>;
  result: MCPToolResult;
  caller: 'user' | 'agent';
  timestamp: number;
}

/**
 * MCP工具执行器
 */
export class MCPExecutor {
  private static instance: MCPExecutor | null = null;
  
  private context: vscode.ExtensionContext;
  private registry: MCPRegistry;
  private executionHistory: ExecutionHistory[] = [];
  private maxHistorySize = 100;
  
  // 速率限制追踪
  private rateLimitMap: Map<string, number[]> = new Map();
  
  // 事件
  private _onExecutionStart = new vscode.EventEmitter<{ toolId: string; params: any }>();
  private _onExecutionComplete = new vscode.EventEmitter<ExecutionHistory>();
  
  public readonly onExecutionStart = this._onExecutionStart.event;
  public readonly onExecutionComplete = this._onExecutionComplete.event;
  
  private constructor(context: vscode.ExtensionContext, registry: MCPRegistry) {
    this.context = context;
    this.registry = registry;
  }
  
  static getInstance(context: vscode.ExtensionContext, registry: MCPRegistry): MCPExecutor {
    if (!MCPExecutor.instance) {
      MCPExecutor.instance = new MCPExecutor(context, registry);
    }
    return MCPExecutor.instance;
  }
  
  /**
   * 执行工具
   */
  async execute(params: MCPToolCallParams): Promise<MCPToolResult> {
    const startTime = Date.now();
    const requestId = params.requestId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 获取工具定义
    const registration = this.registry.getTool(params.toolId);
    if (!registration) {
      return this.createErrorResult(params.toolId, requestId, 'TOOL_NOT_FOUND', `Tool not found: ${params.toolId}`, startTime);
    }
    
    if (!registration.enabled) {
      return this.createErrorResult(params.toolId, requestId, 'TOOL_DISABLED', `Tool is disabled: ${params.toolId}`, startTime);
    }
    
    const tool = registration.tool;
    
    // 检查调用权限
    if (tool.security?.allowedCallers && !tool.security.allowedCallers.includes(params.caller)) {
      return this.createErrorResult(params.toolId, requestId, 'UNAUTHORIZED', `Caller '${params.caller}' is not allowed to use this tool`, startTime);
    }
    
    // 检查速率限制
    if (tool.security?.rateLimit) {
      if (!this.checkRateLimit(params.toolId, tool.security.rateLimit)) {
        return this.createErrorResult(params.toolId, requestId, 'RATE_LIMITED', 'Rate limit exceeded', startTime);
      }
    }
    
    // 验证参数
    const validation = this.validateParams(tool, params.arguments);
    if (!validation.valid) {
      return this.createErrorResult(params.toolId, requestId, 'INVALID_PARAMS', validation.error!, startTime);
    }
    
    // 如果需要确认，显示确认对话框
    if (tool.security?.requireConfirmation && params.caller === 'agent') {
      const confirmed = await this.requestConfirmation(tool, params.arguments);
      if (!confirmed) {
        return this.createErrorResult(params.toolId, requestId, 'USER_CANCELLED', 'User cancelled execution', startTime);
      }
    }
    
    // 触发执行开始事件
    this._onExecutionStart.fire({ toolId: params.toolId, params: params.arguments });
    
    // 执行工具
    let result: MCPToolResult;
    
    try {
      const data = await this.executeInternal(tool, params);
      
      result = {
        success: true,
        toolId: params.toolId,
        requestId,
        data,
        stats: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      result = this.createErrorResult(
        params.toolId,
        requestId,
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
    
    // 更新统计
    await this.registry.updateToolStats(params.toolId, result.stats.duration, result.success);
    
    // 记录历史
    this.addToHistory({
      id: requestId,
      toolId: params.toolId,
      toolName: tool.name,
      params: params.arguments,
      result,
      caller: params.caller,
      timestamp: startTime,
    });
    
    // 触发执行完成事件
    this._onExecutionComplete.fire(this.executionHistory[this.executionHistory.length - 1]);
    
    return result;
  }
  
  /**
   * 内部执行逻辑
   */
  private async executeInternal(tool: MCPToolDefinition, params: MCPToolCallParams): Promise<any> {
    const execution = tool.execution;
    const config = this.registry.getConfig();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    switch (execution.type) {
      case 'function':
        return this.executeBuiltinFunction(execution.builtinFunction!, params.arguments, {
          workspaceRoot,
          extensionContext: this.context,
        });
      
      case 'http':
        return this.executeHttp(execution.http!, params.arguments, config);
      
      case 'command':
        return this.executeCommand(execution.command!, params.arguments, config, workspaceRoot);
      
      case 'script':
        return this.executeScript(execution.script!, params.arguments);
      
      default:
        throw new Error(`Unsupported execution type: ${execution.type}`);
    }
  }
  
  /**
   * 执行内置函数
   */
  private async executeBuiltinFunction(
    functionName: string,
    args: Record<string, any>,
    context: { workspaceRoot?: string; extensionContext: any }
  ): Promise<any> {
    const fn = allBuiltinFunctions[functionName];
    if (!fn) {
      throw new Error(`Builtin function not found: ${functionName}`);
    }
    
    return fn(args, context);
  }
  
  /**
   * 执行HTTP请求
   */
  private async executeHttp(
    httpConfig: MCPHttpConfig,
    args: Record<string, any>,
    mcpConfig: MCPConfig
  ): Promise<any> {
    // 替换URL中的变量
    let url = this.replaceVariables(httpConfig.url, args, mcpConfig.envVariables);
    
    // 添加查询参数
    if (httpConfig.queryTemplate) {
      const queryParams = new URLSearchParams();
      for (const [key, template] of Object.entries(httpConfig.queryTemplate)) {
        queryParams.set(key, this.replaceVariables(template, args, mcpConfig.envVariables));
      }
      url += (url.includes('?') ? '&' : '?') + queryParams.toString();
    }
    
    // 准备请求头
    const headers: Record<string, string> = { ...httpConfig.headers };
    
    // 处理认证
    if (httpConfig.auth) {
      const token = httpConfig.auth.tokenEnvVar 
        ? mcpConfig.envVariables[httpConfig.auth.tokenEnvVar]
        : undefined;
      
      switch (httpConfig.auth.type) {
        case 'bearer':
          if (token) headers['Authorization'] = `Bearer ${token}`;
          break;
        case 'basic':
          if (token) headers['Authorization'] = `Basic ${token}`;
          break;
        case 'apiKey':
          if (token && httpConfig.auth.headerName) {
            headers[httpConfig.auth.headerName] = token;
          }
          break;
      }
    }
    
    // 准备请求体
    let body: string | undefined;
    if (httpConfig.bodyTemplate) {
      body = this.replaceVariables(httpConfig.bodyTemplate, args, mcpConfig.envVariables);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
    
    // 发送请求
    const controller = new AbortController();
    const timeout = httpConfig.timeout || mcpConfig.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: httpConfig.method,
        headers,
        body,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
      
      // 检查成功条件
      if (httpConfig.responseMapping?.successCondition) {
        const isSuccess = this.evaluateCondition(httpConfig.responseMapping.successCondition, responseData);
        if (!isSuccess) {
          const errorPath = httpConfig.responseMapping.errorPath;
          const errorMessage = errorPath ? this.getNestedValue(responseData, errorPath) : 'Request failed';
          throw new Error(errorMessage);
        }
      }
      
      // 提取结果数据
      if (httpConfig.responseMapping?.resultPath) {
        return this.getNestedValue(responseData, httpConfig.responseMapping.resultPath);
      }
      
      return responseData;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
  
  /**
   * 执行命令行
   */
  private async executeCommand(
    commandConfig: MCPCommandConfig,
    args: Record<string, any>,
    mcpConfig: MCPConfig,
    workspaceRoot?: string
  ): Promise<any> {
    // 替换命令中的变量
    let command = this.replaceVariables(commandConfig.command, args, mcpConfig.envVariables);
    
    // 检查危险命令
    const dangerousPatterns = [
      ...mcpConfig.dangerousCommands,
      ...(commandConfig.dangerousPatterns || []),
    ];
    
    for (const pattern of dangerousPatterns) {
      if (command.toLowerCase().includes(pattern.toLowerCase())) {
        throw new Error(`Dangerous command detected: ${pattern}`);
      }
    }
    
    // 准备执行环境
    const cwd = commandConfig.cwd 
      ? this.replaceVariables(commandConfig.cwd, args, mcpConfig.envVariables)
      : workspaceRoot;
    
    const env = {
      ...process.env,
      ...commandConfig.env,
      ...mcpConfig.envVariables,
    };
    
    const timeout = commandConfig.timeout || mcpConfig.defaultTimeout;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        env,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: commandConfig.shell || (process.platform === 'win32' ? 'cmd' : 'bash'),
      });
      
      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        exitCode: error.code || 1,
      };
    }
  }
  
  /**
   * 执行脚本
   */
  private async executeScript(
    scriptConfig: MCPScriptConfig,
    args: Record<string, any>
  ): Promise<any> {
    switch (scriptConfig.language) {
      case 'javascript':
      case 'typescript':
        return this.executeJavaScript(scriptConfig.code, args, scriptConfig.entryFunction);
      
      default:
        throw new Error(`Unsupported script language: ${scriptConfig.language}`);
    }
  }
  
  /**
   * 执行JavaScript代码
   */
  private async executeJavaScript(
    code: string,
    args: Record<string, any>,
    entryFunction?: string
  ): Promise<any> {
    // 创建沙箱环境
    const sandbox = {
      args,
      console: {
        log: (...msgs: any[]) => console.log('[MCP Script]', ...msgs),
        error: (...msgs: any[]) => console.error('[MCP Script]', ...msgs),
      },
      fetch,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Promise,
      setTimeout,
      clearTimeout,
    };
    
    // 包装代码
    const wrappedCode = `
      (async function(sandbox) {
        const { args, console, fetch, JSON, Math, Date, Array, Object, String, Number, Boolean, Promise, setTimeout, clearTimeout } = sandbox;
        ${code}
        ${entryFunction ? `return await ${entryFunction}(args);` : ''}
      })(sandbox)
    `;
    
    // 执行
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('sandbox', `return ${wrappedCode}`);
    
    return fn(sandbox);
  }
  
  // ============================================
  // 辅助方法
  // ============================================
  
  /**
   * 替换变量
   */
  private replaceVariables(
    template: string,
    args: Record<string, any>,
    envVars: Record<string, string>
  ): string {
    let result = template;
    
    // 替换参数变量 {{paramName}}
    for (const [key, value] of Object.entries(args)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    
    // 替换环境变量 ${ENV_VAR}
    for (const [key, value] of Object.entries(envVars)) {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value);
    }
    
    return result;
  }
  
  /**
   * 获取嵌套属性值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      const fn = new Function('data', `return ${condition}`);
      return fn(data);
    } catch {
      return false;
    }
  }
  
  /**
   * 验证参数
   */
  private validateParams(
    tool: MCPToolDefinition,
    args: Record<string, any>
  ): { valid: boolean; error?: string } {
    for (const param of tool.parameters) {
      const value = args[param.name];
      
      // 检查必填
      if (param.required && (value === undefined || value === null)) {
        return { valid: false, error: `Missing required parameter: ${param.name}` };
      }
      
      if (value === undefined || value === null) continue;
      
      // 类型检查
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (param.type !== 'json' && actualType !== param.type && 
          !(param.type === 'file' && actualType === 'string') &&
          !(param.type === 'code' && actualType === 'string')) {
        return { valid: false, error: `Invalid type for ${param.name}: expected ${param.type}, got ${actualType}` };
      }
      
      // 验证规则
      if (param.validation) {
        const v = param.validation;
        
        if (v.enum && !v.enum.includes(value)) {
          return { valid: false, error: `Invalid value for ${param.name}: must be one of ${v.enum.join(', ')}` };
        }
        
        if (v.pattern && !new RegExp(v.pattern).test(value)) {
          return { valid: false, error: `Invalid format for ${param.name}` };
        }
        
        if (typeof value === 'number') {
          if (v.min !== undefined && value < v.min) {
            return { valid: false, error: `${param.name} must be at least ${v.min}` };
          }
          if (v.max !== undefined && value > v.max) {
            return { valid: false, error: `${param.name} must be at most ${v.max}` };
          }
        }
        
        if (typeof value === 'string') {
          if (v.min !== undefined && value.length < v.min) {
            return { valid: false, error: `${param.name} must be at least ${v.min} characters` };
          }
          if (v.max !== undefined && value.length > v.max) {
            return { valid: false, error: `${param.name} must be at most ${v.max} characters` };
          }
        }
      }
    }
    
    return { valid: true };
  }
  
  /**
   * 检查速率限制
   */
  private checkRateLimit(toolId: string, limit: number): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1分钟窗口
    
    let timestamps = this.rateLimitMap.get(toolId) || [];
    timestamps = timestamps.filter(t => t > windowStart);
    
    if (timestamps.length >= limit) {
      return false;
    }
    
    timestamps.push(now);
    this.rateLimitMap.set(toolId, timestamps);
    return true;
  }
  
  /**
   * 请求用户确认
   */
  private async requestConfirmation(
    tool: MCPToolDefinition,
    args: Record<string, any>
  ): Promise<boolean> {
    const argsStr = Object.entries(args)
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
      .join('\n');
    
    const result = await vscode.window.showWarningMessage(
      `MCP工具 "${tool.name}" 请求执行:\n\n${argsStr}\n\n是否允许?`,
      { modal: true },
      '允许',
      '拒绝'
    );
    
    return result === '允许';
  }
  
  /**
   * 创建错误结果
   */
  private createErrorResult(
    toolId: string,
    requestId: string,
    code: string,
    message: string,
    startTime: number
  ): MCPToolResult {
    return {
      success: false,
      toolId,
      requestId,
      error: { code, message },
      stats: {
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      },
    };
  }
  
  /**
   * 添加到历史记录
   */
  private addToHistory(entry: ExecutionHistory): void {
    this.executionHistory.push(entry);
    
    // 限制历史大小
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }
  
  /**
   * 获取执行历史
   */
  getExecutionHistory(limit?: number): ExecutionHistory[] {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }
  
  /**
   * 清除执行历史
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}
