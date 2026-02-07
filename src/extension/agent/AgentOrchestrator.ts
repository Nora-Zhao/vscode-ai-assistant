import * as vscode from 'vscode';
import {
  ISkill,
  ProjectContext,
  SkillParams,
  SkillResult,
  SkillProgressReporter,
  AgentPlan,
  AgentTask,
  SKILL_METADATA,
} from '../skills/interfaces';
import { languageDetector } from '../skills/adapters';
import { 
  DependencyGuardianSkill, 
  TestArchitectSkill, 
  CodeReviewerSkill,
  ToolMakerSkill,
} from '../skills/implementations';

/**
 * 技能注册表
 * 管理所有可用的技能
 */
class SkillRegistry {
  private skills: Map<string, ISkill> = new Map();

  register(skill: ISkill): void {
    this.skills.set(skill.id, skill);
  }

  get(id: string): ISkill | undefined {
    return this.skills.get(id);
  }

  getAll(): ISkill[] {
    return Array.from(this.skills.values());
  }

  getByCategory(category: 'automator' | 'builder' | 'explainer'): ISkill[] {
    return this.getAll().filter(s => s.category === category);
  }
}

/**
 * Agent 编排器
 * 负责任务规划、技能调度和执行管理
 */
export class AgentOrchestrator {
  private skillRegistry: SkillRegistry;
  private projectContext: ProjectContext | null = null;
  private currentPlan: AgentPlan | null = null;

  constructor() {
    this.skillRegistry = new SkillRegistry();
    this.registerBuiltinSkills();
  }

  /**
   * 注册内置技能
   */
  private registerBuiltinSkills(): void {
    // 代码相关技能
    this.skillRegistry.register(new DependencyGuardianSkill());
    this.skillRegistry.register(new TestArchitectSkill());
    this.skillRegistry.register(new CodeReviewerSkill());
    
    // 工具制作技能
    this.skillRegistry.register(new ToolMakerSkill());
  }

  /**
   * 初始化项目上下文
   */
  async initialize(): Promise<ProjectContext | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    this.projectContext = await languageDetector.detectProject(workspaceFolder.uri.fsPath);
    return this.projectContext;
  }

  /**
   * 获取当前项目上下文
   */
  getProjectContext(): ProjectContext | null {
    return this.projectContext;
  }

  /**
   * 获取可用的技能列表
   */
  getAvailableSkills(): ISkill[] {
    if (!this.projectContext) return [];
    return this.skillRegistry.getAll().filter(s => s.canExecute(this.projectContext!));
  }

  /**
   * 获取技能元数据（用于 UI 展示）
   */
  getSkillMetadata(): typeof SKILL_METADATA {
    return SKILL_METADATA;
  }

  /**
   * 解析用户意图并创建执行计划
   * 
   * 设计原则：
   * - 代码解释/修复/优化/注释/审查 = 普通 Chat（AI 本身就能做）
   * - 只有需要"外部能力"的操作才触发技能
   *   - 依赖安全检查（需要运行 npm audit 等命令）
   *   - 生成文档文件（需要创建 docx/xlsx/pptx）
   *   - MCP 工具调用（需要外部工具能力）
   */
  async createPlan(userInput: string, params?: SkillParams): Promise<AgentPlan> {
    const planId = this.generateId();
    const tasks: AgentTask[] = [];
    const lowerInput = userInput.toLowerCase();

    // ========== 需要外部能力的技能 ==========
    
    // 依赖安全检查（需要运行命令）
    if (this.matchIntent(lowerInput, ['安全', '漏洞', 'audit', 'security', '依赖检查', 'vulnerability', 'npm audit', '安全审计'])) {
      tasks.push(this.createTask('dependency-guardian', params));
    }

    // 小工具制作技能意图识别
    if (this.matchIntent(lowerInput, [
      '工具', '脚本', '小工具', 'cli', '命令行', '批量重命名', '重命名',
      '日志分析', '图片压缩', '文件整理', '数据转换', '备份', '端口扫描',
      '系统监控', 'api测试', '文本处理'
    ])) {
      tasks.push(this.createTask('tool-maker', { ...params, userInput }));
    }

    // 如果没有匹配到特定意图，返回聊天任务
    if (tasks.length === 0) {
      tasks.push({
        id: this.generateId(),
        type: 'chat',
        params: { userInput, ...params },
        status: 'pending',
      });
    }

    const plan: AgentPlan = {
      id: planId,
      userInput,
      description: this.generatePlanDescription(tasks),
      tasks,
      currentIndex: 0,
    };

    this.currentPlan = plan;
    return plan;
  }

  /**
   * 执行计划
   */
  async executePlan(plan: AgentPlan, reporter: SkillProgressReporter): Promise<SkillResult[]> {
    if (!this.projectContext) {
      await this.initialize();
    }

    const results: SkillResult[] = [];

    for (let i = 0; i < plan.tasks.length; i++) {
      const task = plan.tasks[i];
      plan.currentIndex = i;
      task.status = 'running';

      reporter.report(`执行任务 ${i + 1}/${plan.tasks.length}: ${this.getTaskDescription(task)}`, (i / plan.tasks.length) * 100);

      try {
        if (task.type === 'skill' && task.skillId) {
          const result = await this.executeSkill(task.skillId, task.params, reporter);
          task.result = result;
          task.status = result.success ? 'completed' : 'failed';
          results.push(result);
        } else if (task.type === 'chat') {
          // 聊天任务交给外部处理
          task.status = 'completed';
          results.push({
            success: true,
            message: '需要 AI 对话处理',
            data: { type: 'chat', input: task.params.userInput },
          });
        }
      } catch (error) {
        task.status = 'failed';
        task.result = {
          success: false,
          message: `任务执行失败: ${error instanceof Error ? error.message : String(error)}`,
        };
        results.push(task.result);
      }
    }

    reporter.report('计划执行完成', 100);
    return results;
  }

  /**
   * 直接执行单个技能
   */
  async executeSkill(skillId: string, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult> {
    if (!this.projectContext) {
      await this.initialize();
    }

    if (!this.projectContext) {
      return { success: false, message: '无法获取项目上下文，请打开一个项目文件夹' };
    }

    const skill = this.skillRegistry.get(skillId);
    if (!skill) {
      return { success: false, message: `未知的技能: ${skillId}` };
    }

    if (!skill.canExecute(this.projectContext)) {
      return { success: false, message: `技能 "${skill.name}" 不支持当前项目类型` };
    }

    return skill.execute(this.projectContext, params, reporter);
  }

  /**
   * 注册自定义技能
   */
  registerSkill(skill: ISkill): void {
    this.skillRegistry.register(skill);
  }

  // ===================== 辅助方法 =====================

  private matchIntent(input: string, keywords: string[]): boolean {
    return keywords.some(kw => input.includes(kw));
  }

  private createTask(skillId: string, params?: SkillParams): AgentTask {
    return {
      id: this.generateId(),
      type: 'skill',
      skillId,
      params: params || {},
      status: 'pending',
    };
  }

  private generatePlanDescription(tasks: AgentTask[]): string {
    if (tasks.length === 0) return '无任务';
    if (tasks.length === 1) {
      return this.getTaskDescription(tasks[0]);
    }
    return `执行 ${tasks.length} 个任务`;
  }

  private getTaskDescription(task: AgentTask): string {
    if (task.type === 'chat') return '与 AI 对话';
    if (task.skillId) {
      const skill = this.skillRegistry.get(task.skillId);
      return skill?.name || task.skillId;
    }
    return '未知任务';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

/** 单例导出 */
export const agentOrchestrator = new AgentOrchestrator();
