/**
 * MCP解析器
 * 
 * 解析用户输入中的@语法，识别MCP相关指令
 * 
 * 支持的语法：
 * - @mcp                    显示MCP帮助
 * - @mcp:list               列出所有可用工具
 * - @mcp:tool_id            直接调用指定工具
 * - @mcp:tool_id param=val  带参数调用工具
 * - @mcp:agent 任务描述     让Agent自动选择工具执行任务
 * - @mcp:search 关键词      搜索工具
 */

import { MCPToolCallParams, MCPAgentRequest } from './types';

/**
 * 解析结果类型
 */
export type MCPParseResultType = 
  | 'help'           // 显示帮助
  | 'list'           // 列出工具
  | 'search'         // 搜索工具
  | 'call'           // 直接调用工具
  | 'agent'          // Agent模式
  | 'manage'         // 管理面板
  | 'history'        // 查看历史
  | 'none';          // 非MCP指令

/**
 * 解析结果
 */
export interface MCPParseResult {
  type: MCPParseResultType;
  
  // 工具调用参数
  toolId?: string;
  params?: Record<string, any>;
  
  // Agent请求
  agentTask?: string;
  
  // 搜索关键词
  searchQuery?: string;
  
  // 原始输入
  originalInput: string;
  
  // 剩余文本（非MCP部分）
  remainingText?: string;
}

/**
 * MCP解析器
 */
export class MCPParser {
  // @mcp 指令的正则表达式
  private static readonly MCP_PATTERN = /^@mcp(?::(\w+))?(?:\s+(.*))?$/i;
  
  // 参数解析正则
  private static readonly PARAM_PATTERN = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  
  // JSON参数检测
  private static readonly JSON_PATTERN = /^\{[\s\S]*\}$/;
  
  /**
   * 解析用户输入
   */
  static parse(input: string): MCPParseResult {
    const trimmed = input.trim();
    
    // 检查是否以@mcp开头
    if (!trimmed.toLowerCase().startsWith('@mcp')) {
      return { type: 'none', originalInput: input };
    }
    
    const match = trimmed.match(this.MCP_PATTERN);
    if (!match) {
      return { type: 'none', originalInput: input };
    }
    
    const command = match[1]?.toLowerCase();
    const rest = match[2]?.trim() || '';
    
    // 无子命令：显示帮助
    if (!command) {
      return { type: 'help', originalInput: input };
    }
    
    // 特殊命令
    switch (command) {
      case 'list':
        return { type: 'list', originalInput: input };
      
      case 'search':
        return { 
          type: 'search', 
          searchQuery: rest || undefined,
          originalInput: input 
        };
      
      case 'agent':
        return {
          type: 'agent',
          agentTask: rest || undefined,
          originalInput: input,
        };
      
      case 'manage':
      case 'config':
      case 'settings':
        return { type: 'manage', originalInput: input };
      
      case 'history':
        return { type: 'history', originalInput: input };
      
      default:
        // 假设是工具ID
        return this.parseToolCall(command, rest, input);
    }
  }
  
  /**
   * 解析工具调用
   */
  private static parseToolCall(
    toolId: string,
    paramString: string,
    originalInput: string
  ): MCPParseResult {
    const params: Record<string, any> = {};
    
    if (paramString) {
      // 尝试解析JSON参数
      if (this.JSON_PATTERN.test(paramString)) {
        try {
          Object.assign(params, JSON.parse(paramString));
        } catch {
          // JSON解析失败，尝试键值对解析
          this.parseKeyValueParams(paramString, params);
        }
      } else {
        // 键值对解析
        this.parseKeyValueParams(paramString, params);
      }
    }
    
    return {
      type: 'call',
      toolId,
      params,
      originalInput,
    };
  }
  
  /**
   * 解析键值对参数
   */
  private static parseKeyValueParams(
    paramString: string,
    params: Record<string, any>
  ): void {
    let match;
    const regex = new RegExp(this.PARAM_PATTERN.source, 'g');
    
    while ((match = regex.exec(paramString)) !== null) {
      const key = match[1];
      // 优先级：双引号 > 单引号 > 无引号
      const value = match[2] ?? match[3] ?? match[4];
      
      // 尝试解析类型
      params[key] = this.parseValue(value);
    }
    
    // 如果没有解析到任何参数，且有内容，作为默认参数
    if (Object.keys(params).length === 0 && paramString.trim()) {
      // 检查是否是简单的值列表
      const values = paramString.split(/\s+/);
      if (values.length === 1) {
        params['_default'] = this.parseValue(values[0]);
      } else {
        params['_args'] = values.map(v => this.parseValue(v));
      }
    }
  }
  
