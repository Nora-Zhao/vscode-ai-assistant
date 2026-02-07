import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Diagram } from '../../types/shared';
import { vscode } from '../vscodeApi';

interface DiagramViewProps {
  diagram: Diagram;
  onUpdate: (code: string) => void;
  onExport: (format: string) => void;
  onClose: () => void;
  onAutoFix?: (code: string, error: string) => void;
}

type ViewMode = 'split' | 'code' | 'preview';

// 将 mermaid 代码编码为 base64（用于 mermaid.ink）
function encodeMermaid(code: string): string {
  try {
    // 使用 pako 压缩会更好，但这里简单使用 base64
    const encoded = btoa(unescape(encodeURIComponent(code)));
    return encoded;
  } catch {
    return btoa(code);
  }
}

// 生成 mermaid.ink URL
function getMermaidInkUrl(code: string, theme: 'dark' | 'default' = 'dark'): string {
  const encoded = encodeMermaid(code);
  return `https://mermaid.ink/svg/${encoded}?theme=${theme}&bgColor=transparent`;
}

// 生成 Kroki URL（备用服务）
function getKrokiUrl(code: string): string {
  const encoded = btoa(unescape(encodeURIComponent(code)));
  return `https://kroki.io/mermaid/svg/${encoded}`;
}

