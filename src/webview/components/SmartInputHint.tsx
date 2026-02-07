import React, { useState, useEffect, useMemo } from 'react';

interface SmartInputHintProps {
  input: string;
  onSuggestionClick?: (suggestion: string) => void;
  availableSkills?: Array<{ id: string; name: string; description: string }>;
}

// 输入类型
type InputType = 'command' | 'shell' | 'question' | 'request' | 'code' | 'mcp' | 'skill' | 'mixed' | 'empty';

// 解析结果
interface ParsedInput {
  type: InputType;
  suggestion?: string;
  possibleCommand?: string;
  confidence: number;
  mcpTools?: string[];
  skills?: string[];
}

// 关键词模式
const QUESTION_PATTERNS = [
  /^(什么|怎么|如何|为什么|哪个|哪里|谁|多少|是否|能否|可以吗|是不是)/,
  /[？?]$/,
  /(吗|呢|吧)[？?]?$/,
  /^(what|how|why|where|when|who|which|can|could|would|should|is|are|do|does)/i,
];

const REQUEST_PATTERNS = [
  /^(请|帮我|帮忙|能不能|可以|麻烦|给我|我想|我要|我需要|创建|生成|写|编写|修改|优化|重构|解释|分析)/,
  /^(please|help|create|generate|write|modify|fix|explain|analyze|refactor|optimize|make)/i,
];

const CODE_PATTERNS = [
  /代码|函数|方法|类|接口|变量|bug|报错|错误|异常|测试/,
  /code|function|method|class|interface|variable|bug|error|exception|test/i,
  /```[\s\S]*```/,
  /\.(ts|tsx|js|jsx|py|go|java|rs|vue|css|html)(\s|$)/i,
];

// MCP 工具模式
const MCP_PATTERN = /@mcp:([a-zA-Z0-9:_-]+)/g;

// Skill 模式
const SKILL_PATTERN = /@skill:([a-zA-Z0-9_-]+)/g;

// 内置MCP工具列表（与后端 builtins.ts 保持一致）
const MCP_TOOLS: Record<string, { name: string; description: string; category: string }> = {
  'builtin_read_file': { name: '读取文件', description: '读取指定路径的文件内容', category: 'file' },
  'builtin_write_file': { name: '写入文件', description: '将内容写入指定文件', category: 'file' },
  'builtin_search_files': { name: '搜索文件', description: '在工作区中搜索匹配的文件', category: 'file' },
  'builtin_list_dir': { name: '列出目录', description: '列出目录下的所有文件和子目录', category: 'file' },
  'builtin_search_code': { name: '搜索代码', description: '在代码文件中搜索文本', category: 'code' },
  'builtin_analyze_code': { name: '分析代码', description: '分析代码结构和依赖关系', category: 'code' },
  'builtin_run_command': { name: '执行命令', description: '在终端运行Shell命令', category: 'shell' },
  'builtin_git_status': { name: 'Git状态', description: '获取Git仓库状态', category: 'git' },
  'builtin_git_diff': { name: 'Git差异', description: '获取未提交的更改', category: 'git' },
  'builtin_git_commit': { name: 'Git提交', description: '提交更改到本地仓库', category: 'git' },
  'builtin_git_log': { name: 'Git日志', description: '查看提交历史', category: 'git' },
  'builtin_run_test': { name: '运行测试', description: '运行项目测试', category: 'test' },
  'builtin_generate_test': { name: '生成测试', description: '为代码生成单元测试', category: 'test' },
  'builtin_generate_diagram': { name: '生成图表', description: '根据代码生成架构图', category: 'diagram' },
  'builtin_build_project': { name: '构建项目', description: '执行项目构建命令', category: 'build' },
};

// 内置Skill列表（与实际 builtin-packages 目录保持一致）
const BUILTIN_SKILLS: Record<string, { name: string; description: string; category: string }> = {
  'code-reviewer': { name: '代码审查', description: '智能代码审查，检测潜在问题和改进建议', category: 'code' },
  'test-architect': { name: '测试架构师', description: '设计和生成全面的测试用例', category: 'test' },
  'dependency-guardian': { name: '依赖守护者', description: '检查依赖安全性和版本更新', category: 'security' },
  'tool-maker': { name: '工具制作器', description: '创建自定义MCP工具', category: 'dev' },
};

