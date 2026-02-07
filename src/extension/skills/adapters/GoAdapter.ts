import * as path from 'path';
import { SupportedLanguage } from '../interfaces';
import { BaseLanguageAdapter } from './BaseAdapter';

/**
 * Go 语言适配器
 * 支持 Go Modules，内置 testing 包
 */
export class GoAdapter extends BaseLanguageAdapter {
  readonly language: SupportedLanguage = 'go';
  private moduleName = '';

  async detect(workspaceRoot: string): Promise<boolean> {
    const goModPath = path.join(workspaceRoot, 'go.mod');
    if (await this.fileExists(goModPath)) {
      await this.extractModuleName(goModPath);
      return true;
    }
    return false;
  }

  private async extractModuleName(goModPath: string): Promise<void> {
    try {
      const content = await this.readFile(goModPath);
      const match = content.match(/^module\s+(.+)$/m);
      if (match) this.moduleName = match[1].trim();
    } catch {
      this.moduleName = '';
    }
  }

  getDependencyFile(workspaceRoot: string): string | undefined {
    return path.join(workspaceRoot, 'go.mod');
  }

  getAuditCommand(): string {
    return 'govulncheck ./...';
  }

  getTestCommand(testFile?: string): string {
    return testFile ? `go test -v ${testFile}` : 'go test -v ./...';
  }

  getBuildCommand(): string {
    return 'go build ./...';
  }

  getFormatCommand(): string {
    return 'gofmt -w .';
  }

  getLintCommand(): string {
    return 'golangci-lint run';
  }

  getTestFilePattern(sourceFile: string): string {
    const base = this.getBaseName(sourceFile, '.go');
    const dir = this.getDirName(sourceFile);
    return path.join(dir, `${base}_test.go`);
  }

  getTestTemplate(className?: string): string {
    const name = className || 'MyFunc';
    return `package main

import (
	"testing"
)

func Test${name}(t *testing.T) {
	t.Run("should work correctly", func(t *testing.T) {
		// Arrange
		// TODO: Setup test data

		// Act
		// TODO: Call the function under test

		// Assert
		// TODO: Verify the results
	})
}

func Benchmark${name}(b *testing.B) {
	for i := 0; i < b.N; i++ {
		// TODO: Call the function under test
	}
}
`;
  }

  getCodeReviewFocus(): string[] {
    return [
      '检查 Goroutine 泄漏风险',
      '检查 Error 是否正确处理 (不能忽略)',
      '检查 Channel 的正确使用和关闭',
      '检查 defer 的使用时机',
      '检查 Context 的传递和取消',
      '检查并发安全 (race condition)',
    ];
  }

  parseDependencies(content: string): string[] {
    const deps: string[] = [];
    const requireBlock = content.match(/require\s*\(([^)]+)\)/s);
    if (requireBlock) {
      const lines = requireBlock[1].split('\n');
      for (const line of lines) {
        const match = line.trim().match(/^([^\s]+)\s+v/);
        if (match) deps.push(match[1]);
      }
    }
    // Single require statements
    const singleRequires = content.matchAll(/require\s+([^\s]+)\s+v/g);
    for (const match of singleRequires) {
      deps.push(match[1]);
    }
    return deps;
  }
}
