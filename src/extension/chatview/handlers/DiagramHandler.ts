import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChatViewContext, MessageHandler } from '../types';
import { Message, generateId, DiagramType, Diagram } from '../../../types/shared';
import { i18n } from '../../i18n';

/**
 * 图表处理器
 * 处理图表生成、更新、导出等功能
 */
export class DiagramHandler implements MessageHandler {
  constructor(private ctx: ChatViewContext) {}

  async handle(data: any): Promise<boolean> {
    switch (data.type) {
      case 'generateDiagram':
        await this.generateDiagram(data.diagramType, data.description);
        return true;
      case 'updateDiagram':
        await this.updateDiagram(data.diagramId, data.code);
        return true;
      case 'exportDiagram':
        await this.exportDiagram(data.diagramId, data.format);
        return true;
      case 'getDiagramHistory':
        this.sendDiagramHistory();
        return true;
      case 'loadDiagram':
        this.loadDiagram(data.diagramId);
        return true;
      case 'autoFixDiagram':
        await this.autoFixDiagram(data.code, data.error);
        return true;
      case 'renameDiagram':
        this.renameDiagram(data.diagramId, data.newTitle);
        return true;
      default:
        return false;
    }
  }

  /**
   * 生成图表
   */
  async generateDiagram(diagramType: string, description: string): Promise<void> {
    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: 'error',
        message: 'Please configure an API key first',
      });
      return;
    }

    const prompt = this.ctx.diagramGenerator.generatePrompt(diagramType as DiagramType, description);
    let response = '';

    this.ctx.updateTaskStatus('diagram', 'running', '正在生成图表...');

    const diagramRequestId = `diagram-${Date.now()}`;

    await chatService.sendMessage(
      [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const code = this.ctx.diagramGenerator.extractDiagramCode(response);
          if (code) {
            const typeLabels: Record<string, string> = {
              flowchart: '流程图',
              sequence: '时序图',
              class: '类图',
              state: '状态图',
              er: 'ER图',
              gantt: '甘特图',
              pie: '饼图',
              mindmap: '思维导图',
              architecture: '架构图',
            };
            
            const shortDesc = description.length > 20 ? description.slice(0, 20) + '...' : description;
            const title = `${typeLabels[diagramType] || diagramType} - ${shortDesc}`;
            
            const diagram = this.ctx.diagramGenerator.createDiagram(
              diagramType as DiagramType,
              code,
              title
            );
            
            // 保存到历史
            await this.saveDiagramToHistory(diagram);
            
            // 保存图表上下文
            this.ctx.lastGeneratedDiagram = {
              type: diagramType,
              code,
              description,
              timestamp: Date.now(),
            };
            
            this.ctx.postMessage({ type: 'diagramGenerated', diagram });
            this.ctx.updateTaskStatus('diagram', 'success', '图表生成完成');
          } else {
            this.ctx.postMessage({ type: 'error', message: '无法从响应中提取图表代码' });
            this.ctx.updateTaskStatus('diagram', 'error', '提取代码失败');
          }
        },
        onError: (error) => {
          this.ctx.postMessage({ type: 'error', message: error.message });
          this.ctx.updateTaskStatus('diagram', 'error', error.message);
        },
      },
      { maxTokens: 8192, requestId: diagramRequestId }
    );
  }

  /**
   * 从选中代码生成图表
   */
  async generateFromSelection(diagramType: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      this.ctx.postMessage({ type: 'error', message: '请先选中一些代码' });
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const language = editor.document.languageId;
    
    const description = `根据以下${language}代码生成${diagramType}：\n\`\`\`${language}\n${selectedText}\n\`\`\``;
    
    await this.generateDiagram(diagramType, description);
  }

  /**
   * 从文件生成图表
   */
  async generateFromFile(filePath?: string, diagramType?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const targetPath = filePath || editor?.document.uri.fsPath;

    if (!targetPath) {
      this.ctx.postMessage({ type: 'error', message: '请先打开一个文件' });
      return;
    }

    let content: string;
    try {
      content = fs.readFileSync(targetPath, 'utf-8');
    } catch (err) {
      this.ctx.postMessage({ type: 'error', message: `无法读取文件: ${targetPath}` });
      return;
    }

    const language = path.extname(targetPath).slice(1);
    const fileName = path.basename(targetPath);
    const type = diagramType || 'flowchart';
    
    const description = `分析 ${fileName} 文件并生成${type}：\n\`\`\`${language}\n${content.slice(0, 5000)}\n\`\`\``;
    
    await this.generateDiagram(type, description);
  }

  /**
   * 从描述生成图表
   */
  async generateFromDescription(description: string): Promise<void> {
    // 智能检测图表类型
    let diagramType = 'flowchart';
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('序列') || lowerDesc.includes('sequence') || lowerDesc.includes('时序')) {
      diagramType = 'sequence';
    } else if (lowerDesc.includes('类') || lowerDesc.includes('class')) {
      diagramType = 'class';
    } else if (lowerDesc.includes('状态') || lowerDesc.includes('state')) {
      diagramType = 'state';
    } else if (lowerDesc.includes('er') || lowerDesc.includes('数据库') || lowerDesc.includes('表')) {
      diagramType = 'er';
    } else if (lowerDesc.includes('甘特') || lowerDesc.includes('gantt') || lowerDesc.includes('时间线')) {
      diagramType = 'gantt';
    } else if (lowerDesc.includes('思维导图') || lowerDesc.includes('mindmap')) {
      diagramType = 'mindmap';
    } else if (lowerDesc.includes('架构') || lowerDesc.includes('architecture')) {
      diagramType = 'architecture';
    }
    
    await this.generateDiagram(diagramType, description);
  }

  /**
   * 从项目结构生成架构图
   */
  async generateFromProject(): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      this.ctx.postMessage({ type: 'error', message: '请先打开一个工作区' });
      return;
    }

    // 简单的项目结构分析
    const structure = this.analyzeProjectStructure(workspaceRoot);
    const description = `根据以下项目结构生成架构图：\n${structure}`;
    
    await this.generateDiagram('architecture', description);
  }

  /**
   * 更新图表
   */
  async updateDiagram(diagramId: string, code: string): Promise<void> {
    const success = this.ctx.diagramGenerator.updateDiagram(diagramId, code);
    if (success) {
      const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
      if (diagram) {
        this.ctx.postMessage({ type: 'diagramUpdated', diagram });
      }
    } else {
      this.ctx.postMessage({ type: 'error', message: '更新图表失败' });
    }
  }

  /**
   * 导出图表
   */
  async exportDiagram(diagramId: string, format: string): Promise<void> {
    try {
      // 先获取图表对象
      const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
      if (!diagram) {
        throw new Error('图表不存在');
      }
      const result = await this.ctx.diagramGenerator.exportDiagram(diagram, format as any);
      this.ctx.postMessage({ type: 'diagramExported', content: result, format });
    } catch (error) {
      this.ctx.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Export failed' });
    }
  }

  /**
   * 发送图表历史
   */
  sendDiagramHistory(): void {
    const diagrams = this.ctx.diagramGenerator.getAllDiagrams();
    this.ctx.postMessage({ type: 'diagramHistory', diagrams });
  }

  /**
   * 加载图表
   */
  loadDiagram(diagramId: string): void {
    const diagram = this.ctx.diagramGenerator.getDiagram(diagramId);
    if (diagram) {
      this.ctx.postMessage({ type: 'diagramGenerated', diagram });
    }
  }

  /**
   * 自动修复图表
   */
  async autoFixDiagram(code: string, error: string): Promise<void> {
    this.ctx.updateTaskStatus('diagram', 'running', '正在修复图表...');

    const streamingMessageId = generateId();
    let messageAdded = false;

    try {
      const errorMsg = error || '图表渲染失败，请检查 Mermaid 语法';
      
      await this.ctx.autoFixService.fixDiagramStreaming(code, errorMsg, {
        onChunk: (chunk, fullContent) => {
          if (!messageAdded) {
            messageAdded = true;
            this.ctx.postMessage({
              type: 'addMessage',
              message: {
                id: streamingMessageId,
                role: 'assistant',
                content: fullContent,
                timestamp: Date.now(),
              },
              streaming: true,
            });
          } else {
            this.ctx.postMessage({
              type: 'updateMessage',
              messageId: streamingMessageId,
              content: fullContent,
            });
          }
        },
        onComplete: (result) => {
          if (result.success && result.fixedCode) {
            const finalContent = `✅ **图表修复完成**\n\n${result.explanation || ''}\n\n\`\`\`mermaid\n${result.fixedCode}\n\`\`\``;
            
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: finalContent,
              });
            }
            
            this.ctx.postMessage({ type: 'diagramAutoFixed', code: result.fixedCode });
            this.ctx.updateTaskStatus('diagram', 'success', '图表修复完成');
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: `❌ **自动修复失败**\n\n${result.error || '无法解析修复结果'}`,
              });
            }
            this.ctx.updateTaskStatus('diagram', 'error', '修复失败');
          }
        },
        onError: (err) => {
          const errorMessage = err instanceof Error ? err.message : '未知错误';
          if (messageAdded) {
            this.ctx.postMessage({
              type: 'completeMessage',
              messageId: streamingMessageId,
              content: `❌ **自动修复失败**\n\n${errorMessage}`,
            });
          }
          this.ctx.updateTaskStatus('diagram', 'error', errorMessage);
        },
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误';
      this.ctx.updateTaskStatus('diagram', 'error', errorMsg);
    }
  }

  /**
   * 重命名图表
   */
  renameDiagram(diagramId: string, newTitle: string): void {
    const success = this.ctx.diagramGenerator.renameDiagram(diagramId, newTitle);
    if (success) {
      vscode.window.showInformationMessage(`图表已重命名为: ${newTitle}`);
    } else {
      vscode.window.showErrorMessage('重命名失败');
    }
  }

  /**
   * 保存图表到历史记录
   */
  private async saveDiagramToHistory(diagram: Diagram): Promise<void> {
    try {
      const key = 'diagramHistory';
      const existing = this.ctx.extensionContext.globalState.get<Diagram[]>(key, []);
      const updated = [diagram, ...existing.filter(d => d.id !== diagram.id)].slice(0, 20);
      await this.ctx.extensionContext.globalState.update(key, updated);
    } catch (e) {
      console.error('Failed to save diagram history:', e);
    }
  }

  /**
   * 分析项目结构
   */
  private analyzeProjectStructure(root: string, depth = 0, maxDepth = 2): string {
    if (depth > maxDepth) return '';
    
    const items: string[] = [];
    const prefix = '  '.repeat(depth);
    
    try {
      const files = fs.readdirSync(root);
      const filtered = files.filter(f => 
        !f.startsWith('.') && 
        f !== 'node_modules' && 
        f !== '__pycache__' && 
        f !== 'dist' && 
        f !== 'build'
      ).slice(0, 15);
      
      for (const file of filtered) {
        const fullPath = path.join(root, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            items.push(`${prefix}📁 ${file}/`);
            if (depth < maxDepth) {
              const subItems = this.analyzeProjectStructure(fullPath, depth + 1, maxDepth);
              if (subItems) items.push(subItems);
            }
          } else {
            items.push(`${prefix}📄 ${file}`);
          }
        } catch {}
      }
    } catch {}
    
    return items.join('\n');
  }
}
