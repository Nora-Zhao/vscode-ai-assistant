import * as fs from 'fs';
import * as path from 'path';
import { ILanguageAdapter, SupportedLanguage } from '../interfaces';

/**
 * 语言适配器基类
 * 提供通用的文件操作和字符串处理方法
 */
export abstract class BaseLanguageAdapter implements ILanguageAdapter {
  abstract readonly language: SupportedLanguage;
  abstract detect(workspaceRoot: string): Promise<boolean>;
  abstract getDependencyFile(workspaceRoot: string): string | undefined;
  abstract getAuditCommand(): string;
  abstract getTestCommand(testFile?: string): string;
  abstract getBuildCommand(): string;
  abstract getFormatCommand(): string;
  abstract getLintCommand(): string;
  abstract getTestFilePattern(sourceFile: string): string;
  abstract getTestTemplate(className?: string): string;
  abstract getCodeReviewFocus(): string[];
  abstract parseDependencies(content: string): string[];

  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  protected async readFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
  }

  protected getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  protected getBaseName(filePath: string, ext?: string): string {
    return path.basename(filePath, ext || this.getExtension(filePath));
  }

  protected getDirName(filePath: string): string {
    return path.dirname(filePath);
  }

  protected capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  protected toPascalCase(str: string): string {
    return str.split(/[-_]/).map(s => this.capitalize(s)).join('');
  }

  protected toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  protected toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}
