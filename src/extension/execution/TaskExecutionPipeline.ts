/**
 * 任务执行管道
 * 
 * 提供清晰的任务执行流程可视化，解决以下问题：
 * 1. MCP/Skill执行步骤不清晰
 * 2. 用户不知道当前在做什么
 * 3. 任务状态不明确
 * 4. 任务中断处理
 */

import * as vscode from 'vscode';

// ============================================
// 类型定义
// ============================================

/**
 * 任务来源类型
 */
export type TaskSource = 'mcp' | 'skill' | 'agent' | 'user' | 'system';

/**
 * 执行步骤状态
 */
export type StepStatus = 
  | 'pending'     // 等待执行
  | 'running'     // 正在执行
  | 'success'     // 执行成功
  | 'failed'      // 执行失败
  | 'skipped'     // 已跳过
  | 'cancelled';  // 已取消

/**
 * 执行步骤
 */
export interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  progress?: number;       // 0-100
  startTime?: number;
  endTime?: number;
  duration?: number;
  error?: string;
  output?: any;
  metadata?: Record<string, any>;
}

/**
 * 任务执行计划
 */
export interface ExecutionPlan {
  id: string;
  name: string;
  description: string;
  source: TaskSource;
  steps: ExecutionStep[];
  createdAt: number;
  estimatedDuration?: number;
}

/**
 * 任务执行状态
 */
export interface TaskExecution {
  id: string;
  plan: ExecutionPlan;
  status: 'planning' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  startTime: number;
  endTime?: number;
  error?: string;
  canResume: boolean;
  checkpoint?: ExecutionCheckpoint;
}

/**
 * 执行检查点（用于任务恢复）
 */
export interface ExecutionCheckpoint {
  taskId: string;
  stepIndex: number;
  stepState: Record<string, any>;
  timestamp: number;
}

/**
 * 任务事件
 */
export interface TaskEvent {
  type: 'plan_created' | 'step_start' | 'step_progress' | 'step_complete' | 
        'step_failed' | 'task_complete' | 'task_failed' | 'task_cancelled' |
        'task_paused' | 'task_resumed';
  taskId: string;
  stepId?: string;
  data?: any;
  timestamp: number;
}

// ============================================
// 任务执行管道
// ============================================

export class TaskExecutionPipeline {
  private static instance: TaskExecutionPipeline | null = null;
  
  private executions: Map<string, TaskExecution> = new Map();
  private checkpoints: Map<string, ExecutionCheckpoint> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  
  // 事件发射器
  private _onTaskEvent = new vscode.EventEmitter<TaskEvent>();
  public readonly onTaskEvent = this._onTaskEvent.event;
  
  // UI更新回调
  private postMessage?: (message: any) => void;
  
  private constructor() {}
  
  static getInstance(): TaskExecutionPipeline {
    if (!TaskExecutionPipeline.instance) {
      TaskExecutionPipeline.instance = new TaskExecutionPipeline();
    }
    return TaskExecutionPipeline.instance;
  }
  
  /**
   * 设置消息发送回调（用于更新UI）
   */
  setPostMessage(fn: (message: any) => void): void {
    this.postMessage = fn;
  }
  
  // ============================================
  // 任务创建与规划
  // ============================================
  
  /**
   * 创建执行计划
   */
  createPlan(params: {
    name: string;
    description: string;
    source: TaskSource;
    steps: Array<{
      name: string;
      description: string;
      metadata?: Record<string, any>;
    }>;
    estimatedDuration?: number;
  }): ExecutionPlan {
    const planId = this.generateId();
    
    const plan: ExecutionPlan = {
      id: planId,
      name: params.name,
      description: params.description,
      source: params.source,
      steps: params.steps.map((step, index) => ({
        id: `${planId}_step_${index}`,
        name: step.name,
        description: step.description,
        status: 'pending',
        metadata: step.metadata,
      })),
      createdAt: Date.now(),
      estimatedDuration: params.estimatedDuration,
    };
    
    // 通知UI
    this.notifyUI({
      type: 'executionPlanCreated',
      plan,
    });
    
    this.emitEvent({
      type: 'plan_created',
      taskId: planId,
      data: plan,
      timestamp: Date.now(),
    });
    
    return plan;
  }
  
