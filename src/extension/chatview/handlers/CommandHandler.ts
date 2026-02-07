import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChatViewContext, MessageHandler } from '../types';
import { Message, generateId } from '../../../types/shared';
import { ParsedCommand } from '../../commands/CommandParser';
import { MCPRegistry, MCPExecutor } from '../../mcp';

/**
 * 命令处理器
 * 处理斜杠命令（/clear, /init, /run 等）
 * 大部分命令已迁移到MCP工具系统
 */
export class CommandHandler implements MessageHandler {
  private registry: MCPRegistry;
  private executor: MCPExecutor;
  
  constructor(private ctx: ChatViewContext) {
    // 初始化MCP组件
    this.registry = MCPRegistry.getInstance(ctx.extensionContext);
    this.executor = MCPExecutor.getInstance(ctx.extensionContext, this.registry);
  }

  async handle(data: any): Promise<boolean> {
    // 这个handler主要通过executeCommand方法被调用
    // 消息类型的处理在其他handler中
    return false;
  }

  /**
   * 执行命令 - 大部分命令已迁移到MCP
   */
  async executeCommand(parsed: ParsedCommand, diagramHandler: any, testHandler: any, sessionHandler: any): Promise<void> {
    const { command, args } = parsed;
    
    // 不在chatbox中显示用户消息的命令列表
    const silentCommands = ['clear', 'diagram', 'gentest'];
    
    // 先在对话框中显示用户输入的命令
    let userMessageId: string | null = null;
    if (!silentCommands.includes(command)) {
      const commandText = `/${command}${args.length > 0 ? ' ' + args.join(' ') : ''}`;
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: commandText,
        timestamp: Date.now(),
      };
      userMessageId = userMessage.id;
      await this.ctx.sessionManager.addMessage(userMessage);
      this.ctx.postMessage({ type: 'addMessage', message: userMessage });
    }

    // 辅助函数：移除用户消息
    const removeUserMessage = async () => {
      if (userMessageId) {
        await this.ctx.sessionManager.removeLastMessage();
        this.ctx.postMessage({ type: 'removeMessage', messageId: userMessageId });
      }
    };

