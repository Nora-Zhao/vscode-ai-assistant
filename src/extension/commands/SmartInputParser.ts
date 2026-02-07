/**
 * 智能输入解析器
 * 区分用户的自然语言提问和执行指令
 */

// 输入类型枚举
export enum InputType {
  COMMAND = 'command',           // 斜杠命令 /xxx
  SHELL_COMMAND = 'shell',       // Shell 命令 !xxx
  NATURAL_QUESTION = 'question', // 自然语言提问
  NATURAL_REQUEST = 'request',   // 自然语言请求（要求AI做某事）
  CODE_REQUEST = 'code',         // 代码相关请求
  MIXED = 'mixed'                // 混合类型
}

// 解析结果
export interface ParsedInput {
  type: InputType;
  originalInput: string;
  cleanInput: string;
  confidence: number;  // 0-1 的置信度
  suggestion?: string; // 建议提示
  detectedIntent?: string; // 检测到的意图
  possibleCommand?: string; // 可能对应的命令
}

// 关键词模式
const QUESTION_PATTERNS = [
  // 中文疑问词
  /^(什么|怎么|如何|为什么|哪个|哪里|谁|多少|是否|能否|可以吗|是不是)/,
  /[？?]$/,
  /(吗|呢|吧)[？?]?$/,
  // 英文疑问词
  /^(what|how|why|where|when|who|which|can|could|would|should|is|are|do|does)/i,
  /\?$/,
];

const REQUEST_PATTERNS = [
  // 中文请求词
  /^(请|帮我|帮忙|能不能|可以|麻烦|给我|我想|我要|我需要|创建|生成|写|编写|修改|优化|重构|解释|分析)/,
  /(一下|一个|帮我)$/,
  // 英文请求词
  /^(please|help|create|generate|write|modify|fix|explain|analyze|refactor|optimize|make)/i,
];

const CODE_PATTERNS = [
  // 代码相关关键词
  /代码|函数|方法|类|接口|变量|bug|报错|错误|异常|测试|单元测试/,
  /code|function|method|class|interface|variable|bug|error|exception|test|unit test/i,
  // 代码块标识
  /```[\s\S]*```/,
  // 文件扩展名
  /\.(ts|tsx|js|jsx|py|go|java|rs|vue|css|html|json|md)(\s|$)/i,
];

// 可能是命令的自然语言映射
// 使用更精确的匹配规则，避免误匹配
const NATURAL_TO_COMMAND_MAP: Record<string, { pattern: RegExp; command: string }> = {
  // 项目相关 - 需要明确的项目分析意图
  '分析项目': { pattern: /^(分析|了解|查看|初始化)(一下|下)?项目/, command: '/init' },
  '项目结构': { pattern: /^(查看|显示|看下)?项目(结构|信息|概览)/, command: '/init' },
  
  // 文件相关 - 需要明确的文件操作意图
  '读取文件': { pattern: /^(读取|打开|查看)(一下)?文件\s*[:：]?\s*\S+/, command: '/file' },
  '搜索代码': { pattern: /^(搜索|查找|找)(一下)?(代码|文件)\s*[:：]?\s*\S+/, command: '/search' },
  
  // Git相关 - 需要明确的git操作意图
  '查看状态': { pattern: /^(查看|显示)git?状态/, command: '/git status' },
  '提交代码': { pattern: /^(git\s+)?commit|^提交(代码|更改)/, command: '/git commit' },
  '推送代码': { pattern: /^(git\s+)?push|^推送(代码)?/, command: '/git push' },
  '拉取代码': { pattern: /^(git\s+)?pull|^拉取(代码)?/, command: '/git pull' },
  
  // 图表相关 - 需要明确的图表类型
  '生成流程图': { pattern: /^(生成|画|创建)(一个|一张)?流程图/, command: '/diagram flowchart' },
  '生成时序图': { pattern: /^(生成|画|创建)(一个|一张)?时序图/, command: '/diagram sequence' },
  '生成类图': { pattern: /^(生成|画|创建)(一个|一张)?类图/, command: '/diagram class' },
  '生成架构图': { pattern: /^(生成|画|创建)(一个|一张)?架构图/, command: '/diagram architecture' },
  
  // 测试相关 - 需要明确的测试生成意图
  '生成测试': { pattern: /^(生成|写|创建)(一下)?(单元)?测试/, command: '/gentest' },
  '运行测试': { pattern: /^(运行|执行)(一下)?测试/, command: '/test' },
  
  // 构建相关
  '构建项目': { pattern: /^(构建|编译)(一下)?项目/, command: '/build' },
  
  // 帮助 - 只在明确要求帮助时匹配，排除"帮我"、"帮忙"等
  '帮助': { pattern: /^(查看)?帮助$|^命令列表$|^怎么用$|^\/help$/, command: '/help' },
};

/**
 * 智能输入解析器
 */
export class SmartInputParser {
  /**
   * 解析用户输入
   */
  parse(input: string): ParsedInput {
    const trimmed = input.trim();
    
    // 空输入
    if (!trimmed) {
      return {
        type: InputType.NATURAL_QUESTION,
        originalInput: input,
        cleanInput: '',
        confidence: 1,
      };
    }
    
    // 明确的命令格式
    if (trimmed.startsWith('/')) {
      return this._parseCommand(trimmed);
    }
    
    // Shell 命令格式
    if (trimmed.startsWith('!')) {
      return this._parseShellCommand(trimmed);
    }
    
    // 自然语言分析
    return this._parseNaturalLanguage(trimmed);
  }

