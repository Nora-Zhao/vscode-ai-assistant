/**
 * MCP工具注册管理器
 * 
 * 负责工具的注册、存储、查询、启用/禁用等管理功能
 */

import * as vscode from 'vscode';
import {
  MCPToolDefinition,
  MCPToolRegistration,
  MCPToolCategory,
  MCPToolStatus,
  MCPConfig,
} from './types';
import { getBuiltinTools } from './builtins';
import { getAdditionalBuiltinTools } from './additionalBuiltins';

const STORAGE_KEY = 'aiAssistant.mcp.tools';
const CONFIG_KEY = 'aiAssistant.mcp.config';

/**
 * MCP工具注册管理器
 */
export class MCPRegistry {
  private static instance: MCPRegistry | null = null;
  
  private context: vscode.ExtensionContext;
  private tools: Map<string, MCPToolRegistration> = new Map();
  private config: MCPConfig;
  
  // 事件发射器
  private _onToolsChanged = new vscode.EventEmitter<void>();
  public readonly onToolsChanged = this._onToolsChanged.event;
  
  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = this.loadConfig();
    this.loadTools();
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(context: vscode.ExtensionContext): MCPRegistry {
    if (!MCPRegistry.instance) {
      MCPRegistry.instance = new MCPRegistry(context);
    }
    return MCPRegistry.instance;
  }
  
  // ============================================
  // 配置管理
  // ============================================
  
  /**
   * 加载配置
   */
  private loadConfig(): MCPConfig {
    const saved = this.context.globalState.get<MCPConfig>(CONFIG_KEY);
    return {
      enabled: true,
      maxToolsPerRequest: 5,
      defaultTimeout: 30000,
      logAllExecutions: true,
      envVariables: {},
      dangerousCommands: [
        'rm -rf',
        'format',
        'del /s',
        'rmdir /s',
        'drop database',
        'truncate table',
      ],
      ...saved,
    };
  }
  
  /**
   * 保存配置
   */
  private async saveConfig(): Promise<void> {
    await this.context.globalState.update(CONFIG_KEY, this.config);
  }
  
