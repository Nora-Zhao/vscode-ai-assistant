import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 项目分析结果
 */
export interface ProjectAnalysis {
  // 基本信息
  name: string;
  root: string;
  type: string;
  framework?: string;
  language: string;
  
  // 🆕 项目功能描述
  projectPurpose: ProjectPurpose;
  
  // 🆕 执行流程分析
  executionFlow: ExecutionFlow;
  
  // 结构分析
  structure: DirectoryNode;
  entryPoints: string[];
  configFiles: string[];
  
  // 代码统计
  codeStats: CodeStats;
  
  // 依赖分析
  dependencies: DependencyInfo;
  
  // 模块分析
  modules: ModuleInfo[];
  
  // 架构分析
  architecture: ArchitectureInfo;
  
  // 质量指标
  qualityIndicators: QualityIndicators;
  
  // 可用脚本
  scripts: ScriptInfo[];
  
  // AI 上下文摘要
  contextSummary: string;
  
  // 🆕 Markdown 文档信息
  markdownDocs: MarkdownDocInfo[];
}

/**
 * 🆕 Markdown 文档信息
 */
export interface MarkdownDocInfo {
  /** 文件名 */
  filename: string;
  /** 相对路径 */
  relativePath: string;
  /** 文档标题（从 # 提取） */
  title: string;
  /** 文档摘要（前2000字符，移除代码块和Markdown标记） */
  summary: string;
  /** 文档类型 */
  docType: 'readme' | 'changelog' | 'contributing' | 'api' | 'guide' | 'architecture' | 'other';
  /** 主要章节（## 标题） */
  sections: string[];
  /** 文件大小（字节） */
  size: number;
}

/**
 * 🆕 项目功能描述
 */
export interface ProjectPurpose {
  // 项目简介（从 README 或 package.json 提取）
  description: string;
  // 项目类别
  category: ProjectCategory;
  // 主要功能点
  features: string[];
  // 目标用户/使用场景
  targetAudience?: string;
  // 关键技术栈
  techStack: string[];
}

export type ProjectCategory = 
  | 'web-frontend'      // 前端应用
  | 'web-backend'       // 后端服务
  | 'fullstack'         // 全栈应用
  | 'cli-tool'          // 命令行工具
  | 'library'           // 库/SDK
  | 'vscode-extension'  // VSCode 插件
  | 'mobile-app'        // 移动应用
  | 'desktop-app'       // 桌面应用
  | 'api-service'       // API 服务
  | 'data-processing'   // 数据处理
  | 'ml-ai'             // 机器学习/AI
  | 'unknown';

/**
 * 🆕 执行流程分析
 */
export interface ExecutionFlow {
  // 主入口文件
  mainEntry: EntryPoint | null;
  // 启动命令
  startCommand: string | null;
  // 执行流程步骤
  flowSteps: FlowStep[];
  // 核心模块依赖图
  moduleDependencies: ModuleDependency[];
  // 数据流向
  dataFlow: string;
}

export interface EntryPoint {
  file: string;
  type: 'main' | 'index' | 'app' | 'server' | 'cli' | 'extension';
  description: string;
  // 入口文件导出的主要内容
  exports?: string[];
}

export interface FlowStep {
  order: number;
  description: string;
  file?: string;
  type: 'init' | 'config' | 'middleware' | 'route' | 'handler' | 'render' | 'export';
}

export interface ModuleDependency {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic';
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: DirectoryNode[];
  size?: number;
  language?: string;
}

export interface CodeStats {
  totalFiles: number;
  totalLines: number;
  byLanguage: Record<string, { files: number; lines: number }>;
  byDirectory: Record<string, { files: number; lines: number }>;
}

export interface DependencyInfo {
  runtime: string[];
  development: string[];
  total: number;
  outdated?: string[];
  security?: string[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  type: string;
  exports?: string[];
  imports?: string[];
  description?: string;
}

export interface ArchitectureInfo {
  pattern?: string;  // MVC, MVVM, Microservices, etc.
  layers: string[];
  dataFlow?: string;
  keyComponents: string[];
}

export interface QualityIndicators {
  hasTests: boolean;
  testCoverage?: number;
  hasLinting: boolean;
  hasTypeScript: boolean;
  hasCI: boolean;
  hasDocumentation: boolean;
  securityScore?: number;
}

export interface ScriptInfo {
  name: string;
  command: string;
  description?: string;
}

/**
 * 增强的项目分析器
 */
export class EnhancedProjectAnalyzer {
  private _ignoreDirs = [
    'node_modules', '.git', 'dist', 'build', '__pycache__', 
    'venv', '.venv', 'target', 'coverage', '.next', '.nuxt',
    'vendor', 'bin', 'obj', '.idea', '.vscode'
  ];
  
  private _ignoreFiles = [
    '.DS_Store', 'Thumbs.db', '.gitignore', '.npmrc',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
  ];

  /**
   * 执行完整的项目分析
   */
  async analyzeProject(workspaceRoot: string): Promise<ProjectAnalysis> {
    const name = path.basename(workspaceRoot);
    
    // 并行执行各项分析
    const [
      projectType,
      structure,
      codeStats,
      modules,
      qualityIndicators,
    ] = await Promise.all([
      this._detectProjectType(workspaceRoot),
      this._buildStructure(workspaceRoot, 3),
      this._analyzeCodeStats(workspaceRoot),
      this._analyzeModules(workspaceRoot),
      this._analyzeQuality(workspaceRoot),
    ]);

    const dependencies = await this._analyzeDependencies(workspaceRoot, projectType.type);
    const architecture = this._inferArchitecture(structure, projectType);
    const entryPoints = this._findEntryPoints(workspaceRoot, projectType);
    const configFiles = this._findConfigFiles(workspaceRoot);
    const scripts = this._extractScripts(workspaceRoot, projectType.type);
    
    // 🆕 分析项目功能
    const projectPurpose = await this._analyzeProjectPurpose(workspaceRoot, projectType, dependencies);
    
    // 🆕 分析执行流程
    const executionFlow = await this._analyzeExecutionFlow(workspaceRoot, projectType, entryPoints, modules);
    
    // 🆕 扫描 Markdown 文档
    const markdownDocs = await this._scanMarkdownDocs(workspaceRoot);
    
    // 生成 AI 上下文摘要（增强版，包含 MD 文档）
    const contextSummary = this._generateContextSummary({
      name,
      type: projectType.type,
      framework: projectType.framework,
      language: projectType.language,
      codeStats,
      modules,
      architecture,
      projectPurpose,
      executionFlow,
      markdownDocs,
    });

    return {
      name,
      root: workspaceRoot,
      type: projectType.type,
      framework: projectType.framework,
      language: projectType.language,
      projectPurpose,
      executionFlow,
      structure,
      entryPoints,
      configFiles,
      codeStats,
      dependencies,
      modules,
      architecture,
      qualityIndicators,
      scripts,
      contextSummary,
      markdownDocs,
    };
  }

