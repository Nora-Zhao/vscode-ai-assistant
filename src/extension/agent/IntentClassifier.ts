/**
 * Intent Classifier - 意图分类器 (v2)
 * 
 * 核心职责：准确区分用户输入的意图路由
 * 
 * 路由逻辑：
 *   /命令      → command
 *   @mcp:xxx  → mcp_tool (显式)
 *   @skill:xxx→ skill (显式)
 *   自然语言：
 *     代码操作(有选中代码) → code_action (AI直接处理)
 *     skill关键词匹配     → skill (需要特定技能包)
 *     MCP关键词匹配       → mcp_tool (需要外部工具)
 *     其他               → chat (普通对话)
 * 
 * 关键原则：
 * - 代码解释/修复/优化/注释 = chat (AI本身就能做)
 * - 文件读写/终端/搜索 = mcp_tool (需要外部工具)
 * - 安全检查/测试架构/代码审查报告 = skill (需要特定skill包)
 */

/** 意图类型 */
export type IntentType =
  | 'chat'           // 普通对话 / 代码操作
  | 'code_action'    // 代码操作（带选中代码上下文）
  | 'skill'          // 技能包调用
  | 'mcp_tool'       // MCP工具调用
  | 'command';       // 斜杠命令

/** 代码操作类型 */
export type CodeActionType =
  | 'explain' | 'fix' | 'optimize' | 'comment'
  | 'review' | 'refactor' | 'test';

/** 意图分类结果 */
export interface IntentResult {
  type: IntentType;
  confidence: number;
  codeAction?: CodeActionType;
  skillId?: string;
  skillParams?: Record<string, any>;
  mcpToolHint?: string;
  command?: { name: string; args: string };
  rawInput: string;
  processedPrompt?: string;
}

/** Skill触发规则（可动态注入） */
export interface SkillTriggerRule {
  skillId: string;
  patterns: RegExp[];
  priority: number;
}

/**
 * 意图分类器
 */
export class IntentClassifier {
  /** 动态注册的skill触发规则 */
  private dynamicSkillTriggers: SkillTriggerRule[] = [];

  /** 内置skill触发规则 */
  private readonly builtinSkillTriggers: SkillTriggerRule[] = [
    {
      skillId: 'dependency-guardian',
      priority: 10,
      patterns: [
        /npm\s+audit/i,
        /(安全|漏洞)\s*(检查|扫描|审计|检测)/i,
        /依赖\s*(安全|漏洞|检查)/i,
        /security\s+(audit|check|scan)/i,
      ],
    },
    {
      skillId: 'code-reviewer',
      priority: 10,
      patterns: [
        /(全面|深度|完整)\s*代码\s*审查/i,
        /code\s*review\s*(报告|report)/i,
        /(项目|全局)\s*代码\s*(审查|检查|扫描)/i,
      ],
    },
    {
      skillId: 'test-architect',
      priority: 10,
      patterns: [
        /测试\s*(架构|方案|策略|规划)/i,
        /(设计|规划)\s*测试\s*(架构|方案|策略)/i,
        /test\s+(architecture|strategy|plan)/i,
      ],
    },
    {
      skillId: 'tool-maker',
      priority: 5,
      patterns: [
        /写\s*(一个|个)?\s*(脚本|工具|cli)\s*[:：]?\s*\S+/i,
        /创建\s*(一个)?\s*(脚本|工具|cli)\s*[:：]?\s*\S+/i,
        /(批量重命名|日志分析|图片压缩|文件整理).*(工具|脚本)/i,
        /(工具|脚本).*(批量重命名|日志分析|图片压缩|文件整理)/i,
      ],
    },
  ];

