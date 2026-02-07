/**
 * Code Reviewer - 深度代码审查
 */
async function execute(context) {
  const { params, mcp, log, progress } = context;

  log('开始代码审查');
  progress(0, '初始化...');

  const targetPath = params?.path || context.activeFile || context.workspaceRoot;
  const severity = params?.severity || 'medium';
  const maxFiles = params?.maxFiles || 20;

  if (!targetPath) {
    return { success: false, message: '未指定审查路径，请打开文件或指定path参数' };
  }

  progress(10, '扫描文件...');

  // 获取文件列表
  let files = [];
  try {
    const listResult = await mcp.call('builtin_list_files', { path: targetPath, recursive: true });
    if (listResult.success && listResult.data) {
      files = (listResult.data.files || [])
        .filter(f => /\.(ts|tsx|js|jsx|py|go|java|rs|vue)$/i.test(f))
        .slice(0, maxFiles);
    }
  } catch (e) {
    log('文件列表获取失败，尝试单文件模式: ' + e.message, 'warn');
    files = [targetPath];
  }

  if (files.length === 0) {
    return { success: false, message: '未找到可审查的源码文件' };
  }

  progress(20, `准备审查 ${files.length} 个文件...`);

  // 读取文件内容
  const fileContents = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const readResult = await mcp.call('builtin_read_file', { path: files[i] });
      if (readResult.success && readResult.data?.content) {
        fileContents.push({ path: files[i], content: readResult.data.content });
      }
    } catch (e) {
      log(`读取失败: ${files[i]}`, 'warn');
    }
    progress(20 + (i / files.length) * 40, `读取文件 ${i + 1}/${files.length}`);
  }

  progress(65, '分析代码...');

  // 基础静态分析
  const issues = [];
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const minSeverity = severityOrder[severity] ?? 2;

  for (const file of fileContents) {
    const fileIssues = analyzeFile(file.path, file.content);
    issues.push(...fileIssues.filter(i => (severityOrder[i.severity] ?? 3) <= minSeverity));
  }

  progress(90, '生成报告...');

  // 按严重程度排序
  issues.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  const report = {
    summary: {
      filesScanned: fileContents.length,
      issuesFound: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
    issues,
    timestamp: new Date().toISOString(),
  };

  progress(100, '审查完成');
  log(`审查完成: ${issues.length} 个问题`);

  return report;
}

/**
 * 分析单个文件
 */
function analyzeFile(filePath, content) {
  const issues = [];
  const lines = content.split('\n');
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 安全性检查
    if (/(?:password|secret|api_?key|token)\s*[:=]\s*['"][^'"]+['"]/i.test(line)) {
      issues.push({ file: filePath, line: lineNum, severity: 'critical', category: 'security', message: '疑似硬编码密钥', suggestion: '使用环境变量或密钥管理服务' });
    }
    if (/eval\s*\(/.test(line) && !line.trim().startsWith('//')) {
      issues.push({ file: filePath, line: lineNum, severity: 'high', category: 'security', message: '使用了eval()，存在代码注入风险', suggestion: '避免使用eval，用安全的替代方案' });
    }
    if (/innerHTML\s*=/.test(line)) {
      issues.push({ file: filePath, line: lineNum, severity: 'high', category: 'security', message: 'innerHTML赋值可能导致XSS', suggestion: '使用textContent或DOMPurify' });
    }

    // 性能检查
    if (/new\s+RegExp\(/.test(line) && /\b(for|while|forEach|map|filter)\b/.test(lines.slice(Math.max(0, i - 5), i).join('\n'))) {
      issues.push({ file: filePath, line: lineNum, severity: 'medium', category: 'performance', message: '循环内创建正则表达式', suggestion: '将正则提取到循环外部' });
    }

    // 可维护性
    if (line.length > 200) {
      issues.push({ file: filePath, line: lineNum, severity: 'low', category: 'maintainability', message: `行过长 (${line.length} 字符)`, suggestion: '拆分为多行以提高可读性' });
    }
    if (/TODO|FIXME|HACK|XXX/.test(line)) {
      issues.push({ file: filePath, line: lineNum, severity: 'low', category: 'maintainability', message: '存在待处理标记: ' + line.trim().substring(0, 60), suggestion: '处理或创建issue跟踪' });
    }

    // console.log 残留
    if (/console\.(log|debug|info)\s*\(/.test(line) && !line.trim().startsWith('//')) {
      issues.push({ file: filePath, line: lineNum, severity: 'low', category: 'quality', message: '残留的console输出', suggestion: '移除或替换为正式日志框架' });
    }
  }

  // 文件级检查
  if (lines.length > 500) {
    issues.push({ file: filePath, line: 1, severity: 'medium', category: 'maintainability', message: `文件过大 (${lines.length} 行)`, suggestion: '考虑拆分为更小的模块' });
  }

  return issues;
}

module.exports = { execute };