  /**
   * 获取配置
   */
  getConfig(): MCPConfig {
    return { ...this.config };
  }
  
  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<MCPConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
  }
  
  // ============================================
  // 工具加载和保存
  // ============================================
  
  /**
   * 加载工具
   */
  private loadTools(): void {
    // 加载内置工具
    const builtinTools = getBuiltinTools();
    for (const tool of builtinTools) {
      this.tools.set(tool.id, {
        tool,
        source: 'builtin',
        enabled: true,
      });
    }
    
    // 加载额外的内置工具
    const additionalTools = getAdditionalBuiltinTools();
    for (const tool of additionalTools) {
      this.tools.set(tool.id, {
        tool,
        source: 'builtin',
        enabled: true,
      });
    }
    
    // 加载用户工具
    const savedTools = this.context.globalState.get<MCPToolRegistration[]>(STORAGE_KEY) || [];
    for (const registration of savedTools) {
      // 不覆盖内置工具
      if (!this.tools.has(registration.tool.id) || registration.source !== 'builtin') {
        this.tools.set(registration.tool.id, registration);
      }
    }
    
    const totalBuiltin = builtinTools.length + additionalTools.length;
    console.log(`[MCPRegistry] Loaded ${this.tools.size} tools (${totalBuiltin} builtin)`);
  }
  
  /**
   * 保存工具
   */
  private async saveTools(): Promise<void> {
    // 只保存非内置工具
    const toSave = Array.from(this.tools.values()).filter(r => r.source !== 'builtin');
    await this.context.globalState.update(STORAGE_KEY, toSave);
    this._onToolsChanged.fire();
  }
  
  // ============================================
  // 工具注册和管理
  // ============================================
  
  /**
   * 注册新工具
   */
  async registerTool(
    tool: MCPToolDefinition,
    source: 'user' | 'marketplace' | 'import' = 'user'
  ): Promise<{ success: boolean; error?: string }> {
    // 验证工具定义
    const validation = this.validateToolDefinition(tool);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // 检查ID是否已存在
    if (this.tools.has(tool.id)) {
      const existing = this.tools.get(tool.id)!;
      if (existing.source === 'builtin') {
        return { success: false, error: `Cannot override builtin tool: ${tool.id}` };
      }
    }
    
    // 设置元数据
    const now = Date.now();
    tool.metadata = {
      ...tool.metadata,
      status: 'active',
      createdAt: tool.metadata?.createdAt || now,
      updatedAt: now,
    };
    
    // 注册工具
    this.tools.set(tool.id, {
      tool,
      source,
      enabled: true,
    });
    
    await this.saveTools();
    console.log(`[MCPRegistry] Registered tool: ${tool.id}`);
    
    return { success: true };
  }
  
  /**
   * 更新工具
   */
  async updateTool(tool: MCPToolDefinition): Promise<{ success: boolean; error?: string }> {
    const existing = this.tools.get(tool.id);
    if (!existing) {
      return { success: false, error: `Tool not found: ${tool.id}` };
    }
    
    if (existing.source === 'builtin') {
      return { success: false, error: `Cannot modify builtin tool: ${tool.id}` };
    }
    
    // 验证工具定义
    const validation = this.validateToolDefinition(tool);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // 更新工具
    tool.metadata = {
      ...existing.tool.metadata,
      ...tool.metadata,
      updatedAt: Date.now(),
    };
    
    this.tools.set(tool.id, {
      ...existing,
      tool,
    });
    
    await this.saveTools();
    console.log(`[MCPRegistry] Updated tool: ${tool.id}`);
    
    return { success: true };
  }
  
  /**
   * 删除工具
   */
  async deleteTool(toolId: string): Promise<{ success: boolean; error?: string }> {
    const existing = this.tools.get(toolId);
    if (!existing) {
      return { success: false, error: `Tool not found: ${toolId}` };
    }
    
    if (existing.source === 'builtin') {
      return { success: false, error: `Cannot delete builtin tool: ${toolId}` };
    }
    
    this.tools.delete(toolId);
    await this.saveTools();
    console.log(`[MCPRegistry] Deleted tool: ${toolId}`);
    
    return { success: true };
  }
  
  /**
   * 启用/禁用工具
   */
  async toggleTool(toolId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    const existing = this.tools.get(toolId);
    if (!existing) {
      return { success: false, error: `Tool not found: ${toolId}` };
    }
    
    existing.enabled = enabled;
    await this.saveTools();
    console.log(`[MCPRegistry] Tool ${toolId} ${enabled ? 'enabled' : 'disabled'}`);
    
    return { success: true };
  }
  
  /**
   * 更新工具状态
   */
  async updateToolStatus(toolId: string, status: MCPToolStatus): Promise<void> {
    const existing = this.tools.get(toolId);
    if (existing) {
      existing.tool.metadata.status = status;
      await this.saveTools();
    }
  }
  
  /**
   * 更新工具使用统计
   */
  async updateToolStats(
    toolId: string,
    executionTime: number,
    success: boolean
  ): Promise<void> {
    const existing = this.tools.get(toolId);
    if (existing) {
      const meta = existing.tool.metadata;
      meta.lastUsedAt = Date.now();
      meta.usageCount = (meta.usageCount || 0) + 1;
      
      // 计算平均执行时间
      const prevAvg = meta.averageExecutionTime || 0;
      const prevCount = meta.usageCount - 1;
      meta.averageExecutionTime = (prevAvg * prevCount + executionTime) / meta.usageCount;
      
      // 计算成功率
      const prevSuccessRate = meta.successRate || 1;
      meta.successRate = (prevSuccessRate * prevCount + (success ? 1 : 0)) / meta.usageCount;
      
      await this.saveTools();
    }
  }
  
  // ============================================
  // 工具查询
  // ============================================
  
  /**
   * 获取所有工具
   */
  getAllTools(): MCPToolRegistration[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * 获取启用的工具
   */
  getEnabledTools(): MCPToolRegistration[] {
    return Array.from(this.tools.values()).filter(r => r.enabled);
  }
  
  /**
   * 根据ID获取工具
   */
  getTool(toolId: string): MCPToolRegistration | undefined {
    return this.tools.get(toolId);
  }
  
  /**
   * 根据类别获取工具
   */
  getToolsByCategory(category: MCPToolCategory): MCPToolRegistration[] {
    return Array.from(this.tools.values()).filter(
      r => r.tool.category === category && r.enabled
    );
  }
  
  /**
   * 搜索工具
   */
  searchTools(query: string): MCPToolRegistration[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(r => {
      const tool = r.tool;
      return (
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
        tool.category.toLowerCase().includes(lowerQuery)
      );
    });
  }
  
  /**
   * 获取适合Agent使用的工具列表
   * 返回启用且允许Agent调用的工具，按优先级排序
   */
  getAgentTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(r => {
        if (!r.enabled) return false;
        const security = r.tool.security;
        if (!security?.allowedCallers) return true;
        return security.allowedCallers.includes('agent');
      })
      .sort((a, b) => {
        const priorityA = a.tool.aiHints?.priority || 50;
        const priorityB = b.tool.aiHints?.priority || 50;
        return priorityB - priorityA;
      })
      .map(r => r.tool);
  }
  
  // ============================================
  // 导入导出
  // ============================================
  
  /**
   * 导出工具
   */
  exportTools(toolIds?: string[]): string {
    let toExport: MCPToolRegistration[];
    
    if (toolIds && toolIds.length > 0) {
      toExport = toolIds
        .map(id => this.tools.get(id))
        .filter((r): r is MCPToolRegistration => r !== undefined && r.source !== 'builtin');
    } else {
      toExport = Array.from(this.tools.values()).filter(r => r.source !== 'builtin');
    }
    
    return JSON.stringify(toExport.map(r => r.tool), null, 2);
  }
  
  /**
   * 导入工具
   */
  async importTools(data: string): Promise<{ 
    success: boolean; 
    imported: number; 
    errors: string[] 
  }> {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      const tools = JSON.parse(data) as MCPToolDefinition[];
      
      if (!Array.isArray(tools)) {
        return { success: false, imported: 0, errors: ['Invalid format: expected array'] };
      }
      
      for (const tool of tools) {
        const result = await this.registerTool(tool, 'import');
        if (result.success) {
          imported++;
        } else {
          errors.push(`${tool.id || 'unknown'}: ${result.error}`);
        }
      }
      
      return { success: errors.length === 0, imported, errors };
    } catch (e) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`] 
      };
    }
  }
  
  // ============================================
  // 验证
  // ============================================
  
  /**
   * 验证工具定义
   */
  validateToolDefinition(tool: MCPToolDefinition): { valid: boolean; error?: string } {
    // 基本字段验证
    if (!tool.id || typeof tool.id !== 'string') {
      return { valid: false, error: 'Tool ID is required' };
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(tool.id)) {
      return { valid: false, error: 'Tool ID must start with letter and contain only alphanumeric, underscore, or hyphen' };
    }
    
    if (!tool.name || typeof tool.name !== 'string') {
      return { valid: false, error: 'Tool name is required' };
    }
    
    if (!tool.description || typeof tool.description !== 'string') {
      return { valid: false, error: 'Tool description is required' };
    }
    
    if (!tool.version || typeof tool.version !== 'string') {
      return { valid: false, error: 'Tool version is required' };
    }
    
    // 执行配置验证
    if (!tool.execution || !tool.execution.type) {
      return { valid: false, error: 'Execution configuration is required' };
    }
    
    const execType = tool.execution.type;
    
    if (execType === 'http' && !tool.execution.http) {
      return { valid: false, error: 'HTTP configuration is required for http execution type' };
    }
    
    if (execType === 'command' && !tool.execution.command) {
      return { valid: false, error: 'Command configuration is required for command execution type' };
    }
    
    if (execType === 'script' && !tool.execution.script) {
      return { valid: false, error: 'Script configuration is required for script execution type' };
    }
    
    if (execType === 'function' && !tool.execution.builtinFunction) {
      return { valid: false, error: 'Builtin function name is required for function execution type' };
    }
    
    // 参数验证
    if (!Array.isArray(tool.parameters)) {
      return { valid: false, error: 'Parameters must be an array' };
    }
    
    for (const param of tool.parameters) {
      if (!param.name || !param.type || !param.description) {
        return { valid: false, error: `Invalid parameter definition: ${param.name || 'unnamed'}` };
      }
    }
    
    // 返回值验证
    if (!tool.returns || !tool.returns.type || !tool.returns.description) {
      return { valid: false, error: 'Returns definition is required' };
    }
    
    return { valid: true };
  }
  
  /**
   * 清理所有用户工具
   */
  async clearUserTools(): Promise<void> {
    const builtinIds = Array.from(this.tools.entries())
      .filter(([_, r]) => r.source === 'builtin')
      .map(([id, _]) => id);
    
    this.tools.clear();
    
    // 重新加载内置工具
    const builtinTools = getBuiltinTools();
    for (const tool of builtinTools) {
      this.tools.set(tool.id, {
        tool,
        source: 'builtin',
        enabled: true,
      });
    }
    
    await this.saveTools();
    console.log('[MCPRegistry] Cleared all user tools');
  }
}
