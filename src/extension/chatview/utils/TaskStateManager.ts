import { TaskType, TaskStatus, TaskState, ChatViewContext } from '../types';

/**
 * 任务状态管理器
 * 处理任务状态的更新、检查和取消
 */
export class TaskStateManager {
  private taskStates: Record<TaskType, TaskState>;
  private postMessage: (message: any) => void;

  constructor(postMessage: (message: any) => void) {
    this.postMessage = postMessage;
    this.taskStates = {
      chat: { status: 'idle', timestamp: 0 },
      diagram: { status: 'idle', timestamp: 0 },
      test: { status: 'idle', timestamp: 0 },
      command: { status: 'idle', timestamp: 0 },
      skill: { status: 'idle', timestamp: 0 },
      mcp: { status: 'idle', timestamp: 0 },
    };
  }

  /**
   * 获取所有任务状态
   */
  getTaskStates(): Record<TaskType, TaskState> {
    return this.taskStates;
  }

  /**
   * 获取特定任务的状态
   */
  getTaskState(taskType: TaskType): TaskState {
    return this.taskStates[taskType];
  }

  /**
   * 检查特定任务是否正在运行
   */
  isRunning(taskType: TaskType): boolean {
    return this.taskStates[taskType].status === 'running';
  }

  /**
   * 检查chat任务是否正在处理（向后兼容）
   */
  get isProcessing(): boolean {
    return this.taskStates.chat.status === 'running';
  }

  /**
   * 更新任务状态
   */
  updateStatus(taskType: TaskType, status: TaskStatus, message?: string): void {
    const now = Date.now();
    this.taskStates[taskType] = {
      ...this.taskStates[taskType],
      status,
      message,
      timestamp: now,
    };
    
    // 只有非chat类型的任务才发送到任务状态栏
    // chat类型的任务状态在chatbox中显示
    if (taskType !== 'chat') {
      this.postMessage({
        type: 'taskStatus',
        taskType,
        status,
        message,
        timestamp: now,
      });
    }
    
    // 如果成功，3秒后自动恢复为idle
    if (status === 'success') {
      setTimeout(() => {
        if (this.taskStates[taskType].status === 'success' && 
            this.taskStates[taskType].timestamp === now) {
          this.updateStatus(taskType, 'idle');
        }
      }, 3000);
    }
    
    // 如果错误，5秒后自动恢复为idle
    if (status === 'error') {
      setTimeout(() => {
        if (this.taskStates[taskType].status === 'error' && 
            this.taskStates[taskType].timestamp === now) {
          this.updateStatus(taskType, 'idle');
        }
      }, 5000);
    }
  }

  /**
   * 取消特定任务
   */
  cancelTask(taskType: TaskType): void {
    const taskState = this.taskStates[taskType];
    if (taskState.abortController) {
      taskState.abortController.abort();
    }
    this.updateStatus(taskType, 'idle', '已取消');
  }

  /**
   * 设置任务的AbortController
   */
  setAbortController(taskType: TaskType, controller: AbortController): void {
    this.taskStates[taskType].abortController = controller;
  }

  /**
   * 重置所有任务状态
   */
  resetAll(): void {
    for (const taskType of Object.keys(this.taskStates) as TaskType[]) {
      this.taskStates[taskType] = { status: 'idle', timestamp: 0 };
    }
  }
}
