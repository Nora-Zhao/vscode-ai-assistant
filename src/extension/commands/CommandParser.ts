import * as vscode from 'vscode';
import * as path from 'path';
import { SLASH_COMMANDS, SlashCommand } from '../../types/shared';

/**
 * 命令解析结果
 */
export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
  isValid: boolean;
  error?: string;
}

/**
 * 命令解析器
 * 解析用户输入的斜杠命令
 */
export class CommandParser {
  /**
   * 解析输入
   */
  parse(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    
    // 检查是否是命令
    if (!trimmed.startsWith('/') && !trimmed.startsWith('!')) {
      return null;
    }
    
    // 处理 ! 开头的命令（等同于 /run）
    if (trimmed.startsWith('!')) {
      const command = trimmed.substring(1).trim();
      return {
        command: 'run',
        args: [command],
        raw: trimmed,
        isValid: command.length > 0,
        error: command.length === 0 ? '请指定要执行的命令' : undefined,
      };
    }
    
    // 解析 / 命令
    const parts = trimmed.substring(1).split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // 查找命令定义
    const commandDef = this._findCommand(commandName);
    
    if (!commandDef) {
      return {
        command: commandName,
        args,
        raw: trimmed,
        isValid: false,
        error: `未知命令: /${commandName}，输入 /help 查看帮助`,
      };
    }
    
    // 验证参数
    const validation = this._validateArgs(commandDef, args);
    
    return {
      command: commandDef.name,
      args,
      raw: trimmed,
      isValid: validation.valid,
      error: validation.error,
    };
  }

  /**
   * 获取命令补全建议
   */
  getSuggestions(input: string): SlashCommand[] {
    if (!input.startsWith('/')) {
      return SLASH_COMMANDS;
    }
    
    const partial = input.substring(1).toLowerCase();
    
    return SLASH_COMMANDS.filter(cmd => {
      return cmd.name.startsWith(partial) ||
        cmd.aliases?.some(a => a.startsWith(partial));
    });
  }

  /**
   * 获取命令帮助
   */
  getHelp(commandName?: string): string {
    if (commandName) {
      const cmd = this._findCommand(commandName);
      if (cmd) {
        return this._formatCommandHelp(cmd);
      }
      return `未知命令: ${commandName}`;
    }
    
    // 返回所有命令帮助
    let help = '📚 **可用命令**\n\n';
    
    const categories = {
      session: ['clear', 'compact', 'resume'],
      project: ['init', 'file', 'search', 'run', 'build', 'test', 'git'],
      generate: ['diagram', 'gentest'],
      other: ['help'],
    };
    
    help += '**会话管理**\n';
    categories.session.forEach(name => {
      const cmd = SLASH_COMMANDS.find(c => c.name === name);
      if (cmd) help += `  \`${cmd.usage}\` - ${cmd.description}\n`;
    });
    
    help += '\n**项目操作**\n';
    categories.project.forEach(name => {
      const cmd = SLASH_COMMANDS.find(c => c.name === name);
      if (cmd) help += `  \`${cmd.usage}\` - ${cmd.description}\n`;
    });
    
    help += '\n**生成功能**\n';
    categories.generate.forEach(name => {
      const cmd = SLASH_COMMANDS.find(c => c.name === name);
      if (cmd) help += `  \`${cmd.usage}\` - ${cmd.description}\n`;
    });
    
    help += '\n**快捷键**\n';
    help += '  `↑` / `↓` - 翻阅历史消息\n';
    help += '  `Tab` - 命令/路径补全\n';
    help += '  `Alt+Enter` - 输入换行\n';
    help += '  `ESC` - 停止当前任务\n';
    help += '  `Ctrl+C` - 取消输入\n';
    
    return help;
  }

  /**
   * 路径补全
   */
  async getPathCompletions(partial: string): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return [];
    
    try {
      const basePath = path.dirname(partial) || '.';
      const prefix = path.basename(partial);
      
      const fullBasePath = path.isAbsolute(basePath)
        ? basePath
        : path.join(workspaceFolder.uri.fsPath, basePath);
      
      const entries = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(fullBasePath)
      );
      
      return entries
        .filter(([name]) => name.startsWith(prefix))
        .map(([name, type]) => {
          const fullPath = path.join(basePath, name);
          return type === vscode.FileType.Directory ? fullPath + '/' : fullPath;
        })
        .slice(0, 10); // 限制数量
    } catch {
      return [];
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  private _findCommand(nameOrAlias: string): SlashCommand | undefined {
    return SLASH_COMMANDS.find(cmd =>
      cmd.name === nameOrAlias ||
      cmd.aliases?.includes(nameOrAlias)
    );
  }

  private _validateArgs(
    cmd: SlashCommand,
    args: string[]
  ): { valid: boolean; error?: string } {
    if (!cmd.args) {
      return { valid: true };
    }
    
    const requiredArgs = cmd.args.filter(a => a.required);
    
    if (args.length < requiredArgs.length) {
      const missing = requiredArgs[args.length];
      return {
        valid: false,
        error: `缺少参数: ${missing.name} - ${missing.description}`,
      };
    }
    
    return { valid: true };
  }

  private _formatCommandHelp(cmd: SlashCommand): string {
    let help = `**/${cmd.name}** - ${cmd.description}\n\n`;
    help += `用法: \`${cmd.usage}\`\n`;
    
    if (cmd.aliases?.length) {
      help += `别名: ${cmd.aliases.map(a => `\`/${a}\``).join(', ')}\n`;
    }
    
    if (cmd.args?.length) {
      help += '\n参数:\n';
      cmd.args.forEach(arg => {
        const required = arg.required ? '(必需)' : '(可选)';
        help += `  - \`${arg.name}\` ${required}: ${arg.description}\n`;
      });
    }
    
    return help;
  }
}

/**
 * 路径补全器
 */
export class PathCompleter {
  private _lastInput: string = '';
  private _completions: string[] = [];
  private _currentIndex: number = 0;

  /**
   * 获取下一个补全
   */
  async getNextCompletion(input: string, parser: CommandParser): Promise<string | null> {
    // 如果输入改变，重新获取补全列表
    if (input !== this._lastInput) {
      this._lastInput = input;
      this._completions = await parser.getPathCompletions(input);
      this._currentIndex = 0;
    }
    
    if (this._completions.length === 0) {
      return null;
    }
    
    const completion = this._completions[this._currentIndex];
    this._currentIndex = (this._currentIndex + 1) % this._completions.length;
    
    return completion;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this._lastInput = '';
    this._completions = [];
    this._currentIndex = 0;
  }
}
