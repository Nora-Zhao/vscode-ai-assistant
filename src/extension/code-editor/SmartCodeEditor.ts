import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 代码编辑操作类型
 */
export type EditOperation = 
  | { type: 'replace'; oldText: string; newText: string }
  | { type: 'insert'; position: 'before' | 'after'; anchor: string; content: string }
  | { type: 'insertAtLine'; line: number; content: string }
  | { type: 'delete'; target: string }
  | { type: 'wrap'; target: string; before: string; after: string };

/**
 * 缩进信息
 */
interface IndentInfo {
  char: string;      // 缩进字符 (' ' 或 '\t')
  size: number;      // 单位缩进大小
  level: number;     // 缩进级别
  raw: string;       // 原始缩进字符串
}

/**
 * MCP工具提示信息
 */
interface MCPToolSuggestion {
  id: string;
  name: string;
  description: string;
  category: string;
  insertText: string;
  documentation?: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Skill技能提示信息
 */
interface SkillSuggestion {
  id: string;
  name: string;
  description: string;
  category: 'automator' | 'builder' | 'explainer';
  icon: string;
  insertText: string;
  documentation?: string;
  supportedLanguages?: string[];
}

/**
 * 代码分析结果
 */
interface CodeAnalysis {
  hasImports: boolean;
  hasFunctions: boolean;
  hasClasses: boolean;
  language: string;
  suggestedTools: string[];
}

/**
 * 智能代码编辑器
 * 
 * Claude Code 能够流畅处理代码插入的核心原因：
 * 1. 使用精确的字符串匹配替换，而非行号定位
 * 2. 自动分析目标位置的缩进级别并调整
 * 3. 保持代码风格一致性
 * 4. 支持 @mcp 智能提示和自动补全
 */
export class SmartCodeEditor {

  // ============================================
  // MCP 工具注册表（用于智能提示）
  // ============================================
  
  private static mcpTools: Map<string, MCPToolSuggestion> = new Map();
  private static skillTools: Map<string, SkillSuggestion> = new Map();
  private static completionProvider: vscode.Disposable | null = null;
  private static hoverProvider: vscode.Disposable | null = null;

  /**
   * 初始化MCP工具提示系统
   */
  static initialize(context: vscode.ExtensionContext): void {
    // 注册自动补全提供器
    this.completionProvider = vscode.languages.registerCompletionItemProvider(
      ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'markdown', 'plaintext'],
      {
        provideCompletionItems: (document, position) => {
          return this.provideCompletions(document, position);
        },
        resolveCompletionItem: (item) => {
          return this.resolveCompletion(item);
        }
      },
      '@', ':', '.' // 触发字符
    );

    // 注册悬停提示提供器
    this.hoverProvider = vscode.languages.registerHoverProvider(
      ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'markdown', 'plaintext'],
      {
        provideHover: (document, position) => {
          return this.provideHover(document, position);
        }
      }
    );

    context.subscriptions.push(this.completionProvider, this.hoverProvider);

    // 加载内置MCP工具
    this.loadBuiltinTools();
    
