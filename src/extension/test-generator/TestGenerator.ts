import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GeneratedTest, TestFramework } from '../../types/shared';

export class TestGenerator {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 根据文件扩展名检测语言和对应的测试框架
   */
  detectLanguageAndFramework(filePath: string, workspaceRoot: string): { language: string; framework: TestFramework } {
    const ext = path.extname(filePath).toLowerCase();
    
    // 根据文件扩展名确定语言
    const langMap: Record<string, { language: string; defaultFramework: TestFramework }> = {
      '.py': { language: 'python', defaultFramework: 'pytest' },
      '.go': { language: 'go', defaultFramework: 'go' },
      '.java': { language: 'java', defaultFramework: 'junit' },
      '.kt': { language: 'kotlin', defaultFramework: 'junit' },
      '.kts': { language: 'kotlin', defaultFramework: 'junit' },
      '.ts': { language: 'typescript', defaultFramework: 'jest' },
      '.tsx': { language: 'typescript', defaultFramework: 'jest' },
      '.js': { language: 'javascript', defaultFramework: 'jest' },
      '.jsx': { language: 'javascript', defaultFramework: 'jest' },
      '.mjs': { language: 'javascript', defaultFramework: 'jest' },
      '.cjs': { language: 'javascript', defaultFramework: 'jest' },
      '.rs': { language: 'rust', defaultFramework: 'jest' }, // Rust 使用内置测试
      '.rb': { language: 'ruby', defaultFramework: 'jest' }, // Ruby 使用 RSpec
      '.cs': { language: 'csharp', defaultFramework: 'jest' }, // C# 使用 xUnit/NUnit
      '.php': { language: 'php', defaultFramework: 'jest' }, // PHP 使用 PHPUnit
      '.swift': { language: 'swift', defaultFramework: 'jest' }, // Swift 使用 XCTest
      '.scala': { language: 'scala', defaultFramework: 'jest' }, // Scala 使用 ScalaTest
    };

    const detected = langMap[ext] || { language: 'code', defaultFramework: 'jest' };
    
    // 对于JS/TS项目，检查具体使用的测试框架
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps['vitest']) return { language: detected.language, framework: 'vitest' };
          if (deps['jest']) return { language: detected.language, framework: 'jest' };
          if (deps['mocha']) return { language: detected.language, framework: 'mocha' };
        } catch {}
      }
    }

    return { language: detected.language, framework: detected.defaultFramework };
  }

  async detectFramework(workspaceRoot: string): Promise<TestFramework> {
    // Check package.json for JS/TS projects
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['vitest']) return 'vitest';
        if (deps['jest']) return 'jest';
        if (deps['mocha']) return 'mocha';
      } catch {}
    }

    // Check for Python
    if (fs.existsSync(path.join(workspaceRoot, 'pytest.ini')) ||
        fs.existsSync(path.join(workspaceRoot, 'pyproject.toml')) ||
        fs.existsSync(path.join(workspaceRoot, 'requirements.txt'))) {
      return 'pytest';
    }

    // Check for Go
    if (fs.existsSync(path.join(workspaceRoot, 'go.mod'))) {
      return 'go';
    }

    // Check for Java
    if (fs.existsSync(path.join(workspaceRoot, 'pom.xml')) ||
        fs.existsSync(path.join(workspaceRoot, 'build.gradle'))) {
      return 'junit';
    }

    return 'jest'; // Default
  }

  generateTestFilePath(sourceFile: string, framework: TestFramework): string {
    const dir = path.dirname(sourceFile);
    const ext = path.extname(sourceFile);
    const base = path.basename(sourceFile, ext);

    // 确保 base 不为空
    const safeName = base || 'unnamed';
    
    switch (framework) {
      case 'pytest':
        // Python: test_xxx.py 或 xxx_test.py (使用后者)
        return path.join(dir, `${safeName}_test.py`);
      case 'go':
        // Go: xxx_test.go
        return path.join(dir, `${safeName}_test.go`);
      case 'junit':
        // Java: XxxTest.java
        return path.join(dir, `${safeName}Test.java`);
      case 'jest':
      case 'vitest':
      case 'mocha':
      default:
        // JS/TS: xxx_test.ts 或 xxx_test.js (改用下划线)
        const testExt = ext || '.js';
        return path.join(dir, `${safeName}_test${testExt}`);
    }
  }

  generatePrompt(sourceCode: string, filePath: string, framework: TestFramework): string {
    const ext = path.extname(filePath);
    const lang = this.getLanguage(ext);

    const frameworkGuide = this.getFrameworkGuide(framework);

    return `Generate comprehensive unit tests for the following ${lang} code using ${framework}.

Source file: ${path.basename(filePath)}
Language: ${lang}

\`\`\`${lang}
${sourceCode}
\`\`\`

${frameworkGuide}

Requirements:
1. Test all public functions/methods
2. Include edge cases and error handling
3. Use descriptive test names in ${lang}
4. Add necessary imports for ${lang}
5. Follow ${framework} best practices
6. The output must be valid ${lang} code

IMPORTANT: Generate ONLY the test code in ${lang}, no markdown, no explanations, no code block markers.`;
  }

  private getLanguage(ext: string): string {
    const map: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.mts': 'typescript',
      '.cts': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.kt': 'kotlin',
      '.kts': 'kotlin',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.php': 'php',
      '.swift': 'swift',
      '.scala': 'scala',
      '.cpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.lua': 'lua',
      '.r': 'r',
      '.dart': 'dart',
      '.ex': 'elixir',
      '.exs': 'elixir',
      '.erl': 'erlang',
      '.clj': 'clojure',
      '.hs': 'haskell',
      '.ml': 'ocaml',
      '.fs': 'fsharp',
      '.groovy': 'groovy',
      '.pl': 'perl',
      '.vue': 'vue',
      '.svelte': 'svelte',
    };
    return map[ext] || 'code';
  }

  private getFrameworkGuide(framework: TestFramework): string {
    const guides: Record<TestFramework, string> = {
      jest: `Use Jest with:
- describe() for test suites
- it() or test() for test cases
- expect() for assertions
- beforeEach/afterEach for setup/teardown`,

      vitest: `Use Vitest with:
- describe() for test suites
- it() or test() for test cases
- expect() for assertions
- vi.fn() for mocks`,

      mocha: `Use Mocha with Chai:
- describe() for test suites
- it() for test cases
- expect() from chai for assertions`,

      pytest: `Use pytest with:
- test_ prefix for test functions or methods
- assert statements for assertions
- @pytest.fixture for fixtures
- @pytest.mark.parametrize for parameterized tests
- Use Python syntax only`,

      junit: `Use JUnit 5 with:
- @Test annotation
- @BeforeEach/@AfterEach for setup
- Assertions class for assertions
- @DisplayName for readable names`,

      go: `Use Go testing with:
- func TestXxx(t *testing.T) naming
- t.Run() for subtests
- t.Errorf() for failures
- table-driven tests pattern`,
    };
    return guides[framework];
  }

  /**
   * 提取测试代码，清理代码块标记
   */
  extractTestCode(response: string, expectedLanguage?: string): string {
    // 移除所有代码块标记
    let code = response;
    
    // 匹配并移除 ```language 开始标记
    code = code.replace(/^```[\w]*\s*\n?/gm, '');
    // 移除结束标记
    code = code.replace(/\n?```\s*$/gm, '');
    code = code.replace(/```/g, '');
    
    // 清理开头和结尾的空白
    code = code.trim();
    
    // 如果代码以语言标识符开头（比如 javascript, python），移除它
    const langPatterns = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'ruby'];
    for (const lang of langPatterns) {
      if (code.toLowerCase().startsWith(lang + '\n')) {
        code = code.substring(lang.length + 1);
        break;
      }
    }
    
    return code.trim();
  }

  async saveTestFile(
    testCode: string,
    testPath: string,
    overwrite: boolean = false
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      if (fs.existsSync(testPath) && !overwrite) {
        return { success: false, error: 'File already exists' };
      }

      const dir = path.dirname(testPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 清理代码中可能残留的代码块标记
      const cleanCode = this.extractTestCode(testCode);
      
      fs.writeFileSync(testPath, cleanCode, 'utf-8');
      return { success: true, path: testPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getTestCommand(framework: TestFramework, testPath: string): string {
    const commands: Record<TestFramework, string> = {
      jest: `npx jest "${testPath}"`,
      vitest: `npx vitest run "${testPath}"`,
      mocha: `npx mocha "${testPath}"`,
      pytest: `python -m pytest "${testPath}" -v`,
      junit: `mvn test -Dtest=${path.basename(testPath, '.java')}`,
      go: `go test -v -run ${path.basename(testPath, '_test.go')}`,
    };
    return commands[framework];
  }

  /**
   * 根据测试文件路径检测应该使用的测试框架
   */
  detectFrameworkByTestPath(testPath: string, workspaceRoot: string): TestFramework {
    const ext = path.extname(testPath).toLowerCase();
    
    // 根据文件扩展名确定基础框架
    const extFrameworks: Record<string, TestFramework> = {
      '.py': 'pytest',
      '.go': 'go',
      '.java': 'junit',
      '.kt': 'junit',
      '.rs': 'go', // Rust uses cargo test, but we treat it like go
    };

    // 如果是Python/Go/Java等明确的语言，直接返回对应框架
    if (extFrameworks[ext]) {
      return extFrameworks[ext];
    }

    // 对于JS/TS，检查项目中实际使用的框架
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps['vitest']) return 'vitest';
          if (deps['jest']) return 'jest';
          if (deps['mocha']) return 'mocha';
        } catch {}
      }
      return 'jest'; // JS/TS 默认使用 jest
    }

    // 默认情况下返回默认框架
    // 注意：这里不调用async的detectFramework，以保持同步
    return 'jest' as TestFramework;
  }

  /**
   * 获取运行测试的完整命令（根据文件路径智能判断）
   */
  getSmartTestCommand(testPath: string, workspaceRoot: string): string {
    const ext = path.extname(testPath).toLowerCase();
    const testFileName = path.basename(testPath);
    
    // Python
    if (ext === '.py') {
      // 检查是否使用 unittest 或 pytest
      if (fs.existsSync(path.join(workspaceRoot, 'pytest.ini')) ||
          fs.existsSync(path.join(workspaceRoot, 'pyproject.toml')) ||
          fs.existsSync(path.join(workspaceRoot, 'setup.cfg'))) {
        return `python -m pytest "${testPath}" -v`;
      }
      // 检查文件内容判断框架
      try {
        const content = fs.readFileSync(testPath, 'utf-8');
        if (content.includes('import unittest') || content.includes('from unittest')) {
          return `python -m unittest "${testPath}" -v`;
        }
      } catch {}
      // 默认使用 pytest
      return `python -m pytest "${testPath}" -v`;
    }
    
    // Go
    if (ext === '.go') {
      const dir = path.dirname(testPath);
      const testName = path.basename(testPath, '_test.go');
      // Go 测试需要在包目录下运行
      return `cd "${dir}" && go test -v -run "Test${this.capitalizeFirst(testName)}"`;
    }
    
    // Java
    if (ext === '.java') {
      const testName = path.basename(testPath, '.java');
      // 检测是 Maven 还是 Gradle
      if (fs.existsSync(path.join(workspaceRoot, 'pom.xml'))) {
        return `mvn test -Dtest="${testName}"`;
      } else if (fs.existsSync(path.join(workspaceRoot, 'build.gradle')) || 
                 fs.existsSync(path.join(workspaceRoot, 'build.gradle.kts'))) {
        // Windows/Unix 兼容
        const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        return `${gradleCmd} test --tests "${testName}"`;
      }
      return `mvn test -Dtest="${testName}"`;
    }
    
    // Kotlin
    if (ext === '.kt') {
      const testName = path.basename(testPath, '.kt');
      const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      return `${gradleCmd} test --tests "${testName}"`;
    }
    
    // Rust
    if (ext === '.rs') {
      // Rust 测试通过 cargo test 运行
      // 尝试提取模块名
      const testName = path.basename(testPath, '.rs');
      if (testName === 'lib' || testName === 'main') {
        return 'cargo test';
      }
      return `cargo test ${testName}::`;
    }
    
    // Ruby
    if (ext === '.rb') {
      if (testPath.includes('_spec.rb')) {
        // RSpec
        return `bundle exec rspec "${testPath}"`;
      } else if (testPath.includes('_test.rb')) {
        // Minitest
        return `ruby -Ilib:test "${testPath}"`;
      }
      return `ruby "${testPath}"`;
    }
    
    // C#
    if (ext === '.cs') {
      const testName = path.basename(testPath, '.cs');
      return `dotnet test --filter "FullyQualifiedName~${testName}"`;
    }
    
    // PHP
    if (ext === '.php') {
      if (testPath.includes('Test.php')) {
        return `./vendor/bin/phpunit "${testPath}"`;
      }
      return `php "${testPath}"`;
    }
    
    // Swift
    if (ext === '.swift') {
      return `swift test`;
    }

    // JavaScript/TypeScript - 检测具体框架
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          const scripts = pkg.scripts || {};
          
          // 检查是否有测试脚本
          if (scripts.test) {
            // 如果有 test 脚本，检查它使用的框架
            const testScript = scripts.test;
            if (testScript.includes('vitest')) {
              return `npx vitest run "${testPath}"`;
            }
            if (testScript.includes('jest')) {
              return `npx jest "${testPath}"`;
            }
            if (testScript.includes('mocha')) {
              return `npx mocha "${testPath}"`;
            }
            if (testScript.includes('ava')) {
              return `npx ava "${testPath}"`;
            }
            if (testScript.includes('tap')) {
              return `npx tap "${testPath}"`;
            }
          }
          
          // 根据依赖判断
          if (deps['vitest']) return `npx vitest run "${testPath}"`;
          if (deps['jest']) return `npx jest "${testPath}"`;
          if (deps['mocha']) return `npx mocha "${testPath}"`;
          if (deps['ava']) return `npx ava "${testPath}"`;
          if (deps['tap']) return `npx tap "${testPath}"`;
          if (deps['jasmine']) return `npx jasmine "${testPath}"`;
          
          // Deno 检测
          if (fs.existsSync(path.join(workspaceRoot, 'deno.json')) ||
              fs.existsSync(path.join(workspaceRoot, 'deno.jsonc'))) {
            return `deno test "${testPath}"`;
          }
          
          // Bun 检测
          if (fs.existsSync(path.join(workspaceRoot, 'bun.lockb'))) {
            return `bun test "${testPath}"`;
          }
        } catch {}
      }
      
      // 默认使用 jest
      return `npx jest "${testPath}"`;
    }
    
    // 默认返回 jest 命令
    return `npx jest "${testPath}"`;
  }

  /**
   * 首字母大写
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateTemplate(framework: TestFramework, className?: string): string {
    const templates: Record<TestFramework, string> = {
      jest: `describe('${className || 'Module'}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});`,

      vitest: `import { describe, it, expect, beforeEach } from 'vitest';

describe('${className || 'Module'}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});`,

      mocha: `const { expect } = require('chai');

describe('${className || 'Module'}', () => {
  beforeEach(() => {
    // Setup
  });

  it('should work correctly', () => {
    expect(true).to.be.true;
  });
});`,

      pytest: `import pytest

class Test${className || 'Module'}:
    @pytest.fixture(autouse=True)
    def setup(self):
        # Setup
        pass

    def test_should_work_correctly(self):
        assert True`,

      junit: `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class ${className || 'Module'}Test {
    @BeforeEach
    void setUp() {
        // Setup
    }

    @Test
    @DisplayName("Should work correctly")
    void shouldWorkCorrectly() {
        assertTrue(true);
    }
}`,

      go: `package main

import "testing"

func Test${className || 'Module'}(t *testing.T) {
    t.Run("should work correctly", func(t *testing.T) {
        if true != true {
            t.Error("Expected true")
        }
    })
}`,
    };
    return templates[framework];
  }
}