  /**
   * 开始执行任务
   */
  async startExecution(plan: ExecutionPlan): Promise<TaskExecution> {
    const taskId = plan.id;
    
    // 创建中断控制器
    const abortController = new AbortController();
    this.abortControllers.set(taskId, abortController);
    
    // 创建执行状态
    const execution: TaskExecution = {
      id: taskId,
      plan,
      status: 'running',
      currentStepIndex: 0,
      startTime: Date.now(),
      canResume: true,
    };
    
    this.executions.set(taskId, execution);
    
    // 通知UI任务开始
    this.notifyUI({
      type: 'executionStarted',
      execution: this.getExecutionSummary(execution),
    });
    
    return execution;
  }
  
  // ============================================
  // 步骤执行
  // ============================================
  
  /**
   * 执行单个步骤
   */
  async executeStep(
    taskId: string,
    stepIndex: number,
    executor: (signal: AbortSignal) => Promise<any>
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    const execution = this.executions.get(taskId);
    if (!execution) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    const step = execution.plan.steps[stepIndex];
    if (!step) {
      throw new Error(`Step not found: ${stepIndex}`);
    }
    
    const abortController = this.abortControllers.get(taskId);
    if (!abortController) {
      throw new Error(`No abort controller for task: ${taskId}`);
    }
    
    // 更新步骤状态为运行中
    step.status = 'running';
    step.startTime = Date.now();
    execution.currentStepIndex = stepIndex;
    
    // 通知UI步骤开始
    this.notifyUI({
      type: 'stepStarted',
      taskId,
      step: this.getStepSummary(step, stepIndex, execution.plan.steps.length),
    });
    
    this.emitEvent({
      type: 'step_start',
      taskId,
      stepId: step.id,
      timestamp: Date.now(),
    });
    
    try {
      // 检查是否已取消
      if (abortController.signal.aborted) {
        throw new Error('Task was cancelled');
      }
      
      // 执行步骤
      const output = await executor(abortController.signal);
      
      // 更新步骤状态为成功
      step.status = 'success';
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime!;
      step.output = output;
      
      // 创建检查点
      this.createCheckpoint(taskId, stepIndex, output);
      
      // 通知UI步骤完成
      this.notifyUI({
        type: 'stepCompleted',
        taskId,
        step: this.getStepSummary(step, stepIndex, execution.plan.steps.length),
      });
      
      this.emitEvent({
        type: 'step_complete',
        taskId,
        stepId: step.id,
        data: output,
        timestamp: Date.now(),
      });
      
      return { success: true, output };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 更新步骤状态为失败
      step.status = 'failed';
      step.endTime = Date.now();
      step.duration = step.endTime - step.startTime!;
      step.error = errorMessage;
      
      // 通知UI步骤失败
      this.notifyUI({
        type: 'stepFailed',
        taskId,
        step: this.getStepSummary(step, stepIndex, execution.plan.steps.length),
        error: errorMessage,
      });
      
      this.emitEvent({
        type: 'step_failed',
        taskId,
        stepId: step.id,
        data: { error: errorMessage },
        timestamp: Date.now(),
      });
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * 更新步骤进度
   */
  updateStepProgress(taskId: string, stepIndex: number, progress: number, message?: string): void {
    const execution = this.executions.get(taskId);
    if (!execution) return;
    
    const step = execution.plan.steps[stepIndex];
    if (!step) return;
    
    step.progress = Math.min(100, Math.max(0, progress));
    
    // 通知UI进度更新
    this.notifyUI({
      type: 'stepProgress',
      taskId,
      stepIndex,
      progress: step.progress,
      message,
    });
    
    this.emitEvent({
      type: 'step_progress',
      taskId,
      stepId: step.id,
      data: { progress: step.progress, message },
      timestamp: Date.now(),
    });
  }
  
  // ============================================
  // 任务控制
  // ============================================
  
  /**
   * 取消任务
   */
  cancelTask(taskId: string, reason?: string): boolean {
    const execution = this.executions.get(taskId);
    if (!execution) return false;
    
    const abortController = this.abortControllers.get(taskId);
    if (abortController) {
      abortController.abort();
    }
    
    // 更新任务状态
    execution.status = 'cancelled';
    execution.endTime = Date.now();
    execution.error = reason || 'Task cancelled by user';
    
    // 标记当前步骤为取消
    const currentStep = execution.plan.steps[execution.currentStepIndex];
    if (currentStep && currentStep.status === 'running') {
      currentStep.status = 'cancelled';
      currentStep.endTime = Date.now();
    }
    
    // 标记后续步骤为跳过
    for (let i = execution.currentStepIndex + 1; i < execution.plan.steps.length; i++) {
      execution.plan.steps[i].status = 'skipped';
    }
    
    // 通知UI
    this.notifyUI({
      type: 'executionCancelled',
      taskId,
      reason: execution.error,
    });
    
    this.emitEvent({
      type: 'task_cancelled',
      taskId,
      data: { reason: execution.error },
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    const execution = this.executions.get(taskId);
    if (!execution || execution.status !== 'running') return false;
    
    execution.status = 'paused';
    
    // 创建检查点
    this.createCheckpoint(taskId, execution.currentStepIndex, {});
    
    // 通知UI
    this.notifyUI({
      type: 'executionPaused',
      taskId,
      checkpoint: this.checkpoints.get(taskId),
    });
    
    this.emitEvent({
      type: 'task_paused',
      taskId,
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<boolean> {
    const execution = this.executions.get(taskId);
    const checkpoint = this.checkpoints.get(taskId);
    
    if (!execution || !checkpoint || execution.status !== 'paused') {
      return false;
    }
    
    // 恢复任务状态
    execution.status = 'running';
    execution.currentStepIndex = checkpoint.stepIndex;
    
    // 创建新的中断控制器
    const newAbortController = new AbortController();
    this.abortControllers.set(taskId, newAbortController);
    
    // 通知UI
    this.notifyUI({
      type: 'executionResumed',
      taskId,
      fromStep: checkpoint.stepIndex,
    });
    
    this.emitEvent({
      type: 'task_resumed',
      taskId,
      data: { fromStep: checkpoint.stepIndex },
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * 完成任务
   */
  completeTask(taskId: string, result?: any): void {
    const execution = this.executions.get(taskId);
    if (!execution) return;
    
    execution.status = 'completed';
    execution.endTime = Date.now();
    
    // 计算统计信息
    const stats = this.calculateTaskStats(execution);
    
    // 通知UI
    this.notifyUI({
      type: 'executionCompleted',
      taskId,
      result,
      stats,
    });
    
    this.emitEvent({
      type: 'task_complete',
      taskId,
      data: { result, stats },
      timestamp: Date.now(),
    });
    
    // 清理
    this.abortControllers.delete(taskId);
  }
  
  /**
   * 标记任务失败
   */
  failTask(taskId: string, error: string): void {
    const execution = this.executions.get(taskId);
    if (!execution) return;
    
    execution.status = 'failed';
    execution.endTime = Date.now();
    execution.error = error;
    
    // 通知UI
    this.notifyUI({
      type: 'executionFailed',
      taskId,
      error,
    });
    
    this.emitEvent({
      type: 'task_failed',
      taskId,
      data: { error },
      timestamp: Date.now(),
    });
    
    // 清理
    this.abortControllers.delete(taskId);
  }
  
  // ============================================
  // 查询方法
  // ============================================
  
  /**
   * 获取任务执行状态
   */
  getExecution(taskId: string): TaskExecution | undefined {
    return this.executions.get(taskId);
  }
  
  /**
   * 获取所有活动任务
   */
  getActiveTasks(): TaskExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.status === 'running' || e.status === 'paused');
  }
  
  /**
   * 获取任务执行摘要
   */
  getExecutionSummary(execution: TaskExecution): {
    id: string;
    name: string;
    source: TaskSource;
    status: string;
    progress: number;
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    elapsedTime: number;
    estimatedRemaining?: number;
  } {
    const completedSteps = execution.plan.steps.filter(s => s.status === 'success').length;
    const progress = Math.round((completedSteps / execution.plan.steps.length) * 100);
    const currentStep = execution.plan.steps[execution.currentStepIndex];
    const elapsedTime = Date.now() - execution.startTime;
    
    // 估算剩余时间
    let estimatedRemaining: number | undefined;
    if (completedSteps > 0 && execution.status === 'running') {
      const avgStepTime = elapsedTime / completedSteps;
      const remainingSteps = execution.plan.steps.length - completedSteps;
      estimatedRemaining = avgStepTime * remainingSteps;
    }
    
    return {
      id: execution.id,
      name: execution.plan.name,
      source: execution.plan.source,
      status: execution.status,
      progress,
      currentStep: currentStep?.name || '',
      totalSteps: execution.plan.steps.length,
      completedSteps,
      elapsedTime,
      estimatedRemaining,
    };
  }
  
  /**
   * 获取步骤摘要
   */
  private getStepSummary(step: ExecutionStep, index: number, total: number): {
    id: string;
    name: string;
    description: string;
    status: StepStatus;
    progress?: number;
    duration?: number;
    index: number;
    total: number;
    error?: string;
  } {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      status: step.status,
      progress: step.progress,
      duration: step.duration,
      index,
      total,
      error: step.error,
    };
  }
  
  // ============================================
  // 检查点管理
  // ============================================
  
  /**
   * 创建检查点
   */
  private createCheckpoint(taskId: string, stepIndex: number, state: Record<string, any>): void {
    const checkpoint: ExecutionCheckpoint = {
      taskId,
      stepIndex,
      stepState: state,
      timestamp: Date.now(),
    };
    
    this.checkpoints.set(taskId, checkpoint);
    
    const execution = this.executions.get(taskId);
    if (execution) {
      execution.checkpoint = checkpoint;
    }
  }
  
  /**
   * 获取检查点
   */
  getCheckpoint(taskId: string): ExecutionCheckpoint | undefined {
    return this.checkpoints.get(taskId);
  }
  
  // ============================================
  // 辅助方法
  // ============================================
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 计算任务统计
   */
  private calculateTaskStats(execution: TaskExecution): {
    totalDuration: number;
    avgStepDuration: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
  } {
    const steps = execution.plan.steps;
    const totalDuration = (execution.endTime || Date.now()) - execution.startTime;
    
    const successCount = steps.filter(s => s.status === 'success').length;
    const failedCount = steps.filter(s => s.status === 'failed').length;
    const skippedCount = steps.filter(s => s.status === 'skipped').length;
    
    const completedSteps = steps.filter(s => s.duration !== undefined);
    const avgStepDuration = completedSteps.length > 0
      ? completedSteps.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSteps.length
      : 0;
    
    return {
      totalDuration,
      avgStepDuration,
      successCount,
      failedCount,
      skippedCount,
    };
  }
  
  /**
   * 通知UI更新
   */
  private notifyUI(message: any): void {
    if (this.postMessage) {
      this.postMessage(message);
    }
  }
  
  /**
   * 发射事件
   */
  private emitEvent(event: TaskEvent): void {
    this._onTaskEvent.fire(event);
  }
  
  /**
   * 清理已完成的任务
   */
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.executions.forEach((execution, taskId) => {
      if (execution.endTime && (now - execution.endTime) > maxAge) {
        toDelete.push(taskId);
      }
    });
    
    toDelete.forEach(taskId => {
      this.executions.delete(taskId);
      this.checkpoints.delete(taskId);
      this.abortControllers.delete(taskId);
    });
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建MCP任务执行计划
 */
export function createMCPExecutionPlan(
  toolName: string,
  toolDescription: string,
  params: Record<string, any>
): ExecutionPlan {
  const pipeline = TaskExecutionPipeline.getInstance();
  
  return pipeline.createPlan({
    name: `MCP: ${toolName}`,
    description: toolDescription,
    source: 'mcp',
    steps: [
      {
        name: '参数验证',
        description: '验证工具调用参数',
        metadata: { params },
      },
      {
        name: '权限检查',
        description: '检查执行权限',
      },
      {
        name: '执行工具',
        description: `执行 ${toolName}`,
        metadata: { toolName },
      },
      {
        name: '处理结果',
        description: '处理并格式化执行结果',
      },
    ],
  });
}

/**
 * 创建Skill任务执行计划
 */
export function createSkillExecutionPlan(
  skillName: string,
  skillDescription: string,
  phases: string[]
): ExecutionPlan {
  const pipeline = TaskExecutionPipeline.getInstance();
  
  const steps = [
    {
      name: '初始化',
      description: `初始化 ${skillName} 技能`,
    },
    ...phases.map(phase => ({
      name: phase,
      description: `执行阶段: ${phase}`,
    })),
    {
      name: '完成',
      description: '整理执行结果',
    },
  ];
  
  return pipeline.createPlan({
    name: `Skill: ${skillName}`,
    description: skillDescription,
    source: 'skill',
    steps,
  });
}

/**
 * 创建Agent任务执行计划
 */
export function createAgentExecutionPlan(
  taskDescription: string,
  subTasks: Array<{ name: string; description: string }>
): ExecutionPlan {
  const pipeline = TaskExecutionPipeline.getInstance();
  
  const steps = [
    {
      name: '分析任务',
      description: '分析用户意图和任务需求',
    },
    {
      name: '规划步骤',
      description: '制定执行计划',
    },
    ...subTasks.map(task => ({
      name: task.name,
      description: task.description,
    })),
    {
      name: '总结',
      description: '汇总执行结果',
    },
  ];
  
  return pipeline.createPlan({
    name: 'Agent任务',
    description: taskDescription,
    source: 'agent',
    steps,
  });
}
