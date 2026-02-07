/**
 * Git 命令相关类型定义
 */

// Git 命令分类
export interface GitCommandCategory {
  name: string;
  icon: string;
  commands: GitCommand[];
}

// Git 命令定义
export interface GitCommand {
  label: string;
  command: string;
  description: string;
  needsInput?: boolean;
  inputPlaceholder?: string;
  inputType?: 'text' | 'branch' | 'remote' | 'file';
  dangerous?: boolean;
}

// 预定义的 Git 命令
export const GIT_COMMANDS: GitCommandCategory[] = [
  {
    name: '基础操作',
    icon: '📋',
    commands: [
      { label: 'status', command: 'git status', description: '查看工作区状态' },
      { label: 'log', command: 'git log --oneline -10', description: '查看最近10条提交' },
      { label: 'diff', command: 'git diff', description: '查看未暂存的修改' },
      { label: 'diff staged', command: 'git diff --staged', description: '查看已暂存的修改' },
      { label: 'branch', command: 'git branch -a', description: '查看所有分支' },
      { label: 'remote', command: 'git remote -v', description: '查看远程仓库' },
    ]
  },
  {
    name: '提交流程',
    icon: '📦',
    commands: [
      { label: 'add all', command: 'git add .', description: '暂存所有修改' },
      { label: 'add file', command: 'git add', description: '暂存指定文件', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file' },
      { label: 'commit', command: 'git commit -m', description: '提交（需输入信息）', needsInput: true, inputPlaceholder: '提交信息' },
      { label: 'commit amend', command: 'git commit --amend', description: '修改最后一次提交' },
      { label: 'stash', command: 'git stash', description: '暂存当前修改' },
      { label: 'stash pop', command: 'git stash pop', description: '恢复暂存的修改' },
    ]
  },
  {
    name: '分支操作',
    icon: '🌿',
    commands: [
      { label: 'checkout', command: 'git checkout', description: '切换分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch' },
      { label: 'new branch', command: 'git checkout -b', description: '创建并切换到新分支', needsInput: true, inputPlaceholder: '新分支名' },
      { label: 'merge', command: 'git merge', description: '合并分支', needsInput: true, inputPlaceholder: '要合并的分支', inputType: 'branch' },
      { label: 'rebase', command: 'git rebase', description: '变基操作', needsInput: true, inputPlaceholder: '目标分支', inputType: 'branch' },
      { label: 'delete branch', command: 'git branch -d', description: '删除本地分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch', dangerous: true },
    ]
  },
  {
    name: '远程同步',
    icon: '🔄',
    commands: [
      { label: 'fetch', command: 'git fetch', description: '获取远程更新' },
      { label: 'pull', command: 'git pull', description: '拉取并合并' },
      { label: 'pull rebase', command: 'git pull --rebase', description: '拉取并变基' },
      { label: 'push', command: 'git push', description: '推送到远程' },
      { label: 'push force', command: 'git push --force-with-lease', description: '强制推送（安全）', dangerous: true },
      { label: 'push origin', command: 'git push -u origin', description: '推送并设置上游分支', needsInput: true, inputPlaceholder: '分支名', inputType: 'branch' },
    ]
  },
  {
    name: '撤销操作',
    icon: '↩️',
    commands: [
      { label: 'reset soft', command: 'git reset --soft HEAD~1', description: '撤销最后一次提交（保留修改）' },
      { label: 'reset hard', command: 'git reset --hard HEAD~1', description: '撤销最后一次提交（丢弃修改）', dangerous: true },
      { label: 'checkout file', command: 'git checkout --', description: '丢弃文件的修改', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file', dangerous: true },
      { label: 'revert', command: 'git revert', description: '创建一个撤销提交', needsInput: true, inputPlaceholder: 'commit hash' },
      { label: 'clean', command: 'git clean -fd', description: '删除未跟踪的文件', dangerous: true },
    ]
  },
  {
    name: '高级操作',
    icon: '⚙️',
    commands: [
      { label: 'cherry-pick', command: 'git cherry-pick', description: '挑选提交', needsInput: true, inputPlaceholder: 'commit hash' },
      { label: 'reflog', command: 'git reflog -10', description: '查看操作历史' },
      { label: 'blame', command: 'git blame', description: '查看文件每行的修改者', needsInput: true, inputPlaceholder: '文件路径', inputType: 'file' },
      { label: 'tag', command: 'git tag', description: '创建标签', needsInput: true, inputPlaceholder: '标签名' },
      { label: 'show', command: 'git show', description: '显示提交详情', needsInput: true, inputPlaceholder: 'commit hash' },
    ]
  }
];

// 扩展的斜杠命令（添加更多Git相关的快捷命令）
export const EXTENDED_SLASH_COMMANDS = [
  // Git 快捷命令
  {
    name: 'gst',
    description: 'Git status 的快捷方式',
    usage: '/gst',
    aliases: ['gs'],
    expandTo: '/git status',
  },
  {
    name: 'gpl',
    description: 'Git pull 的快捷方式',
    usage: '/gpl',
    expandTo: '/git pull',
  },
  {
    name: 'gps',
    description: 'Git push 的快捷方式',
    usage: '/gps',
    expandTo: '/git push',
  },
  {
    name: 'gco',
    description: 'Git checkout 的快捷方式',
    usage: '/gco <branch>',
    args: [{ name: 'branch', required: true, description: '分支名' }],
    expandTo: '/git checkout',
  },
  {
    name: 'gcm',
    description: 'Git commit 的快捷方式',
    usage: '/gcm <message>',
    args: [{ name: 'message', required: true, description: '提交信息' }],
    expandTo: '/git commit -m',
  },
  {
    name: 'gdf',
    description: 'Git diff 的快捷方式',
    usage: '/gdf [file]',
    args: [{ name: 'file', required: false, description: '文件路径（可选）' }],
    expandTo: '/git diff',
  },
  {
    name: 'glg',
    description: 'Git log 的快捷方式',
    usage: '/glg [count]',
    args: [{ name: 'count', required: false, description: '显示条数（默认10）' }],
    expandTo: '/git log --oneline',
  },
];

// 输入类型枚举
export enum InputType {
  COMMAND = 'command',
  SHELL_COMMAND = 'shell',
  NATURAL_QUESTION = 'question',
  NATURAL_REQUEST = 'request',
  CODE_REQUEST = 'code',
  MIXED = 'mixed'
}

// 自然语言到命令的映射
export const NATURAL_TO_COMMAND_MAP: Record<string, { command: string; description: string }> = {
  // 项目相关
  '分析项目': { command: '/init', description: '分析项目结构' },
  '初始化项目': { command: '/init', description: '分析项目结构' },
  '了解项目': { command: '/init', description: '分析项目结构' },
  '项目结构': { command: '/init', description: '查看项目结构' },
  '项目信息': { command: '/init', description: '查看项目信息' },
  
  // 文件相关
  '读取文件': { command: '/file', description: '读取指定文件' },
  '打开文件': { command: '/file', description: '读取指定文件' },
  '查看文件': { command: '/file', description: '读取指定文件' },
  '搜索代码': { command: '/search', description: '搜索项目代码' },
  '搜索文件': { command: '/search', description: '搜索项目代码' },
  '查找': { command: '/search', description: '搜索项目代码' },
  
  // Git相关
  '查看状态': { command: '/git status', description: '查看Git状态' },
  'git状态': { command: '/git status', description: '查看Git状态' },
  '提交代码': { command: '/git commit', description: 'Git提交' },
  '推送代码': { command: '/git push', description: 'Git推送' },
  '拉取代码': { command: '/git pull', description: 'Git拉取' },
  '切换分支': { command: '/git checkout', description: '切换分支' },
  '合并分支': { command: '/git merge', description: '合并分支' },
  '查看日志': { command: '/git log', description: '查看Git日志' },
  '查看差异': { command: '/git diff', description: '查看代码差异' },
  
  // 图表相关
  '生成流程图': { command: '/diagram flowchart', description: '生成流程图' },
  '画流程图': { command: '/diagram flowchart', description: '生成流程图' },
  '生成时序图': { command: '/diagram sequence', description: '生成时序图' },
  '生成类图': { command: '/diagram class', description: '生成类图' },
  '生成架构图': { command: '/diagram architecture', description: '生成架构图' },
  '生成ER图': { command: '/diagram er', description: '生成ER图' },
  '生成思维导图': { command: '/diagram mindmap', description: '生成思维导图' },
  
  // 测试相关
  '生成测试': { command: '/gentest', description: '为当前文件生成测试' },
  '写测试': { command: '/gentest', description: '为当前文件生成测试' },
  '创建测试': { command: '/gentest', description: '为当前文件生成测试' },
  '运行测试': { command: '/test', description: '运行测试' },
  
  // 构建相关
  '构建项目': { command: '/build', description: '构建项目' },
  '编译项目': { command: '/build', description: '构建项目' },
  
  // 帮助
  '帮助': { command: '/help', description: '显示帮助信息' },
  '命令列表': { command: '/help', description: '显示帮助信息' },
  '怎么用': { command: '/help', description: '显示帮助信息' },
  
  // 清除
  '清空对话': { command: '/clear', description: '清空当前对话' },
  '新对话': { command: '/clear', description: '开始新对话' },
  '清除历史': { command: '/clear', description: '清除对话历史' },
  
  // 压缩
  '压缩对话': { command: '/compact', description: '压缩对话历史' },
  '节省token': { command: '/compact', description: '压缩对话历史' },
};

// Git 命令提示映射（用于询问 AI 解释）
export const GIT_COMMAND_EXPLANATIONS: Record<string, string> = {
  'git status': '显示工作区的状态，包括已修改、已暂存和未跟踪的文件。',
  'git diff': '显示工作区与暂存区之间的差异，即还未执行 git add 的修改。',
  'git diff --staged': '显示暂存区与最后一次提交之间的差异，即将要提交的内容。',
  'git log': '显示提交历史记录，包括提交哈希、作者、日期和提交信息。',
  'git add .': '将当前目录下所有修改和新文件添加到暂存区。',
  'git commit': '将暂存区的内容创建为一个新的提交。',
  'git push': '将本地提交推送到远程仓库。',
  'git pull': '从远程仓库获取最新更改并合并到当前分支。',
  'git checkout': '切换分支或恢复工作区文件。',
  'git merge': '将指定分支的更改合并到当前分支。',
  'git rebase': '将当前分支的提交移动到指定分支之上，保持线性历史。',
  'git stash': '临时保存工作区的修改，以便稍后恢复。',
  'git cherry-pick': '将指定提交应用到当前分支。',
  'git reset': '重置当前分支的 HEAD 到指定状态。',
  'git revert': '创建一个新提交来撤销指定提交的更改。',
};
