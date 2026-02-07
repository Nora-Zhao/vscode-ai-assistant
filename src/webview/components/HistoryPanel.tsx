import React, { useState, useEffect, useCallback } from 'react';
import { Diagram, TestHistoryItem } from '../../types/shared';
import { vscode } from '../vscodeApi';

// 扩展TestHistoryItem类型，添加可选的自定义名称
interface ExtendedTestHistoryItem extends TestHistoryItem {
  id?: string;
  customName?: string;
}

interface HistoryPanelProps {
  type: 'diagram' | 'test';
  onClose: () => void;
  onSelect: (item: any) => void;
}

export default function HistoryPanel({ type, onClose, onSelect }: HistoryPanelProps) {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [tests, setTests] = useState<ExtendedTestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // 删除确认状态
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === 'diagramHistory') {
        setDiagrams(data.diagrams || []);
        setLoading(false);
      } else if (data.type === 'testHistory') {
        // 为测试历史项添加ID（如果没有的话）
        const testsWithId = (data.tests || []).map((test: ExtendedTestHistoryItem, idx: number) => ({
          ...test,
          id: test.id || `test-${idx}-${test.timestamp}`,
        }));
        setTests(testsWithId);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 请求历史数据
    if (type === 'diagram') {
      vscode.postMessage({ type: 'getDiagramHistory' });
    } else {
      vscode.postMessage({ type: 'getTestHistory' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [type]);

  const handleSelectDiagram = useCallback((diagram: Diagram) => {
    if (editingId || confirmDeleteId) return;
    vscode.postMessage({ type: 'loadDiagram', diagramId: diagram.id });
    onSelect(diagram);
    onClose();
  }, [onSelect, onClose, editingId, confirmDeleteId]);

  const handleSelectTest = useCallback((test: ExtendedTestHistoryItem, index: number) => {
    if (editingId || confirmDeleteId) return;
    vscode.postMessage({ type: 'loadTest', testIndex: index });
    onSelect(test);
    onClose();
  }, [onSelect, onClose, editingId, confirmDeleteId]);

  // ========== 图表重命名 ==========
  const handleStartRenameDiagram = useCallback((e: React.MouseEvent, diagram: Diagram) => {
    e.stopPropagation();
    setEditingId(diagram.id);
    setEditTitle(diagram.title);
  }, []);

  const handleSaveRenameDiagram = useCallback((e: React.MouseEvent | React.KeyboardEvent, diagramId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      vscode.postMessage({ 
        type: 'renameDiagram', 
        diagramId, 
        newTitle: editTitle.trim() 
      });
      // 乐观更新
      setDiagrams(prev => prev.map(d => 
        d.id === diagramId ? { ...d, title: editTitle.trim() } : d
      ));
    }
    setEditingId(null);
    setEditTitle('');
  }, [editTitle]);

  // ========== 测试重命名 ==========
  const handleStartRenameTest = useCallback((e: React.MouseEvent, test: ExtendedTestHistoryItem, index: number) => {
    e.stopPropagation();
    setEditingId(test.id || `test-${index}`);
    setEditTitle(test.customName || getTestDisplayName(test));
  }, []);

  const handleSaveRenameTest = useCallback((e: React.MouseEvent | React.KeyboardEvent, testId: string, index: number) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      vscode.postMessage({ 
        type: 'renameTest', 
        testIndex: index,
        newName: editTitle.trim() 
      });
      // 乐观更新
      setTests(prev => prev.map((t, i) => 
        i === index ? { ...t, customName: editTitle.trim() } : t
      ));
    }
    setEditingId(null);
    setEditTitle('');
  }, [editTitle]);

  // ========== 取消编辑 ==========
  const handleCancelRename = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  }, []);

  // ========== 键盘事件处理 ==========
  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string, index?: number, isDiagram?: boolean) => {
    if (e.key === 'Enter') {
      if (isDiagram) {
        handleSaveRenameDiagram(e, id);
      } else if (index !== undefined) {
        handleSaveRenameTest(e, id, index);
      }
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  }, [handleSaveRenameDiagram, handleSaveRenameTest, handleCancelRename]);

  // ========== 图表删除 ==========
  const handleDeleteDiagramClick = useCallback((e: React.MouseEvent, diagramId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(diagramId);
  }, []);

  const handleConfirmDeleteDiagram = useCallback((e: React.MouseEvent, diagramId: string) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'deleteDiagram', diagramId });
    setDiagrams(prev => prev.filter(d => d.id !== diagramId));
    setConfirmDeleteId(null);
  }, []);

  // ========== 测试删除 ==========
  const handleDeleteTestClick = useCallback((e: React.MouseEvent, testId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(testId);
  }, []);

  const handleConfirmDeleteTest = useCallback((e: React.MouseEvent, testIndex: number) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'deleteTest', testIndex });
    setTests(prev => prev.filter((_, i) => i !== testIndex));
    setConfirmDeleteId(null);
  }, []);

  // ========== 取消删除 ==========
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

  const getTypeIcon = (diagramType: string) => {
    const icons: Record<string, string> = {
      flowchart: '📊',
      sequence: '🔄',
      class: '📦',
      state: '⚡',
      er: '🗄️',
      gantt: '📅',
      mindmap: '🧠',
      architecture: '🏗️',
    };
    return icons[diagramType] || '📊';
  };

  const getFrameworkIcon = (framework: string) => {
    const icons: Record<string, string> = {
      jest: '🃏',
      mocha: '☕',
      vitest: '⚡',
      pytest: '🐍',
      junit: '☕',
      go: '🔷',
    };
    return icons[framework?.toLowerCase()] || '🧪';
  };

  // 获取测试显示名称
  const getTestDisplayName = (test: ExtendedTestHistoryItem): string => {
    if (test.customName) return test.customName;
    // 优化默认名称：使用源文件名 + 框架
    const fileName = test.sourceFile ? test.sourceFile.split('/').pop()?.replace(/\.[^/.]+$/, '') : '未知文件';
    return `${fileName} 测试 (${test.framework})`;
  };

  // 过滤数据
  const filteredDiagrams = diagrams.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTests = tests.filter(t => {
    const displayName = getTestDisplayName(t).toLowerCase();
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) ||
      t.sourceFile?.toLowerCase().includes(query) ||
      t.framework?.toLowerCase().includes(query) ||
      t.path?.toLowerCase().includes(query);
  });

  return (
    <div className="history-panel-overlay" onClick={onClose}>
      <div className="history-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h3>{type === 'diagram' ? '📊 图表历史' : '🧪 测试历史'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="history-search">
          <input
            type="text"
            placeholder="搜索历史..."
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
          ) : type === 'diagram' ? (
            filteredDiagrams.length > 0 ? (
              filteredDiagrams.map(diagram => (
                <div 
                  key={diagram.id} 
                  className={`history-item ${confirmDeleteId === diagram.id ? 'confirm-delete' : ''}`}
                  onClick={() => handleSelectDiagram(diagram)}
                >
                  <div className="history-item-icon">
                    {getTypeIcon(diagram.type)}
                  </div>
                  <div className="history-item-content">
                    {editingId === diagram.id ? (
                      <div className="edit-title-container" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => handleKeyDown(e, diagram.id, undefined, true)}
                          autoFocus
                          className="edit-title-input"
                        />
                        <div className="edit-actions">
                          <button onClick={e => handleSaveRenameDiagram(e, diagram.id)} title="保存">✓</button>
                          <button onClick={handleCancelRename} title="取消">×</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="history-item-title">{diagram.title}</div>
                        <div className="history-item-meta">
                          <span className="type-badge">{diagram.type}</span>
                          <span className="time">{formatDate(diagram.updatedAt)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!editingId && (
                    <div className="history-item-actions">
                      {confirmDeleteId === diagram.id ? (
                        <div className="confirm-delete-actions">
                          <span className="confirm-text">确定删除?</span>
                          <button 
                            className="confirm-btn danger"
                            onClick={e => handleConfirmDeleteDiagram(e, diagram.id)}
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
                            className="history-action-btn"
                            onClick={e => handleStartRenameDiagram(e, diagram)}
                            title="重命名"
                          >
                            ✏️
                          </button>
                          <button 
                            className="history-action-btn delete"
                            onClick={e => handleDeleteDiagramClick(e, diagram.id)}
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
                <span className="empty-icon">📊</span>
                <p>暂无图表历史</p>
                <p className="empty-hint">使用 /diagram 命令生成图表</p>
              </div>
            )
          ) : (
            filteredTests.length > 0 ? (
              filteredTests.map((test, index) => (
                <div 
                  key={test.id || index} 
                  className={`history-item ${confirmDeleteId === (test.id || `test-${index}`) ? 'confirm-delete' : ''}`}
                  onClick={() => handleSelectTest(test, index)}
                >
                  <div className="history-item-icon">
                    {getFrameworkIcon(test.framework)}
                  </div>
                  <div className="history-item-content">
                    {editingId === (test.id || `test-${index}`) ? (
                      <div className="edit-title-container" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => handleKeyDown(e, test.id || `test-${index}`, index, false)}
                          autoFocus
                          className="edit-title-input"
                        />
                        <div className="edit-actions">
                          <button onClick={e => handleSaveRenameTest(e, test.id || `test-${index}`, index)} title="保存">✓</button>
                          <button onClick={handleCancelRename} title="取消">×</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="history-item-title">
                          {getTestDisplayName(test)}
                        </div>
                        <div className="history-item-meta">
                          <span className="type-badge">{test.framework}</span>
                          <span className="path" title={test.path}>
                            {test.path?.split('/').pop() || '测试文件'}
                          </span>
                          <span className="time">{formatDate(test.timestamp)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!editingId && (
                    <div className="history-item-actions">
                      {confirmDeleteId === (test.id || `test-${index}`) ? (
                        <div className="confirm-delete-actions">
                          <span className="confirm-text">确定删除?</span>
                          <button 
                            className="confirm-btn danger"
                            onClick={e => handleConfirmDeleteTest(e, index)}
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
                            className="history-action-btn"
                            onClick={e => handleStartRenameTest(e, test, index)}
                            title="重命名"
                          >
                            ✏️
                          </button>
                          <button 
                            className="history-action-btn delete"
                            onClick={e => handleDeleteTestClick(e, test.id || `test-${index}`)}
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
                <span className="empty-icon">🧪</span>
                <p>暂无测试历史</p>
                <p className="empty-hint">使用 /gentest 命令生成测试</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