// 自然语言到命令的映射（使用正则表达式精确匹配）
const NATURAL_TO_COMMAND: Record<string, { pattern: RegExp; command: string; description: string }> = {
  '分析项目': { pattern: /^(分析|了解|查看|初始化)(一下|下)?项目/, command: '/init', description: '分析项目结构' },
  '项目结构': { pattern: /^(查看|显示|看下)?项目(结构|信息|概览)/, command: '/init', description: '查看项目结构' },
  '读取文件': { pattern: /^(读取|打开|查看)(一下)?文件\s*[:：]?\s*\S+/, command: '/file', description: '读取指定文件' },
  '搜索代码': { pattern: /^(搜索|查找|找)(一下)?(代码|文件)\s*[:：]?\s*\S+/, command: '/search', description: '搜索项目代码' },
  '生成流程图': { pattern: /^(生成|画|创建)(一个|一张)?流程图/, command: '/diagram flowchart', description: '生成流程图' },
  '生成时序图': { pattern: /^(生成|画|创建)(一个|一张)?时序图/, command: '/diagram sequence', description: '生成时序图' },
  '生成类图': { pattern: /^(生成|画|创建)(一个|一张)?类图/, command: '/diagram class', description: '生成类图' },
  '生成架构图': { pattern: /^(生成|画|创建)(一个|一张)?架构图/, command: '/diagram architecture', description: '生成架构图' },
  '生成测试': { pattern: /^(生成|写|创建)(一下)?(单元)?测试/, command: '/gentest', description: '为当前文件生成测试' },
  '运行测试': { pattern: /^(运行|执行)(一下)?测试/, command: '/test', description: '运行测试' },
  '构建项目': { pattern: /^(构建|编译)(一下)?项目/, command: '/build', description: '构建项目' },
  '帮助': { pattern: /^(查看)?帮助$|^命令列表$|^怎么用$/, command: '/help', description: '显示帮助信息' },
  'git status': { pattern: /^(查看|显示)?git\s*status|^(查看)?git状态/, command: '/git status', description: '查看 Git 状态' },
  '提交代码': { pattern: /^(git\s+)?commit|^提交(代码|更改)/, command: '/git commit', description: 'Git 提交' },
  '推送代码': { pattern: /^(git\s+)?push|^推送(代码)?/, command: '/git push', description: 'Git 推送' },
  '拉取代码': { pattern: /^(git\s+)?pull|^拉取(代码)?/, command: '/git pull', description: 'Git 拉取' },
};

// 解析输入
function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { type: 'empty', confidence: 1 };
  }
  
  // 明确的命令格式
  if (trimmed.startsWith('/')) {
    return { type: 'command', confidence: 1 };
  }
  
  // Shell 命令格式
  if (trimmed.startsWith('!')) {
    return { 
      type: 'shell', 
      confidence: 1,
      possibleCommand: `/run ${trimmed.substring(1).trim()}`,
    };
  }
  
  // 检测 @mcp 工具调用
  const mcpMatches = [...trimmed.matchAll(MCP_PATTERN)];
  if (mcpMatches.length > 0) {
    const mcpTools = mcpMatches.map(m => m[1]);
    return {
      type: 'mcp',
      confidence: 1,
      mcpTools,
      suggestion: `🔧 检测到 ${mcpTools.length} 个MCP工具调用`,
    };
  }

  // 检测 @skill 技能调用
  const skillMatches = [...trimmed.matchAll(SKILL_PATTERN)];
  if (skillMatches.length > 0) {
    const skills = skillMatches.map(m => m[1]);
    return {
      type: 'skill',
      confidence: 1,
      skills,
      suggestion: `🎯 检测到 ${skills.length} 个Skill技能调用`,
    };
  }

  // 检测正在输入 @mcp
  if (/@mcp:?$/.test(trimmed) || (/@$/.test(trimmed) && !/@skill/.test(trimmed))) {
    return {
      type: 'mcp',
      confidence: 0.9,
      suggestion: '💡 输入 @mcp: 后跟工具名称来调用MCP工具',
    };
  }

  // 检测正在输入 @skill
  if (/@skill:?$/.test(trimmed)) {
    return {
      type: 'skill',
      confidence: 0.9,
      suggestion: '💡 输入 @skill: 后跟技能名称来调用Skill技能',
    };
  }

  // 检测输入 @ 符号（同时提示 mcp 和 skill）
  if (/@$/.test(trimmed)) {
    return {
      type: 'mixed',
      confidence: 0.8,
      suggestion: '💡 输入 @mcp: 调用工具 或 @skill: 调用技能',
    };
  }
  
  let confidence = 0.5;
  let type: InputType = 'question';
  let suggestion: string | undefined;
  let possibleCommand: string | undefined;
  
  // 检查是否匹配已知的命令映射（使用正则表达式精确匹配）
  for (const [name, info] of Object.entries(NATURAL_TO_COMMAND)) {
    if (info.pattern.test(trimmed)) {
      possibleCommand = info.command;
      suggestion = `💡 检测到: ${info.description}，可直接输入 ${info.command}`;
      confidence = 0.8;
      type = 'mixed';
      break;
    }
  }
  
  // 检查是否是问题
  const isQuestion = QUESTION_PATTERNS.some(p => p.test(trimmed));
  if (isQuestion) {
    type = type === 'mixed' ? 'mixed' : 'question';
    confidence = Math.max(confidence, 0.8);
  }
  
  // 检查是否是请求
  const isRequest = REQUEST_PATTERNS.some(p => p.test(trimmed));
  if (isRequest) {
    type = type === 'mixed' ? 'mixed' : 'request';
    confidence = Math.max(confidence, 0.8);
  }
  
  // 检查是否涉及代码
  const isCodeRelated = CODE_PATTERNS.some(p => p.test(trimmed));
  if (isCodeRelated) {
    type = 'code';
    confidence = Math.max(confidence, 0.85);
  }
  
  // 检测看起来像命令但没有斜杠的输入
  const commandLikePatterns = [
    /^(init|help|clear|search|build|test|git|diagram|gentest)\s*/i,
  ];
  
  for (const pattern of commandLikePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const cmd = match[1].toLowerCase();
      const rest = trimmed.substring(match[0].length).trim();
      possibleCommand = `/${cmd}${rest ? ' ' + rest : ''}`;
      suggestion = `💡 你是否想执行命令？试试: ${possibleCommand}`;
      type = 'mixed';
      break;
    }
  }
  
  return { type, confidence, suggestion, possibleCommand };
}

