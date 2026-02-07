import React, { useEffect, useRef } from 'react';

export type TaskType = 'chat' | 'diagram' | 'test' | 'command' | 'skill' | 'mcp';
export type TaskStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export interface TaskLogEntry {
  id: string;
  type: TaskType;
  status: TaskStatus;
  message: string;
  timestamp: number;
  progress?: number; // 0-100 进度百分比
  subTasks?: { name: string; completed: boolean; success?: boolean }[]; // 子任务列表
}

interface TaskLogPanelProps {
  logs: TaskLogEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  onClear: () => void;
}

const taskIcons: Record<TaskType, string> = {
  chat: '💬',
  diagram: '📊',
  test: '🧪',
  command: '⚡',
  skill: '🤖',
  mcp: '🔧',
};

const taskNames: Record<TaskType, string> = {
  chat: '对话',
  diagram: '图表生成',
  test: '测试生成',
  command: '命令执行',
  skill: '技能执行',
  mcp: 'MCP工具',
};

const statusText: Record<TaskStatus, string> = {
  idle: '等待中',
  running: '执行中',
  success: '已完成',
  error: '失败',
  cancelled: '已取消',
};

const statusIcons: Record<TaskStatus, string> = {
  idle: '⚪',
  running: '🔄',
  success: '✅',
  error: '❌',
  cancelled: '⚪',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

// 格式化任务消息：任务名_状态
function formatTaskMessage(type: TaskType, status: TaskStatus, customName?: string): string {
  const name = customName || taskNames[type];
  return `${name}_${statusText[status]}`;
}

export default function TaskLogPanel({ logs, isExpanded, onToggle, onClear }: TaskLogPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  // 获取运行中的任务数量
  const runningCount = logs.filter(l => l.status === 'running').length;
  
  // 获取最近的日志（用于显示在收起状态）
  const recentLogs = logs.slice(-5);

  return (
    <div className={`task-log-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 标题栏 - 始终显示 */}
      <div className="task-log-header" onClick={onToggle}>
        <div className="task-log-title">
          <span className="task-log-icon">📋</span>
          <span>任务状态</span>
          {runningCount > 0 && (
            <span className="running-badge">{runningCount} 执行中</span>
          )}
        </div>
        <div className="task-log-actions">
          {logs.length > 0 && (
            <button 
              className="clear-btn" 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              title="清空"
            >
              ×
            </button>
          )}
          <span className="toggle-icon">{isExpanded ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* 收起状态下显示最近日志预览 */}
      {!isExpanded && recentLogs.length > 0 && (
        <div className="task-log-preview">
          {recentLogs.map((log) => (
            <div key={log.id} className={`preview-item ${log.status}`}>
              <span className="preview-time">{formatTime(log.timestamp)}</span>
              <span className="preview-icon">{statusIcons[log.status]}</span>
              <span className="preview-type">{taskIcons[log.type]}</span>
              <span className="preview-text">{log.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 展开状态下显示完整日志 */}
      {isExpanded && (
        <div className="task-log-content">
          {logs.length === 0 ? (
            <div className="empty-logs">
              <span>暂无任务记录</span>
            </div>
          ) : (
            <div className="log-list">
              {logs.map((log) => (
                <div key={log.id} className={`log-entry ${log.status}`}>
                  <span className="log-time">{formatTime(log.timestamp)}</span>
                  <span className="log-icon">{statusIcons[log.status]}</span>
                  <span className="log-type">{taskIcons[log.type]}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 用于生成日志条目的辅助函数
export function createLogEntry(
  type: TaskType, 
  status: TaskStatus, 
  message: string
): TaskLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    status,
    message,
    timestamp: Date.now(),
  };
}

// 根据任务类型和状态生成默认消息（格式：任务名_状态）
export function getDefaultMessage(type: TaskType, status: TaskStatus, detail?: string): string {
  if (detail) {
    // 如果有自定义详情，使用：详情_状态
    return `${detail}_${statusText[status]}`;
  }
  // 默认格式：任务名_状态
  return formatTaskMessage(type, status);
}
