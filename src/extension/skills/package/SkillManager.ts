/**
 * Skill包管理器 (v2)
 * 
 * 管理skill包的完整生命周期：
 * - 内置skill包自动加载
 * - 本地/Git/URL安装
 * - 启用/禁用/卸载
 * - 与IntentClassifier联动注册触发规则
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  SkillManifest,
  InstalledSkill,
  SkillStatus,
  SkillInstallOptions,
  SkillResult,
  SkillMarkdown,
} from './types';
import { SkillLoader } from './SkillLoader';
import { SkillExecutor } from './SkillExecutor';
import { SkillMCPBridgeFactory } from './SkillMCPBridge';
import { MCPRegistry, MCPExecutor } from '../../mcp';

const STORAGE_KEY = 'aiAssistant.skills';
const SKILLS_DIR = 'skills';

export class SkillManager {
  private static instance: SkillManager | null = null;

  private context: vscode.ExtensionContext;
  private loader: SkillLoader;
  private executor: SkillExecutor;
  private bridgeFactory: SkillMCPBridgeFactory;
  private skills: Map<string, InstalledSkill> = new Map();
  private skillsDir: string;

  // 事件
  private _onSkillInstalled = new vscode.EventEmitter<InstalledSkill>();
  private _onSkillUninstalled = new vscode.EventEmitter<string>();
  private _onSkillStatusChanged = new vscode.EventEmitter<{ id: string; status: SkillStatus }>();

  readonly onSkillInstalled = this._onSkillInstalled.event;
  readonly onSkillUninstalled = this._onSkillUninstalled.event;
  readonly onSkillStatusChanged = this._onSkillStatusChanged.event;

  private constructor(
    context: vscode.ExtensionContext,
    registry: MCPRegistry,
    executor: MCPExecutor
  ) {
    this.context = context;
    this.loader = SkillLoader.getInstance();
    this.executor = SkillExecutor.getInstance(context);
    this.bridgeFactory = SkillMCPBridgeFactory.getInstance();
    this.bridgeFactory.initialize(registry, executor);

    this.skillsDir = path.join(context.globalStorageUri.fsPath, SKILLS_DIR);
    if (!fs.existsSync(this.skillsDir)) {
      fs.mkdirSync(this.skillsDir, { recursive: true });
    }
  }

  static getInstance(
    context: vscode.ExtensionContext,
    registry?: MCPRegistry,
    executor?: MCPExecutor
  ): SkillManager {
    if (!SkillManager.instance) {
      if (!registry || !executor) {
        throw new Error('SkillManager首次初始化需要提供MCPRegistry和MCPExecutor');
      }
      SkillManager.instance = new SkillManager(context, registry, executor);
    }
    return SkillManager.instance;
  }

  /**
   * 初始化：加载内置skill包 + 已安装的skill包
   */
  async initialize(): Promise<void> {
    await this.loadBuiltinSkills();
    await this.loadInstalledSkills();
    console.log(`[SkillManager] 初始化完成: ${this.skills.size} 个skill`);
  }

  /**
   * 加载内置skill包（从扩展dist/resources/builtin-packages目录）
   */
  private async loadBuiltinSkills(): Promise<void> {
    // 使用 extensionPath 而非 __dirname，确保编译后路径正确
    const builtinDir = path.join(this.context.extensionPath, 'dist', 'resources', 'builtin-packages');
    
    if (!fs.existsSync(builtinDir)) {
      console.log('[SkillManager] 内置skill包目录不存在:', builtinDir);
      // 兼容开发模式：尝试从 src 目录加载
      const devDir = path.join(this.context.extensionPath, 'src', 'extension', 'skills', 'builtin-packages');
      if (fs.existsSync(devDir)) {
        console.log('[SkillManager] 使用开发模式路径:', devDir);
        return this._loadBuiltinFromDir(devDir);
      }
      return;
    }

    return this._loadBuiltinFromDir(builtinDir);
  }

  private async _loadBuiltinFromDir(builtinDir: string): Promise<void> {    const entries = fs.readdirSync(builtinDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(builtinDir, entry.name);
      const manifestPath = path.join(skillDir, 'manifest.json');

      if (!fs.existsSync(manifestPath)) continue;

      try {
        const loadResult = await this.loader.loadFromDirectory(skillDir);
        if (!loadResult.success || !loadResult.manifest) continue;

        const manifest = loadResult.manifest;

        // 内置skill不覆盖用户已安装的同ID skill
        if (this.skills.has(manifest.id)) continue;

        const skill: InstalledSkill = {
          manifest,
          installPath: skillDir,
          installedAt: 0, // 内置标记
          status: 'active',
          source: { type: 'local', localPath: skillDir },
        };

        this.skills.set(manifest.id, skill);
      } catch (err) {
        console.error(`[SkillManager] 加载内置skill失败 ${entry.name}:`, err);
      }
    }
  }

  /**
   * 加载已安装的skills（从globalState）
   */
  private async loadInstalledSkills(): Promise<void> {
    const saved = this.context.globalState.get<InstalledSkill[]>(STORAGE_KEY) || [];

    for (const skill of saved) {
      if (!fs.existsSync(skill.installPath)) continue;
      
      this.skills.set(skill.manifest.id, skill);

      if (skill.status === 'active') {
        try {
          await this.initializeSkill(skill);
        } catch (err) {
          console.error(`初始化skill失败 ${skill.manifest.id}:`, err);
          this.updateStatus(skill.manifest.id, 'error', String(err));
        }
      }
    }
  }

  private async saveSkills(): Promise<void> {
    // 只保存用户安装的skill（内置的不需要保存）
    const userSkills = Array.from(this.skills.values())
      .filter(s => s.installedAt > 0);
    await this.context.globalState.update(STORAGE_KEY, userSkills);
  }

  // ========== 安装方法 ==========

  async installFromLocal(
    localPath: string,
    options: SkillInstallOptions = {}
  ): Promise<{ success: boolean; skill?: InstalledSkill; error?: string }> {
    try {
      const loadResult = await this.loader.loadFromDirectory(localPath);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || '加载失败' };
      }

      const manifest = loadResult.manifest;

      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" 已安装` };
      }

      const targetDir = path.join(this.skillsDir, manifest.id);
      await this.copyDirectory(localPath, targetDir);

      const skill: InstalledSkill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? 'active' : 'installed',
        userConfig: options.config || {},
        source: { type: 'local', localPath },
      };

      this.skills.set(manifest.id, skill);
      await this.saveSkills();

      if (skill.status === 'active') {
        await this.initializeSkill(skill);
      }

      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async installFromGit(
    repoUrl: string,
    options: SkillInstallOptions & { branch?: string } = {}
  ): Promise<{ success: boolean; skill?: InstalledSkill; error?: string }> {
    const tempDir = path.join(this.skillsDir, '.temp_' + Date.now());

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      const loadResult = await this.loader.loadFromGit(repoUrl, tempDir, options.branch);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || '克隆失败' };
      }

      const manifest = loadResult.manifest;

      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" 已安装` };
      }

      const targetDir = path.join(this.skillsDir, manifest.id);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true });
      }
      fs.renameSync(tempDir, targetDir);

      const skill: InstalledSkill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? 'active' : 'installed',
        userConfig: options.config || {},
        source: { type: 'git', url: repoUrl, branch: options.branch },
      };

      this.skills.set(manifest.id, skill);
      await this.saveSkills();

      if (skill.status === 'active') {
        await this.initializeSkill(skill);
      }

      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }
  }

  async installFromUrl(
    url: string,
    options: SkillInstallOptions = {}
  ): Promise<{ success: boolean; skill?: InstalledSkill; error?: string }> {
    const tempDir = path.join(this.skillsDir, '.temp_' + Date.now());

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      const loadResult = await this.loader.loadFromUrl(url, tempDir);
      if (!loadResult.success || !loadResult.manifest) {
        return { success: false, error: loadResult.error || '下载失败' };
      }

      const manifest = loadResult.manifest;

      if (this.skills.has(manifest.id) && !options.overwrite) {
        return { success: false, error: `Skill "${manifest.id}" 已安装` };
      }

      const manifestPath = this.findFile(tempDir, 'manifest.json');
      const skillSourceDir = manifestPath ? path.dirname(manifestPath) : tempDir;

      const targetDir = path.join(this.skillsDir, manifest.id);
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true });
      }
      await this.copyDirectory(skillSourceDir, targetDir);

      const skill: InstalledSkill = {
        manifest,
        installPath: targetDir,
        installedAt: Date.now(),
        status: options.autoEnable !== false ? 'active' : 'installed',
        userConfig: options.config || {},
        source: { type: 'url', url },
      };

      this.skills.set(manifest.id, skill);
      await this.saveSkills();

      if (skill.status === 'active') {
        await this.initializeSkill(skill);
      }

      this._onSkillInstalled.fire(skill);
      return { success: true, skill };
    } catch (error) {
      return { success: false, error: String(error) };
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
    }
  }

  // ========== 管理方法 ==========

  async uninstall(skillId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const skill = this.skills.get(skillId);
      if (!skill) {
        return { success: false, error: `Skill "${skillId}" 未找到` };
      }

      // 内置skill不允许卸载
      if (skill.installedAt === 0) {
        return { success: false, error: `内置Skill "${skillId}" 不能卸载，只能禁用` };
      }

      await this.bridgeFactory.removeBridge(skillId);
      this.executor.cancel(skillId);

      if (fs.existsSync(skill.installPath)) {
        fs.rmSync(skill.installPath, { recursive: true });
      }

      this.skills.delete(skillId);
      await this.saveSkills();

      this._onSkillUninstalled.fire(skillId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async enable(skillId: string): Promise<{ success: boolean; error?: string }> {
    const skill = this.skills.get(skillId);
    if (!skill) return { success: false, error: `Skill "${skillId}" 未找到` };

    try {
      await this.initializeSkill(skill);
      await this.updateStatus(skillId, 'active');
      return { success: true };
    } catch (error) {
      await this.updateStatus(skillId, 'error', String(error));
      return { success: false, error: String(error) };
    }
  }

  async disable(skillId: string): Promise<{ success: boolean; error?: string }> {
    const skill = this.skills.get(skillId);
    if (!skill) return { success: false, error: `Skill "${skillId}" 未找到` };

    try {
      await this.bridgeFactory.removeBridge(skillId);
      this.executor.cancel(skillId);
      await this.updateStatus(skillId, 'disabled');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async execute(skillId: string, params?: Record<string, any>): Promise<SkillResult> {
    const skill = this.skills.get(skillId);
    if (!skill) return { success: false, error: `Skill "${skillId}" 未找到`, duration: 0 };
    if (skill.status !== 'active') return { success: false, error: `Skill "${skillId}" 未激活`, duration: 0 };
    return this.executor.execute(skill, params);
  }

  async update(skillId: string): Promise<{ success: boolean; error?: string }> {
    const skill = this.skills.get(skillId);
    if (!skill) return { success: false, error: `Skill "${skillId}" 未找到` };

    const source = skill.source;
    switch (source.type) {
      case 'git':
        return this.installFromGit(source.url!, { branch: source.branch, overwrite: true, config: skill.userConfig });
      case 'url':
        return this.installFromUrl(source.url!, { overwrite: true, config: skill.userConfig });
      case 'local':
        return this.installFromLocal(source.localPath!, { overwrite: true, config: skill.userConfig });
      default:
        return { success: false, error: '不支持的来源类型' };
    }
  }

  // ========== 查询方法 ==========

  getInstalledSkills(): InstalledSkill[] {
    return Array.from(this.skills.values());
  }

  getActiveSkills(): InstalledSkill[] {
    return Array.from(this.skills.values()).filter(s => s.status === 'active');
  }

  getSkill(skillId: string): InstalledSkill | undefined {
    return this.skills.get(skillId);
  }

  async getSkillMarkdown(skillId: string): Promise<SkillMarkdown | null> {
    const skill = this.skills.get(skillId);
    if (!skill) return null;
    const loadResult = await this.loader.loadFromDirectory(skill.installPath);
    return loadResult.markdown || null;
  }

  async updateConfig(skillId: string, config: Record<string, any>): Promise<{ success: boolean }> {
    const skill = this.skills.get(skillId);
    if (!skill) return { success: false };
    skill.userConfig = { ...skill.userConfig, ...config };
    skill.updatedAt = Date.now();
    await this.saveSkills();
    return { success: true };
  }

  // ========== 管理UI命令 ==========

  /**
   * 注册VSCode命令（在extension.ts中调用）
   */
  registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('aiAssistant.skill.install', () => this.showInstallDialog()),
      vscode.commands.registerCommand('aiAssistant.skill.manage', () => this.showManageDialog()),
      vscode.commands.registerCommand('aiAssistant.skill.create', () => this.showCreateDialog()),
    );
  }

  /**
   * Skill安装对话框
   */
  private async showInstallDialog(): Promise<void> {
    const source = await vscode.window.showQuickPick(
      [
        { label: '📁 从本地目录安装', description: '选择包含manifest.json的目录', value: 'local' },
        { label: '🔗 从Git仓库安装', description: '输入git clone地址', value: 'git' },
        { label: '📦 从URL下载安装', description: '输入skill包zip下载链接', value: 'url' },
      ],
      { placeHolder: '选择安装来源' }
    );

    if (!source) return;

    switch (source.value) {
      case 'local': {
        const uris = await vscode.window.showOpenDialog({
          canSelectFolders: true, canSelectFiles: false,
          openLabel: '选择Skill目录',
        });
        if (uris?.[0]) {
          const result = await this.installFromLocal(uris[0].fsPath);
          this.showInstallResult(result);
        }
        break;
      }
      case 'git': {
        const url = await vscode.window.showInputBox({
          prompt: '输入Git仓库地址',
          placeHolder: 'https://github.com/user/skill-package.git',
        });
        if (url) {
          const result = await this.installFromGit(url);
          this.showInstallResult(result);
        }
        break;
      }
      case 'url': {
        const url = await vscode.window.showInputBox({
          prompt: '输入Skill包下载链接 (zip)',
          placeHolder: 'https://example.com/skill-package.zip',
        });
        if (url) {
          const result = await this.installFromUrl(url);
          this.showInstallResult(result);
        }
        break;
      }
    }
  }

  /**
   * Skill管理对话框
   */
  private async showManageDialog(): Promise<void> {
    const skills = this.getInstalledSkills();
    if (skills.length === 0) {
      vscode.window.showInformationMessage('没有已安装的skill');
      return;
    }

    const items = skills.map(s => ({
      label: `${s.status === 'active' ? '✅' : s.status === 'disabled' ? '⏸️' : '❌'} ${s.manifest.name}`,
      description: `v${s.manifest.version} - ${s.manifest.description}`,
      detail: `ID: ${s.manifest.id} | 来源: ${s.source.type}${s.installedAt === 0 ? ' (内置)' : ''}`,
      skill: s,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: '选择要管理的skill',
    });

    if (!selected) return;

    const actions = [
      { label: selected.skill.status === 'active' ? '⏸️ 禁用' : '▶️ 启用', value: 'toggle' },
      { label: '🔄 更新', value: 'update' },
      { label: 'ℹ️ 查看详情', value: 'info' },
    ];

    if (selected.skill.installedAt > 0) {
      actions.push({ label: '🗑️ 卸载', value: 'uninstall' });
    }

    const action = await vscode.window.showQuickPick(actions, {
      placeHolder: `管理 ${selected.skill.manifest.name}`,
    });

    if (!action) return;

    switch (action.value) {
      case 'toggle':
        if (selected.skill.status === 'active') {
          await this.disable(selected.skill.manifest.id);
          vscode.window.showInformationMessage(`已禁用 ${selected.skill.manifest.name}`);
        } else {
          await this.enable(selected.skill.manifest.id);
          vscode.window.showInformationMessage(`已启用 ${selected.skill.manifest.name}`);
        }
        break;
      case 'update':
        const result = await this.update(selected.skill.manifest.id);
        if (result.success) {
          vscode.window.showInformationMessage(`已更新 ${selected.skill.manifest.name}`);
        } else {
          vscode.window.showErrorMessage(`更新失败: ${result.error}`);
        }
        break;
      case 'info':
        const md = await this.getSkillMarkdown(selected.skill.manifest.id);
        if (md) {
          const doc = await vscode.workspace.openTextDocument({ content: md.rawContent, language: 'markdown' });
          await vscode.window.showTextDocument(doc, { preview: true });
        }
        break;
      case 'uninstall':
        const confirm = await vscode.window.showWarningMessage(
          `确定要卸载 ${selected.skill.manifest.name}?`, { modal: true }, '确认卸载'
        );
        if (confirm === '确认卸载') {
          await this.uninstall(selected.skill.manifest.id);
          vscode.window.showInformationMessage(`已卸载 ${selected.skill.manifest.name}`);
        }
        break;
    }
  }

  /**
   * 创建新skill对话框
   */
  private async showCreateDialog(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Skill名称',
      placeHolder: 'my-custom-skill',
      validateInput: v => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v) ? null : 'ID必须以字母开头，只能包含字母数字下划线连字符',
    });

    if (!name) return;

    const uris = await vscode.window.showOpenDialog({
      canSelectFolders: true, canSelectFiles: false,
      openLabel: '选择创建位置',
    });

    if (!uris?.[0]) return;

    const targetDir = path.join(uris[0].fsPath, name);
    // 使用 extensionPath 定位模板目录
    let templateDir = path.join(this.context.extensionPath, 'dist', 'resources', 'templates', 'example-skill');
    if (!fs.existsSync(templateDir)) {
      // 兼容开发模式
      templateDir = path.join(this.context.extensionPath, 'src', 'extension', 'skills', 'templates', 'example-skill');
    }

    try {
      await this.copyDirectory(templateDir, targetDir);

      // 更新manifest
      const manifestPath = path.join(targetDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest.id = name;
      manifest.name = name;
      manifest.description = `自定义skill: ${name}`;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // 打开目录
      const doc = await vscode.workspace.openTextDocument(manifestPath);
      await vscode.window.showTextDocument(doc);

      vscode.window.showInformationMessage(
        `Skill "${name}" 已创建在 ${targetDir}`,
        '安装到插件'
      ).then(async choice => {
        if (choice === '安装到插件') {
          const result = await this.installFromLocal(targetDir);
          this.showInstallResult(result);
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(`创建失败: ${error}`);
    }
  }

  private showInstallResult(result: { success: boolean; skill?: InstalledSkill; error?: string }): void {
    if (result.success) {
      vscode.window.showInformationMessage(`✅ Skill "${result.skill!.manifest.name}" 安装成功`);
    } else {
      vscode.window.showErrorMessage(`❌ 安装失败: ${result.error}`);
    }
  }

  // ========== 内部方法 ==========

  private async initializeSkill(skill: InstalledSkill): Promise<void> {
    const bridge = this.bridgeFactory.createBridge(skill);
    await bridge.registerProvidedTools();
    console.log(`[SkillManager] 初始化skill: ${skill.manifest.id}`);
  }

  private async updateStatus(skillId: string, status: SkillStatus, error?: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.status = status;
      skill.error = error;
      skill.updatedAt = Date.now();
      await this.saveSkills();
      this._onSkillStatusChanged.fire({ id: skillId, status });
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private findFile(dir: string, filename: string): string | null {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === filename) return fullPath;
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const found = this.findFile(fullPath, filename);
        if (found) return found;
      }
    }
    return null;
  }
}
