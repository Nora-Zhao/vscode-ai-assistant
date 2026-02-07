import React, { useState, useEffect } from 'react';

export type TaskType = 'chat' | 'diagram' | 'test' | 'command';
export type TaskStatus = 'idle' | 'running' | 'success' | 'error';

export interface TaskState {
  type: TaskType;
  status: TaskStatus;
  label: string;
  icon: string;
  message?: string;
  timestamp?: number;
}

interface TaskStatusIndicatorProps {
  tasks: TaskState[];
  onTaskClick?: (taskType: TaskType) => void;
  compact?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  idle: 'var(--vscode-descriptionForeground)',
  running: 'var(--vscode-progressBar-background)',
  success: 'var(--vscode-terminal-ansiGreen)',
  error: 'var(--vscode-errorForeground)',
};

const statusIcons: Record<TaskStatus, string> = {
  idle: '○',
  running: '◐',
  success: '✓',
  error: '✗',
};

const statusLabels: Record<TaskStatus, string> = {
  idle: '空闲',
  running: '运行中',
  success: '完成',
  error: '失败',
};

export default function TaskStatusIndicator({ tasks, onTaskClick, compact = false }: TaskStatusIndicatorProps) {
  const [expandedTask, setExpandedTask] = useState<TaskType | null>(null);
  
  // 获取活跃的任务（非idle状态）
  const activeTasks = tasks.filter(t => t.status !== 'idle');
  const latestActiveTask = activeTasks.length > 0 
    ? activeTasks.reduce((latest, task) => 
        (task.timestamp || 0) > (latest.timestamp || 0) ? task : latest
      )
    : null;

  // 自动展开最新的活跃任务
  useEffect(() => {
    if (latestActiveTask && latestActiveTask.status === 'running') {
      setExpandedTask(latestActiveTask.type);
    }
  }, [latestActiveTask?.type, latestActiveTask?.status]);

  // 紧凑模式（窄屏幕）
  if (compact) {
    return (
      <div className="task-status-compact">
        {activeTasks.length > 0 ? (
          <div 
            className={`task-compact-item ${latestActiveTask?.status}`}
            onClick={() => latestActiveTask && onTaskClick?.(latestActiveTask.type)}
            title={latestActiveTask?.message || `${latestActiveTask?.label}: ${statusLabels[latestActiveTask?.status || 'idle']}`}
          >
            <span className={`task-status-icon ${latestActiveTask?.status === 'running' ? 'spin' : ''}`}>
              {latestActiveTask?.icon}
            </span>
            {activeTasks.length > 1 && (
              <span className="task-count">+{activeTasks.length - 1}</span>
            )}
          </div>
        ) : (
          <div className="task-compact-idle" title="所有任务空闲">
            <span className="task-status-icon">○</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="task-status-indicator">
      {tasks.map((task) => {
        const isExpanded = expandedTask === task.type;
        const isActive = task.status !== 'idle';
        
        return (
          <div
            key={task.type}
            className={`task-status-item ${task.status} ${isExpanded ? 'expanded' : ''}`}
            onClick={() => {
              if (isActive) {
                setExpandedTask(isExpanded ? null : task.type);
              }
              onTaskClick?.(task.type);
            }}
            title={task.message || `${task.label}: ${statusLabels[task.status]}`}
          >
            {/* 状态指示器 */}
            <span 
              className={`task-indicator ${task.status === 'running' ? 'pulse' : ''}`}
              style={{ 
                backgroundColor: statusColors[task.status],
                boxShadow: task.status === 'running' ? `0 0 8px ${statusColors[task.status]}` : 'none'
              }}
            />
            
            {/* 图标 */}
            <span className={`task-icon ${task.status === 'running' ? 'spin' : ''}`}>
              {task.icon}
            </span>
            
            {/* 展开状态显示消息 */}
            {isExpanded && task.message && (
              <span className="task-message">{task.message}</span>
            )}
            
            {/* 状态标签（成功或错误时显示） */}
            {!isExpanded && (task.status === 'success' || task.status === 'error') && (
              <span 
                className="task-status-badge"
                style={{ color: statusColors[task.status] }}
              >
                {statusIcons[task.status]}
              </span>
            )}
          </div>
        );
      })}
      
      {/* 活跃任务摘要提示 */}
      {activeTasks.length > 0 && (
        <div className="task-summary">
          {activeTasks.filter(t => t.status === 'running').length > 0 && (
            <span className="running-count">
              {activeTasks.filter(t => t.status === 'running').length} 运行中
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// 默认任务状态
export const defaultTasks: TaskState[] = [
  { type: 'chat', status: 'idle', label: 'AI对话', icon: '💬', timestamp: 0 },
  { type: 'diagram', status: 'idle', label: '图表', icon: '📊', timestamp: 0 },
  { type: 'test', status: 'idle', label: '测试', icon: '🧪', timestamp: 0 },
  { type: 'command', status: 'idle', label: '命令', icon: '⚡', timestamp: 0 },
];
