/**
 * MCP (Model Context Protocol) 类型定义
 * 
 * MCP是一个让AI模型与外部工具交互的协议
 * 支持用户注册自定义工具，Agent自动选择工具执行任务
 */

// ============================================
// 基础类型
// ============================================

/**
 * 参数类型
 */
export type MCPParameterType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'array' 
  | 'object'
  | 'file'      // 文件路径
  | 'code'      // 代码片段
  | 'json';     // JSON数据

/**
 * 工具类别
 */
export type MCPToolCategory = 
  | 'file'        // 文件操作
  | 'code'        // 代码相关
  | 'api'         // API调用
  | 'database'    // 数据库操作
  | 'shell'       // Shell命令
  | 'web'         // Web请求
  | 'ai'          // AI服务
  | 'utility'     // 工具类
  | 'test'        // 测试相关
  | 'diagram'     // 图表相关
  | 'git'         // Git操作
  | 'custom';     // 自定义

/**
 * 执行方式
 */
export type MCPExecutionType = 
  | 'http'        // HTTP请求
  | 'command'     // 命令行执行
  | 'function'    // 内置函数
  | 'script'      // 脚本执行
  | 'websocket';  // WebSocket

/**
 * 工具状态
 */
export type MCPToolStatus = 'active' | 'inactive' | 'error' | 'testing';

// ============================================
// 参数定义
// ============================================

/**
 * 参数验证规则
 */
export interface MCPParameterValidation {
  pattern?: string;          // 正则表达式
  min?: number;              // 最小值（数字）或最小长度（字符串）
  max?: number;              // 最大值（数字）或最大长度（字符串）
  enum?: string[];           // 枚举值
  customValidator?: string;  // 自定义验证函数名
}

/**
 * 工具参数定义
 */
export interface MCPToolParameter {
  name: string;
  type: MCPParameterType;
  description: string;
  required: boolean;
  default?: any;
  validation?: MCPParameterValidation;
  // 数组类型的子项定义
  items?: {
    type: MCPParameterType;
    description?: string;
  };
  // 对象类型的属性定义
  properties?: Record<string, MCPToolParameter>;
}

// ============================================
// HTTP配置
// ============================================

/**
 * HTTP请求配置
 */
export interface MCPHttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  // 请求体模板，支持 {{paramName}} 变量替换
  bodyTemplate?: string;
  // URL参数模板
  queryTemplate?: Record<string, string>;
  // 响应处理
  responseMapping?: {
    resultPath?: string;      // 结果数据路径，如 "data.result"
    errorPath?: string;       // 错误信息路径
    successCondition?: string; // 成功条件表达式
  };
  // 超时设置（毫秒）
  timeout?: number;
  // 认证配置
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apiKey';
    tokenEnvVar?: string;     // 环境变量名
    headerName?: string;      // API Key header名
  };
}

// ============================================
// 命令行配置
// ============================================

/**
 * 命令行执行配置
 */
export interface MCPCommandConfig {
  // 命令模板，支持 {{paramName}} 变量替换
  command: string;
  // 工作目录
  cwd?: string;
  // 环境变量
  env?: Record<string, string>;
  // Shell类型
  shell?: 'bash' | 'powershell' | 'cmd' | 'sh';
  // 超时设置（毫秒）
  timeout?: number;
  // 是否需要确认执行
  requireConfirmation?: boolean;
  // 危险命令检测
  dangerousPatterns?: string[];
}

// ============================================
// 脚本配置
// ============================================

/**
 * 脚本执行配置
 */
export interface MCPScriptConfig {
  // 脚本语言
  language: 'javascript' | 'typescript' | 'python' | 'shell';
  // 脚本内容
  code: string;
  // 入口函数名
  entryFunction?: string;
  // 依赖包
  dependencies?: string[];
  // 超时设置
  timeout?: number;
}

// ============================================
// WebSocket配置
// ============================================

/**
 * WebSocket配置
 */
export interface MCPWebSocketConfig {
  url: string;
  // 发送消息模板
  messageTemplate: string;
  // 响应处理
  responseHandler?: string;
  // 超时设置
  timeout?: number;
}

// ============================================
// 工具定义
// ============================================

/**
 * MCP工具完整定义
 */
export interface MCPToolDefinition {
  // 基本信息
  id: string;                       // 唯一标识符
  name: string;                     // 显示名称
  description: string;              // 详细描述
  version: string;                  // 版本号
  author?: string;                  // 作者
  
  // 分类和标签
  category: MCPToolCategory;
  tags?: string[];
  
  // 参数定义
  parameters: MCPToolParameter[];
  
  // 返回值定义
  returns: {
    type: MCPParameterType;
    description: string;
    schema?: Record<string, any>;   // JSON Schema
  };
  
  // 执行配置
  execution: {
    type: MCPExecutionType;
    http?: MCPHttpConfig;
    command?: MCPCommandConfig;
    script?: MCPScriptConfig;
    websocket?: MCPWebSocketConfig;
    // 内置函数名
    builtinFunction?: string;
  };
  
  // 元数据
  metadata: {
    status: MCPToolStatus;
    createdAt: number;
    updatedAt: number;
    lastUsedAt?: number;
    usageCount?: number;
    averageExecutionTime?: number;
    successRate?: number;
  };
  
