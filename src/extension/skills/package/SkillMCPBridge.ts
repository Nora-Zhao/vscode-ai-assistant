/**
 * Skill MCP 桥接层
 * 
 * 提供skill包与MCP系统之间的双向通信：
 * - 让skill可以调用MCP工具
 * - 让skill可以注册自己的工具到MCP
 */

import * as vscode from 'vscode';
import { SkillMCPBridge, SkillToolResult, InstalledSkill } from './types';
import { MCPRegistry, MCPExecutor, MCPToolDefinition } from '../../mcp';

/**
 * Skill MCP 桥接器实现
 */
export class SkillMCPBridgeImpl implements SkillMCPBridge {
  private skill: InstalledSkill;
  private registry: MCPRegistry;
  private executor: MCPExecutor;
  private registeredTools: Set<string> = new Set();

  constructor(
    skill: InstalledSkill,
    registry: MCPRegistry,
    executor: MCPExecutor
  ) {
    this.skill = skill;
    this.registry = registry;
    this.executor = executor;
  }

  /**
   * 调用MCP工具
   */
  async call(toolId: string, params: Record<string, any>): Promise<SkillToolResult> {
    const startTime = Date.now();

    try {
      // 检查skill是否有权限调用此工具
      const allowedTools = this.skill.manifest.mcpTools;
      if (allowedTools && !allowedTools.includes(toolId) && !allowedTools.includes('*')) {
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Skill "${this.skill.manifest.name}" 无权调用工具 "${toolId}"`,
          },
          duration: Date.now() - startTime,
        };
      }

      // 检查工具是否存在
      const tool = this.registry.getTool(toolId);
      if (!tool) {
        return {
          success: false,
          error: {
            code: 'TOOL_NOT_FOUND',
            message: `工具 "${toolId}" 不存在`,
          },
          duration: Date.now() - startTime,
        };
      }

      // 执行工具
      const result = await this.executor.execute({
        toolId,
        arguments: params,
        caller: 'agent', // skill作为agent身份调用
        context: {
          sessionId: `skill_${this.skill.manifest.id}`,
        },
      });

      return {
        success: result.success,
        data: result.data,
        error: result.error ? {
          code: result.error.code,
          message: result.error.message,
        } : undefined,
        duration: result.stats.duration,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : '未知错误',
        },
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 获取可用工具列表
   */
  async listTools(): Promise<MCPToolDefinition[]> {
    const allTools = this.registry.getAllTools();
    const allowedTools = this.skill.manifest.mcpTools;

    // 如果没有限制或允许所有工具
    if (!allowedTools || allowedTools.includes('*')) {
      return allTools.filter(t => t.enabled).map(t => t.tool);
    }

    // 返回允许的工具
    return allTools
      .filter(t => t.enabled && allowedTools.includes(t.tool.id))
      .map(t => t.tool);
  }

  /**
   * 注册工具到MCP
   */
  async registerTool(tool: MCPToolDefinition): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查skill是否有权限注册工具
      const permissions = this.skill.manifest.permissions || [];
      if (!permissions.includes('mcp:register')) {
        return {
          success: false,
          error: `Skill "${this.skill.manifest.name}" 没有注册工具的权限`,
        };
      }

      // 添加skill前缀避免ID冲突
      const prefixedTool: MCPToolDefinition = {
        ...tool,
        id: `skill_${this.skill.manifest.id}_${tool.id}`,
        description: `${tool.description} [来自: ${this.skill.manifest.name}]`,
        metadata: {
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      const result = await this.registry.registerTool(prefixedTool, 'user');

      if (result.success) {
        this.registeredTools.add(prefixedTool.id);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
      };
    }
  }

  /**
   * 注销工具
   */
  async unregisterTool(toolId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const prefixedId = toolId.startsWith('skill_') 
        ? toolId 
        : `skill_${this.skill.manifest.id}_${toolId}`;

      if (!this.registeredTools.has(prefixedId)) {
        return {
          success: false,
          error: `工具 "${toolId}" 不是由此skill注册的`,
        };
      }

      const result = await this.registry.deleteTool(prefixedId);

      if (result.success) {
        this.registeredTools.delete(prefixedId);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '注销失败',
      };
    }
  }

  /**
   * 注册skill清单中定义的所有工具
   */
  async registerProvidedTools(): Promise<{
    success: boolean;
    registered: string[];
    errors: string[];
  }> {
    const registered: string[] = [];
    const errors: string[] = [];

    const providedTools = this.skill.manifest.providedTools;
    if (!providedTools || providedTools.length === 0) {
      return { success: true, registered, errors };
    }

    for (const tool of providedTools) {
      const result = await this.registerTool(tool);
      if (result.success) {
        registered.push(tool.id);
      } else {
        errors.push(`${tool.id}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      registered,
      errors,
    };
  }

  /**
   * 注销所有由此skill注册的工具
   */
  async unregisterAllTools(): Promise<void> {
    for (const toolId of this.registeredTools) {
      await this.registry.deleteTool(toolId);
    }
    this.registeredTools.clear();
  }

  /**
   * 获取此skill注册的工具列表
   */
  getRegisteredTools(): string[] {
    return Array.from(this.registeredTools);
  }
}

/**
 * Skill MCP 桥接工厂
 */
export class SkillMCPBridgeFactory {
  private static instance: SkillMCPBridgeFactory | null = null;
  private registry: MCPRegistry | null = null;
  private executor: MCPExecutor | null = null;
  private bridges: Map<string, SkillMCPBridgeImpl> = new Map();

  static getInstance(): SkillMCPBridgeFactory {
    if (!SkillMCPBridgeFactory.instance) {
      SkillMCPBridgeFactory.instance = new SkillMCPBridgeFactory();
    }
    return SkillMCPBridgeFactory.instance;
  }

  /**
   * 初始化工厂
   */
  initialize(registry: MCPRegistry, executor: MCPExecutor): void {
    this.registry = registry;
    this.executor = executor;
  }

  /**
   * 为skill创建桥接
   */
  createBridge(skill: InstalledSkill): SkillMCPBridgeImpl {
    if (!this.registry || !this.executor) {
      throw new Error('SkillMCPBridgeFactory 未初始化');
    }

    const existing = this.bridges.get(skill.manifest.id);
    if (existing) {
      return existing;
    }

    const bridge = new SkillMCPBridgeImpl(skill, this.registry, this.executor);
    this.bridges.set(skill.manifest.id, bridge);

    return bridge;
  }

  /**
   * 获取skill的桥接
   */
  getBridge(skillId: string): SkillMCPBridgeImpl | undefined {
    return this.bridges.get(skillId);
  }

  /**
   * 移除skill的桥接并注销其工具
   */
  async removeBridge(skillId: string): Promise<void> {
    const bridge = this.bridges.get(skillId);
    if (bridge) {
      await bridge.unregisterAllTools();
      this.bridges.delete(skillId);
    }
  }
}
