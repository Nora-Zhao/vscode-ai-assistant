# Dependency Guardian

依赖安全守卫，自动检查项目依赖中的已知漏洞。

## 描述

支持多种包管理器的安全审计：
- **npm/yarn/pnpm**: `npm audit` / `yarn audit`
- **pip**: `pip-audit` / `safety check`
- **go**: `govulncheck`

## 使用说明

### 触发方式

```
"安全检查" / "漏洞扫描" / "npm audit" / "依赖安全"
/audit
@skill:dependency-guardian
```

## AI提示词

当用户请求依赖安全检查时：
1. 检测项目类型（package.json / requirements.txt / go.mod）
2. 运行对应的审计命令
3. 解析输出并按严重程度分类
4. 给出升级建议和修复命令
