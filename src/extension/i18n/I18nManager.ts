/**
 * 国际化 (i18n) 系统
 * 支持中文和英文的AI回复和UI文本
 */

import * as vscode from 'vscode';

/** 支持的语言 */
export type SupportedLanguage = 'zh-CN' | 'en-US';

/** 语言配置信息 */
export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  aiPromptSuffix: string;
}

/** 所有支持的语言 */
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    aiPromptSuffix: '请使用中文回复。',
  },
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    aiPromptSuffix: 'Please respond in English.',
  },
];

/** 翻译键值 */
export interface Translations {
  // 通用
  common: {
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    copy: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    retry: string;
    refresh: string;
    search: string;
    clear: string;
    reset: string;
  };
  
  // 聊天相关
  chat: {
    newConversation: string;
    clearContext: string;
    compactContext: string;
    sendMessage: string;
    stopGeneration: string;
    regenerate: string;
    inputPlaceholder: string;
    thinking: string;
    generating: string;
    completed: string;
    error: string;
    noApiKey: string;
    selectProvider: string;
    selectModel: string;
    temperature: string;
    maxTokens: string;
  };
  
  // 任务状态
  task: {
    idle: string;
    running: string;
    success: string;
    failed: string;
    cancelled: string;
    pending: string;
    
    // 具体任务
    generatingDiagram: string;
    diagramCompleted: string;
    generatingTest: string;
    testCompleted: string;
    executingCommand: string;
    commandCompleted: string;
    executingSkill: string;
    skillCompleted: string;
    
    // 并行任务
    parallelTasksRunning: string;
    parallelTasksCompleted: string;
    taskProgress: string;
  };
  
  // 图表相关
  diagram: {
    title: string;
    flowchart: string;
    sequence: string;
    class: string;
    state: string;
    er: string;
    gantt: string;
    pie: string;
    mindmap: string;
    architecture: string;
    generate: string;
    export: string;
    edit: string;
    preview: string;
    save: string;
    history: string;
    invalidCode: string;
  };
  
  // 测试相关
  test: {
    title: string;
    generate: string;
    run: string;
    save: string;
    fix: string;
    refine: string;
    framework: string;
    coverage: string;
    passed: string;
    failed: string;
    skipped: string;
    history: string;
  };
  
  // MCP 相关
  mcp: {
    title: string;
    serverManagement: string;
    addServer: string;
    removeServer: string;
    connectServer: string;
    disconnectServer: string;
    serverStatus: string;
    connected: string;
    disconnected: string;
    connecting: string;
    error: string;
    tools: string;
    resources: string;
    prompts: string;
    demoConfigs: string;
    importConfig: string;
    exportConfig: string;
  };
  
  // 技能相关
  skill: {
    title: string;
    dependencyCheck: string;
    testArchitect: string;
    codeReviewer: string;
    excelProcessor: string;
    wordProcessor: string;
    pptProcessor: string;
    toolMaker: string;
    executing: string;
    completed: string;
    failed: string;
  };
  
  // 错误消息
  errors: {
    networkError: string;
    apiKeyMissing: string;
    apiKeyInvalid: string;
    modelNotFound: string;
    rateLimited: string;
    serverError: string;
    timeout: string;
    unknown: string;
    noWorkspace: string;
    fileNotFound: string;
    permissionDenied: string;
  };
  
  // AI 系统提示
  ai: {
    systemPrompt: string;
    codeAssistantPrompt: string;
    diagramAssistantPrompt: string;
    testAssistantPrompt: string;
  };
}

