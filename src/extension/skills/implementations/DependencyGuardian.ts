import { BaseSkill } from '../BaseSkill';
import { ProjectContext, SkillParams, SkillResult, SkillProgressReporter } from '../interfaces';
import { languageDetector } from '../adapters';

interface Vulnerability {
  name: string;
  severity: string;
  version?: string;
  description?: string;
  fixedIn?: string;
}

/**
 * 依赖安全卫士技能
 * 检查项目依赖中的安全漏洞
 */
export class DependencyGuardianSkill extends BaseSkill {
  readonly id = 'dependency-guardian';
  readonly name = '依赖安全卫士';
  readonly description = '检查项目依赖中的安全漏洞';
  readonly category = 'automator' as const;

  canExecute(context: ProjectContext): boolean {
    return context.type !== 'unknown' && !!context.dependencyFile;
  }

  async execute(context: ProjectContext, _params: SkillParams, reporter: SkillProgressReporter): Promise<SkillResult> {
    reporter.report('开始安全扫描...', 0);

    // 检查依赖文件
    if (!context.dependencyFile || !(await this.fileExists(context.dependencyFile))) {
      return { success: false, message: '未找到依赖配置文件' };
    }

    // 获取适配器
    reporter.startSubTask('检测项目类型');
    const adapter = languageDetector.getAdapters().find(a => {
      if (context.language === 'typescript' || context.language === 'javascript') {
        return a.language === 'typescript';
      }
      return a.language === context.language;
    });

    if (!adapter) {
      reporter.completeSubTask('检测项目类型', false);
      return { success: false, message: `不支持的项目类型: ${context.type}` };
    }
    reporter.completeSubTask('检测项目类型', true);
    reporter.report(`检测到 ${context.framework || context.type} 项目`, 20);

    // 运行审计命令
    reporter.startSubTask('执行安全审计');
    const auditCmd = adapter.getAuditCommand();
    reporter.report(`执行命令: ${auditCmd}`, 30);

    const result = await this.runCommand(auditCmd, context.root, { timeout: 120000 });
    reporter.completeSubTask('执行安全审计', result.code === 0);
    reporter.report('分析审计结果...', 70);

    // 解析结果
    const vulnerabilities = this.parseAuditResult(result.stdout, context.type);
    reporter.report('生成报告...', 90);

    // 生成报告
    const report = this.generateReport(vulnerabilities, context);
    reporter.report('扫描完成', 100);

    const hasVulnerabilities = vulnerabilities.length > 0;
    return {
      success: true,
      message: hasVulnerabilities
        ? `发现 ${vulnerabilities.length} 个安全漏洞`
        : '✅ 未发现安全漏洞',
      data: {
        vulnerabilities,
        report,
        auditCommand: auditCmd,
        fixCommand: this.getFixCommand(context.type),
      },
    };
  }

  private parseAuditResult(output: string, projectType: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    try {
      // npm audit --json 格式
      if (projectType === 'node') {
        const data = JSON.parse(output);
        const vulns = data.vulnerabilities || {};
        for (const [name, info] of Object.entries(vulns)) {
          const v = info as any;
          vulnerabilities.push({
            name,
            severity: v.severity || 'unknown',
            version: v.range,
            description: v.via?.[0]?.title || v.via?.[0] || '',
            fixedIn: v.fixAvailable?.version,
          });
        }
      }

      // pip-audit --format json 格式
      if (projectType === 'python') {
        const data = JSON.parse(output);
        for (const vuln of data) {
          vulnerabilities.push({
            name: vuln.name,
            severity: vuln.vulns?.[0]?.severity || 'unknown',
            version: vuln.version,
            description: vuln.vulns?.[0]?.id || '',
            fixedIn: vuln.vulns?.[0]?.fix_versions?.[0],
          });
        }
      }
    } catch {
      // 非 JSON 输出，尝试文本解析
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('CRITICAL') || line.includes('HIGH') || line.includes('MODERATE') || line.includes('LOW')) {
          vulnerabilities.push({
            name: line.trim().slice(0, 50),
            severity: this.extractSeverity(line),
          });
        }
      }
    }

    return vulnerabilities;
  }

  private extractSeverity(line: string): string {
    if (line.includes('CRITICAL')) return 'critical';
    if (line.includes('HIGH')) return 'high';
    if (line.includes('MODERATE') || line.includes('MEDIUM')) return 'moderate';
    if (line.includes('LOW')) return 'low';
    return 'unknown';
  }

  private generateReport(vulnerabilities: Vulnerability[], context: ProjectContext): string {
    const lines: string[] = [
      '# 🛡️ 依赖安全审计报告',
      '',
      `**项目类型**: ${context.framework || context.type}`,
      `**扫描时间**: ${new Date().toLocaleString()}`,
      '',
    ];

    if (vulnerabilities.length === 0) {
      lines.push('## ✅ 扫描结果', '', '未发现安全漏洞，您的依赖是安全的！');
      return lines.join('\n');
    }

    lines.push(`## ⚠️ 发现 ${vulnerabilities.length} 个漏洞`, '');

    // 按严重程度分组
    const grouped: Record<string, Vulnerability[]> = {};
    for (const v of vulnerabilities) {
      const key = v.severity.toLowerCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    }

    const order = ['critical', 'high', 'moderate', 'low', 'unknown'];
    const icons: Record<string, string> = { critical: '🔴', high: '🟠', moderate: '🟡', low: '🔵', unknown: '⚪' };

    for (const severity of order) {
      const items = grouped[severity];
      if (!items?.length) continue;

      lines.push(`### ${icons[severity]} ${severity.toUpperCase()} (${items.length})`, '');
      lines.push('| 包名 | 版本 | 描述 | 修复版本 |', '|------|------|------|----------|');
      for (const v of items) {
        lines.push(`| ${v.name} | ${v.version || '-'} | ${v.description || '-'} | ${v.fixedIn || '-'} |`);
      }
      lines.push('');
    }

    lines.push('## 🔧 修复建议', '', `运行以下命令尝试自动修复：`, '```bash', this.getFixCommand(context.type), '```');

    return lines.join('\n');
  }

  private getFixCommand(projectType: string): string {
    const commands: Record<string, string> = {
      node: 'npm audit fix',
      python: 'pip install --upgrade <package-name>',
      'java-maven': 'mvn versions:use-latest-releases',
      'java-gradle': './gradlew dependencyUpdates',
      go: 'go get -u ./...',
    };
    return commands[projectType] || '请手动更新依赖';
  }
}