  /** MCP触发规则 */
  private readonly mcpTriggers = [
    {
      toolHint: 'builtin_read_file',
      patterns: [
        /^(读取|打开|查看)\s*(文件|代码|内容)\s*[:：]?\s*\S+/i,
        /^read\s+(file|content)\s+\S+/i,
      ],
    },
    {
      toolHint: 'builtin_search_code',
      patterns: [
        /^(搜索|查找|检索|grep)\s*(代码|文件|项目)\s*[:：]?\s*\S+/i,
        /^(search|find|grep)\s+(code|file|project)\s+\S+/i,
      ],
    },
    {
      toolHint: 'builtin_shell_exec',
      patterns: [
        /^(执行|运行)\s*(命令|shell|终端|脚本)\s*[:：]?\s*\S+/i,
        /^(run|execute)\s+(command|script|shell)\s+\S+/i,
      ],
    },
  ];

  /** 代码操作模式 */
  private readonly codeActionPatterns: Array<{ pattern: RegExp; action: CodeActionType }> = [
    { pattern: /^(解释|explain|说明|分析|讲解|这段?代码.*(做什么|干什么|意思|作用)|what does|what is)/i, action: 'explain' },
    { pattern: /^(修复|fix|修改错误|修正|debug|解决.*bug)/i, action: 'fix' },
    { pattern: /^(优化|optimize|改进|提升性能|performance)/i, action: 'optimize' },
    { pattern: /^(添加?注释|加注释|comment|document)/i, action: 'comment' },
    { pattern: /^(审查|review|检查代码|检视|code review|cr)/i, action: 'review' },
    { pattern: /^(重构|refactor)/i, action: 'refactor' },
  ];

  /** 已知命令集合 */
  private readonly knownCommands = new Set([
    'help', 'clear', 'init', 'search', 'run', 'new',
    'gst', 'gpl', 'gps', 'gcm', 'gaa', 'gco', 'gentest',
    'diagram', 'test', 'report', 'build', 'file', 'skill',
  ]);

  /** 技能命令映射 */
  private readonly skillCommandMap: Record<string, string> = {
    'audit': 'dependency-guardian',
    'review': 'code-reviewer',
    'testplan': 'test-architect',
    'tool': 'tool-maker',
  };

  // ========== 公开方法 ==========

