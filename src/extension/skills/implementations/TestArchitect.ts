import * as path from 'path';
import * as vscode from 'vscode';
import { BaseSkill } from '../BaseSkill';
import { ProjectContext, SkillParams, SkillResult, SkillProgressReporter } from '../interfaces';
import { languageDetector } from '../adapters';

/**
 * 测试架构师技能
 * 为源代码智能生成单元测试
 */
export class TestArchitectSkill extends BaseSkill {
  readonly id = 'test-architect';
  readonly name = '测试架构师';
  readonly description = '为源代码智能生成单元测试';
  readonly category = 'builder' as const;

  canExecute(context: ProjectContext): boolean {
    return context.type !== 'unknown';
  }

  async execute(context: ProjectContext, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult> {
    reporter.report('分析源代码...', 0);

    // 确定目标文件
    const targetFile = params.targetFile || this.getActiveEditor()?.document.uri.fsPath;
    if (!targetFile) {
      return { success: false, message: '请先打开一个源代码文件或指定目标文件' };
    }

    // 获取适配器
    reporter.startSubTask('识别语言类型');
    const adapter = languageDetector.getAdapterForFile(targetFile);
    if (!adapter) {
      reporter.completeSubTask('识别语言类型', false);
      return { success: false, message: `不支持的文件类型: ${path.extname(targetFile)}` };
    }
    reporter.completeSubTask('识别语言类型', true);
    reporter.report(`检测到 ${adapter.language} 文件`, 20);

    // 读取源文件
    reporter.startSubTask('读取源文件');
    let sourceCode: string;
    try {
      sourceCode = await this.readFile(targetFile);
    } catch (error) {
      reporter.completeSubTask('读取源文件', false);
      return { success: false, message: `无法读取文件: ${targetFile}` };
    }
    reporter.completeSubTask('读取源文件', true);

    // 分析代码结构
    reporter.startSubTask('分析代码结构');
    const analysis = this.analyzeCode(sourceCode, adapter.language);
    reporter.completeSubTask('分析代码结构', true);
    reporter.report(`发现 ${analysis.functions.length} 个函数/方法`, 40);

    // 生成测试文件路径
    const testFilePath = adapter.getTestFilePattern(targetFile);
    
    // 检查测试文件是否存在
    if (await this.fileExists(testFilePath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `测试文件已存在: ${path.basename(testFilePath)}`,
        '覆盖', '取消'
      );
      if (overwrite !== '覆盖') {
        return { success: false, message: '操作已取消' };
      }
    }

    // 生成测试代码
    reporter.startSubTask('生成测试代码');
    reporter.report('生成测试模板...', 60);
    const testCode = this.generateTestCode(analysis, adapter, targetFile);
    reporter.completeSubTask('生成测试代码', true);

    // 写入测试文件
    reporter.startSubTask('写入测试文件');
    try {
      await this.writeFile(testFilePath, testCode);
      reporter.completeSubTask('写入测试文件', true);
    } catch (error) {
      reporter.completeSubTask('写入测试文件', false);
      return { success: false, message: `无法写入测试文件: ${testFilePath}` };
    }

    // 打开测试文件
    reporter.report('完成！', 100);
    await this.openInEditor(testFilePath);

    return {
      success: true,
      message: `✅ 已为 ${analysis.functions.length} 个函数生成测试`,
      generatedFiles: [testFilePath],
      data: {
        sourceFile: targetFile,
        testFile: testFilePath,
        functionsCount: analysis.functions.length,
        runCommand: adapter.getTestCommand(testFilePath),
      },
    };
  }

  private analyzeCode(code: string, language: string): { className?: string; functions: string[] } {
    const result: { className?: string; functions: string[] } = { functions: [] };

    // 类名提取
    const classPatterns: Record<string, RegExp> = {
      typescript: /(?:export\s+)?class\s+(\w+)/,
      javascript: /(?:export\s+)?class\s+(\w+)/,
      python: /class\s+(\w+)/,
      java: /(?:public\s+)?class\s+(\w+)/,
      go: /type\s+(\w+)\s+struct/,
    };
    const classMatch = code.match(classPatterns[language] || /class\s+(\w+)/);
    if (classMatch) result.className = classMatch[1];

    // 函数名提取
    const funcPatterns: Record<string, RegExp> = {
      typescript: /(?:async\s+)?(?:function\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*\w+)?\s*[{=]/g,
      javascript: /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*[{=]/g,
      python: /def\s+(\w+)\s*\(/g,
      java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g,
      go: /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/g,
    };

    const funcRegex = funcPatterns[language];
    if (funcRegex) {
      let match;
      while ((match = funcRegex.exec(code)) !== null) {
        const funcName = match[1];
        // 过滤掉构造函数、测试方法等
        if (!['constructor', '__init__', 'setUp', 'tearDown'].includes(funcName) && !funcName.startsWith('test')) {
          result.functions.push(funcName);
        }
      }
    }

    return result;
  }

  private generateTestCode(analysis: { className?: string; functions: string[] }, adapter: any, sourceFile: string): string {
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const className = analysis.className || this.toPascalCase(baseName);

    // 获取基础模板
    let template = adapter.getTestTemplate(className);

    // 为每个函数生成测试用例
    const additionalTests = analysis.functions.map(func => {
      return this.generateFunctionTest(func, adapter.language);
    }).join('\n');

    // 在模板中插入额外的测试
    const todoMarker = '// TODO: Add more test cases';
    if (template.includes(todoMarker)) {
      template = template.replace(todoMarker, additionalTests);
    }

    return template;
  }

  private generateFunctionTest(funcName: string, language: string): string {
    const templates: Record<string, string> = {
      typescript: `
  it('${funcName} should work correctly', () => {
    // Arrange
    // TODO: Setup test data

    // Act
    // const result = ${funcName}();

    // Assert
    // expect(result).toBeDefined();
  });`,
      javascript: `
  it('${funcName} should work correctly', () => {
    // Arrange
    // TODO: Setup test data

    // Act
    // const result = ${funcName}();

    // Assert
    // expect(result).toBeDefined();
  });`,
      python: `
    def test_${this.toSnakeCase(funcName)}(self, instance):
        """Test ${funcName} function"""
        # Arrange
        # TODO: Setup test data

        # Act
        # result = instance.${funcName}()

        # Assert
        # assert result is not None`,
      java: `
    @Test
    @DisplayName("${funcName} should work correctly")
    void ${funcName}ShouldWorkCorrectly() {
        // Arrange
        // TODO: Setup test data

        // Act
        // var result = sut.${funcName}();

        // Assert
        // assertNotNull(result);
    }`,
      go: `
func Test${this.toPascalCase(funcName)}(t *testing.T) {
	t.Run("should work correctly", func(t *testing.T) {
		// Arrange
		// TODO: Setup test data

		// Act
		// result := ${funcName}()

		// Assert
		// if result == nil { t.Error("expected non-nil result") }
	})
}`,
    };

    return templates[language] || templates.typescript;
  }

  private toPascalCase(str: string): string {
    return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}
