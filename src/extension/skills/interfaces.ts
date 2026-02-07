/**
 * Polyglot Code Agent - Core Interfaces
 * 采用策略模式，Agent 的"大脑"（思考逻辑）不变，但"双手"（工具和上下文）根据语言自动切换。
 */

export type SupportedLanguage = 
  | 'typescript' | 'javascript' | 'python' | 'java' | 'go' 
  | 'rust' | 'csharp' | 'ruby' | 'php' | 'kotlin' | 'swift' | 'unknown';

export type ProjectType = 
  | 'node' | 'python' | 'java-maven' | 'java-gradle' | 'go' 
  | 'rust' | 'dotnet' | 'ruby' | 'php' | 'unknown';

export interface ProjectContext {
  root: string;
  type: ProjectType;
  language: SupportedLanguage;
  framework?: string;
  dependencyFile?: string;
  testFramework?: string;
  packageManager?: string;
  buildTool?: string;
}

/** 语言适配器接口 - 策略模式的核心 */
export interface ILanguageAdapter {
  readonly language: SupportedLanguage;
  detect(workspaceRoot: string): Promise<boolean>;
  getDependencyFile(workspaceRoot: string): string | undefined;
  getAuditCommand(): string;
  getTestCommand(testFile?: string): string;
  getBuildCommand(): string;
  getFormatCommand(): string;
  getLintCommand(): string;
  getTestFilePattern(sourceFile: string): string;
  getTestTemplate(className?: string): string;
  getCodeReviewFocus(): string[];
  parseDependencies(content: string): string[];
}

/** 技能接口 - Agent 的能力单元 */
export interface ISkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'automator' | 'builder' | 'explainer';
  canExecute(context: ProjectContext): boolean;
  execute(context: ProjectContext, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult>;
}

export interface SkillParams {
  userInput?: string;
  targetFile?: string;
  selectedCode?: string;
  options?: Record<string, unknown>;
}

export interface SkillResult {
  success: boolean;
  message: string;
  generatedFiles?: string[];
  modifiedFiles?: string[];
  commandOutput?: string;
  data?: Record<string, unknown>;
}

export interface SkillProgressReporter {
  report(message: string, progress?: number): void;
  startSubTask(name: string): void;
  completeSubTask(name: string, success: boolean): void;
}

export interface AgentTask {
  id: string;
  type: 'chat' | 'skill' | 'command' | 'multi-step';
  skillId?: string;
  params: SkillParams;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: SkillResult;
}

export interface AgentPlan {
  id: string;
  userInput: string;
  description: string;
  tasks: AgentTask[];
  currentIndex: number;
}

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: 'automator' | 'builder' | 'explainer';
  icon: string;
  supportedLanguages: SupportedLanguage[];
}

export const SKILL_METADATA: SkillMetadata[] = [
  { id: 'dependency-guardian', name: '依赖安全卫士', description: '检查项目依赖中的安全漏洞', category: 'automator', icon: '🛡️', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'] },
  { id: 'test-architect', name: '测试架构师', description: '为源代码智能生成单元测试', category: 'builder', icon: '🧪', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'] },
  { id: 'code-reviewer', name: '代码审查员', description: '对代码进行智能审查，指出潜在问题', category: 'explainer', icon: '🔍', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'] },
  { id: 'git-scribe', name: 'Git 书记员', description: '自动生成 Commit Message 和 PR 描述', category: 'automator', icon: '📝', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift'] },
  { id: 'scaffolder', name: '脚手架生成器', description: '快速生成项目结构和样板代码', category: 'builder', icon: '🏗️', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'] },
  { id: 'live-docs', name: '文档生成器', description: '自动生成代码文档和 API 说明', category: 'explainer', icon: '📚', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'] },
  // 文档处理技能
  { id: 'excel-processor', name: 'Excel处理器', description: '清洗表格数据、合并多表、做统计分析，输出Excel文件', category: 'automator', icon: '📊', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
  { id: 'word-processor', name: 'Word文档处理器', description: '生成规范Word文档，支持需求文档、会议纪要、说明书等', category: 'builder', icon: '📄', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
  { id: 'ppt-processor', name: 'PPT演示文稿生成器', description: '根据主题自动生成大纲与逐页要点演示文稿', category: 'builder', icon: '📽️', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
  { id: 'tool-maker', name: '小工具制作器', description: '制作本地CLI脚本如批量重命名、日志分析、图片压缩等', category: 'builder', icon: '🔧', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
  // MCP 工具技能
  { id: 'mcp-tools', name: 'MCP 工具调用', description: '通过 MCP 协议调用外部工具（文件系统、浏览器、数据库等）', category: 'automator', icon: '🔌', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
  { id: 'mcp-config', name: 'MCP 配置管理', description: '配置和管理 MCP 服务器连接', category: 'automator', icon: '⚙️', supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'csharp', 'ruby', 'php', 'kotlin', 'swift', 'unknown'] },
];
