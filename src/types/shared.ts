// ============================================
// 消息相关类型
// ============================================

export interface Attachment {
  id: string;
  type: 'image' | 'voice' | 'file';
  name: string;
  data: string; // base64 for image/voice, path for file
  mimeType?: string;
  size?: number;
  duration?: number; // for voice
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  metadata?: {
    tokens?: number;
    model?: string;
    duration?: number;
  };
}

// ============================================
// 会话管理类型
// ============================================

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    provider?: Provider;
    model?: string;
    projectPath?: string;
    summary?: string; // 压缩后的摘要
    totalTokens?: number;
  };
}

export interface SessionSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// 模型相关类型
// ============================================

export type Provider = 'deepseek' | 'openai' | 'anthropic' | 'kimi' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: Provider;
  maxTokens: number;
  supportStream: boolean;
  supportVision?: boolean;
  description?: string;
}

export interface ModelConfig {
  provider: Provider;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
}

// ============================================
// API 请求/响应类型
// ============================================

export interface ChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
}

// ============================================
// 流程图相关类型
// ============================================

export type DiagramFormat = 'mermaid' | 'plantuml' | 'd2';
export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt' | 'pie' | 'mindmap' | 'architecture';

export interface Diagram {
  id: string;
  title: string;
  type: DiagramType;
  format: DiagramFormat;
  code: string;
  createdAt: number;
  updatedAt: number;
  sessionId?: string;
}

// ============================================
// 测试生成相关类型
// ============================================

export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'pytest' | 'junit' | 'go';

export interface GeneratedTest {
  id: string;
  sourceFile: string;
  testFile: string;
  framework: TestFramework;
  code: string;
  createdAt: number;
}

// 测试历史记录
export interface TestHistoryItem {
  code: string;
  path: string;
  framework: string;
  sourceFile: string;
  timestamp: number;
  id?: string;
  customName?: string;
}

// 图表历史记录（扩展 Diagram）
export interface DiagramHistoryItem extends Diagram {
  sessionId?: string;
}

// ============================================
// 斜杠命令相关类型
// ============================================

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  args?: {
    name: string;
    required: boolean;
    description: string;
  }[];
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'clear',
    description: '清除当前对话上下文',
    usage: '/clear',
    aliases: ['c'],
  },
  {
    name: 'compact',
    description: '压缩对话历史，保留摘要',
    usage: '/compact',
    aliases: ['k'],
  },
  {
    name: 'resume',
    description: '切换到其他历史会话',
    usage: '/resume [session_id]',
    aliases: ['r'],
    args: [{ name: 'session_id', required: false, description: '会话ID（可选）' }],
  },
  {
    name: 'init',
    description: '初始化项目理解',
    usage: '/init',
    aliases: ['i'],
  },
  {
    name: 'file',
    description: '读取并讨论文件',
    usage: '/file <path>',
    args: [{ name: 'path', required: true, description: '文件路径' }],
  },
  {
    name: 'search',
    description: '搜索项目代码',
    usage: '/search <query>',
    aliases: ['s'],
    args: [{ name: 'query', required: true, description: '搜索关键词' }],
  },
  {
    name: 'run',
    description: '执行终端命令',
    usage: '/run <command>',
    aliases: ['!'],
    args: [{ name: 'command', required: true, description: '要执行的命令' }],
  },
  {
    name: 'build',
    description: '构建项目',
    usage: '/build',
    aliases: ['b'],
  },
  {
    name: 'test',
    description: '运行测试',
    usage: '/test [file]',
    aliases: ['t'],
    args: [{ name: 'file', required: false, description: '测试文件（可选）' }],
  },
  {
    name: 'git',
    description: 'Git 操作',
    usage: '/git <command>',
    aliases: ['g'],
    args: [{ name: 'command', required: true, description: 'git 命令' }],
  },
  // Git 快捷命令
  {
    name: 'gst',
    description: 'Git status - 查看状态',
    usage: '/gst',
    aliases: [],
  },
  {
    name: 'gpl',
    description: 'Git pull - 拉取代码',
    usage: '/gpl',
    aliases: [],
  },
  {
    name: 'gps',
    description: 'Git push - 推送代码',
    usage: '/gps',
    aliases: [],
  },
  {
    name: 'gco',
    description: 'Git checkout - 切换分支',
    usage: '/gco <branch>',
    aliases: [],
    args: [{ name: 'branch', required: true, description: '分支名' }],
  },
  {
    name: 'gcm',
    description: 'Git commit - 提交代码',
    usage: '/gcm <message>',
    aliases: [],
    args: [{ name: 'message', required: true, description: '提交信息' }],
  },
  {
    name: 'gdf',
    description: 'Git diff - 查看差异',
    usage: '/gdf [file]',
    aliases: [],
    args: [{ name: 'file', required: false, description: '文件路径（可选）' }],
  },
  {
    name: 'glg',
    description: 'Git log - 查看日志',
    usage: '/glg',
    aliases: [],
  },
  {
    name: 'diagram',
    description: '生成流程图',
    usage: '/diagram <type> [description]',
    aliases: ['d'],
    args: [
      { name: 'type', required: true, description: '图表类型: flowchart, sequence, class, state, er, architecture' },
      { name: 'description', required: false, description: '图表描述' },
    ],
  },
  {
    name: 'gentest',
    description: '为文件生成测试',
    usage: '/gentest [file]',
    aliases: ['gt'],
    args: [{ name: 'file', required: false, description: '源文件路径（默认当前文件）' }],
  },
  {
    name: 'help',
    description: '显示帮助信息',
    usage: '/help [command]',
    aliases: ['h', '?'],
    args: [{ name: 'command', required: false, description: '命令名称' }],
  },
];