/** 中文翻译 */
const ZH_CN: Translations = {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    copy: '复制',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    yes: '是',
    no: '否',
    ok: '确定',
    retry: '重试',
    refresh: '刷新',
    search: '搜索',
    clear: '清除',
    reset: '重置',
  },
  
  chat: {
    newConversation: '新建对话',
    clearContext: '清除上下文',
    compactContext: '压缩上下文',
    sendMessage: '发送消息',
    stopGeneration: '停止生成',
    regenerate: '重新生成',
    inputPlaceholder: '输入消息... 按 Enter 发送，Shift+Enter 换行',
    thinking: '思考中...',
    generating: '生成中...',
    completed: '已完成',
    error: '出错了',
    noApiKey: '请先设置 API Key',
    selectProvider: '选择提供商',
    selectModel: '选择模型',
    temperature: '温度',
    maxTokens: '最大 Token 数',
  },
  
  task: {
    idle: '空闲',
    running: '运行中',
    success: '成功',
    failed: '失败',
    cancelled: '已取消',
    pending: '等待中',
    
    generatingDiagram: '正在生成流程图...',
    diagramCompleted: '流程图生成完成',
    generatingTest: '正在生成测试代码...',
    testCompleted: '测试生成完成',
    executingCommand: '正在执行命令...',
    commandCompleted: '命令执行完成',
    executingSkill: '正在执行技能...',
    skillCompleted: '技能执行完成',
    
    parallelTasksRunning: '正在并行执行 {count} 个任务...',
    parallelTasksCompleted: '已完成 {completed}/{total} 个任务',
    taskProgress: '任务进度: {progress}%',
  },
  
  diagram: {
    title: '流程图',
    flowchart: '流程图',
    sequence: '时序图',
    class: '类图',
    state: '状态图',
    er: 'ER图',
    gantt: '甘特图',
    pie: '饼图',
    mindmap: '思维导图',
    architecture: '架构图',
    generate: '生成图表',
    export: '导出图表',
    edit: '编辑图表',
    preview: '预览',
    save: '保存图表',
    history: '历史记录',
    invalidCode: '图表代码无效',
  },
  
  test: {
    title: '测试',
    generate: '生成测试',
    run: '运行测试',
    save: '保存测试',
    fix: '修复测试',
    refine: '优化测试',
    framework: '测试框架',
    coverage: '覆盖率',
    passed: '通过',
    failed: '失败',
    skipped: '跳过',
    history: '测试历史',
  },
  
  mcp: {
    title: 'MCP 服务器',
    serverManagement: '服务器管理',
    addServer: '添加服务器',
    removeServer: '移除服务器',
    connectServer: '连接服务器',
    disconnectServer: '断开连接',
    serverStatus: '服务器状态',
    connected: '已连接',
    disconnected: '未连接',
    connecting: '连接中...',
    error: '连接错误',
    tools: '可用工具',
    resources: '可用资源',
    prompts: '可用提示',
    demoConfigs: 'Demo 配置',
    importConfig: '导入配置',
    exportConfig: '导出配置',
  },
  
  skill: {
    title: 'AI 技能',
    dependencyCheck: '依赖安全检查',
    testArchitect: '测试架构师',
    codeReviewer: '代码审查',
    excelProcessor: 'Excel 处理',
    wordProcessor: 'Word 处理',
    pptProcessor: 'PPT 处理',
    toolMaker: '工具制作',
    executing: '正在执行...',
    completed: '执行完成',
    failed: '执行失败',
  },
  
  errors: {
    networkError: '网络连接错误，请检查网络设置',
    apiKeyMissing: 'API Key 未设置，请在设置中配置',
    apiKeyInvalid: 'API Key 无效，请检查配置',
    modelNotFound: '模型不存在或不可用',
    rateLimited: '请求过于频繁，请稍后再试',
    serverError: '服务器错误，请稍后重试',
    timeout: '请求超时，请重试',
    unknown: '未知错误',
    noWorkspace: '请先打开一个项目文件夹',
    fileNotFound: '文件不存在',
    permissionDenied: '权限不足',
  },
  
  ai: {
    systemPrompt: '你是一个专业的编程助手，擅长代码分析、问题解答和技术指导。请使用中文回复用户的问题，保持专业、清晰、有帮助的态度。',
    codeAssistantPrompt: '你是一个代码专家。请分析代码并提供专业的建议。使用中文回复。',
    diagramAssistantPrompt: '你是一个图表生成专家。请根据需求生成清晰、专业的图表代码。使用中文标签。',
    testAssistantPrompt: '你是一个测试专家。请生成全面、可靠的测试代码。使用中文注释。',
  },
};

