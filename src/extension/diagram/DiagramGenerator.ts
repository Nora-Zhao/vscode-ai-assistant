import * as vscode from 'vscode';
import {
  Diagram,
  DiagramType,
  DiagramFormat,
  DIAGRAM_TEMPLATES,
  generateId,
} from '../../types/shared';

const DIAGRAMS_KEY = 'aiAssistant.diagrams';

/**
 * 流程图生成器
 * 支持 AI 生成和手动编辑
 */
export class DiagramGenerator {
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  /**
   * 生成 AI 提示词
   */
  generatePrompt(type: DiagramType, description?: string, code?: string): string {
    const format = this._getDefaultFormat();
    
    let prompt = `请生成一个 ${this._getTypeDisplayName(type)} (${format} 格式)。\n\n`;
    
    if (description) {
      prompt += `需求描述：${description}\n\n`;
    }
    
    if (code) {
      prompt += `基于以下代码：\n\`\`\`\n${code}\n\`\`\`\n\n`;
    }
    
    // 添加类型特定的语法指南
    const syntaxGuide = this._getSyntaxGuide(type);
    
    prompt += `请注意：
1. 只返回 ${format} 代码，不要添加额外解释
2. 代码需要用 \`\`\`${format} 和 \`\`\` 包裹
3. 确保语法正确，可以直接渲染
4. 使用中文标签
5. 严格遵循 Mermaid 官方语法

${syntaxGuide}

参考模板：
\`\`\`${format}
${DIAGRAM_TEMPLATES[type]}
\`\`\`

📚 官方语法参考：https://mermaid.js.org/syntax/${this._getSyntaxDocPath(type)}.html`;
    
    return prompt;
  }

  /**
   * 获取类型特定的语法指南
   */
  private _getSyntaxGuide(type: DiagramType): string {
    const guides: Record<DiagramType, string> = {
      flowchart: `Mermaid 流程图语法要点：
- 使用 flowchart TB/LR/BT/RL 声明方向
- 节点定义：A[方形] B(圆角) C{菱形} D((圆形)) E([体育场形])
- 连接线：A --> B (箭头) A --- B (实线) A -.-> B (虚线) A ==> B (粗线)
- 子图：subgraph 名称 ... end
- 注意：节点文本中不要有特殊字符 [ ] { } ( ) < >`,
      sequence: `Mermaid 时序图语法要点：
- 使用 sequenceDiagram 声明
- 参与者：participant A as 别名
- 消息：A->>B: 消息文本 (实线箭头) A-->>B: (虚线箭头)
- 激活：activate A / deactivate A 或 A->>+B / A->>-B
- 循环/条件：loop/alt/opt ... end
- 注意：消息文本不要有特殊字符`,
      class: `Mermaid 类图语法要点：
- 使用 classDiagram 声明
- 类定义：class ClassName { +method() -field }
- 关系：A <|-- B (继承) A *-- B (组合) A o-- B (聚合)
- 注意：方法和属性前用 + - # 表示访问级别`,
      state: `Mermaid 状态图语法要点：
- 使用 stateDiagram-v2 声明
- 状态：state "描述" as s1
- 转换：s1 --> s2 : 事件
- 特殊状态：[*] --> s1 (开始) s1 --> [*] (结束)`,
      er: `Mermaid ER图语法要点：
- 使用 erDiagram 声明
- 关系：A ||--o{ B : "关系"
- 基数：|o (零或一) || (恰好一) }o (零或多) }| (一或多)`,
      gantt: `Mermaid 甘特图语法要点：
- 使用 gantt 声明
- 必须有 title 和 dateFormat
- 任务：任务名 :标识, 开始日期, 持续时间
- section 分组任务`,
      pie: `Mermaid 饼图语法要点：
- 使用 pie 或 pie showData 声明
- 可选 title 标题
- 数据："标签" : 数值`,
      mindmap: `Mermaid 思维导图语法要点：
- 使用 mindmap 声明
- 缩进表示层级
- 根节点无缩进，子节点用空格缩进`,
      architecture: `Mermaid 架构图语法要点：
- 推荐使用 flowchart TB 配合 subgraph
- 使用多个 subgraph 分层表示架构
- 用不同形状节点区分类型`,
    };
    return guides[type] || '';
  }

