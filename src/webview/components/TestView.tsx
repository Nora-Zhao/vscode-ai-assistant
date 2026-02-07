import React, { useState, useCallback, useEffect } from 'react';
import { vscode } from '../vscodeApi';

interface TestViewProps {
  code: string;
  path: string;
  framework: string;
  onSave: () => void;
  onRun: () => void;
  onClose: () => void;
  testResult?: {
    success: boolean;
    output: string;
    errors?: string[];
  };
  onAutoFix?: (code: string, errors: string) => void;
  onRefine?: (code: string) => void; // 新增：优化/修复生成的代码
}

export default function TestView({ code, path, framework, onSave, onRun, onClose, testResult, onAutoFix, onRefine }: TestViewProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [isEditing, setIsEditing] = useState(false);
  const [customPath, setCustomPath] = useState(path);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // 当code属性变化时更新本地状态（用于自动修复后更新）
  useEffect(() => {
    setEditedCode(code);
    setIsAutoFixing(false);
    setIsRefining(false);
  }, [code]);

  // 监听测试结果变化
  useEffect(() => {
    if (testResult) {
      setShowResult(true);
    }
  }, [testResult]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = editedCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [editedCode]);

  const handleSave = useCallback(() => {
    // 发送保存请求
    vscode.postMessage({
      type: 'saveTest',
      code: editedCode,
      path: customPath,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  }, [editedCode, customPath, onSave]);

  const handleRun = useCallback(() => {
    // 发送运行测试请求
    vscode.postMessage({
      type: 'runTest',
      path: customPath,
    });
    onRun();
  }, [customPath, onRun]);

  const handleInsert = useCallback(() => {
    // 发送插入代码请求
    vscode.postMessage({
      type: 'insertCode',
      code: editedCode,
      language: getLanguageFromFramework(framework),
    });
  }, [editedCode, framework]);

  // 获取语言
  function getLanguageFromFramework(fw: string): string {
    const map: Record<string, string> = {
      jest: 'typescript',
      mocha: 'typescript',
      vitest: 'typescript',
      pytest: 'python',
      unittest: 'python',
      junit: 'java',
      go: 'go',
      rspec: 'ruby',
    };
    return map[fw.toLowerCase()] || 'javascript';
  }

  // 获取框架图标
  function getFrameworkIcon(fw: string): string {
    const icons: Record<string, string> = {
      jest: '🃏',
      mocha: '☕',
      vitest: '⚡',
      pytest: '🐍',
      unittest: '🐍',
      junit: '☕',
      go: '🔷',
      rspec: '💎',
    };
    return icons[fw.toLowerCase()] || '🧪';
  }

  return (
    <div className="test-view">
      <div className="test-header">
        <h3>{getFrameworkIcon(framework)} 生成的测试代码</h3>
        <div className="test-actions">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} title="编辑代码">
                ✏️ 编辑
              </button>
              <button 
                onClick={copyToClipboard} 
                title="复制代码"
                className={copied ? 'success' : ''}
              >
                {copied ? '✓ 已复制' : '📋 复制'}
              </button>
              <button onClick={handleInsert} title="插入到编辑器">
                📥 插入
              </button>
              <button 
                onClick={handleSave} 
                title="保存到文件"
                className={saved ? 'success' : ''}
              >
                {saved ? '✓ 已保存' : '💾 保存'}
              </button>
              <button onClick={handleRun} title="运行测试" className="run-btn">
                ▶️ 运行
              </button>
              {onRefine && (
                <button 
                  onClick={() => {
                    setIsRefining(true);
                    onRefine(editedCode);
                  }}
                  title="AI优化代码"
                  className={`refine-btn ${isRefining ? 'loading' : ''}`}
                  disabled={isRefining}
                >
                  {isRefining ? '🔄 优化中...' : '🔧 AI修复'}
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="save-btn">
                ✓ 完成编辑
              </button>
            </>
          )}
          <button className="close-btn" onClick={onClose} title="关闭">
            ×
          </button>
        </div>
      </div>

      <div className="test-info">
        <div className="test-info-row">
          <span className="info-label">测试框架:</span>
          <span className="framework-badge">{getFrameworkIcon(framework)} {framework}</span>
        </div>
        <div className="test-info-row">
          <span className="info-label">保存路径:</span>
          {isEditing ? (
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="path-input"
              placeholder="输入文件保存路径"
            />
          ) : (
            <code className="path-display">{customPath}</code>
          )}
        </div>
      </div>

      <div className="test-content">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            spellCheck={false}
            className="test-editor"
            placeholder="编辑测试代码..."
          />
        ) : (
          <div className="test-preview">
            <pre>
              <code>{editedCode}</code>
            </pre>
          </div>
        )}
      </div>

      <div className="test-footer">
        <span className="test-hint">
          💡 提示：保存前请检查并修改测试代码，确保它符合你的项目需求。
        </span>
      </div>

      {/* 测试结果展示区域 */}
      {showResult && testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'failure'}`}>
          <div className="test-result-header">
            <span className="result-icon">
              {testResult.success ? '✅' : '❌'}
            </span>
            <span className="result-title">
              {testResult.success ? '测试通过' : '测试失败'}
            </span>
            <button 
              className="close-result-btn"
              onClick={() => setShowResult(false)}
            >
              ×
            </button>
          </div>
          <div className="test-result-output">
            <pre>{testResult.output}</pre>
          </div>
          {!testResult.success && testResult.errors && testResult.errors.length > 0 && (
            <div className="test-result-errors">
              <h4>错误详情：</h4>
              <ul>
                {testResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {!testResult.success && onAutoFix && (
            <div className="test-result-actions">
              <button 
                className="auto-fix-btn"
                onClick={() => {
                  setIsAutoFixing(true);
                  const errorInfo = testResult.errors?.join('\n') || testResult.output;
                  onAutoFix(editedCode, errorInfo);
                }}
                disabled={isAutoFixing}
              >
                {isAutoFixing ? '🔄 修复中...' : '🤖 AI 自动修复'}
              </button>
              <button 
                className="edit-fix-btn"
                onClick={() => {
                  setIsEditing(true);
                  setShowResult(false);
                }}
              >
                ✏️ 手动修复
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