/** 英文翻译 */
const EN_US: Translations = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    copy: 'Copy',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    retry: 'Retry',
    refresh: 'Refresh',
    search: 'Search',
    clear: 'Clear',
    reset: 'Reset',
  },
  
  chat: {
    newConversation: 'New Conversation',
    clearContext: 'Clear Context',
    compactContext: 'Compact Context',
    sendMessage: 'Send Message',
    stopGeneration: 'Stop Generation',
    regenerate: 'Regenerate',
    inputPlaceholder: 'Type a message... Press Enter to send, Shift+Enter for new line',
    thinking: 'Thinking...',
    generating: 'Generating...',
    completed: 'Completed',
    error: 'Error occurred',
    noApiKey: 'Please set up your API Key first',
    selectProvider: 'Select Provider',
    selectModel: 'Select Model',
    temperature: 'Temperature',
    maxTokens: 'Max Tokens',
  },
  
  task: {
    idle: 'Idle',
    running: 'Running',
    success: 'Success',
    failed: 'Failed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    
    generatingDiagram: 'Generating diagram...',
    diagramCompleted: 'Diagram generation completed',
    generatingTest: 'Generating test code...',
    testCompleted: 'Test generation completed',
    executingCommand: 'Executing command...',
    commandCompleted: 'Command execution completed',
    executingSkill: 'Executing skill...',
    skillCompleted: 'Skill execution completed',
    
    parallelTasksRunning: 'Running {count} tasks in parallel...',
    parallelTasksCompleted: 'Completed {completed}/{total} tasks',
    taskProgress: 'Task progress: {progress}%',
  },
  
  diagram: {
    title: 'Diagram',
    flowchart: 'Flowchart',
    sequence: 'Sequence Diagram',
    class: 'Class Diagram',
    state: 'State Diagram',
    er: 'ER Diagram',
    gantt: 'Gantt Chart',
    pie: 'Pie Chart',
    mindmap: 'Mind Map',
    architecture: 'Architecture Diagram',
    generate: 'Generate Diagram',
    export: 'Export Diagram',
    edit: 'Edit Diagram',
    preview: 'Preview',
    save: 'Save Diagram',
    history: 'History',
    invalidCode: 'Invalid diagram code',
  },
  
  test: {
    title: 'Test',
    generate: 'Generate Test',
    run: 'Run Test',
    save: 'Save Test',
    fix: 'Fix Test',
    refine: 'Refine Test',
    framework: 'Test Framework',
    coverage: 'Coverage',
    passed: 'Passed',
    failed: 'Failed',
    skipped: 'Skipped',
    history: 'Test History',
  },
  
  mcp: {
    title: 'MCP Server',
    serverManagement: 'Server Management',
    addServer: 'Add Server',
    removeServer: 'Remove Server',
    connectServer: 'Connect Server',
    disconnectServer: 'Disconnect',
    serverStatus: 'Server Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    error: 'Connection Error',
    tools: 'Available Tools',
    resources: 'Available Resources',
    prompts: 'Available Prompts',
    demoConfigs: 'Demo Configs',
    importConfig: 'Import Config',
    exportConfig: 'Export Config',
  },
  
  skill: {
    title: 'AI Skills',
    dependencyCheck: 'Dependency Security Check',
    testArchitect: 'Test Architect',
    codeReviewer: 'Code Reviewer',
    excelProcessor: 'Excel Processor',
    wordProcessor: 'Word Processor',
    pptProcessor: 'PPT Processor',
    toolMaker: 'Tool Maker',
    executing: 'Executing...',
    completed: 'Execution completed',
    failed: 'Execution failed',
  },
  
  errors: {
    networkError: 'Network connection error, please check your network',
    apiKeyMissing: 'API Key not set, please configure in settings',
    apiKeyInvalid: 'Invalid API Key, please check configuration',
    modelNotFound: 'Model not found or unavailable',
    rateLimited: 'Rate limited, please try again later',
    serverError: 'Server error, please try again later',
    timeout: 'Request timeout, please retry',
    unknown: 'Unknown error',
    noWorkspace: 'Please open a project folder first',
    fileNotFound: 'File not found',
    permissionDenied: 'Permission denied',
  },
  
  ai: {
    systemPrompt: 'You are a professional programming assistant skilled in code analysis, problem solving, and technical guidance. Please respond in English and maintain a professional, clear, and helpful attitude.',
    codeAssistantPrompt: 'You are a code expert. Please analyze the code and provide professional advice. Respond in English.',
    diagramAssistantPrompt: 'You are a diagram generation expert. Please generate clear and professional diagram code based on requirements. Use English labels.',
    testAssistantPrompt: 'You are a testing expert. Please generate comprehensive and reliable test code. Use English comments.',
  },
};

