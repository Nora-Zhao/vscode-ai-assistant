/**
 * 补充内置工具
 * 
 * 包含之前遗漏的工具定义和实现
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MCPToolDefinition, MCPBuiltinFunction } from './types';

// ============================================
// 补充工具定义
// ============================================

export function getAdditionalBuiltinTools(): MCPToolDefinition[] {
  return [
    // 测试生成器工具
    {
      id: 'builtin_generate_test',
      name: '生成单元测试',
      description: '自动识别项目测试框架并为源代码生成对应的单元测试，支持Jest/Vitest/Pytest/Go/JUnit等',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['test', 'unit-test', 'testing', 'generate', 'jest', 'vitest', 'pytest'],
      parameters: [
        {
          name: 'filePath',
          type: 'file',
          description: '要生成测试的源文件路径（可选，默认当前文件）',
          required: false,
        },
        {
          name: 'code',
          type: 'string',
          description: '要生成测试的代码内容（可选，如果不提供则读取文件）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '生成的测试代码、建议的文件路径、检测到的框架',
        schema: {
          testCode: 'string',
          suggestedPath: 'string',
          framework: 'string',
          language: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'generateTest',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当用户需要为代码生成单元测试时使用',
        examples: [
          {
            input: { filePath: 'src/utils.ts' },
            output: { testCode: '...', framework: 'jest', suggestedPath: 'src/utils_test.ts' },
            description: '为TypeScript文件生成Jest测试',
          },
        ],
        priority: 85,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },

    // 代码分析工具
    {
      id: 'builtin_analyze_code',
      name: '分析代码',
      description: '分析代码结构、复杂度、依赖关系等',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'analyze', 'structure', 'complexity', 'dependency'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要分析的文件路径（可选，默认当前文件）',
          required: false,
        },
        {
          name: 'type',
          type: 'string',
          description: '分析类型',
          required: false,
          default: 'full',
          validation: {
            enum: ['full', 'structure', 'complexity', 'dependencies', 'issues'],
          },
        },
        {
          name: 'includeMetrics',
          type: 'boolean',
          description: '是否包含代码度量指标',
          required: false,
          default: true,
        },
      ],
      returns: {
        type: 'object',
        description: '代码分析结果',
        schema: {
          structure: 'object',
          complexity: 'object',
          dependencies: 'array',
          issues: 'array',
          metrics: 'object',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'analyzeCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要了解代码结构、复杂度或寻找潜在问题时使用',
        examples: [
          {
            input: { file: 'src/index.ts', type: 'full' },
            output: {
              structure: { classes: 2, functions: 5 },
              complexity: { cyclomatic: 8 },
              dependencies: ['vscode', 'path'],
              issues: [],
            },
            description: '分析TypeScript文件',
          },
        ],
        priority: 80,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码重构工具
    {
      id: 'builtin_refactor_code',
      name: '重构代码',
      description: '执行代码重构操作，如提取函数、重命名、移动等',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'refactor', 'extract', 'rename', 'move'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: '重构操作类型',
          required: true,
          validation: {
            enum: ['extract-function', 'extract-variable', 'rename', 'move', 'inline'],
          },
        },
        {
          name: 'target',
          type: 'string',
          description: '目标代码或符号名称',
          required: true,
        },
        {
          name: 'newName',
          type: 'string',
          description: '新名称（用于rename操作）',
          required: false,
        },
        {
          name: 'destination',
          type: 'string',
          description: '目标位置（用于move操作）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '重构结果',
        schema: {
          success: 'boolean',
          changes: 'array',
          preview: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'refactorCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要重构代码时使用',
        priority: 70,
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码格式化工具
    {
      id: 'builtin_format_code',
      name: '格式化代码',
      description: '格式化代码或文件',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'format', 'prettier', 'lint'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要格式化的文件（可选，默认当前文件）',
          required: false,
        },
        {
          name: 'formatter',
          type: 'string',
          description: '使用的格式化工具',
          required: false,
          default: 'auto',
          validation: {
            enum: ['auto', 'prettier', 'eslint', 'vscode'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '格式化结果',
        schema: {
          success: 'boolean',
          formatted: 'string',
          changes: 'number',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'formatCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要格式化代码时使用',
        priority: 65,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码解释工具
    {
      id: 'builtin_explain_code',
      name: '解释代码',
      description: '获取代码的详细解释，包括函数作用、参数说明等',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'explain', 'document', 'understand'],
      parameters: [
        {
          name: 'code',
          type: 'code',
          description: '要解释的代码（可选，使用选中内容）',
          required: false,
        },
        {
          name: 'level',
          type: 'string',
          description: '解释详细程度',
          required: false,
          default: 'normal',
          validation: {
            enum: ['brief', 'normal', 'detailed'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '代码解释',
        schema: {
          summary: 'string',
          details: 'object',
          examples: 'array',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'explainCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当用户请求解释代码时使用',
        priority: 75,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码优化建议工具
    {
      id: 'builtin_suggest_optimization',
      name: '优化建议',
      description: '分析代码并提供优化建议',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'optimize', 'performance', 'suggestion'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要分析的文件',
          required: false,
        },
        {
          name: 'focus',
          type: 'string',
          description: '优化重点',
          required: false,
          default: 'all',
          validation: {
            enum: ['all', 'performance', 'readability', 'security', 'memory'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '优化建议列表',
        schema: {
          suggestions: 'array',
          priority: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'suggestOptimization',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要改进代码质量时使用',
        priority: 70,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 文档生成工具
    {
      id: 'builtin_generate_docs',
      name: '生成文档',
      description: '为代码生成文档注释',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'document', 'jsdoc', 'comment'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要生成文档的文件',
          required: false,
        },
        {
          name: 'style',
          type: 'string',
          description: '文档风格',
          required: false,
          default: 'jsdoc',
          validation: {
            enum: ['jsdoc', 'tsdoc', 'docstring', 'javadoc'],
          },
        },
        {
          name: 'overwrite',
          type: 'boolean',
          description: '是否覆盖现有文档',
          required: false,
          default: false,
        },
      ],
      returns: {
        type: 'object',
        description: '生成的文档',
        schema: {
          documentedItems: 'number',
          preview: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'generateDocs',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要为代码添加文档注释时使用',
        priority: 65,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 依赖分析工具
    {
      id: 'builtin_analyze_dependencies',
      name: '分析依赖',
      description: '分析项目依赖关系、版本和安全问题',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['dependency', 'package', 'npm', 'security', 'audit'],
      parameters: [
        {
          name: 'type',
          type: 'string',
          description: '分析类型',
          required: false,
          default: 'all',
          validation: {
            enum: ['all', 'outdated', 'security', 'unused', 'duplicates'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '依赖分析结果',
        schema: {
          dependencies: 'object',
          devDependencies: 'object',
          issues: 'array',
          recommendations: 'array',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'analyzeDependencies',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要检查项目依赖时使用',
        priority: 60,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码片段工具
    {
      id: 'builtin_code_snippet',
      name: '代码片段',
      description: '搜索和插入常用代码片段',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'snippet', 'template', 'boilerplate'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: '操作类型',
          required: true,
          validation: {
            enum: ['search', 'insert', 'save', 'list'],
          },
        },
        {
          name: 'query',
          type: 'string',
          description: '搜索关键词（search时需要）',
          required: false,
        },
        {
          name: 'snippet',
          type: 'code',
          description: '代码片段（insert/save时需要）',
          required: false,
        },
        {
          name: 'name',
          type: 'string',
          description: '片段名称（save时需要）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '操作结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'codeSnippet',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要使用常用代码模板时使用',
        priority: 55,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 终端管理工具
    {
      id: 'builtin_terminal',
      name: '终端管理',
      description: '创建、切换和管理终端',
      version: '1.0.0',
      author: 'System',
      category: 'shell',
      tags: ['terminal', 'shell', 'console'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: '操作类型',
          required: true,
          validation: {
            enum: ['create', 'show', 'hide', 'dispose', 'list', 'sendText'],
          },
        },
        {
          name: 'name',
          type: 'string',
          description: '终端名称',
          required: false,
        },
        {
          name: 'text',
          type: 'string',
          description: '要发送的文本（sendText时需要）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '终端操作结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'terminalManage',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要管理VS Code终端时使用',
        priority: 50,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 工作区管理工具
    {
      id: 'builtin_workspace',
      name: '工作区管理',
      description: '管理VS Code工作区',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['workspace', 'folder', 'project'],
      parameters: [
        {
          name: 'action',
          type: 'string',
          description: '操作类型',
          required: true,
          validation: {
            enum: ['info', 'addFolder', 'removeFolder', 'openFile', 'openFolder'],
          },
        },
        {
          name: 'path',
          type: 'string',
          description: '文件或文件夹路径',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '工作区信息或操作结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'workspaceManage',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要管理工作区时使用',
        priority: 50,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 符号查找工具
    {
      id: 'builtin_find_symbol',
      name: '查找符号',
      description: '在工作区中查找符号定义',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['symbol', 'definition', 'reference', 'find'],
      parameters: [
        {
          name: 'name',
          type: 'string',
          description: '符号名称',
          required: true,
        },
        {
          name: 'kind',
          type: 'string',
          description: '符号类型',
          required: false,
          validation: {
            enum: ['all', 'class', 'function', 'method', 'variable', 'interface', 'type'],
          },
        },
      ],
      returns: {
        type: 'array',
        description: '符号位置列表',
      },
      execution: {
        type: 'function',
        builtinFunction: 'findSymbol',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要查找代码中的符号定义时使用',
        priority: 75,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码诊断工具
    {
      id: 'builtin_diagnostics',
      name: '代码诊断',
      description: '获取代码诊断信息（错误、警告等）',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['diagnostics', 'errors', 'warnings', 'lint'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要诊断的文件（可选，默认当前文件）',
          required: false,
        },
        {
          name: 'severity',
          type: 'string',
          description: '严重程度过滤',
          required: false,
          default: 'all',
          validation: {
            enum: ['all', 'error', 'warning', 'info', 'hint'],
          },
        },
      ],
      returns: {
        type: 'array',
        description: '诊断信息列表',
      },
      execution: {
        type: 'function',
        builtinFunction: 'getDiagnostics',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要检查代码问题时使用',
        priority: 80,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 自动修复工具
    {
      id: 'builtin_auto_fix',
      name: '自动修复',
      description: '自动修复代码问题',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['fix', 'auto', 'quick-fix', 'repair'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要修复的文件',
          required: false,
        },
        {
          name: 'diagnosticIndex',
          type: 'number',
          description: '要修复的诊断索引（可选，不指定则修复所有）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '修复结果',
        schema: {
          fixed: 'number',
          remaining: 'number',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'autoFix',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要自动修复代码问题时使用',
        priority: 70,
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 列出MCP工具
    {
      id: 'builtin_list_tools',
      name: '列出工具',
      description: '列出所有可用的MCP工具',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['mcp', 'tools', 'list', 'help'],
      parameters: [
        {
          name: 'category',
          type: 'string',
          description: '按类别过滤',
          required: false,
        },
        {
          name: 'search',
          type: 'string',
          description: '搜索关键词',
          required: false,
        },
      ],
      returns: {
        type: 'array',
        description: '工具列表',
      },
      execution: {
        type: 'function',
        builtinFunction: 'listTools',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要查看可用工具时使用',
        priority: 50,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
  ];
}

// ============================================
// 补充函数实现
// ============================================

export const additionalBuiltinFunctions: Record<string, MCPBuiltinFunction> = {
  /**
   * 生成单元测试
   * 此函数会发送消息到chatView触发TestHandler
   */
  generateTest: async (params, context) => {
    const { filePath, code } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    let targetPath = filePath;
    let sourceCode = code;
    
    // 如果没有提供文件路径，使用当前活动文件
    if (!targetPath) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        targetPath = editor.document.uri.fsPath;
      }
    }
    
    if (!targetPath && !sourceCode) {
      throw new Error('请提供文件路径或代码内容');
    }
    
    // 如果提供了文件路径但没有代码，读取文件
    if (targetPath && !sourceCode) {
      const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(workspaceRoot, targetPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`文件不存在: ${targetPath}`);
      }
      sourceCode = fs.readFileSync(fullPath, 'utf-8');
    }
    
    // 使用TestGenerator检测框架
    const { TestGenerator } = await import('../test-generator/TestGenerator');
    const testGen = new TestGenerator(context._extensionContext || ({} as any));
    
    const effectivePath = targetPath || 'inline.ts';
    const { language, framework } = testGen.detectLanguageAndFramework(effectivePath, workspaceRoot);
    const testFilePath = testGen.generateTestFilePath(effectivePath, framework);
    const prompt = testGen.generatePrompt(sourceCode!, effectivePath, framework);
    
    // 通过 vscode command 触发 TestHandler 实际生成测试
    try {
      await vscode.commands.executeCommand('aiAssistant.chatView.focus');
    } catch {}
    
    // 通过内部消息触发实际的测试生成
    // generateTestFile command 会通知 ChatViewProvider 调用 TestHandler
    try {
      await vscode.commands.executeCommand('aiAssistant.triggerTestGeneration', effectivePath);
    } catch {
      // 命令可能未注册，回退返回生成信息
    }
    
    return {
      status: 'generating',
      message: `正在为 ${path.basename(effectivePath)} 生成 ${framework} 测试...`,
      framework,
      language,
      suggestedPath: testFilePath,
      sourceFile: effectivePath,
      sourceCode: sourceCode!.slice(0, 500) + (sourceCode!.length > 500 ? '...' : ''),
      prompt: prompt,
      instruction: `请为以上代码生成 ${framework} 单元测试`,
    };
  },

  /**
   * 分析代码
   */
  analyzeCode: async (params, context) => {
    const { file, type = 'full', includeMetrics = true } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    let content = '';
    let filePath = file;
    
    // 获取文件内容
    if (!file) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        content = editor.document.getText();
        filePath = vscode.workspace.asRelativePath(editor.document.uri);
      }
    } else {
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    
    if (!content) {
      throw new Error('无法获取文件内容');
    }
    
    const result: any = {};
    
    // 结构分析
    if (type === 'full' || type === 'structure') {
      result.structure = analyzeStructure(content, filePath);
    }
    
    // 复杂度分析
    if (type === 'full' || type === 'complexity') {
      result.complexity = analyzeComplexity(content);
    }
    
    // 依赖分析
    if (type === 'full' || type === 'dependencies') {
      result.dependencies = analyzeDeps(content, filePath);
    }
    
    // 问题检测
    if (type === 'full' || type === 'issues') {
      result.issues = detectIssues(content, filePath);
    }
    
    // 代码度量
    if (includeMetrics) {
      result.metrics = calculateMetrics(content);
    }
    
    return result;
  },
  
  /**
   * 重构代码
   */
  refactorCode: async (params, context) => {
    const { action, target, newName, destination } = params;
    
    // 使用VS Code的重构功能
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('没有活动的编辑器');
    }
    
    switch (action) {
      case 'rename':
        if (!newName) throw new Error('需要提供新名称');
        await vscode.commands.executeCommand('editor.action.rename');
        return { success: true, message: '请在弹出的输入框中输入新名称' };
      
      case 'extract-function':
        await vscode.commands.executeCommand('editor.action.codeAction', {
          kind: 'refactor.extract.function',
        });
        return { success: true, message: '请选择要提取的代码' };
      
      case 'extract-variable':
        await vscode.commands.executeCommand('editor.action.codeAction', {
          kind: 'refactor.extract.constant',
        });
        return { success: true, message: '请选择要提取的表达式' };
      
      case 'inline':
        await vscode.commands.executeCommand('editor.action.codeAction', {
          kind: 'refactor.inline',
        });
        return { success: true, message: '内联操作已触发' };
      
      default:
        throw new Error(`不支持的重构操作: ${action}`);
    }
  },
  
  /**
   * 格式化代码
   */
  formatCode: async (params, context) => {
    const { file, formatter = 'auto' } = params;
    
    if (file) {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      const uri = vscode.Uri.file(fullPath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    }
    
    await vscode.commands.executeCommand('editor.action.formatDocument');
    
    return {
      success: true,
      message: '格式化完成',
    };
  },
  
  /**
   * 解释代码
   */
  explainCode: async (params, context) => {
    const { code, level = 'normal' } = params;
    
    let targetCode = code;
    
    if (!targetCode) {
      const editor = vscode.window.activeTextEditor;
      if (editor && !editor.selection.isEmpty) {
        targetCode = editor.document.getText(editor.selection);
      }
    }
    
    if (!targetCode) {
      throw new Error('请选择要解释的代码');
    }
    
    // 返回代码和级别，让AI进行实际解释
    return {
      code: targetCode,
      level,
      instruction: `请${level === 'brief' ? '简要' : level === 'detailed' ? '详细' : ''}解释以下代码的作用`,
    };
  },
  
  /**
   * 优化建议
   */
  suggestOptimization: async (params, context) => {
    const { file, focus = 'all' } = params;
    
    let content = '';
    let filePath = file;
    
    if (!file) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        content = editor.document.getText();
        filePath = vscode.workspace.asRelativePath(editor.document.uri);
      }
    } else {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    
    if (!content) {
      throw new Error('无法获取文件内容');
    }
    
    return {
      code: content,
      file: filePath,
      focus,
      instruction: `请分析代码并提供${focus === 'all' ? '全面的' : focus}优化建议`,
    };
  },
  
  /**
   * 生成文档
   */
  generateDocs: async (params, context) => {
    const { file, style = 'jsdoc', overwrite = false } = params;
    
    let content = '';
    let filePath = file;
    
    if (!file) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        content = editor.document.getText();
        filePath = vscode.workspace.asRelativePath(editor.document.uri);
      }
    } else {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    
    if (!content) {
      throw new Error('无法获取文件内容');
    }
    
    return {
      code: content,
      file: filePath,
      style,
      overwrite,
      instruction: `请为代码生成 ${style} 风格的文档注释`,
    };
  },
  
  /**
   * 分析依赖
   */
  analyzeDependencies: async (params, context) => {
    const { type = 'all' } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    const pkgPath = path.join(workspaceRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      throw new Error('找不到 package.json');
    }
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const result: any = {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      issues: [],
      recommendations: [],
    };
    
    // 检查过期依赖
    if (type === 'all' || type === 'outdated') {
      // 这里可以调用 npm outdated 命令
      result.recommendations.push('运行 npm outdated 检查过期依赖');
    }
    
    // 检查安全问题
    if (type === 'all' || type === 'security') {
      result.recommendations.push('运行 npm audit 检查安全问题');
    }
    
    return result;
  },
  
  /**
   * 代码片段
   */
  codeSnippet: async (params, context) => {
    const { action, query, snippet, name } = params;
    
    switch (action) {
      case 'list':
        return { snippets: ['component', 'hook', 'api-call', 'test'] };
      
      case 'search':
        return {
          results: [],
          instruction: `搜索代码片段: ${query}`,
        };
      
      case 'insert':
        if (!snippet) throw new Error('需要提供代码片段');
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit(builder => {
            builder.insert(editor.selection.active, snippet);
          });
        }
        return { success: true };
      
      case 'save':
        return { success: true, message: '片段保存功能待实现' };
      
      default:
        throw new Error(`不支持的操作: ${action}`);
    }
  },
  
  /**
   * 终端管理
   */
  terminalManage: async (params, context) => {
    const { action, name, text } = params;
    
    switch (action) {
      case 'create':
        const terminal = vscode.window.createTerminal(name || 'AI Assistant');
        terminal.show();
        return { success: true, name: terminal.name };
      
      case 'list':
        return {
          terminals: vscode.window.terminals.map(t => ({
            name: t.name,
          })),
        };
      
      case 'sendText':
        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal && text) {
          activeTerminal.sendText(text);
        }
        return { success: true };
      
      case 'show':
        vscode.window.activeTerminal?.show();
        return { success: true };
      
      case 'hide':
        vscode.window.activeTerminal?.hide();
        return { success: true };
      
      default:
        throw new Error(`不支持的操作: ${action}`);
    }
  },
  
  /**
   * 工作区管理
   */
  workspaceManage: async (params, context) => {
    const { action, path: targetPath } = params;
    
    switch (action) {
      case 'info':
        return {
          folders: vscode.workspace.workspaceFolders?.map(f => ({
            name: f.name,
            path: f.uri.fsPath,
          })) || [],
          name: vscode.workspace.name,
        };
      
      case 'openFile':
        if (targetPath) {
          const uri = vscode.Uri.file(targetPath);
          await vscode.window.showTextDocument(uri);
        }
        return { success: true };
      
      case 'openFolder':
        if (targetPath) {
          await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(targetPath));
        }
        return { success: true };
      
      default:
        throw new Error(`不支持的操作: ${action}`);
    }
  },
  
  /**
   * 查找符号
   */
  findSymbol: async (params, context) => {
    const { name, kind = 'all' } = params;
    
    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeWorkspaceSymbolProvider',
      name
    );
    
    if (!symbols) {
      return [];
    }
    
    const kindFilter = kind === 'all' ? null : getSymbolKind(kind);
    
    return symbols
      .filter(s => kindFilter === null || s.kind === kindFilter)
      .slice(0, 20)
      .map(s => ({
        name: s.name,
        kind: vscode.SymbolKind[s.kind],
        file: vscode.workspace.asRelativePath(s.location.uri),
        line: s.location.range.start.line + 1,
      }));
  },
  
  /**
   * 获取诊断信息
   */
  getDiagnostics: async (params, context) => {
    const { file, severity = 'all' } = params;
    
    let uri: vscode.Uri | undefined;
    
    if (file) {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      uri = vscode.Uri.file(fullPath);
    } else {
      uri = vscode.window.activeTextEditor?.document.uri;
    }
    
    if (!uri) {
      throw new Error('请指定文件或打开一个文件');
    }
    
    const diagnostics = vscode.languages.getDiagnostics(uri);
    
    const severityFilter = getSeverityFilter(severity);
    
    return diagnostics
      .filter(d => severityFilter === null || d.severity === severityFilter)
      .map(d => ({
        message: d.message,
        severity: vscode.DiagnosticSeverity[d.severity],
        line: d.range.start.line + 1,
        column: d.range.start.character + 1,
        source: d.source,
      }));
  },
  
  /**
   * 自动修复
   */
  autoFix: async (params, context) => {
    const { file } = params;
    
    if (file) {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      const uri = vscode.Uri.file(fullPath);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    }
    
    await vscode.commands.executeCommand('editor.action.fixAll');
    
    return {
      success: true,
      message: '自动修复已执行',
    };
  },
  
  /**
   * 列出工具
   */
  listTools: async (params, context) => {
    const { category, search } = params;
    
    // 这个函数的实际实现需要访问 MCPRegistry
    // 这里返回一个占位符
    return {
      instruction: `列出${category ? `${category}类别的` : '所有'}工具${search ? `，搜索: ${search}` : ''}`,
    };
  },
};