// ============================================
// 快捷键相关
// ============================================

export const KEYBOARD_SHORTCUTS = {
  SHOW_COMMANDS: '/',
  HISTORY_UP: 'ArrowUp',
  HISTORY_DOWN: 'ArrowDown',
  AUTOCOMPLETE: 'Tab',
  NEWLINE: 'Alt+Enter',
  CANCEL: 'Escape',
  SUBMIT: 'Enter',
  COPY: 'Ctrl+C',
} as const;

// ============================================
// Webview 消息类型
// ============================================

// Extension -> Webview 消息
export type ExtensionToWebviewMessage =
  | { type: 'streamChunk'; content: string; messageId: string }
  | { type: 'streamComplete'; messageId: string }
  | { type: 'response'; message: Message }
  | { type: 'error'; error: string }
  | { type: 'configUpdate'; config: ModelConfig }
  | { type: 'modelsUpdate'; models: AIModel[] }
  | { type: 'clearChat' }
  | { type: 'themeChanged'; theme: 'light' | 'dark' }
  | { type: 'codeAction'; action: CodeActionType; code: string; language?: string }
  | { type: 'taskStatus'; status: TaskStatus | null }
  | { type: 'sessionLoaded'; session: Session }
  | { type: 'sessionList'; sessions: SessionSummary[] }
  | { type: 'diagramGenerated'; diagram: Diagram }
  | { type: 'diagramList'; diagrams: Diagram[] }
  | { type: 'testGenerated'; test: GeneratedTest }
  | { type: 'commandSuggestions'; suggestions: SlashCommand[] }
  | { type: 'commandResult'; command: string; result: string; success: boolean }
  | { type: 'voiceConfig'; enabled: boolean; language: string }
  | { type: 'messageHistory'; messages: string[] }
  | { type: 'inputHint'; hint: string; possibleCommand?: string }
  | { type: 'diagramAutoFixed'; code: string; explanation?: string }
  | { type: 'testAutoFixed'; code: string; explanation?: string };

// 任务状态
export interface TaskStatus {
  type: 'chat' | 'codeAction' | 'command' | 'diagram' | 'test';
  actionType?: CodeActionType;
  label: string;
  progress?: number;
}

// Webview -> Extension 消息
export type WebviewToExtensionMessage =
  | { type: 'sendMessage'; content: string; attachments?: Attachment[] }
  | { type: 'cancelRequest' }
  | { type: 'getConfig' }
  | { type: 'updateConfig'; config: Partial<ModelConfig> }
  | { type: 'setApiKey'; provider: Provider; apiKey: string }
  | { type: 'getModels' }
  | { type: 'switchModel'; provider: Provider; model: string }
  | { type: 'openExternal'; url: string }
  | { type: 'insertCode'; code: string }
  | { type: 'copyToClipboard'; text: string }
  | { type: 'retryMessage'; messageId: string }
  | { type: 'regenerateResponse' }
  | { type: 'executeCommand'; command: string; args?: string[] }
  | { type: 'loadSession'; sessionId: string }
  | { type: 'getSessions' }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'compactContext' }
  | { type: 'generateDiagram'; diagramType: DiagramType; description?: string }
  | { type: 'updateDiagram'; diagramId: string; code: string }
  | { type: 'exportDiagram'; diagramId: string; format: 'svg' | 'png' | 'md' }
  | { type: 'generateTest'; filePath?: string }
  | { type: 'saveTest'; test: GeneratedTest }
  | { type: 'runTest'; testFile: string }
  | { type: 'getMessageHistory' }
  | { type: 'voiceInput'; audio: string; mimeType: string }
  | { type: 'getVoiceConfig' };