  // AI提示
  aiHints?: {
    // 何时使用此工具的描述
    whenToUse?: string;
    // 使用示例
    examples?: Array<{
      input: Record<string, any>;
      output: any;
      description?: string;
    }>;
    // 与其他工具的关系
    relatedTools?: string[];
    // 优先级（Agent选择时使用）
    priority?: number;
  };
  
  // 安全设置
  security?: {
    // 是否需要用户确认
    requireConfirmation?: boolean;
    // 允许的调用者
    allowedCallers?: ('user' | 'agent')[];
    // 速率限制（每分钟最大调用次数）
    rateLimit?: number;
    // 敏感参数（需要加密存储）
    sensitiveParams?: string[];
    // 危险命令模式（需要额外警告）
    dangerousPatterns?: string[];
  };
}

// ============================================
// 执行相关
// ============================================

/**
 * 工具调用参数
 */
export interface MCPToolCallParams {
  toolId: string;
  arguments: Record<string, any>;
  // 调用来源
  caller: 'user' | 'agent';
  // 请求ID
  requestId?: string;
  // 上下文信息
  context?: {
    sessionId?: string;
    messageId?: string;
    workspaceRoot?: string;
    activeFile?: string;
  };
}

/**
 * 工具执行结果
 */
export interface MCPToolResult {
  success: boolean;
  toolId: string;
  requestId?: string;
  
  // 成功时的数据
  data?: any;
  
  // 失败时的错误信息
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // 执行统计
  stats: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  
  // 日志
  logs?: string[];
}

// ============================================
// 注册和管理
// ============================================

/**
 * 工具注册信息
 */
export interface MCPToolRegistration {
  tool: MCPToolDefinition;
  // 注册来源
  source: 'builtin' | 'user' | 'marketplace' | 'import';
  // 是否启用
  enabled: boolean;
  // 自定义配置覆盖
  configOverrides?: Partial<MCPToolDefinition['execution']>;
}

/**
 * MCP配置
 */
export interface MCPConfig {
  // 是否启用MCP功能
  enabled: boolean;
  // Agent自动选择工具时的最大工具数
  maxToolsPerRequest: number;
  // 默认超时
  defaultTimeout: number;
  // 是否记录所有执行日志
  logAllExecutions: boolean;
  // 环境变量（用于API密钥等）
  envVariables: Record<string, string>;
  // 危险命令黑名单
  dangerousCommands: string[];
}

// ============================================
// Agent相关
// ============================================

/**
 * Agent工具选择结果
 */
export interface MCPAgentToolSelection {
  toolId: string;
  confidence: number;        // 置信度 0-1
  reason: string;            // 选择原因
  suggestedParams?: Record<string, any>;
}

/**
 * Agent任务请求
 */
export interface MCPAgentRequest {
  task: string;              // 用户任务描述
  context?: {
    workspaceRoot?: string;
    activeFile?: string;
    selectedCode?: string;
    recentTools?: string[];  // 最近使用的工具
  };
  // 约束条件
  constraints?: {
    allowedCategories?: MCPToolCategory[];
    excludeTools?: string[];
    maxExecutions?: number;
  };
}

/**
 * Agent任务结果
 */
export interface MCPAgentResult {
  success: boolean;
  task: string;
  // 执行计划
  plan?: Array<{
    step: number;
    toolId: string;
    description: string;
    params: Record<string, any>;
  }>;
  // 执行结果
  executions: Array<{
    toolId: string;
    result: MCPToolResult;
  }>;
  // 最终回答
  answer?: string;
  // 执行摘要
  summary?: string;
}

// ============================================
// WebView消息类型
// ============================================

/**
 * MCP相关的WebView消息
 */
export type MCPWebViewMessage = 
  | { type: 'mcp:getTools' }
  | { type: 'mcp:getTool'; toolId: string }
  | { type: 'mcp:registerTool'; tool: MCPToolDefinition }
  | { type: 'mcp:updateTool'; tool: MCPToolDefinition }
  | { type: 'mcp:deleteTool'; toolId: string }
  | { type: 'mcp:toggleTool'; toolId: string; enabled: boolean }
  | { type: 'mcp:testTool'; toolId: string; testParams: Record<string, any> }
  | { type: 'mcp:executeTool'; params: MCPToolCallParams }
  | { type: 'mcp:agentRequest'; request: MCPAgentRequest }
  | { type: 'mcp:getConfig' }
  | { type: 'mcp:updateConfig'; config: Partial<MCPConfig> }
  | { type: 'mcp:importTools'; data: string }
  | { type: 'mcp:exportTools'; toolIds?: string[] }
  | { type: 'mcp:getExecutionHistory'; limit?: number };

// ============================================
// 内置工具接口
// ============================================

/**
 * 内置工具函数签名
 */
export type MCPBuiltinFunction = (
  params: Record<string, any>,
  context: {
    workspaceRoot?: string;
    extensionContext: any;
  }
) => Promise<any>;

/**
 * 内置工具注册表
 */
export interface MCPBuiltinRegistry {
  [functionName: string]: MCPBuiltinFunction;
}
