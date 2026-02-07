/**
 * Test Architect - 测试架构设计
 */
async function execute(context) {
  const { params, mcp, log, progress } = context;
  const workspaceRoot = context.workspaceRoot;

  if (!workspaceRoot) {
    return { success: false, message: '请打开一个项目文件夹' };
  }

  log('开始测试架构分析');
  progress(0, '扫描项目结构...');

  // 获取文件列表
  let allFiles = [];
  try {
    const listResult = await mcp.call('builtin_list_files', { path: workspaceRoot, recursive: true });
    if (listResult.success && listResult.data?.files) {
      allFiles = listResult.data.files;
    }
  } catch (e) {
    log('文件扫描失败: ' + e.message, 'warn');
  }

  progress(30, '分析项目结构...');

  const sourceFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx|py|go|java)$/i.test(f) && !/node_modules|\.test\.|\.spec\.|__test__|test_/i.test(f));
  const testFiles = allFiles.filter(f => /\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(f) || /test_.*\.py$|_test\.go$/i.test(f));

  progress(50, '识别测试框架...');

  // 检测现有测试框架
  let framework = params?.framework || 'auto';
  if (framework === 'auto') {
    try {
      const pkgResult = await mcp.call('builtin_read_file', {
        path: require('path').join(workspaceRoot, 'package.json'),
      });
      if (pkgResult.success) {
        const pkg = JSON.parse(pkgResult.data.content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.jest || allDeps['@jest/core']) framework = 'jest';
        else if (allDeps.vitest) framework = 'vitest';
        else if (allDeps.mocha) framework = 'mocha';
        else framework = 'jest';
      }
    } catch (_) {}
  }

  progress(70, '生成测试策略...');

  const coverage = testFiles.length > 0
    ? Math.round((testFiles.length / Math.max(sourceFiles.length, 1)) * 100)
    : 0;

  const report = {
    projectAnalysis: {
      totalSourceFiles: sourceFiles.length,
      totalTestFiles: testFiles.length,
      estimatedCoverage: `${Math.min(coverage, 100)}%`,
      detectedFramework: framework,
    },
    strategy: {
      unitTests: {
        target: '80%覆盖率',
        priority: '高',
        focus: '核心业务逻辑、工具函数、数据转换',
      },
      integrationTests: {
        target: '关键路径覆盖',
        priority: '中',
        focus: 'API端点、数据库操作、外部服务交互',
      },
      e2eTests: {
        target: '核心用户流程',
        priority: '低',
        focus: '注册/登录、核心业务流、支付流程',
      },
    },
    untestedFiles: sourceFiles
      .filter(sf => !testFiles.some(tf => tf.includes(sf.replace(/\.\w+$/, ''))))
      .slice(0, 20),
    recommendations: generateRecommendations(sourceFiles, testFiles, framework),
    timestamp: new Date().toISOString(),
  };

  progress(100, '分析完成');
  return report;
}

function generateRecommendations(sourceFiles, testFiles, framework) {
  const recs = [];
  if (testFiles.length === 0) {
    recs.push('项目目前没有测试文件，建议从核心业务逻辑开始添加单元测试');
  }
  if (testFiles.length < sourceFiles.length * 0.3) {
    recs.push('测试覆盖率偏低，建议优先覆盖公共API和关键业务逻辑');
  }
  recs.push(`推荐使用 ${framework} 作为测试框架`);
  recs.push('建议配置CI/CD流水线中的测试门禁，阻止覆盖率下降的PR合并');
  return recs;
}

module.exports = { execute };
