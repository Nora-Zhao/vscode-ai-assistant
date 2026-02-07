import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec, ExecOptions } from 'child_process';
import { ISkill, ProjectContext, SkillParams, SkillResult, SkillProgressReporter } from './interfaces';
import { languageDetector } from './adapters';

/**
 * 技能基类
 * 提供通用的命令执行、文件操作和 VS Code 集成功能
 */
export abstract class BaseSkill implements ISkill {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: 'automator' | 'builder' | 'explainer';

  abstract canExecute(context: ProjectContext): boolean;
  abstract execute(context: ProjectContext, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult>;

  /**
   * 获取当前项目上下文
   */
  protected async getProjectContext(): Promise<ProjectContext | null> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return null;
    return languageDetector.detectProject(workspaceFolder.uri.fsPath);
  }

  /**
   * 在后台执行命令
   */
  protected runCommand(command: string, cwd: string, options?: { timeout?: number; maxBuffer?: number }): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const execOptions: ExecOptions = {
        cwd,
        timeout: options?.timeout ?? 60000,
        maxBuffer: options?.maxBuffer ?? 1024 * 1024 * 10,
        shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
      };

      exec(command, execOptions, (error, stdout, stderr) => {
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          code: error?.code ?? 0,
        });
      });
    });
  }

  /**
   * 在 VS Code 终端中执行命令
   */
  protected async runInTerminal(command: string, name: string): Promise<void> {
    const terminal = vscode.window.createTerminal({ name });
    terminal.show();
    terminal.sendText(command);
  }

  /**
   * 写入文件
   */
  protected async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 读取文件
   */
  protected async readFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  /**
   * 检查文件是否存在
   */
  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 在编辑器中打开文件
   */
  protected async openInEditor(filePath: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);
  }

  /**
   * 显示信息消息
   */
  protected showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  /**
   * 显示警告消息
   */
  protected showWarning(message: string): void {
    vscode.window.showWarningMessage(message);
  }

  /**
   * 显示错误消息
   */
  protected showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  /**
   * 获取当前活动的编辑器
   */
  protected getActiveEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  /**
   * 获取选中的文本
   */
  protected getSelectedText(): string | undefined {
    const editor = this.getActiveEditor();
    if (!editor) return undefined;
    const selection = editor.selection;
    return selection.isEmpty ? undefined : editor.document.getText(selection);
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