  /**
   * 生成简洁的项目报告（用于显示）
   * 优化版：移除冗余信息，聚焦于真正有价值的内容
   */
  generateReport(analysis: ProjectAnalysis): string {
    const sections: string[] = [];

    // 标题
    sections.push(`## 🤖 项目分析: ${analysis.name}\n`);

    // 项目简介（最重要）
    if (analysis.projectPurpose) {
      const desc = analysis.projectPurpose.description;
      const category = this._getCategoryLabel(analysis.projectPurpose.category);
      
      if (desc && desc !== '未检测到项目描述') {
        sections.push(`> ${desc}\n`);
      }
      
      // 简洁的一行概要
      const techStack = analysis.projectPurpose.techStack.slice(0, 4).join(', ');
      sections.push(`**${category}** | ${analysis.language}${techStack ? ` | ${techStack}` : ''}\n`);
    } else {
      sections.push(`**${analysis.type}** | ${analysis.language}\n`);
    }

    // 核心入口（如果有）
    if (analysis.executionFlow?.mainEntry) {
      sections.push(`📍 **入口**: \`${analysis.executionFlow.mainEntry.file}\``);
      if (analysis.executionFlow.startCommand) {
        sections.push(`▶️ **启动**: \`${analysis.executionFlow.startCommand}\``);
      }
      sections.push('');
    }

    // 项目规模（简洁版）
    const totalLines = analysis.codeStats.totalLines;
    const totalFiles = analysis.codeStats.totalFiles;
    const sizeDesc = totalLines > 10000 ? '大型' : totalLines > 3000 ? '中型' : '小型';
    sections.push(`📊 **规模**: ${sizeDesc}项目 (${totalFiles} 文件, ${totalLines.toLocaleString()} 行)\n`);

    // 核心模块（更简洁）
    if (analysis.modules.length > 0) {
      const coreModules = analysis.modules
        .filter(m => m.description || ['src', 'app', 'lib', 'core'].includes(m.name.toLowerCase()))
        .slice(0, 5);
      
      if (coreModules.length > 0) {
        sections.push(`📦 **核心模块**`);
        for (const mod of coreModules) {
          sections.push(`- \`${mod.name}/\` ${mod.description || ''}`);
        }
        sections.push('');
      }
    }

    // 关键依赖（只显示最重要的）
    if (analysis.dependencies.runtime.length > 0) {
      const keyDeps = analysis.dependencies.runtime.slice(0, 6);
      sections.push(`📚 **关键依赖**: ${keyDeps.join(', ')}${analysis.dependencies.runtime.length > 6 ? '...' : ''}\n`);
    }

    // 可用命令（只显示最常用的）
    if (analysis.scripts.length > 0) {
      const importantScripts = analysis.scripts
        .filter(s => ['dev', 'start', 'build', 'test'].includes(s.name.toLowerCase()))
        .slice(0, 4);
      
      if (importantScripts.length > 0) {
        const scriptStr = importantScripts.map(s => `\`${s.name}\``).join(' | ');
        sections.push(`🔧 **命令**: ${scriptStr}\n`);
      }
    }

    // 分隔线和 AI 分析提示
    sections.push(`---`);
    sections.push(`💬 **现在可以问我**：`);
    sections.push(`- 这个项目是做什么的？架构是怎样的？`);
    sections.push(`- 帮我理解 [某个文件/模块] 的逻辑`);
    sections.push(`- 我想添加 [某个功能]，应该怎么做？`);

    return sections.join('\n');
  }

  /**
   * 获取项目类别的中文标签
   */
  private _getCategoryLabel(category: ProjectCategory): string {
    const labels: Record<ProjectCategory, string> = {
      'web-frontend': '🌐 前端应用',
      'web-backend': '⚙️ 后端服务',
      'fullstack': '🔄 全栈应用',
      'cli-tool': '💻 命令行工具',
      'library': '📚 库/SDK',
      'vscode-extension': '🧩 VSCode 插件',
      'mobile-app': '📱 移动应用',
      'desktop-app': '🖥️ 桌面应用',
      'api-service': '🔌 API 服务',
      'data-processing': '📊 数据处理',
      'ml-ai': '🤖 机器学习/AI',
      'unknown': '❓ 未知类型',
    };
    return labels[category] || category;
  }

  /**
   * 获取文档类型的中文标签
   */
  private _getDocTypeLabel(docType: MarkdownDocInfo['docType']): string {
    const labels: Record<MarkdownDocInfo['docType'], string> = {
      'readme': '说明文档',
      'changelog': '更新日志',
      'contributing': '贡献指南',
      'api': 'API文档',
      'guide': '使用指南',
      'architecture': '架构文档',
      'other': '其他',
    };
    return labels[docType] || '文档';
  }

  /**
   * 渲染树形结构（使用ASCII树形符号）
   */
  private _renderTreeStructure(node: DirectoryNode, prefix: string = '', isLast: boolean = true): string {
    let result = '';
    const nodePrefix = prefix + (isLast ? '└── ' : '├── ');
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    // 如果是根节点
    if (prefix === '') {
      result = `${node.name}/\n`;
    } else {
      const icon = node.type === 'directory' ? '📁' : '📄';
      const name = node.type === 'directory' ? `${node.name}/` : node.name;
      result = `${nodePrefix}${icon} ${name}\n`;
    }
    
    // 处理子节点
    if (node.children && node.children.length > 0) {
      // 排序：文件夹在前，文件在后
      const sortedChildren = [...node.children].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      
      // 限制显示数量
      const displayLimit = 12;
      const childrenToShow = sortedChildren.slice(0, displayLimit);
      const hasMore = sortedChildren.length > displayLimit;
      
      childrenToShow.forEach((child, index) => {
        const isChildLast = index === childrenToShow.length - 1 && !hasMore;
        result += this._renderTreeStructure(child, prefix === '' ? '' : childPrefix, isChildLast);
      });
      
      if (hasMore) {
        result += `${childPrefix}└── ... (还有 ${sortedChildren.length - displayLimit} 个项目)\n`;
      }
    }
    
    return result;
  }

