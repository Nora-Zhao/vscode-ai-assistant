/**
 * 并行任务面板组件
 * 显示批量任务执行进度
 */
import React, { useState, useEffect } from 'react';

interface ParallelTask {
  id: string;
  type: 'diagram' | 'test' | 'command';
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
}

interface BatchProgress {
  completed: number;
  total: number;
  running: number;
}

interface ParallelTaskPanelProps {
  tasks: ParallelTask[];
  batchProgress?: BatchProgress;
  onCancel: () => void;
  onClose: () => void;
}

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  running: '🔄',
  success: '✅',
  failed: '❌',
  cancelled: '⚪',
};

const TYPE_ICONS: Record<string, string> = {
  diagram: '📊',
  test: '🧪',
  command: '💻',
};

export const ParallelTaskPanel: React.FC<ParallelTaskPanelProps> = ({
  tasks,
  batchProgress,
  onCancel,
  onClose,
}) => {
  const [expanded, setExpanded] = useState(true);

  const isRunning = tasks.some(t => t.status === 'running' || t.status === 'pending');
  const successCount = tasks.filter(t => t.status === 'success').length;
  const failedCount = tasks.filter(t => t.status === 'failed').length;
  
  const overallProgress = batchProgress 
    ? Math.round((batchProgress.completed / batchProgress.total) * 100)
    : 0;

  return (
    <div className="parallel-task-panel">
      <div className="panel-header" onClick={() => setExpanded(!expanded)}>
        <div className="header-left">
          <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
          <span className="title">
            {isRunning ? '⚡ 并行任务执行中' : '📋 任务执行结果'}
          </span>
        </div>
        <div className="header-right">
          {batchProgress && (
            <span className="progress-summary">
              {batchProgress.completed}/{batchProgress.total}
              {batchProgress.running > 0 && ` (${batchProgress.running} 运行中)`}
            </span>
          )}
          {isRunning ? (
            <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
              取消全部
            </button>
          ) : (
            <button className="close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              关闭
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* 整体进度条 */}
          <div className="overall-progress">
            <div className="progress-bar">
              <div 
                className={`progress-fill ${isRunning ? 'running' : ''}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="progress-stats">
              <span className="stat success">✅ {successCount}</span>
              <span className="stat failed">❌ {failedCount}</span>
              <span className="stat total">共 {tasks.length} 个任务</span>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-item ${task.status}`}>
                <div className="task-icon">
                  {TYPE_ICONS[task.type]}
                </div>
                <div className="task-info">
                  <div className="task-name">{task.name}</div>
                  {task.status === 'running' && (
                    <div className="task-progress">
                      <div className="mini-progress-bar">
                        <div 
                          className="mini-progress-fill"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{task.progress}%</span>
                    </div>
                  )}
                  {task.error && (
                    <div className="task-error">{task.error}</div>
                  )}
                </div>
                <div className="task-status">
                  {STATUS_ICONS[task.status]}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 语言切换器组件
 */
interface LanguageSwitcherProps {
  currentLanguage: 'zh-CN' | 'en-US';
  onLanguageChange: (language: 'zh-CN' | 'en-US') => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'zh-CN' as const, name: '简体中文', flag: '🇨🇳' },
    { code: 'en-US' as const, name: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <div className="language-switcher">
      <button 
        className="language-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="切换语言 / Switch Language"
      >
        <span className="flag">{currentLang.flag}</span>
        <span className="lang-name">{currentLang.name}</span>
        <span className="dropdown-icon">▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === currentLanguage ? 'active' : ''}`}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
              {lang.code === currentLanguage && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 批量操作工具栏
 */
interface BatchToolbarProps {
  onBatchDiagrams: () => void;
  onBatchTests: () => void;
  onBatchCommands: () => void;
  disabled?: boolean;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  onBatchDiagrams,
  onBatchTests,
  onBatchCommands,
  disabled = false,
}) => {
  return (
    <div className="batch-toolbar">
      <span className="toolbar-label">批量操作:</span>
      <button 
        className="batch-btn"
        onClick={onBatchDiagrams}
        disabled={disabled}
        title="批量生成多个图表"
      >
        📊 图表
      </button>
      <button 
        className="batch-btn"
        onClick={onBatchTests}
        disabled={disabled}
        title="批量生成测试文件"
      >
        🧪 测试
      </button>
      <button 
        className="batch-btn"
        onClick={onBatchCommands}
        disabled={disabled}
        title="批量执行命令"
      >
        💻 命令
      </button>
    </div>
  );
};

export default ParallelTaskPanel;
