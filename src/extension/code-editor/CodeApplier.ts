import * as vscode from 'vscode';
import { SmartCodeEditor, EditOperation } from './SmartCodeEditor';

/**
 * 代码变更预览
 */
interface CodeChange {
  filePath: string;
  original: string;
  modified: string;
  operations: EditOperation[];
}

/**
 * 代码应用器
 * 处理 AI 生成的代码并应用到编辑器
 */
export class CodeApplier {
  private pendingChanges: Map<string, CodeChange> = new Map();

  /**
   * 从 AI 响应解析代码变更
   */
  parseCodeChanges(response: string, targetFile?: string): CodeChange[] {
    const changes: CodeChange[] = [];

    // 解析带文件路径的代码块
    // 格式: ```typescript:path/to/file.ts
    const fileCodeBlocks = response.matchAll(
      /```(\w+):([^\n]+)\n([\s\S]*?)```/g
    );

    for (const match of fileCodeBlocks) {
      const [, language, filePath, code] = match;
      changes.push({
        filePath: filePath.trim(),
        original: '',
        modified: code.trim(),
        operations: [{ type: 'replace', oldText: '', newText: code.trim() }],
      });
    }

    // 解析 SEARCH/REPLACE 格式
    const searchReplaceBlocks = response.matchAll(
      /(?:File:\s*([^\n]+)\n)?<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g
    );

    for (const match of searchReplaceBlocks) {
      const [, filePath, oldCode, newCode] = match;
      const path = filePath?.trim() || targetFile || '';
      
      const existing = changes.find(c => c.filePath === path);
      if (existing) {
        existing.operations.push({
          type: 'replace',
          oldText: oldCode,
          newText: newCode,
        });
      } else {
        changes.push({
          filePath: path,
          original: oldCode,
          modified: newCode,
          operations: [{ type: 'replace', oldText: oldCode, newText: newCode }],
        });
      }
    }

    // 如果只有普通代码块且有目标文件
    if (changes.length === 0 && targetFile) {
      const codeBlock = response.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeBlock) {
        changes.push({
          filePath: targetFile,
          original: '',
          modified: codeBlock[1].trim(),
          operations: [],
        });
      }
    }

