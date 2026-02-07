/**
 * MCP 内置工具定义
 * 
 * 提供一组开箱即用的常用工具
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MCPToolDefinition, MCPBuiltinFunction, MCPBuiltinRegistry } from './types';

// ============================================
// 内置工具定义
// ============================================

/**
 * 获取所有内置工具
 */
export function getBuiltinTools(): MCPToolDefinition[] {
  return [
    // 文件读取工具
    {
      id: 'builtin_read_file',
      name: '读取文件',
      description: '读取指定路径的文件内容',
      version: '1.0.0',
      author: 'System',
      category: 'file',
      tags: ['file', 'read', 'content'],
      parameters: [
        {
          name: 'filePath',
          type: 'file',
          description: '文件路径（相对于工作区或绝对路径）',
          required: true,
        },
        {
          name: 'encoding',
          type: 'string',
          description: '文件编码',
          required: false,
          default: 'utf-8',
          validation: {
            enum: ['utf-8', 'ascii', 'utf-16', 'latin1'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '文件内容和元信息',
        schema: {
          content: 'string',
          size: 'number',
          path: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'readFile',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要读取文件内容时使用',
        examples: [
          {
            input: { filePath: 'src/index.ts' },
            output: { content: '...', size: 1234, path: '/workspace/src/index.ts' },
            description: '读取TypeScript文件',
          },
        ],
        priority: 80,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 文件写入工具
    {
      id: 'builtin_write_file',
      name: '写入文件',
      description: '将内容写入指定文件',
      version: '1.0.0',
      author: 'System',
      category: 'file',
      tags: ['file', 'write', 'save'],
      parameters: [
        {
          name: 'filePath',
          type: 'file',
          description: '文件路径',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: '要写入的内容',
          required: true,
        },
        {
          name: 'createDir',
          type: 'boolean',
          description: '如果目录不存在是否创建',
          required: false,
          default: true,
        },
      ],
      returns: {
        type: 'object',
        description: '写入结果',
        schema: {
          success: 'boolean',
          path: 'string',
          size: 'number',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'writeFile',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要创建或修改文件时使用',
        priority: 70,
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 文件搜索工具
    {
      id: 'builtin_search_files',
      name: '搜索文件',
      description: '在工作区中搜索匹配的文件',
      version: '1.0.0',
      author: 'System',
      category: 'file',
      tags: ['file', 'search', 'find', 'glob'],
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          description: 'Glob模式，如 **/*.ts',
          required: true,
        },
        {
          name: 'exclude',
          type: 'string',
          description: '排除的Glob模式',
          required: false,
          default: '**/node_modules/**',
        },
        {
          name: 'maxResults',
          type: 'number',
          description: '最大结果数',
          required: false,
          default: 100,
        },
      ],
      returns: {
        type: 'array',
        description: '匹配的文件路径列表',
      },
      execution: {
        type: 'function',
        builtinFunction: 'searchFiles',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要查找项目中的文件时使用',
        examples: [
          {
            input: { pattern: '**/*.test.ts' },
            output: ['src/utils.test.ts', 'src/api.test.ts'],
            description: '搜索所有测试文件',
          },
        ],
        priority: 75,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 代码搜索工具
    {
      id: 'builtin_search_code',
      name: '搜索代码',
      description: '在代码文件中搜索文本或正则表达式',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'search', 'grep', 'regex'],
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: '搜索文本或正则表达式',
          required: true,
        },
        {
          name: 'isRegex',
          type: 'boolean',
          description: '是否使用正则表达式',
          required: false,
          default: false,
        },
        {
          name: 'include',
          type: 'string',
          description: '包含的文件模式',
          required: false,
          default: '**/*',
        },
        {
          name: 'maxResults',
          type: 'number',
          description: '最大结果数',
          required: false,
          default: 50,
        },
      ],
      returns: {
        type: 'array',
        description: '搜索结果列表',
        schema: {
          items: {
            file: 'string',
            line: 'number',
            column: 'number',
            text: 'string',
          },
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'searchCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要在代码中搜索特定内容时使用',
        priority: 85,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 执行Shell命令
    {
      id: 'builtin_run_command',
      name: '执行命令',
      description: '在终端执行Shell命令',
      version: '1.0.0',
      author: 'System',
      category: 'shell',
      tags: ['shell', 'command', 'terminal', 'exec'],
      parameters: [
        {
          name: 'command',
          type: 'string',
          description: '要执行的命令',
          required: true,
        },
        {
          name: 'cwd',
          type: 'string',
          description: '工作目录',
          required: false,
        },
        {
          name: 'timeout',
          type: 'number',
          description: '超时时间（毫秒）',
          required: false,
          default: 30000,
        },
      ],
      returns: {
        type: 'object',
        description: '命令执行结果',
        schema: {
          stdout: 'string',
          stderr: 'string',
          exitCode: 'number',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'runCommand',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要执行终端命令时使用，如npm install, git status等',
        examples: [
          {
            input: { command: 'npm run build' },
            output: { stdout: 'Build completed', stderr: '', exitCode: 0 },
          },
        ],
        priority: 60,
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ['user', 'agent'],
        dangerousPatterns: ['rm -rf', 'format', 'del /s'],
      },
    },
    
    // HTTP请求工具
    {
      id: 'builtin_http_request',
      name: 'HTTP请求',
      description: '发送HTTP请求并获取响应',
      version: '1.0.0',
      author: 'System',
      category: 'web',
      tags: ['http', 'api', 'request', 'fetch'],
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: '请求URL',
          required: true,
        },
        {
          name: 'method',
          type: 'string',
          description: 'HTTP方法',
          required: false,
          default: 'GET',
          validation: {
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          },
        },
        {
          name: 'headers',
          type: 'object',
          description: '请求头',
          required: false,
        },
        {
          name: 'body',
          type: 'string',
          description: '请求体',
          required: false,
        },
        {
          name: 'timeout',
          type: 'number',
          description: '超时时间（毫秒）',
          required: false,
          default: 30000,
        },
      ],
      returns: {
        type: 'object',
        description: 'HTTP响应',
        schema: {
          status: 'number',
          statusText: 'string',
          headers: 'object',
          body: 'string',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'httpRequest',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要调用外部API或获取网络资源时使用',
        priority: 65,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 获取项目结构
    {
      id: 'builtin_get_project_structure',
      name: '获取项目结构',
      description: '获取当前项目的目录结构',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['project', 'structure', 'tree', 'directory'],
      parameters: [
        {
          name: 'depth',
          type: 'number',
          description: '目录深度',
          required: false,
          default: 3,
        },
        {
          name: 'exclude',
          type: 'array',
          description: '排除的目录',
          required: false,
          default: ['node_modules', '.git', 'dist', 'build'],
          items: {
            type: 'string',
          },
        },
      ],
      returns: {
        type: 'object',
        description: '项目结构树',
      },
      execution: {
        type: 'function',
        builtinFunction: 'getProjectStructure',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要了解项目整体结构时使用',
        priority: 90,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 获取当前编辑器信息
    {
      id: 'builtin_get_editor_context',
      name: '获取编辑器上下文',
      description: '获取当前活动编辑器的信息',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['editor', 'context', 'selection', 'cursor'],
      parameters: [],
      returns: {
        type: 'object',
        description: '编辑器上下文信息',
        schema: {
          fileName: 'string',
          language: 'string',
          content: 'string',
          selection: 'string',
          cursorPosition: 'object',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'getEditorContext',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要获取用户当前正在编辑的文件信息时使用',
        priority: 95,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 插入代码到编辑器
    {
      id: 'builtin_insert_code',
      name: '插入代码',
      description: '在当前编辑器光标位置插入代码',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['code', 'insert', 'editor'],
      parameters: [
        {
          name: 'code',
          type: 'code',
          description: '要插入的代码',
          required: true,
        },
        {
          name: 'position',
          type: 'string',
          description: '插入位置',
          required: false,
          default: 'cursor',
          validation: {
            enum: ['cursor', 'start', 'end', 'replace-selection'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '插入结果',
        schema: {
          success: 'boolean',
          insertedAt: 'object',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'insertCode',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要在编辑器中插入代码时使用',
        priority: 70,
      },
      security: {
        requireConfirmation: false,
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git状态
    {
      id: 'builtin_git_status',
      name: 'Git状态',
      description: '获取当前Git仓库状态',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'status', 'version-control'],
      parameters: [],
      returns: {
        type: 'object',
        description: 'Git状态信息',
        schema: {
          branch: 'string',
          staged: 'array',
          modified: 'array',
          untracked: 'array',
        },
      },
      execution: {
        type: 'command',
        command: {
          command: 'git status --porcelain -b',
          timeout: 10000,
        },
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要了解Git仓库状态时使用',
        priority: 60,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // ============================================
    // 命令迁移 - 将 /命令 迁移为 MCP 工具
    // ============================================
    
    // 帮助命令
    {
      id: 'builtin_help',
      name: '显示帮助',
      description: '显示所有可用的命令和功能帮助信息',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['help', 'command', 'usage'],
      parameters: [],
      returns: {
        type: 'string',
        description: '帮助信息文本',
      },
      execution: {
        type: 'function',
        builtinFunction: 'showHelp',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当用户询问如何使用或需要帮助时',
        priority: 50,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 项目初始化/分析
    {
      id: 'builtin_init_project',
      name: '分析项目',
      description: '分析并理解当前项目的结构、类型、框架和依赖',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['project', 'init', 'analyze', 'structure'],
      parameters: [
        {
          name: 'depth',
          type: 'number',
          description: '分析深度',
          required: false,
          default: 3,
        },
      ],
      returns: {
        type: 'object',
        description: '项目分析结果',
        schema: {
          type: 'string',
          framework: 'string',
          language: 'string',
          structure: 'object',
        },
      },
      execution: {
        type: 'function',
        builtinFunction: 'initProject',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要了解项目结构或开始新的工作会话时',
        priority: 85,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - pull
    {
      id: 'builtin_git_pull',
      name: 'Git拉取',
      description: '从远程仓库拉取最新代码 (git pull)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'pull', 'sync'],
      parameters: [
        {
          name: 'remote',
          type: 'string',
          description: '远程仓库名称',
          required: false,
          default: 'origin',
        },
        {
          name: 'branch',
          type: 'string',
          description: '分支名称',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '命令执行结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitPull',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要拉取远程代码更新时',
        priority: 55,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - push
    {
      id: 'builtin_git_push',
      name: 'Git推送',
      description: '推送本地提交到远程仓库 (git push)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'push', 'sync'],
      parameters: [
        {
          name: 'remote',
          type: 'string',
          description: '远程仓库名称',
          required: false,
          default: 'origin',
        },
        {
          name: 'branch',
          type: 'string',
          description: '分支名称',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '命令执行结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitPush',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要推送本地代码到远程仓库时',
        priority: 55,
      },
      security: {
        requireConfirmation: true,
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - commit
    {
      id: 'builtin_git_commit',
      name: 'Git提交',
      description: '提交更改到本地仓库 (git commit)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'commit', 'save'],
      parameters: [
        {
          name: 'message',
          type: 'string',
          description: '提交信息',
          required: true,
        },
        {
          name: 'all',
          type: 'boolean',
          description: '是否提交所有更改 (-a)',
          required: false,
          default: false,
        },
      ],
      returns: {
        type: 'object',
        description: '命令执行结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitCommit',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要提交代码更改时',
        priority: 60,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - checkout
    {
      id: 'builtin_git_checkout',
      name: 'Git切换分支',
      description: '切换到指定分支 (git checkout)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'checkout', 'branch', 'switch'],
      parameters: [
        {
          name: 'branch',
          type: 'string',
          description: '分支名称',
          required: true,
        },
        {
          name: 'create',
          type: 'boolean',
          description: '是否创建新分支 (-b)',
          required: false,
          default: false,
        },
      ],
      returns: {
        type: 'object',
        description: '命令执行结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitCheckout',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要切换分支时',
        priority: 55,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - diff
    {
      id: 'builtin_git_diff',
      name: 'Git差异',
      description: '显示未提交的更改 (git diff)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'diff', 'changes'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '指定文件（可选，不指定则显示所有更改）',
          required: false,
        },
        {
          name: 'staged',
          type: 'boolean',
          description: '是否显示已暂存的更改 (--staged)',
          required: false,
          default: false,
        },
      ],
      returns: {
        type: 'object',
        description: '差异内容',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitDiff',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要查看代码更改时',
        priority: 60,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // Git 快捷命令 - log
    {
      id: 'builtin_git_log',
      name: 'Git日志',
      description: '显示提交历史 (git log)',
      version: '1.0.0',
      author: 'System',
      category: 'utility',
      tags: ['git', 'log', 'history'],
      parameters: [
        {
          name: 'count',
          type: 'number',
          description: '显示的提交数量',
          required: false,
          default: 15,
        },
        {
          name: 'oneline',
          type: 'boolean',
          description: '单行显示 (--oneline)',
          required: false,
          default: true,
        },
      ],
      returns: {
        type: 'object',
        description: '提交历史',
      },
      execution: {
        type: 'function',
        builtinFunction: 'gitLog',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要查看提交历史时',
        priority: 55,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 运行测试
    {
      id: 'builtin_run_test',
      name: '运行测试',
      description: '运行项目的测试套件',
      version: '1.0.0',
      author: 'System',
      category: 'test',
      tags: ['test', 'run', 'unit', 'jest', 'vitest'],
      parameters: [
        {
          name: 'pattern',
          type: 'string',
          description: '测试文件模式（可选）',
          required: false,
        },
        {
          name: 'watch',
          type: 'boolean',
          description: '是否监听模式',
          required: false,
          default: false,
        },
      ],
      returns: {
        type: 'object',
        description: '测试执行结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'runTest',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要运行测试时',
        priority: 65,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 构建项目
    {
      id: 'builtin_build',
      name: '构建项目',
      description: '构建/编译项目',
      version: '1.0.0',
      author: 'System',
      category: 'code',
      tags: ['build', 'compile', 'npm', 'yarn'],
      parameters: [
        {
          name: 'command',
          type: 'string',
          description: '自定义构建命令（可选，默认使用 npm run build）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: '构建结果',
      },
      execution: {
        type: 'function',
        builtinFunction: 'buildProject',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要构建项目时',
        priority: 60,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 生成图表
    {
      id: 'builtin_diagram',
      name: '生成图表',
      description: '根据代码或描述生成各类图表（流程图、时序图、类图、架构图等）',
      version: '1.0.0',
      author: 'System',
      category: 'diagram',
      tags: ['diagram', 'flowchart', 'sequence', 'class', 'mermaid'],
      parameters: [
        {
          name: 'type',
          type: 'string',
          description: '图表类型',
          required: false,
          default: 'flowchart',
          validation: {
            enum: ['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'mindmap', 'architecture'],
          },
        },
        {
          name: 'source',
          type: 'string',
          description: '来源: file(当前文件), project(整个项目), selection(选中内容), description(文字描述)',
          required: false,
          default: 'file',
          validation: {
            enum: ['file', 'project', 'selection', 'description'],
          },
        },
        {
          name: 'description',
          type: 'string',
          description: '图表描述（当source为description时需要）',
          required: false,
        },
      ],
      returns: {
        type: 'object',
        description: 'Mermaid图表代码',
      },
      execution: {
        type: 'function',
        builtinFunction: 'generateDiagram',
      },
      metadata: {
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      aiHints: {
        whenToUse: '当需要可视化代码结构或流程时',
        examples: [
          {
            input: { type: 'flowchart', source: 'file' },
            output: { mermaid: 'flowchart TD...' },
            description: '为当前文件生成流程图',
          },
        ],
        priority: 70,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
    
    // 生成测试
    {
      id: 'builtin_gentest',
      name: '生成测试',
      description: '为代码自动生成单元测试',
      version: '1.0.0',
      author: 'System',
      category: 'test',
      tags: ['test', 'generate', 'unit', 'jest', 'vitest'],
      parameters: [
        {
          name: 'file',
          type: 'file',
          description: '要生成测试的文件（可选，默认当前文件）',
          required: false,
        },
        {
          name: 'framework',
          type: 'string',
          description: '测试框架',
          required: false,
          validation: {
            enum: ['jest', 'vitest', 'mocha', 'pytest', 'auto'],
          },
        },
      ],
      returns: {
        type: 'object',
        description: '生成的测试代码',
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
        whenToUse: '当需要为代码生成测试时',
        priority: 75,
      },
      security: {
        allowedCallers: ['user', 'agent'],
      },
    },
  ];
}

// ============================================
// 内置函数实现
// ============================================

/**
 * 内置函数注册表
 */
export const builtinFunctions: MCPBuiltinRegistry = {
  /**
   * 读取文件
   */
  readFile: async (params, context) => {
    const { filePath, encoding = 'utf-8' } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(workspaceRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = fs.statSync(fullPath);
    const content = fs.readFileSync(fullPath, encoding as BufferEncoding);
    
    return {
      content,
      size: stats.size,
      path: fullPath,
      modified: stats.mtime.toISOString(),
    };
  },
  
  /**
   * 写入文件
   */
  writeFile: async (params, context) => {
    const { filePath, content, createDir = true } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(workspaceRoot, filePath);
    
    const dir = path.dirname(fullPath);
    if (createDir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    const stats = fs.statSync(fullPath);
    
    return {
      success: true,
      path: fullPath,
      size: stats.size,
    };
  },
  
  /**
   * 搜索文件
   */
  searchFiles: async (params, context) => {
    const { pattern, exclude = '**/node_modules/**', maxResults = 100 } = params;
    
    const files = await vscode.workspace.findFiles(
      pattern,
      exclude,
      maxResults
    );
    
    return files.map(f => vscode.workspace.asRelativePath(f));
  },
  
  /**
   * 搜索代码
   */
  searchCode: async (params, context) => {
    const { query, isRegex = false, include = '**/*', maxResults = 50 } = params;
    
    const results: Array<{
      file: string;
      line: number;
      column: number;
      text: string;
    }> = [];
    
    const files = await vscode.workspace.findFiles(include, '**/node_modules/**', 1000);
    
    for (const fileUri of files) {
      if (results.length >= maxResults) break;
      
      try {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const text = document.getText();
        const lines = text.split('\n');
        
        const regex = isRegex ? new RegExp(query, 'g') : null;
        
        for (let i = 0; i < lines.length && results.length < maxResults; i++) {
          const line = lines[i];
          let match: boolean;
          let column = 0;
          
          if (regex) {
            const m = regex.exec(line);
            match = m !== null;
            column = m?.index || 0;
            regex.lastIndex = 0;
          } else {
            column = line.indexOf(query);
            match = column !== -1;
          }
          
          if (match) {
            results.push({
              file: vscode.workspace.asRelativePath(fileUri),
              line: i + 1,
              column: column + 1,
              text: line.trim().substring(0, 200),
            });
          }
        }
      } catch (e) {
        // 跳过无法读取的文件
      }
    }
    
    return results;
  },
  
  /**
   * 执行命令
   */
  runCommand: async (params, context) => {
    const { command, cwd, timeout = 30000 } = params;
    const workspaceRoot = context.workspaceRoot || '';
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || workspaceRoot,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });
      
      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        exitCode: error.code || 1,
      };
    }
  },
  
  /**
   * HTTP请求
   */
  httpRequest: async (params, context) => {
    const { url, method = 'GET', headers = {}, body, timeout = 30000 } = params;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? body : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseBody = await response.text();
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  },
  
  /**
   * 获取项目结构
   */
  getProjectStructure: async (params, context) => {
    const { depth = 3, exclude = ['node_modules', '.git', 'dist', 'build'] } = params;
    const workspaceRoot = context.workspaceRoot;
    
    if (!workspaceRoot) {
      throw new Error('No workspace folder open');
    }
    
    const buildTree = (dir: string, currentDepth: number): any => {
      if (currentDepth > depth) return null;
      
      const result: any = {
        name: path.basename(dir),
        type: 'directory',
        children: [],
      };
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (exclude.includes(item) || item.startsWith('.')) continue;
          
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            const subtree = buildTree(fullPath, currentDepth + 1);
            if (subtree) {
              result.children.push(subtree);
            }
          } else {
            result.children.push({
              name: item,
              type: 'file',
              size: stats.size,
            });
          }
        }
      } catch (e) {
        // 忽略权限错误
      }
      
      return result;
    };
    
    return buildTree(workspaceRoot, 1);
  },
  
  /**
   * 获取编辑器上下文
   */
  getEditorContext: async (params, context) => {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
      return {
        active: false,
        message: 'No active editor',
      };
    }
    
    const document = editor.document;
    const selection = editor.selection;
    
    return {
      active: true,
      fileName: document.fileName,
      relativePath: vscode.workspace.asRelativePath(document.uri),
      language: document.languageId,
      lineCount: document.lineCount,
      content: document.getText(),
      selection: document.getText(selection),
      hasSelection: !selection.isEmpty,
      cursorPosition: {
        line: selection.active.line + 1,
        column: selection.active.character + 1,
      },
      isDirty: document.isDirty,
    };
  },
  
  /**
   * 插入代码
   */
  insertCode: async (params, context) => {
    const { code, position = 'cursor' } = params;
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
      throw new Error('No active editor');
    }
    
    let insertPosition: vscode.Position;
    let range: vscode.Range | undefined;
    
    switch (position) {
      case 'start':
        insertPosition = new vscode.Position(0, 0);
        break;
      case 'end':
        const lastLine = editor.document.lineCount - 1;
        insertPosition = new vscode.Position(
          lastLine,
          editor.document.lineAt(lastLine).text.length
        );
        break;
      case 'replace-selection':
        range = editor.selection;
        insertPosition = editor.selection.start;
        break;
      case 'cursor':
      default:
        insertPosition = editor.selection.active;
        break;
    }
    
    const success = await editor.edit(editBuilder => {
      if (range && position === 'replace-selection') {
        editBuilder.replace(range, code);
      } else {
        editBuilder.insert(insertPosition, code);
      }
    });
    
    return {
      success,
      insertedAt: {
        line: insertPosition.line + 1,
        column: insertPosition.character + 1,
      },
    };
  },
  
  // ============================================
  // 命令迁移 - 新增内置函数
  // ============================================
  
  /**
   * 显示帮助信息
   */
  showHelp: async (params, context) => {
    return {
      content: `## 🤖 AI Code Assistant 帮助

### 主要功能

**1. 智能对话** - 与 AI 进行自然语言对话
- 支持多轮对话、上下文理解
- 可上传图片、代码进行分析

**2. 代码操作** - 选中代码后使用
- 右键菜单：解释、修复、重构、添加注释

**3. MCP工具调用** - 使用 @mcp:工具名 调用
- @mcp:file:read - 读取文件
- @mcp:shell:run - 执行命令
- @mcp:git:status - Git状态

**4. Skill技能调用** - 使用 @skill:技能名 调用
- @skill:test-architect - 生成测试
- @skill:code-reviewer - 代码审查
- @skill:tool-maker - 制作工具

### ⌨️ 快捷键

- \`↑/↓\` - 浏览历史输入
- \`Tab\` - 命令自动补全
- \`ESC\` - 停止当前任务
- \`Alt+Enter\` - 输入换行

### 💡 使用技巧

1. **选中代码** 再输入问题，AI会针对该代码回答
2. **拖拽文件** 到输入框可上传图片/文档
3. **输入@** 触发MCP和Skill智能提示`,
    };
  },
  
  /**
   * 初始化/分析项目
   */
  initProject: async (params, context) => {
    const workspaceRoot = context.workspaceRoot;
    
    if (!workspaceRoot) {
      throw new Error('请先打开一个工作区');
    }
    
    // 分析项目类型和框架
    const analysis: any = {
      type: 'unknown',
      framework: null,
      language: null,
      structure: {},
    };
    
    try {
      // 检测项目类型
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        analysis.type = 'nodejs';
        analysis.language = 'javascript/typescript';
        
        // 检测框架
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['react']) analysis.framework = 'React';
        else if (deps['vue']) analysis.framework = 'Vue';
        else if (deps['@angular/core']) analysis.framework = 'Angular';
        else if (deps['next']) analysis.framework = 'Next.js';
        else if (deps['express']) analysis.framework = 'Express';
      }
      
      // 检测其他项目类型
      if (fs.existsSync(path.join(workspaceRoot, 'requirements.txt')) || 
          fs.existsSync(path.join(workspaceRoot, 'pyproject.toml'))) {
        analysis.type = 'python';
        analysis.language = 'python';
      }
      
      if (fs.existsSync(path.join(workspaceRoot, 'go.mod'))) {
        analysis.type = 'go';
        analysis.language = 'go';
      }
      
      if (fs.existsSync(path.join(workspaceRoot, 'pom.xml')) ||
          fs.existsSync(path.join(workspaceRoot, 'build.gradle'))) {
        analysis.type = 'java';
        analysis.language = 'java';
      }
      
      // 获取简化的目录结构
      const getStructure = (dir: string, depth: number = 0, maxDepth: number = 2): any => {
        if (depth > maxDepth) return null;
        
        const result: any = { name: path.basename(dir), type: 'directory', children: [] };
        const exclude = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv'];
        
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            if (exclude.includes(item) || item.startsWith('.')) continue;
            
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
              const subtree = getStructure(fullPath, depth + 1, maxDepth);
              if (subtree) result.children.push(subtree);
            } else {
              result.children.push({ name: item, type: 'file' });
            }
          }
        } catch (e) {
          // 忽略权限错误
        }
        
        return result;
      };
      
      analysis.structure = getStructure(workspaceRoot);
      
    } catch (e) {
      console.error('项目分析失败:', e);
    }
    
    return analysis;
  },
  
  /**
   * Git pull
   */
  gitPull: async (params, context) => {
    const { remote = 'origin', branch } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const cmd = branch ? `git pull ${remote} ${branch}` : 'git pull';
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: context.workspaceRoot,
        timeout: 60000,
      });
      
      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * Git push
   */
  gitPush: async (params, context) => {
    const { remote = 'origin', branch } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const cmd = branch ? `git push ${remote} ${branch}` : 'git push';
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: context.workspaceRoot,
        timeout: 60000,
      });
      
      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * Git commit
   */
  gitCommit: async (params, context) => {
    const { message, all = false } = params;
    
    if (!message) {
      throw new Error('提交信息不能为空');
    }
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const flags = all ? '-am' : '-m';
      const { stdout, stderr } = await execAsync(`git commit ${flags} "${message}"`, {
        cwd: context.workspaceRoot,
        timeout: 30000,
      });
      
      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * Git checkout
   */
  gitCheckout: async (params, context) => {
    const { branch, create = false } = params;
    
    if (!branch) {
      throw new Error('请指定分支名称');
    }
    
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const cmd = create ? `git checkout -b ${branch}` : `git checkout ${branch}`;
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: context.workspaceRoot,
        timeout: 30000,
      });
      
      return {
        success: true,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * Git diff
   */
  gitDiff: async (params, context) => {
    const { file, staged = false } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      let cmd = 'git diff';
      if (staged) cmd += ' --staged';
      if (file) cmd += ` ${file}`;
      
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: context.workspaceRoot,
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      });
      
      return {
        success: true,
        diff: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        diff: '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * Git log
   */
  gitLog: async (params, context) => {
    const { count = 15, oneline = true } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      const format = oneline ? '--oneline' : '';
      const { stdout, stderr } = await execAsync(`git log ${format} -${count}`, {
        cwd: context.workspaceRoot,
        timeout: 30000,
      });
      
      return {
        success: true,
        log: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        log: '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * 运行测试
   */
  runTest: async (params, context) => {
    const { pattern, watch = false } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // 检测测试框架
    let testCmd = 'npm test';
    const workspaceRoot = context.workspaceRoot || '';
    
    try {
      if (workspaceRoot) {
        const pkgPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          
          if (deps['vitest']) {
            testCmd = watch ? 'npx vitest' : 'npx vitest run';
          } else if (deps['jest']) {
            testCmd = watch ? 'npx jest --watch' : 'npx jest';
          }
        }
      }
      
      if (pattern) {
        testCmd += ` ${pattern}`;
      }
      
      const { stdout, stderr } = await execAsync(testCmd, {
        cwd: workspaceRoot || process.cwd(),
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
      
      return {
        success: true,
        command: testCmd,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        command: testCmd,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * 构建项目
   */
  buildProject: async (params, context) => {
    const { command } = params;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    let buildCmd = command || 'npm run build';
    
    try {
      const { stdout, stderr } = await execAsync(buildCmd, {
        cwd: context.workspaceRoot,
        timeout: 300000, // 5分钟超时
        maxBuffer: 10 * 1024 * 1024,
      });
      
      return {
        success: true,
        command: buildCmd,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      };
    } catch (error: any) {
      return {
        success: false,
        command: buildCmd,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  },
  
  /**
   * 生成图表（返回提示，实际生成需要AI配合）
   */
  generateDiagram: async (params, context) => {
    const { type = 'flowchart', source = 'file', description } = params;
    
    // 获取上下文
    let content = '';
    
    if (source === 'description') {
      content = description || '';
    } else if (source === 'selection') {
      const editor = vscode.window.activeTextEditor;
      if (editor && !editor.selection.isEmpty) {
        content = editor.document.getText(editor.selection);
      }
    } else if (source === 'file') {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        content = editor.document.getText();
      }
    }
    
    return {
      type,
      source,
      content,
      instruction: `请根据以上内容生成 ${type} 类型的 Mermaid 图表`,
    };
  },
  
  /**
   * 生成测试（返回提示，实际生成需要AI配合）
   */
  generateTest: async (params, context) => {
    const { file, framework } = params;
    
    let targetFile = file;
    let content = '';
    
    if (!targetFile) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        targetFile = vscode.workspace.asRelativePath(editor.document.uri);
        content = editor.document.getText();
      }
    } else {
      const workspaceRoot = context.workspaceRoot || '';
      const fullPath = path.isAbsolute(targetFile) 
        ? targetFile 
        : path.join(workspaceRoot, targetFile);
      
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    
    // 检测测试框架
    let detectedFramework = framework || 'auto';
    
    if (detectedFramework === 'auto') {
      try {
        const workspaceRoot = context.workspaceRoot || '';
        if (workspaceRoot) {
          const pkgPath = path.join(workspaceRoot, 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            
            if (deps['vitest']) detectedFramework = 'vitest';
            else if (deps['jest']) detectedFramework = 'jest';
            else if (deps['mocha']) detectedFramework = 'mocha';
          }
        }
        
        // Python 项目
        if (targetFile?.endsWith('.py')) {
          detectedFramework = 'pytest';
        }
      } catch (e) {
        // 忽略
      }
    }
    
    return {
      file: targetFile,
      content,
      framework: detectedFramework,
      instruction: `请为以上代码生成 ${detectedFramework} 单元测试`,
    };
  },
};
