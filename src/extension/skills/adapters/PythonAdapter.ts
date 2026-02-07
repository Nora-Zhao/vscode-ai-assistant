import * as path from 'path';
import { SupportedLanguage } from '../interfaces';
import { BaseLanguageAdapter } from './BaseAdapter';

/**
 * Python 语言适配器
 * 支持 pip/poetry/pipenv/conda，pytest/unittest 测试框架
 */
export class PythonAdapter extends BaseLanguageAdapter {
  readonly language: SupportedLanguage = 'python';
  private packageManager: 'pip' | 'poetry' | 'pipenv' | 'conda' = 'pip';
  private testFramework: 'pytest' | 'unittest' = 'pytest';

  async detect(workspaceRoot: string): Promise<boolean> {
    const indicators = [
      { file: 'pyproject.toml', manager: 'poetry' as const },
      { file: 'Pipfile', manager: 'pipenv' as const },
      { file: 'environment.yml', manager: 'conda' as const },
      { file: 'requirements.txt', manager: 'pip' as const },
      { file: 'setup.py', manager: 'pip' as const },
    ];

    for (const { file, manager } of indicators) {
      if (await this.fileExists(path.join(workspaceRoot, file))) {
        this.packageManager = manager;
        await this.detectTestFramework(workspaceRoot);
        return true;
      }
    }
    return false;
  }

  private async detectTestFramework(workspaceRoot: string): Promise<void> {
    const pytestConfig = await this.fileExists(path.join(workspaceRoot, 'pytest.ini'));
    const conftest = await this.fileExists(path.join(workspaceRoot, 'conftest.py'));
    this.testFramework = (pytestConfig || conftest) ? 'pytest' : 'pytest'; // default to pytest
  }

  getDependencyFile(workspaceRoot: string): string | undefined {
    const files: Record<string, string> = {
      poetry: 'pyproject.toml',
      pipenv: 'Pipfile',
      conda: 'environment.yml',
      pip: 'requirements.txt',
    };
    return path.join(workspaceRoot, files[this.packageManager]);
  }

  getAuditCommand(): string {
    return 'pip-audit --format json';
  }

  getTestCommand(testFile?: string): string {
    if (this.testFramework === 'unittest') {
      return testFile ? `python -m unittest ${testFile}` : 'python -m unittest discover';
    }
    return testFile ? `pytest ${testFile} -v` : 'pytest -v';
  }

  getBuildCommand(): string {
    return this.packageManager === 'poetry' ? 'poetry build' : 'python setup.py build';
  }

  getFormatCommand(): string {
    return 'black . && isort .';
  }

  getLintCommand(): string {
    return 'ruff check . || flake8 .';
  }

  getTestFilePattern(sourceFile: string): string {
    const base = this.getBaseName(sourceFile, '.py');
    const dir = this.getDirName(sourceFile);
    return path.join(dir, `test_${base}.py`);
  }

  getTestTemplate(className?: string): string {
    const name = className || 'MyClass';
    const snakeName = this.toSnakeCase(name);
    return `import pytest
from ${snakeName} import ${name}


class Test${name}:
    """Test suite for ${name}"""

    @pytest.fixture
    def instance(self):
        """Create a ${name} instance for testing"""
        return ${name}()

    def test_should_be_instantiated(self, instance):
        """Test that ${name} can be instantiated"""
        assert instance is not None

    # TODO: Add more test cases
`;
  }

  getCodeReviewFocus(): string[] {
    return [
      '检查列表推导式是否过于复杂',
      '检查 PEP 8 代码风格',
      '检查类型提示是否完整',
      '检查异常处理是否恰当',
      '检查可变默认参数问题',
      '检查全局变量使用',
    ];
  }

  parseDependencies(content: string): string[] {
    const deps: string[] = [];
    // requirements.txt 格式
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
        const name = trimmed.split(/[=<>!~\[]/)[0].trim();
        if (name) deps.push(name);
      }
    }
    return deps;
  }
}
