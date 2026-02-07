# 示例Skill

这是一个示例skill包，展示skill包的基本结构和使用方法。

## 描述

此skill演示了如何创建一个完整的skill包，包括：
- 清单文件（manifest.json）
- 使用说明（SKILL.md）
- 脚本文件（scripts/）
- MCP工具集成

## 使用说明

### 基本用法

```
@skill:example-skill
```

### 带参数执行

```
@skill:example-skill {"input": "hello world"}
```

## 示例

### 示例1：简单执行

```javascript
// 直接执行skill
@skill:run example-skill
```

### 示例2：调用skill提供的MCP工具

```
@mcp:skill_example-skill_example-tool {"input": "test"}
```

## AI提示词

当用户请求执行此skill时：

1. 确认用户的输入参数
2. 调用skill的execute函数
3. 解析返回结果
4. 以友好格式展示给用户

如果出现错误，提供清晰的错误信息和可能的解决方案。

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| outputFormat | string | json | 输出格式 |

## API

### 提供的MCP工具

- `skill_example-skill_example-tool`: 示例工具，处理输入文本

### 调用的MCP工具

此skill可以调用所有可用的MCP工具（通过`mcpTools: ["*"]`配置）。
