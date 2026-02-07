import React, { useState, useEffect } from 'react';
import { ModelConfig, Provider } from '../../types/shared';
import { vscode } from '../vscodeApi';

interface SettingsPanelProps {
  config: ModelConfig;
  onClose: () => void;
}

interface SavedKeyStatus {
  [key: string]: {
    saved: boolean;
    preview: string;
  };
}

export default function SettingsPanel({ config, onClose }: SettingsPanelProps) {
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>({
    deepseek: '',
    openai: '',
    anthropic: '',
    kimi: '',
    openrouter: '',
  });
  
  const [savedKeys, setSavedKeys] = useState<SavedKeyStatus>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  // 请求已保存的API Key状态
  useEffect(() => {
    vscode.postMessage({ type: 'getApiKeyStatus' });
    
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === 'apiKeyStatus') {
        setSavedKeys(data.status || {});
      } else if (data.type === 'apiKeySaved') {
        setSaveStatus(prev => ({ ...prev, [data.provider]: 'saved' }));
        setSavedKeys(prev => ({
          ...prev,
          [data.provider]: { saved: true, preview: data.preview || '' }
        }));
        // 清空输入
        setApiKeys(prev => ({ ...prev, [data.provider]: '' }));
        // 3秒后重置状态
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [data.provider]: 'idle' }));
        }, 3000);
      } else if (data.type === 'apiKeySaveError') {
        setSaveStatus(prev => ({ ...prev, [data.provider]: 'error' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [data.provider]: 'idle' }));
        }, 3000);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleApiKeyChange = (provider: Provider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const saveApiKey = (provider: Provider) => {
    const key = apiKeys[provider].trim();
    if (key) {
      setSaveStatus(prev => ({ ...prev, [provider]: 'saving' }));
      vscode.postMessage({
        type: 'setApiKey',
        provider,
        apiKey: key,
      });
    }
  };

  const getPlaceholder = (provider: Provider) => {
    const status = savedKeys[provider];
    if (status?.saved && status.preview) {
      return `${status.preview}••••••••`;
    }
    return 'sk-... (未配置)';
  };

  const getButtonText = (provider: Provider) => {
    const status = saveStatus[provider];
    if (status === 'saving') return '保存中...';
    if (status === 'saved') return '✓ 已保存';
    if (status === 'error') return '✗ 失败';
    return savedKeys[provider]?.saved ? '更新' : '保存';
  };

  const getButtonClass = (provider: Provider) => {
    const status = saveStatus[provider];
    if (status === 'saved') return 'save-btn saved';
    if (status === 'error') return 'save-btn error';
    return 'save-btn';
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>设置</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h4>API Keys</h4>
          <p className="settings-hint">API keys 安全存储在 VS Code 的密钥存储中。</p>

          {(['deepseek', 'openai', 'anthropic', 'kimi', 'openrouter'] as Provider[]).map((provider) => (
            <div key={provider} className="api-key-row">
              <div className="api-key-label">
                <label>{provider.charAt(0).toUpperCase() + provider.slice(1)}</label>
                {savedKeys[provider]?.saved && (
                  <span className="saved-indicator">✓ 已配置</span>
                )}
              </div>
              <div className="api-key-input">
                <input
                  type="password"
                  value={apiKeys[provider]}
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={getPlaceholder(provider)}
                />
                <button 
                  className={getButtonClass(provider)}
                  onClick={() => saveApiKey(provider)} 
                  disabled={!apiKeys[provider].trim() || saveStatus[provider] === 'saving'}
                >
                  {getButtonText(provider)}
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="settings-section">
          <h4>当前配置</h4>
          <div className="config-info">
            <div className="config-row">
              <span>供应商:</span>
              <span>{config.provider}</span>
            </div>
            <div className="config-row">
              <span>模型:</span>
              <span>{config.model}</span>
            </div>
            <div className="config-row">
              <span>Temperature:</span>
              <span>{config.temperature}</span>
            </div>
            <div className="config-row">
              <span>Max Tokens:</span>
              <span>{config.maxTokens}</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h4>快捷键</h4>
          <div className="shortcuts-list">
            <div className="shortcut-row">
              <kbd>Enter</kbd>
              <span>发送消息</span>
            </div>
            <div className="shortcut-row">
              <kbd>Shift + Enter</kbd>
              <span>换行</span>
            </div>
            <div className="shortcut-row">
              <kbd>↑ / ↓</kbd>
              <span>历史记录</span>
            </div>
            <div className="shortcut-row">
              <kbd>Tab</kbd>
              <span>命令补全</span>
            </div>
            <div className="shortcut-row">
              <kbd>ESC</kbd>
              <span>停止任务</span>
            </div>
            <div className="shortcut-row">
              <kbd>/</kbd>
              <span>打开命令</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
