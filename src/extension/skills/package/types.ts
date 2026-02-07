/**
 * Skill包类型定义
 * 
 * 定义skill包的结构、清单、配置等类型
 */

import { MCPToolDefinition } from '../../mcp/types';

/**
 * Skill包清单文件结构 (manifest.json)
 */
export interface SkillManifest {
  /** Skill唯一标识符 */
  id: string;
  /** Skill名称 */
  name: string;
  /** 版本号 (semver格式) */
  version: string;
  /** 描述 */
  description: string;
  /** 作者 */
  author?: string;
  /** 仓库地址 */
  repository?: string;
  /** 许可证 */
  license?: string;
  /** 主脚本文件路径（相对于skill根目录） */
  main?: string;
  /** 指示文件路径 (SKILL.md) */
  skillFile?: string;
  /** 运行时类型 */
  runtime?: SkillRuntime;
  /** 需要调用的MCP工具ID列表 */
  mcpTools?: string[];
  /** 此skill提供给MCP的工具定义 */
  providedTools?: MCPToolDefinition[];
  /** 配置选项 */
  config?: Record<string, SkillConfigOption>;
  /** 标签 */
  tags?: string[];
  /** 最低插件版本要求 */
  minPluginVersion?: string;
  /** 权限要求 */
  permissions?: SkillPermission[];
  /** 入口点配置 */
  entryPoints?: SkillEntryPoints;
  /** 依赖的npm包 */
  dependencies?: Record<string, string>;
}

/** 运行时类型 */
export type SkillRuntime = 'node' | 'python' | 'shell' | 'builtin';

/** 配置选项定义 */
export interface SkillConfigOption {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
  description: string;
  required?: boolean;
  enum?: any[];
}

/** 权限类型 */
export type SkillPermission = 
  | 'fs:read'        // 读取文件系统
  | 'fs:write'       // 写入文件系统
  | 'network'        // 网络访问
  | 'shell'          // 执行shell命令
  | 'mcp:call'       // 调用MCP工具
  | 'mcp:register'   // 注册MCP工具
  | 'config:read'    // 读取配置
  | 'config:write';  // 写入配置

/** 入口点配置 */
export interface SkillEntryPoints {
  /** 初始化入口 */
  init?: string;
  /** 执行入口 */
  execute?: string;
  /** 清理入口 */
  cleanup?: string;
  /** 命令处理入口 */
  commands?: Record<string, string>;
}

/** Skill包状态 */
export type SkillStatus = 
  | 'installed'      // 已安装
  | 'active'         // 活动中
  | 'disabled'       // 已禁用
  | 'error'          // 错误状态
  | 'updating';      // 更新中

/** 已安装的Skill包信息 */
export interface InstalledSkill {
  /** 清单信息 */
  manifest: SkillManifest;
  /** 安装路径 */
  installPath: string;
  /** 安装时间 */
  installedAt: number;
  /** 更新时间 */
  updatedAt?: number;
  /** 状态 */
  status: SkillStatus;
  /** 用户配置 */
  userConfig?: Record<string, any>;
  /** 来源 */
  source: SkillSource;
  /** 错误信息 */
  error?: string;
}

/** Skill包来源 */
export interface SkillSource {
  type: 'local' | 'git' | 'url';
  url?: string;
  branch?: string;
  localPath?: string;
}

/** SKILL.md 解析结果 */
export interface SkillMarkdown {
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 使用说明 */
  usage?: string;
  /** 示例 */
  examples?: string[];
  /** AI提示词 */
  aiPrompt?: string;
  /** 配置说明 */
  configuration?: string;
  /** 完整的markdown内容 */
  rawContent: string;
  /** 解析后的各节 */
  sections: Record<string, string>;
}

/** Skill执行上下文 */
export interface SkillContext {
  /** Skill包信息 */
  skill: InstalledSkill;
  /** 工作区根目录 */
  workspaceRoot?: string;
  /** 当前活动文件 */
  activeFile?: string;
  /** 选中的代码 */
  selectedCode?: string;
  /** 用户输入参数 */
  params?: Record<string, any>;
  /** MCP桥接接口 */
  mcp: SkillMCPBridge;
  /** 日志函数 */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  /** 进度报告函数 */
  progress: (percent: number, message?: string) => void;
}

/** Skill MCP桥接接口 */
export interface SkillMCPBridge {
  /** 调用MCP工具 */
  call: (toolId: string, params: Record<string, any>) => Promise<SkillToolResult>;
  /** 获取可用工具列表 */
  listTools: () => Promise<MCPToolDefinition[]>;
  /** 注册工具 */
  registerTool: (tool: MCPToolDefinition) => Promise<{ success: boolean; error?: string }>;
  /** 注销工具 */
  unregisterTool: (toolId: string) => Promise<{ success: boolean; error?: string }>;
}

/** MCP工具调用结果 */
export interface SkillToolResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  duration: number;
}

/** Skill执行结果 */
export interface SkillResult {
  success: boolean;
  output?: any;
  error?: string;
  logs?: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
  }>;
  mcpCalls?: Array<{
    toolId: string;
    params: Record<string, any>;
    result: SkillToolResult;
  }>;
  duration: number;
}

/** Skill安装选项 */
export interface SkillInstallOptions {
  /** 是否覆盖现有 */
  overwrite?: boolean;
  /** 是否自动启用 */
  autoEnable?: boolean;
  /** 用户配置 */
  config?: Record<string, any>;
}
