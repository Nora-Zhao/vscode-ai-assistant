/**
 * Skill包加载器
 * 
 * 负责加载、解析和验证skill包
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SkillManifest, SkillMarkdown, SkillSource } from './types';

export class SkillLoader {
  private static instance: SkillLoader | null = null;

  static getInstance(): SkillLoader {
    if (!SkillLoader.instance) {
      SkillLoader.instance = new SkillLoader();
    }
    return SkillLoader.instance;
  }

  /**
   * 从目录加载skill包
   */
  async loadFromDirectory(dirPath: string): Promise<{
    success: boolean;
    manifest?: SkillManifest;
    markdown?: SkillMarkdown;
    error?: string;
  }> {
    try {
      if (!fs.existsSync(dirPath)) {
        return { success: false, error: `目录不存在: ${dirPath}` };
      }

      // 读取 manifest.json
      const manifestPath = path.join(dirPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        return { success: false, error: 'manifest.json 文件不存在' };
      }

      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as SkillManifest;

      // 验证清单
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 读取 SKILL.md
      const skillFilePath = path.join(dirPath, manifest.skillFile || 'SKILL.md');
      let markdown: SkillMarkdown | undefined;

      if (fs.existsSync(skillFilePath)) {
        const rawContent = fs.readFileSync(skillFilePath, 'utf-8');
        markdown = this.parseSkillMarkdown(rawContent);
      }

      return { success: true, manifest, markdown };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '加载失败',
      };
    }
  }

  /**
   * 从Git仓库克隆skill包
   */
  async loadFromGit(
    repoUrl: string,
    targetDir: string,
    branch?: string
  ): Promise<{
    success: boolean;
    manifest?: SkillManifest;
    markdown?: SkillMarkdown;
    error?: string;
  }> {
    try {
      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 使用git clone
      const { execSync } = require('child_process');
      const branchArg = branch ? `-b ${branch}` : '';

      execSync(`git clone ${branchArg} --depth 1 "${repoUrl}" "${targetDir}"`, {
        stdio: 'pipe',
        timeout: 120000,
      });

      return this.loadFromDirectory(targetDir);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '克隆仓库失败',
      };
    }
  }

  /**
   * 从URL下载skill包（zip格式）
   */
  async loadFromUrl(
    url: string,
    targetDir: string
  ): Promise<{
    success: boolean;
    manifest?: SkillManifest;
    markdown?: SkillMarkdown;
    error?: string;
  }> {
    try {
      const https = require('https');
      const http = require('http');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const tempZipPath = path.join(targetDir, '_temp_skill.zip');

      // 下载文件
      await new Promise<void>((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(tempZipPath);

        const request = protocol.get(url, (response: any) => {
          // 处理重定向
          if (response.statusCode === 301 || response.statusCode === 302) {
            file.close();
            fs.unlinkSync(tempZipPath);
            this.loadFromUrl(response.headers.location, targetDir)
              .then(() => resolve())
              .catch(reject);
            return;
          }

          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        });

        request.on('error', (err: Error) => {
          file.close();
          fs.unlinkSync(tempZipPath);
          reject(err);
        });

        request.setTimeout(60000, () => {
          request.destroy();
          reject(new Error('下载超时'));
        });
      });

      // 解压
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(targetDir, true);

      // 删除临时文件
      fs.unlinkSync(tempZipPath);

      // 查找manifest.json（可能在子目录中）
      const manifestPath = this.findFile(targetDir, 'manifest.json');
      if (!manifestPath) {
        return { success: false, error: '压缩包中未找到 manifest.json' };
      }

      return this.loadFromDirectory(path.dirname(manifestPath));
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载失败',
      };
    }
  }

  /**
   * 验证清单文件
   */
  validateManifest(manifest: SkillManifest): { valid: boolean; error?: string } {
    if (!manifest.id) {
      return { valid: false, error: '缺少必填字段: id' };
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(manifest.id)) {
      return { valid: false, error: 'id 格式无效，必须以字母开头，只能包含字母、数字、下划线和连字符' };
    }

    if (!manifest.name) {
      return { valid: false, error: '缺少必填字段: name' };
    }

    if (!manifest.version) {
      return { valid: false, error: '缺少必填字段: version' };
    }

    if (!manifest.description) {
      return { valid: false, error: '缺少必填字段: description' };
    }

    // 验证运行时
    const validRuntimes = ['node', 'python', 'shell', 'builtin'];
    if (manifest.runtime && !validRuntimes.includes(manifest.runtime)) {
      return { valid: false, error: `无效的运行时: ${manifest.runtime}` };
    }

    return { valid: true };
  }

  /**
   * 解析SKILL.md文件
   */
  parseSkillMarkdown(content: string): SkillMarkdown {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');

    let currentSection = 'description';
    let currentContent: string[] = [];
    let title = '';

    for (const line of lines) {
      // 检测一级标题
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match && !title) {
        title = h1Match[1].trim();
        continue;
      }

      // 检测二级标题
      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = this.normalizeSectionName(h2Match[1].trim());
        currentContent = [];
        continue;
      }

      currentContent.push(line);
    }

    // 保存最后一个section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    // 提取示例
    const examples: string[] = [];
    const exampleContent = sections['examples'] || sections['usage'] || '';
    const codeBlocks = exampleContent.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      examples.push(...codeBlocks.map(b => b.replace(/```\w*\n?/g, '').trim()));
    }

    return {
      title: title || 'Untitled Skill',
      description: sections['description']?.split('\n\n')[0] || '',
      usage: sections['usage'] || sections['使用说明'],
      examples,
      aiPrompt: sections['ai-prompt'] || sections['prompt'] || sections['ai提示词'],
      configuration: sections['configuration'] || sections['config'] || sections['配置'],
      rawContent: content,
      sections,
    };
  }

  /**
   * 规范化section名称
   */
  private normalizeSectionName(name: string): string {
    const mapping: Record<string, string> = {
      '描述': 'description',
      '使用说明': 'usage',
      '用法': 'usage',
      '示例': 'examples',
      '例子': 'examples',
      '配置': 'configuration',
      'ai提示词': 'ai-prompt',
      '提示词': 'ai-prompt',
    };

    const lower = name.toLowerCase();
    return mapping[lower] || lower.replace(/\s+/g, '-');
  }

  /**
   * 在目录中查找文件
   */
  private findFile(dir: string, filename: string, maxDepth = 2): string | null {
    const search = (currentDir: string, depth: number): string | null => {
      if (depth > maxDepth) return null;

      const filePath = path.join(currentDir, filename);
      if (fs.existsSync(filePath)) {
        return filePath;
      }

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const found = search(path.join(currentDir, entry.name), depth + 1);
          if (found) return found;
        }
      }

      return null;
    };

    return search(dir, 0);
  }

  /**
   * 列出skill目录中的脚本文件
   */
  listScripts(skillDir: string): string[] {
    const scriptsDir = path.join(skillDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) return [];

    const scripts: string[] = [];
    const entries = fs.readdirSync(scriptsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.ts', '.py', '.sh'].includes(ext)) {
          scripts.push(path.join(scriptsDir, entry.name));
        }
      }
    }

    return scripts;
  }

  /**
   * 列出skill目录中的资源文件
   */
  listResources(skillDir: string): string[] {
    const srcDir = path.join(skillDir, 'src');
    if (!fs.existsSync(srcDir)) return [];

    const resources: string[] = [];

    const scan = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else {
          resources.push(fullPath);
        }
      }
    };

    scan(srcDir);
    return resources;
  }
}
