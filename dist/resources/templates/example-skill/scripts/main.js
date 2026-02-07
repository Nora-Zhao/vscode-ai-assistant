/**
 * 示例Skill - 主脚本
 * 
 * 展示skill脚本的基本结构和MCP工具调用方式
 */

/**
 * 主执行函数
 * @param {Object} context - 执行上下文
 * @param {Object} context.skill - Skill包信息
 * @param {string} context.workspaceRoot - 工作区根目录
 * @param {string} context.activeFile - 当前活动文件
 * @param {Object} context.params - 用户输入参数
 * @param {Object} context.mcp - MCP桥接接口
 * @param {Function} context.log - 日志函数
 * @param {Function} context.progress - 进度报告函数
 */
async function execute(context) {
  const { params, mcp, log, progress } = context;

  log('开始执行示例skill');
  progress(0, '初始化...');

  // 获取参数
  const input = params?.input || '默认输入';
  const format = params?.format || 'json';

  log('输入参数: ' + JSON.stringify({ input, format }));

  // 模拟处理
  progress(20, '处理输入...');

  const result = {
    original: input,
    processed: input.toUpperCase(),
    reversed: input.split('').reverse().join(''),
    length: input.length,
    timestamp: new Date().toISOString(),
  };

  progress(40, '获取MCP工具列表...');

  // 演示获取可用MCP工具
  try {
    const tools = await mcp.listTools();
    log('可用MCP工具数量: ' + tools.length);
    result.availableToolCount = tools.length;
  } catch (error) {
    log('获取工具列表失败: ' + error.message, 'warn');
  }

  progress(60, '演示MCP工具调用...');

  // 演示调用MCP工具（如果file-reader存在）
  if (context.activeFile) {
    try {
      const fileResult = await mcp.call('file-reader', {
        path: context.activeFile,
      });

      if (fileResult.success) {
        log('成功读取当前文件');
        result.activeFileSize = fileResult.data?.content?.length || 0;
      }
    } catch (error) {
      log('读取文件失败（可能工具不存在）: ' + error.message, 'warn');
    }
  }

  progress(80, '格式化输出...');

  // 根据format返回不同格式
  let output;
  switch (format) {
    case 'text':
      output = '处理结果:\\n' +
        '原始: ' + result.original + '\\n' +
        '大写: ' + result.processed + '\\n' +
        '反转: ' + result.reversed;
      break;
    case 'markdown':
      output = '## 处理结果\\n\\n' +
        '| 属性 | 值 |\\n' +
        '|------|-----|\\n' +
        '| 原始 | ' + result.original + ' |\\n' +
        '| 大写 | ' + result.processed + ' |\\n' +
        '| 反转 | ' + result.reversed + ' |';
      break;
    default:
      output = result;
  }

  progress(100, '完成');
  log('示例skill执行完成');

  return output;
}

// 导出
module.exports = { execute };
