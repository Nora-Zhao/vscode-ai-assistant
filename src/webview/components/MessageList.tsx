import React, { useMemo, useState, useCallback } from 'react';
import { Message, Diagram } from '../../types/shared';
import { vscode } from '../vscodeApi';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate: () => void;
  currentDiagram?: Diagram | null;
  onViewDiagram?: () => void;
  messageRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

// 提取 SEARCH/REPLACE 代码对
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

// 清理用户消息 - 移除系统提示词
function cleanUserMessage(content: string): string {
  let cleaned = content;
  
  // 移除 SEARCH/REPLACE 格式说明
  cleaned = cleaned.replace(/请使用以下格式返回代码修改[\s\S]*?>>>>>>> REPLACE\s*\`\`\`\s*/g, '');
  cleaned = cleaned.replace(/\n*请使用以下格式返回代码修改.*$/gm, '');
  
  const systemPromptPatterns = [
    // 中文系统提示词
    /\[要查找的原始代码\]/g,
    /\[替换后的新代码\]/g,
    /请详细解释以下代码的功能、逻辑和工作原理[：:]/g,
    /请检查以下代码中可能存在的bug或问题，并提供修复后的代码[：:]/g,
    /请优化以下代码的性能、可读性和最佳实践，并解释优化点[：:]/g,
    /请为以下代码添加详细的中文注释，解释每个部分的功能[：:]/g,
    /请为以下代码生成完整的单元测试用例，包含边界条件和异常情况[：:]/g,
    /请对以下代码进行代码审查，指出潜在问题、改进建议和最佳实践[：:]/g,
    
    // 英文系统提示词
    /Use SEARCH\/REPLACE format[：:]?/gi,
    /Explain this code in detail[：:]?/gi,
    /Refactor this code\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Find and fix bugs\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Add comments\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Optimize this code\.?\s*Use SEARCH\/REPLACE format[：:]?/gi,
    /Please perform a code review[\s\S]*?improvement suggestions[：:]?/gi,
    
    // 文件/语言信息
    /\*\*文件:\*\*\s*`[^`]+`\s*/g,
    /\*\*语言:\*\*\s*\w+\s*/g,
    
    // 项目上下文标签
    /\[项目上下文\][\s\S]*?\[用户问题\]\s*/g,
    /\[项目上下文\]/g,
    /\[用户问题\]/g,
  ];
  
  for (const pattern of systemPromptPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

// 判断消息是否应该被过滤
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

// 代码修改卡片组件
function CodeChangeCard({ change }: { change: CodeChange }) {
  const [copied, setCopied] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  // 如果替换内容为空，不渲染卡片
  if (!change.replacement || change.replacement.trim() === '') {
    return null;
  }
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(change.replacement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = change.replacement;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
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
    vscode.postMessage({
      type: 'insertCode',
      code: change.replacement
    });
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
}

// Markdown渲染器
function MarkdownRenderer({ content, isStreaming, codeChanges }: { 
  content: string; 
  isStreaming?: boolean;
  codeChanges?: CodeChange[];
}) {
  const rendered = useMemo(() => {
    // 如果内容为空或只有空白，不渲染任何内容
    if (!content || !content.trim()) {
      return [];
    }
    return parseMarkdown(content, isStreaming);
  }, [content, isStreaming]);
  
  // 过滤掉空的代码变更
  const validCodeChanges = useMemo(() => {
    if (!codeChanges) return [];
    return codeChanges.filter(change => 
      change.replacement && change.replacement.trim() !== ''
    );
  }, [codeChanges]);
  
  // ✅ 修复：如果正在流式输出但内容为空，显示加载指示器
  if (isStreaming && rendered.length === 0 && validCodeChanges.length === 0) {
    return (
      <div className="streaming-placeholder">
        <span className="cursor-blink">▋</span>
      </div>
    );
  }
  
  // 如果没有任何内容和代码变更要显示，返回null
  if (rendered.length === 0 && validCodeChanges.length === 0) {
    return null;
  }
  
  // ✅ 修复显示顺序：先显示文字说明，再显示代码修改卡片
  // 顺序：问题分析 → "以下是修复后的代码：" → 代码块
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
}

function parseMarkdown(content: string, isStreaming?: boolean): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let key = 0;
  
  // 清理空代码块和无效内容
  let cleanedContent = content;
  
  // 移除完全空的代码块
  cleanedContent = cleanedContent.replace(/```\w*\s*```/g, '');
  cleanedContent = cleanedContent.replace(/```\s*\n?\s*```/g, '');
  
  // 处理 SEARCH/REPLACE 标记
  if (isStreaming) {
    // 流式传输时，处理各种不完整的标记状态
    cleanedContent = cleanedContent.replace(/<<<<<<< SEARCH[\s\S]*$/, '\n\n*🔄 正在生成代码修改...*');
    cleanedContent = cleanedContent.replace(/<<<<<<<\s*SEARCH\s*$/m, '\n\n*🔄 正在分析代码...*');
    cleanedContent = cleanedContent.replace(/<<<<<<< SEARCH\s*\n[^=]*$/m, '\n\n*🔄 正在生成代码修改...*');
  } else {
    // 非流式时，清理所有完整的 SEARCH/REPLACE 块（这些会被CodeChangeCard处理）
    cleanedContent = cleanedContent.replace(/<<<<<<< SEARCH[\s\S]*?>>>>>>> REPLACE/g, '');
    // 清理不完整的块（被中断的响应）- 但保留有价值的代码部分
    const incompleteBlockMatch = cleanedContent.match(/<<<<<<< SEARCH\s*\n([\s\S]*?)(?:=======\s*\n([\s\S]*))?$/);
    if (incompleteBlockMatch) {
      // 有不完整的SEARCH/REPLACE块
      const searchPart = incompleteBlockMatch[1]?.trim();
      const replacePart = incompleteBlockMatch[2]?.trim();
      
      // 移除不完整块
      cleanedContent = cleanedContent.replace(/<<<<<<< SEARCH[\s\S]*$/m, '');
      
      // 如果有部分替换代码，显示它
      if (replacePart) {
        cleanedContent += '\n\n*⚠️ 代码修改生成被中断，以下是部分生成的代码：*\n\n```\n' + replacePart + '\n```';
      } else if (searchPart) {
        cleanedContent += '\n\n*⚠️ 代码修改生成被中断*';
      }
    }
    // 清理残留的标记
    cleanedContent = cleanedContent.replace(/^=======\s*$/gm, '');
    cleanedContent = cleanedContent.replace(/^>>>>>>> REPLACE\s*$/gm, '');
    cleanedContent = cleanedContent.replace(/^<<<<<<< SEARCH\s*$/gm, '');
  }
  
  // 修复不完整的markdown格式（被打断时可能出现）
  // 1. 修复未闭合的粗体标记
  const boldCount = (cleanedContent.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    cleanedContent = cleanedContent.replace(/\*\*([^*]*)$/, '$1');
  }
  
  // 2. 修复未闭合的斜体标记（单个*）
  const italicMatches = cleanedContent.match(/(?<!\*)\*(?!\*)/g) || [];
  if (italicMatches.length % 2 !== 0) {
    cleanedContent = cleanedContent.replace(/\*([^*]*)$/, '$1');
  }
  
  // 3. 修复未闭合的行内代码
  const backtickCount = (cleanedContent.match(/(?<!`)`(?!`)/g) || []).length;
  if (backtickCount % 2 !== 0) {
    cleanedContent = cleanedContent.replace(/`([^`]*)$/, '$1');
  }
  
  // 4. 修复未闭合的链接 - [text](url 或 [text]
  cleanedContent = cleanedContent.replace(/\[([^\]]*)\]\([^)]*$/, '[$1]');
  cleanedContent = cleanedContent.replace(/\[([^\]]*)$/, '$1');
  
  // 5. 修复未闭合的代码块 - 添加结束标记
  const codeBlockStarts = (cleanedContent.match(/```\w*\n/g) || []).length;
  const codeBlockEnds = (cleanedContent.match(/\n```(?:\n|$)/g) || []).length;
  if (codeBlockStarts > codeBlockEnds) {
    // 有未闭合的代码块，添加闭合标记
    cleanedContent = cleanedContent + '\n```';
  }
  
  // 如果清理后内容为空,返回空数组
  if (!cleanedContent.trim()) {
    return result;
  }
  
  const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string; isComplete?: boolean }> = [];
  
  let remaining = cleanedContent;
  let codeBlockStart = remaining.indexOf('```');
  
  while (codeBlockStart !== -1) {
    if (codeBlockStart > 0) {
      const textContent = remaining.slice(0, codeBlockStart).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    const afterBackticks = remaining.slice(codeBlockStart + 3);
    const langMatch = afterBackticks.match(/^(\w*)\n?/);
    const lang = langMatch?.[1] || 'text';
    const codeStart = codeBlockStart + 3 + (langMatch?.[0].length || 0);
    const codeBlockEnd = remaining.indexOf('```', codeStart);
    
    if (codeBlockEnd !== -1) {
      const codeContent = remaining.slice(codeStart, codeBlockEnd).trim();
      // 只添加非空的代码块
      if (codeContent) {
        parts.push({ type: 'code', content: codeContent, lang, isComplete: true });
      }
      remaining = remaining.slice(codeBlockEnd + 3);
    } else {
      // 未闭合的代码块 - 在流式时标记为不完整
      const codeContent = remaining.slice(codeStart).trim();
      if (codeContent) {
        parts.push({ type: 'code', content: codeContent, lang, isComplete: isStreaming ? false : true });
      }
      remaining = '';
    }
    
    codeBlockStart = remaining.indexOf('```');
  }
  
  if (remaining.trim()) {
    parts.push({ type: 'text', content: remaining.trim() });
  }
  
  for (const part of parts) {
    if (part.type === 'code') {
      result.push(
        <CodeBlock key={key++} language={part.lang || 'text'} code={part.content} isComplete={part.isComplete ?? true} />
      );
    } else {
      result.push(...parseInlineMarkdown(part.content, key));
      key += 100;
    }
  }
  
  return result;
}

function parseInlineMarkdown(text: string, startKey: number): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let key = startKey;
  const lines = text.split('\n');
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' = 'ul';
  
  const flushList = () => {
    if (listItems.length > 0) {
      result.push(listType === 'ul' 
        ? <ul key={key++} className="md-list">{listItems}</ul>
        : <ol key={key++} className="md-list">{listItems}</ol>
      );
      listItems = [];
      inList = false;
    }
  };
  
  lines.forEach((line, lineIndex) => {
    const h1 = line.match(/^# (.+)$/);
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    const h4 = line.match(/^#### (.+)$/);
    
    if (h1) { flushList(); result.push(<h1 key={key++}>{processInline(h1[1])}</h1>); return; }
    if (h2) { flushList(); result.push(<h2 key={key++}>{processInline(h2[1])}</h2>); return; }
    if (h3) { flushList(); result.push(<h3 key={key++}>{processInline(h3[1])}</h3>); return; }
    if (h4) { flushList(); result.push(<h4 key={key++}>{processInline(h4[1])}</h4>); return; }
    
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      flushList();
      result.push(<hr key={key++} className="md-hr" />);
      return;
    }
    
    const ul = line.match(/^[\s]*[-*+] (.+)$/);
    const ol = line.match(/^[\s]*(\d+)\. (.+)$/);
    
    if (ul) {
      if (!inList || listType !== 'ul') { flushList(); inList = true; listType = 'ul'; }
      listItems.push(<li key={key++}>{processInline(ul[1])}</li>);
      return;
    }
    if (ol) {
      if (!inList || listType !== 'ol') { flushList(); inList = true; listType = 'ol'; }
      listItems.push(<li key={key++}>{processInline(ol[2])}</li>);
      return;
    }
    
    flushList();
    
    const quote = line.match(/^> (.*)$/);
    if (quote) {
      result.push(<blockquote key={key++} className="md-quote">{processInline(quote[1])}</blockquote>);
      return;
    }
    
    if (line.trim()) {
      result.push(<p key={key++} className="md-paragraph">{processInline(line)}</p>);
    } else if (lineIndex > 0 && lineIndex < lines.length - 1) {
      result.push(<div key={key++} className="md-spacer" />);
    }
  });
  
  flushList();
  return result;
}

function processInline(text: string): React.ReactNode[] {
  let processed = text;
  processed = processed.replace(/\*\*(.+?)\*\*/g, '⟨BOLD:$1⟩');
  processed = processed.replace(/__(.+?)__/g, '⟨BOLD:$1⟩');
  processed = processed.replace(/\*(.+?)\*/g, '⟨ITALIC:$1⟩');
  processed = processed.replace(/_([^_]+)_/g, '⟨ITALIC:$1⟩');
  processed = processed.replace(/~~(.+?)~~/g, '⟨STRIKE:$1⟩');
  processed = processed.replace(/`([^`]+)`/g, '⟨CODE:$1⟩');
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '⟨LINK:$1:$2⟩');
  
  const parts = processed.split(/(⟨[^⟩]+⟩)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('⟨BOLD:')) return <strong key={i}>{part.slice(6, -1)}</strong>;
    if (part.startsWith('⟨ITALIC:')) return <em key={i}>{part.slice(8, -1)}</em>;
    if (part.startsWith('⟨STRIKE:')) return <del key={i}>{part.slice(8, -1)}</del>;
    if (part.startsWith('⟨CODE:')) return <code key={i} className="inline-code">{part.slice(6, -1)}</code>;
    if (part.startsWith('⟨LINK:')) {
      const content = part.slice(6, -1);
      const idx = content.lastIndexOf(':http');
      const [linkText, url] = idx > 0 
        ? [content.slice(0, idx), content.slice(idx + 1)]
        : [content.slice(0, content.indexOf(':')), content.slice(content.indexOf(':') + 1)];
      return <a key={i} href={url} target="_blank" rel="noopener noreferrer">{linkText}</a>;
    }
    return part;
  }).filter(p => p !== '');
}

// 代码块组件
function CodeBlock({ language, code, isComplete }: { language: string; code: string; isComplete: boolean }) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const cleanedCode = code.trim();
  
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanedCode);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = cleanedCode;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  }, [cleanedCode]);

  const insertToEditor = useCallback(() => {
    vscode.postMessage({ type: 'insertCode', code: cleanedCode, language });
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  }, [cleanedCode, language]);

  const saveToFile = useCallback(() => {
    const ext = getFileExtension(language);
    vscode.postMessage({ type: 'saveCodeToFile', code: cleanedCode, filename: `code_${Date.now()}${ext}`, language });
  }, [cleanedCode, language]);

  return (
    <div className={`code-block ${!isComplete ? 'streaming' : ''}`}>
      <div className="code-header">
        <span className="code-lang">{language || 'text'}</span>
        <div className="code-actions visible">
          <button onClick={copyToClipboard} title="复制" className={`action-btn ${copied ? 'success' : ''}`}>
            {copied ? '✓' : '📋'}
          </button>
          <button onClick={insertToEditor} title="插入" className={`action-btn ${inserted ? 'success' : ''}`}>
            {inserted ? '✓' : '📥'}
          </button>
          {isComplete && <button onClick={saveToFile} title="保存" className="action-btn">💾</button>}
        </div>
      </div>
      <pre>
        <code className={`language-${language}`}>{cleanedCode}</code>
        {!isComplete && <span className="cursor-blink">▋</span>}
      </pre>
    </div>
  );
}

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

// 简洁的用户消息
function UserMessageContent({ content }: { content: string }) {
  const cleaned = useMemo(() => cleanUserMessage(content), [content]);
  const codeMatch = cleaned.match(/```(\w+)?\n([\s\S]*?)```/);
  const textPart = cleaned.replace(/```[\s\S]*?```/g, '').trim();
  
  // 短消息直接显示
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
}

export default function MessageList({ 
  messages, isLoading, onRegenerate, currentDiagram, onViewDiagram, messageRefs
}: MessageListProps) {
  
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, []);

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
        <div 
          key={message.id} 
          className={`message message-${message.role}`}
          ref={(el) => setMessageRef(message.id, el)}
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
                isStreaming={isLoading && index === processedMessages.length - 1}
                codeChanges={message.codeChanges}
              />
            )}
          </div>

          {message.role === 'assistant' && index === processedMessages.length - 1 && !isLoading && (
            <div className="message-actions">
              <button onClick={() => copyToClipboard(message.content)} title="复制">📋</button>
              <button onClick={onRegenerate} title="重新生成">🔄</button>
              {currentDiagram && onViewDiagram && (
                <button onClick={onViewDiagram} title="查看图表">📊</button>
              )}
            </div>
          )}
        </div>
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
