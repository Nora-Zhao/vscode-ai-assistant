import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Message, Provider } from '../../types/shared';

interface TokenStatsProps {
  messages: Message[];
  provider: Provider;
  model: string;
}

// Token 使用记录
interface TokenUsageRecord {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  cost: number; // USD
}

// 历史统计数据
interface UsageHistory {
  records: TokenUsageRecord[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

// Token 估算函数
function estimateTokens(text: string): number {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

// 各模型价格配置 (美元/1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
  
  // OpenAI
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  
  // Kimi
  'moonshot-v1-8k': { input: 0.17, output: 0.17 },
  'moonshot-v1-32k': { input: 0.34, output: 0.34 },
  'moonshot-v1-128k': { input: 0.85, output: 0.85 },
};

// 获取模型价格
function getModelPricing(model: string): { input: number; output: number } {
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }
  
  const modelLower = model.toLowerCase();
  for (const [key, value] of Object.entries(MODEL_PRICING)) {
    if (modelLower.includes(key.toLowerCase()) || key.toLowerCase().includes(modelLower)) {
      return value;
    }
  }
  
  return { input: 0.14, output: 0.28 };
}

// 格式化价格
function formatPrice(price: number): string {
  if (price < 0.0001) return '$0.0000';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

// 格式化 CNY 价格
function formatCNY(usd: number): string {
  const cny = usd * 7.25;
  if (cny < 0.0001) return '¥0.00';
  if (cny < 0.01) return `¥${cny.toFixed(4)}`;
  if (cny < 1) return `¥${cny.toFixed(2)}`;
  return `¥${cny.toFixed(2)}`;
}

// 获取今天的日期字符串
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 本地存储键
const STORAGE_KEY = 'ai-assistant-token-usage';

// 获取历史数据
function getUsageHistory(): UsageHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load usage history:', e);
  }
  return {
    records: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  };
}

// 保存历史数据
function saveUsageHistory(history: UsageHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save usage history:', e);
  }
}