  /**
   * 解析值类型
   */
  private static parseValue(value: string): any {
    // 布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 数字
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // JSON数组或对象
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  }
  
  /**
   * 检查输入是否包含MCP指令
   */
  static isMCPCommand(input: string): boolean {
    return input.trim().toLowerCase().startsWith('@mcp');
  }
  
  /**
   * 获取MCP帮助文本
   */
  static getHelpText(): string {
    return `# MCP 工具使用帮助

## 基本语法
\`@mcp\` - 显示此帮助
\`@mcp:list\` - 列出所有可用工具
\`@mcp:search 关键词\` - 搜索工具
\`@mcp:manage\` - 打开工具管理面板
\`@mcp:history\` - 查看执行历史

## 直接调用工具
\`@mcp:工具ID\` - 调用指定工具（无参数）
\`@mcp:工具ID param1=value1 param2=value2\` - 带参数调用
\`@mcp:工具ID {"param1": "value1"}\` - JSON参数格式

## Agent模式
\`@mcp:agent 你的任务描述\` - 让AI自动选择工具完成任务

## 示例
\`@mcp:builtin_read_file filePath=src/index.ts\`
\`@mcp:builtin_search_code query=TODO include="**/*.ts"\`
\`@mcp:agent 帮我查找所有包含TODO的文件\`
`;
  }
  
  /**
   * 将解析结果转换为工具调用参数
   */
  static toToolCallParams(
    result: MCPParseResult,
    context?: MCPToolCallParams['context']
  ): MCPToolCallParams | null {
    if (result.type !== 'call' || !result.toolId) {
      return null;
    }
    
    // 处理默认参数
    const params = { ...result.params };
    if (params['_default'] !== undefined) {
      // 将_default映射到工具的第一个必需参数
      // 这需要知道工具定义，所以暂时保留
    }
    
    return {
      toolId: result.toolId,
      arguments: params,
      caller: 'user',
      context,
    };
  }
  
  /**
   * 将解析结果转换为Agent请求
   */
  static toAgentRequest(
    result: MCPParseResult,
    context?: MCPAgentRequest['context']
  ): MCPAgentRequest | null {
    if (result.type !== 'agent' || !result.agentTask) {
      return null;
    }
    
    return {
      task: result.agentTask,
      context,
    };
  }
  
  /**
   * 格式化工具调用为显示文本
   */
  static formatToolCall(toolId: string, params: Record<string, any>): string {
    const paramStr = Object.entries(params)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    
    return paramStr ? `@mcp:${toolId} ${paramStr}` : `@mcp:${toolId}`;
  }
  
  /**
   * 自动补全建议
   */
  static getCompletions(
    input: string,
    availableTools: Array<{ id: string; name: string; description: string }>
  ): Array<{ text: string; displayText: string; description: string }> {
    const completions: Array<{ text: string; displayText: string; description: string }> = [];
    
    // 基本命令补全
    if (input === '@' || input === '@m' || input === '@mc' || input === '@mcp') {
      completions.push(
        { text: '@mcp:list', displayText: '@mcp:list', description: '列出所有工具' },
        { text: '@mcp:search ', displayText: '@mcp:search', description: '搜索工具' },
        { text: '@mcp:agent ', displayText: '@mcp:agent', description: 'Agent模式' },
        { text: '@mcp:manage', displayText: '@mcp:manage', description: '管理工具' },
      );
    }
    
    // 工具ID补全
    if (input.match(/^@mcp:(\w*)$/i)) {
      const prefix = input.replace(/^@mcp:/i, '').toLowerCase();
      
      for (const tool of availableTools) {
        if (tool.id.toLowerCase().startsWith(prefix)) {
          completions.push({
            text: `@mcp:${tool.id}`,
            displayText: tool.name,
            description: tool.description,
          });
        }
      }
    }
    
    return completions;
  }
}