  /**
   * 生成 AI 上下文摘要 - 增强版
   * 包含项目描述、README摘要等更有价值的信息
   */
  generateContextForAI(analysis: ProjectAnalysis): string {
    const sections: string[] = [];
    
    // 项目基本信息
    sections.push(`## 项目上下文`);
    sections.push(`**项目**: ${analysis.name}`);
    sections.push(`**类型**: ${analysis.type}${analysis.framework ? ` (${analysis.framework})` : ''}`);
    sections.push(`**语言**: ${analysis.language}`);
    sections.push(`**规模**: ${analysis.codeStats.totalFiles} 文件, ${analysis.codeStats.totalLines.toLocaleString()} 行`);
    
    // 项目描述（来自 README 或 package.json）
    if (analysis.projectPurpose?.description) {
      sections.push(`\n**项目描述**: ${analysis.projectPurpose.description}`);
    }
    
    // 技术栈
    if (analysis.projectPurpose?.techStack?.length > 0) {
      sections.push(`**技术栈**: ${analysis.projectPurpose.techStack.join(', ')}`);
    }
    
    // 入口和启动命令
    if (analysis.executionFlow?.mainEntry) {
      sections.push(`\n**主入口**: ${analysis.executionFlow.mainEntry.file}`);
    }
    if (analysis.executionFlow?.startCommand) {
      sections.push(`**启动命令**: ${analysis.executionFlow.startCommand}`);
    }
    
    // 目录结构
    if (analysis.modules.length > 0) {
      sections.push(`\n**目录结构**:`);
      for (const m of analysis.modules.slice(0, 10)) {
        sections.push(`- ${m.name}/: ${m.description || m.type}`);
      }
    }
    
    // 架构信息
    if (analysis.architecture.pattern) {
      sections.push(`\n**架构模式**: ${analysis.architecture.pattern}`);
    }
    if (analysis.architecture.keyComponents.length > 0) {
      sections.push(`**核心模块**: ${analysis.architecture.keyComponents.join(', ')}`);
    }
    
    // 主要依赖
    if (analysis.dependencies.runtime.length > 0) {
      sections.push(`\n**主要依赖**: ${analysis.dependencies.runtime.slice(0, 12).join(', ')}`);
    }
    
    // README 摘要（最重要的上下文）
    if (analysis.markdownDocs?.length > 0) {
      const readme = analysis.markdownDocs.find(d => d.docType === 'readme');
      if (readme?.summary) {
        sections.push(`\n**README 摘要**:`);
        sections.push(readme.summary.slice(0, 800));
      }
    }
    
    sections.push(`\n---`);
    sections.push(`请基于以上项目上下文来回答用户的问题。`);
    
    return sections.join('\n');
  }

  // ==================== 私有方法 ====================

  private async _detectProjectType(root: string): Promise<{
    type: string;
    framework?: string;
    language: string;
  }> {
    const files = fs.readdirSync(root);
    let type = '';
    let framework: string | undefined;
    let language = '';
    
    // 收集所有语言检测结果
    const detectedLanguages: Map<string, number> = new Map();

    // Node.js / JavaScript / TypeScript
    if (files.includes('package.json')) {
      type = 'Node.js';
      language = 'JavaScript';
      
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        // 检测框架
        if (deps['react'] && deps['next']) framework = 'Next.js';
        else if (deps['react']) framework = 'React';
        else if (deps['vue'] && deps['nuxt']) framework = 'Nuxt.js';
        else if (deps['vue']) framework = 'Vue.js';
        else if (deps['@angular/core']) framework = 'Angular';
        else if (deps['svelte']) framework = 'Svelte';
        else if (deps['express']) framework = 'Express';
        else if (deps['fastify']) framework = 'Fastify';
        else if (deps['nestjs'] || deps['@nestjs/core']) framework = 'NestJS';
        else if (deps['koa']) framework = 'Koa';
        else if (deps['vscode']) framework = 'VS Code Extension';
        else if (deps['electron']) framework = 'Electron';
        
        // TypeScript 检测
        if (deps['typescript'] || files.includes('tsconfig.json')) {
          language = 'TypeScript';
        }
      } catch {}
    }
    // Python
    else if (files.includes('requirements.txt') || files.includes('setup.py') || files.includes('pyproject.toml')) {
      type = 'Python';
      language = 'Python';
      
      if (files.includes('manage.py')) framework = 'Django';
      else {
        // 检查常见框架
        const checkFiles = ['app.py', 'main.py', 'run.py'];
        for (const f of checkFiles) {
          if (files.includes(f)) {
            try {
              const content = fs.readFileSync(path.join(root, f), 'utf-8');
              if (content.includes('Flask')) framework = 'Flask';
              else if (content.includes('FastAPI')) framework = 'FastAPI';
              else if (content.includes('Django')) framework = 'Django';
            } catch {}
          }
        }
      }
    }
    // Go
    else if (files.includes('go.mod')) {
      type = 'Go';
      language = 'Go';
      
      try {
        const modContent = fs.readFileSync(path.join(root, 'go.mod'), 'utf-8');
        if (modContent.includes('gin-gonic')) framework = 'Gin';
        else if (modContent.includes('echo')) framework = 'Echo';
        else if (modContent.includes('fiber')) framework = 'Fiber';
      } catch {}
    }
    // Rust
    else if (files.includes('Cargo.toml')) {
      type = 'Rust';
      language = 'Rust';
    }
    // Java
    else if (files.includes('pom.xml')) {
      type = 'Java (Maven)';
      language = 'Java';
      framework = 'Maven';
    }
    else if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
      type = 'Java (Gradle)';
      language = 'Java';
      framework = 'Gradle';
    }
    
    // 如果还没有检测到类型，通过文件扫描来判断
    if (!type || !language) {
      const languageCounts = await this._scanProjectLanguages(root);
      
      // 找出最主要的语言
      let maxCount = 0;
      let primaryLang = '';
      for (const [lang, count] of Object.entries(languageCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryLang = lang;
        }
      }
      
      if (primaryLang) {
        language = primaryLang;
        // 根据主要语言推断项目类型
        const langToType: Record<string, string> = {
          'TypeScript': 'TypeScript 项目',
          'JavaScript': 'JavaScript 项目',
          'Python': 'Python 项目',
          'Java': 'Java 项目',
          'Go': 'Go 项目',
          'Rust': 'Rust 项目',
          'C': 'C/C++ 项目',
          'C++': 'C/C++ 项目',
          'Ruby': 'Ruby 项目',
          'PHP': 'PHP 项目',
          'Swift': 'Swift 项目',
          'Kotlin': 'Kotlin 项目',
          'Vue': 'Vue.js 项目',
          'HTML': 'Web 项目',
          'CSS': 'Web 项目',
        };
        type = langToType[primaryLang] || `${primaryLang} 项目`;
      }
    }
    
