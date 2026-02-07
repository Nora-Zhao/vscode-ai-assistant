/**
 * 任务执行可视化面板
 * 
 * 清晰展示MCP/Skill任务的执行过程和状态
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================
// 类型定义
// ============================================

interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
  progress?: number;
  duration?: number;
  error?: string;
}

interface ExecutionPlan {
  id: string;
  name: string;
  source: 'mcp' | 'skill' | 'agent' | 'user' | 'system';
  steps: ExecutionStep[];
}

interface TaskExecution {
  id: string;
  plan: ExecutionPlan;
  status: 'planning' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  progress: number;
  elapsedTime: number;
  estimatedRemaining?: number;
}

interface TaskExecutionViewProps {
  execution?: TaskExecution;
  onCancel?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

// ============================================
// 状态图标组件
// ============================================

const StatusIcon: React.FC<{ status: ExecutionStep['status'] }> = ({ status }) => {
  const icons: Record<ExecutionStep['status'], React.ReactNode> = {
    pending: (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
    ),
    running: (
      <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    skipped: (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
    cancelled: (
      <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  };
  
  return <span className="flex-shrink-0">{icons[status]}</span>;
};

// ============================================
// 来源标签组件
// ============================================

const SourceBadge: React.FC<{ source: ExecutionPlan['source'] }> = ({ source }) => {
  const styles: Record<ExecutionPlan['source'], string> = {
    mcp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    skill: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    agent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    system: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  
  const labels: Record<ExecutionPlan['source'], string> = {
    mcp: 'MCP工具',
    skill: 'Skill技能',
    agent: 'Agent任务',
    user: '用户请求',
    system: '系统任务',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[source]}`}>
      {labels[source]}
    </span>
  );
};

// ============================================
// 进度条组件
// ============================================

const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 ${className}`}>
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

// ============================================
// 时间格式化
// ============================================

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
};

// ============================================
// 步骤详情组件
// ============================================

const StepDetail: React.FC<{ step: ExecutionStep; index: number; isActive: boolean }> = ({
  step,
  index,
  isActive,
}) => {
  return (
    <div
      className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
        isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      {/* 步骤编号和状态 */}
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            step.status === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : step.status === 'running'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : step.status === 'failed'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {index + 1}
        </div>
        {/* 连接线 */}
        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1" />
      </div>
      
      {/* 步骤内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <StatusIcon status={step.status} />
          <span className="font-medium text-sm truncate">{step.name}</span>
          {step.duration && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDuration(step.duration)}
            </span>
          )}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {step.description}
        </p>
        
        {/* 进度条（运行中的步骤） */}
        {step.status === 'running' && step.progress !== undefined && (
          <div className="mt-2">
            <ProgressBar progress={step.progress} />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {step.progress}%
            </span>
          </div>
        )}
        
        {/* 错误信息 */}
        {step.error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-1.5 rounded">
            {step.error}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// 主组件
// ============================================

export const TaskExecutionView: React.FC<TaskExecutionViewProps> = ({
  execution,
  onCancel,
  onPause,
  onResume,
  minimized = false,
  onToggleMinimize,
}) => {
  const [showDetails, setShowDetails] = useState(!minimized);
  
  // 没有执行任务时不显示
  if (!execution) {
    return null;
  }
  
  const { plan, status, currentStepIndex, progress, elapsedTime, estimatedRemaining } = execution;
  
  // 计算完成和失败的步骤数
  const completedSteps = plan.steps.filter(s => s.status === 'success').length;
  const failedSteps = plan.steps.filter(s => s.status === 'failed').length;
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* 头部 */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 cursor-pointer"
        onClick={() => {
          setShowDetails(!showDetails);
          onToggleMinimize?.();
        }}
      >
        <div className="flex items-center gap-3">
          {/* 状态指示器 */}
          <div className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-blue-500 animate-pulse' :
            isPaused ? 'bg-yellow-500' :
            isCompleted ? 'bg-green-500' :
            isFailed ? 'bg-red-500' :
            'bg-gray-400'
          }`} />
          
          {/* 任务名称和来源 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{plan.name}</span>
              <SourceBadge source={plan.source} />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {completedSteps}/{plan.steps.length} 步骤完成
              {elapsedTime > 0 && ` • 已用时 ${formatDuration(elapsedTime)}`}
              {estimatedRemaining && isRunning && ` • 预计剩余 ${formatDuration(estimatedRemaining)}`}
            </div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          {/* 进度 */}
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {progress}%
          </span>
          
          {/* 暂停/继续按钮 */}
          {isRunning && onPause && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPause(execution.id);
              }}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="暂停"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6" />
              </svg>
            </button>
          )}
          
          {isPaused && onResume && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResume(execution.id);
              }}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="继续"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            </button>
          )}
          
          {/* 取消按钮 */}
          {(isRunning || isPaused) && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(execution.id);
              }}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              title="取消"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* 展开/收起按钮 */}
          <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 总体进度条 */}
      <ProgressBar progress={progress} />
      
      {/* 步骤详情 */}
      {showDetails && (
        <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
          {plan.steps.map((step, index) => (
            <StepDetail
              key={step.id}
              step={step}
              index={index}
              isActive={index === currentStepIndex && isRunning}
            />
          ))}
        </div>
      )}
      
      {/* 完成/失败状态 */}
      {(isCompleted || isFailed || isCancelled) && (
        <div className={`p-3 text-sm ${
          isCompleted ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
          isFailed ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
          'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
        }`}>
          {isCompleted && `✓ 任务完成，共 ${completedSteps} 个步骤`}
          {isFailed && `✗ 任务失败，${failedSteps} 个步骤出错`}
          {isCancelled && '⚠ 任务已取消'}
        </div>
      )}
    </div>
  );
};

// ============================================
// 多任务面板
// ============================================

interface MultiTaskPanelProps {
  executions: TaskExecution[];
  onCancel?: (taskId: string) => void;
  onPause?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
}

export const MultiTaskPanel: React.FC<MultiTaskPanelProps> = ({
  executions,
  onCancel,
  onPause,
  onResume,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const toggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);
  
  if (executions.length === 0) {
    return null;
  }
  
  const activeExecutions = executions.filter(e => e.status === 'running' || e.status === 'paused');
  const completedExecutions = executions.filter(e => e.status !== 'running' && e.status !== 'paused');
  
  return (
    <div className="space-y-2">
      {/* 活动任务 */}
      {activeExecutions.map(execution => (
        <TaskExecutionView
          key={execution.id}
          execution={execution}
          onCancel={onCancel}
          onPause={onPause}
          onResume={onResume}
          minimized={!expandedTasks.has(execution.id)}
          onToggleMinimize={() => toggleExpand(execution.id)}
        />
      ))}
      
      {/* 已完成任务（折叠显示） */}
      {completedExecutions.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {completedExecutions.length} 个已完成任务
          </summary>
          <div className="mt-2 space-y-2">
            {completedExecutions.map(execution => (
              <TaskExecutionView
                key={execution.id}
                execution={execution}
                minimized={true}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default TaskExecutionView;