  /**
   * 注册额外的skill触发规则
   */
  registerSkillTriggers(rules: SkillTriggerRule[]): void {
    for (const rule of rules) {
      const idx = this.dynamicSkillTriggers.findIndex(r => r.skillId === rule.skillId);
      if (idx >= 0) {
        this.dynamicSkillTriggers[idx] = rule;
      } else {
        this.dynamicSkillTriggers.push(rule);
      }
    }
    this.dynamicSkillTriggers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除skill触发规则
   */
  removeSkillTrigger(skillId: string): void {
    this.dynamicSkillTriggers = this.dynamicSkillTriggers.filter(r => r.skillId !== skillId);
  }

  /**
   * 获取已注册的触发规则
   */
  getRegisteredTriggers(): SkillTriggerRule[] {
    return [...this.builtinSkillTriggers, ...this.dynamicSkillTriggers];
  }

  /**
   * 分类用户输入的意图
   */
  classify(input: string, context?: {
    hasSelectedCode?: boolean;
    currentFile?: string;
    projectType?: string;
  }): IntentResult {
    const trimmed = input.trim();

    // 1. 斜杠命令
    if (trimmed.startsWith('/')) {
      return this.parseSlashCommand(trimmed);
    }

    // 2. 显式 @mcp:xxx
    const mcpMatch = trimmed.match(/^@mcp[：:]\s*(\S+)\s*(.*)?$/i);
    if (mcpMatch) {
      return {
        type: 'mcp_tool',
        confidence: 1.0,
        mcpToolHint: mcpMatch[1],
        rawInput: trimmed,
        processedPrompt: mcpMatch[2] || '',
      };
    }

    // 3. 显式 @skill:xxx
    const skillMatch = trimmed.match(/^@skill[：:]\s*(\S+)\s*(.*)?$/i);
    if (skillMatch) {
      let skillParams: Record<string, any> | undefined;
      const paramsStr = skillMatch[2]?.trim();
      if (paramsStr) {
        try { skillParams = JSON.parse(paramsStr); } catch { skillParams = { userInput: paramsStr }; }
      }
      return {
        type: 'skill', confidence: 1.0,
        skillId: skillMatch[1], skillParams,
        rawInput: trimmed,
      };
    }

    // 4. 有选中代码时优先检测代码操作
    if (context?.hasSelectedCode) {
      const action = this.detectCodeAction(trimmed);
      if (action && action.confidence >= 0.8) return action;
    }

    // 5. Skill触发检测
    const skillIntent = this.detectSkillIntent(trimmed);
    if (skillIntent) return skillIntent;

    // 6. MCP工具触发检测
    const mcpIntent = this.detectMCPToolIntent(trimmed);
    if (mcpIntent) return mcpIntent;

    // 7. 无选中代码的代码操作（降低要求）
    const codeAction = this.detectCodeAction(trimmed);
    if (codeAction && codeAction.confidence >= 0.7) return codeAction;

    // 8. 默认：普通对话
    return { type: 'chat', confidence: 1.0, rawInput: trimmed, processedPrompt: trimmed };
  }

  // ========== 内部方法 ==========

  private detectMCPToolIntent(input: string): IntentResult | null {
    for (const trigger of this.mcpTriggers) {
      for (const pattern of trigger.patterns) {
        if (pattern.test(input)) {
          return {
            type: 'mcp_tool', confidence: 0.8,
            mcpToolHint: trigger.toolHint,
            rawInput: input, processedPrompt: input,
          };
        }
      }
    }
    return null;
  }

  private detectSkillIntent(input: string): IntentResult | null {
    const allTriggers = [...this.builtinSkillTriggers, ...this.dynamicSkillTriggers]
      .sort((a, b) => b.priority - a.priority);

    for (const trigger of allTriggers) {
      for (const pattern of trigger.patterns) {
        if (pattern.test(input)) {
          return {
            type: 'skill', confidence: 0.9,
            skillId: trigger.skillId,
            skillParams: { userInput: input },
            rawInput: input,
          };
        }
      }
    }
    return null;
  }

  private parseSlashCommand(input: string): IntentResult {
    const match = input.match(/^\/(\w+)(?:\s+(.*))?$/);
    if (!match) {
      return { type: 'chat', confidence: 0.5, rawInput: input };
    }

    const [, command, args] = match;
    const cmd = command.toLowerCase();

    if (this.knownCommands.has(cmd)) {
      return {
        type: 'command', confidence: 1.0,
        rawInput: input, command: { name: command, args: args || '' },
      };
    }

    if (this.skillCommandMap[cmd]) {
      return {
        type: 'skill', confidence: 1.0,
        skillId: this.skillCommandMap[cmd],
        rawInput: input,
        command: { name: command, args: args || '' },
        skillParams: args ? { userInput: args } : undefined,
      };
    }

    return { type: 'chat', confidence: 0.8, rawInput: input, processedPrompt: input };
  }

  private detectCodeAction(input: string): IntentResult | null {
    for (const { pattern, action } of this.codeActionPatterns) {
      if (pattern.test(input)) {
        return {
          type: 'code_action', confidence: 0.85,
          codeAction: action, rawInput: input,
          processedPrompt: this.buildCodeActionPrompt(action, input),
        };
      }
    }
    return null;
  }

  private buildCodeActionPrompt(action: CodeActionType, input: string): string {
    const map: Record<CodeActionType, string> = {
      explain: `请详细解释以下代码的功能和实现逻辑：\n\n${input}`,
      fix: `请检查并修复以下代码中的问题。使用 SEARCH/REPLACE 格式：\n\n${input}`,
      optimize: `请优化以下代码。使用 SEARCH/REPLACE 格式：\n\n${input}`,
      comment: `请为以下代码添加清晰注释。使用 SEARCH/REPLACE 格式：\n\n${input}`,
      review: `请对以下代码进行审查，指出问题和改进建议：\n\n${input}`,
      refactor: `请重构以下代码。使用 SEARCH/REPLACE 格式：\n\n${input}`,
      test: `请为以下代码生成单元测试：\n\n${input}`,
    };
    return map[action] || input;
  }
}

/** 导出单例 */
export const intentClassifier = new IntentClassifier();