    // 最终的默认值
    if (!type) type = '通用项目';
    if (!language) language = '混合语言';

    return { type, framework, language };
  }
  
  /**
   * 扫描项目目录统计各语言文件数量
   */
  private async _scanProjectLanguages(root: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    const walk = (dir: string, depth: number = 0) => {
      if (depth > 3) return; // 限制深度
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || this._ignoreDirs.includes(entry.name)) {
            continue;
          }
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1);
          } else {
            const lang = this._getLanguage(entry.name);
            if (lang !== 'Unknown') {
              counts[lang] = (counts[lang] || 0) + 1;
            }
          }
        }
      } catch {}
    };
    
    walk(root);
    return counts;
  }

  private async _buildStructure(dir: string, maxDepth: number, currentDepth = 0): Promise<DirectoryNode> {
    const name = path.basename(dir);
    const node: DirectoryNode = {
      name,
      type: 'directory',
      path: dir,
      children: [],
    };

    if (currentDepth >= maxDepth) {
      return node;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || 
            this._ignoreDirs.includes(entry.name) ||
            this._ignoreFiles.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const childNode = await this._buildStructure(fullPath, maxDepth, currentDepth + 1);
          node.children?.push(childNode);
        } else {
          node.children?.push({
            name: entry.name,
            type: 'file',
            path: fullPath,
            language: this._getLanguage(entry.name),
          });
        }
      }
    } catch {}

    return node;
  }

  private async _analyzeCodeStats(root: string): Promise<CodeStats> {
    const stats: CodeStats = {
      totalFiles: 0,
      totalLines: 0,
      byLanguage: {},
      byDirectory: {},
    };

    const walk = (dir: string, relDir: string = '') => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || this._ignoreDirs.includes(entry.name)) {
            continue;
          }

          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(relDir, entry.name);

          if (entry.isDirectory()) {
            walk(fullPath, relPath);
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            const lang = this._getLanguage(entry.name);
            
            if (lang !== 'Unknown') {
              const lines = this._countLines(fullPath);
              
              stats.totalFiles++;
              stats.totalLines += lines;

              if (!stats.byLanguage[lang]) {
                stats.byLanguage[lang] = { files: 0, lines: 0 };
              }
              stats.byLanguage[lang].files++;
              stats.byLanguage[lang].lines += lines;

              const topDir = relDir.split(path.sep)[0] || '/';
              if (!stats.byDirectory[topDir]) {
                stats.byDirectory[topDir] = { files: 0, lines: 0 };
              }
              stats.byDirectory[topDir].files++;
              stats.byDirectory[topDir].lines += lines;
            }
          }
        }
      } catch {}
    };

    walk(root);
    return stats;
  }

  private async _analyzeModules(root: string): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];
    const srcDirs = ['src', 'app', 'lib', 'components', 'pages', 'api', 'services', 
                     'utils', 'hooks', 'store', 'models', 'controllers', 'views', 
                     'routes', 'middleware', 'config', 'types', 'interfaces'];

    for (const dir of srcDirs) {
      const dirPath = path.join(root, dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const mod: ModuleInfo = {
          name: dir,
          path: dirPath,
          type: this._inferModuleType(dir),
          description: this._getModuleDescription(dir),
        };
        
        // 分析子模块
        try {
          const subDirs = fs.readdirSync(dirPath, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith('.'))
            .map(d => d.name);
          
          if (subDirs.length > 0) {
            mod.exports = subDirs.slice(0, 10);
          }
        } catch {}
        
        modules.push(mod);
      }
    }

    return modules;
  }

  private async _analyzeDependencies(root: string, projectType: string): Promise<DependencyInfo> {
    const deps: DependencyInfo = {
      runtime: [],
      development: [],
      total: 0,
    };

    if (projectType.includes('Node')) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        deps.runtime = Object.keys(pkg.dependencies || {});
        deps.development = Object.keys(pkg.devDependencies || {});
        deps.total = deps.runtime.length + deps.development.length;
      } catch {}
    } else if (projectType === 'Python') {
      try {
        if (fs.existsSync(path.join(root, 'requirements.txt'))) {
          const content = fs.readFileSync(path.join(root, 'requirements.txt'), 'utf-8');
          deps.runtime = content.split('\n')
            .filter(l => l.trim() && !l.startsWith('#'))
            .map(l => l.split('==')[0].split('>=')[0].trim());
          deps.total = deps.runtime.length;
        }
      } catch {}
    }

    return deps;
  }

  private async _analyzeQuality(root: string): Promise<QualityIndicators> {
    const files = fs.readdirSync(root);
    
    return {
      hasTests: files.some(f => ['test', 'tests', '__tests__', 'spec'].includes(f)) ||
                files.some(f => f.includes('.test.') || f.includes('.spec.')),
      hasLinting: files.includes('.eslintrc.js') || files.includes('.eslintrc.json') || 
                  files.includes('.prettierrc') || files.includes('pylint.cfg'),
      hasTypeScript: files.includes('tsconfig.json'),
      hasCI: files.includes('.github') || files.includes('.gitlab-ci.yml') || 
             files.includes('Jenkinsfile') || files.includes('.circleci'),
      hasDocumentation: files.includes('README.md') || files.includes('docs') ||
                        files.includes('CHANGELOG.md'),
    };
  }

  private _inferArchitecture(structure: DirectoryNode, projectType: { type: string; framework?: string }): ArchitectureInfo {
    const dirs = structure.children?.map(c => c.name) || [];
    const layers: string[] = [];
    const keyComponents: string[] = [];
    let pattern: string | undefined;

    // 检测架构模式
    if (dirs.includes('controllers') && dirs.includes('models') && dirs.includes('views')) {
      pattern = 'MVC';
      layers.push('Views', 'Controllers', 'Models');
    } else if (dirs.includes('components') && dirs.includes('store')) {
      pattern = 'Flux/Redux';
      layers.push('Components', 'Actions', 'Store');
    } else if (dirs.includes('pages') && dirs.includes('components')) {
      pattern = 'Component-Based';
      layers.push('Pages', 'Components', 'Utils');
    } else if (dirs.includes('domain') && dirs.includes('infrastructure')) {
      pattern = 'Clean Architecture';
      layers.push('Presentation', 'Domain', 'Infrastructure');
    } else if (dirs.includes('services') && dirs.includes('api')) {
      pattern = 'Service-Oriented';
      layers.push('API', 'Services', 'Data');
    }

    // 识别核心组件
    const importantDirs = ['src', 'app', 'lib', 'core', 'api', 'services'];
    for (const dir of importantDirs) {
      if (dirs.includes(dir)) {
        keyComponents.push(dir);
      }
    }

    return {
      pattern,
      layers,
      keyComponents,
    };
  }

  /**
   * 🆕 分析项目功能和用途
   */
  private async _analyzeProjectPurpose(
    root: string, 
    projectType: { type: string; framework?: string; language: string },
    dependencies: DependencyInfo
  ): Promise<ProjectPurpose> {
    let description = '';
    let category: ProjectCategory = 'unknown';
    const features: string[] = [];
    const techStack: string[] = [];
    let targetAudience: string | undefined;

    // 1. 从 package.json 提取描述
    try {
      const pkgPath = path.join(root, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.description) {
          description = pkg.description;
        }
        // 从 keywords 提取特性
        if (pkg.keywords && Array.isArray(pkg.keywords)) {
          features.push(...pkg.keywords.slice(0, 5));
        }
      }
    } catch {}

    // 2. 从 README.md 提取更多信息
    try {
      const readmePath = path.join(root, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf-8');
        
        // 提取第一段作为描述（如果 package.json 没有）
        if (!description) {
          const firstParagraph = readme.match(/^#[^#].*\n\n([^#\n][^\n]+)/m);
          if (firstParagraph) {
            description = firstParagraph[1].trim().slice(0, 200);
          }
        }
        
        // 提取功能特性（从 ## Features 或 ## 功能 部分）
        const featuresMatch = readme.match(/##\s*(Features|功能|特性)[^\n]*\n([\s\S]*?)(?=\n##|$)/i);
        if (featuresMatch) {
          const featureList = featuresMatch[2].match(/[-*]\s+(.+)/g);
          if (featureList) {
            features.push(...featureList.slice(0, 8).map(f => f.replace(/^[-*]\s+/, '').trim()));
          }
        }
      }
    } catch {}

    // 3. 判断项目类别
    category = this._detectProjectCategory(projectType, dependencies, root);

    // 4. 构建技术栈
    if (projectType.framework) {
      techStack.push(projectType.framework);
    }
    techStack.push(projectType.language);
    
    // 从依赖推断技术栈
    const techDeps = this._extractTechStackFromDeps(dependencies.runtime);
    techStack.push(...techDeps);

    // 5. 推断目标用户
    targetAudience = this._inferTargetAudience(category, features);

    return {
      description: description || `${projectType.type} 项目`,
      category,
      features: [...new Set(features)].slice(0, 10),
      targetAudience,
      techStack: [...new Set(techStack)].slice(0, 8),
    };
  }

  /**
   * 检测项目类别
   */
  private _detectProjectCategory(
    projectType: { type: string; framework?: string },
    dependencies: DependencyInfo,
    root: string
  ): ProjectCategory {
    const deps = dependencies.runtime.join(' ').toLowerCase();
    const devDeps = dependencies.development.join(' ').toLowerCase();
    const framework = projectType.framework?.toLowerCase() || '';
    const files = fs.readdirSync(root);

    // VSCode 插件
    if (deps.includes('vscode') || files.includes('.vscodeignore')) {
      return 'vscode-extension';
    }

    // CLI 工具
    if (deps.includes('commander') || deps.includes('yargs') || deps.includes('inquirer') || 
        deps.includes('chalk') || deps.includes('ora') || deps.includes('argparse')) {
      return 'cli-tool';
    }

    // 前端应用
    if (framework.includes('react') || framework.includes('vue') || framework.includes('angular') ||
        framework.includes('svelte') || framework.includes('next') || framework.includes('nuxt')) {
      if (deps.includes('express') || deps.includes('fastify') || deps.includes('koa')) {
        return 'fullstack';
      }
      return 'web-frontend';
    }

    // 后端服务
    if (deps.includes('express') || deps.includes('fastify') || deps.includes('koa') ||
        deps.includes('nestjs') || deps.includes('hapi') || deps.includes('flask') ||
        deps.includes('django') || deps.includes('fastapi')) {
      return 'web-backend';
    }

    // API 服务
    if (deps.includes('graphql') || deps.includes('apollo') || deps.includes('trpc') ||
        files.includes('swagger.json') || files.includes('openapi.yaml')) {
      return 'api-service';
    }

    // 库/SDK
    if (files.includes('rollup.config.js') || files.includes('tsup.config.ts') ||
        devDeps.includes('rollup') || devDeps.includes('tsup') ||
        projectType.type.toLowerCase().includes('library')) {
      return 'library';
    }

    // 移动应用
    if (deps.includes('react-native') || deps.includes('expo') || 
        files.includes('android') || files.includes('ios')) {
      return 'mobile-app';
    }

    // 桌面应用
    if (deps.includes('electron') || deps.includes('tauri')) {
      return 'desktop-app';
    }

    // 数据处理
    if (deps.includes('pandas') || deps.includes('numpy') || deps.includes('dask') ||
        deps.includes('apache-spark')) {
      return 'data-processing';
    }

    // ML/AI
    if (deps.includes('tensorflow') || deps.includes('pytorch') || deps.includes('torch') ||
        deps.includes('transformers') || deps.includes('langchain') || deps.includes('openai')) {
      return 'ml-ai';
    }

    return 'unknown';
  }

  /**
   * 从依赖提取技术栈
   */
  private _extractTechStackFromDeps(deps: string[]): string[] {
    const techStack: string[] = [];
    const techMap: Record<string, string> = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
      'express': 'Express.js',
      'fastify': 'Fastify',
      'nestjs': 'NestJS',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js',
      'prisma': 'Prisma',
      'typeorm': 'TypeORM',
      'mongoose': 'MongoDB',
      'redis': 'Redis',
      'graphql': 'GraphQL',
      'socket.io': 'WebSocket',
      'tailwindcss': 'Tailwind CSS',
      'electron': 'Electron',
      'vscode': 'VSCode API',
    };

    for (const dep of deps) {
      const depLower = dep.toLowerCase();
      for (const [key, value] of Object.entries(techMap)) {
        if (depLower.includes(key)) {
          techStack.push(value);
        }
      }
    }

    return [...new Set(techStack)];
  }

  /**
   * 推断目标用户
   */
  private _inferTargetAudience(category: ProjectCategory, features: string[]): string | undefined {
    const audienceMap: Record<ProjectCategory, string> = {
      'web-frontend': '前端开发者和终端用户',
      'web-backend': '后端开发者',
      'fullstack': '全栈开发者',
      'cli-tool': '开发者和系统管理员',
      'library': '开发者（作为依赖使用）',
      'vscode-extension': 'VSCode 用户和开发者',
      'mobile-app': '移动端用户',
      'desktop-app': '桌面端用户',
      'api-service': 'API 消费者和开发者',
      'data-processing': '数据分析师和数据工程师',
      'ml-ai': 'AI/ML 工程师和研究人员',
      'unknown': '',
    };
    return audienceMap[category] || '';
  }

  /**
   * 🆕 分析执行流程
   */
  private async _analyzeExecutionFlow(
    root: string,
    projectType: { type: string; framework?: string; language: string },
    entryPoints: string[],
    modules: ModuleInfo[]
  ): Promise<ExecutionFlow> {
    let mainEntry: EntryPoint | null = null;
    let startCommand: string | null = null;
    const flowSteps: FlowStep[] = [];
    const moduleDependencies: ModuleDependency[] = [];

    // 1. 确定主入口文件
    mainEntry = await this._findMainEntry(root, projectType, entryPoints);

    // 2. 确定启动命令
    startCommand = this._findStartCommand(root, projectType);

    // 3. 分析执行流程步骤
    if (mainEntry) {
      const steps = await this._analyzeFlowSteps(root, mainEntry, projectType);
      flowSteps.push(...steps);
    }

    // 4. 分析模块依赖关系
    const deps = await this._analyzeModuleDependencies(root, mainEntry?.file);
    moduleDependencies.push(...deps);

    // 5. 生成数据流描述
    const dataFlow = this._generateDataFlowDescription(projectType, flowSteps);

    return {
      mainEntry,
      startCommand,
      flowSteps,
      moduleDependencies,
      dataFlow,
    };
  }

  /**
   * 查找主入口文件
   */
  private async _findMainEntry(
    root: string,
    projectType: { type: string; framework?: string },
    entryPoints: string[]
  ): Promise<EntryPoint | null> {
    // 优先从 package.json 的 main 字段获取
    try {
      const pkgPath = path.join(root, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        
        // VSCode 插件入口
        if (pkg.main && pkg.engines?.vscode) {
          return {
            file: pkg.main,
            type: 'extension',
            description: 'VSCode 插件入口，定义 activate/deactivate 函数',
            exports: ['activate', 'deactivate'],
          };
        }
        
        // 普通 Node.js 项目入口
        if (pkg.main) {
          return {
            file: pkg.main,
            type: 'main',
            description: 'Node.js 模块主入口',
          };
        }
      }
    } catch {}

    // 根据框架类型判断
    const framework = projectType.framework?.toLowerCase() || '';
    
    if (framework.includes('next')) {
      return {
        file: 'pages/_app.tsx 或 app/layout.tsx',
        type: 'app',
        description: 'Next.js 应用入口，处理页面初始化和路由',
      };
    }
    
    if (framework.includes('react')) {
      for (const entry of ['src/index.tsx', 'src/index.js', 'src/main.tsx', 'src/main.js']) {
        if (fs.existsSync(path.join(root, entry))) {
          return {
            file: entry,
            type: 'index',
            description: 'React 应用入口，渲染根组件到 DOM',
          };
        }
      }
    }

    if (framework.includes('vue')) {
      for (const entry of ['src/main.ts', 'src/main.js']) {
        if (fs.existsSync(path.join(root, entry))) {
          return {
            file: entry,
            type: 'main',
            description: 'Vue 应用入口，创建和挂载 Vue 实例',
          };
        }
      }
    }

    // 后端服务入口
    for (const entry of ['src/index.ts', 'src/app.ts', 'src/server.ts', 'src/main.ts']) {
      if (fs.existsSync(path.join(root, entry))) {
        return {
          file: entry,
          type: 'server',
          description: '服务端入口，初始化配置并启动服务',
        };
      }
    }

    // 从已知入口点选择
    if (entryPoints.length > 0) {
      return {
        file: entryPoints[0],
        type: 'index',
        description: '项目主入口文件',
      };
    }

    return null;
  }

  /**
   * 查找启动命令
   */
  private _findStartCommand(root: string, projectType: { type: string }): string | null {
    try {
      const pkgPath = path.join(root, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        
        // VSCode 插件
        if (pkg.engines?.vscode) {
          return 'F5 (在 VSCode 中按 F5 启动调试)';
        }
        
        // 优先返回 dev/start 命令
        if (pkg.scripts?.dev) return 'npm run dev';
        if (pkg.scripts?.start) return 'npm start';
        if (pkg.scripts?.serve) return 'npm run serve';
      }
    } catch {}

    // Python 项目
    if (projectType.type === 'Python') {
      if (fs.existsSync(path.join(root, 'main.py'))) return 'python main.py';
      if (fs.existsSync(path.join(root, 'app.py'))) return 'python app.py';
    }

    // Go 项目
    if (projectType.type === 'Go') {
      return 'go run .';
    }

    return null;
  }

  /**
   * 分析执行流程步骤
   */
  private async _analyzeFlowSteps(
    root: string,
    mainEntry: EntryPoint,
    projectType: { type: string; framework?: string }
  ): Promise<FlowStep[]> {
    const steps: FlowStep[] = [];
    const framework = projectType.framework?.toLowerCase() || '';

    // 根据项目类型生成典型执行流程
    if (mainEntry.type === 'extension') {
      // VSCode 插件流程
      steps.push(
        { order: 1, description: 'VSCode 加载插件，读取 package.json 配置', type: 'init' },
        { order: 2, description: '触发激活条件时调用 activate() 函数', file: mainEntry.file, type: 'init' },
        { order: 3, description: '注册命令、视图、Provider 等', type: 'config' },
        { order: 4, description: '监听用户操作和事件', type: 'handler' },
        { order: 5, description: '插件停用时调用 deactivate() 清理资源', type: 'handler' },
      );
    } else if (framework.includes('next')) {
      // Next.js 流程
      steps.push(
        { order: 1, description: '加载 next.config.js 配置', type: 'config' },
        { order: 2, description: '初始化 _app.tsx 包装组件', type: 'init' },
        { order: 3, description: '根据 URL 匹配 pages/ 或 app/ 下的路由', type: 'route' },
        { order: 4, description: '执行 getServerSideProps/getStaticProps 获取数据', type: 'handler' },
        { order: 5, description: '渲染页面组件并返回 HTML', type: 'render' },
      );
    } else if (framework.includes('react')) {
      // React 流程
      steps.push(
        { order: 1, description: '加载入口文件和根组件', file: mainEntry.file, type: 'init' },
        { order: 2, description: 'ReactDOM.render() 挂载到 DOM', type: 'init' },
        { order: 3, description: '路由解析，匹配对应页面组件', type: 'route' },
        { order: 4, description: '组件生命周期执行，获取数据', type: 'handler' },
        { order: 5, description: '渲染虚拟 DOM 并更新真实 DOM', type: 'render' },
      );
    } else if (framework.includes('express') || framework.includes('fastify') || framework.includes('koa')) {
      // 后端服务流程
      steps.push(
        { order: 1, description: '加载环境变量和配置', type: 'config' },
        { order: 2, description: '初始化数据库连接', type: 'init' },
        { order: 3, description: '注册中间件（日志、认证、CORS等）', type: 'middleware' },
        { order: 4, description: '注册路由和控制器', type: 'route' },
        { order: 5, description: '启动 HTTP 服务器监听端口', file: mainEntry.file, type: 'init' },
        { order: 6, description: '接收请求 → 中间件处理 → 路由分发 → 返回响应', type: 'handler' },
      );
    } else {
      // 通用流程
      steps.push(
        { order: 1, description: '程序启动，加载入口文件', file: mainEntry.file, type: 'init' },
        { order: 2, description: '初始化配置和依赖', type: 'config' },
        { order: 3, description: '执行主要业务逻辑', type: 'handler' },
      );
    }

    return steps;
  }

  /**
   * 分析模块依赖关系
   */
  private async _analyzeModuleDependencies(
    root: string,
    mainEntryFile?: string
  ): Promise<ModuleDependency[]> {
    const dependencies: ModuleDependency[] = [];
    
    if (!mainEntryFile) return dependencies;

    try {
      const entryPath = path.join(root, mainEntryFile);
      if (!fs.existsSync(entryPath)) return dependencies;

      const content = fs.readFileSync(entryPath, 'utf-8');
      
      // 提取 import 语句
      const importMatches = content.matchAll(/import\s+(?:.*\s+from\s+)?['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]/g);
      for (const match of importMatches) {
        dependencies.push({
          from: mainEntryFile,
          to: match[1],
          type: 'import',
        });
      }

      // 提取 require 语句
      const requireMatches = content.matchAll(/require\(['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]\)/g);
      for (const match of requireMatches) {
        dependencies.push({
          from: mainEntryFile,
          to: match[1],
          type: 'require',
        });
      }
    } catch {}

    return dependencies.slice(0, 20);
  }

  /**
   * 生成数据流描述
   */
  private _generateDataFlowDescription(
    projectType: { type: string; framework?: string },
    flowSteps: FlowStep[]
  ): string {
    const framework = projectType.framework?.toLowerCase() || '';

    if (framework.includes('react') || framework.includes('vue')) {
      return '用户交互 → 事件处理 → 状态更新 → 组件重渲染 → DOM 更新';
    }
    
    if (framework.includes('next') || framework.includes('nuxt')) {
      return '请求 → 服务端渲染/数据获取 → 页面组件 → 客户端 Hydration → 交互';
    }

    if (framework.includes('express') || framework.includes('fastify')) {
      return '客户端请求 → 中间件链 → 路由匹配 → 控制器处理 → 数据库操作 → 响应返回';
    }

    if (projectType.type.includes('extension')) {
      return 'VSCode 事件 → 命令/Provider → 业务处理 → Webview/编辑器更新';
    }

    return '输入 → 处理 → 输出';
  }

  /**
   * 查找项目入口点
   */
  private _findEntryPoints(root: string, projectType: { type: string; framework?: string }): string[] {
    const entryPoints: string[] = [];
    const files = fs.readdirSync(root);
    
    // 通用入口文件
    const commonEntries = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
                          'main.py', 'app.py', 'run.py', 'main.go', 'cmd/main.go'];
    
    for (const entry of commonEntries) {
      if (fs.existsSync(path.join(root, entry))) {
        entryPoints.push(entry);
      }
    }

    // 检查 src 目录
    if (fs.existsSync(path.join(root, 'src'))) {
      for (const entry of commonEntries) {
        if (fs.existsSync(path.join(root, 'src', entry))) {
          entryPoints.push(`src/${entry}`);
        }
      }
    }

    return entryPoints.slice(0, 5);
  }

  private _findConfigFiles(root: string): string[] {
    const configPatterns = [
      'package.json', 'tsconfig.json', '.eslintrc.js', '.prettierrc',
      'vite.config.ts', 'webpack.config.js', 'rollup.config.js',
      'requirements.txt', 'pyproject.toml', 'setup.py',
      'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle',
      'docker-compose.yml', 'Dockerfile', '.env.example',
    ];
    
    const files = fs.readdirSync(root);
    return files.filter(f => configPatterns.includes(f));
  }

  private _extractScripts(root: string, projectType: string): ScriptInfo[] {
    const scripts: ScriptInfo[] = [];
    
    if (projectType.includes('Node')) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
        if (pkg.scripts) {
          for (const [name, cmd] of Object.entries(pkg.scripts)) {
            scripts.push({
              name: `npm run ${name}`,
              command: String(cmd),
              description: this._getScriptDescription(name),
            });
          }
        }
      } catch {}
    }
    
    return scripts.slice(0, 10);
  }

  private _generateContextSummary(info: any): string {
    const parts: string[] = [];
    
    // 基本描述
    parts.push(`${info.name} 是一个 ${info.type} 项目${info.framework ? `（${info.framework}）` : ''}，主要使用 ${info.language} 开发。`);
    
    // 项目功能
    if (info.projectPurpose?.description) {
      parts.push(`项目功能: ${info.projectPurpose.description}`);
    }
    
    // 代码规模
    parts.push(`项目包含 ${info.codeStats.totalFiles} 个代码文件，约 ${info.codeStats.totalLines.toLocaleString()} 行代码。`);
    
    // 入口和执行流程
    if (info.executionFlow?.mainEntry) {
      parts.push(`主入口文件: ${info.executionFlow.mainEntry.file}。`);
    }
    if (info.executionFlow?.startCommand) {
      parts.push(`启动命令: ${info.executionFlow.startCommand}。`);
    }
    
    // 主要模块
    if (info.modules?.length > 0) {
      parts.push(`主要模块包括: ${info.modules.slice(0, 5).map((m: any) => m.name).join(', ')}。`);
    }
    
    // 技术栈
    if (info.projectPurpose?.techStack?.length > 0) {
      parts.push(`技术栈: ${info.projectPurpose.techStack.join(', ')}。`);
    }
    
    return parts.join(' ');
  }

  private _renderStructure(node: DirectoryNode, indent: number, maxDepth: number): string {
    if (indent >= maxDepth) return '';
    
    const prefix = '  '.repeat(indent);
    let result = '';
    
    if (node.type === 'directory') {
      result += `${prefix}📁 ${node.name}/\n`;
      if (node.children) {
        for (const child of node.children.slice(0, 15)) {
          result += this._renderStructure(child, indent + 1, maxDepth);
        }
        if (node.children.length > 15) {
          result += `${prefix}  ... (${node.children.length - 15} more)\n`;
        }
      }
    } else {
      result += `${prefix}📄 ${node.name}\n`;
    }
    
    return result;
  }

  private _getLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.go': 'Go',
      '.java': 'Java',
      '.rs': 'Rust',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'Less',
      '.html': 'HTML',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Shell',
    };
    return langMap[ext] || 'Unknown';
  }

  private _countLines(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  private _inferModuleType(dirName: string): string {
    const typeMap: Record<string, string> = {
      'src': '源代码',
      'app': '应用程序',
      'lib': '库',
      'components': 'UI组件',
      'pages': '页面',
      'api': 'API接口',
      'services': '服务层',
      'utils': '工具函数',
      'hooks': 'React Hooks',
      'store': '状态管理',
      'models': '数据模型',
      'controllers': '控制器',
      'views': '视图',
      'routes': '路由',
      'middleware': '中间件',
      'config': '配置',
      'types': '类型定义',
      'interfaces': '接口定义',
    };
    return typeMap[dirName] || '模块';
  }

  private _getModuleDescription(dirName: string): string {
    const descMap: Record<string, string> = {
      'src': '主要源代码目录',
      'app': '应用程序入口',
      'lib': '可复用库代码',
      'components': 'UI 组件库',
      'pages': '页面组件',
      'api': 'API 接口定义',
      'services': '业务逻辑服务',
      'utils': '通用工具函数',
      'hooks': 'React Hooks',
      'store': '全局状态管理',
      'models': '数据模型定义',
      'controllers': '请求控制器',
      'views': '视图模板',
      'routes': '路由配置',
      'middleware': '中间件',
      'config': '配置文件',
      'types': 'TypeScript 类型',
    };
    return descMap[dirName] || '';
  }

  private _getScriptDescription(name: string): string {
    const descMap: Record<string, string> = {
      'dev': '开发模式',
      'start': '启动应用',
      'build': '构建项目',
      'test': '运行测试',
      'lint': '代码检查',
      'format': '格式化代码',
      'deploy': '部署',
      'watch': '监听模式',
    };
    return descMap[name] || '';
  }

  /**
   * 🆕 扫描项目中的 Markdown 文档
   */
  private async _scanMarkdownDocs(root: string): Promise<MarkdownDocInfo[]> {
    const docs: MarkdownDocInfo[] = [];
    const maxDocs = 20; // 最多扫描20个文档
    const maxDepth = 3; // 最大扫描深度
    
    const scanDir = (dir: string, depth: number): void => {
      if (depth > maxDepth || docs.length >= maxDocs) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (docs.length >= maxDocs) break;
          
          // 跳过忽略的目录
          if (this._ignoreDirs.includes(item)) continue;
          
          const fullPath = path.join(dir, item);
          
          try {
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              scanDir(fullPath, depth + 1);
            } else if (item.toLowerCase().endsWith('.md')) {
              const docInfo = this._parseMarkdownDoc(fullPath, root);
              if (docInfo) {
                docs.push(docInfo);
              }
            }
          } catch {
            // 忽略无法访问的文件
          }
        }
      } catch {
        // 忽略无法访问的目录
      }
    };
    
    scanDir(root, 0);
    
    // 按文档类型和大小排序（README优先，然后按大小）
    docs.sort((a, b) => {
      if (a.docType === 'readme' && b.docType !== 'readme') return -1;
      if (b.docType === 'readme' && a.docType !== 'readme') return 1;
      return b.size - a.size;
    });
    
    return docs;
  }

  /**
   * 解析单个 Markdown 文档
   */
  private _parseMarkdownDoc(filePath: string, root: string): MarkdownDocInfo | null {
    try {
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath);
      const relativePath = path.relative(root, filePath);
      
      // 提取标题（第一个 # 标题）
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');
      
      // 确定文档类型
      const docType = this._detectDocType(filename, relativePath);
      
      // 提取章节（## 标题）
      const sectionMatches = content.matchAll(/^##\s+(.+)$/gm);
      const sections: string[] = [];
      for (const match of sectionMatches) {
        sections.push(match[1].trim());
        if (sections.length >= 10) break;
      }
      
      // 生成摘要（移除代码块和Markdown标记）
      const summary = this._generateDocSummary(content);
      
      return {
        filename,
        relativePath,
        title,
        summary,
        docType,
        sections,
        size: stat.size,
      };
    } catch {
      return null;
    }
  }

  /**
   * 检测文档类型
   */
  private _detectDocType(filename: string, relativePath: string): MarkdownDocInfo['docType'] {
    const lowerName = filename.toLowerCase();
    const lowerPath = relativePath.toLowerCase();
    
    if (lowerName === 'readme.md') return 'readme';
    if (lowerName.includes('changelog')) return 'changelog';
    if (lowerName.includes('contributing')) return 'contributing';
    if (lowerName.includes('api') || lowerPath.includes('api')) return 'api';
    if (lowerName.includes('guide') || lowerName.includes('tutorial')) return 'guide';
    if (lowerName.includes('architecture') || lowerName.includes('design')) return 'architecture';
    
    return 'other';
  }

  /**
   * 生成文档摘要
   */
  private _generateDocSummary(content: string): string {
    let summary = content;
    
    // 移除代码块
    summary = summary.replace(/```[\s\S]*?```/g, '');
    
    // 移除行内代码
    summary = summary.replace(/`[^`]+`/g, '');
    
    // 移除链接，保留文本
    summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    // 移除图片
    summary = summary.replace(/!\[.*?\]\(.*?\)/g, '');
    
    // 移除标题标记
    summary = summary.replace(/^#+\s*/gm, '');
    
    // 移除加粗和斜体标记
    summary = summary.replace(/\*\*([^*]+)\*\*/g, '$1');
    summary = summary.replace(/\*([^*]+)\*/g, '$1');
    summary = summary.replace(/__([^_]+)__/g, '$1');
    summary = summary.replace(/_([^_]+)_/g, '$1');
    
    // 移除列表标记
    summary = summary.replace(/^[\s]*[-*+]\s*/gm, '');
    summary = summary.replace(/^[\s]*\d+\.\s*/gm, '');
    
    // 压缩空白
    summary = summary.replace(/\n{3,}/g, '\n\n');
    summary = summary.trim();
    
    // 截断到2000字符
    if (summary.length > 2000) {
      summary = summary.slice(0, 2000) + '...';
    }
    
    return summary;
  }
}

// 导出单例
export const projectAnalyzer = new EnhancedProjectAnalyzer();
