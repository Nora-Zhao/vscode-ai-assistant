import * as path from 'path';
import { BaseSkill } from '../BaseSkill';
import { ProjectContext, SkillParams, SkillResult, SkillProgressReporter, SupportedLanguage } from '../interfaces';
import { languageDetector } from '../adapters';

interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

/**
 * 代码审查员技能
 * 对代码进行智能审查，指出潜在问题
 */
export class CodeReviewerSkill extends BaseSkill {
  readonly id = 'code-reviewer';
  readonly name = '代码审查员';
  readonly description = '对代码进行智能审查，指出潜在问题';
  readonly category = 'explainer' as const;

  canExecute(context: ProjectContext): boolean {
    return context.type !== 'unknown';
  }

  async execute(context: ProjectContext, params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult> {
    reporter.report('开始代码审查...', 0);

    // 确定目标文件或代码
    const targetFile = params.targetFile || this.getActiveEditor()?.document.uri.fsPath;
    const selectedCode = params.selectedCode || this.getSelectedText();

    if (!targetFile && !selectedCode) {
      return { success: false, message: '请先打开一个源代码文件或选中要审查的代码' };
    }

    // 获取适配器
    reporter.startSubTask('识别语言类型');
    let adapter = targetFile ? languageDetector.getAdapterForFile(targetFile) : undefined;
    let language: SupportedLanguage = adapter?.language || context.language;
    
    if (!adapter && context.language !== 'unknown') {
      adapter = languageDetector.getAdapters().find(a => a.language === context.language);
    }
    reporter.completeSubTask('识别语言类型', true);
    reporter.report(`检测到 ${language} 代码`, 10);

    // 读取代码
    reporter.startSubTask('读取代码');
    let code: string;
    let fileName = 'selected-code';
    if (selectedCode) {
      code = selectedCode;
    } else if (targetFile) {
      code = await this.readFile(targetFile);
      fileName = path.basename(targetFile);
    } else {
      reporter.completeSubTask('读取代码', false);
      return { success: false, message: '无法获取代码内容' };
    }
    reporter.completeSubTask('读取代码', true);

    // 获取审查重点
    reporter.startSubTask('分析代码');
    const focusPoints = adapter?.getCodeReviewFocus() || this.getDefaultFocusPoints(language);
    reporter.report(`应用 ${focusPoints.length} 个审查规则...`, 30);

    // 执行静态分析
    const issues = this.analyzeCode(code, language);
    reporter.completeSubTask('分析代码', true);
    reporter.report(`发现 ${issues.length} 个问题`, 60);

    // 生成报告
    reporter.startSubTask('生成报告');
    const report = this.generateReport(fileName, issues, focusPoints, language);
    reporter.completeSubTask('生成报告', true);
    reporter.report('审查完成', 100);

    const hasIssues = issues.length > 0;
    return {
      success: true,
      message: hasIssues
        ? `发现 ${issues.length} 个潜在问题`
        : '✅ 代码审查通过，未发现明显问题',
      data: {
        issues,
        report,
        focusPoints,
        lintCommand: adapter?.getLintCommand(),
      },
    };
  }

  private analyzeCode(code: string, language: SupportedLanguage): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');

    // 通用检查
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 检查过长行
      if (line.length > 120) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: `行过长 (${line.length} 字符)，建议不超过 120 字符`,
          suggestion: '将长行拆分成多行以提高可读性',
        });
      }

      // 检查 TODO/FIXME
      if (/TODO|FIXME|HACK|XXX/i.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'info',
          message: '发现待办标记',
          suggestion: '确保在发布前处理所有待办事项',
        });
      }

      // 检查硬编码密钥
      if (/(?:password|secret|key|token)\s*[=:]\s*['"][^'"]+['"]/i.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'error',
          message: '可能的硬编码密钥/密码',
          suggestion: '使用环境变量或密钥管理服务',
        });
      }

      // 检查 console.log (仅限 JS/TS)
      if ((language === 'typescript' || language === 'javascript') && /console\.(log|debug|info)\(/.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: '生产代码中存在 console 输出',
          suggestion: '移除或替换为正式的日志系统',
        });
      }

      // 检查 any 类型 (TypeScript)
      if (language === 'typescript' && /:\s*any\b/.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: '使用了 any 类型，损失了类型安全',
          suggestion: '使用具体类型或 unknown 代替',
        });
      }

      // 检查 Python print
      if (language === 'python' && /^\s*print\(/.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'info',
          message: '发现 print 语句',
          suggestion: '考虑使用 logging 模块代替',
        });
      }

      // 检查 Python 可变默认参数
      if (language === 'python' && /def\s+\w+\([^)]*=\s*(\[\]|\{\})/.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'error',
          message: '使用可变对象作为默认参数',
          suggestion: '使用 None 作为默认值，在函数内初始化',
        });
      }

      // 检查 Java 空 catch 块
      if (language === 'java' && /catch\s*\([^)]+\)\s*\{\s*\}/.test(line)) {
        issues.push({
          line: lineNum,
          severity: 'error',
          message: '空的 catch 块',
          suggestion: '至少记录异常或重新抛出',
        });
      }

      // 检查 Go 错误忽略
      if (language === 'go' && /,\s*_\s*:?=.*\(\)/.test(line) && line.includes('err')) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: '可能忽略了错误返回值',
          suggestion: '显式处理错误，不要使用 _ 忽略',
        });
      }
    });

    // 检查空文件
    if (code.trim().length === 0) {
      issues.push({
        line: 1,
        severity: 'info',
        message: '文件为空',
      });
    }

    return issues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity] || a.line - b.line;
    });
  }

  private getDefaultFocusPoints(language: SupportedLanguage): string[] {
    const defaultPoints: Record<string, string[]> = {
      typescript: ['检查类型安全', '检查异步处理', '检查空值处理'],
      javascript: ['检查类型转换', '检查异步处理', '检查空值处理'],
      python: ['检查类型提示', '检查异常处理', '检查代码风格'],
      java: ['检查空指针', '检查资源释放', '检查线程安全'],
      go: ['检查错误处理', '检查 goroutine', '检查 channel 使用'],
    };
    return defaultPoints[language] || ['检查代码质量', '检查安全问题'];
  }

  private generateReport(fileName: string, issues: CodeIssue[], focusPoints: string[], language: SupportedLanguage): string {
    const lines: string[] = [
      '# 🔍 代码审查报告',
      '',
      `**文件**: ${fileName}`,
      `**语言**: ${language}`,
      `**审查时间**: ${new Date().toLocaleString()}`,
      '',
      '## 📋 审查重点',
      '',
      ...focusPoints.map(p => `- ${p}`),
      '',
    ];

    if (issues.length === 0) {
      lines.push('## ✅ 审查结果', '', '代码质量良好，未发现明显问题！');
      return lines.join('\n');
    }

    // 统计
    const stats = { error: 0, warning: 0, info: 0 };
    issues.forEach(i => stats[i.severity]++);

    lines.push(
      `## ⚠️ 发现 ${issues.length} 个问题`,
      '',
      `- 🔴 错误: ${stats.error}`,
      `- 🟡 警告: ${stats.warning}`,
      `- 🔵 提示: ${stats.info}`,
      '',
      '## 📝 问题详情',
      '',
    );

    const icons = { error: '🔴', warning: '🟡', info: '🔵' };
    for (const issue of issues) {
      lines.push(
        `### ${icons[issue.severity]} Line ${issue.line}: ${issue.message}`,
        '',
      );
      if (issue.suggestion) {
        lines.push(`**建议**: ${issue.suggestion}`, '');
      }
    }

    return lines.join('\n');
  }
}