    // 加载内置Skill工具
    this.loadBuiltinSkills();
  }

  /**
   * 加载内置MCP工具定义
   */
  private static loadBuiltinTools(): void {
    const builtinTools: MCPToolSuggestion[] = [
      {
        id: 'file:read',
        name: '读取文件',
        description: '读取指定路径的文件内容',
        category: 'file',
        insertText: '@mcp:file:read "${1:path}"',
        parameters: [
          { name: 'path', type: 'string', description: '文件路径', required: true }
        ]
      },
      {
        id: 'file:write',
        name: '写入文件',
        description: '将内容写入指定文件',
        category: 'file',
        insertText: '@mcp:file:write "${1:path}" "${2:content}"',
        parameters: [
          { name: 'path', type: 'string', description: '文件路径', required: true },
          { name: 'content', type: 'string', description: '文件内容', required: true }
        ]
      },
      {
        id: 'file:list',
        name: '列出文件',
        description: '列出目录下的所有文件',
        category: 'file',
        insertText: '@mcp:file:list "${1:directory}"',
        parameters: [
          { name: 'directory', type: 'string', description: '目录路径', required: true }
        ]
      },
      {
        id: 'code:analyze',
        name: '分析代码',
        description: '分析代码结构和依赖关系',
        category: 'code',
        insertText: '@mcp:code:analyze "${1:file}"',
        parameters: [
          { name: 'file', type: 'string', description: '要分析的文件', required: true }
        ]
      },
      {
        id: 'code:refactor',
        name: '重构代码',
        description: '智能重构选中的代码',
        category: 'code',
        insertText: '@mcp:code:refactor "${1:target}" "${2:type}"',
        parameters: [
          { name: 'target', type: 'string', description: '重构目标', required: true },
          { name: 'type', type: 'string', description: '重构类型: extract-function, rename, inline', required: true }
        ]
      },
      {
        id: 'shell:run',
        name: '运行命令',
        description: '在终端运行Shell命令',
        category: 'shell',
        insertText: '@mcp:shell:run "${1:command}"',
        parameters: [
          { name: 'command', type: 'string', description: 'Shell命令', required: true }
        ]
      },
      {
        id: 'git:status',
        name: 'Git状态',
        description: '获取Git仓库状态',
        category: 'git',
        insertText: '@mcp:git:status'
      },
      {
        id: 'git:diff',
        name: 'Git差异',
        description: '获取未提交的更改',
        category: 'git',
        insertText: '@mcp:git:diff "${1:file}"',
        parameters: [
          { name: 'file', type: 'string', description: '文件路径（可选）', required: false }
        ]
      },
      {
        id: 'git:commit',
        name: 'Git提交',
        description: '提交更改到本地仓库',
        category: 'git',
        insertText: '@mcp:git:commit "${1:message}"',
        parameters: [
          { name: 'message', type: 'string', description: '提交信息', required: true }
        ]
      },
      {
        id: 'search:code',
        name: '搜索代码',
        description: '在项目中搜索代码',
        category: 'search',
        insertText: '@mcp:search:code "${1:query}"',
        parameters: [
          { name: 'query', type: 'string', description: '搜索关键词', required: true }
        ]
      },
      {
        id: 'search:files',
        name: '搜索文件',
        description: '按名称搜索文件',
        category: 'search',
        insertText: '@mcp:search:files "${1:pattern}"',
        parameters: [
          { name: 'pattern', type: 'string', description: '文件名模式', required: true }
        ]
      },
      {
        id: 'test:generate',
        name: '生成测试',
        description: '为代码生成单元测试',
        category: 'test',
        insertText: '@mcp:test:generate "${1:file}"',
        parameters: [
          { name: 'file', type: 'string', description: '要测试的文件', required: true }
        ]
      },
      {
        id: 'test:run',
        name: '运行测试',
        description: '运行项目测试',
        category: 'test',
        insertText: '@mcp:test:run "${1:pattern}"',
        parameters: [
          { name: 'pattern', type: 'string', description: '测试文件模式（可选）', required: false }
        ]
      },
      {
        id: 'diagram:generate',
        name: '生成图表',
        description: '根据代码生成架构图',
        category: 'diagram',
        insertText: '@mcp:diagram:generate "${1:type}" "${2:description}"',
        parameters: [
          { name: 'type', type: 'string', description: '图表类型: flowchart, sequence, class, architecture', required: true },
          { name: 'description', type: 'string', description: '图表描述', required: true }
        ]
      },
      {
        id: 'web:fetch',
        name: '网页请求',
        description: '获取网页内容',
        category: 'web',
        insertText: '@mcp:web:fetch "${1:url}"',
        parameters: [
          { name: 'url', type: 'string', description: 'URL地址', required: true }
        ]
      },
      {
        id: 'agent:run',
        name: '启动Agent',
        description: '启动自主Agent执行复杂任务',
        category: 'agent',
        insertText: '@mcp:agent:run "${1:task}"',
        parameters: [
          { name: 'task', type: 'string', description: '任务描述', required: true }
        ]
      }
    ];

    for (const tool of builtinTools) {
      this.mcpTools.set(tool.id, tool);
    }
  }

  /**
   * 注册自定义MCP工具
   */
  static registerTool(tool: MCPToolSuggestion): void {
    this.mcpTools.set(tool.id, tool);
  }

  /**
   * 批量注册MCP工具
   */
  static registerTools(tools: MCPToolSuggestion[]): void {
    for (const tool of tools) {
      this.mcpTools.set(tool.id, tool);
    }
  }

  /**
   * 加载内置Skill技能定义
   */
  private static loadBuiltinSkills(): void {
    const builtinSkills: SkillSuggestion[] = [
      {
        id: 'dependency-guardian',
        name: '依赖安全卫士',
        description: '检查项目依赖中的安全漏洞',
        category: 'automator',
        icon: '🛡️',
        insertText: '@skill:dependency-guardian',
        supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go']
      },
      {
        id: 'test-architect',
        name: '测试架构师',
        description: '为源代码智能生成单元测试',
        category: 'builder',
        icon: '🧪',
        insertText: '@skill:test-architect "${1:file}"',
        supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go']
      },
      {
        id: 'code-reviewer',
        name: '代码审查员',
        description: '对代码进行智能审查，指出潜在问题',
        category: 'explainer',
        icon: '🔍',
        insertText: '@skill:code-reviewer "${1:file}"',
        supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go']
      },
      {
        id: 'tool-maker',
        name: '小工具制作器',
        description: '制作本地CLI脚本（批量重命名、日志分析、图片压缩等）',
        category: 'builder',
        icon: '🔧',
        insertText: '@skill:tool-maker "${1:tool_type}" "${2:description}"',
        supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go']
      },
      {
        id: 'excel-processor',
        name: 'Excel处理器',
        description: '清洗表格数据、合并多表、做统计分析，输出Excel文件',
        category: 'automator',
        icon: '📊',
        insertText: '@skill:excel-processor "${1:operation}" "${2:file}"'
      },
      {
        id: 'word-processor',
        name: 'Word文档处理器',
        description: '生成规范Word文档，支持需求文档、会议纪要、说明书等',
        category: 'builder',
        icon: '📄',
        insertText: '@skill:word-processor "${1:template}" "${2:content}"'
      },
      {
        id: 'ppt-processor',
        name: 'PPT演示文稿生成器',
        description: '根据主题自动生成大纲与逐页要点演示文稿',
        category: 'builder',
        icon: '📽️',
        insertText: '@skill:ppt-processor "${1:topic}" "${2:outline}"'
      },
      {
        id: 'git-scribe',
        name: 'Git书记员',
        description: '自动生成Commit Message和PR描述',
        category: 'automator',
        icon: '📝',
        insertText: '@skill:git-scribe "${1:type}"'
      },
      {
        id: 'scaffolder',
        name: '脚手架生成器',
        description: '快速生成项目结构和样板代码',
        category: 'builder',
        icon: '🏗️',
        insertText: '@skill:scaffolder "${1:template}" "${2:name}"'
      },
      {
        id: 'live-docs',
        name: '文档生成器',
        description: '自动生成代码文档和API说明',
        category: 'explainer',
        icon: '📚',
        insertText: '@skill:live-docs "${1:file}"'
      },
      {
        id: 'mcp-tools',
        name: 'MCP工具调用',
        description: '通过MCP协议调用外部工具（文件系统、浏览器、数据库等）',
        category: 'automator',
        icon: '🔌',
        insertText: '@skill:mcp-tools "${1:tool}" "${2:params}"'
      },
      {
        id: 'mcp-config',
        name: 'MCP配置管理',
        description: '配置和管理MCP服务器连接',
        category: 'automator',
        icon: '⚙️',
        insertText: '@skill:mcp-config "${1:action}"'
      }
    ];

    for (const skill of builtinSkills) {
      this.skillTools.set(skill.id, skill);
    }
  }

  /**
   * 注册自定义Skill技能
   */
  static registerSkill(skill: SkillSuggestion): void {
    this.skillTools.set(skill.id, skill);
  }

  /**
   * 批量注册Skill技能
   */
  static registerSkills(skills: SkillSuggestion[]): void {
    for (const skill of skills) {
      this.skillTools.set(skill.id, skill);
    }
  }

  /**
   * 提供统一的自动补全（@mcp 和 @skill）
   */
  private static provideCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionList | null {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    
    // 检测 @ 开头的任何内容
    const atMatch = linePrefix.match(/@([a-zA-Z0-9:_-]*)$/);
    if (!atMatch) {
      return null;
    }
    
    const prefix = atMatch[1] || '';
    const items: vscode.CompletionItem[] = [];
    
    // 判断是否应该显示前缀选项
    const showMcpPrefix = prefix === '' || ('mcp:'.startsWith(prefix) && !prefix.startsWith('mcp:'));
    const showSkillPrefix = prefix === '' || ('skill:'.startsWith(prefix) && !prefix.startsWith('skill:'));
    const isMcpToolMode = prefix.startsWith('mcp:');
    const isSkillMode = prefix.startsWith('skill:');
    
    // 情况1: 空前缀或部分前缀 - 显示 @mcp: 和 @skill: 前缀选项
    if (showMcpPrefix) {
      const mcpItem = new vscode.CompletionItem('@mcp:', vscode.CompletionItemKind.Module);
      mcpItem.detail = 'MCP 工具调用';
      mcpItem.documentation = new vscode.MarkdownString(
        '**MCP 工具系统**\n\n' +
        '输入 `@mcp:` 后跟工具ID来调用MCP工具。\n\n' +
        '**分类:** file, code, shell, git, search, test, diagram, web, agent'
      );
      mcpItem.insertText = new vscode.SnippetString('mcp:${1}');
      mcpItem.filterText = '@mcp:';
      mcpItem.command = { command: 'editor.action.triggerSuggest', title: '触发建议' };
      mcpItem.sortText = '0-mcp';
      items.push(mcpItem);
    }
    
    if (showSkillPrefix) {
      const skillItem = new vscode.CompletionItem('@skill:', vscode.CompletionItemKind.Module);
      skillItem.detail = 'Skill 技能调用';
      skillItem.documentation = new vscode.MarkdownString(
        '**Skill 技能系统**\n\n' +
        '输入 `@skill:` 后跟技能ID来调用Skill技能。\n\n' +
        '**热门:** test-architect, code-reviewer, tool-maker'
      );
      skillItem.insertText = new vscode.SnippetString('skill:${1}');
      skillItem.filterText = '@skill:';
      skillItem.command = { command: 'editor.action.triggerSuggest', title: '触发建议' };
      skillItem.sortText = '1-skill';
      items.push(skillItem);
    }
    
    // 情况2: 前缀以 mcp: 开头，显示 MCP 工具列表
    if (isMcpToolMode) {
      const toolPrefix = prefix.slice(4); // 去掉 'mcp:'
      for (const [id, tool] of this.mcpTools) {
        if (toolPrefix === '' || id.startsWith(toolPrefix) || id.includes(toolPrefix) || tool.name.includes(toolPrefix)) {
          const item = new vscode.CompletionItem(`@mcp:${id}`, vscode.CompletionItemKind.Function);
          item.detail = tool.name;
          item.documentation = new vscode.MarkdownString(
            `**${tool.name}**\n\n${tool.description}\n\n` +
            (tool.parameters 
              ? `**参数:**\n${tool.parameters.map(p => 
                  `- \`${p.name}\` (${p.type}${p.required ? '' : ', 可选'}): ${p.description}`
                ).join('\n')}`
              : '')
          );
          item.insertText = new vscode.SnippetString(tool.insertText.replace('@mcp:', ''));
          item.filterText = `@mcp:${id}`;
          item.sortText = `2-${tool.category}-${id}`;
          items.push(item);
        }
      }
    }
    
    // 情况3: 前缀以 skill: 开头，显示 Skill 技能列表
    if (isSkillMode) {
      const skillPrefix = prefix.slice(6); // 去掉 'skill:'
      for (const [id, skill] of this.skillTools) {
        if (skillPrefix === '' || id.startsWith(skillPrefix) || id.includes(skillPrefix) || skill.name.includes(skillPrefix)) {
          const item = new vscode.CompletionItem(`@skill:${id}`, vscode.CompletionItemKind.Module);
          item.detail = `${skill.icon} ${skill.name}`;
          item.documentation = new vscode.MarkdownString(
            `## ${skill.icon} ${skill.name}\n\n` +
            `${skill.description}\n\n` +
            `**类别:** \`${skill.category}\`\n\n` +
            (skill.supportedLanguages 
              ? `**支持语言:** ${skill.supportedLanguages.join(', ')}`
              : '**支持语言:** 所有语言')
          );
          item.insertText = new vscode.SnippetString(skill.insertText.replace('@skill:', ''));
          item.filterText = `@skill:${id}`;
          item.sortText = `3-${skill.category}-${id}`;
          items.push(item);
        }
      }
    }
    
    return items.length > 0 ? new vscode.CompletionList(items, false) : null;
  }

  /**
   * 提供MCP自动补全 (保留用于向后兼容)
   */
  private static provideMCPCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    prefix: string = ''
  ): vscode.CompletionList {
    const items: vscode.CompletionItem[] = [];
    
    // 根据前缀过滤工具
    for (const [id, tool] of this.mcpTools) {
      if (id.startsWith(prefix) || tool.name.includes(prefix)) {
        const item = new vscode.CompletionItem(
          `@mcp:${id}`,
          vscode.CompletionItemKind.Function
        );
        item.detail = tool.name;
        item.documentation = new vscode.MarkdownString(
          `**${tool.name}**\n\n${tool.description}\n\n` +
          (tool.parameters 
            ? `**参数:**\n${tool.parameters.map(p => 
                `- \`${p.name}\` (${p.type}${p.required ? '' : ', 可选'}): ${p.description}`
              ).join('\n')}`
            : '')
        );
        item.insertText = new vscode.SnippetString(tool.insertText.replace('@mcp:', ''));
        item.filterText = `@mcp:${id}`;
        item.sortText = `0-${tool.category}-${id}`;
        items.push(item);
      }
    }

    return new vscode.CompletionList(items, false);
  }

  /**
   * 提供Skill自动补全
   */
  private static provideSkillCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    prefix: string = ''
  ): vscode.CompletionList {
    const items: vscode.CompletionItem[] = [];
    
    // 根据前缀过滤技能
    for (const [id, skill] of this.skillTools) {
      if (id.startsWith(prefix) || skill.name.includes(prefix)) {
        const item = new vscode.CompletionItem(
          `@skill:${id}`,
          vscode.CompletionItemKind.Module
        );
        item.detail = `${skill.icon} ${skill.name}`;
        item.documentation = new vscode.MarkdownString(
          `## ${skill.icon} ${skill.name}\n\n` +
          `${skill.description}\n\n` +
          `**类别:** \`${skill.category}\`\n\n` +
          (skill.supportedLanguages 
            ? `**支持语言:** ${skill.supportedLanguages.join(', ')}`
            : '**支持语言:** 所有语言')
        );
        item.insertText = new vscode.SnippetString(skill.insertText.replace('@skill:', ''));
        item.filterText = `@skill:${id}`;
        item.sortText = `1-${skill.category}-${id}`;
        items.push(item);
      }
    }

    return new vscode.CompletionList(items, false);
  }

  /**
   * 创建所有 @ 前缀补全（包括 @mcp 和 @skill）
   */
  private static createAllPrefixCompletions(): vscode.CompletionList {
    const items: vscode.CompletionItem[] = [];
    
    // @mcp 前缀
    const mcpItem = new vscode.CompletionItem('mcp:', vscode.CompletionItemKind.Module);
    mcpItem.detail = 'MCP 工具调用';
    mcpItem.documentation = new vscode.MarkdownString(
      '**MCP 工具系统**\n\n' +
      '输入 `@mcp:` 后跟工具ID来调用MCP工具。\n\n' +
      '**分类:**\n' +
      '- `file:` - 文件操作\n' +
      '- `code:` - 代码分析\n' +
      '- `shell:` - Shell命令\n' +
      '- `git:` - Git操作\n' +
      '- `search:` - 搜索\n' +
      '- `test:` - 测试\n' +
      '- `diagram:` - 图表\n' +
      '- `web:` - 网络请求\n' +
      '- `agent:` - 自主Agent'
    );
    mcpItem.insertText = new vscode.SnippetString('mcp:${1}');
    mcpItem.command = {
      command: 'editor.action.triggerSuggest',
      title: '触发建议'
    };
    mcpItem.sortText = '0-mcp';
    items.push(mcpItem);
    
    // @skill 前缀
    const skillItem = new vscode.CompletionItem('skill:', vscode.CompletionItemKind.Module);
    skillItem.detail = 'Skill 技能调用';
    skillItem.documentation = new vscode.MarkdownString(
      '**Skill 技能系统**\n\n' +
      '输入 `@skill:` 后跟技能ID来调用Skill技能。\n\n' +
      '**分类:**\n' +
      '- `automator` - 🤖 自动化技能（安全检查、Git操作等）\n' +
      '- `builder` - 🏗️ 构建器技能（生成测试、文档、脚手架等）\n' +
      '- `explainer` - 📖 解释器技能（代码审查、文档生成等）\n\n' +
      '**热门技能:**\n' +
      '- `test-architect` - 测试架构师\n' +
      '- `code-reviewer` - 代码审查员\n' +
      '- `tool-maker` - 小工具制作器\n' +
      '- `dependency-guardian` - 依赖安全卫士'
    );
    skillItem.insertText = new vscode.SnippetString('skill:${1}');
    skillItem.command = {
      command: 'editor.action.triggerSuggest',
      title: '触发建议'
    };
    skillItem.sortText = '1-skill';
    items.push(skillItem);
    
    return new vscode.CompletionList(items, false);
  }

  /**
   * 解析补全项（添加更多细节）
   */
  private static resolveCompletion(item: vscode.CompletionItem): vscode.CompletionItem {
    const label = item.label?.toString() || '';
    
    // 处理 @mcp 补全
    if (label.startsWith('@mcp:')) {
      const toolId = label.replace('@mcp:', '');
      const tool = this.mcpTools.get(toolId);
      if (tool && tool.documentation) {
        item.documentation = new vscode.MarkdownString(tool.documentation);
      }
    }
    
    // 处理 @skill 补全
    if (label.startsWith('@skill:')) {
      const skillId = label.replace('@skill:', '');
      const skill = this.skillTools.get(skillId);
      if (skill && skill.documentation) {
        item.documentation = new vscode.MarkdownString(skill.documentation);
      }
    }
    
    return item;
  }

  /**
   * 提供悬停提示（支持 @mcp 和 @skill）
   */
  private static provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | null {
    // 检测 @mcp 悬停
    const mcpRange = document.getWordRangeAtPosition(position, /@mcp:[a-zA-Z0-9:_-]+/);
    if (mcpRange) {
      const text = document.getText(mcpRange);
      const toolId = text.replace('@mcp:', '');
      const tool = this.mcpTools.get(toolId);

      if (tool) {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`## 🔧 ${tool.name}\n\n`);
        markdown.appendMarkdown(`${tool.description}\n\n`);
        markdown.appendMarkdown(`**分类:** \`${tool.category}\`\n\n`);
        
        if (tool.parameters && tool.parameters.length > 0) {
          markdown.appendMarkdown(`**参数:**\n\n`);
          for (const param of tool.parameters) {
            const required = param.required ? '(必需)' : '(可选)';
            markdown.appendMarkdown(`- \`${param.name}\` ${required}: ${param.description}\n`);
          }
          markdown.appendMarkdown('\n');
        }

        markdown.appendMarkdown(`**用法:** \`${tool.insertText}\``);

        return new vscode.Hover(markdown, mcpRange);
      }
    }
    
    // 检测 @skill 悬停
    const skillRange = document.getWordRangeAtPosition(position, /@skill:[a-zA-Z0-9:_-]+/);
    if (skillRange) {
      const text = document.getText(skillRange);
      const skillId = text.replace('@skill:', '');
      const skill = this.skillTools.get(skillId);

      if (skill) {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`## ${skill.icon} ${skill.name}\n\n`);
        markdown.appendMarkdown(`${skill.description}\n\n`);
        markdown.appendMarkdown(`**类别:** \`${skill.category}\`\n\n`);
        
        if (skill.supportedLanguages && skill.supportedLanguages.length > 0) {
          markdown.appendMarkdown(`**支持语言:** ${skill.supportedLanguages.join(', ')}\n\n`);
        } else {
          markdown.appendMarkdown(`**支持语言:** 所有语言\n\n`);
        }

        markdown.appendMarkdown(`**用法:** \`${skill.insertText}\``);

        return new vscode.Hover(markdown, skillRange);
      }
    }
    
    return null;
  }

  /**
   * 分析代码上下文，推荐相关的MCP工具
   */
  static analyzeCodeContext(document: vscode.TextDocument): CodeAnalysis {
    const text = document.getText();
    const language = document.languageId;
    const suggestedTools: string[] = [];

    // 检测代码特征
    const hasImports = /^(import|require|from)\s/m.test(text);
    const hasFunctions = /function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(|=>\s*{/m.test(text);
    const hasClasses = /class\s+\w+/m.test(text);

    // 基于特征推荐工具
    if (hasFunctions || hasClasses) {
      suggestedTools.push('code:analyze', 'test:generate');
    }

    if (hasImports) {
      suggestedTools.push('code:refactor');
    }

    // 检测测试文件
    if (document.fileName.includes('.test.') || document.fileName.includes('.spec.')) {
      suggestedTools.push('test:run');
    }

    // 检测配置文件
    if (document.fileName.endsWith('package.json') || document.fileName.endsWith('tsconfig.json')) {
      suggestedTools.push('shell:run');
    }

    return {
      hasImports,
      hasFunctions,
      hasClasses,
      language,
      suggestedTools
    };
  }

  /**
   * 获取当前上下文推荐的工具
   */
  static getContextualSuggestions(document: vscode.TextDocument): MCPToolSuggestion[] {
    const analysis = this.analyzeCodeContext(document);
    const suggestions: MCPToolSuggestion[] = [];

    for (const toolId of analysis.suggestedTools) {
      const tool = this.mcpTools.get(toolId);
      if (tool) {
        suggestions.push(tool);
      }
    }

    return suggestions;
  }

  /**
   * 清理资源
   */
  static dispose(): void {
    if (this.completionProvider) {
      this.completionProvider.dispose();
      this.completionProvider = null;
    }
    if (this.hoverProvider) {
      this.hoverProvider.dispose();
      this.hoverProvider = null;
    }
    this.mcpTools.clear();
    this.skillTools.clear();
  }
  
  // ============================================
  // 原有的代码编辑功能
  // ============================================

  /**
   * 分析文本的缩进信息
   */
  static analyzeIndent(text: string): IndentInfo {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      return { char: ' ', size: 2, level: 0, raw: '' };
    }

    // 检测缩进字符（空格或制表符）
    const indents = lines
      .map(line => line.match(/^[\t ]+/)?.[0] || '')
      .filter(indent => indent.length > 0);

    if (indents.length === 0) {
      return { char: ' ', size: 2, level: 0, raw: '' };
    }

    // 检测是否使用 tab
    const usesTabs = indents.some(i => i.includes('\t'));
    const char = usesTabs ? '\t' : ' ';

    // 计算缩进大小
    let size = 2;
    if (!usesTabs) {
      const spaces = indents
        .map(i => i.length)
        .filter(len => len > 0);
      
      if (spaces.length > 1) {
        // 找最小公约数作为缩进大小
        const diffs = [];
        const sorted = [...new Set(spaces)].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          diffs.push(sorted[i] - sorted[i - 1]);
        }
        if (diffs.length > 0) {
          size = Math.min(...diffs.filter(d => d > 0)) || 2;
        }
      } else if (spaces.length === 1) {
        size = spaces[0] <= 4 ? spaces[0] : 2;
      }
    } else {
      size = 1;
    }

    return { char, size, level: 0, raw: '' };
  }

  /**
   * 获取行的缩进信息
   */
  static getLineIndent(line: string, indentInfo: IndentInfo): IndentInfo {
    const match = line.match(/^[\t ]*/);
    const raw = match ? match[0] : '';
    
    let level = 0;
    if (indentInfo.char === '\t') {
      level = (raw.match(/\t/g) || []).length;
    } else {
      level = Math.floor(raw.length / indentInfo.size);
    }

    return { ...indentInfo, level, raw };
  }

  /**
   * 调整代码块的缩进
   */
  static adjustIndent(code: string, targetIndent: IndentInfo): string {
    const lines = code.split('\n');
    if (lines.length === 0) return code;

    // 找到代码块的基础缩进
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    if (nonEmptyLines.length === 0) return code;

    const baseIndent = nonEmptyLines[0].match(/^[\t ]*/)?.[0] || '';
    const baseLevel = this.getLineIndent(nonEmptyLines[0], targetIndent).level;

    // 计算需要的缩进调整
    const targetLevel = targetIndent.level;
    const levelDiff = targetLevel - baseLevel;

    return lines.map(line => {
      if (line.trim().length === 0) {
        return ''; // 保持空行为空
      }

      const currentIndent = line.match(/^[\t ]*/)?.[0] || '';
      const currentLevel = this.getLineIndent(line, targetIndent).level;
      const newLevel = Math.max(0, currentLevel + levelDiff);
      const newIndent = targetIndent.char.repeat(newLevel * targetIndent.size);

      return newIndent + line.trimStart();
    }).join('\n');
  }

  /**
   * 在文档中查找文本位置
   */
  static findTextPosition(
    document: vscode.TextDocument,
    searchText: string,
    startFrom: number = 0
  ): { start: vscode.Position; end: vscode.Position } | null {
    const fullText = document.getText();
    const index = fullText.indexOf(searchText, startFrom);

    if (index === -1) return null;

    const start = document.positionAt(index);
    const end = document.positionAt(index + searchText.length);

    return { start, end };
  }

  /**
   * 模糊匹配查找（忽略缩进差异）
   */
  static findTextFuzzy(
    document: vscode.TextDocument,
    searchText: string
  ): { start: vscode.Position; end: vscode.Position; matchedText: string } | null {
    const fullText = document.getText();
    const searchLines = searchText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (searchLines.length === 0) return null;

    const fullLines = fullText.split('\n');
    
    // 查找第一行匹配
    for (let i = 0; i < fullLines.length; i++) {
      if (fullLines[i].trim() === searchLines[0]) {
        // 检查后续行是否匹配
        let allMatch = true;
        let endLine = i;

        for (let j = 1; j < searchLines.length; j++) {
          if (i + j >= fullLines.length || fullLines[i + j].trim() !== searchLines[j]) {
            allMatch = false;
            break;
          }
          endLine = i + j;
        }

        if (allMatch) {
          const start = new vscode.Position(i, 0);
          const end = new vscode.Position(endLine, fullLines[endLine].length);
          const matchedText = fullLines.slice(i, endLine + 1).join('\n');
          return { start, end, matchedText };
        }
      }
    }

    return null;
  }

  /**
   * 执行字符串替换（Claude Code 核心功能）
   */
  static async replaceText(
    document: vscode.TextDocument,
    oldText: string,
    newText: string,
    options: { fuzzy?: boolean; adjustIndent?: boolean } = {}
  ): Promise<boolean> {
    const editor = await vscode.window.showTextDocument(document);

    // 先尝试精确匹配
    let position = this.findTextPosition(document, oldText);

    // 如果精确匹配失败且启用模糊匹配，尝试模糊匹配
    if (!position && options.fuzzy) {
      const fuzzyResult = this.findTextFuzzy(document, oldText);
      if (fuzzyResult) {
        position = { start: fuzzyResult.start, end: fuzzyResult.end };
        // 调整新文本的缩进以匹配原始文本
        if (options.adjustIndent) {
          const indentInfo = this.analyzeIndent(document.getText());
          const targetIndent = this.getLineIndent(
            document.lineAt(fuzzyResult.start.line).text,
            indentInfo
          );
          newText = this.adjustIndent(newText, targetIndent);
        }
      }
    }

    if (!position) {
      return false;
    }

    // 如果需要调整缩进
    if (options.adjustIndent && !options.fuzzy) {
      const indentInfo = this.analyzeIndent(document.getText());
      const targetIndent = this.getLineIndent(
        document.lineAt(position.start.line).text,
        indentInfo
      );
      newText = this.adjustIndent(newText, targetIndent);
    }

    const range = new vscode.Range(position.start, position.end);
    
    const success = await editor.edit(editBuilder => {
      editBuilder.replace(range, newText);
    });

    if (success) {
      // 保存文档
      await document.save();
    }

    return success;
  }

  /**
   * 在锚点前后插入代码
   */
  static async insertNearAnchor(
    document: vscode.TextDocument,
    anchor: string,
    content: string,
    position: 'before' | 'after',
    options: { adjustIndent?: boolean } = {}
  ): Promise<boolean> {
    const editor = await vscode.window.showTextDocument(document);
    
    const anchorPosition = this.findTextPosition(document, anchor);
    if (!anchorPosition) return false;

    // 获取锚点行的缩进
    const indentInfo = this.analyzeIndent(document.getText());
    const anchorLine = document.lineAt(anchorPosition.start.line);
    const targetIndent = this.getLineIndent(anchorLine.text, indentInfo);

    // 调整插入内容的缩进
    if (options.adjustIndent) {
      content = this.adjustIndent(content, targetIndent);
    }

    let insertPosition: vscode.Position;
    let insertContent: string;

    if (position === 'before') {
      insertPosition = new vscode.Position(anchorPosition.start.line, 0);
      insertContent = content + '\n';
    } else {
      insertPosition = new vscode.Position(anchorPosition.end.line + 1, 0);
      insertContent = content + '\n';
    }

    const success = await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, insertContent);
    });

    if (success) {
      await document.save();
    }

    return success;
  }

  /**
   * 在指定行插入代码
   */
  static async insertAtLine(
    document: vscode.TextDocument,
    lineNumber: number,
    content: string,
    options: { adjustIndent?: boolean; referenceLineOffset?: number } = {}
  ): Promise<boolean> {
    const editor = await vscode.window.showTextDocument(document);

    // 确保行号有效
    const targetLine = Math.max(0, Math.min(lineNumber, document.lineCount));

    // 获取参考行的缩进
    if (options.adjustIndent) {
      const refLine = Math.max(0, targetLine + (options.referenceLineOffset || -1));
      if (refLine < document.lineCount) {
        const indentInfo = this.analyzeIndent(document.getText());
        const targetIndent = this.getLineIndent(document.lineAt(refLine).text, indentInfo);
        content = this.adjustIndent(content, targetIndent);
      }
    }

    const insertPosition = new vscode.Position(targetLine, 0);
    
    const success = await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, content + '\n');
    });

    if (success) {
      await document.save();
    }

    return success;
  }

  /**
   * 删除指定文本
   */
  static async deleteText(
    document: vscode.TextDocument,
    targetText: string,
    options: { fuzzy?: boolean; deleteWholeLine?: boolean } = {}
  ): Promise<boolean> {
    const editor = await vscode.window.showTextDocument(document);

    let position = this.findTextPosition(document, targetText);
    
    if (!position && options.fuzzy) {
      const fuzzyResult = this.findTextFuzzy(document, targetText);
      if (fuzzyResult) {
        position = { start: fuzzyResult.start, end: fuzzyResult.end };
      }
    }

    if (!position) return false;

    let range: vscode.Range;
    
    if (options.deleteWholeLine) {
      range = new vscode.Range(
        new vscode.Position(position.start.line, 0),
        new vscode.Position(position.end.line + 1, 0)
      );
    } else {
      range = new vscode.Range(position.start, position.end);
    }

    const success = await editor.edit(editBuilder => {
      editBuilder.delete(range);
    });

    if (success) {
      await document.save();
    }

    return success;
  }

  /**
   * 批量执行编辑操作
   */
  static async applyEdits(
    document: vscode.TextDocument,
    operations: EditOperation[]
  ): Promise<{ success: boolean; failedOps: number[] }> {
    const failedOps: number[] = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      let success = false;

      switch (op.type) {
        case 'replace':
          success = await this.replaceText(document, op.oldText, op.newText, {
            fuzzy: true,
            adjustIndent: true,
          });
          break;
        case 'insert':
          success = await this.insertNearAnchor(document, op.anchor, op.content, op.position, {
            adjustIndent: true,
          });
          break;
        case 'insertAtLine':
          success = await this.insertAtLine(document, op.line, op.content, {
            adjustIndent: true,
          });
          break;
        case 'delete':
          success = await this.deleteText(document, op.target, {
            fuzzy: true,
            deleteWholeLine: true,
          });
          break;
        case 'wrap':
          // 先找到目标，然后替换
          success = await this.replaceText(
            document,
            op.target,
            op.before + op.target + op.after,
            { fuzzy: true }
          );
          break;
      }

      if (!success) {
        failedOps.push(i);
      }

      // 重新获取文档（因为内容已改变）
      // document 会自动更新
    }

    return {
      success: failedOps.length === 0,
      failedOps,
    };
  }

  /**
   * 从 AI 响应中提取代码并应用
   */
  static async applyCodeFromAI(
    targetDocument: vscode.TextDocument,
    aiResponse: string
  ): Promise<{ success: boolean; message: string }> {
    // 解析 AI 响应中的代码块和操作指令
    const operations = this.parseAIResponse(aiResponse);

    if (operations.length === 0) {
      return { success: false, message: 'No code changes found in AI response' };
    }

    const result = await this.applyEdits(targetDocument, operations);

    if (result.success) {
      return { success: true, message: `Applied ${operations.length} changes successfully` };
    } else {
      return {
        success: false,
        message: `Failed to apply ${result.failedOps.length} of ${operations.length} changes`,
      };
    }
  }

  /**
   * 解析 AI 响应中的代码操作
   */
  private static parseAIResponse(response: string): EditOperation[] {
    const operations: EditOperation[] = [];

    // 匹配 ```diff 或 ```patch 格式
    const diffMatch = response.match(/```(?:diff|patch)\n([\s\S]*?)```/g);
    if (diffMatch) {
      for (const diff of diffMatch) {
        const parsed = this.parseDiff(diff);
        operations.push(...parsed);
      }
    }

    // 匹配 SEARCH/REPLACE 格式（Claude Code 风格）
    const searchReplaceMatch = response.match(
      /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g
    );
    if (searchReplaceMatch) {
      for (const block of searchReplaceMatch) {
        const match = block.match(
          /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/
        );
        if (match) {
          operations.push({
            type: 'replace',
            oldText: match[1],
            newText: match[2],
          });
        }
      }
    }

    return operations;
  }

  /**
   * 解析 diff 格式
   */
  private static parseDiff(diff: string): EditOperation[] {
    const operations: EditOperation[] = [];
    const lines = diff.split('\n');
    
    let oldLines: string[] = [];
    let newLines: string[] = [];
    let inHunk = false;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // 开始新的 hunk
        if (oldLines.length > 0 || newLines.length > 0) {
          operations.push({
            type: 'replace',
            oldText: oldLines.join('\n'),
            newText: newLines.join('\n'),
          });
        }
        oldLines = [];
        newLines = [];
        inHunk = true;
      } else if (inHunk) {
        if (line.startsWith('-')) {
          oldLines.push(line.slice(1));
        } else if (line.startsWith('+')) {
          newLines.push(line.slice(1));
        } else if (line.startsWith(' ')) {
          oldLines.push(line.slice(1));
          newLines.push(line.slice(1));
        }
      }
    }

    // 处理最后一个 hunk
    if (oldLines.length > 0 || newLines.length > 0) {
      operations.push({
        type: 'replace',
        oldText: oldLines.join('\n'),
        newText: newLines.join('\n'),
      });
    }

    return operations;
  }
}
