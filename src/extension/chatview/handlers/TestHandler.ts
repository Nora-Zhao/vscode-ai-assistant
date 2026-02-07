import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChatViewContext, MessageHandler } from '../types';
import { Message, generateId } from '../../../types/shared';
import { i18n } from '../../i18n';

/**
 * 测试处理器
 * 处理测试生成、保存、运行等功能
 */
export class TestHandler implements MessageHandler {
  constructor(private ctx: ChatViewContext) {}

  async handle(data: any): Promise<boolean> {
    switch (data.type) {
      case 'generateTest':
        await this.generateTest(data.filePath);
        return true;
      case 'saveTest':
        await this.saveTest(data.code, data.path);
        return true;
      case 'runTest':
        await this.runTest(data.path);
        return true;
      case 'getTestHistory':
        this.sendTestHistory();
        return true;
      case 'loadTest':
        this.loadTest(data.testIndex);
        return true;
      case 'autoFixTest':
        await this.autoFixTest(data.code, data.errors, data.framework, data.path);
        return true;
      case 'renameTest':
        this.renameTest(data.testIndex, data.newName);
        return true;
      case 'deleteTest':
        this.deleteTest(data.testIndex);
        return true;
      case 'refineTest':
        await this.refineTest(data.code, data.framework, data.path);
        return true;
      default:
        return false;
    }
  }

