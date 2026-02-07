import React, { useMemo, useState, useCallback, memo } from 'react';
import { Message, Diagram } from '../../types/shared';
import { vscode } from '../vscodeApi';
import { copyToClipboard } from '../utils/clipboard';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate: () => void;
  currentDiagram?: Diagram | null;
  onViewDiagram?: () => void;
  messageRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

// 代码修改结构
interface CodeChange {
  original: string;
  replacement: string;
}

// 解析 SEARCH/REPLACE 格式
function parseSearchReplace(content: string): { changes: CodeChange[]; cleanContent: string } {
  const changes: CodeChange[] = [];
  let cleanContent = content;
  
  const regex = /<<<<<<< SEARCH\s*\n?([\s\S]*?)\n?=======\s*\n?([\s\S]*?)\n?>>>>>>> REPLACE/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    changes.push({
      original: match[1].trim(),
      replacement: match[2].trim()
    });
  }
  
  if (changes.length > 0) {
    cleanContent = content.replace(regex, '').trim();
  }
  
  return { changes, cleanContent };
}

// 清理用户消息
function cleanUserMessage(content: string): string {
  let cleaned = content;
  
  cleaned = cleaned.replace(/请使用以下格式返回代码修改[\s\S]*?>>>>>>> REPLACE\s*\`\`\`\s*/g, '');
  cleaned = cleaned.replace(/\n*请使用以下格式返回代码修改.*$/gm, '');
  
  const systemPromptPatterns = [
    /\[要查找的原始代码\]/g,
    /\[替换后的新代码\]/g,
    /请详细解释以下代码的功能、逻辑和工作原理[：:]/g,
    /请检查以下代码中可能存在的bug或问题，并提供修复后的代码[：:]/g,
    /请优化以下代码的性能、可读性和最佳实践，并解释优化点[：:]/g,
    /请为以下代码添加详细的中文注释，解释每个部分的功能[：:]/g,
    /请为以下代码生成完整的单元测试用例，包含边界条件和异常情况[：:]/g,
    /请对以下代码进行代码审查，指出潜在问题、改进建议和最佳实践[：:]/g,
    /Use SEARCH\/REPLACE format[：:]?/gi,
    /Explain this code in detail[：:]?/gi,
    /Refactor this code\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Find and fix bugs\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Add comments\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Optimize this code\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Please perform a code review[\s\S]*?improvement suggestions[：:]?/gi,
    /\*\*文件:\*\*\s*`[^`]+`\s*/g,
    /\*\*语言:\*\*\s*\w+\s*/g,
    /\[项目上下文\][\s\S]*?\[用户问题\]\s*/g,
    /\[项目上下文\]/g,
    /\[用户问题\]/g,
  ];
  
  for (const pattern of systemPromptPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// 是否应过滤消息
function shouldFilterMessage(message: Message): boolean {
  if (message.role === 'system') return true;
  if (message.content.includes('[上下文摘要]')) return false;
  
  const content = message.content.trim();
  if (content.includes('[要查找的原始代码]') && content.includes('[替换后的新代码]')) {
    const withoutPrompt = content
      .replace(/<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();
    if (withoutPrompt.length < 50) return true;
  }
  
  return false;
}

// 代码修改卡片组件 - 使用 memo 优化
const CodeChangeCard = memo(function CodeChangeCard({ change }: { change: CodeChange }) {
  const [copied, setCopied] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  if (!change.replacement || change.replacement.trim() === '') {
    return null;
  }
  
  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(change.replacement);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [change.replacement]);
  
  const handleReplace = useCallback(() => {
    vscode.postMessage({
      type: 'replaceCode',
      original: change.original,
      replacement: change.replacement
    });
    setReplaced(true);
    setTimeout(() => setReplaced(false), 3000);
  }, [change.original, change.replacement]);
  
  const handleInsert = useCallback(() => {
    vscode.postMessage({ type: 'insertCode', code: change.replacement });
  }, [change.replacement]);
  
  return (
    <div className="code-change-card">
      <div className="code-change-header">
        <span className="change-label">✨ 修改后的代码</span>
        {change.original && change.original.trim() && (
          <button 
            className="change-toggle"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? '🔽 隐藏原代码' : '🔍 查看原代码'}
          </button>
        )}
      </div>
      
      {showOriginal && change.original && change.original.trim() && (
        <div className="original-code">
          <div className="original-label">原代码：</div>
          <pre><code>{change.original}</code></pre>
        </div>
      )}
      
      <div className="replacement-code">
        <pre><code>{change.replacement}</code></pre>
      </div>
      
      <div className="code-change-actions">
        <button 
          onClick={handleReplace} 
          className={`action-btn primary ${replaced ? 'success' : ''}`}
          title="在编辑器中查找并替换"
        >
          {replaced ? '✓ 已替换' : '🔄 一键替换'}
        </button>
        <button onClick={handleInsert} className="action-btn" title="插入到光标位置">
          📥 插入
        </button>
        <button onClick={handleCopy} className={`action-btn ${copied ? 'success' : ''}`} title="复制">
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
      </div>
    </div>
  );
});

// 代码块组件 - 使用 memo 优化
const CodeBlock = memo(function CodeBlock({ 
  language, 
  code, 
  isComplete 
}: { 
  language: string; 
  code: string; 
  isComplete: boolean 
}) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const cleanedCode = code.trim();
  
  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(cleanedCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [cleanedCode]);

  const handleInsert = useCallback(() => {
    vscode.postMessage({ type: 'insertCode', code: cleanedCode, language });
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  }, [cleanedCode, language]);

  const handleSave = useCallback(() => {
    const ext = getFileExtension(language);
    vscode.postMessage({ 
      type: 'saveCodeToFile', 
      code: cleanedCode, 
      filename: `code_${Date.now()}${ext}`, 
      language 
    });
  }, [cleanedCode, language]);

  return (
    <div className={`code-block ${!isComplete ? 'streaming' : ''}`}>
      <div className="code-header">
        <span className="code-lang">{language || 'text'}</span>
        <div className="code-actions visible">
          <button onClick={handleCopy} title="复制" className={`action-btn ${copied ? 'success' : ''}`}>
            {copied ? '✓' : '📋'}
          </button>
          <button onClick={handleInsert} title="插入" className={`action-btn ${inserted ? 'success' : ''}`}>
            {inserted ? '✓' : '📥'}
          </button>
          {isComplete && <button onClick={handleSave} title="保存" className="action-btn">💾</button>}
        </div>
      </div>
      <pre>
        <code className={`language-${language}`}>{cleanedCode}</code>
        {!isComplete && <span className="cursor-blink">▋</span>}
      </pre>
    </div>
  );
});

// 获取文件扩展名
function getFileExtension(lang: string): string {
  const ext: Record<string, string> = {
    javascript: '.js', js: '.js', typescript: '.ts', ts: '.ts', tsx: '.tsx', jsx: '.jsx',
    python: '.py', py: '.py', java: '.java', cpp: '.cpp', c: '.c', csharp: '.cs', cs: '.cs',
    go: '.go', rust: '.rs', rs: '.rs', ruby: '.rb', rb: '.rb', php: '.php',
    html: '.html', css: '.css', json: '.json', yaml: '.yaml', yml: '.yml',
    markdown: '.md', md: '.md', sql: '.sql', shell: '.sh', bash: '.sh', sh: '.sh',
    vue: '.vue', svelte: '.svelte', swift: '.swift', kotlin: '.kt', text: '.txt',
  };
  return ext[lang.toLowerCase()] || '.txt';
}

// 简化的 Markdown 渲染（完整版见原文件）
function parseMarkdown(content: string, isStreaming?: boolean): React.ReactNode[] {
  if (!content) return [];
  
  const lines = content.split('\n');
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent = '';
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = '';
      } else {
        result.push(
          <CodeBlock
            key={key++}
            language={codeLanguage}
            code={codeContent}
            isComplete={!isStreaming || i < lines.length - 1}
          />
        );
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line;
      continue;
    }

    // 简单的 Markdown 处理
    if (line.startsWith('# ')) {
      result.push(<h1 key={key++}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      result.push(<h3 key={key++}>{line.slice(4)}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(<li key={key++}>{parseInline(line.slice(2))}</li>);
    } else if (line.trim()) {
      result.push(<p key={key++}>{parseInline(line)}</p>);
    }
  }

  // 处理未关闭的代码块
  if (inCodeBlock && codeContent) {
    result.push(
      <CodeBlock
        key={key++}
        language={codeLanguage}
        code={codeContent}
        isComplete={false}
      />
    );
  }

  return result;
}

// 内联元素解析
function parseInline(text: string): React.ReactNode {
  // 简化版：只处理加粗和行内代码
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
}

// Markdown 渲染器组件
const MarkdownRenderer = memo(function MarkdownRenderer({ 
  content, 
  isStreaming,
  codeChanges 
}: { 
  content: string; 
  isStreaming?: boolean;
  codeChanges?: CodeChange[];
}) {
  const rendered = useMemo(() => {
    if (!content || !content.trim()) return [];
    return parseMarkdown(content, isStreaming);
  }, [content, isStreaming]);
  
  const validCodeChanges = useMemo(() => {
    if (!codeChanges) return [];
    return codeChanges.filter(change => change.replacement?.trim());
  }, [codeChanges]);
  
  if (rendered.length === 0 && validCodeChanges.length === 0) {
    return null;
  }
  
  return (
    <>
      {rendered}
      {validCodeChanges.length > 0 && (
        <div className="code-changes-section">
          {validCodeChanges.map((change, i) => (
            <CodeChangeCard key={i} change={change} />
          ))}
        </div>
      )}
    </>
  );
});

// 用户消息内容组件
const UserMessageContent = memo(function UserMessageContent({ content }: { content: string }) {
  const cleaned = useMemo(() => cleanUserMessage(content), [content]);
  const codeMatch = cleaned.match(/```(\w+)?\n([\s\S]*?)```/);
  const textPart = cleaned.replace(/```[\s\S]*?```/g, '').trim();
  
  if (cleaned.length < 200 && !codeMatch) {
    return <MarkdownRenderer content={cleaned} />;
  }
  
  return (
    <div className="user-message-compact">
      {textPart && (
        <div className="user-text">
          <MarkdownRenderer content={textPart.length > 150 ? textPart.slice(0, 150) + '...' : textPart} />
        </div>
      )}
      {codeMatch && (
        <div className="user-code-ref">
          <span className="code-ref-icon">📄</span>
          <span className="code-ref-text">
            {codeMatch[1] ? `${codeMatch[1]} 代码` : '代码'}
            <span className="code-preview"> ({codeMatch[2].split('\n').length} 行)</span>
          </span>
        </div>
      )}
    </div>
  );
});

// 单个消息组件
const MessageItem = memo(function MessageItem({
  message,
  isLast,
  isLoading,
  onRegenerate,
  currentDiagram,
  onViewDiagram,
  onSetRef,
}: {
  message: Message & { codeChanges?: CodeChange[]; cleanContent?: string };
  isLast: boolean;
  isLoading: boolean;
  onRegenerate: () => void;
  currentDiagram?: Diagram | null;
  onViewDiagram?: () => void;
  onSetRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  const handleCopy = useCallback(async () => {
    await copyToClipboard(message.content);
  }, [message.content]);

  return (
    <div 
      className={`message message-${message.role}`}
      ref={(el) => onSetRef(message.id, el)}
    >
      <div className="message-header">
        <span className="message-role">{message.role === 'user' ? '👤' : '🤖'}</span>
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="message-content">
        {message.attachments?.map((att, i) => (
          <div key={i} className="message-attachment">
            {att.type === 'image' && <img src={att.data} alt={att.name} className="message-image" />}
            {att.type === 'file' && (
              <div className="message-file"><span>📎</span><span>{att.name}</span></div>
            )}
          </div>
        ))}
        
        {message.role === 'user' ? (
          <UserMessageContent content={message.content} />
        ) : (
          <MarkdownRenderer 
            content={message.cleanContent || message.content}
            isStreaming={isLoading && isLast}
            codeChanges={message.codeChanges}
          />
        )}
      </div>

      {message.role === 'assistant' && isLast && !isLoading && (
        <div className="message-actions">
          <button onClick={handleCopy} title="复制">📋</button>
          <button onClick={onRegenerate} title="重新生成">🔄</button>
          {currentDiagram && onViewDiagram && (
            <button onClick={onViewDiagram} title="查看图表">📊</button>
          )}
        </div>
      )}
    </div>
  );
});

// 主组件
function MessageList({ 
  messages, 
  isLoading, 
  onRegenerate, 
  currentDiagram, 
  onViewDiagram, 
  messageRefs
}: MessageListProps) {
  
  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (messageRefs) {
      el ? messageRefs.current.set(id, el) : messageRefs.current.delete(id);
    }
  }, [messageRefs]);

  const processedMessages = useMemo(() => {
    return messages
      .filter(msg => !shouldFilterMessage(msg))
      .map(msg => {
        if (msg.role === 'assistant') {
          const { changes, cleanContent } = parseSearchReplace(msg.content);
          return { ...msg, codeChanges: changes, cleanContent };
        }
        return { ...msg, codeChanges: [] as CodeChange[], cleanContent: msg.content };
      });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="welcome-message">
          <h2>👋 欢迎使用 AI Assistant</h2>
          <div className="quick-commands">
            <button onClick={() => vscode.postMessage({ type: 'sendMessage', message: '/help' })}>
              <span>❓</span><span>帮助</span>
            </button>
            <button onClick={() => vscode.postMessage({ type: 'sendMessage', message: '/init' })}>
              <span>📁</span><span>分析项目</span>
            </button>
            <button onClick={() => vscode.postMessage({ type: 'sendMessage', message: '/diagram flowchart 用户登录流程' })}>
              <span>📊</span><span>生成图表</span>
            </button>
            <button onClick={() => vscode.postMessage({ type: 'sendMessage', message: '/gentest' })}>
              <span>🧪</span><span>生成测试</span>
            </button>
          </div>
          <div className="tips">
            <p>💡 选中代码右键可使用AI功能 | 支持拖放文件 | <kbd>↑</kbd><kbd>↓</kbd>浏览历史</p>
          </div>
        </div>
      )}

      {processedMessages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === processedMessages.length - 1}
          isLoading={isLoading}
          onRegenerate={onRegenerate}
          currentDiagram={currentDiagram}
          onViewDiagram={onViewDiagram}
          onSetRef={setMessageRef}
        />
      ))}

      {isLoading && (
        <div className="loading-indicator">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      )}
    </div>
  );
}

export default memo(MessageList);
