import React, { useRef, useState, useEffect, useCallback } from 'react';
import { vscode } from '../vscodeApi';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  onCancel: () => void;
  onFileUpload: (file: File, type: string) => void;
  onVoiceInput: (transcript: string) => void;
  isLoading: boolean;
  placeholder: string;
}

const SUPPORTED_FILE_TYPES = {
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
  document: [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/markdown', 'application/json', 'text/html', 'text/xml'
  ],
};

function getFileTypeByExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
  const docExts = ['pdf', 'doc', 'docx', 'csv', 'xls', 'xlsx', 'txt', 'md', 'json', 'html', 'xml'];
  
  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  return 'unknown';
}

const FILE_ACCEPT = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp',
  '.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx', '.txt', '.md', '.json'
].join(',');

export default function InputBox({
  value, onChange, onKeyDown, onSend, onCancel,
  onFileUpload, onVoiceInput, isLoading, placeholder,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // 初始化语音识别（延迟初始化，在第一次点击时）
  const initVoiceRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return null;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      const systemLang = navigator.language || 'zh-CN';
      recognition.lang = systemLang.startsWith('zh') ? 'zh-CN' : 
                        systemLang.startsWith('en') ? 'en-US' :
                        systemLang.startsWith('ja') ? 'ja-JP' :
                        systemLang.startsWith('ko') ? 'ko-KR' :
                        systemLang;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          onVoiceInput(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        stopRecording();
        
        // VS Code webview 中语音API通常会报 not-allowed 或 service-not-allowed
        if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
          setVoiceError('vs-code-limited');
          setShowVoiceHelp(true);
        } else if (event.error === 'network') {
          setVoiceError('network');
        } else if (event.error === 'no-speech') {
          setVoiceError('no-speech');
        } else {
          setVoiceError(event.error);
          setShowVoiceHelp(true);
        }
      };

      recognition.onend = () => {
        if (isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            stopRecording();
          }
        }
      };

      return recognition;
    } catch (e) {
      console.error('初始化语音识别失败:', e);
      return null;
    }
  }, [onVoiceInput, stopRecording, isRecording]);

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // 切换录音
  const toggleVoice = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // 首次使用时初始化
    if (!recognitionRef.current) {
      recognitionRef.current = initVoiceRecognition();
    }

    if (!recognitionRef.current) {
      setShowVoiceHelp(true);
      setVoiceError('not-supported');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setVoiceError(null);
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err: any) {
      console.error('启动录音失败:', err);
      setShowVoiceHelp(true);
      setVoiceError('start-failed');
    }
  }, [isRecording, stopRecording, initVoiceRecognition]);

  // 文件处理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let fileType = 'unknown';
      if (SUPPORTED_FILE_TYPES.image.includes(file.type)) {
        fileType = 'image';
      } else if (SUPPORTED_FILE_TYPES.document.includes(file.type)) {
        fileType = 'document';
      } else {
        fileType = getFileTypeByExtension(file.name);
      }

      if (fileType !== 'unknown') {
        onFileUpload(file, fileType);
      } else {
        vscode.postMessage({
          type: 'showError',
          message: `不支持的文件类型: ${file.name}`
        });
      }
    });
    e.target.value = '';
  }, [onFileUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          onFileUpload(file, 'image');
          return;
        }
      }
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
      let fileType = 'unknown';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (SUPPORTED_FILE_TYPES.document.includes(file.type)) {
        fileType = 'document';
      } else {
        fileType = getFileTypeByExtension(file.name);
      }

      if (fileType !== 'unknown') {
        onFileUpload(file, fileType);
      }
    });
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`input-box ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="input-actions-left">
        <button
          className="action-btn file-btn"
          onClick={() => fileInputRef.current?.click()}
          title="上传文件"
          type="button"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_ACCEPT}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
        />
        
        {/* 语音输入按钮 - 始终显示 */}
        <button
          className={`action-btn voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleVoice}
          title="语音输入"
          type="button"
        >
          {isRecording ? (
            <>
              <span className="recording-indicator">🔴</span>
              <span className="recording-time">{formatTime(recordingTime)}</span>
            </>
          ) : '🎤'}
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={handlePaste}
        placeholder={
          isDragging ? "拖放文件到此处..." :
          isRecording ? "正在录音..." : 
          isLoading ? "输入新消息可中断当前生成..." : 
          placeholder
        }
        rows={1}
        disabled={isRecording}
      />

      <div className="input-actions-right">
        {isLoading ? (
          <button 
            className="action-btn cancel-btn" 
            onClick={onCancel} 
            title="取消 (ESC)"
            type="button"
          >
            ⏹️
          </button>
        ) : (
          <button
            className="action-btn send-btn"
            onClick={onSend}
            disabled={!value.trim() && !isRecording}
            title="发送 (Enter)"
            type="button"
          >
            ➤
          </button>
        )}
      </div>
      
      {isDragging && (
        <div className="drag-overlay">
          <span>📥 释放以上传文件</span>
        </div>
      )}

      {/* 语音输入帮助弹窗 */}
      {showVoiceHelp && (
        <div className="voice-help-overlay" onClick={() => setShowVoiceHelp(false)}>
          <div className="voice-help-modal" onClick={e => e.stopPropagation()}>
            <div className="voice-help-header">
              <h3>🎤 语音输入</h3>
              <button onClick={() => setShowVoiceHelp(false)}>×</button>
            </div>
            <div className="voice-help-content">
              {voiceError === 'vs-code-limited' || voiceError === 'not-supported' || voiceError === 'start-failed' ? (
                <>
                  <p className="voice-help-notice">
                    VS Code 扩展中的语音识别功能受限，请使用<strong>系统语音输入</strong>：
                  </p>
                  <div className="voice-help-options">
                    <div className="voice-option">
                      <span className="os-icon">🪟</span>
                      <div className="os-info">
                        <strong>Windows</strong>
                        <kbd>Win + H</kbd>
                        <span className="hint">打开语音输入面板</span>
                      </div>
                    </div>
                    <div className="voice-option">
                      <span className="os-icon">🍎</span>
                      <div className="os-info">
                        <strong>macOS</strong>
                        <kbd>Fn Fn</kbd> 或 <kbd>⌃⌘Space</kbd>
                        <span className="hint">启用听写功能</span>
                      </div>
                    </div>
                  </div>
                  <p className="voice-help-tip">
                    💡 先点击输入框使其获得焦点，再按快捷键即可语音输入
                  </p>
                </>
              ) : voiceError === 'network' ? (
                <p className="voice-help-error">网络连接失败，语音识别需要联网</p>
              ) : voiceError === 'no-speech' ? (
                <p className="voice-help-error">未检测到语音，请靠近麦克风说话</p>
              ) : (
                <p className="voice-help-error">语音识别出错: {voiceError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
