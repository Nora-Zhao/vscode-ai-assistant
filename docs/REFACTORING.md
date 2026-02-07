# AI Assistant 重构报告

## 一、变更总览

| 项目 | 变更前 | 变更后 |
|------|--------|--------|
| 代码行数 | ~42,247 | ~39,676 (-6%) |
| TS/TSX文件数 | 107 | 100 |
| npm依赖 | 含4个langchain包 | 移除全部langchain包 |
| 死代码 | 2,767行langgraph | 0 |
| 内置skill包 | 0个实际包 | 4个完整包 |

---

## 二、具体改动项

### 1. ✅ 移除 LangGraph (减少 ~2,767 行)

**删除文件：**
- `src/extension/langgraph/LangGraphAgent.ts` (576行)
- `src/extension/langgraph/LangGraphHandler.ts` (420行)
- `src/extension/langgraph/nodes.ts` (773行)
- `src/extension/langgraph/toolAdapters.ts` (389行)
- `src/extension/langgraph/types.ts` (275行)
- `src/extension/langgraph/examples.ts` (288行)
- `src/extension/langgraph/index.ts` (46行)

**移除依赖：**
- `@langchain/core` `@langchain/langgraph` `@langchain/openai` `langchain`

**原因：** 整个 langgraph 目录在项目其他任何地方零引用。LangGraphAgent 有完整实现但从未被调用。AgentOrchestrator + IntentClassifier 已覆盖其全部设计意图。

---

### 2. ✅ 创建内置 Skill 包

每个包遵循标准格式：`SKILL.md` + `manifest.json` + `scripts/main.js`

| Skill ID | 功能 | 触发方式 |
|----------|------|---------|
| `code-reviewer` | 多维度代码审查(安全/性能/可维护性) | `@skill:code-reviewer`、"全面代码审查" |
| `dependency-guardian` | 依赖安全检查(npm/pip/go) | `@skill:dependency-guardian`、"安全检查" |
| `test-architect` | 测试架构分析与策略生成 | `@skill:test-architect`、"测试架构" |
| `tool-maker` | 小工具/CLI脚本生成 | `@skill:tool-maker`、"写一个脚本" |

**目录结构：**
```
src/extension/skills/builtin-packages/
├── code-reviewer/
│   ├── SKILL.md
│   ├── manifest.json
│   └── scripts/main.js
├── dependency-guardian/
│   ├── SKILL.md
│   ├── manifest.json
│   └── scripts/main.js
├── test-architect/
│   └── ...
└── tool-maker/
    └── ...
```

---

### 3. ✅ Skill 包管理入口

**SkillManager 新增功能：**

- `initialize()` — 自动加载内置skill包 + 已安装的skill包
- `registerCommands()` — 注册3个VSCode命令：
  - `aiAssistant.skill.install` — 安装对话框（支持本地/Git/URL三种来源）
  - `aiAssistant.skill.manage` — 管理对话框（启用/禁用/更新/卸载/查看详情）
  - `aiAssistant.skill.create` — 基于模板创建新skill包

**安装来源：**
| 来源 | 方法 | 说明 |
|------|------|------|
| 本地目录 | `installFromLocal(path)` | 选择包含manifest.json的目录 |
| Git仓库 | `installFromGit(url, {branch})` | 支持GitHub等git clone地址 |
| URL下载 | `installFromUrl(url)` | 支持zip格式下载链接 |

**内置包保护：** 内置skill包(installedAt=0)不允许卸载，只能禁用。

---

### 4. ✅ 意图识别优化

**IntentClassifier v2 改进：**

```
用户输入
  │
  ├─ /命令          → command
  ├─ @mcp:xxx      → mcp_tool (显式)
  ├─ @skill:xxx    → skill (显式)
  └─ 自然语言
      ├─ 有选中代码 + 代码操作词 → code_action (高置信度)
      ├─ skill关键词匹配       → skill
      ├─ MCP关键词匹配         → mcp_tool
      ├─ 代码操作词(无选中代码) → code_action (低置信度)
      └─ 其他                 → chat
```

**新增功能：**
- `registerSkillTriggers(rules)` — 动态注册skill触发规则
- `removeSkillTrigger(skillId)` — 移除触发规则
- `getRegisteredTriggers()` — 查看所有触发规则
- `skillParams` 字段 — 意图结果携带解析后的参数
- `mcpToolHint` 字段 — MCP工具提示

**关键原则保持不变：**
- 代码解释/修复/优化 = chat（AI本身就能做）
- 文件操作/终端/搜索 = mcp_tool（需要外部工具）
- 安全检查/测试架构 = skill（需要特定skill包能力）

---

### 5. ✅ 记忆系统优化

**MemoryManager v2 改进：**

| 优化项 | 改进前 | 改进后 |
|--------|--------|--------|
| 保存策略 | 每次cleanup都save | 防抖保存(3秒) |
| 关键词提取 | 每次重新计算 | LRU缓存(200条) |
| 停用词 | 数组线性查找 | Set O(1)查找 |
| 淘汰分数 | 可能负值 | Math.max(0, ...) |
| 定时器 | 清理=cleanup+save | 清理=cleanup, 脏标记触发save |

**架构保持两层不变：**
- 短期记忆：2小时TTL，最多40条，自动晋升
- 长期记忆：永久保留，最多100条，自动压缩合并

---

### 6. ✅ 代码架构梳理

**模块依赖关系（清晰无环）：**

```
extension.ts (入口)
  ├── chatview/
  │   ├── ChatViewProvider (主控)
  │   └── handlers/
  │       ├── ChatMessageHandler → IntentClassifier + MemoryManager
  │       ├── MCPHandler → MCPRegistry + MCPExecutor
  │       ├── CommandHandler
  │       ├── SessionHandler
  │       └── ...
  ├── agent/
  │   ├── IntentClassifier (意图路由)
  │   ├── AgentOrchestrator (技能调度)
  │   └── CodeActionHandler
  ├── skills/
  │   ├── implementations/ (内置技能逻辑)
  │   ├── builtin-packages/ (标准skill包) ← 新增
  │   ├── package/ (SkillManager/Loader/Executor/Bridge)
  │   └── adapters/ (语言适配器)
  ├── mcp/ (MCP工具系统)
  ├── memory/ (记忆管理)
  ├── api/ (AI API适配)
  └── services/
```

**冗余消除：**
- 移除了LangGraph整套未使用的agent系统（7个文件）
- IntentClassifier和AgentOrchestrator保持各自职责：
  - IntentClassifier: 路由决策（chat/skill/mcp/command）
  - AgentOrchestrator: 技能执行编排

---

## 三、安全性检查

| 检查项 | 状态 |
|--------|------|
| Skill沙箱执行(vm.Script) | ✅ 受限require白名单 |
| MCP权限控制(permissions) | ✅ manifest声明 |
| Skill注册工具前缀隔离 | ✅ `skill_{id}_` 前缀 |
| 用户输入sanitize | ✅ 正则匹配不执行任意代码 |
| 子进程超时 | ✅ 60s timeout |
| 内置包不可删除 | ✅ installedAt=0 保护 |
