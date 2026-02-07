/**
 * Skill包执行器
 * 
 * 负责执行skill包中的脚本，支持多种运行时
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import {
  InstalledSkill,
  SkillContext,
  SkillResult,
  SkillRuntime,
} from './types';
import { SkillMCPBridgeImpl, SkillMCPBridgeFactory } from './SkillMCPBridge';

export class SkillExecutor {
  private static instance: SkillExecutor | null = null;
  private context: vscode.ExtensionContext;
  private bridgeFactory: SkillMCPBridgeFactory;
  private runningProcesses: Map<string, ChildProcess> = new Map();

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.bridgeFactory = SkillMCPBridgeFactory.getInstance();
  }

  static getInstance(context: vscode.ExtensionContext): SkillExecutor {
    if (!SkillExecutor.instance) {
      SkillExecutor.instance = new SkillExecutor(context);
    }
    return SkillExecutor.instance;
  }

  /**
   * 执行skill
   */
  async execute(
    skill: InstalledSkill,
    params?: Record<string, any>,
    workspaceContext?: {
      workspaceRoot?: string;
      activeFile?: string;
      selectedCode?: string;
    }
  ): Promise<SkillResult> {
    const startTime = Date.now();
    const logs: SkillResult['logs'] = [];
    const mcpCalls: SkillResult['mcpCalls'] = [];

    const log = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
      logs.push({ level, message, timestamp: Date.now() });
      console.log(`[Skill:${skill.manifest.id}] [${level}] ${message}`);
    };

    try {
      log(`开始执行skill: ${skill.manifest.name}`);

      // 获取MCP桥接
      const bridge = this.bridgeFactory.createBridge(skill);

      // 包装MCP桥接以记录调用
      const wrappedBridge = {
        call: async (toolId: string, toolParams: Record<string, any>) => {
          const result = await bridge.call(toolId, toolParams);
          mcpCalls.push({ toolId, params: toolParams, result });
          return result;
        },
        listTools: () => bridge.listTools(),
        registerTool: (tool: any) => bridge.registerTool(tool),
        unregisterTool: (toolId: string) => bridge.unregisterTool(toolId),
      };

      // 创建执行上下文
      const execContext: SkillContext = {
        skill,
        workspaceRoot: workspaceContext?.workspaceRoot || 
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        activeFile: workspaceContext?.activeFile || 
          vscode.window.activeTextEditor?.document.fileName,
        selectedCode: workspaceContext?.selectedCode,
        params,
        mcp: wrappedBridge,
        log,
        progress: (percent, message) => {
          log(`进度: ${percent}%${message ? ` - ${message}` : ''}`, 'info');
        },
      };

      // 根据运行时执行
      const runtime = skill.manifest.runtime || 'node';
      let output: any;

      switch (runtime) {
        case 'node':
          output = await this.executeNode(skill, execContext);
          break;
        case 'python':
          output = await this.executePython(skill, execContext);
          break;
        case 'shell':
          output = await this.executeShell(skill, execContext);
          break;
        case 'builtin':
          output = await this.executeBuiltin(skill, execContext);
          break;
        default:
          throw new Error(`不支持的运行时: ${runtime}`);
      }

      log('执行完成');

      return {
        success: true,
        output,
        logs,
        mcpCalls,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      log(`执行失败: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        logs,
        mcpCalls,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 执行Node.js脚本
   */
  private async executeNode(
    skill: InstalledSkill,
    context: SkillContext
  ): Promise<any> {
    const mainScript = skill.manifest.main || 'scripts/main.js';
    const scriptPath = path.join(skill.installPath, mainScript);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`主脚本不存在: ${scriptPath}`);
    }

    // 处理TypeScript
    if (scriptPath.endsWith('.ts')) {
      return this.executeTypeScript(skill, context, scriptPath);
    }

    // 动态加载并执行
    const vm = require('vm');
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

    // 创建安全的执行环境
    const sandbox = this.createSandbox(context);

    const script = new vm.Script(`
      (async function(context) {
        ${scriptContent}
        if (typeof execute === 'function') {
          return await execute(context);
        } else if (typeof main === 'function') {
          return await main(context);
        } else if (typeof module !== 'undefined' && module.exports) {
          const exp = module.exports;
          if (typeof exp === 'function') return await exp(context);
          if (typeof exp.execute === 'function') return await exp.execute(context);
          if (typeof exp.default === 'function') return await exp.default(context);
        }
        throw new Error('未找到可执行的函数 (execute, main, 或 module.exports)');
      })
    `);

    const execute = script.runInNewContext(sandbox);
    return execute(context);
  }

  /**
   * 执行TypeScript脚本
   */
  private async executeTypeScript(
    skill: InstalledSkill,
    context: SkillContext,
    scriptPath: string
  ): Promise<any> {
    const jsPath = scriptPath.replace(/\.ts$/, '.js');

    // 检查是否需要编译
    if (!fs.existsSync(jsPath) || 
        fs.statSync(scriptPath).mtime > fs.statSync(jsPath).mtime) {
      try {
        execSync(`npx tsc "${scriptPath}" --outDir "${path.dirname(jsPath)}"`, {
          cwd: skill.installPath,
          stdio: 'pipe',
        });
      } catch (error) {
        throw new Error(`TypeScript编译失败: ${error}`);
      }
    }

    // 执行编译后的JS
    const updatedSkill = {
      ...skill,
      manifest: {
        ...skill.manifest,
        main: skill.manifest.main?.replace(/\.ts$/, '.js'),
      },
    };

    return this.executeNode(updatedSkill, context);
  }

  /**
   * 执行Python脚本
   */
  private async executePython(
    skill: InstalledSkill,
    context: SkillContext
  ): Promise<any> {
    const mainScript = skill.manifest.main || 'scripts/main.py';
    const scriptPath = path.join(skill.installPath, mainScript);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`主脚本不存在: ${scriptPath}`);
    }

    return new Promise((resolve, reject) => {
      const contextJson = JSON.stringify({
        workspaceRoot: context.workspaceRoot,
        activeFile: context.activeFile,
        selectedCode: context.selectedCode,
        params: context.params,
        skillId: skill.manifest.id,
      });

      const python = spawn('python', [scriptPath], {
        cwd: skill.installPath,
        env: {
          ...process.env,
          SKILL_CONTEXT: contextJson,
          PYTHONPATH: skill.installPath,
        },
      });

      this.runningProcesses.set(skill.manifest.id, python);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
        context.log(data.toString().trim(), 'info');
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        context.log(data.toString().trim(), 'error');
      });

      python.on('close', (code) => {
        this.runningProcesses.delete(skill.manifest.id);

        if (code === 0) {
          try {
            const lastLine = stdout.trim().split('\n').pop() || '';
            resolve(JSON.parse(lastLine));
          } catch {
            resolve(stdout);
          }
        } else {
          reject(new Error(`Python脚本退出码 ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        this.runningProcesses.delete(skill.manifest.id);
        reject(error);
      });
    });
  }

  /**
   * 执行Shell脚本
   */
  private async executeShell(
    skill: InstalledSkill,
    context: SkillContext
  ): Promise<any> {
    const mainScript = skill.manifest.main || 'scripts/main.sh';
    const scriptPath = path.join(skill.installPath, mainScript);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`主脚本不存在: ${scriptPath}`);
    }

    return new Promise((resolve, reject) => {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const args = process.platform === 'win32' ? ['-File', scriptPath] : [scriptPath];

      const proc = spawn(shell, args, {
        cwd: skill.installPath,
        env: {
          ...process.env,
          WORKSPACE_ROOT: context.workspaceRoot || '',
          ACTIVE_FILE: context.activeFile || '',
          SELECTED_CODE: context.selectedCode || '',
          SKILL_ID: skill.manifest.id,
          SKILL_PARAMS: JSON.stringify(context.params || {}),
        },
      });

      this.runningProcesses.set(skill.manifest.id, proc);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
        context.log(data.toString().trim(), 'info');
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        context.log(data.toString().trim(), 'error');
      });

      proc.on('close', (code) => {
        this.runningProcesses.delete(skill.manifest.id);

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Shell脚本退出码 ${code}: ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        this.runningProcesses.delete(skill.manifest.id);
        reject(error);
      });
    });
  }

  /**
   * 执行内置skill
   */
  private async executeBuiltin(
    skill: InstalledSkill,
    context: SkillContext
  ): Promise<any> {
    const mainScript = skill.manifest.main || 'scripts/main.js';
    const scriptPath = path.join(skill.installPath, mainScript);

    if (!fs.existsSync(scriptPath)) {
      throw new Error(`主脚本不存在: ${scriptPath}`);
    }

    // 直接require执行
    const module = require(scriptPath);

    if (typeof module.execute === 'function') {
      return module.execute(context);
    } else if (typeof module.default === 'function') {
      return module.default(context);
    } else if (typeof module === 'function') {
      return module(context);
    }

    throw new Error('未找到可执行函数');
  }

  /**
   * 创建沙箱环境
   */
  private createSandbox(context: SkillContext): Record<string, any> {
    return {
      console: {
        log: (...args: any[]) => context.log(args.join(' '), 'info'),
        warn: (...args: any[]) => context.log(args.join(' '), 'warn'),
        error: (...args: any[]) => context.log(args.join(' '), 'error'),
        info: (...args: any[]) => context.log(args.join(' '), 'info'),
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      Buffer,
      JSON,
      Math,
      Date,
      RegExp,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      Error,
      URL,
      module: { exports: {} },
      exports: {},
      require: this.createSafeRequire(context.skill.installPath),
    };
  }

  /**
   * 创建安全的require函数
   */
  private createSafeRequire(skillPath: string): (module: string) => any {
    const allowedModules = ['path', 'fs', 'url', 'util', 'crypto', 'zlib'];

    return (moduleName: string) => {
      if (allowedModules.includes(moduleName)) {
        return require(moduleName);
      }

      // 允许skill目录下的模块
      if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
        const resolvedPath = path.resolve(skillPath, moduleName);
        if (resolvedPath.startsWith(skillPath)) {
          return require(resolvedPath);
        }
      }

      // 允许skill的node_modules
      const nodeModulesPath = path.join(skillPath, 'node_modules', moduleName);
      if (fs.existsSync(nodeModulesPath)) {
        return require(nodeModulesPath);
      }

      throw new Error(`不允许加载模块: ${moduleName}`);
    };
  }

  /**
   * 取消skill执行
   */
  cancel(skillId: string): boolean {
    const proc = this.runningProcesses.get(skillId);
    if (proc) {
      proc.kill('SIGTERM');
      this.runningProcesses.delete(skillId);
      return true;
    }
    return false;
  }

  /**
   * 检查skill是否正在执行
   */
  isRunning(skillId: string): boolean {
    return this.runningProcesses.has(skillId);
  }
}