export default function TokenStats({ messages, provider, model }: TokenStatsProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'session' | 'today' | 'all'>('session');
  const [history, setHistory] = useState<UsageHistory>(getUsageHistory);
  const lastRecordedRef = useRef({ input: 0, output: 0 });

  // 计算当前会话统计
  const sessionStats = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    
    for (const msg of messages) {
      const tokens = estimateTokens(msg.content);
      if (msg.role === 'user') {
        inputTokens += tokens;
      } else if (msg.role === 'assistant') {
        outputTokens += tokens;
      }
    }
    
    const pricing = getModelPricing(model);
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost,
      pricing
    };
  }, [messages, model]);

  // 记录使用量到历史
  useEffect(() => {
    const { inputTokens, outputTokens, pricing } = sessionStats;
    const deltaInput = inputTokens - lastRecordedRef.current.input;
    const deltaOutput = outputTokens - lastRecordedRef.current.output;
    
    if (deltaInput > 0 || deltaOutput > 0) {
      lastRecordedRef.current = { input: inputTokens, output: outputTokens };
      const deltaCost = (deltaInput / 1_000_000) * pricing.input + (deltaOutput / 1_000_000) * pricing.output;

      setHistory(prev => {
        const today = getTodayString();
        const records = [...prev.records];
        const todayIndex = records.findIndex(r => r.date === today);
        
        if (todayIndex >= 0) {
          records[todayIndex] = {
            ...records[todayIndex],
            inputTokens: records[todayIndex].inputTokens + deltaInput,
            outputTokens: records[todayIndex].outputTokens + deltaOutput,
            cost: records[todayIndex].cost + deltaCost,
          };
        } else {
          records.push({
            date: today,
            inputTokens: deltaInput,
            outputTokens: deltaOutput,
            cost: deltaCost,
          });
        }

        // 只保留最近30天的记录
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filtered = records.filter(r => new Date(r.date) >= thirtyDaysAgo);

        const newHistory = {
          records: filtered,
          totalInputTokens: prev.totalInputTokens + deltaInput,
          totalOutputTokens: prev.totalOutputTokens + deltaOutput,
          totalCost: prev.totalCost + deltaCost,
        };
        
        saveUsageHistory(newHistory);
        return newHistory;
      });
    }
  }, [sessionStats]);

  // 今日统计
  const todayStats = useMemo(() => {
    const today = getTodayString();
    const todayRecord = history.records.find(r => r.date === today);
    return {
      inputTokens: todayRecord?.inputTokens || 0,
      outputTokens: todayRecord?.outputTokens || 0,
      totalTokens: (todayRecord?.inputTokens || 0) + (todayRecord?.outputTokens || 0),
      cost: todayRecord?.cost || 0,
    };
  }, [history]);

  // 清除历史数据
  const clearHistory = useCallback(() => {
    if (confirm('确定要清除所有历史统计数据吗？')) {
      const emptyHistory: UsageHistory = {
        records: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
      };
      setHistory(emptyHistory);
      saveUsageHistory(emptyHistory);
    }
  }, []);

  return (
    <div className="token-stats-container">
      {/* 紧凑的费用显示 */}
      <button 
        className="token-stats-compact"
        onClick={() => setShowPanel(!showPanel)}
        title={`Token: ${sessionStats.totalTokens.toLocaleString()} | 点击查看详情`}
      >
        <span className="token-cost">{formatCNY(sessionStats.totalCost)}</span>
      </button>

      {/* 统计面板 */}
      {showPanel && (
        <div className="token-stats-panel">
          <div className="panel-header">
            <h3>💰 Token 使用统计</h3>
            <button className="close-btn" onClick={() => setShowPanel(false)}>×</button>
          </div>

          {/* 标签页 */}
          <div className="panel-tabs">
            <button 
              className={activeTab === 'session' ? 'active' : ''} 
              onClick={() => setActiveTab('session')}
            >
              当前会话
            </button>
            <button 
              className={activeTab === 'today' ? 'active' : ''} 
              onClick={() => setActiveTab('today')}
            >
              今日统计
            </button>
            <button 
              className={activeTab === 'all' ? 'active' : ''} 
              onClick={() => setActiveTab('all')}
            >
              历史累计
            </button>
          </div>

          {/* 当前会话统计 */}
          {activeTab === 'session' && (
            <div className="stats-content">
              <div className="stats-model">
                <span className="label">当前模型:</span>
                <span className="value">{model}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">输入</span>
                  <span className="stat-value">{sessionStats.inputTokens.toLocaleString()}</span>
                  <span className="stat-cost">{formatPrice(sessionStats.inputCost)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">输出</span>
                  <span className="stat-value">{sessionStats.outputTokens.toLocaleString()}</span>
                  <span className="stat-cost">{formatPrice(sessionStats.outputCost)}</span>
                </div>
                <div className="stat-item total">
                  <span className="stat-label">合计</span>
                  <span className="stat-value">{sessionStats.totalTokens.toLocaleString()}</span>
                  <span className="stat-cost">{formatPrice(sessionStats.totalCost)}</span>
                </div>
              </div>

              <div className="stats-summary">
                <div className="summary-row">
                  <span>费用 (CNY)</span>
                  <span className="highlight cny">{formatCNY(sessionStats.totalCost)}</span>
                </div>
              </div>

              <div className="pricing-info">
                <p>💡 价格: ${sessionStats.pricing.input}/1M入, ${sessionStats.pricing.output}/1M出</p>
              </div>
            </div>
          )}

          {/* 今日统计 */}
          {activeTab === 'today' && (
            <div className="stats-content">
              <div className="stats-date">
                <span className="label">📅 日期:</span>
                <span className="value">{getTodayString()}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">输入</span>
                  <span className="stat-value">{todayStats.inputTokens.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">输出</span>
                  <span className="stat-value">{todayStats.outputTokens.toLocaleString()}</span>
                </div>
                <div className="stat-item total">
                  <span className="stat-label">合计</span>
                  <span className="stat-value">{todayStats.totalTokens.toLocaleString()}</span>
                </div>
              </div>

              <div className="stats-summary">
                <div className="summary-row">
                  <span>今日费用 (USD)</span>
                  <span className="highlight">{formatPrice(todayStats.cost)}</span>
                </div>
                <div className="summary-row">
                  <span>今日费用 (CNY)</span>
                  <span className="highlight cny">{formatCNY(todayStats.cost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 历史累计 */}
          {activeTab === 'all' && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">总输入</span>
                  <span className="stat-value">{history.totalInputTokens.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">总输出</span>
                  <span className="stat-value">{history.totalOutputTokens.toLocaleString()}</span>
                </div>
                <div className="stat-item total">
                  <span className="stat-label">总计</span>
                  <span className="stat-value">{(history.totalInputTokens + history.totalOutputTokens).toLocaleString()}</span>
                </div>
              </div>

              <div className="stats-summary">
                <div className="summary-row">
                  <span>累计费用 (USD)</span>
                  <span className="highlight">{formatPrice(history.totalCost)}</span>
                </div>
                <div className="summary-row">
                  <span>累计费用 (CNY)</span>
                  <span className="highlight cny">{formatCNY(history.totalCost)}</span>
                </div>
              </div>

              {history.records.length > 0 && (
                <div className="recent-records">
                  <h4>📊 最近记录</h4>
                  <div className="records-list">
                    {history.records.slice(-7).reverse().map(record => (
                      <div key={record.date} className="record-item">
                        <span className="record-date">{record.date}</span>
                        <span className="record-tokens">{(record.inputTokens + record.outputTokens).toLocaleString()}</span>
                        <span className="record-cost">{formatCNY(record.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="clear-history-btn" onClick={clearHistory}>
                🗑️ 清除历史
              </button>
            </div>
          )}

          <div className="panel-footer">
            <p>* Token 为估算值 | 汇率: 1 USD = 7.25 CNY</p>
          </div>
        </div>
      )}
    </div>
  );
}
