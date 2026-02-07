import * as vscode from 'vscode';
import { ChatViewProvider } from './extension/chatview';
import { ConfigManager } from './extension/ConfigManager';
import { SmartCodeEditor, CodeApplier, DiffContentProvider } from './extension/code-editor';
import { getNewFeaturesService, registerNewFeaturesCommands } from './extension/services/NewFeaturesService';
import { MCPPanelProvider } from './extension/mcp';

let chatViewProvider: ChatViewProvider;
let mcpPanelProvider: MCPPanelProvider;
let codeApplier: CodeApplier;
let diffProvider: DiffContentProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Code Assistant Lite is now active!');

  // Initialize providers
  chatViewProvider = new ChatViewProvider(context.extensionUri, context);
  mcpPanelProvider = MCPPanelProvider.getInstance(context.extensionUri, context);
  const configManager = new ConfigManager(context);
  codeApplier = new CodeApplier();
  diffProvider = new DiffContentProvider();

  // Initialize SmartCodeEditor (for @mcp and @skill completions)
  SmartCodeEditor.initialize(context);
  console.log('SmartCodeEditor initialized with @mcp and @skill completions');

  // Initialize New Features Service (i18n, Parallel Tasks)
  const newFeaturesService = getNewFeaturesService(context);
  registerNewFeaturesCommands(context, newFeaturesService);
  console.log('New Features Service initialized');

  // Register diff content provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('ai-original', diffProvider),
    vscode.workspace.registerTextDocumentContentProvider('ai-modified', diffProvider)
  );

  // Register webview providers
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider),
    vscode.window.registerWebviewViewProvider(MCPPanelProvider.viewType, mcpPanelProvider)
  );

  // Register commands
  const commands: Array<{ id: string; handler: (...args: any[]) => any }> = [
    // Chat commands
    { id: 'aiAssistant.newChat', handler: () => chatViewProvider.newChat() },
    { id: 'aiAssistant.clearChat', handler: () => chatViewProvider.newChat() },
    { id: 'aiAssistant.stopTask', handler: () => chatViewProvider.stopTask() },
    { id: 'aiAssistant.compactContext', handler: () => vscode.commands.executeCommand('aiAssistant.chatView.focus') },
    
    // Session commands
    { id: 'aiAssistant.continueLastSession', handler: () => chatViewProvider.continueLastSession() },
    { id: 'aiAssistant.resumeSession', handler: () => chatViewProvider.showSessionPicker() },
    
    // ✅ 清空所有历史数据命令
    {
      id: 'aiAssistant.clearAllData',
      handler: async () => {
        const confirm = await vscode.window.showWarningMessage(
          '确定要清空所有历史数据吗？这将删除所有会话记录、图表历史和测试历史，此操作不可撤销。',
          { modal: true },
          '确认清空'
        );
        
        if (confirm === '确认清空') {
          // 清空所有 globalState 中的扩展数据
          const keysToClean = [
            'aiAssistant.sessions',
            'aiAssistant.currentSessionId',
            'diagramHistory',
            'testHistory',
            'aiAssistant.memory.v2',
          ];
          
          for (const key of keysToClean) {
            await context.globalState.update(key, undefined);
          }
          
          // 通知 ChatViewProvider 重置状态
          chatViewProvider.clearAllDataAndReset();
          
          vscode.window.showInformationMessage('已清空所有历史数据');
        }
      },
    },
    
    // Focus command
    { id: 'aiAssistant.focus', handler: () => vscode.commands.executeCommand('aiAssistant.chatView.focus') },
    
    // API Key configuration
    {
      id: 'aiAssistant.setApiKey',
      handler: async () => {
        const providers = ['deepseek', 'openai', 'anthropic', 'kimi', 'openrouter'];
        const selected = await vscode.window.showQuickPick(providers, {
          placeHolder: 'Select AI provider',
        });
        if (!selected) return;

        const apiKey = await vscode.window.showInputBox({
          prompt: `Enter API Key for ${selected}`,
          password: true,
          placeHolder: 'sk-...',
        });
        if (apiKey) {
          await configManager.setApiKey(selected as any, apiKey);
          vscode.window.showInformationMessage(`API Key for ${selected} has been saved`);
        }
      },
    },

    // Model switching
    {
      id: 'aiAssistant.switchModel',
      handler: async () => {
        const allModels = configManager.getAllModels();
        const items: vscode.QuickPickItem[] = [];

        for (const [provider, models] of Object.entries(allModels)) {
          for (const model of models) {
            items.push({
              label: model.name,
              description: provider,
              detail: model.supportVision ? '👁 Supports vision' : undefined,
            });
          }
        }

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a model',
        });

        if (selected) {
          const provider = selected.description as any;
          const models = allModels[provider as keyof typeof allModels];
          const model = models.find((m) => m.name === selected.label);
          if (model) {
            await configManager.updateModelConfig({ provider, model: model.id });
            vscode.window.showInformationMessage(`Switched to ${model.name}`);
          }
        }
      },
    },

    // ==================== 智能代码编辑命令 ====================
    
    // 应用 AI 生成的代码（核心功能）
    {
      id: 'aiAssistant.applyCode',
      handler: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor');
          return;
        }

        // 从剪贴板获取代码
        const clipboardText = await vscode.env.clipboard.readText();
        if (!clipboardText) {
          vscode.window.showWarningMessage('Clipboard is empty');
          return;
        }

        const result = await codeApplier.smartInsert(editor.document, clipboardText);
        if (result.success) {
          vscode.window.showInformationMessage(result.message);
        } else {
          vscode.window.showErrorMessage(result.message);
        }
      },
    },

    // 智能替换选中代码
    {
      id: 'aiAssistant.smartReplace',
      handler: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor');
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
          vscode.window.showWarningMessage('No text selected');
          return;
        }

        const newCode = await vscode.window.showInputBox({
          prompt: 'Enter replacement code or paste from clipboard',
          value: await vscode.env.clipboard.readText(),
        });

        if (newCode) {
          const success = await SmartCodeEditor.replaceText(
            editor.document,
            selectedText,
            newCode,
            { adjustIndent: true }
          );

          if (success) {
            vscode.window.showInformationMessage('Code replaced successfully');
          } else {
            vscode.window.showErrorMessage('Failed to replace code');
          }
        }
      },
    },

    // 在锚点后插入代码
    {
      id: 'aiAssistant.insertAfter',
      handler: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const anchor = await vscode.window.showInputBox({
          prompt: 'Enter the text after which to insert code',
        });
        if (!anchor) return;

        const code = await vscode.env.clipboard.readText();
        if (!code) {
          vscode.window.showWarningMessage('Clipboard is empty');
          return;
        }

        const success = await SmartCodeEditor.insertNearAnchor(
          editor.document,
          anchor,
          code,
          'after',
          { adjustIndent: true }
        );

        if (success) {
          vscode.window.showInformationMessage('Code inserted successfully');
        } else {
          vscode.window.showErrorMessage(`Could not find anchor text: "${anchor}"`);
        }
      },
    },

    // Code actions with AI
    {
      id: 'aiAssistant.explainCode',
      handler: () => sendSelectedCodeWithAction('explain', 'Explain this code in detail:'),
    },
    {
      id: 'aiAssistant.refactorCode',
      handler: () => sendSelectedCodeWithAction('refactor', 'Refactor this code. Use SEARCH/REPLACE format:'),
    },
    {
      id: 'aiAssistant.fixCode',
      handler: () => sendSelectedCodeWithAction('fix', 'Find and fix bugs. Use SEARCH/REPLACE format:'),
    },
    {
      id: 'aiAssistant.addComments',
      handler: () => sendSelectedCodeWithAction('comment', 'Add comments. Use SEARCH/REPLACE format:'),
    },
    {
      id: 'aiAssistant.optimizeCode',
      handler: () => sendSelectedCodeWithAction('optimize', 'Optimize this code. Use SEARCH/REPLACE format:'),
    },
    {
      id: 'aiAssistant.reviewCode',
      handler: () => sendSelectedCodeWithAction('review', 'Review this code for issues and improvements:'),
    },
    {
      id: 'aiAssistant.generateTests',
      handler: () => sendSelectedCodeWithAction('test', 'Generate tests for this code:'),
    },

    // Generate diagram
    {
      id: 'aiAssistant.generateDiagram',
      handler: async () => {
        const editor = vscode.window.activeTextEditor;
        const hasSelection = editor && !editor.selection.isEmpty;
        
        const types: vscode.QuickPickItem[] = [];
        
        if (hasSelection) {
          types.push({ 
            label: '📊 流程图 (Flowchart)', 
            description: '根据选中代码',
            detail: '展示选中代码的执行流程'
          });
          types.push({ 
            label: '⏱️ 时序图 (Sequence)', 
            description: '根据选中代码',
            detail: '展示选中代码中的调用顺序'
          });
          types.push({ 
            label: '🏛️ 类图 (Class Diagram)', 
            description: '根据选中代码',
            detail: '展示选中代码中的类结构'
          });
          types.push({ 
            label: '🔄 状态图 (State Diagram)', 
            description: '根据选中代码',
            detail: '展示选中代码中的状态转换'
          });
        }
        
        if (editor) {
          types.push({ 
            label: '📁 根据当前文件生成', 
            description: editor.document.fileName.split(/[/\\]/).pop(),
            detail: '分析当前打开的文件'
          });
        }
        
        types.push({ 
          label: '🏗️ 根据项目结构生成', 
          description: '架构图',
          detail: '生成项目整体架构图'
        });
        
        types.push({ 
          label: '🔗 ER图 (ER Diagram)', 
          description: '数据库表关系',
          detail: '展示数据库表关系'
        });
        types.push({ 
          label: '📅 甘特图 (Gantt)', 
          description: '项目时间线',
          detail: '展示项目时间线'
        });
        types.push({ 
          label: '🧠 思维导图 (Mind Map)', 
          description: '概念层级',
          detail: '展示概念层级'
        });

        const selected = await vscode.window.showQuickPick(types, {
          placeHolder: hasSelection ? '选择图表类型（将分析选中的代码）' : '选择图表类型',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (!selected) return;
        
        await vscode.commands.executeCommand('aiAssistant.chatView.focus');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const label = selected.label;
        
        if (label.includes('根据当前文件')) {
          chatViewProvider.sendMessage('/diagram file');
        } else if (label.includes('根据项目结构')) {
          chatViewProvider.sendMessage('/diagram project');
        } else if (hasSelection && editor) {
          const selectedText = editor.document.getText(editor.selection);
          const language = editor.document.languageId;
          
          let diagramType = 'flowchart';
          if (label.includes('时序图')) diagramType = 'sequence';
          else if (label.includes('类图')) diagramType = 'class';
          else if (label.includes('状态图')) diagramType = 'state';
          else if (label.includes('ER图')) diagramType = 'er';
          else if (label.includes('甘特图')) diagramType = 'gantt';
          else if (label.includes('思维导图')) diagramType = 'mindmap';
          
          chatViewProvider.sendMessage(`/diagram ${diagramType} code:\n\`\`\`${language}\n${selectedText}\n\`\`\``);
        } else {
          let diagramType = 'flowchart';
          if (label.includes('ER图')) diagramType = 'er';
          else if (label.includes('甘特图')) diagramType = 'gantt';
          else if (label.includes('思维导图')) diagramType = 'mindmap';
          
          const description = await vscode.window.showInputBox({
            prompt: '请输入简单描述',
            placeHolder: '例如：用户登录流程、项目模块关系',
          });
          
          if (description) {
            chatViewProvider.sendMessage(`/diagram ${diagramType} ${description}`);
          }
        }
      },
    },

    // Test generation
    {
      id: 'aiAssistant.generateTestFile',
      handler: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('No active editor');
          return;
        }
        await vscode.commands.executeCommand('aiAssistant.chatView.focus');
      },
    },
    
    // Test generation via MCP tool (triggers actual TestHandler)
    {
      id: 'aiAssistant.triggerTestGeneration',
      handler: async (filePath?: string) => {
        const targetPath = filePath || vscode.window.activeTextEditor?.document.uri.fsPath;
        if (!targetPath) {
          vscode.window.showWarningMessage('请先打开或选择一个文件');
          return;
        }
        await vscode.commands.executeCommand('aiAssistant.chatView.focus');
        // 通过 sendMessage 触发 /gentest 命令
        chatViewProvider.sendMessage(`/gentest ${targetPath}`);
      },
    },

    // Open settings
    {
      id: 'aiAssistant.openSettings',
      handler: () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'aiAssistant');
      },
    },

    // ==================== MCP相关命令 ====================
    
    // 打开MCP工具管理面板
    {
      id: 'aiAssistant.openMcpPanel',
      handler: async () => {
        try {
          await vscode.commands.executeCommand('aiAssistant.mcpPanel.focus');
        } catch (error) {
          vscode.window.showInformationMessage(
            '请在侧边栏AI Assistant中查看MCP工具面板'
          );
        }
      },
    },
    
    // MCP工具快速执行
    {
      id: 'aiAssistant.mcpExecute',
      handler: async () => {
        const { MCPRegistry } = await import('./extension/mcp');
        const registry = MCPRegistry.getInstance(context);
        const tools = registry.getEnabledTools();
        
        if (tools.length === 0) {
          vscode.window.showWarningMessage('没有可用的MCP工具');
          return;
        }
        
        const items = tools.map(t => ({
          label: `$(tools) ${t.tool.name}`,
          description: `@mcp:${t.tool.id}`,
          detail: t.tool.description,
          toolId: t.tool.id,
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: '选择要执行的MCP工具',
          matchOnDescription: true,
          matchOnDetail: true,
        });
        
        if (selected) {
          await vscode.commands.executeCommand('aiAssistant.chatView.focus');
          await new Promise(resolve => setTimeout(resolve, 200));
          chatViewProvider.sendMessage(`@mcp:${(selected as any).toolId}`);
        }
      },
    },
    
    // MCP Agent模式
    {
      id: 'aiAssistant.mcpAgent',
      handler: async () => {
        const task = await vscode.window.showInputBox({
          prompt: '描述你想让AI Agent完成的任务',
          placeHolder: '例如：分析当前项目的代码结构并生成文档',
          ignoreFocusOut: true,
        });
        
        if (task) {
          await vscode.commands.executeCommand('aiAssistant.chatView.focus');
          await new Promise(resolve => setTimeout(resolve, 200));
          chatViewProvider.sendMessage(`@mcp:agent ${task}`);
        }
      },
    },
  ];

  // Register all commands
  for (const cmd of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(cmd.id, cmd.handler));
  }

  // Helper function to send selected code with action type
  async function sendSelectedCodeWithAction(action: string, prompt: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('请先打开一个文件并选择代码');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
      vscode.window.showWarningMessage('请先选择需要处理的代码');
      return;
    }

    const language = editor.document.languageId;
    const filePath = editor.document.uri.fsPath;
    const fileName = filePath.split(/[/\\]/).pop() || '';
    
    const actionLabels: Record<string, string> = {
      'explain': '解释代码',
      'fix': '修复代码',
      'optimize': '优化代码',
      'comment': '添加注释',
      'review': '代码审查',
      'refactor': '重构代码',
      'test': '生成测试',
      'clearAllData': '清空所有数据',
    };
    
    const displayLabel = actionLabels[action] || action;
    
    const systemContext = {
      action,
      prompt,
      fileName,
      language,
      code: selectedText,
      useSearchReplace: !['explain', 'test', 'review', 'clearAllData'].includes(action),
    };

    await vscode.commands.executeCommand('aiAssistant.chatView.focus');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    chatViewProvider.sendMessageWithContext(displayLabel, systemContext);
    
    vscode.window.showInformationMessage(`正在${displayLabel}...`);
  }

  // Handle -c and -r command line arguments
  const args = process.argv;
  if (args.includes('-c') || args.includes('--continue')) {
    chatViewProvider.continueLastSession();
  } else if (args.includes('-r') || args.includes('--resume')) {
    chatViewProvider.showSessionPicker();
  }

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(comment-discussion) AI';
  statusBarItem.tooltip = 'AI Code Assistant Lite';
  statusBarItem.command = 'aiAssistant.focus';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // 注册代码动作提供程序（右键菜单）
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: '**/*' },
      new AICodeActionProvider(),
      { providedCodeActionKinds: AICodeActionProvider.providedCodeActionKinds }
    )
  );
}