// ============================================
// 辅助函数
// ============================================

function analyzeStructure(content: string, filePath: string): any {
  const structure: any = {
    classes: 0,
    functions: 0,
    methods: 0,
    interfaces: 0,
    variables: 0,
    exports: 0,
  };
  
  // 简单的正则匹配（实际项目中可以使用AST解析）
  structure.classes = (content.match(/\bclass\s+\w+/g) || []).length;
  structure.functions = (content.match(/\bfunction\s+\w+/g) || []).length +
    (content.match(/\bconst\s+\w+\s*=\s*(async\s+)?\(/g) || []).length;
  structure.interfaces = (content.match(/\binterface\s+\w+/g) || []).length;
  structure.exports = (content.match(/\bexport\s+(default\s+)?/g) || []).length;
  
  return structure;
}

function analyzeComplexity(content: string): any {
  // 简化的复杂度计算
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;
  
  // 计算圈复杂度的简化版本
  const branchingKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '\\?', '&&', '\\|\\|'];
  let cyclomatic = 1;
  
  branchingKeywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g');
    cyclomatic += (content.match(regex) || []).length;
  });
  
  return {
    cyclomatic,
    linesOfCode: lines.length,
    nonEmptyLines,
    commentLines: lines.filter(l => l.trim().startsWith('//')).length,
  };
}

