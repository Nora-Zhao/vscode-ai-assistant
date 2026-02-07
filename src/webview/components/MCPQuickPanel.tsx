/**
 * MCP 工具快捷面板
 * 
 * 集成到主Chat界面的轻量级MCP工具选择和Agent控制面板
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { vscode } from '../vscodeApi';

// ============================================
// 类型定义
// ============================================

interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
}

interface MCPToolRegistration {
  tool: MCPTool;
  enabled: boolean;
  source: 'builtin' | 'user' | 'import';
}

interface AgentIteration {
  iteration: number;
  thought: {
    thought: string;
    decision: string;
    toolCalls: Array<{
      id: string;
      toolId: string;
      toolName: string;
      reason: string;
    }>;
  };
  executions: Array<{
    callId: string;
    toolId: string;
    success: boolean;
    duration: number;
  }>;
  observation: string;
}

interface AgentStatus {
  status: 'idle' | 'thinking' | 'executing' | 'reflecting' | 'completed' | 'failed' | 'cancelled';
  currentIteration?: number;
  progress?: number;
  message?: string;
}

// ============================================
// 工具分类图标
// ============================================

const CATEGORY_ICONS: Record<string, string> = {
  file: '📁',
  code: '💻',
  api: '🌐',
  database: '🗄️',
  shell: '⌨️',
  web: '🔗',
  ai: '🤖',
  utility: '🔧',
  custom: '📦',
};

const CATEGORY_NAMES: Record<string, string> = {
  file: '文件操作',
  code: '代码分析',
  api: 'API调用',
  database: '数据库',
  shell: 'Shell命令',
  web: 'Web请求',
  ai: 'AI服务',
  utility: '工具类',
  custom: '自定义',
};

// ============================================
// MCP工具快捷面板组件
// ============================================

interface MCPQuickPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string, params?: Record<string, any>) => void;
  onStartAgent: (task: string) => void;
}

export function MCPQuickPanel({ 
  isOpen, 
  onClose, 
  onSelectTool,
  onStartAgent 
}: MCPQuickPanelProps) {
  const [tools, setTools] = useState<MCPToolRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [agentTask, setAgentTask] = useState('');
  const [activeTab, setActiveTab] = useState<'tools' | 'agent'>('tools');
  const [loading, setLoading] = useState(false);
  
  // 获取工具列表
  useEffect(() => {
    if (isOpen) {
      vscode.postMessage({ type: 'mcp:getTools' });
      setLoading(true);
    }
  }, [isOpen]);
  
  // 监听工具列表响应
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === 'mcp:toolList') {
        setTools(data.tools || []);
        setLoading(false);
      }
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);
  
  // 过滤工具
  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      if (!t.enabled) return false;
      
      const matchesSearch = !searchQuery || 
        t.tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || t.tool.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, selectedCategory]);
  
  // 按类别分组
  const toolsByCategory = useMemo(() => {
    const grouped = new Map<string, MCPToolRegistration[]>();
    
    for (const t of filteredTools) {
      const cat = t.tool.category;
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(t);
    }
    
    return grouped;
  }, [filteredTools]);
  
  // 所有类别
  const categories = useMemo(() => {
    const cats = new Set(tools.filter(t => t.enabled).map(t => t.tool.category));
    return Array.from(cats);
  }, [tools]);
  
  // 处理工具选择
  const handleToolClick = useCallback((tool: MCPTool) => {
    onSelectTool(tool.id);
    onClose();
  }, [onSelectTool, onClose]);
  
  // 处理Agent任务提交
  const handleAgentSubmit = useCallback(() => {
    if (agentTask.trim()) {
      onStartAgent(agentTask.trim());
      setAgentTask('');
      onClose();
    }
  }, [agentTask, onStartAgent, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="mcp-quick-panel">
      <div className="mcp-panel-header">
        <div className="mcp-panel-tabs">
          <button 
            className={`mcp-tab ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            🔧 工具
          </button>
          <button 
            className={`mcp-tab ${activeTab === 'agent' ? 'active' : ''}`}
            onClick={() => setActiveTab('agent')}
          >
            🤖 Agent
          </button>
        </div>
        <button className="mcp-close-btn" onClick={onClose}>×</button>
      </div>
      
      {activeTab === 'tools' ? (
        <div className="mcp-tools-content">
          {/* 搜索框 */}
          <div className="mcp-search">
            <input
              type="text"
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* 类别筛选 */}
          <div className="mcp-categories">
            <button 
              className={`mcp-category-chip ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`mcp-category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              >
                {CATEGORY_ICONS[cat] || '📦'} {CATEGORY_NAMES[cat] || cat}
              </button>
            ))}
          </div>
          
          {/* 工具列表 */}
          <div className="mcp-tools-list">
            {loading ? (
              <div className="mcp-loading">加载中...</div>
            ) : filteredTools.length === 0 ? (
              <div className="mcp-empty">
                {searchQuery ? '没有匹配的工具' : '没有可用工具'}
              </div>
            ) : (
              Array.from(toolsByCategory.entries()).map(([category, categoryTools]) => (
                <div key={category} className="mcp-category-group">
                  <div className="mcp-category-title">
                    {CATEGORY_ICONS[category] || '📦'} {CATEGORY_NAMES[category] || category}
                    <span className="mcp-category-count">{categoryTools.length}</span>
                  </div>
                  {categoryTools.map(t => (
                    <div 
                      key={t.tool.id}
                      className="mcp-tool-item"
                      onClick={() => handleToolClick(t.tool)}
                    >
                      <div className="mcp-tool-info">
                        <span className="mcp-tool-name">{t.tool.name}</span>
                        <span className="mcp-tool-id">@mcp:{t.tool.id}</span>
                      </div>
                      <div className="mcp-tool-desc">{t.tool.description}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          
          {/* 快捷提示 */}
          <div className="mcp-tips">
            💡 提示: 在聊天框输入 <code>@mcp:list</code> 查看所有工具
          </div>
        </div>
      ) : (
        <div className="mcp-agent-content">
          <div className="mcp-agent-desc">
            <h4>🤖 自主Agent模式</h4>
            <p>描述你的任务，Agent会自动规划并执行多个工具调用直到完成。</p>
          </div>
          
          <div className="mcp-agent-input">
            <textarea
              placeholder="例如：分析当前项目的代码结构，找出所有TODO注释，并生成一份报告"
              value={agentTask}
              onChange={e => setAgentTask(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="mcp-agent-actions">
            <button 
              className="mcp-agent-submit"
              onClick={handleAgentSubmit}
              disabled={!agentTask.trim()}
            >
              🚀 开始执行
            </button>
          </div>
          
          <div className="mcp-agent-examples">
            <div className="mcp-examples-title">示例任务：</div>
            <div className="mcp-example-list">
              {[
                '查找所有包含TODO的文件并列出内容',
                '分析项目依赖并检查是否有安全漏洞',
                '找到所有未使用的导出函数',
                '生成当前文件的单元测试',
              ].map((example, i) => (
                <button 
                  key={i}
                  className="mcp-example-item"
                  onClick={() => setAgentTask(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Agent执行状态面板
// ============================================

interface AgentStatusPanelProps {
  status: AgentStatus;
  iterations: AgentIteration[];
  onCancel: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AgentStatusPanel({
  status,
  iterations,
  onCancel,
  isExpanded,
  onToggle,
}: AgentStatusPanelProps) {
  if (status.status === 'idle') return null;
  
  const isRunning = ['thinking', 'executing', 'reflecting'].includes(status.status);
  
  return (
    <div className={`agent-status-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="agent-status-header" onClick={onToggle}>
        <div className="agent-status-info">
          <span className={`agent-status-indicator ${status.status}`} />
          <span className="agent-status-text">
            {getStatusText(status.status)}
            {status.currentIteration && ` (第${status.currentIteration}轮)`}
          </span>
        </div>
        
        <div className="agent-status-actions">
          {isRunning && (
            <button className="agent-cancel-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
              ⏹ 停止
            </button>
          )}
          <span className="agent-expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="agent-status-content">
          {/* 进度条 */}
          {isRunning && status.progress !== undefined && (
            <div className="agent-progress">
              <div className="agent-progress-bar" style={{ width: `${status.progress}%` }} />
              <span className="agent-progress-text">{status.message}</span>
            </div>
          )}
          
          {/* 迭代记录 */}
          <div className="agent-iterations">
            {iterations.map((iter, index) => (
              <div key={index} className="agent-iteration">
                <div className="iteration-header">
                  <span className="iteration-number">第 {iter.iteration} 轮</span>
                  <span className={`iteration-decision ${iter.thought.decision}`}>
                    {iter.thought.decision === 'complete' ? '✓ 完成' : 
                     iter.thought.decision === 'continue' ? '➤ 继续' : '❓ 待确认'}
                  </span>
                </div>
                
                <div className="iteration-thought">
                  💭 {iter.thought.thought}
                </div>
                
                {iter.thought.toolCalls.length > 0 && (
                  <div className="iteration-calls">
                    {iter.thought.toolCalls.map((call, ci) => {
                      const exec = iter.executions.find(e => e.callId === call.id);
                      return (
                        <div key={ci} className={`tool-call ${exec?.success ? 'success' : 'failed'}`}>
                          <span className="call-icon">{exec?.success ? '✓' : '✗'}</span>
                          <span className="call-tool">{call.toolName}</span>
                          {exec && <span className="call-duration">{exec.duration}ms</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="iteration-observation">
                  👁 {iter.observation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    idle: '空闲',
    thinking: '思考中...',
    executing: '执行工具中...',
    reflecting: '分析结果中...',
    completed: '已完成',
    failed: '执行失败',
    cancelled: '已取消',
  };
  return texts[status] || status;
}

// ============================================
// MCP工具快捷按钮
// ============================================

interface MCPQuickButtonProps {
  onClick: () => void;
  hasActiveAgent: boolean;
}

export function MCPQuickButton({ onClick, hasActiveAgent }: MCPQuickButtonProps) {
  return (
    <button 
      className={`mcp-quick-button ${hasActiveAgent ? 'active' : ''}`}
      onClick={onClick}
      title="MCP工具"
    >
      🔧 MCP
      {hasActiveAgent && <span className="mcp-active-indicator" />}
    </button>
  );
}

// ============================================
// 导出样式
// ============================================

export const MCPPanelStyles = `
/* MCP快捷面板样式 */
.mcp-quick-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  max-height: 400px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.mcp-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.mcp-panel-tabs {
  display: flex;
  gap: 4px;
}

.mcp-tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
}

.mcp-tab.active {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.mcp-close-btn {
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.7;
}

.mcp-close-btn:hover {
  opacity: 1;
}

.mcp-tools-content, .mcp-agent-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.mcp-search input {
  width: 100%;
  padding: 8px 12px;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  color: var(--vscode-input-foreground);
  font-size: 13px;
}

.mcp-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.mcp-category-chip {
  padding: 4px 10px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  border: none;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
}

.mcp-category-chip.active {
  opacity: 1;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.mcp-tools-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mcp-category-group {
  margin-bottom: 12px;
}

.mcp-category-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mcp-category-count {
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.mcp-tool-item {
  padding: 10px 12px;
  background: var(--vscode-list-hoverBackground);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.mcp-tool-item:hover {
  background: var(--vscode-list-activeSelectionBackground);
}

.mcp-tool-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mcp-tool-name {
  font-weight: 500;
  color: var(--vscode-foreground);
}

.mcp-tool-id {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  font-family: monospace;
}

.mcp-tool-desc {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
}

.mcp-tips {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  border-top: 1px solid var(--vscode-panel-border);
  margin-top: 8px;
}

.mcp-tips code {
  background: var(--vscode-textCodeBlock-background);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

/* Agent内容 */
.mcp-agent-desc {
  margin-bottom: 16px;
}

.mcp-agent-desc h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.mcp-agent-desc p {
  margin: 0;
  font-size: 13px;
  color: var(--vscode-descriptionForeground);
}

.mcp-agent-input textarea {
  width: 100%;
  padding: 12px;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  color: var(--vscode-input-foreground);
  font-size: 13px;
  resize: none;
  font-family: inherit;
}

.mcp-agent-actions {
  margin: 12px 0;
}

.mcp-agent-submit {
  width: 100%;
  padding: 10px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.mcp-agent-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mcp-agent-examples {
  border-top: 1px solid var(--vscode-panel-border);
  padding-top: 12px;
}

.mcp-examples-title {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 8px;
}

.mcp-example-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mcp-example-item {
  padding: 8px 12px;
  background: var(--vscode-textCodeBlock-background);
  border: none;
  border-radius: 4px;
  color: var(--vscode-foreground);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  opacity: 0.8;
}

.mcp-example-item:hover {
  opacity: 1;
}

/* Agent状态面板 */
.agent-status-panel {
  border-top: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
}

.agent-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
}

.agent-status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vscode-descriptionForeground);
}

.agent-status-indicator.thinking,
.agent-status-indicator.executing,
.agent-status-indicator.reflecting {
  background: var(--vscode-charts-yellow);
  animation: pulse 1s infinite;
}

.agent-status-indicator.completed {
  background: var(--vscode-charts-green);
}

.agent-status-indicator.failed {
  background: var(--vscode-charts-red);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.agent-cancel-btn {
  padding: 4px 8px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
}

.agent-status-content {
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.agent-progress {
  margin-bottom: 12px;
  position: relative;
  height: 24px;
  background: var(--vscode-progressBar-background);
  border-radius: 4px;
  overflow: hidden;
}

.agent-progress-bar {
  height: 100%;
  background: var(--vscode-button-background);
  transition: width 0.3s;
}

.agent-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: var(--vscode-foreground);
}

.agent-iterations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-iteration {
  padding: 12px;
  background: var(--vscode-list-hoverBackground);
  border-radius: 6px;
}

.iteration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.iteration-number {
  font-weight: 600;
  font-size: 12px;
}

.iteration-decision {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--vscode-badge-background);
}

.iteration-decision.complete {
  background: var(--vscode-charts-green);
  color: white;
}

.iteration-thought,
.iteration-observation {
  font-size: 12px;
  color: var(--vscode-foreground);
  margin: 6px 0;
  line-height: 1.5;
}

.iteration-calls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.tool-call {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--vscode-textCodeBlock-background);
  border-radius: 4px;
  font-size: 11px;
}

.tool-call.success .call-icon {
  color: var(--vscode-charts-green);
}

.tool-call.failed .call-icon {
  color: var(--vscode-charts-red);
}

.call-duration {
  color: var(--vscode-descriptionForeground);
  margin-left: 4px;
}

/* MCP快捷按钮 */
.mcp-quick-button {
  padding: 6px 12px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.mcp-quick-button.active {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.mcp-active-indicator {
  width: 6px;
  height: 6px;
  background: var(--vscode-charts-yellow);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.mcp-loading, .mcp-empty {
  text-align: center;
  padding: 24px;
  color: var(--vscode-descriptionForeground);
}
`;

export default MCPQuickPanel;
