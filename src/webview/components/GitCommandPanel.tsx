import React, { useState, useCallback } from 'react';
import { vscode } from '../vscodeApi';

interface GitCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
}

// Git命令分类
interface GitCommandCategory {
  name: string;
  icon: string;
  commands: GitCommand[];
}

interface GitCommand {
  label: string;
  command: string;
  description: string;
  needsInput?: boolean;
  inputPlaceholder?: string;
  inputType?: 'text' | 'branch' | 'remote' | 'file';
  dangerous?: boolean; // 危险操作提示
}

// 预定义的Git命令
const GIT_COMMAND_CATEGORIES: GitCommandCategory[] = [
  {
    name: '基础操作',
    icon: '📋',
    commands: [
      { label: 'status', command: 'git status', description: '查看工作区状态' },
      { label: 'log', command: 'git log --oneline -10', description: '查看最近10条提交' },
      { label: 'diff', command: 'git diff', description: '查看未暂存的修改' },
      { label: 'diff staged', command: 'git diff --staged', description: '查看已暂存的修改' },
      { label: 'branch', command: 'git branch -a', description: '查看所有分支' },
      { label: 'remote', command: 'git remote -v', description: '查看远程仓库' },
    ]
  },
  {
    name: '提交流程',
    icon: '📦',
    commands: [
      { label: 'add all', command: 'git add .', description: '暂存所有修改' },
      { label: 'add file', command: 'git add', description: '暂存指定文件', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file' },
      { label: 'commit', command: 'git commit -m', description: '提交（需输入信息）', needsInput: true, inputPlaceholder: '提交信息' },
      { label: 'commit amend', command: 'git commit --amend', description: '修改最后一次提交' },
      { label: 'stash', command: 'git stash', description: '暂存当前修改' },
      { label: 'stash pop', command: 'git stash pop', description: '恢复暂存的修改' },
    ]
  },
  {
    name: '分支操作',
    icon: '🌿',
    commands: [
      { label: 'checkout', command: 'git checkout', description: '切换分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch' },
      { label: 'new branch', command: 'git checkout -b', description: '创建并切换到新分支', needsInput: true, inputPlaceholder: '新分支名' },
      { label: 'merge', command: 'git merge', description: '合并分支', needsInput: true, inputPlaceholder: '要合并的分支', inputType: 'branch' },
      { label: 'rebase', command: 'git rebase', description: '变基操作', needsInput: true, inputPlaceholder: '目标分支', inputType: 'branch' },
      { label: 'delete branch', command: 'git branch -d', description: '删除本地分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch', dangerous: true },
    ]
  },
  {
    name: '远程同步',
    icon: '🔄',
    commands: [
      { label: 'fetch', command: 'git fetch', description: '获取远程更新' },
      { label: 'pull', command: 'git pull', description: '拉取并合并' },
      { label: 'pull rebase', command: 'git pull --rebase', description: '拉取并变基' },
      { label: 'push', command: 'git push', description: '推送到远程' },
      { label: 'push force', command: 'git push --force-with-lease', description: '强制推送（安全）', dangerous: true },
      { label: 'push origin', command: 'git push -u origin', description: '推送并设置上游分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch' },
    ]
  },
  {
    name: '撤销操作',
    icon: '↩️',
    commands: [
      { label: 'reset soft', command: 'git reset --soft HEAD~1', description: '撤销最后一次提交（保留修改）' },
      { label: 'reset hard', command: 'git reset --hard HEAD~1', description: '撤销最后一次提交（丢弃修改）', dangerous: true },
      { label: 'checkout file', command: 'git checkout --', description: '丢弃文件的修改', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file', dangerous: true },
      { label: 'revert', command: 'git revert', description: '创建一个撤销提交', needsInput: true, inputPlaceholder: 'commit hash' },
      { label: 'clean', command: 'git clean -fd', description: '删除未跟踪的文件', dangerous: true },
    ]
  },
  {
    name: '高级操作',
    icon: '⚙️',
    commands: [
      { label: 'cherry-pick', command: 'git cherry-pick', description: '挑选提交', needsInput: true, inputPlaceholder: 'commit hash' },
      { label: 'reflog', command: 'git reflog -10', description: '查看操作历史' },
      { label: 'blame', command: 'git blame', description: '查看文件每行的修改者', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file' },
      { label: 'tag', command: 'git tag', description: '创建标签', needsInput: true, inputPlaceholder: '标签名' },
      { label: 'show', command: 'git show', description: '显示提交详情', needsInput: true, inputPlaceholder: 'commit hash' },
    ]
  }
];

export default function GitCommandPanel({ isOpen, onClose, onExecuteCommand }: GitCommandPanelProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<GitCommand | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCommandClick = useCallback((cmd: GitCommand) => {
    if (cmd.needsInput) {
      setSelectedCommand(cmd);
      setInputValue('');
    } else if (cmd.dangerous) {
      setSelectedCommand(cmd);
      setShowConfirm(true);
    } else {
      onExecuteCommand(cmd.command);
    }
  }, [onExecuteCommand]);

  const handleExecuteWithInput = useCallback(() => {
    if (selectedCommand && inputValue.trim()) {
      const fullCommand = `${selectedCommand.command} "${inputValue.trim()}"`;
      
      if (selectedCommand.dangerous) {
        setShowConfirm(true);
        return;
      }
      
      onExecuteCommand(fullCommand);
      setSelectedCommand(null);
      setInputValue('');
    }
  }, [selectedCommand, inputValue, onExecuteCommand]);

  const handleConfirmDangerous = useCallback(() => {
    if (selectedCommand) {
      const fullCommand = selectedCommand.needsInput && inputValue.trim()
        ? `${selectedCommand.command} "${inputValue.trim()}"`
        : selectedCommand.command;
      onExecuteCommand(fullCommand);
    }
    setShowConfirm(false);
    setSelectedCommand(null);
    setInputValue('');
  }, [selectedCommand, inputValue, onExecuteCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleExecuteWithInput();
    } else if (e.key === 'Escape') {
      setSelectedCommand(null);
      setInputValue('');
    }
  }, [handleExecuteWithInput, inputValue]);

  const handleAskAI = useCallback((cmd: GitCommand) => {
    const question = `请解释 Git 命令 "${cmd.command}" 的作用和使用场景，以及可能的注意事项。`;
    vscode.postMessage({ type: 'sendMessage', message: question });
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="git-panel-overlay" onClick={onClose}>
      <div className="git-panel" onClick={e => e.stopPropagation()}>
        <div className="git-panel-header">
          <h3>🔧 Git 命令助手</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="git-panel-content">
          {/* 分类标签 */}
          <div className="git-categories">
            {GIT_COMMAND_CATEGORIES.map((cat, index) => (
              <button
                key={cat.name}
                className={`category-tab ${activeCategory === index ? 'active' : ''}`}
                onClick={() => setActiveCategory(index)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* 命令列表 */}
          <div className="git-commands">
            {GIT_COMMAND_CATEGORIES[activeCategory].commands.map((cmd) => (
              <div key={cmd.label} className={`git-command-item ${cmd.dangerous ? 'dangerous' : ''}`}>
                <div className="command-main" onClick={() => handleCommandClick(cmd)}>
                  <span className="command-label">{cmd.label}</span>
                  <code className="command-code">{cmd.command}</code>
                  {cmd.dangerous && <span className="danger-badge">⚠️</span>}
                </div>
                <div className="command-actions">
                  <span className="command-desc">{cmd.description}</span>
                  <button 
                    className="ask-ai-btn" 
                    onClick={(e) => { e.stopPropagation(); handleAskAI(cmd); }}
                    title="询问 AI"
                  >
                    🤖
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 输入框（当命令需要参数时显示） */}
          {selectedCommand && selectedCommand.needsInput && !showConfirm && (
            <div className="git-input-section">
              <div className="input-header">
                <span>📝 {selectedCommand.label}</span>
                <code>{selectedCommand.command}</code>
              </div>
              <div className="input-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedCommand.inputPlaceholder}
                  autoFocus
                />
                <button 
                  className="execute-btn"
                  onClick={handleExecuteWithInput}
                  disabled={!inputValue.trim()}
                >
                  执行
                </button>
                <button className="cancel-btn" onClick={() => setSelectedCommand(null)}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 危险操作确认 */}
          {showConfirm && selectedCommand && (
            <div className="git-confirm-section">
              <div className="confirm-header">
                <span className="warning-icon">⚠️</span>
                <span>确认执行危险操作？</span>
              </div>
              <div className="confirm-content">
                <p>此操作可能会导致数据丢失，请确认：</p>
                <code>
                  {selectedCommand.needsInput && inputValue.trim()
                    ? `${selectedCommand.command} "${inputValue.trim()}"`
                    : selectedCommand.command}
                </code>
              </div>
              <div className="confirm-actions">
                <button className="confirm-btn danger" onClick={handleConfirmDangerous}>
                  确认执行
                </button>
                <button className="confirm-btn cancel" onClick={() => { setShowConfirm(false); setSelectedCommand(null); }}>
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="git-panel-footer">
          <span className="tip">💡 点击命令直接执行，点击 🤖 可询问 AI 详细解释</span>
        </div>
      </div>
    </div>
  );
}
