/**
 * Dependency Guardian - 依赖安全检查
 */
async function execute(context) {
  const { params, mcp, log, progress } = context;
  const workspaceRoot = context.workspaceRoot;

  if (!workspaceRoot) {
    return { success: false, message: '请打开一个项目文件夹' };
  }

  log('开始依赖安全检查');
  progress(0, '检测项目类型...');

  // 检测项目类型
  const projectType = await detectProjectType(mcp, workspaceRoot);
  if (!projectType) {
    return { success: false, message: '未检测到支持的包管理器 (package.json / requirements.txt / go.mod)' };
  }

  log(`检测到项目类型: ${projectType}`);
  progress(20, `运行 ${projectType} 安全审计...`);

  // 运行审计命令
  let auditResult;
  try {
    const cmd = getAuditCommand(projectType);
    const result = await mcp.call('builtin_shell_exec', {
      command: cmd,
      cwd: workspaceRoot,
      timeout: 60000,
    });
    auditResult = result.data?.output || result.data?.stderr || '';
  } catch (e) {
    log('审计命令执行失败: ' + e.message, 'warn');
    auditResult = '';
  }

  progress(70, '解析审计结果...');

  const report = {
    projectType,
    timestamp: new Date().toISOString(),
    raw: auditResult,
    summary: parseAuditOutput(projectType, auditResult),
  };

  progress(100, '检查完成');
  return report;
}

async function detectProjectType(mcp, root) {
  const checks = [
    { file: 'package.json', type: 'npm' },
    { file: 'yarn.lock', type: 'yarn' },
    { file: 'pnpm-lock.yaml', type: 'pnpm' },
    { file: 'requirements.txt', type: 'pip' },
    { file: 'go.mod', type: 'go' },
  ];

  for (const check of checks) {
    try {
      const result = await mcp.call('builtin_read_file', {
        path: require('path').join(root, check.file),
      });
      if (result.success) return check.type;
    } catch (_) {}
  }
  return null;
}

function getAuditCommand(type) {
  const cmds = {
    npm: 'npm audit --json 2>/dev/null || npm audit 2>&1',
    yarn: 'yarn audit --json 2>/dev/null || yarn audit 2>&1',
    pnpm: 'pnpm audit --json 2>/dev/null || pnpm audit 2>&1',
    pip: 'pip-audit --format json 2>/dev/null || pip-audit 2>&1 || echo "pip-audit not installed"',
    go: 'govulncheck ./... 2>&1 || echo "govulncheck not installed"',
  };
  return cmds[type] || 'echo "unsupported"';
}

function parseAuditOutput(type, output) {
  try {
    if (type === 'npm' || type === 'yarn' || type === 'pnpm') {
      const json = JSON.parse(output);
      return {
        vulnerabilities: json.metadata?.vulnerabilities || json.advisories ? Object.keys(json.advisories || {}).length : 0,
        details: json,
      };
    }
  } catch (_) {}
  return { raw: output.substring(0, 2000) };
}

module.exports = { execute };