  /**
   * 生成测试
   */
  async generateTest(filePath?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const targetPath = filePath || editor?.document.uri.fsPath;

    if (!targetPath) {
      this.ctx.postMessage({ type: 'error', message: '请先打开或选择一个文件' });
      return;
    }

    const taskId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: 'error',
        message: '请先配置 API Key',
      });
      return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    
    const { language, framework } = this.ctx.testGenerator.detectLanguageAndFramework(targetPath, workspaceRoot);
    
    let sourceCode: string;
    try {
      sourceCode = fs.readFileSync(targetPath, 'utf-8');
    } catch (err) {
      this.ctx.postMessage({ type: 'error', message: `无法读取文件: ${targetPath}` });
      return;
    }
    
    const prompt = this.ctx.testGenerator.generatePrompt(sourceCode, targetPath, framework);
    const fileName = path.basename(targetPath);

    this.ctx.postMessage({
      type: 'taskStatus',
      taskType: 'test',
      taskId,
      status: 'running',
      message: `正在为 ${fileName} 生成 ${framework} 测试...`,
      timestamp: Date.now(),
    });

    let response = '';

    await chatService.sendMessage(
      [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const testCode = this.ctx.testGenerator.extractTestCode(response, language);
          const testPath = this.ctx.testGenerator.generateTestFilePath(targetPath, framework);
          
          // 保存到历史记录
          await this.saveTestToHistory({
            code: testCode,
            path: testPath,
            framework,
            sourceFile: fileName,
          });
          
          // 保存测试上下文
          this.ctx.lastGeneratedTest = {
            code: testCode,
            framework,
            sourceFile: targetPath,
            timestamp: Date.now(),
          };
          
          this.ctx.postMessage({
            type: 'testGenerated',
            code: testCode,
            suggestedPath: testPath,
            framework,
            taskId,
          });
          
          this.ctx.postMessage({
            type: 'taskStatus',
            taskType: 'test',
            taskId,
            status: 'success',
            message: `${fileName} 测试生成完成`,
            timestamp: Date.now(),
          });
        },
        onError: (error) => {
          this.ctx.postMessage({ type: 'error', message: error.message });
          this.ctx.postMessage({
            type: 'taskStatus',
            taskType: 'test',
            taskId,
            status: 'error',
            message: error.message,
            timestamp: Date.now(),
          });
        },
      },
      { maxTokens: 8192, requestId: `test-${taskId}` }
    );
  }

  /**
   * 从内联代码生成测试
   */
  async generateFromCode(codeContent: string): Promise<void> {
    const taskId = `test-inline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.postMessage({
        type: 'error',
        message: '请先配置 API Key',
      });
      return;
    }

    // 解析代码内容和语言
    let sourceCode = codeContent;
    let language = '';
    
    const codeBlockMatch = codeContent.match(/```(\w+)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      language = codeBlockMatch[1] || '';
      sourceCode = codeBlockMatch[2];
    } else if (codeContent.startsWith('code:')) {
      sourceCode = codeContent.replace(/^code:\s*/, '').trim();
    }
    
    if (!language) {
      language = this.detectLanguageFromCode(sourceCode);
    }
    
    if (!language || language === 'unknown') {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        language = this.normalizeLanguageId(editor.document.languageId);
      }
    }
    
    if (!language || language === 'unknown') {
      language = 'javascript';
    }
    
    const framework = this.detectFrameworkFromLanguage(language);
    
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const prompt = this.ctx.testGenerator.generatePrompt(sourceCode, `inline.${language}`, framework);

    this.ctx.postMessage({
      type: 'taskStatus',
      taskType: 'test',
      taskId,
      status: 'running',
      message: `正在为选中代码 (${language}) 生成 ${framework} 测试...`,
      timestamp: Date.now(),
    });

    let response = '';

    await chatService.sendMessage(
      [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
        },
        onComplete: async () => {
          const testCode = this.ctx.testGenerator.extractTestCode(response, language);
          const ext = this.getExtensionForLanguage(language);
          const testPath = path.join(workspaceRoot, `test_inline${ext}`);
          
          await this.saveTestToHistory({
            code: testCode,
            path: testPath,
            framework,
            sourceFile: 'inline code',
          });
          
          this.ctx.lastGeneratedTest = {
            code: testCode,
            framework,
            sourceFile: 'inline code',
            timestamp: Date.now(),
          };
          
          this.ctx.postMessage({
            type: 'testGenerated',
            code: testCode,
            suggestedPath: testPath,
            framework,
            taskId,
          });
          
          this.ctx.postMessage({
            type: 'taskStatus',
            taskType: 'test',
            taskId,
            status: 'success',
            message: `测试生成完成 (${framework})`,
            timestamp: Date.now(),
          });
        },
        onError: (error) => {
          this.ctx.postMessage({ type: 'error', message: error.message });
          this.ctx.postMessage({
            type: 'taskStatus',
            taskType: 'test',
            taskId,
            status: 'error',
            message: error.message,
            timestamp: Date.now(),
          });
        },
      },
      { maxTokens: 8192, requestId: `test-inline-${taskId}` }
    );
  }

  /**
   * 保存测试文件
   */
  async saveTest(code: string, testPath: string): Promise<void> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
      const fullPath = path.isAbsolute(testPath) ? testPath : path.join(workspaceRoot, testPath);
      
      // 确保目录存在
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, code, 'utf-8');
      
      // 打开文件
      const document = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(document);
      
      vscode.window.showInformationMessage(`测试文件已保存: ${testPath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 运行测试
   */
  async runTest(testPath: string): Promise<void> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      vscode.window.showErrorMessage('请先打开工作区');
      return;
    }

    // 检测测试框架并生成运行命令
    const ext = path.extname(testPath);
    let command = '';
    
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      // 检测是否有jest或vitest
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps['vitest']) {
          command = `npx vitest run ${testPath}`;
        } else if (deps['jest']) {
          command = `npx jest ${testPath}`;
        } else if (deps['mocha']) {
          command = `npx mocha ${testPath}`;
        }
      }
    } else if (ext === '.py') {
      command = `python -m pytest ${testPath}`;
    } else if (ext === '.go') {
      command = `go test -v ${testPath}`;
    }

    if (!command) {
      command = `npm test -- ${testPath}`;
    }

    // 在终端中运行
    const terminal = vscode.window.createTerminal('AI Test Runner');
    terminal.show();
    terminal.sendText(`cd "${workspaceRoot}" && ${command}`);
  }

  /**
   * 发送测试历史
   */
  sendTestHistory(): void {
    const tests = this.getTestHistory();
    this.ctx.postMessage({ type: 'testHistory', tests });
  }

  /**
   * 加载测试
   */
  loadTest(testIndex: number): void {
    const tests = this.getTestHistory();
    if (tests[testIndex]) {
      const test = tests[testIndex];
      this.ctx.postMessage({
        type: 'testGenerated',
        code: test.code,
        suggestedPath: test.path,
        framework: test.framework,
      });
    }
  }

  /**
   * 自动修复测试
   */
  async autoFixTest(code: string, errors: string[], framework: string, testPath: string): Promise<void> {
    this.ctx.updateTaskStatus('test', 'running', '正在修复测试代码...');

    const streamingMessageId = generateId();
    const language = this.getLanguageFromFramework(framework);
    let messageAdded = false;

    try {
      // 将错误数组转换为单个字符串
      const errorString = errors.join('\n');
      await this.ctx.autoFixService.fixTestStreaming(code, errorString, framework, language, {
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
            const finalContent = `✅ **测试代码修复完成**\n\n${result.explanation || ''}\n\n\`\`\`${language || 'typescript'}\n${result.fixedCode}\n\`\`\``;
            
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: finalContent,
              });
            }
            
            this.ctx.postMessage({ type: 'testAutoFixed', code: result.fixedCode });
            this.ctx.updateTaskStatus('test', 'success', '测试修复完成');
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: `❌ **自动修复失败**\n\n${result.error || '无法解析修复结果'}`,
              });
            }
            this.ctx.updateTaskStatus('test', 'error', '修复失败');
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
          this.ctx.updateTaskStatus('test', 'error', errorMessage);
        },
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误';
      this.ctx.updateTaskStatus('test', 'error', errorMsg);
    }
  }

  /**
   * 重命名测试
   */
  renameTest(testIndex: number, newName: string): void {
    try {
      const key = 'testHistory';
      const tests = this.ctx.extensionContext.globalState.get<any[]>(key, []);
      if (tests[testIndex]) {
        tests[testIndex].customName = newName;
        this.ctx.extensionContext.globalState.update(key, tests);
        vscode.window.showInformationMessage(`测试已重命名为: ${newName}`);
      }
    } catch (e) {
      vscode.window.showErrorMessage('重命名失败');
    }
  }

  /**
   * 删除测试
   */
  deleteTest(testIndex: number): void {
    try {
      const key = 'testHistory';
      const tests = this.ctx.extensionContext.globalState.get<any[]>(key, []);
      tests.splice(testIndex, 1);
      this.ctx.extensionContext.globalState.update(key, tests);
      vscode.window.showInformationMessage('测试历史已删除');
    } catch (e) {
      vscode.window.showErrorMessage('删除失败');
    }
  }

  /**
   * 优化测试代码
   */
  async refineTest(code: string, framework: string, testPath: string): Promise<void> {
    this.ctx.updateTaskStatus('test', 'running', '正在优化测试代码...');

    const streamingMessageId = generateId();
    const language = this.getLanguageFromFramework(framework);
    let messageAdded = false;
    let response = '';

    const chatService = await this.ctx.ensureChatService();
    if (!chatService) {
      this.ctx.updateTaskStatus('test', 'error', 'API Key 未配置');
      return;
    }

    const languageSuffix = i18n.isChinese() 
      ? '\n\n【语言要求】请使用中文回复和注释。'
      : '\n\nPlease respond in English.';

    const prompt = `你是一个测试代码专家。请优化和完善以下测试代码：

**测试框架:** ${framework}
**当前代码:**
\`\`\`
${code}
\`\`\`

**优化要求:**
1. 补全不完整的测试代码
2. 修复可能的语法错误
3. 改进测试覆盖范围
4. 优化测试命名和结构
5. 添加必要的 import 语句
6. 确保代码可以正常运行

请直接返回优化后的完整代码，使用代码块格式。${languageSuffix}`;

    await chatService.sendMessage(
      [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
      {
        onToken: (token) => {
          response += token;
          
          if (!messageAdded && response.length > 30) {
            messageAdded = true;
            this.ctx.postMessage({
              type: 'addMessage',
              message: {
                id: streamingMessageId,
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
              },
              streaming: true,
            });
          } else if (messageAdded) {
            this.ctx.postMessage({
              type: 'updateMessage',
              messageId: streamingMessageId,
              content: response,
            });
          }
        },
        onComplete: async () => {
          const refinedCode = this.ctx.testGenerator.extractTestCode(response, language);
          
          if (refinedCode && refinedCode.length > 50) {
            const finalContent = `✅ **测试代码优化完成**\n\n\`\`\`${language || 'typescript'}\n${refinedCode}\n\`\`\`\n\n请检查并运行测试验证。`;
            
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: finalContent,
              });
            }
            this.ctx.postMessage({ type: 'testAutoFixed', code: refinedCode });
            this.ctx.updateTaskStatus('test', 'success', '测试代码优化完成');
          } else {
            if (messageAdded) {
              this.ctx.postMessage({
                type: 'completeMessage',
                messageId: streamingMessageId,
                content: response || '❌ 无法优化测试代码，请尝试手动编辑。',
              });
            }
            this.ctx.updateTaskStatus('test', 'error', '优化结果无效');
          }
        },
        onError: (error) => {
          if (messageAdded) {
            this.ctx.postMessage({
              type: 'completeMessage',
              messageId: streamingMessageId,
              content: `❌ **优化失败**\n\n${error.message}`,
            });
          }
          this.ctx.updateTaskStatus('test', 'error', error.message);
        },
      },
      { maxTokens: 8192, requestId: `test-refine-${streamingMessageId}` }
    );
  }

  // 辅助方法

  private async saveTestToHistory(test: { code: string; path: string; framework: string; sourceFile: string }): Promise<void> {
    try {
      const key = 'testHistory';
      const existing = this.ctx.extensionContext.globalState.get<typeof test[]>(key, []);
      const updated = [{ ...test, timestamp: Date.now() }, ...existing].slice(0, 20);
      await this.ctx.extensionContext.globalState.update(key, updated);
    } catch (e) {
      console.error('Failed to save test history:', e);
    }
  }

  private getTestHistory(): any[] {
    return this.ctx.extensionContext.globalState.get<any[]>('testHistory', []);
  }

  private getLanguageFromFramework(framework: string): string {
    const frameworkLanguages: Record<string, string> = {
      'jest': 'typescript',
      'vitest': 'typescript',
      'mocha': 'javascript',
      'pytest': 'python',
      'unittest': 'python',
      'go': 'go',
      'junit': 'java',
    };
    return frameworkLanguages[framework.toLowerCase()] || 'typescript';
  }

  private detectLanguageFromCode(code: string): string {
    const indicators: Record<string, RegExp[]> = {
      'typescript': [/:\s*(?:string|number|boolean)/, /interface\s+\w+/, /type\s+\w+\s*=/],
      'javascript': [/function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/],
      'python': [/def\s+\w+/, /import\s+\w+/, /class\s+\w+:/],
      'go': [/func\s+\w+/, /package\s+\w+/, /import\s+\(/],
      'java': [/public\s+class/, /private\s+\w+/, /void\s+\w+\(/],
    };
    
    for (const [lang, patterns] of Object.entries(indicators)) {
      if (patterns.some(p => p.test(code))) {
        return lang;
      }
    }
    return 'unknown';
  }

  private normalizeLanguageId(langId: string): string {
    const map: Record<string, string> = {
      'typescriptreact': 'typescript',
      'javascriptreact': 'javascript',
    };
    return map[langId] || langId;
  }

  private detectFrameworkFromLanguage(language: string): 'jest' | 'vitest' | 'mocha' | 'pytest' | 'junit' | 'go' {
    const frameworks: Record<string, 'jest' | 'vitest' | 'mocha' | 'pytest' | 'junit' | 'go'> = {
      'typescript': 'jest',
      'javascript': 'jest',
      'python': 'pytest',
      'go': 'go',
      'java': 'junit',
    };
    return frameworks[language] || 'jest';
  }

  private getExtensionForLanguage(language: string): string {
    const extensions: Record<string, string> = {
      'typescript': '.test.ts',
      'javascript': '.test.js',
      'python': '_test.py',
      'go': '_test.go',
      'java': 'Test.java',
    };
    return extensions[language] || '.test.ts';
  }
}