export default function DiagramView({ diagram, onUpdate, onExport, onClose, onAutoFix }: DiagramViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [editedCode, setEditedCode] = useState(diagram.code);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState(diagram.code);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setEditedCode(diagram.code);
    setPreviewCode(diagram.code);
    setHasChanges(false);
    setIsAutoFixing(false); // 重置自动修复状态
  }, [diagram.code]);

  useEffect(() => {
    setHasChanges(editedCode !== diagram.code);
  }, [editedCode, diagram.code]);

  // 使用 mermaid.ink 获取 SVG（带防抖）
  useEffect(() => {
    if (viewMode === 'code') return;
    
    const timer = setTimeout(() => {
      setPreviewCode(editedCode);
      setRetryCount(0);  // 代码变更时重置重试计数
    }, 500);
    
    return () => clearTimeout(timer);
  }, [editedCode, viewMode]);

  // 渲染 SVG 的函数
  const renderSvg = useCallback(async (code: string, useBackup: boolean = false): Promise<string> => {
    // 主服务: mermaid.ink，备用服务: kroki.io
    const url = useBackup ? getKrokiUrl(code) : getMermaidInkUrl(code, 'dark');
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000)  // 10秒超时
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`渲染失败 (${response.status}): ${text || (useBackup ? 'Kroki' : 'Mermaid.ink') + ' 服务不可用'}`);
    }
    
    const svg = await response.text();
    if (!svg.includes('<svg')) {
      throw new Error('返回内容不是有效的 SVG，可能存在语法错误');
    }
    
    return svg;
  }, []);

  // 加载 SVG（带备用服务）
  useEffect(() => {
    if (viewMode === 'code') return;
    
    setIsLoading(true);
    setError(null);
    
    const loadSvg = async () => {
      try {
        // 首先尝试主服务
        const svg = await renderSvg(previewCode, false);
        const styledSvg = svg.replace(
          '<svg ',
          '<svg style="max-width:100%;height:auto;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));" '
        );
        setSvgContent(styledSvg);
        setIsLoading(false);
      } catch (primaryError) {
        // 主服务失败，尝试备用服务
        try {
          const svg = await renderSvg(previewCode, true);
          const styledSvg = svg.replace(
            '<svg ',
            '<svg style="max-width:100%;height:auto;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));" '
          );
          setSvgContent(styledSvg);
          setIsLoading(false);
        } catch (backupError) {
          // 两个服务都失败
          const errorMsg = primaryError instanceof Error ? primaryError.message : '渲染失败';
          // 检查是否是网络问题
          if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
            setError(`渲染失败 (404): Not Found\n请检查 Mermaid 语法是否正确`);
          } else if (errorMsg.includes('timeout') || errorMsg.includes('network')) {
            setError('网络连接超时，请检查网络后重试');
          } else {
            setError(errorMsg);
          }
          setIsLoading(false);
          setSvgContent(null);
        }
      }
    };
    
    loadSvg();
  }, [previewCode, viewMode, renderSvg]);

  // 图片 URL（用于 img 标签备用）
  const imageUrl = useMemo(() => getMermaidInkUrl(previewCode, 'dark'), [previewCode]);

  const handleSave = useCallback(() => {
    onUpdate(editedCode);
    setHasChanges(false);
  }, [editedCode, onUpdate]);

  const handleReset = useCallback(() => {
    setEditedCode(diagram.code);
    setHasChanges(false);
  }, [diagram.code]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = editedCode;
      textArea.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editedCode]);

  const copySvg = useCallback(async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      vscode.postMessage({ type: 'showInfo', message: 'SVG 已复制到剪贴板' });
    } catch {
      vscode.postMessage({ type: 'showError', message: '复制失败' });
    }
  }, [svgContent]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      flowchart: '流程图',
      sequence: '时序图',
      class: '类图',
      state: '状态图',
      er: 'ER图',
      gantt: '甘特图',
      mindmap: '思维导图',
      architecture: '架构图',
    };
    return labels[type] || type;
  };

  return (
    <div className="diagram-view">
      <div className="diagram-header">
        <div className="diagram-title">
          <span className="diagram-type-badge">{getTypeLabel(diagram.type)}</span>
          <h3>{diagram.title || '图表预览'}</h3>
        </div>
        <div className="diagram-actions">
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'split' ? 'active' : ''} 
              onClick={() => setViewMode('split')}
              title="分屏视图"
            >
              ▣
            </button>
            <button 
              className={viewMode === 'code' ? 'active' : ''} 
              onClick={() => setViewMode('code')}
              title="仅代码"
            >
              &lt;/&gt;
            </button>
            <button 
              className={viewMode === 'preview' ? 'active' : ''} 
              onClick={() => setViewMode('preview')}
              title="仅预览"
            >
              ◉
            </button>
          </div>
          
          <button 
            onClick={copyCode} 
            title="复制代码"
            className={`icon-btn ${copied ? 'success' : ''}`}
          >
            {copied ? '✓' : '📋'}
          </button>
          <button onClick={() => onExport('svg')} title="导出 SVG" className="icon-btn">
            SVG
          </button>
          <button onClick={() => onExport('png')} title="导出 PNG" className="icon-btn">
            PNG
          </button>
          <button onClick={() => onExport('md')} title="导出 Markdown" className="icon-btn">
            MD
          </button>
          <button className="icon-btn close-btn" onClick={onClose} title="关闭">
            ×
          </button>
        </div>
      </div>

      <div className={`diagram-content view-${viewMode}`}>
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className="diagram-code-panel">
            <div className="code-panel-header">
              <span>📝 Mermaid 代码</span>
              {hasChanges && (
                <div className="code-actions">
                  <button onClick={handleSave} className="save-btn" title="保存更改">
                    保存
                  </button>
                  <button onClick={handleReset} className="reset-btn" title="重置">
                    重置
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              spellCheck={false}
              placeholder="在此编辑 Mermaid 代码..."
              className="diagram-code-editor"
            />
          </div>
        )}
        
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="diagram-preview-panel">
            <div className="preview-panel-header">
              <span>👁 预览</span>
              {isLoading && <span className="loading-dot">●</span>}
              {!isLoading && svgContent && <span className="success-dot">●</span>}
              {!isLoading && error && <span className="error-dot">●</span>}
              {svgContent && !isLoading && (
                <button onClick={copySvg} className="copy-svg-btn" title="复制 SVG">
                  📋 复制 SVG
                </button>
              )}
            </div>
            <div className="diagram-preview">
              {isLoading && (
                <div className="preview-loading">
                  <div className="loading-spinner"></div>
                  <span>渲染中...</span>
                </div>
              )}
              {error && !isLoading && (
                <div className="preview-error">
                  <span className="error-icon">⚠️</span>
                  <p>渲染失败</p>
                  <p className="error-detail">{error}</p>
                  <p className="error-hint">请检查 Mermaid 语法是否正确</p>
                  <a 
                    href="https://mermaid.js.org/syntax/flowchart.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="syntax-ref-link"
                  >
                    📖 查看 Mermaid 语法参考
                  </a>
                  <div className="error-actions">
                    <button onClick={() => setViewMode('code')} className="fix-btn">
                      ✏️ 手动编辑
                    </button>
                    {onAutoFix && (
                      <button 
                        onClick={() => {
                          setIsAutoFixing(true);
                          onAutoFix(editedCode, error);
                        }} 
                        className="auto-fix-btn"
                        disabled={isAutoFixing}
                      >
                        {isAutoFixing ? '🔄 修复中...' : '🤖 AI 自动修复'}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {svgContent && !error && !isLoading && (
                <div 
                  className="svg-container"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              )}
              {/* 备用：使用 img 标签 */}
              {!svgContent && !error && !isLoading && (
                <img 
                  src={imageUrl} 
                  alt="Mermaid Diagram"
                  onError={() => setError('图片加载失败')}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="diagram-footer">
        <span className="footer-item">格式: Mermaid</span>
        <span className="footer-item">更新: {new Date(diagram.updatedAt).toLocaleString('zh-CN')}</span>
        <a 
          href="https://mermaid.js.org/syntax/flowchart.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          📖 语法参考
        </a>
      </div>
    </div>
  );
}