    try {
      switch (command) {
        // 保留的基础命令
        case 'clear':
          await sessionHandler.clearChat();
          break;
        case 'compact':
          await this.compactContext();
          break;
        case 'resume':
          await sessionHandler.showSessionPicker();
          break;
          
        // 迁移到MCP的命令 - 使用MCP执行
        case 'init':
          await this.executeMCPTool('builtin_init_project', {});
          break;
        case 'help':
          await this.executeMCPTool('builtin_help', {});
          break;
        case 'file':
          if (args[0]) {
            await this.executeMCPTool('builtin_read_file', { filePath: args[0] });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请指定文件路径' });
          }
          break;
        case 'search':
          if (args.length) {
            await this.executeMCPTool('builtin_search_code', { query: args.join(' ') });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请输入搜索关键词' });
          }
          break;
        case 'run':
          if (args.length) {
            await this.executeMCPTool('builtin_run_command', { command: args.join(' ') });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请输入要执行的命令' });
          }
          break;
        case 'build':
          await this.executeMCPTool('builtin_build', {});
          break;
        case 'test':
          await this.executeMCPTool('builtin_run_test', {});
          break;
          
        // Git 命令
        case 'git':
          if (args.length) {
            await this.executeMCPTool('builtin_run_command', { command: `git ${args.join(' ')}` });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请输入git命令参数' });
          }
          break;
        case 'gst':
          await this.executeMCPTool('builtin_git_status', {});
          break;
        case 'gpl':
          await this.executeMCPTool('builtin_git_pull', {});
          break;
        case 'gps':
          await this.executeMCPTool('builtin_git_push', {});
          break;
        case 'gco':
          if (args[0]) {
            await this.executeMCPTool('builtin_git_checkout', { branch: args[0] });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请指定分支名' });
          }
          break;
        case 'gcm':
          if (args.length) {
            await this.executeMCPTool('builtin_git_commit', { message: args.join(' ') });
          } else {
            await removeUserMessage();
            this.ctx.postMessage({ type: 'error', message: '请输入提交信息' });
          }
          break;
        case 'gdf':
          await this.executeMCPTool('builtin_git_diff', { file: args[0] || undefined });
          break;
        case 'glg':
          await this.executeMCPTool('builtin_git_log', { count: 15 });
          break;
          
        // 图表和测试生成 - 保留原有逻辑，因为需要AI配合
        case 'diagram':
          this.ctx.postMessage({ type: 'clearInput' });
          await this.handleDiagramCommand(args, diagramHandler);
          break;
        case 'gentest':
          this.ctx.postMessage({ type: 'clearInput' });
          const fullArgs = args.join(' ');
          if (fullArgs.startsWith('code:') || fullArgs.includes('```')) {
            await testHandler.generateFromCode(fullArgs);
          } else {
            await testHandler.generateTest(args[0]);
          }
          break;
          
        default:
          await removeUserMessage();
          this.ctx.postMessage({
            type: 'addMessage',
            message: {
              id: generateId(),
              role: 'assistant',
              content: `❌ 未知命令: \`/${command}\`\n\n输入 \`/help\` 查看所有可用命令，或使用 \`@mcp:list\` 查看可用MCP工具。`,
              timestamp: Date.now(),
            }
          });
          break;
      }
    } catch (error) {
      await removeUserMessage();
      this.ctx.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : '命令执行失败',
      });
    }
  }

  /**
   * 执行MCP工具
   */
  private async executeMCPTool(toolId: string, params: Record<string, any>): Promise<void> {
    const registration = this.registry.getTool(toolId);
    
    if (!registration) {
      this.ctx.postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ MCP工具 \`${toolId}\` 未找到`,
          timestamp: Date.now(),
        }
      });
      return;
    }
    
    this.ctx.updateTaskStatus('command', 'running', `执行: ${registration.tool.name}`);
    
    try {
      const result = await this.executor.execute({
        toolId,
        arguments: params,
        caller: 'user',
        context: {
          workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
          activeFile: vscode.window.activeTextEditor?.document.fileName,
        },
      });
      
      // 格式化输出结果
      let content: string;
      if (result.success) {
        const data = result.data;
        
        // 特殊处理不同类型的结果
        if (typeof data === 'string') {
          content = data;
        } else if (data?.content) {
          // help命令等返回content字段
          content = data.content;
        } else if (data?.stdout !== undefined || data?.stderr !== undefined) {
          // 命令执行结果
          const success = data.success !== false && data.exitCode !== 1;
          const output = [data.stdout, data.stderr].filter(Boolean).join('\n');
          content = `${success ? '✅' : '❌'} **${registration.tool.name}**\n\n\`\`\`\n${output || '(无输出)'}\n\`\`\``;
        } else if (data?.log !== undefined) {
          // git log结果
          content = `📜 **Git日志**\n\n\`\`\`\n${data.log || '(无日志)'}\n\`\`\``;
        } else if (data?.diff !== undefined) {
          // git diff结果
          content = `📝 **Git差异**\n\n\`\`\`diff\n${data.diff || '(无差异)'}\n\`\`\``;
        } else if (data?.type) {
          // 项目分析结果
          content = `✅ **项目分析完成**\n\n`;
          content += `**项目类型:** ${data.type}\n`;
          if (data.framework) content += `**框架:** ${data.framework}\n`;
          if (data.language) content += `**语言:** ${data.language}\n`;
          if (data.structure) {
            const structureStr = JSON.stringify(data.structure, null, 2).slice(0, 2000);
            content += `\n**目录结构:**\n\`\`\`\n${structureStr}\n\`\`\``;
          }
        } else {
          // 默认JSON格式化
          const dataStr = JSON.stringify(data, null, 2);
          content = `✅ **${registration.tool.name}**\n\n\`\`\`json\n${dataStr.slice(0, 5000)}${dataStr.length > 5000 ? '\n...(已截断)' : ''}\n\`\`\``;
        }
      } else {
        content = `❌ **${registration.tool.name}** 执行失败\n\n${result.error?.message || '未知错误'}`;
      }
      
      this.ctx.postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        }
      });
      
      this.ctx.updateTaskStatus('command', result.success ? 'success' : 'error', 
        result.success ? '完成' : '失败');
      
    } catch (error) {
      this.ctx.postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: `❌ 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: Date.now(),
        }
      });
      this.ctx.updateTaskStatus('command', 'error', '执行失败');
    }
  }

  /**
   * 处理图表命令
   */
  private async handleDiagramCommand(args: string[], diagramHandler: any): Promise<void> {
    if (args[0]) {
      const diagramType = args[0].toLowerCase();
      
      if (diagramType === 'file') {
        await diagramHandler.generateFromFile(args[1]);
      } else if (diagramType === 'project') {
        await diagramHandler.generateFromProject();
      } else if (['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'mindmap', 'architecture'].includes(diagramType)) {
        const editor = vscode.window.activeTextEditor;
        if (editor && !editor.selection.isEmpty) {
          await diagramHandler.generateFromSelection(diagramType);
        } else if (editor) {
          await diagramHandler.generateFromFile(undefined, diagramType);
        } else {
          if (['architecture', 'mindmap'].includes(diagramType)) {
            await diagramHandler.generateFromProject();
          } else {
            this.ctx.postMessage({ 
              type: 'addMessage', 
              message: {
                id: generateId(),
                role: 'assistant',
                content: `请先打开一个文件或选中一些代码，然后重试。\n\n或者你可以直接告诉我想要的图表内容，比如："帮我画一个用户登录的流程图"`,
                timestamp: Date.now(),
              }
            });
          }
        }
      } else {
        const description = args.join(' ');
        await diagramHandler.generateFromDescription(description);
      }
    } else {
      const editor = vscode.window.activeTextEditor;
      if (editor && !editor.selection.isEmpty) {
        await diagramHandler.generateFromSelection('flowchart');
      } else if (editor) {
        await diagramHandler.generateFromFile();
      } else {
        await diagramHandler.generateFromProject();
      }
    }
  }

  /**
   * 压缩上下文
   */
  private async compactContext(): Promise<void> {
    const messages = this.ctx.sessionManager.getMessages();
    
    if (messages.length < 5) {
      this.ctx.postMessage({
        type: 'addMessage',
        message: {
          id: generateId(),
          role: 'assistant',
          content: '当前上下文较短，无需压缩。',
          timestamp: Date.now(),
        },
      });
      return;
    }

    // 保留最近的几条消息
    const keepCount = Math.min(4, Math.floor(messages.length / 2));
    const removedCount = messages.length - keepCount;

    // 生成压缩摘要
    const summary = `[已压缩 ${removedCount} 条历史消息]`;
    
    this.ctx.postMessage({
      type: 'addMessage',
      message: {
        id: generateId(),
        role: 'assistant',
        content: `✅ 上下文已压缩\n\n${summary}\n\n保留最近 ${keepCount} 条消息。`,
        timestamp: Date.now(),
      },
    });
  }
}
