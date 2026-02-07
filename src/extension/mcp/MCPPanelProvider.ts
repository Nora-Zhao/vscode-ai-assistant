/**
 * MCP工具管理面板Provider
 * 
 * 提供一个独立的WebView面板用于管理MCP工具：
 * - 注册新工具
 * - 编辑现有工具
 * - 测试工具
 * - 导入/导出工具
 */

import * as vscode from 'vscode';
import { MCPRegistry } from './MCPRegistry';
import { MCPExecutor } from './MCPExecutor';
import { MCPToolDefinition, MCPToolRegistration, MCPConfig } from './types';

export class MCPPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiAssistant.mcpPanel';
  
  private static instance: MCPPanelProvider | null = null;
  private _view?: vscode.WebviewView;
  private _registry: MCPRegistry;
  private _executor: MCPExecutor;
  
  private constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._registry = MCPRegistry.getInstance(_context);
    this._executor = MCPExecutor.getInstance(_context, this._registry);
    
    // 监听工具变化
    this._registry.onToolsChanged(() => {
      this._sendToolsToWebview();
    });
  }
  
  static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ): MCPPanelProvider {
    if (!MCPPanelProvider.instance) {
      MCPPanelProvider.instance = new MCPPanelProvider(extensionUri, context);
    }
    return MCPPanelProvider.instance;
  }
  
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    
    webviewView.title = 'MCP工具管理';
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    // 处理来自WebView的消息
    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this._handleMessage(data);
    });
    
    // 初始发送工具列表
    setTimeout(() => this._sendToolsToWebview(), 100);
  }
  
  /**
   * 处理WebView消息
   */
  private async _handleMessage(data: any): Promise<void> {
    switch (data.type) {
      case 'getTools':
        this._sendToolsToWebview();
        break;
        
      case 'getConfig':
        this._sendConfig();
        break;
        
      case 'registerTool':
        await this._registerTool(data.tool);
        break;
        
      case 'updateTool':
        await this._updateTool(data.tool);
        break;
        
      case 'deleteTool':
        await this._deleteTool(data.toolId);
        break;
        
      case 'toggleTool':
        await this._toggleTool(data.toolId, data.enabled);
        break;
        
      case 'testTool':
        await this._testTool(data.toolId, data.params);
        break;
        
      case 'updateConfig':
        await this._updateConfig(data.config);
        break;
        
      case 'importTools':
        await this._importTools(data.data);
        break;
        
      case 'exportTools':
        this._exportTools(data.toolIds);
        break;
        
      case 'getToolTemplate':
        this._sendToolTemplate(data.executionType);
        break;
    }
  }
  
  /**
   * 发送工具列表到WebView
   */
  private _sendToolsToWebview(): void {
    if (!this._view) return;
    
    const tools = this._registry.getAllTools();
    this._view.webview.postMessage({
      type: 'toolList',
      tools,
    });
  }
  
  /**
   * 发送配置到WebView
   */
  private _sendConfig(): void {
    if (!this._view) return;
    
    const config = this._registry.getConfig();
    this._view.webview.postMessage({
      type: 'config',
      config,
    });
  }
  
  /**
   * 注册工具
   */
  private async _registerTool(tool: MCPToolDefinition): Promise<void> {
    const result = await this._registry.registerTool(tool, 'user');
    
    this._view?.webview.postMessage({
      type: 'registerResult',
      ...result,
      toolId: tool.id,
    });
    
    if (result.success) {
      vscode.window.showInformationMessage(`MCP工具 "${tool.name}" 已成功注册`);
    } else {
      vscode.window.showErrorMessage(`注册失败: ${result.error}`);
    }
  }
  
  /**
   * 更新工具
   */
  private async _updateTool(tool: MCPToolDefinition): Promise<void> {
    const result = await this._registry.updateTool(tool);
    
    this._view?.webview.postMessage({
      type: 'updateResult',
      ...result,
      toolId: tool.id,
    });
    
    if (result.success) {
      vscode.window.showInformationMessage(`MCP工具 "${tool.name}" 已更新`);
    }
  }
  
  /**
   * 删除工具
   */
  private async _deleteTool(toolId: string): Promise<void> {
    // 获取工具信息用于显示
    const tool = this._registry.getTool(toolId);
    const toolName = tool?.tool.name || toolId;
    
    // 使用VSCode API显示确认对话框
    const answer = await vscode.window.showWarningMessage(
      `确定要删除工具 "${toolName}" 吗？此操作不可撤销。`,
      { modal: true },
      '确认删除'
    );
    
    // 如果用户没有点击"确认删除"，则取消操作
    if (answer !== '确认删除') {
      this._view?.webview.postMessage({
        type: 'deleteResult',
        success: false,
        cancelled: true,
        toolId,
      });
      return;
    }
    
    const result = await this._registry.deleteTool(toolId);
    
    this._view?.webview.postMessage({
      type: 'deleteResult',
      ...result,
      toolId,
    });
    
    if (result.success) {
      vscode.window.showInformationMessage('MCP工具已删除');
    } else {
      vscode.window.showErrorMessage(`删除失败: ${result.error}`);
    }
  }
  
  /**
   * 切换工具启用状态
   */
  private async _toggleTool(toolId: string, enabled: boolean): Promise<void> {
    const result = await this._registry.toggleTool(toolId, enabled);
    
    this._view?.webview.postMessage({
      type: 'toggleResult',
      ...result,
      toolId,
      enabled,
    });
  }
  
  /**
   * 测试工具
   */
  private async _testTool(toolId: string, params: Record<string, any>): Promise<void> {
    await this._registry.updateToolStatus(toolId, 'testing');
    
    this._view?.webview.postMessage({
      type: 'testStart',
      toolId,
    });
    
    const result = await this._executor.execute({
      toolId,
      arguments: params,
      caller: 'user',
      requestId: `test_${Date.now()}`,
    });
    
    await this._registry.updateToolStatus(toolId, result.success ? 'active' : 'error');
    
    this._view?.webview.postMessage({
      type: 'testResult',
      toolId,
      result,
    });
  }
  
  /**
   * 更新配置
   */
  private async _updateConfig(config: Partial<MCPConfig>): Promise<void> {
    await this._registry.updateConfig(config);
    
    this._view?.webview.postMessage({
      type: 'configUpdated',
      config: this._registry.getConfig(),
    });
    
    vscode.window.showInformationMessage('MCP配置已更新');
  }
  
  /**
   * 导入工具
   */
  private async _importTools(data: string): Promise<void> {
    const result = await this._registry.importTools(data);
    
    this._view?.webview.postMessage({
      type: 'importResult',
      ...result,
    });
    
    if (result.success) {
      vscode.window.showInformationMessage(`成功导入 ${result.imported} 个工具`);
    } else if (result.imported > 0) {
      vscode.window.showWarningMessage(
        `导入完成: ${result.imported} 个成功, ${result.errors.length} 个失败`
      );
    } else {
      vscode.window.showErrorMessage(`导入失败: ${result.errors.join(', ')}`);
    }
  }
  
  /**
   * 导出工具
   */
  private _exportTools(toolIds?: string[]): void {
    const data = this._registry.exportTools(toolIds);
    
    this._view?.webview.postMessage({
      type: 'exportData',
      data,
    });
  }
  
  /**
   * 发送工具模板
   */
  private _sendToolTemplate(executionType: string): void {
    const templates: Record<string, Partial<MCPToolDefinition>> = {
      http: {
        id: 'my_http_tool',
        name: 'My HTTP Tool',
        description: 'Description of what this tool does',
        version: '1.0.0',
        category: 'api',
        parameters: [
          {
            name: 'param1',
            type: 'string',
            description: 'First parameter',
            required: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'API response',
        },
        execution: {
          type: 'http',
          http: {
            url: 'https://api.example.com/endpoint',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            bodyTemplate: '{"param1": "{{param1}}"}',
            responseMapping: {
              resultPath: 'data',
              successCondition: 'data.status === 200',
            },
            timeout: 30000,
            auth: {
              type: 'bearer',
              tokenEnvVar: 'API_TOKEN',
            },
          },
        },
        metadata: {
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        aiHints: {
          whenToUse: 'When you need to...',
          priority: 50,
        },
        security: {
          requireConfirmation: false,
          allowedCallers: ['user', 'agent'],
        },
      },
      command: {
        id: 'my_command_tool',
        name: 'My Command Tool',
        description: 'Execute a shell command',
        version: '1.0.0',
        category: 'shell',
        parameters: [
          {
            name: 'args',
            type: 'string',
            description: 'Command arguments',
            required: false,
          },
        ],
        returns: {
          type: 'object',
          description: 'Command output',
        },
        execution: {
          type: 'command',
          command: {
            command: 'echo {{args}}',
            timeout: 30000,
            requireConfirmation: true,
          },
        },
        metadata: {
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        security: {
          requireConfirmation: true,
          allowedCallers: ['user'],
        },
      },
      script: {
        id: 'my_script_tool',
        name: 'My Script Tool',
        description: 'Execute a JavaScript script',
        version: '1.0.0',
        category: 'utility',
        parameters: [
          {
            name: 'input',
            type: 'string',
            description: 'Input data',
            required: true,
          },
        ],
        returns: {
          type: 'object',
          description: 'Script result',
        },
        execution: {
          type: 'script',
          script: {
            language: 'javascript',
            code: `
// Your JavaScript code here
const { input } = args;
return { processed: input.toUpperCase() };
            `.trim(),
            timeout: 10000,
          },
        },
        metadata: {
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        security: {
          allowedCallers: ['user', 'agent'],
        },
      },
    };
    
    this._view?.webview.postMessage({
      type: 'toolTemplate',
      template: templates[executionType] || templates.http,
      executionType,
    });
  }
  
  /**
   * 生成WebView HTML
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>MCP工具管理</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 12px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .header h2 {
      font-size: 14px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
    }
    
    button {
      padding: 6px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    
    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    button.danger {
      background-color: var(--vscode-errorForeground);
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .tab {
      padding: 8px 16px;
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    
    .tab.active {
      border-bottom-color: var(--vscode-focusBorder);
      color: var(--vscode-textLink-foreground);
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .tool-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .tool-card {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
    }
    
    .tool-card.disabled {
      opacity: 0.6;
    }
    
    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .tool-info h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .tool-id {
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    
    .tool-badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .badge {
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 10px;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    
    .badge.category {
      background-color: var(--vscode-textLink-foreground);
      color: white;
    }
    
    .badge.builtin {
      background-color: var(--vscode-editorInfo-foreground);
    }
    
    .badge.status-active {
      background-color: var(--vscode-terminal-ansiGreen);
    }
    
    .badge.status-error {
      background-color: var(--vscode-errorForeground);
    }
    
    .badge.status-testing {
      background-color: var(--vscode-editorWarning-foreground);
    }
    
    .tool-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    
    .tool-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .tool-actions button {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    /* 表单样式 */
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
    }
    
    .form-group textarea {
      min-height: 100px;
      font-family: var(--vscode-editor-font-family);
      resize: vertical;
    }
    
    .form-group .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .param-list {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      margin-top: 8px;
    }
    
    .param-item {
      display: grid;
      grid-template-columns: 1fr 100px 2fr auto;
      gap: 8px;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .param-item:last-child {
      border-bottom: none;
    }
    
    .param-item input,
    .param-item select {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .checkbox-group input[type="checkbox"] {
      width: auto;
    }
    
    /* 测试面板 */
    .test-panel {
      margin-top: 12px;
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    
    .test-result {
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      max-height: 200px;
      overflow: auto;
    }
    
    .test-result.success {
      background-color: rgba(0, 200, 0, 0.1);
      border: 1px solid var(--vscode-terminal-ansiGreen);
    }
    
    .test-result.error {
      background-color: rgba(200, 0, 0, 0.1);
      border: 1px solid var(--vscode-errorForeground);
    }
    
    /* JSON编辑器 */
    .json-editor {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      min-height: 300px;
    }
    
    /* 空状态 */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .empty-state p {
      margin-bottom: 16px;
    }
    
    /* 搜索 */
    .search-box {
      margin-bottom: 12px;
    }
    
    .search-box input {
      width: 100%;
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }
    
    /* 分类筛选 */
    .filter-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .filter-chip {
      padding: 4px 10px;
      font-size: 11px;
      border-radius: 12px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      cursor: pointer;
    }
    
    .filter-chip.active {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }
    
    /* 导入导出模态框 */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    
    .modal-overlay.active {
      display: flex;
    }
    
    .modal {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
    }
    
    .modal h3 {
      margin-bottom: 16px;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🔧 MCP工具管理</h2>
    <div class="header-actions">
      <button id="btn-import" class="secondary">导入</button>
      <button id="btn-export" class="secondary">导出</button>
      <button id="btn-new-tool">+ 新建工具</button>
    </div>
  </div>
  
  <div class="tabs">
    <button class="tab active" data-tab="list" id="tab-btn-list">工具列表</button>
    <button class="tab" data-tab="create" id="tab-btn-create">创建工具</button>
    <button class="tab" data-tab="config" id="tab-btn-config">设置</button>
  </div>
  
  <!-- 工具列表 -->
  <div id="tab-list" class="tab-content active">
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="搜索工具...">
    </div>
    
    <div class="filter-row" id="filter-row">
      <span class="filter-chip active" data-filter="all">全部</span>
      <span class="filter-chip" data-filter="file">📁 文件</span>
      <span class="filter-chip" data-filter="code">💻 代码</span>
      <span class="filter-chip" data-filter="api">🌐 API</span>
      <span class="filter-chip" data-filter="shell">⌨️ Shell</span>
      <span class="filter-chip" data-filter="web">🔗 Web</span>
      <span class="filter-chip" data-filter="utility">🔧 工具</span>
      <span class="filter-chip" data-filter="custom">📦 自定义</span>
    </div>
    
    <div id="toolList" class="tool-list">
      <div class="empty-state">
        <p>加载中...</p>
      </div>
    </div>
  </div>
  
  <!-- 创建工具 -->
  <div id="tab-create" class="tab-content">
    <div class="form-group">
      <label>执行类型</label>
      <select id="executionType">
        <option value="http">HTTP请求</option>
        <option value="command">命令行</option>
        <option value="script">JavaScript脚本</option>
      </select>
      <div class="hint">选择工具的执行方式</div>
    </div>
    
    <div class="form-group">
      <label>工具定义 (JSON)</label>
      <textarea id="toolJson" class="json-editor" placeholder="工具JSON定义..."></textarea>
      <div class="hint">按照MCP规范定义工具。点击"加载模板"获取示例。</div>
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button id="btn-load-template">加载模板</button>
      <button id="btn-validate">验证</button>
      <button id="btn-register">注册工具</button>
    </div>
    
    <div id="createResult" style="margin-top: 12px;"></div>
  </div>
  
  <!-- 设置 -->
  <div id="tab-config" class="tab-content">
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="configEnabled" checked>
        <label for="configEnabled">启用MCP功能</label>
      </div>
    </div>
    
    <div class="form-group">
      <label>Agent最大工具数</label>
      <input type="number" id="configMaxTools" value="5" min="1" max="20">
      <div class="hint">Agent单次请求最多使用的工具数量</div>
    </div>
    
    <div class="form-group">
      <label>默认超时 (毫秒)</label>
      <input type="number" id="configTimeout" value="30000" min="1000" max="300000">
    </div>
    
    <div class="form-group">
      <div class="checkbox-group">
        <input type="checkbox" id="configLogAll" checked>
        <label for="configLogAll">记录所有执行日志</label>
      </div>
    </div>
    
    <div class="form-group">
      <label>环境变量 (JSON)</label>
      <textarea id="configEnvVars" style="min-height: 80px;">{}</textarea>
      <div class="hint">用于API密钥等敏感信息，格式: {"API_KEY": "your-key"}</div>
    </div>
    
    <button id="btn-save-config">保存设置</button>
  </div>
  
  <!-- 导入模态框 -->
  <div id="importModal" class="modal-overlay">
    <div class="modal">
      <h3>导入工具</h3>
      <div class="form-group">
        <label>工具JSON数据</label>
        <textarea id="importData" class="json-editor" placeholder="粘贴导出的工具JSON..."></textarea>
      </div>
      <div class="modal-actions">
        <button class="secondary" id="btn-cancel-import">取消</button>
        <button id="btn-do-import">导入</button>
      </div>
    </div>
  </div>
  
  <!-- 测试模态框 -->
  <div id="testModal" class="modal-overlay">
    <div class="modal">
      <h3 id="testModalTitle">测试工具</h3>
      <div id="testParamsForm"></div>
      <div id="testResultContainer"></div>
      <div class="modal-actions">
        <button class="secondary" id="btn-close-test">关闭</button>
        <button id="runTestBtn">运行测试</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    
    let allTools = [];
    let currentFilter = 'all';
    let currentTestToolId = null;
    
    console.log('[MCP Panel] Script initializing...');
    
    // DOM加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
      console.log('[MCP Panel] DOM loaded, binding events...');
      initializeEventListeners();
      
      // 延迟请求数据
      setTimeout(function() {
        vscode.postMessage({ type: 'getTools' });
        vscode.postMessage({ type: 'getConfig' });
      }, 100);
    });
    
    // 备用初始化
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(function() {
        initializeEventListeners();
        vscode.postMessage({ type: 'getTools' });
        vscode.postMessage({ type: 'getConfig' });
      }, 50);
    }
    
    // 初始化事件监听器
    function initializeEventListeners() {
      // Tab 按钮事件
      document.getElementById('tab-btn-list')?.addEventListener('click', () => showTab('list'));
      document.getElementById('tab-btn-create')?.addEventListener('click', () => showTab('create'));
      document.getElementById('tab-btn-config')?.addEventListener('click', () => showTab('config'));
      
      // Header 按钮事件
      document.getElementById('btn-import')?.addEventListener('click', showImportModal);
      document.getElementById('btn-export')?.addEventListener('click', exportAllTools);
      document.getElementById('btn-new-tool')?.addEventListener('click', () => showTab('create'));
      
      // 创建工具页面按钮
      document.getElementById('btn-load-template')?.addEventListener('click', loadTemplate);
      document.getElementById('btn-validate')?.addEventListener('click', validateTool);
      document.getElementById('btn-register')?.addEventListener('click', registerTool);
      
      // 执行类型下拉框
      document.getElementById('executionType')?.addEventListener('change', loadTemplate);
      
      // 搜索框
      document.getElementById('searchInput')?.addEventListener('input', filterTools);
      
      // 筛选器
      document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', function() {
          setFilter(this.getAttribute('data-filter'));
        });
      });
      
      // 设置页面保存按钮
      document.getElementById('btn-save-config')?.addEventListener('click', saveConfig);
      
      // 导入模态框按钮
      document.getElementById('btn-cancel-import')?.addEventListener('click', hideImportModal);
      document.getElementById('btn-do-import')?.addEventListener('click', importTools);
      
      // 测试模态框按钮
      document.getElementById('btn-close-test')?.addEventListener('click', hideTestModal);
      document.getElementById('runTestBtn')?.addEventListener('click', runTest);
      
      console.log('[MCP Panel] Event listeners bound');
    }
    
    // 处理来自扩展的消息
    window.addEventListener('message', event => {
      const data = event.data;
      console.log('[MCP Panel] Received message:', data.type);
      
      switch (data.type) {
        case 'toolList':
          allTools = data.tools || [];
          console.log('[MCP Panel] Loaded', allTools.length, 'tools');
          renderTools();
          break;
          
        case 'config':
          loadConfigToForm(data.config);
          break;
          
        case 'toolTemplate':
          const jsonEditor = document.getElementById('toolJson');
          if (jsonEditor) {
            jsonEditor.value = JSON.stringify(data.template, null, 2);
          }
          break;
          
        case 'registerResult':
          showCreateResult(data);
          if (data.success) {
            vscode.postMessage({ type: 'getTools' });
          }
          break;
          
        case 'testStart':
          const startBtn = document.getElementById('runTestBtn');
          if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = '运行中...';
          }
          break;
          
        case 'testResult':
          showTestResult(data.result);
          const endBtn = document.getElementById('runTestBtn');
          if (endBtn) {
            endBtn.disabled = false;
            endBtn.textContent = '运行测试';
          }
          vscode.postMessage({ type: 'getTools' });
          break;
          
        case 'exportData':
          downloadJson(data.data, 'mcp-tools-export.json');
          break;
          
        case 'importResult':
          alert(data.success 
            ? '导入成功: ' + data.imported + ' 个工具'
            : '导入失败: ' + (data.errors || []).join(', '));
          hideImportModal();
          vscode.postMessage({ type: 'getTools' });
          break;
          
        case 'configUpdated':
          loadConfigToForm(data.config);
          break;
      }
    });
    
    // 切换标签 - 使用data-tab属性
    function showTab(tabName) {
      console.log('[MCP Panel] Switching to tab:', tabName);
      
      // 移除所有active状态
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      // 使用data属性找到对应的tab按钮
      const tabButton = document.querySelector('.tab[data-tab="' + tabName + '"]');
      const tabContent = document.getElementById('tab-' + tabName);
      
      if (tabButton) {
        tabButton.classList.add('active');
      }
      
      if (tabContent) {
        tabContent.classList.add('active');
      }
      
      // 如果切换到设置页，请求配置数据
      if (tabName === 'config') {
        vscode.postMessage({ type: 'getConfig' });
      }
      
      // 如果切换到创建页且编辑器为空，加载模板
      if (tabName === 'create') {
        const jsonEditor = document.getElementById('toolJson');
        if (jsonEditor && !jsonEditor.value.trim()) {
          loadTemplate();
        }
      }
    }
    
    // 渲染工具列表
    function renderTools() {
      const container = document.getElementById('toolList');
      const searchQuery = document.getElementById('searchInput').value.toLowerCase();
      
      let filtered = allTools.filter(r => {
        if (currentFilter !== 'all' && r.tool.category !== currentFilter) {
          return false;
        }
        if (searchQuery) {
          const tool = r.tool;
          return tool.name.toLowerCase().includes(searchQuery) ||
                 tool.description.toLowerCase().includes(searchQuery) ||
                 tool.id.toLowerCase().includes(searchQuery);
        }
        return true;
      });
      
      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>没有找到工具</p><button id="btn-create-first" class="primary">创建第一个工具</button></div>';
        // 使用setTimeout确保DOM更新完成后再绑定事件
        setTimeout(function() {
          const btn = document.getElementById('btn-create-first');
          if (btn) {
            btn.onclick = function(e) {
              e.preventDefault();
              console.log('[MCP Panel] Create first tool button clicked');
              showTab('create');
            };
          }
        }, 0);
        return;
      }
      
      container.innerHTML = filtered.map(r => renderToolCard(r)).join('');
      // 绑定工具卡片按钮事件
      bindToolCardEvents();
    }
    
    // 绑定工具卡片按钮事件（使用事件委托）
    function bindToolCardEvents() {
      const container = document.getElementById('toolList');
      if (!container) return;
      
      // 使用事件委托处理工具卡片中的按钮点击
      container.onclick = function(event) {
        // 使用closest找到最近的按钮元素，处理点击按钮内文本的情况
        const target = event.target.closest('button[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        const toolId = target.getAttribute('data-tool-id');
        
        if (!action || !toolId) return;
        
        console.log('[MCP Panel] Tool action:', action, 'toolId:', toolId);
        
        // 阻止事件冒泡
        event.preventDefault();
        event.stopPropagation();
        
        switch (action) {
          case 'test':
            showTestModal(toolId);
            break;
          case 'copy':
            copyToolCommand(toolId);
            break;
          case 'edit':
            editTool(toolId);
            break;
          case 'toggle':
            const enabled = target.getAttribute('data-enabled') === 'true';
            toggleTool(toolId, enabled);
            break;
          case 'delete':
            deleteTool(toolId);
            break;
        }
      };
    }
    
    // 渲染单个工具卡片
    function renderToolCard(registration) {
      const tool = registration.tool;
      const isBuiltin = registration.source === 'builtin';
      const statusClass = 'status-' + (tool.metadata?.status || 'active');
      
      return \`
        <div class="tool-card \${registration.enabled ? '' : 'disabled'}">
          <div class="tool-header">
            <div class="tool-info">
              <h3>\${tool.name}</h3>
              <div class="tool-id">@mcp:\${tool.id}</div>
            </div>
            <div class="tool-badges">
              <span class="badge category">\${getCategoryIcon(tool.category)} \${tool.category}</span>
              \${isBuiltin ? '<span class="badge builtin">内置</span>' : ''}
              <span class="badge \${statusClass}">\${tool.metadata?.status || 'active'}</span>
              <span class="badge">v\${tool.version}</span>
            </div>
          </div>
          <div class="tool-description">\${tool.description}</div>
          <div class="tool-actions">
            <button data-action="test" data-tool-id="\${tool.id}">测试</button>
            <button data-action="copy" data-tool-id="\${tool.id}" class="secondary">复制命令</button>
            \${!isBuiltin ? \`
              <button data-action="edit" data-tool-id="\${tool.id}" class="secondary">编辑</button>
              <button data-action="toggle" data-tool-id="\${tool.id}" data-enabled="\${!registration.enabled}" class="secondary">
                \${registration.enabled ? '禁用' : '启用'}
              </button>
              <button data-action="delete" data-tool-id="\${tool.id}" class="danger">删除</button>
            \` : ''}
          </div>
        </div>
      \`;
    }
    
    function getCategoryIcon(category) {
      const icons = {
        file: '📁', code: '💻', api: '🌐', database: '🗄️',
        shell: '⌨️', web: '🔗', ai: '🤖', utility: '🔧', custom: '📦'
      };
      return icons[category] || '📦';
    }
    
    // 筛选
    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.textContent.toLowerCase().includes(filter) || (filter === 'all' && chip.textContent === '全部'));
      });
      renderTools();
    }
    
    function filterTools() {
      renderTools();
    }
    
    // 加载模板
    function loadTemplate() {
      console.log('[MCP Panel] loadTemplate called');
      const typeSelect = document.getElementById('executionType');
      if (!typeSelect) {
        console.error('[MCP Panel] executionType select not found');
        return;
      }
      const type = typeSelect.value;
      console.log('[MCP Panel] Loading template for type:', type);
      vscode.postMessage({ type: 'getToolTemplate', executionType: type });
    }
    
    // 验证工具
    function validateTool() {
      console.log('[MCP Panel] validateTool called');
      try {
        const jsonEditor = document.getElementById('toolJson');
        if (!jsonEditor) {
          showCreateResult({ success: false, error: '无法找到JSON编辑器' });
          return;
        }
        
        const json = jsonEditor.value;
        if (!json || !json.trim()) {
          showCreateResult({ success: false, error: '请输入工具定义JSON' });
          return;
        }
        
        const tool = JSON.parse(json);
        
        const errors = [];
        if (!tool.id) errors.push('缺少 id');
        if (!tool.name) errors.push('缺少 name');
        if (!tool.description) errors.push('缺少 description');
        if (!tool.version) errors.push('缺少 version');
        if (!tool.execution?.type) errors.push('缺少 execution.type');
        
        if (errors.length > 0) {
          showCreateResult({ success: false, error: errors.join(', ') });
        } else {
          showCreateResult({ success: true, message: '✓ 验证通过！可以注册工具。' });
        }
      } catch (e) {
        showCreateResult({ success: false, error: 'JSON解析失败: ' + e.message });
      }
    }
    
    // 注册工具
    function registerTool() {
      console.log('[MCP Panel] registerTool called');
      try {
        const jsonEditor = document.getElementById('toolJson');
        if (!jsonEditor) {
          showCreateResult({ success: false, error: '无法找到JSON编辑器' });
          return;
        }
        
        const json = jsonEditor.value;
        if (!json || !json.trim()) {
          showCreateResult({ success: false, error: '请输入工具定义JSON' });
          return;
        }
        
        const tool = JSON.parse(json);
        console.log('[MCP Panel] Registering tool:', tool.id);
        
        showCreateResult({ success: true, message: '正在注册工具...' });
        vscode.postMessage({ type: 'registerTool', tool });
      } catch (e) {
        console.error('[MCP Panel] registerTool error:', e);
        showCreateResult({ success: false, error: 'JSON解析失败: ' + e.message });
      }
    }
    
    function showCreateResult(result) {
      const container = document.getElementById('createResult');
      if (!container) return;
      
      if (result.success) {
        container.innerHTML = '<div class="test-result success">' + (result.message || '操作成功！') + '</div>';
      } else {
        container.innerHTML = '<div class="test-result error">错误: ' + (result.error || '未知错误') + '</div>';
      }
    }
    
    // 编辑工具
    function editTool(toolId) {
      console.log('[MCP Panel] editTool called:', toolId);
      const registration = allTools.find(r => r.tool.id === toolId);
      if (registration) {
        const jsonEditor = document.getElementById('toolJson');
        if (jsonEditor) {
          jsonEditor.value = JSON.stringify(registration.tool, null, 2);
        }
        showTab('create');
      }
    }
    
    // 切换启用状态
    function toggleTool(toolId, enabled) {
      console.log('[MCP Panel] toggleTool called:', toolId, enabled);
      vscode.postMessage({ type: 'toggleTool', toolId, enabled });
      // 立即更新UI
      const tool = allTools.find(r => r.tool.id === toolId);
      if (tool) {
        tool.enabled = enabled;
        renderTools();
      }
    }
    
    // 删除工具 - 发送到后端处理确认
    function deleteTool(toolId) {
      console.log('[MCP Panel] Delete tool requested:', toolId);
      // 直接发送到后端，由VSCode API处理确认对话框
      vscode.postMessage({ type: 'deleteTool', toolId });
    }
    
    // 复制命令
    function copyToolCommand(toolId) {
      const text = '@mcp:' + toolId;
      navigator.clipboard.writeText(text);
      // 简单的提示
      alert('已复制: ' + text);
    }
    
    // 测试相关
    function showTestModal(toolId) {
      console.log('[MCP Panel] showTestModal called:', toolId);
      currentTestToolId = toolId;
      const registration = allTools.find(r => r.tool.id === toolId);
      if (!registration) {
        console.error('[MCP Panel] Tool not found:', toolId);
        return;
      }
      
      const tool = registration.tool;
      const titleEl = document.getElementById('testModalTitle');
      if (titleEl) {
        titleEl.textContent = '测试: ' + tool.name;
      }
      
      // 生成参数表单
      const paramsHtml = tool.parameters.map(p => \`
        <div class="form-group">
          <label>\${p.name} \${p.required ? '*' : ''} (\${p.type})</label>
          <input type="text" id="test-param-\${p.name}" placeholder="\${p.description}" value="\${p.default || ''}">
        </div>
      \`).join('');
      
      const paramsForm = document.getElementById('testParamsForm');
      if (paramsForm) {
        paramsForm.innerHTML = paramsHtml || '<p>此工具无需参数</p>';
      }
      
      const resultContainer = document.getElementById('testResultContainer');
      if (resultContainer) {
        resultContainer.innerHTML = '';
      }
      
      const modal = document.getElementById('testModal');
      if (modal) {
        modal.classList.add('active');
      }
    }
    
    function hideTestModal() {
      const modal = document.getElementById('testModal');
      if (modal) {
        modal.classList.remove('active');
      }
      currentTestToolId = null;
    }
    
    function runTest() {
      console.log('[MCP Panel] runTest called, toolId:', currentTestToolId);
      
      if (!currentTestToolId) {
        console.error('[MCP Panel] No tool selected for testing');
        return;
      }
      
      const registration = allTools.find(r => r.tool.id === currentTestToolId);
      if (!registration) {
        console.error('[MCP Panel] Tool not found:', currentTestToolId);
        return;
      }
      
      const params = {};
      registration.tool.parameters.forEach(p => {
        const input = document.getElementById('test-param-' + p.name);
        if (input && input.value) {
          // 尝试解析JSON
          try {
            params[p.name] = JSON.parse(input.value);
          } catch {
            params[p.name] = input.value;
          }
        }
      });
      
      console.log('[MCP Panel] Testing with params:', params);
      
      // 禁用按钮
      const btn = document.getElementById('runTestBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '运行中...';
      }
      
      vscode.postMessage({ type: 'testTool', toolId: currentTestToolId, params });
    }
    
    function showTestResult(result) {
      const container = document.getElementById('testResultContainer');
      if (!container) return;
      
      const className = result.success ? 'success' : 'error';
      const content = result.success 
        ? JSON.stringify(result.data, null, 2)
        : result.error?.message || '执行失败';
      
      container.innerHTML = \`
        <div class="test-result \${className}">
          <strong>\${result.success ? '✓ 成功' : '✗ 失败'}</strong> (耗时: \${result.stats?.duration || 0}ms)
          <pre>\${content}</pre>
        </div>
      \`;
    }
    
    // 导入导出
    function showImportModal() {
      const modal = document.getElementById('importModal');
      if (modal) {
        modal.classList.add('active');
      }
    }
    
    function hideImportModal() {
      const modal = document.getElementById('importModal');
      if (modal) {
        modal.classList.remove('active');
      }
      const importData = document.getElementById('importData');
      if (importData) {
        importData.value = '';
      }
    }
    
    function importTools() {
      const importData = document.getElementById('importData');
      if (!importData) return;
      
      const data = importData.value;
      if (!data.trim()) {
        alert('请输入工具JSON数据');
        return;
      }
      console.log('[MCP Panel] Importing tools...');
      vscode.postMessage({ type: 'importTools', data });
    }
    
    function exportAllTools() {
      console.log('[MCP Panel] Exporting tools...');
      vscode.postMessage({ type: 'exportTools' });
    }
    
    function downloadJson(data, filename) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // 配置
    function loadConfigToForm(config) {
      console.log('[MCP Panel] Loading config to form');
      if (!config) return;
      
      const enabledEl = document.getElementById('configEnabled');
      const maxToolsEl = document.getElementById('configMaxTools');
      const timeoutEl = document.getElementById('configTimeout');
      const logAllEl = document.getElementById('configLogAll');
      const envVarsEl = document.getElementById('configEnvVars');
      
      if (enabledEl) enabledEl.checked = config.enabled !== false;
      if (maxToolsEl) maxToolsEl.value = config.maxToolsPerRequest || 5;
      if (timeoutEl) timeoutEl.value = config.defaultTimeout || 30000;
      if (logAllEl) logAllEl.checked = config.logAllExecutions !== false;
      if (envVarsEl) envVarsEl.value = JSON.stringify(config.envVariables || {}, null, 2);
    }
    
    function saveConfig() {
      console.log('[MCP Panel] saveConfig called');
      try {
        const enabledEl = document.getElementById('configEnabled');
        const maxToolsEl = document.getElementById('configMaxTools');
        const timeoutEl = document.getElementById('configTimeout');
        const logAllEl = document.getElementById('configLogAll');
        const envVarsEl = document.getElementById('configEnvVars');
        
        if (!enabledEl || !maxToolsEl || !timeoutEl) {
          alert('无法找到配置表单元素');
          return;
        }
        
        const config = {
          enabled: enabledEl.checked,
          maxToolsPerRequest: parseInt(maxToolsEl.value) || 5,
          defaultTimeout: parseInt(timeoutEl.value) || 30000,
          logAllExecutions: logAllEl ? logAllEl.checked : true,
          envVariables: JSON.parse(envVarsEl?.value || '{}'),
        };
        
        console.log('[MCP Panel] Saving config:', config);
        vscode.postMessage({ type: 'updateConfig', config });
      } catch (e) {
        console.error('[MCP Panel] saveConfig error:', e);
        alert('配置格式错误: ' + e.message);
      }
    }
    
    // ✅ 修复：将函数暴露到全局作用域，使onclick属性能够访问
    window.showTestModal = showTestModal;
    window.copyToolCommand = copyToolCommand;
    window.editTool = editTool;
    window.toggleTool = toggleTool;
    window.deleteTool = deleteTool;
    window.showTab = showTab;
    window.runTest = runTest;
    window.hideTestModal = hideTestModal;
    window.showImportModal = showImportModal;
    window.hideImportModal = hideImportModal;
    window.importTools = importTools;
    window.exportAllTools = exportAllTools;
    window.loadTemplate = loadTemplate;
    window.validateTool = validateTool;
    window.registerTool = registerTool;
    window.saveConfig = saveConfig;
    window.setFilter = setFilter;
    
    console.log('[MCP Panel] Functions exposed to global scope');
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