    return changes;
  }

  /**
   * 显示差异预览
   */
  async showDiffPreview(change: CodeChange): Promise<void> {
    const uri = vscode.Uri.parse(`ai-diff:${change.filePath}`);
    
    // 创建虚拟文档用于显示原始内容
    const originalUri = vscode.Uri.parse(`ai-original:${change.filePath}`);
    const modifiedUri = vscode.Uri.parse(`ai-modified:${change.filePath}`);

    // 使用 VS Code 的 diff 编辑器
    await vscode.commands.executeCommand('vscode.diff', 
      originalUri, 
      modifiedUri,
      `AI Changes: ${change.filePath}`
    );
  }

  /**
   * 应用代码变更到文件
   */
  async applyChanges(
    changes: CodeChange[],
    options: { preview?: boolean; autoSave?: boolean } = {}
  ): Promise<{ success: boolean; applied: number; failed: number; messages: string[] }> {
    const messages: string[] = [];
    let applied = 0;
    let failed = 0;

    for (const change of changes) {
      try {
        // 获取或创建文档
        let document: vscode.TextDocument;
        
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const fullPath = change.filePath.startsWith('/')
          ? change.filePath
          : `${workspaceRoot}/${change.filePath}`;
        
        const uri = vscode.Uri.file(fullPath);

        try {
          document = await vscode.workspace.openTextDocument(uri);
        } catch {
          // 文件不存在，创建新文件
          if (change.modified) {
            await vscode.workspace.fs.writeFile(
              uri,
              Buffer.from(change.modified, 'utf-8')
            );
            messages.push(`Created: ${change.filePath}`);
            applied++;
            continue;
          } else {
            throw new Error(`File not found: ${change.filePath}`);
          }
        }

        // 如果有操作，执行操作
        if (change.operations.length > 0) {
          const result = await SmartCodeEditor.applyEdits(document, change.operations);
          
          if (result.success) {
            messages.push(`Applied ${change.operations.length} changes to ${change.filePath}`);
            applied++;
          } else {
            messages.push(`Failed to apply some changes to ${change.filePath}`);
            failed++;
          }
        } else if (change.modified) {
          // 如果没有操作但有修改后的内容，智能替换整个文件或插入
          const editor = await vscode.window.showTextDocument(document);
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );

          await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, change.modified);
          });

          if (options.autoSave) {
            await document.save();
          }

          messages.push(`Updated: ${change.filePath}`);
          applied++;
        }
      } catch (error) {
        messages.push(`Error: ${change.filePath} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success: failed === 0, applied, failed, messages };
  }

  /**
   * 智能插入代码片段
   * 自动检测最佳插入位置并调整缩进
   */
  async smartInsert(
    document: vscode.TextDocument,
    code: string,
    hint?: string
  ): Promise<{ success: boolean; message: string }> {
    const editor = await vscode.window.showTextDocument(document);
    const selection = editor.selection;

    // 如果有选中内容，替换选中部分
    if (!selection.isEmpty) {
      const indentInfo = SmartCodeEditor.analyzeIndent(document.getText());
      const targetIndent = SmartCodeEditor.getLineIndent(
        document.lineAt(selection.start.line).text,
        indentInfo
      );
      
      const adjustedCode = SmartCodeEditor.adjustIndent(code, targetIndent);
      
      const success = await editor.edit(editBuilder => {
        editBuilder.replace(selection, adjustedCode);
      });

      return {
        success,
        message: success ? 'Code inserted at selection' : 'Failed to insert code',
      };
    }

    // 如果有提示，尝试找到相关位置
    if (hint) {
      const position = SmartCodeEditor.findTextPosition(document, hint);
      if (position) {
        const indentInfo = SmartCodeEditor.analyzeIndent(document.getText());
        const targetIndent = SmartCodeEditor.getLineIndent(
          document.lineAt(position.start.line).text,
          indentInfo
        );
        
        const adjustedCode = SmartCodeEditor.adjustIndent(code, targetIndent);
        const insertPosition = new vscode.Position(position.end.line + 1, 0);

        const success = await editor.edit(editBuilder => {
          editBuilder.insert(insertPosition, adjustedCode + '\n');
        });

        return {
          success,
          message: success ? `Code inserted after "${hint.slice(0, 30)}..."` : 'Failed to insert code',
        };
      }
    }

    // 默认插入到光标位置
    const cursorPosition = selection.active;
    const indentInfo = SmartCodeEditor.analyzeIndent(document.getText());
    const targetIndent = SmartCodeEditor.getLineIndent(
      document.lineAt(cursorPosition.line).text,
      indentInfo
    );
    
    const adjustedCode = SmartCodeEditor.adjustIndent(code, targetIndent);

    const success = await editor.edit(editBuilder => {
      editBuilder.insert(cursorPosition, adjustedCode);
    });

    return {
      success,
      message: success ? 'Code inserted at cursor' : 'Failed to insert code',
    };
  }

  /**
   * 格式化并应用代码
   */
  async formatAndApply(
    document: vscode.TextDocument,
    code: string
  ): Promise<boolean> {
    const result = await this.smartInsert(document, code);
    
    if (result.success) {
      // 尝试格式化文档
      try {
        await vscode.commands.executeCommand('editor.action.formatDocument');
      } catch {
        // 格式化失败不影响结果
      }
      
      await document.save();
    }

    return result.success;
  }

  /**
   * 交互式代码应用
   * 显示预览并让用户确认
   */
  async interactiveApply(
    response: string,
    targetFile?: string
  ): Promise<{ success: boolean; message: string }> {
    const changes = this.parseCodeChanges(response, targetFile);

    if (changes.length === 0) {
      return { success: false, message: 'No code changes found' };
    }

    // 显示快速选择让用户选择要应用的变更
    const items = changes.map((change, index) => ({
      label: change.filePath || `Change ${index + 1}`,
      description: `${change.operations.length} operations`,
      detail: change.modified.slice(0, 100) + '...',
      change,
      picked: true,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: 'Select changes to apply',
    });

    if (!selected || selected.length === 0) {
      return { success: false, message: 'No changes selected' };
    }

    const result = await this.applyChanges(
      selected.map(s => s.change),
      { autoSave: true }
    );

    return {
      success: result.success,
      message: `Applied ${result.applied} changes, ${result.failed} failed`,
    };
  }
}

/**
 * 用于差异预览的虚拟文档提供器
 */
export class DiffContentProvider implements vscode.TextDocumentContentProvider {
  private contents = new Map<string, string>();

  setContent(uri: string, content: string): void {
    this.contents.set(uri, content);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) || '';
  }
}