function analyzeDeps(content: string, filePath: string): string[] {
  const deps: string[] = [];
  
  // 匹配 import 语句
  const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
  for (const match of importMatches) {
    deps.push(match[1]);
  }
  
  // 匹配 require 语句
  const requireMatches = content.matchAll(/require\s*\(\s*['"](.+?)['"]\s*\)/g);
  for (const match of requireMatches) {
    deps.push(match[1]);
  }
  
  return [...new Set(deps)];
}

function detectIssues(content: string, filePath: string): any[] {
  const issues: any[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // 检测 console.log
    if (/console\.(log|warn|error)/.test(line)) {
      issues.push({
        type: 'warning',
        line: index + 1,
        message: '代码中包含 console 语句',
      });
    }
    
    // 检测 TODO/FIXME
    if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(line)) {
      issues.push({
        type: 'info',
        line: index + 1,
        message: line.match(/\/\/\s*(TODO|FIXME|HACK|XXX).*/i)?.[0] || 'TODO/FIXME 注释',
      });
    }
    
    // 检测过长的行
    if (line.length > 120) {
      issues.push({
        type: 'style',
        line: index + 1,
        message: '行长度超过120字符',
      });
    }
  });
  
  return issues;
}

function calculateMetrics(content: string): any {
  const lines = content.split('\n');
  
  return {
    totalLines: lines.length,
    codeLines: lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//')).length,
    commentLines: lines.filter(l => l.trim().startsWith('//')).length,
    blankLines: lines.filter(l => l.trim().length === 0).length,
    avgLineLength: Math.round(lines.reduce((sum, l) => sum + l.length, 0) / lines.length),
    maxLineLength: Math.max(...lines.map(l => l.length)),
  };
}

function getSymbolKind(kind: string): vscode.SymbolKind | null {
  const mapping: Record<string, vscode.SymbolKind> = {
    class: vscode.SymbolKind.Class,
    function: vscode.SymbolKind.Function,
    method: vscode.SymbolKind.Method,
    variable: vscode.SymbolKind.Variable,
    interface: vscode.SymbolKind.Interface,
    type: vscode.SymbolKind.TypeParameter,
  };
  return mapping[kind] || null;
}

function getSeverityFilter(severity: string): vscode.DiagnosticSeverity | null {
  const mapping: Record<string, vscode.DiagnosticSeverity> = {
    error: vscode.DiagnosticSeverity.Error,
    warning: vscode.DiagnosticSeverity.Warning,
    info: vscode.DiagnosticSeverity.Information,
    hint: vscode.DiagnosticSeverity.Hint,
  };
  return mapping[severity] || null;
}
