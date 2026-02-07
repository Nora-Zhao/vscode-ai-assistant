import React, { useState, useEffect, useCallback, useRef } from 'react';
import { vscode } from '../vscodeApi';

interface SearchResult {
  id: string;
  role: string;
  preview: string;
  timestamp: number;
  sessionId?: string;
  sessionTitle?: string;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollToMessage: (messageId: string) => void;
}

export default function SearchBar({ isOpen, onClose, onScrollToMessage }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'searchResults') {
        setResults(event.data.results || []);
        setSelectedIndex(0);
        setSearching(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      vscode.postMessage({ type: 'searchMessages', query: query.trim() });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        handleResultClick(selected);
      }
    }
  }, [results, selectedIndex, onClose]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.sessionId) {
      // 跨会话搜索结果，需要先加载会话
      vscode.postMessage({ type: 'loadSession', sessionId: result.sessionId });
      // 延迟滚动到消息
      setTimeout(() => {
        onScrollToMessage(result.id);
      }, 500);
    } else {
      // 当前会话的结果，直接滚动
      onScrollToMessage(result.id);
    }
    onClose();
  }, [onScrollToMessage, onClose]);

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    
    const words = query.trim().split(/\s+/).filter(w => w.length > 0);
    let result = text;
    
    for (const word of words) {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索所有对话... (支持多关键词)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          {query && (
            <button 
              className="search-clear" 
              onClick={() => setQuery('')}
              title="清除"
            >
              ×
            </button>
          )}
          <button className="search-close" onClick={onClose} title="关闭 (Esc)">
            ×
          </button>
        </div>
        
        {query && (
          <div className="search-results">
            {searching ? (
              <div className="search-loading">搜索中...</div>
            ) : results.length > 0 ? (
              <>
                <div className="search-count">
                  找到 {results.length} 条结果
                </div>
                <div className="search-results-list">
                  {results.map((result, index) => (
                    <div
                      key={`${result.sessionId || 'current'}-${result.id}`}
                      className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="result-header">
                        <span className={`result-role ${result.role}`}>
                          {result.role === 'user' ? '👤' : result.role === 'assistant' ? '🤖' : '⚙️'}
                        </span>
                        <span className="result-time">{formatTime(result.timestamp)}</span>
                        {result.sessionTitle && (
                          <span className="result-session" title={result.sessionTitle}>
                            📁 {result.sessionTitle.length > 15 
                              ? result.sessionTitle.slice(0, 15) + '...' 
                              : result.sessionTitle}
                          </span>
                        )}
                      </div>
                      <div className="result-preview">
                        {highlightMatch(result.preview)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="search-hint">
                  ↑↓ 选择 · Enter 跳转 · Esc 关闭
                </div>
              </>
            ) : (
              <div className="search-no-results">
                没有找到匹配的消息
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