/**
 * AI 代码动作提供程序
 * 在编辑器右键菜单中添加 AI 相关操作
 */
class AICodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.Empty,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {
    if (range.isEmpty) return [];

    const actions: vscode.CodeAction[] = [];

    // AI Fix
    const fixAction = new vscode.CodeAction('🤖 AI Fix', vscode.CodeActionKind.QuickFix);
    fixAction.command = { command: 'aiAssistant.fixCode', title: 'AI Fix' };
    actions.push(fixAction);

    // AI Refactor
    const refactorAction = new vscode.CodeAction('🤖 AI Refactor', vscode.CodeActionKind.Refactor);
    refactorAction.command = { command: 'aiAssistant.refactorCode', title: 'AI Refactor' };
    actions.push(refactorAction);

    // AI Explain
    const explainAction = new vscode.CodeAction('🤖 AI Explain', vscode.CodeActionKind.Empty);
    explainAction.command = { command: 'aiAssistant.explainCode', title: 'AI Explain' };
    actions.push(explainAction);

    // AI Add Comments
    const commentAction = new vscode.CodeAction('🤖 AI Add Comments', vscode.CodeActionKind.Refactor);
    commentAction.command = { command: 'aiAssistant.addComments', title: 'AI Add Comments' };
    actions.push(commentAction);

    // AI clear Comments
    const clearAction = new vscode.CodeAction('🤖 AI Clear All Data', vscode.CodeActionKind.Refactor);
    clearAction.command = { command: 'aiAssistant.clearAllData', title: 'AI Clear All Data' };
    actions.push(clearAction);

    return actions;
  }
}

export function deactivate() {
  // Clean up SmartCodeEditor resources
  SmartCodeEditor.dispose();
  console.log('AI Code Assistant Lite deactivated');
}
