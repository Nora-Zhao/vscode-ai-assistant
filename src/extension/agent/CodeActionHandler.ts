/**
 * Code Action Result Handler
 * 
 * 处理代码操作（解释/修复/优化等）的结果
 * 支持：复制、插入、替换、保存
 */

import * as vscode from 'vscode';

/** 代码操作结果 */
export interface CodeActionResult {
  /** 原始代码 */
  originalCode: string;
  /** AI 生成的结果 */
  result: string;
  /** 结果类型 */
  resultType: 'explanation' | 'code' | 'mixed';
  /** 提取的代码块（如果有） */
  codeBlocks: CodeBlock[];
  /** SEARCH/REPLACE 块（如果有） */
  searchReplaceBlocks: SearchReplaceBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

export interface SearchReplaceBlock {
  search: string;
  replace: string;
}

/**
 * 代码操作结果处理器
 */
export class CodeActionResultHandler {
  
  /**
   * 解析 AI 响应，提取代码块和 SEARCH/REPLACE 块
   */
  parseResponse(response: string, originalCode?: string): CodeActionResult {
    const codeBlocks = this.extractCodeBlocks(response);
    const searchReplaceBlocks = this.extractSearchReplaceBlocks(response);
    
    // 判断结果类型
    let resultType: 'explanation' | 'code' | 'mixed' = 'explanation';
    if (searchReplaceBlocks.length > 0 || codeBlocks.length > 0) {
      const textRatio = this.calculateTextRatio(response, codeBlocks);
      resultType = textRatio > 0.5 ? 'mixed' : 'code';
    }

    return {
      originalCode: originalCode || '',
      result: response,
      resultType,
      codeBlocks,
      searchReplaceBlocks,
    };
  }