// 获取类型标签
function getTypeLabel(type: InputType): { icon: string; text: string; color: string } {
  switch (type) {
    case 'command':
      return { icon: '⚡', text: '命令', color: '#4CAF50' };
    case 'shell':
      return { icon: '💻', text: 'Shell', color: '#FF9800' };
    case 'question':
      return { icon: '❓', text: '提问', color: '#2196F3' };
    case 'request':
      return { icon: '🔧', text: '请求', color: '#9C27B0' };
    case 'code':
      return { icon: '💻', text: '代码', color: '#00BCD4' };
    case 'mcp':
      return { icon: '🔌', text: 'MCP', color: '#E91E63' };
    case 'skill':
      return { icon: '🎯', text: 'Skill', color: '#FF5722' };
    case 'mixed':
      return { icon: '🔀', text: '混合', color: '#FF5722' };
    default:
      return { icon: '💬', text: '', color: '#9E9E9E' };
  }
}

export default function SmartInputHint({ input, onSuggestionClick, availableSkills }: SmartInputHintProps) {
  const [showHint, setShowHint] = useState(false);
  
  const parsed = useMemo(() => parseInput(input), [input]);
  
  useEffect(() => {
    // 简化的显示逻辑：只在以下情况显示提示
    // 1. 检测到 @mcp 或 @skill 语法
    // 2. 检测到可能的命令映射（且有明确的建议）
    const shouldShow = 
      parsed.type === 'mcp' || 
      parsed.type === 'skill' ||
      (parsed.type === 'mixed' && parsed.suggestion && parsed.possibleCommand);
    
    setShowHint(shouldShow);
  }, [parsed, input]);
  
  // 不显示任何提示的情况
  if (!showHint || parsed.type === 'command' || parsed.type === 'empty') {
    return null;
  }
  
  const label = getTypeLabel(parsed.type);
  
  return (
    <div className="smart-input-hint">
      {/* 输入类型指示器 - 只显示明确类型 */}
      {(parsed.type === 'mcp' || parsed.type === 'skill') && (
        <div className="hint-type" style={{ borderColor: label.color }}>
          <span className="hint-icon">{label.icon}</span>
          {label.text && <span className="hint-text">{label.text}</span>}
        </div>
      )}
      
      {/* MCP 工具提示 - 显示检测到的工具 */}
      {parsed.type === 'mcp' && parsed.mcpTools && (
        <div className="hint-mcp-tools">
          {parsed.mcpTools.map((toolId, i) => {
            const tool = MCP_TOOLS[toolId];
            return (
              <div key={i} className="mcp-tool-badge">
                <span className="tool-name">@mcp:{toolId}</span>
                {tool && <span className="tool-desc">{tool.name}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Skill 技能提示 - 显示检测到的技能 */}
      {parsed.type === 'skill' && parsed.skills && (
        <div className="hint-skill-tools">
          {parsed.skills.map((skillId, i) => {
            const skill = BUILTIN_SKILLS[skillId] || availableSkills?.find(s => s.id === skillId);
            return (
              <div key={i} className="skill-tool-badge">
                <span className="tool-name">@skill:{skillId}</span>
                {skill && <span className="tool-desc">{skill.name}</span>}
              </div>
            );
          })}
        </div>
      )}
      
      {/* 命令建议 - 只在有明确建议时显示 */}
      {parsed.suggestion && parsed.possibleCommand && (
        <div 
          className="hint-suggestion"
          onClick={() => onSuggestionClick?.(parsed.possibleCommand!)}
        >
          <span className="suggestion-text">{parsed.suggestion}</span>
          <button className="use-command-btn">
            使用 {parsed.possibleCommand}
          </button>
        </div>
      )}
      
      {/* MCP 输入提示 - 用户正在输入 @mcp */}
      {parsed.type === 'mcp' && !parsed.mcpTools && parsed.suggestion && (
        <div className="hint-info hint-mcp">
          <span>{parsed.suggestion}</span>
          <MCPToolHints onSelect={(tool) => onSuggestionClick?.(`@mcp:${tool} `)} />
        </div>
      )}

      {/* Skill 输入提示 - 用户正在输入 @skill */}
      {parsed.type === 'skill' && !parsed.skills && parsed.suggestion && (
        <div className="hint-info hint-skill">
          <span>{parsed.suggestion}</span>
          <SkillHints 
            onSelect={(skill) => onSuggestionClick?.(`@skill:${skill} `)} 
            availableSkills={availableSkills}
          />
        </div>
      )}
    </div>
  );
}

// MCP 工具提示组件
interface MCPToolHintsProps {
  onSelect: (toolId: string) => void;
}

function MCPToolHints({ onSelect }: MCPToolHintsProps) {
  const categories = useMemo(() => {
    const grouped = new Map<string, Array<{ id: string; name: string; description: string }>>();
    for (const [id, tool] of Object.entries(MCP_TOOLS)) {
      const cat = tool.category;
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push({ id, ...tool });
    }
    return grouped;
  }, []);

  const categoryLabels: Record<string, string> = {
    file: '📁 文件',
    code: '💻 代码',
    shell: '⌨️ Shell',
    git: '📦 Git',
    test: '🧪 测试',
    diagram: '📊 图表',
    build: '🔧 构建',
  };

  return (
    <div className="mcp-tool-hints">
      {Array.from(categories.entries()).slice(0, 4).map(([cat, tools]) => (
        <div key={cat} className="mcp-hint-category">
          <span className="category-label">{categoryLabels[cat] || cat}:</span>
          {tools.slice(0, 2).map(tool => (
            <button 
              key={tool.id}
              className="mcp-hint-btn"
              onClick={() => onSelect(tool.id)}
              title={tool.description}
            >
              {tool.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Skill 技能提示组件
interface SkillHintsProps {
  onSelect: (skillId: string) => void;
  availableSkills?: Array<{ id: string; name: string; description: string }>;
}

function SkillHints({ onSelect, availableSkills }: SkillHintsProps) {
  // 合并内置技能和用户安装的技能
  const allSkills = useMemo(() => {
    const skills: Array<{ id: string; name: string; description: string; category: string }> = [];
    
    // 添加内置技能
    for (const [id, skill] of Object.entries(BUILTIN_SKILLS)) {
      skills.push({ id, ...skill });
    }
    
    // 添加用户安装的技能（避免重复）
    if (availableSkills) {
      for (const skill of availableSkills) {
        if (!skills.find(s => s.id === skill.id)) {
          skills.push({ ...skill, category: 'user' });
        }
      }
    }
    
    return skills;
  }, [availableSkills]);

  const categories = useMemo(() => {
    const grouped = new Map<string, Array<{ id: string; name: string; description: string }>>();
    for (const skill of allSkills) {
      const cat = skill.category;
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(skill);
    }
    return grouped;
  }, [allSkills]);

  const categoryLabels: Record<string, string> = {
    code: '💻 代码',
    test: '🧪 测试',
    security: '🔒 安全',
    dev: '🛠️ 开发',
    doc: '📝 文档',
    design: '🎨 设计',
    performance: '⚡ 性能',
    user: '👤 自定义',
  };

  return (
    <div className="skill-hints">
      {Array.from(categories.entries()).slice(0, 4).map(([cat, skills]) => (
        <div key={cat} className="skill-hint-category">
          <span className="category-label">{categoryLabels[cat] || cat}:</span>
          {skills.slice(0, 2).map(skill => (
            <button 
              key={skill.id}
              className="skill-hint-btn"
              onClick={() => onSelect(skill.id)}
              title={skill.description}
            >
              {skill.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// 快捷命令建议组件
interface QuickCommandsProps {
  onSelect: (command: string) => void;
}

export function QuickCommands({ onSelect }: QuickCommandsProps) {
  const quickCommands = [
    { cmd: '/init', label: '分析项目', icon: '📂' },
    { cmd: '/help', label: '帮助', icon: '❓' },
    { cmd: '/diagram', label: '生成图表', icon: '📊' },
    { cmd: '/gentest', label: '生成测试', icon: '🧪' },
    { cmd: '/search', label: '搜索代码', icon: '🔍' },
    { cmd: '@mcp:', label: 'MCP工具', icon: '🔌' },
    { cmd: '@skill:', label: 'Skill技能', icon: '🎯' },
  ];
  
  return (
    <div className="quick-commands">
      <span className="quick-label">快捷命令：</span>
      {quickCommands.map(({ cmd, label, icon }) => (
        <button 
          key={cmd}
          className="quick-cmd-btn"
          onClick={() => onSelect(cmd + (cmd.endsWith(':') ? '' : ' '))}
          title={cmd}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// 命令帮助浮层
interface CommandHelpPopupProps {
  command: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommandHelpPopup({ command, isOpen, onClose }: CommandHelpPopupProps) {
  if (!isOpen) return null;
  
  const commandHelp: Record<string, { usage: string; description: string; examples: string[] }> = {
    '/init': {
      usage: '/init',
      description: '分析项目结构，获取项目概览',
      examples: ['/init'],
    },
    '/file': {
      usage: '/file <路径>',
      description: '读取并讨论指定文件',
      examples: ['/file src/index.ts', '/file package.json'],
    },
    '/search': {
      usage: '/search <关键词>',
      description: '在项目中搜索代码',
      examples: ['/search handleClick', '/search useState'],
    },
    '/diagram': {
      usage: '/diagram <类型> [描述]',
      description: '生成各种类型的图表',
      examples: ['/diagram flowchart', '/diagram sequence 用户登录流程', '/diagram class'],
    },
    '/gentest': {
      usage: '/gentest [文件路径]',
      description: '为文件生成单元测试',
      examples: ['/gentest', '/gentest src/utils.ts'],
    },
    '/git': {
      usage: '/git <命令>',
      description: '执行 Git 命令',
      examples: ['/git status', '/git log', '/git diff'],
    },
    '/run': {
      usage: '/run <命令>',
      description: '在终端运行命令',
      examples: ['/run npm install', '/run python app.py'],
    },
    '@mcp': {
      usage: '@mcp:<工具ID> [参数]',
      description: '调用MCP工具（输入 @mcp:list 查看所有可用工具）',
      examples: ['@mcp:builtin_read_file filePath="src/index.ts"', '@mcp:builtin_git_status', '@mcp:agent 分析项目'],
    },
    '@skill': {
      usage: '@skill:<技能ID> [参数]',
      description: '调用Skill技能',
      examples: ['@skill:code-reviewer 检查这段代码', '@skill:test-architect 生成测试', '@skill:dependency-guardian'],
    },
  };
  
  let cmdKey: string;
  if (command.startsWith('@skill')) {
    cmdKey = '@skill';
  } else if (command.startsWith('@')) {
    cmdKey = '@mcp';
  } else {
    cmdKey = '/' + command.split(' ')[0].replace('/', '');
  }
  const help = commandHelp[cmdKey];
  
  if (!help) return null;
  
  return (
    <div className="command-help-popup" onClick={onClose}>
      <div className="help-content" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <h4>📖 {cmdKey}</h4>
          <button onClick={onClose}>×</button>
        </div>
        <div className="help-body">
          <p className="help-usage"><code>{help.usage}</code></p>
          <p className="help-desc">{help.description}</p>
          <div className="help-examples">
            <span className="examples-label">示例：</span>
            {help.examples.map((ex, i) => (
              <code key={i} className="example-item">{ex}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
