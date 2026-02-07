import React, { useState, useEffect, useCallback } from 'react';
import { vscode } from '../vscodeApi';

interface SessionSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

interface SessionHistoryPanelProps {
  onClose: () => void;
  onSelect: (sessionId: string) => void;
}

export default function SessionHistoryPanel({ onClose, onSelect }: SessionHistoryPanelProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === 'sessionList') {
        setSessions(data.sessions || []);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'getSessionList' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSelect = useCallback((sessionId: string) => {
    onSelect(sessionId);
    onClose();
  }, [onSelect, onClose]);

  const handleStartRename = useCallback((e: React.MouseEvent, session: SessionSummary) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  }, []);

  const handleSaveRename = useCallback((e: React.MouseEvent | React.KeyboardEvent, sessionId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      vscode.postMessage({ 
        type: 'renameSession', 
        sessionId, 
        newTitle: editTitle.trim() 
      });
      // 乐观更新
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: editTitle.trim() } : s
      ));
    }
    setEditingId(null);
    setEditTitle('');
  }, [editTitle]);

  const handleCancelRename = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(e, sessionId);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  }, [handleSaveRename, handleCancelRename]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(sessionId);
  }, []);

  const handleConfirmDelete = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'deleteSession', sessionId });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setConfirmDeleteId(null);
  }, []);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="history-panel-overlay" onClick={onClose}>
      <div className="history-panel session-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h3>💬 会话历史</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="history-search">
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="history-list">
          {loading ? (
            <div className="history-loading">
              <div className="loading-spinner"></div>
              <span>加载中...</span>
            </div>
          ) : filteredSessions.length > 0 ? (
            filteredSessions.map(session => (
              <div 
                key={session.id} 
                className={`history-item session-item ${confirmDeleteId === session.id ? 'confirm-delete' : ''}`}
                onClick={() => !editingId && !confirmDeleteId && handleSelect(session.id)}
              >
                <div className="history-item-icon">💬</div>
                <div className="history-item-content">
                  {editingId === session.id ? (
                    <div className="edit-title-container" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, session.id)}
                        autoFocus
                        className="edit-title-input"
                      />
                      <div className="edit-actions">
                        <button onClick={e => handleSaveRename(e, session.id)} title="保存">✓</button>
                        <button onClick={handleCancelRename} title="取消">×</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="history-item-title">{session.title}</div>
                      <div className="history-item-preview">{session.preview}</div>
                      <div className="history-item-meta">
                        <span className="message-count">{session.messageCount} 条消息</span>
                        <span className="time">{formatDate(session.updatedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                {!editingId && (
                  <div className="session-actions">
                    {confirmDeleteId === session.id ? (
                      <div className="confirm-delete-actions">
                        <span className="confirm-text">确定删除?</span>
                        <button 
                          className="confirm-btn danger"
                          onClick={e => handleConfirmDelete(e, session.id)}
                        >
                          删除
                        </button>
                        <button 
                          className="confirm-btn"
                          onClick={handleCancelDelete}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="session-action-btn"
                          onClick={e => handleStartRename(e, session)}
                          title="重命名"
                        >
                          ✏️
                        </button>
                        <button 
                          className="session-action-btn delete"
                          onClick={e => handleDeleteClick(e, session.id)}
                          title="删除"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="history-empty">
              <span className="empty-icon">💬</span>
              <p>暂无会话历史</p>
              <p className="empty-hint">开始新对话后会自动保存</p>
            </div>
          )}
        </div>

        <div className="session-panel-footer">
          <button 
            className="new-session-btn"
            onClick={() => {
              vscode.postMessage({ type: 'newChat' });
              onClose();
            }}
          >
            ➕ 新建会话
          </button>
        </div>
      </div>
    </div>
  );
}