  /**
   * 提取代码块
   */
  private extractCodeBlocks(response: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const pattern = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = pattern.exec(response)) !== null) {
      // 排除 SEARCH/REPLACE 块
      if (!match[2].includes('<<<<<<< SEARCH')) {
        blocks.push({
          language: match[1] || 'text',
          code: match[2].trim(),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    return blocks;
  }

  /**
   * 提取 SEARCH/REPLACE 块
   */
  private extractSearchReplaceBlocks(response: string): SearchReplaceBlock[] {
    const blocks: SearchReplaceBlock[] = [];
    
    // 匹配 SEARCH/REPLACE 格式
    const pattern = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
    let match;

    while ((match = pattern.exec(response)) !== null) {
      blocks.push({
        search: match[1].trim(),
        replace: match[2].trim(),
      });
    }

    return blocks;
  }

  /**
   * 计算文本占比
   */
  private calculateTextRatio(response: string, codeBlocks: CodeBlock[]): number {
    const totalLength = response.length;
    const codeLength = codeBlocks.reduce((sum, block) => sum + block.code.length, 0);
    return (totalLength - codeLength) / totalLength;
  }

  /**
   * 复制结果到剪贴板
   */
  async copyToClipboard(result: CodeActionResult, type: 'all' | 'code' | 'first_block' = 'all'): Promise<void> {
    let content: string;

    switch (type) {
      case 'code':
        // 只复制代码部分
        content = result.codeBlocks.map(b => b.code).join('\n\n');
        break;
      case 'first_block':
        // 只复制第一个代码块
        content = result.codeBlocks[0]?.code || result.result;
        break;
      case 'all':
      default:
        content = result.result;
    }

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage('已复制到剪贴板');
  }

  /**
   * 在当前光标位置插入代码
   */
  async insertAtCursor(result: CodeActionResult): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return false;
    }

    const code = result.codeBlocks[0]?.code || result.result;
    
    return editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, code);
    });
  }

  /**
   * 替换选中的代码
   */
  async replaceSelection(result: CodeActionResult): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return false;
    }

    if (editor.selection.isEmpty) {
      vscode.window.showWarningMessage('请先选中要替换的代码');
      return false;
    }

    const code = result.codeBlocks[0]?.code || result.result;

    return editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, code);
    });
  }

  /**
   * 应用 SEARCH/REPLACE 块
   */
  async applySearchReplace(result: CodeActionResult): Promise<{ success: number; failed: number }> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('没有打开的编辑器');
      return { success: 0, failed: 0 };
    }

    if (result.searchReplaceBlocks.length === 0) {
      vscode.window.showWarningMessage('没有找到 SEARCH/REPLACE 块');
      return { success: 0, failed: 0 };
    }

    const document = editor.document;
    const fullText = document.getText();
    let success = 0;
    let failed = 0;

    // 从后往前替换，避免位置偏移
    const sortedBlocks = [...result.searchReplaceBlocks].reverse();

    await editor.edit(editBuilder => {
      for (const block of sortedBlocks) {
        const index = fullText.indexOf(block.search);
        if (index !== -1) {
          const startPos = document.positionAt(index);
          const endPos = document.positionAt(index + block.search.length);
          editBuilder.replace(new vscode.Range(startPos, endPos), block.replace);
          success++;
        } else {
          // 尝试模糊匹配（忽略空白差异）
          const fuzzyMatch = this.fuzzyFind(fullText, block.search);
          if (fuzzyMatch) {
            const startPos = document.positionAt(fuzzyMatch.start);
            const endPos = document.positionAt(fuzzyMatch.end);
            editBuilder.replace(new vscode.Range(startPos, endPos), block.replace);
            success++;
          } else {
            failed++;
          }
        }
      }
    });

    if (failed > 0) {
      vscode.window.showWarningMessage(`应用了 ${success} 处修改，${failed} 处未找到匹配`);
    } else {
      vscode.window.showInformationMessage(`成功应用 ${success} 处修改`);
    }

    return { success, failed };
  }

  /**
   * 模糊查找（忽略空白差异）
   */
  private fuzzyFind(text: string, search: string): { start: number; end: number } | null {
    // 标准化空白
    const normalizeWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();
    const normalizedSearch = normalizeWhitespace(search);
    
    // 在文本中查找
    const lines = text.split('\n');
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      // 尝试多行匹配
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        const chunk = lines.slice(i, j + 1).join('\n');
        if (normalizeWhitespace(chunk) === normalizedSearch) {
          const start = currentPos;
          const end = currentPos + chunk.length;
          return { start, end };
        }
      }
      currentPos += lines[i].length + 1;
    }

    return null;
  }

  /**
   * 保存为新文件
   */
  async saveAsNewFile(result: CodeActionResult, suggestedName?: string): Promise<void> {
    const code = result.codeBlocks[0]?.code || result.result;
    const language = result.codeBlocks[0]?.language || 'txt';
    
    // 推断文件扩展名
    const extMap: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      yaml: 'yaml',
      markdown: 'md',
      sql: 'sql',
      shell: 'sh',
      bash: 'sh',
    };

    const ext = extMap[language] || 'txt';
    const defaultName = suggestedName || `generated.${ext}`;

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultName),
      filters: {
        'All Files': ['*'],
      },
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf-8'));
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(`已保存到 ${uri.fsPath}`);
    }
  }

  /**
   * 显示 Diff 视图
   */
  async showDiff(result: CodeActionResult): Promise<void> {
    if (result.searchReplaceBlocks.length === 0 && result.codeBlocks.length === 0) {
      vscode.window.showWarningMessage('没有可对比的代码');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // 创建虚拟文档显示 diff
    const originalUri = vscode.Uri.parse(`ai-original:${Date.now()}`);
    const modifiedUri = vscode.Uri.parse(`ai-modified:${Date.now()}`);

    // 构建修改后的内容
    let modifiedContent = editor.document.getText();
    for (const block of result.searchReplaceBlocks) {
      modifiedContent = modifiedContent.replace(block.search, block.replace);
    }

    // 注册内容提供器（临时）
    const provider = new class implements vscode.TextDocumentContentProvider {
      provideTextDocumentContent(uri: vscode.Uri): string {
        if (uri.scheme === 'ai-original') {
          return editor.document.getText();
        } else {
          return modifiedContent;
        }
      }
    };

    const disposable = vscode.workspace.registerTextDocumentContentProvider('ai-original', provider);
    const disposable2 = vscode.workspace.registerTextDocumentContentProvider('ai-modified', provider);

    // 显示 diff
    await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, 'AI 修改对比');

    // 清理
    setTimeout(() => {
      disposable.dispose();
      disposable2.dispose();
    }, 60000);
  }

  /**
   * 显示操作菜单
   */
  async showActionMenu(result: CodeActionResult): Promise<void> {
    const items: vscode.QuickPickItem[] = [];

    // 根据结果类型提供不同选项
    if (result.resultType === 'explanation') {
      items.push(
        { label: '$(copy) 复制全部', description: '复制完整回复' },
      );
    } else {
      if (result.searchReplaceBlocks.length > 0) {
        items.push(
          { label: '$(replace-all) 应用所有修改', description: `应用 ${result.searchReplaceBlocks.length} 处 SEARCH/REPLACE` },
          { label: '$(diff) 查看修改对比', description: '在 Diff 视图中预览修改' },
        );
      }

      if (result.codeBlocks.length > 0) {
        items.push(
          { label: '$(insert) 插入代码', description: '在光标位置插入' },
          { label: '$(find-replace) 替换选中', description: '替换当前选中的代码' },
          { label: '$(copy) 复制代码', description: '只复制代码部分' },
        );
      }

      items.push(
        { label: '$(save) 保存为新文件', description: '将代码保存为新文件' },
      );
    }

    items.push(
      { label: '$(copy) 复制全部', description: '复制完整回复' },
    );

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择操作',
    });

    if (!selected) return;

    switch (selected.label) {
      case '$(replace-all) 应用所有修改':
        await this.applySearchReplace(result);
        break;
      case '$(diff) 查看修改对比':
        await this.showDiff(result);
        break;
      case '$(insert) 插入代码':
        await this.insertAtCursor(result);
        break;
      case '$(find-replace) 替换选中':
        await this.replaceSelection(result);
        break;
      case '$(copy) 复制代码':
        await this.copyToClipboard(result, 'code');
        break;
      case '$(save) 保存为新文件':
        await this.saveAsNewFile(result);
        break;
      case '$(copy) 复制全部':
        await this.copyToClipboard(result, 'all');
        break;
    }
  }
}

// 导出单例
export const codeActionHandler = new CodeActionResultHandler();