/** 所有翻译 */
const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  'zh-CN': ZH_CN,
  'en-US': EN_US,
};

/**
 * 国际化管理器
 */
export class I18nManager {
  private static instance: I18nManager | null = null;
  private currentLanguage: SupportedLanguage = 'zh-CN';
  private context: vscode.ExtensionContext | null = null;

  private constructor() {}

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * 初始化
   */
  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
    
    // 从配置读取语言设置
    const config = vscode.workspace.getConfiguration('aiAssistant');
    const savedLanguage = config.get<SupportedLanguage>('language');
    
    if (savedLanguage && TRANSLATIONS[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    } else {
      // 根据 VS Code 语言自动检测
      const vscodeLanguage = vscode.env.language;
      if (vscodeLanguage.startsWith('zh')) {
        this.currentLanguage = 'zh-CN';
      } else {
        this.currentLanguage = 'en-US';
      }
    }
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 获取语言信息
   */
  getLanguageInfo(): LanguageInfo {
    return SUPPORTED_LANGUAGES.find(l => l.code === this.currentLanguage)!;
  }

  /**
   * 设置语言
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (!TRANSLATIONS[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    this.currentLanguage = language;
    
    // 保存到配置
    const config = vscode.workspace.getConfiguration('aiAssistant');
    await config.update('language', language, vscode.ConfigurationTarget.Global);
  }

  /**
   * 获取翻译文本
   */
  t<K extends keyof Translations>(
    category: K,
    key: keyof Translations[K]
  ): string {
    const translations = TRANSLATIONS[this.currentLanguage];
    const categoryTranslations = translations[category] as Record<string, string>;
    return categoryTranslations[key as string] || `[${String(category)}.${String(key)}]`;
  }

  /**
   * 获取带参数的翻译文本
   */
  tf<K extends keyof Translations>(
    category: K,
    key: keyof Translations[K],
    params: Record<string, string | number>
  ): string {
    let text = this.t(category, key);
    
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, String(value));
    }
    
    return text;
  }

  /**
   * 获取 AI 系统提示
   */
  getAISystemPrompt(type: 'general' | 'code' | 'diagram' | 'test' = 'general'): string {
    const translations = TRANSLATIONS[this.currentLanguage];
    
    switch (type) {
      case 'code':
        return translations.ai.codeAssistantPrompt;
      case 'diagram':
        return translations.ai.diagramAssistantPrompt;
      case 'test':
        return translations.ai.testAssistantPrompt;
      default:
        return translations.ai.systemPrompt;
    }
  }

  /**
   * 获取 AI 回复语言提示后缀
   */
  getAILanguageSuffix(): string {
    return this.getLanguageInfo().aiPromptSuffix;
  }

  /**
   * 获取完整的 AI 系统提示（包含语言指示）
   */
  getFullAIPrompt(type: 'general' | 'code' | 'diagram' | 'test' = 'general'): string {
    return `${this.getAISystemPrompt(type)}\n\n${this.getAILanguageSuffix()}`;
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * 检查是否为中文
   */
  isChinese(): boolean {
    return this.currentLanguage === 'zh-CN';
  }

  /**
   * 检查是否为英文
   */
  isEnglish(): boolean {
    return this.currentLanguage === 'en-US';
  }
}

// 导出便捷函数
export const i18n = I18nManager.getInstance();

export function t<K extends keyof Translations>(
  category: K,
  key: keyof Translations[K]
): string {
  return i18n.t(category, key);
}

export function tf<K extends keyof Translations>(
  category: K,
  key: keyof Translations[K],
  params: Record<string, string | number>
): string {
  return i18n.tf(category, key, params);
}
