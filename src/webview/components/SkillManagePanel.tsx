import React, { useState, useEffect, useCallback } from 'react';
import { vscode } from '../vscodeApi';

interface SkillInfo {
  id: string;
  name: string;
  desc: string;
  type: 'builtin' | 'installed';
  version?: string;
  status?: string;
}

interface SkillManagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill?: (skillId: string) => void;
}

export default function SkillManagePanel({ isOpen, onClose, onSelectSkill }: SkillManagePanelProps) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [installing, setInstalling] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'builtin' | 'installed'>('all');

  // 请求技能列表
  const refreshSkills = useCallback(() => {
    setLoading(true);
    vscode.postMessage({ type: 'getAvailableSkills' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshSkills();
    }
  }, [isOpen, refreshSkills]);

  // 监听后端消息
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      
      if (data.type === 'skill:availableSkills') {
        setSkills(data.skills || []);
        setLoading(false);
      }
      
      if (data.type === 'skill:operationResult') {
        setInstalling(false);
        if (data.success) {
          const msgs: Record<string, string> = {
            enable: `已启用 ${data.skillId || data.skill?.name || ''}`,
            disable: `已禁用 ${data.skillId || ''}`,
            uninstall: `已卸载 ${data.skillId || ''}`,
            install: `已安装 ${data.skill?.name || ''}`,
          };
          setNotification({ type: 'success', message: msgs[data.operation] || '操作成功' });
        } else {
          setNotification({ type: 'error', message: `操作失败: ${data.error}` });
        }
        setTimeout(() => setNotification(null), 3000);
      }

      if (data.type === 'skill:installProgress') {
        setInstalling(true);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!isOpen) return null;

  const filteredSkills = skills.filter(s => {
    if (filter === 'builtin') return s.type === 'builtin';
    if (filter === 'installed') return s.type === 'installed';
    return true;
  });

  const handleEnable = (skillId: string) => {
    vscode.postMessage({ type: 'skill:enable', skillId });
  };

  const handleDisable = (skillId: string) => {
    vscode.postMessage({ type: 'skill:disable', skillId });
  };

  const handleUninstall = (skillId: string) => {
    if (confirm(`确定要卸载技能 "${skillId}"?`)) {
      vscode.postMessage({ type: 'skill:uninstall', skillId });
    }
  };

  const handleInstallFromUrl = () => {
    if (!installUrl.trim()) return;
    vscode.postMessage({ type: 'skill:installFromUrl', url: installUrl.trim() });
    setInstalling(true);
    setInstallUrl('');
  };

  const handleOpenInstallDialog = () => {
    vscode.postMessage({ type: 'skill:openInstallDialog' });
  };

  const handleOpenCreateDialog = () => {
    vscode.postMessage({ type: 'skill:openCreateDialog' });
  };

  const handleUseSkill = (skillId: string) => {
    if (onSelectSkill) {
      onSelectSkill(skillId);
    } else {
      onClose();
    }
  };

  return (
    <div className="skill-manage-panel">
      {/* Header */}
      <div className="skill-panel-header">
        <h3>📦 Skill 技能管理</h3>
        <button className="skill-panel-close" onClick={onClose} title="关闭">×</button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`skill-notification ${notification.type}`}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      {/* Actions bar */}
      <div className="skill-actions-bar">
        <button className="skill-action-btn" onClick={handleOpenInstallDialog} title="安装技能包">
          📥 安装
        </button>
        <button className="skill-action-btn" onClick={handleOpenCreateDialog} title="创建新技能">
          ✨ 创建
        </button>
        <button className="skill-action-btn" onClick={refreshSkills} title="刷新列表">
          🔄 刷新
        </button>
      </div>

      {/* Install from URL */}
      <div className="skill-install-url">
        <input
          type="text"
          className="skill-url-input"
          placeholder="输入skill包URL安装 (zip/git)"
          value={installUrl}
          onChange={e => setInstallUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInstallFromUrl()}
          disabled={installing}
        />
        <button 
          className="skill-url-btn" 
          onClick={handleInstallFromUrl}
          disabled={installing || !installUrl.trim()}
        >
          {installing ? '⏳' : '📦'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="skill-filter-tabs">
        {(['all', 'builtin', 'installed'] as const).map(f => (
          <button
            key={f}
            className={`skill-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'builtin' ? '内置' : '已安装'}
            <span className="skill-count">
              {f === 'all' ? skills.length : skills.filter(s => s.type === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Skill list */}
      <div className="skill-list">
        {loading ? (
          <div className="skill-loading">加载中...</div>
        ) : filteredSkills.length === 0 ? (
          <div className="skill-empty">
            {filter === 'installed' ? '没有已安装的自定义技能' : '没有可用技能'}
          </div>
        ) : (
          filteredSkills.map(skill => (
            <div key={skill.id} className={`skill-card ${skill.status === 'disabled' ? 'disabled' : ''}`}>
              <div className="skill-card-header">
                <div className="skill-card-title">
                  <span className="skill-type-badge">
                    {skill.type === 'builtin' ? '📦' : '📥'}
                  </span>
                  <span className="skill-name">{skill.name}</span>
                  {skill.version && <span className="skill-version">v{skill.version}</span>}
                </div>
                <span className={`skill-status ${skill.status || 'active'}`}>
                  {skill.status === 'active' ? '✅' : skill.status === 'disabled' ? '⏸️' : '❌'}
                </span>
              </div>
              <div className="skill-card-desc">{skill.desc}</div>
              <div className="skill-card-id">
                <code>@skill:{skill.id}</code>
              </div>
              <div className="skill-card-actions">
                <button className="skill-use-btn" onClick={() => handleUseSkill(skill.id)} title="使用">
                  ▶️ 使用
                </button>
                {skill.status === 'active' ? (
                  <button className="skill-toggle-btn" onClick={() => handleDisable(skill.id)} title="禁用">
                    ⏸️ 禁用
                  </button>
                ) : (
                  <button className="skill-toggle-btn" onClick={() => handleEnable(skill.id)} title="启用">
                    ▶️ 启用
                  </button>
                )}
                {skill.type !== 'builtin' && (
                  <button className="skill-uninstall-btn" onClick={() => handleUninstall(skill.id)} title="卸载">
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
