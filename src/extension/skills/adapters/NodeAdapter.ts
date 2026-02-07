import * as path from 'path';
import { SupportedLanguage } from '../interfaces';
import { BaseLanguageAdapter } from './BaseAdapter';

/**
 * Node.js/TypeScript 语言适配器
 * 支持 npm/yarn/pnpm/bun 包管理器，Jest/Vitest/Mocha 测试框架
 */
export class NodeAdapter extends BaseLanguageAdapter {
  readonly language: SupportedLanguage = 'typescript';
  private packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'npm';
  private testFramework: 'jest' | 'vitest' | 'mocha' = 'jest';

  async detect(workspaceRoot: string): Promise<boolean> {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (await this.fileExists(packageJsonPath)) {
      await this.detectPackageManager(workspaceRoot);
      await this.detectTestFramework(workspaceRoot);
      return true;
    }
    return false;
  }

  private async detectPackageManager(workspaceRoot: string): Promise<void> {
    if (await this.fileExists(path.join(workspaceRoot, 'bun.lockb'))) {
      this.packageManager = 'bun';
    } else if (await this.fileExists(path.join(workspaceRoot, 'pnpm-lock.yaml'))) {
      this.packageManager = 'pnpm';
    } else if (await this.fileExists(path.join(workspaceRoot, 'yarn.lock'))) {
      this.packageManager = 'yarn';
    } else {
      this.packageManager = 'npm';
    }
  }

  private async detectTestFramework(workspaceRoot: string): Promise<void> {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    try {
      const content = await this.readFile(packageJsonPath);
      const pkg = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['vitest']) this.testFramework = 'vitest';
      else if (deps['mocha']) this.testFramework = 'mocha';
      else this.testFramework = 'jest';
    } catch {
      this.testFramework = 'jest';
    }
  }

  getDependencyFile(workspaceRoot: string): string | undefined {
    return path.join(workspaceRoot, 'package.json');
  }

  getAuditCommand(): string {
    const cmds: Record<string, string> = {
      npm: 'npm audit --json',
      yarn: 'yarn audit --json',
      pnpm: 'pnpm audit --json',
      bun: 'bun pm audit',
    };
    return cmds[this.packageManager];
  }

  getTestCommand(testFile?: string): string {
    const runCmd = this.packageManager === 'npm' ? 'npx' : this.packageManager;
    const baseCmd: Record<string, string> = {
      jest: `${runCmd} jest`,
      vitest: `${runCmd} vitest run`,
      mocha: `${runCmd} mocha`,
    };
    return testFile ? `${baseCmd[this.testFramework]} ${testFile}` : baseCmd[this.testFramework];
  }

  getBuildCommand(): string {
    return `${this.packageManager} run build`;
  }

  getFormatCommand(): string {
    return `${this.packageManager === 'npm' ? 'npx' : this.packageManager} prettier --write .`;
  }

  getLintCommand(): string {
    return `${this.packageManager === 'npm' ? 'npx' : this.packageManager} eslint .`;
  }

  getTestFilePattern(sourceFile: string): string {
    const ext = this.getExtension(sourceFile);
    const base = this.getBaseName(sourceFile, ext);
    const dir = this.getDirName(sourceFile);
    return path.join(dir, `${base}.test${ext}`);
  }

  getTestTemplate(className?: string): string {
    const name = className || 'MyClass';
    if (this.testFramework === 'vitest') {
      return `import { describe, it, expect } from 'vitest';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('should be defined', () => {
    expect(${name}).toBeDefined();
  });

  // TODO: Add more test cases
});
`;
    }
    return `import { ${name} } from './${name}';

describe('${name}', () => {
  it('should be defined', () => {
    expect(${name}).toBeDefined();
  });

  // TODO: Add more test cases
});
`;
  }

  getCodeReviewFocus(): string[] {
    return [
      '检查 Promise 是否正确处理 (await/catch)',
      '检查是否滥用 any 类型',
      '检查闭包中的变量捕获问题',
      '检查 async/await 错误处理',
      '检查空值和 undefined 的处理',
      '检查未使用的变量和导入',
    ];
  }

  parseDependencies(content: string): string[] {
    try {
      const pkg = JSON.parse(content);
      return [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
    } catch {
      return [];
    }
  }
}