  /**
   * 解析斜杠命令
   */
  private _parseCommand(input: string): ParsedInput {
    return {
      type: InputType.COMMAND,
      originalInput: input,
      cleanInput: input,
      confidence: 1,
      detectedIntent: 'execute_command',
    };
  }

  /**
   * 解析 Shell 命令
   */
  private _parseShellCommand(input: string): ParsedInput {
    const command = input.substring(1).trim();
    return {
      type: InputType.SHELL_COMMAND,
      originalInput: input,
      cleanInput: command,
      confidence: 1,
      detectedIntent: 'run_shell',
      possibleCommand: `/run ${command}`,
    };
  }

  /**
   * 解析自然语言
   */
  private _parseNaturalLanguage(input: string): ParsedInput {
    const lowerInput = input.toLowerCase();
    let confidence = 0.5;
    let type = InputType.NATURAL_QUESTION;
    let detectedIntent: string | undefined;
    let possibleCommand: string | undefined;
    let suggestion: string | undefined;

    // 检查是否匹配已知的命令映射（使用正则表达式精确匹配）
    for (const [name, info] of Object.entries(NATURAL_TO_COMMAND_MAP)) {
      if (info.pattern.test(input)) {
        possibleCommand = info.command;
        suggestion = `💡 检测到可能想执行: ${info.command}，直接输入命令会更快哦`;
        confidence = 0.7;
        type = InputType.MIXED;
        detectedIntent = 'command_hint';
        break;
      }
    }

    // 检查是否是问题
    const isQuestion = QUESTION_PATTERNS.some(p => p.test(input));
    if (isQuestion) {
      type = InputType.NATURAL_QUESTION;
      confidence = Math.max(confidence, 0.8);
      detectedIntent = 'asking_question';
    }

    // 检查是否是请求
    const isRequest = REQUEST_PATTERNS.some(p => p.test(input));
    if (isRequest) {
      type = InputType.NATURAL_REQUEST;
      confidence = Math.max(confidence, 0.8);
      detectedIntent = 'making_request';
    }

    // 检查是否涉及代码
    const isCodeRelated = CODE_PATTERNS.some(p => p.test(input));
    if (isCodeRelated) {
      type = InputType.CODE_REQUEST;
      confidence = Math.max(confidence, 0.85);
      detectedIntent = 'code_related';
    }

    // 特殊情况：检测看起来像命令但没有斜杠的输入
    const commandLikePatterns = [
      /^(init|help|clear|search|build|test|git|diagram|gentest)\s*/i,
    ];
    
    for (const pattern of commandLikePatterns) {
      const match = input.match(pattern);
      if (match) {
        possibleCommand = `/${match[1].toLowerCase()}${input.substring(match[0].length).trim() ? ' ' + input.substring(match[0].length).trim() : ''}`;
        suggestion = `💡 你是否想执行命令？试试输入: ${possibleCommand}`;
        break;
      }
    }

    return {
      type,
      originalInput: input,
      cleanInput: input,
      confidence,
      suggestion,
      detectedIntent,
      possibleCommand,
    };
  }

  /**
   * 获取输入提示
   */
  getInputHints(input: string): string[] {
    const hints: string[] = [];
    const parsed = this.parse(input);
    
    if (parsed.suggestion) {
      hints.push(parsed.suggestion);
    }

    // 根据输入类型给出提示
    if (parsed.type === InputType.NATURAL_QUESTION) {
      hints.push('💬 这看起来是一个问题，AI 将直接回答');
    } else if (parsed.type === InputType.NATURAL_REQUEST) {
      hints.push('🔧 这看起来是一个请求，AI 将尝试帮你完成');
    } else if (parsed.type === InputType.CODE_REQUEST) {
      hints.push('💻 检测到代码相关内容，AI 将以代码视角分析');
    }

    return hints;
  }

  /**
   * 建议转换为命令
   */
  suggestCommand(input: string): string | null {
    const parsed = this.parse(input);
    return parsed.possibleCommand || null;
  }

  /**
   * 判断是否应该直接执行命令
   */
  shouldExecuteAsCommand(input: string): boolean {
    return input.startsWith('/') || input.startsWith('!');
  }

  /**
   * 智能判断用户意图并给出建议
   */
  analyzeIntent(input: string): {
    primaryIntent: string;
    secondaryIntents: string[];
    suggestedActions: Array<{ label: string; action: string }>;
  } {
    const parsed = this.parse(input);
    const intents: string[] = [];
    const actions: Array<{ label: string; action: string }> = [];

    // 分析主要意图
    let primaryIntent = '对话';
    
    if (parsed.type === InputType.COMMAND) {
      primaryIntent = '执行命令';
    } else if (parsed.type === InputType.SHELL_COMMAND) {
      primaryIntent = '运行终端命令';
    } else if (parsed.type === InputType.CODE_REQUEST) {
      primaryIntent = '代码处理';
      intents.push('可能需要生成代码', '可能需要修复代码', '可能需要解释代码');
      actions.push(
        { label: '生成测试', action: '/gentest' },
        { label: '生成图表', action: '/diagram' }
      );
    } else if (parsed.type === InputType.NATURAL_REQUEST) {
      primaryIntent = '请求帮助';
      if (parsed.possibleCommand) {
        actions.push({ label: `执行: ${parsed.possibleCommand}`, action: parsed.possibleCommand });
      }
    }

    return {
      primaryIntent,
      secondaryIntents: intents,
      suggestedActions: actions,
    };
  }
}

// 导出单例
export const smartInputParser = new SmartInputParser();