  /**
   * 获取语法文档路径
   */
  private _getSyntaxDocPath(type: DiagramType): string {
    const paths: Record<DiagramType, string> = {
      flowchart: 'flowchart',
      sequence: 'sequenceDiagram',
      class: 'classDiagram',
      state: 'stateDiagram',
      er: 'entityRelationshipDiagram',
      gantt: 'gantt',
      pie: 'pie',
      mindmap: 'mindmap',
      architecture: 'flowchart',
    };
    return paths[type] || 'flowchart';
  }

  /**
   * 从 AI 响应中提取图表代码
   */
  extractDiagramCode(response: string): string | null {
    const format = this._getDefaultFormat();
    
    // 尝试匹配代码块
    const patterns = [
      new RegExp(`\`\`\`${format}\\s*([\\s\\S]*?)\`\`\``, 'i'),
      new RegExp(`\`\`\`mermaid\\s*([\\s\\S]*?)\`\`\``, 'i'),
      new RegExp(`\`\`\`\\s*([\\s\\S]*?)\`\`\``, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 如果没有代码块，检查整个响应是否像是图表代码
    if (this._looksLikeDiagramCode(response)) {
      return response.trim();
    }
    
    return null;
  }

  /**
   * 创建图表对象
   */
  createDiagram(
    type: DiagramType,
    code: string,
    title?: string,
    sessionId?: string
  ): Diagram {
    const diagram: Diagram = {
      id: generateId(),
      title: title || `${this._getTypeDisplayName(type)} - ${new Date().toLocaleString('zh-CN')}`,
      type,
      format: this._getDefaultFormat(),
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessionId,
    };
    
    this._saveDiagram(diagram);
    return diagram;
  }

  /**
   * 更新图表
   */
  updateDiagram(diagramId: string, code: string): Diagram | null {
    const diagrams = this._getAllDiagrams();
    const index = diagrams.findIndex(d => d.id === diagramId);
    
    if (index === -1) return null;
    
    diagrams[index].code = code;
    diagrams[index].updatedAt = Date.now();
    
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
    return diagrams[index];
  }

  /**
   * 获取图表
   */
  getDiagram(diagramId: string): Diagram | null {
    const diagrams = this._getAllDiagrams();
    return diagrams.find(d => d.id === diagramId) || null;
  }

  /**
   * 获取所有图表
   */
  getAllDiagrams(): Diagram[] {
    return this._getAllDiagrams()
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 删除图表
   */
  deleteDiagram(diagramId: string): boolean {
    const diagrams = this._getAllDiagrams();
    const filtered = diagrams.filter(d => d.id !== diagramId);
    
    if (filtered.length === diagrams.length) return false;
    
    this._context.globalState.update(DIAGRAMS_KEY, filtered);
    return true;
  }

  /**
   * 重命名图表
   */
  renameDiagram(diagramId: string, newTitle: string): boolean {
    const diagrams = this._getAllDiagrams();
    const index = diagrams.findIndex(d => d.id === diagramId);
    
    if (index === -1) return false;
    
    diagrams[index].title = newTitle;
    diagrams[index].updatedAt = Date.now();
    
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
    return true;
  }

  /**
   * 导出图表
   */
  async exportDiagram(
    diagram: Diagram,
    format: 'svg' | 'png' | 'md' | 'html'
  ): Promise<string> {
    switch (format) {
      case 'md':
        return this._exportAsMarkdown(diagram);
      case 'html':
        return this._exportAsHtml(diagram);
      case 'svg':
      case 'png':
        // SVG/PNG 需要在前端渲染后导出
        throw new Error(`${format.toUpperCase()} 导出需要在前端完成`);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 验证图表代码
   */
  validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: '代码不能为空' };
    }
    
    // 基本语法检查
    const trimmed = code.trim();
    
    // 检查是否有有效的图表类型声明
    const validStarts = [
      'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
      'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap',
      'journey', 'gitGraph', 'C4Context', 'timeline',
    ];
    
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (!validStarts.some(s => firstWord.startsWith(s.toLowerCase()))) {
      return {
        valid: false,
        error: `无效的图表类型。支持的类型: ${validStarts.join(', ')}`,
      };
    }
    
    // 检查括号匹配
    const brackets = { '(': 0, '[': 0, '{': 0 };
    for (const char of trimmed) {
      if (char === '(') brackets['(']++;
      if (char === ')') brackets['(']--;
      if (char === '[') brackets['[']++;
      if (char === ']') brackets['[']--;
      if (char === '{') brackets['{']++;
      if (char === '}') brackets['{']--;
    }
    
    if (brackets['('] !== 0 || brackets['['] !== 0 || brackets['{'] !== 0) {
      return { valid: false, error: '括号不匹配' };
    }
    
    return { valid: true };
  }

  /**
   * 获取图表模板
   */
  getTemplate(type: DiagramType): string {
    return DIAGRAM_TEMPLATES[type] || DIAGRAM_TEMPLATES.flowchart;
  }

  /**
   * 生成项目架构图提示词
   */
  generateArchitecturePrompt(projectInfo: {
    name: string;
    type: string;
    structure: string;
    dependencies?: string[];
  }): string {
    let prompt = `请根据以下项目信息生成架构图 (Mermaid 格式)：

项目名称：${projectInfo.name}
项目类型：${projectInfo.type}

项目结构：
\`\`\`
${projectInfo.structure}
\`\`\`
`;
    
    if (projectInfo.dependencies?.length) {
      prompt += `\n主要依赖：${projectInfo.dependencies.join(', ')}\n`;
    }
    
    prompt += `
请生成一个清晰的架构图，包含：
1. 主要模块/组件
2. 模块间的依赖关系
3. 数据流向
4. 使用中文标签

使用 subgraph 分组相关组件，箭头表示依赖/数据流向。
只返回 Mermaid 代码，用 \`\`\`mermaid 和 \`\`\` 包裹。`;
    
    return prompt;
  }

  /**
   * 从代码生成流程图提示词
   */
  generateFlowchartFromCodePrompt(code: string, language: string): string {
    return `请分析以下 ${language} 代码，生成对应的流程图 (Mermaid 格式)：

\`\`\`${language}
${code}
\`\`\`

要求：
1. 展示代码的执行流程
2. 包含条件判断、循环等控制流
3. 使用中文标签
4. 只返回 Mermaid 代码，用 \`\`\`mermaid 和 \`\`\` 包裹`;
  }

  // ============================================
  // 私有方法
  // ============================================

  private _getDefaultFormat(): DiagramFormat {
    return vscode.workspace.getConfiguration('aiAssistant')
      .get<DiagramFormat>('diagram.defaultFormat', 'mermaid');
  }

  private _getTypeDisplayName(type: DiagramType): string {
    const names: Record<DiagramType, string> = {
      flowchart: '流程图',
      sequence: '时序图',
      class: '类图',
      state: '状态图',
      er: 'ER图',
      gantt: '甘特图',
      pie: '饼图',
      mindmap: '思维导图',
      architecture: '架构图',
    };
    return names[type] || type;
  }

  private _getAllDiagrams(): Diagram[] {
    return this._context.globalState.get<Diagram[]>(DIAGRAMS_KEY, []);
  }

  private _saveDiagram(diagram: Diagram): void {
    const diagrams = this._getAllDiagrams();
    diagrams.push(diagram);
    
    // 限制数量
    if (diagrams.length > 100) {
      diagrams.sort((a, b) => b.updatedAt - a.updatedAt);
      diagrams.splice(100);
    }
    
    this._context.globalState.update(DIAGRAMS_KEY, diagrams);
  }

  private _looksLikeDiagramCode(text: string): boolean {
    const indicators = [
      'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
      'stateDiagram', 'erDiagram', 'gantt', 'pie', 'mindmap',
      '-->', '---', '-.->',
    ];
    
    return indicators.some(ind => text.includes(ind));
  }

  private _exportAsMarkdown(diagram: Diagram): string {
    return `# ${diagram.title}

\`\`\`mermaid
${diagram.code}
\`\`\`

---
*生成时间: ${new Date(diagram.createdAt).toLocaleString('zh-CN')}*
`;
  }

  private _exportAsHtml(diagram: Diagram): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${diagram.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .mermaid {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>${diagram.title}</h1>
  <div class="mermaid">
${diagram.code}
  </div>
  <script>mermaid.initialize({ startOnLoad: true });</script>
</body>
</html>`;
  }
}