// 代码操作类型
export type CodeActionType = 'explain' | 'fix' | 'optimize' | 'addComments' | 'generateTests' | 'review';

export const CODE_ACTIONS: { type: CodeActionType; label: string; icon: string; prompt: string }[] = [
  { 
    type: 'explain', 
    label: '解释代码', 
    icon: '💡',
    prompt: '请详细解释以下代码的功能、逻辑和工作原理：\n\n```{language}\n{code}\n```'
  },
  { 
    type: 'fix', 
    label: '修复代码', 
    icon: '🔧',
    prompt: '请检查以下代码中可能存在的bug或问题，并提供修复后的代码：\n\n```{language}\n{code}\n```'
  },
  { 
    type: 'optimize', 
    label: '优化代码', 
    icon: '⚡',
    prompt: '请优化以下代码的性能、可读性和最佳实践，并解释优化点：\n\n```{language}\n{code}\n```'
  },
  { 
    type: 'addComments', 
    label: '添加注释', 
    icon: '📝',
    prompt: '请为以下代码添加详细的中文注释，解释每个部分的功能：\n\n```{language}\n{code}\n```'
  },
  { 
    type: 'generateTests', 
    label: '生成测试', 
    icon: '🧪',
    prompt: '请为以下代码生成完整的单元测试用例，包含边界条件和异常情况：\n\n```{language}\n{code}\n```'
  },
  { 
    type: 'review', 
    label: '代码审查', 
    icon: '🔍',
    prompt: '请对以下代码进行代码审查，指出潜在问题、改进建议和最佳实践：\n\n```{language}\n{code}\n```'
  },
];

// ============================================
// 预设模型列表
// ============================================

export const AVAILABLE_MODELS: Record<Provider, AIModel[]> = {
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', maxTokens: 4096, supportStream: true },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', maxTokens: 16384, supportStream: true },
  ],
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000, supportStream: true, supportVision: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', maxTokens: 128000, supportStream: true, supportVision: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', maxTokens: 128000, supportStream: true, supportVision: true },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385, supportStream: true },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', maxTokens: 8192, supportStream: true, supportVision: true },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 4096, supportStream: true, supportVision: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 4096, supportStream: true, supportVision: true },
  ],
  kimi: [
    { id: 'moonshot-v1-8k', name: 'Kimi 8K', provider: 'kimi', maxTokens: 8192, supportStream: true },
    { id: 'moonshot-v1-32k', name: 'Kimi 32K', provider: 'kimi', maxTokens: 32768, supportStream: true },
    { id: 'moonshot-v1-128k', name: 'Kimi 128K', provider: 'kimi', maxTokens: 131072, supportStream: true },
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', provider: 'openrouter', maxTokens: 8192, supportStream: true, supportVision: true },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter', maxTokens: 32768, supportStream: true, supportVision: true },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'openrouter', maxTokens: 32768, supportStream: true },
  ],
};

// ============================================
// 图表模板
// ============================================

export const DIAGRAM_TEMPLATES: Record<DiagramType, string> = {
  flowchart: `flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[处理1]
    B -->|否| D[处理2]
    C --> E[结束]
    D --> E`,
  sequence: `sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 请求
    B-->>A: 响应`,
  class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
  state: `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始
    处理中 --> 已完成: 完成
    处理中 --> 失败: 错误
    已完成 --> [*]
    失败 --> 待处理: 重试`,
  er: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes`,
  gantt: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 阶段1
    任务1: 2024-01-01, 7d
    任务2: 7d`,
  pie: `pie title 分布
    "A" : 40
    "B" : 30
    "C" : 30`,
  mindmap: `mindmap
    root((主题))
      分支1
        子节点1
        子节点2
      分支2
        子节点3`,
  architecture: `flowchart TB
    subgraph Frontend
        A[Web App]
        B[Mobile App]
    end
    subgraph Backend
        C[API Gateway]
        D[Service A]
        E[Service B]
    end
    subgraph Database
        F[(主数据库)]
        G[(缓存)]
    end
    A --> C
    B --> C
    C --> D
    C --> E
    D --> F
    E --> F
    D --> G`,
};

// ============================================
// 工具函数
// ============================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getProviderDisplayName(provider: Provider): string {
  const names: Record<Provider, string> = {
    deepseek: 'DeepSeek',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    kimi: 'Kimi (Moonshot)',
    openrouter: 'OpenRouter',
  };
  return names[provider];
}

export function estimateTokens(text: string): number {
  // 简单估算：中文约1.5字符/token，英文约4字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
