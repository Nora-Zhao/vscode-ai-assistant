/**
 * Tool Maker - 工具生成器
 * 
 * 此skill主要作为AI辅助生成的触发器
 * 实际工具代码由AI根据SKILL.md中的提示词生成
 */
async function execute(context) {
  const { params, log, progress } = context;

  log('Tool Maker 启动');
  progress(0, '解析需求...');

  const description = params?.description || params?.userInput || '';
  if (!description) {
    return {
      success: false,
      message: '请描述你需要的工具，例如: "写一个批量重命名工具"',
    };
  }

  progress(50, '准备生成上下文...');

  // 返回结构化的需求，交给AI处理
  const result = {
    success: true,
    type: 'tool_request',
    description,
    context: {
      workspaceRoot: context.workspaceRoot,
      language: params?.language || 'auto',
      outputDir: params?.outputDir || 'tools',
    },
    message: `已识别工具需求: "${description}"。请AI根据此需求生成完整的工具代码。`,
  };

  progress(100, '需求解析完成');
  return result;
}

module.exports = { execute };
