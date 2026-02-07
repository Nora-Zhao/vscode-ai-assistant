import * as path from 'path';
import * as fs from 'fs';
import { ILanguageAdapter, ProjectContext, ProjectType, SupportedLanguage } from '../interfaces';
import { NodeAdapter } from './NodeAdapter';
import { JavaAdapter } from './JavaAdapter';
import { PythonAdapter } from './PythonAdapter';
import { GoAdapter } from './GoAdapter';

export { BaseLanguageAdapter } from './BaseAdapter';
export { NodeAdapter } from './NodeAdapter';
export { JavaAdapter } from './JavaAdapter';
export { PythonAdapter } from './PythonAdapter';
export { GoAdapter } from './GoAdapter';

/**
 * 语言检测器
 * 自动检测项目类型并返回对应的语言适配器
 */
export class LanguageDetector {
  private adapters: ILanguageAdapter[] = [
    new NodeAdapter(),
    new JavaAdapter(),
    new PythonAdapter(),
    new GoAdapter(),
  ];

  /**
   * 检测项目并返回完整的项目上下文
   */
  async detectProject(workspaceRoot: string): Promise<ProjectContext> {
    for (const adapter of this.adapters) {
      if (await adapter.detect(workspaceRoot)) {
        return {
          root: workspaceRoot,
          type: this.getProjectType(adapter.language, workspaceRoot),
          language: adapter.language,
          framework: await this.detectFramework(workspaceRoot, adapter.language),
          dependencyFile: adapter.getDependencyFile(workspaceRoot),
          testFramework: await this.detectTestFramework(workspaceRoot, adapter.language),
          packageManager: this.detectPackageManager(workspaceRoot),
          buildTool: this.detectBuildTool(workspaceRoot),
        };
      }
    }

    return {
      root: workspaceRoot,
      type: 'unknown',
      language: 'unknown',
    };
  }

  /**
   * 根据文件路径获取对应的适配器
   */
  getAdapterForFile(filePath: string): ILanguageAdapter | undefined {
    const ext = path.extname(filePath).toLowerCase();
    const extToLang: Record<string, SupportedLanguage> = {
      '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
      '.py': 'python', '.java': 'java', '.go': 'go',
    };
    const lang = extToLang[ext];
    return lang ? this.adapters.find(a => a.language === lang || (lang === 'javascript' && a.language === 'typescript')) : undefined;
  }

  /**
   * 获取所有适配器
   */
  getAdapters(): ILanguageAdapter[] {
    return [...this.adapters];
  }

  private getProjectType(language: SupportedLanguage, root: string): ProjectType {
    if (language === 'typescript' || language === 'javascript') return 'node';
    if (language === 'python') return 'python';
    if (language === 'go') return 'go';
    if (language === 'java') {
      return fs.existsSync(path.join(root, 'pom.xml')) ? 'java-maven' : 'java-gradle';
    }
    return 'unknown';
  }

  private async detectFramework(root: string, language: SupportedLanguage): Promise<string | undefined> {
    try {
      if (language === 'typescript' || language === 'javascript') {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['next']) return 'Next.js';
        if (deps['nuxt']) return 'Nuxt';
        if (deps['@angular/core']) return 'Angular';
        if (deps['vue']) return 'Vue';
        if (deps['react']) return 'React';
        if (deps['express']) return 'Express';
        if (deps['@nestjs/core']) return 'NestJS';
      }
      if (language === 'java') {
        const pomPath = path.join(root, 'pom.xml');
        if (fs.existsSync(pomPath)) {
          const content = fs.readFileSync(pomPath, 'utf-8');
          if (content.includes('spring-boot')) return 'Spring Boot';
          if (content.includes('quarkus')) return 'Quarkus';
        }
      }
      if (language === 'python') {
        if (fs.existsSync(path.join(root, 'manage.py'))) return 'Django';
        const reqPath = path.join(root, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
          const content = fs.readFileSync(reqPath, 'utf-8');
          if (content.includes('flask')) return 'Flask';
          if (content.includes('fastapi')) return 'FastAPI';
        }
      }
      if (language === 'go') {
        const goModPath = path.join(root, 'go.mod');
        if (fs.existsSync(goModPath)) {
          const content = fs.readFileSync(goModPath, 'utf-8');
          if (content.includes('gin-gonic/gin')) return 'Gin';
          if (content.includes('labstack/echo')) return 'Echo';
          if (content.includes('gofiber/fiber')) return 'Fiber';
        }
      }
    } catch { /* ignore */ }
    return undefined;
  }

  private async detectTestFramework(root: string, language: SupportedLanguage): Promise<string | undefined> {
    try {
      if (language === 'typescript' || language === 'javascript') {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['vitest']) return 'Vitest';
        if (deps['jest']) return 'Jest';
        if (deps['mocha']) return 'Mocha';
      }
      if (language === 'java') return 'JUnit 5';
      if (language === 'python') return 'pytest';
      if (language === 'go') return 'testing';
    } catch { /* ignore */ }
    return undefined;
  }

  private detectPackageManager(root: string): string | undefined {
    if (fs.existsSync(path.join(root, 'bun.lockb'))) return 'bun';
    if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm';
    if (fs.existsSync(path.join(root, 'Pipfile.lock'))) return 'pipenv';
    if (fs.existsSync(path.join(root, 'poetry.lock'))) return 'poetry';
    return undefined;
  }

  private detectBuildTool(root: string): string | undefined {
    if (fs.existsSync(path.join(root, 'vite.config.ts')) || fs.existsSync(path.join(root, 'vite.config.js'))) return 'Vite';
    if (fs.existsSync(path.join(root, 'webpack.config.js'))) return 'Webpack';
    if (fs.existsSync(path.join(root, 'rollup.config.js'))) return 'Rollup';
    if (fs.existsSync(path.join(root, 'pom.xml'))) return 'Maven';
    if (fs.existsSync(path.join(root, 'build.gradle')) || fs.existsSync(path.join(root, 'build.gradle.kts'))) return 'Gradle';
    if (fs.existsSync(path.join(root, 'Cargo.toml'))) return 'Cargo';
    return undefined;
  }
}

/** 单例导出 */
export const languageDetector = new LanguageDetector();
