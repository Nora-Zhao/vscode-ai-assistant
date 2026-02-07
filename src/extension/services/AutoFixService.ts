import * as vscode from 'vscode';
import { ChatService } from '../api/ChatService';
import { ConfigManager } from '../ConfigManager';

/**
 * 修复请求类型
 */
export type FixType = 'diagram' | 'test' | 'code';

/**
 * 修复请求
 */
export interface FixRequest {
  type: FixType;
  code: string;
  error: string;
  context?: {
    language?: string;
    framework?: string;
    fileName?: string;
    originalError?: string;
  };
}

/**
 * 修复结果
 */
export interface FixResult {
  success: boolean;
  fixedCode?: string;
  explanation?: string;
  suggestions?: string[];
  error?: string;
}

/**
 * 流式修复回调
 */
export interface StreamingFixCallbacks {
  onChunk: (chunk: string, fullContent: string) => void;
  onComplete: (result: FixResult) => void;
  onError: (error: Error) => void;
}

/**
 * 修复历史记录
 */
interface FixHistory {
  timestamp: number;
  type: FixType;
  originalCode: string;
  fixedCode: string;
  error: string;
}

/**
 * 增强的自动修复服务
 */
export class AutoFixService {
  private _chatService?: ChatService;
  private _configManager: ConfigManager;
  private _fixHistory: FixHistory[] = [];
  private _maxRetries = 3;

  constructor(context: vscode.ExtensionContext) {
    this._configManager = new ConfigManager(context);
  }

  /**
   * 初始化 ChatService
   */
  private async _ensureChatService(): Promise<boolean> {
    if (!this._chatService) {
      const config = await this._configManager.getFullModelConfig();
      if (!config.apiKey) {
        return false;
      }
      this._chatService = new ChatService(config);
    }
    return true;
  }

  /**
   * 自动修复图表代码
   */
  async fixDiagram(code: string, error: string): Promise<FixResult> {
    if (!await this._ensureChatService()) {
      return { success: false, error: '请先配置 API Key' };
    }

    const prompt = this._buildDiagramFixPrompt(code, error);
    return await this._executeFixWithRetry(prompt, 'diagram', code);
  }

  /**
   * 流式修复图表代码
   */
  async fixDiagramStreaming(
    code: string, 
    error: string, 
    callbacks: StreamingFixCallbacks
  ): Promise<void> {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error('请先配置 API Key'));
      return;
    }

    const prompt = this._buildDiagramFixPrompt(code, error);
    await this._executeStreamingFix(prompt, 'diagram', callbacks);
  }

  /**
   * 流式修复测试代码
   */
  async fixTestStreaming(
    code: string, 
    error: string, 
    framework: string | undefined,
    language: string | undefined,
    callbacks: StreamingFixCallbacks
  ): Promise<void> {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error('请先配置 API Key'));
      return;
    }

    const prompt = this._buildTestFixPrompt(code, error, framework, language);
    await this._executeStreamingFix(prompt, 'test', callbacks);
  }

  /**
   * 流式修复通用代码
   */
  async fixCodeStreaming(
    code: string,
    error: string,
    language: string | undefined,
    context: string | undefined,
    callbacks: StreamingFixCallbacks
  ): Promise<void> {
    if (!await this._ensureChatService()) {
      callbacks.onError(new Error('请先配置 API Key'));
      return;
    }

    const prompt = this._buildCodeFixPrompt(code, error, language, context);
    await this._executeStreamingFix(prompt, 'code', callbacks);
  }

  /**
   * 执行流式修复
   */
  private async _executeStreamingFix(
    prompt: string,
    type: FixType,
    callbacks: StreamingFixCallbacks
  ): Promise<void> {
    let fullResponse = '';
    let lastSafePoint = 0;

    try {
      await this._chatService!.sendMessage(
        [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => {
            fullResponse += token;
            
            // 找到安全的 Markdown 截断点并发送
            const safePoint = this._findSafeMarkdownBreak(fullResponse);
            if (safePoint > lastSafePoint + 20) { // 至少积累20字符再发送
              callbacks.onChunk(fullResponse.slice(lastSafePoint, safePoint), fullResponse);
              lastSafePoint = safePoint;
            }
          },
          onComplete: () => {
            // 发送剩余内容
            if (lastSafePoint < fullResponse.length) {
              callbacks.onChunk(fullResponse.slice(lastSafePoint), fullResponse);
            }
            
            // 提取修复后的代码
            const fixedCode = this._extractFixedCode(fullResponse, type);
            const explanation = this._extractExplanation(fullResponse);
            
            if (fixedCode) {
              callbacks.onComplete({
                success: true,
                fixedCode,
                explanation,
              });
            } else {
              callbacks.onComplete({
                success: false,
                error: '无法从响应中提取修复后的代码',
              });
            }
          },
          onError: (error) => {
            // 即使出错也返回已收到的内容（如果有）
            if (fullResponse.length > 0) {
              const fixedCode = this._extractFixedCode(fullResponse, type);
              if (fixedCode) {
                callbacks.onComplete({
                  success: true,
                  fixedCode,
                  explanation: '（响应被中断，但已提取到代码）',
                });
                return;
              }
            }
            callbacks.onError(error);
          },
        }
      );
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 找到安全的 Markdown 截断点
   */
  private _findSafeMarkdownBreak(content: string): number {
    // 检查是否在代码块内
    const codeBlockStarts = (content.match(/```/g) || []).length;
    const isInCodeBlock = codeBlockStarts % 2 === 1;
    
    if (isInCodeBlock) {
      // 在代码块内，找到最后一个完整行
      const lastNewline = content.lastIndexOf('\n');
      return lastNewline > 0 ? lastNewline : 0;
    }
    
    // 不在代码块内，优先找完整代码块结束
    const lastCodeBlockEnd = content.lastIndexOf('```\n');
    if (lastCodeBlockEnd > 0) {
      const afterBlock = content.indexOf('\n', lastCodeBlockEnd + 4);
      if (afterBlock > lastCodeBlockEnd) return afterBlock;
      return lastCodeBlockEnd + 4;
    }
    
    // 找完整段落
    const lastParagraph = content.lastIndexOf('\n\n');
    if (lastParagraph > 0) return lastParagraph + 2;
    
    // 找完整行
    const lastNewline = content.lastIndexOf('\n');
    if (lastNewline > 0) return lastNewline + 1;
    
    return content.length;
  }

  /**
   * 自动修复测试代码
   */
  async fixTest(
    code: string, 
    error: string, 
    framework?: string,
    language?: string
  ): Promise<FixResult> {
    if (!await this._ensureChatService()) {
      return { success: false, error: '请先配置 API Key' };
    }

    const prompt = this._buildTestFixPrompt(code, error, framework, language);
    return await this._executeFixWithRetry(prompt, 'test', code);
  }

  /**
   * 自动修复通用代码
   */
  async fixCode(
    code: string,
    error: string,
    language?: string,
    context?: string
  ): Promise<FixResult> {
    if (!await this._ensureChatService()) {
      return { success: false, error: '请先配置 API Key' };
    }

    const prompt = this._buildCodeFixPrompt(code, error, language, context);
    return await this._executeFixWithRetry(prompt, 'code', code);
  }

  /**
   * 智能诊断错误
   */
  async diagnoseError(error: string, codeContext?: string): Promise<{
    diagnosis: string;
    possibleCauses: string[];
    suggestedFixes: string[];
  }> {
    if (!await this._ensureChatService()) {
      return {
        diagnosis: '无法诊断',
        possibleCauses: ['请先配置 API Key'],
        suggestedFixes: [],
      };
    }

    const prompt = `作为代码诊断专家，分析以下错误：

**错误信息：**
\`\`\`
${error}
\`\`\`

${codeContext ? `**相关代码上下文：**\n\`\`\`\n${codeContext}\n\`\`\`\n` : ''}

请提供：
1. 错误诊断（简洁说明问题本质）
2. 可能原因（列出2-3个可能的原因）
3. 修复建议（具体的修复步骤）

请用以下JSON格式返回：
\`\`\`json
{
  "diagnosis": "诊断结果",
  "possibleCauses": ["原因1", "原因2"],
  "suggestedFixes": ["修复步骤1", "修复步骤2"]
}
\`\`\``;

    try {
      let response = '';
      await this._chatService!.sendMessage(
        [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => { response += token; },
          onComplete: () => {},
          onError: () => {},
        }
      );

      // 提取 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      return {
        diagnosis: '无法解析诊断结果',
        possibleCauses: [],
        suggestedFixes: [],
      };
    } catch {
      return {
        diagnosis: '诊断过程出错',
        possibleCauses: [],
        suggestedFixes: [],
      };
    }
  }

  /**
   * 获取修复历史
   */
  getFixHistory(): FixHistory[] {
    return this._fixHistory.slice(-20); // 返回最近20条
  }

  /**
   * 清除修复历史
   */
  clearFixHistory(): void {
    this._fixHistory = [];
  }

  // ==================== 私有方法 ====================

  /**
   * 构建图表修复提示
   */
  private _buildDiagramFixPrompt(code: string, error: string): string {
    // 检测图表类型
    const diagramType = this._detectDiagramType(code);
    const syntaxDoc = this._getMermaidSyntaxDoc(diagramType);
    
    return `你是一个 Mermaid 图表专家。以下 Mermaid 代码存在语法错误，请修复它。

**错误代码：**
\`\`\`mermaid
${code}
\`\`\`

**错误信息：**
${error}

**Mermaid 语法要点 (${diagramType})：**
${syntaxDoc}

**官方语法参考：** https://mermaid.js.org/syntax/${this._getDiagramSyntaxPath(diagramType)}.html

**修复要求：**
1. 分析错误原因
2. 严格遵循 Mermaid 官方语法规范
3. 修复语法问题，保持原有图表结构和意图
4. 确保修复后的代码可以正确渲染
5. 节点文本中避免使用特殊字符 [ ] { } ( ) < > | # ; 等
6. 如果节点文本需要包含特殊字符，请用引号包裹

请按以下格式返回：

**错误分析：**
[简要说明错误原因]

**修复后代码：**
\`\`\`mermaid
[修复后的完整代码]
\`\`\`

**修改说明：**
[说明做了哪些修改]`;
  }

  /**
   * 检测 Mermaid 图表类型
   */
  private _detectDiagramType(code: string): string {
    const trimmed = code.trim().toLowerCase();
    if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) return 'flowchart';
    if (trimmed.startsWith('sequencediagram')) return 'sequence';
    if (trimmed.startsWith('classdiagram')) return 'class';
    if (trimmed.startsWith('statediagram')) return 'state';
    if (trimmed.startsWith('erdiagram')) return 'er';
    if (trimmed.startsWith('gantt')) return 'gantt';
    if (trimmed.startsWith('pie')) return 'pie';
    if (trimmed.startsWith('mindmap')) return 'mindmap';
    return 'flowchart';
  }

  /**
   * 获取 Mermaid 语法文档路径
   */
  private _getDiagramSyntaxPath(type: string): string {
    const paths: Record<string, string> = {
      flowchart: 'flowchart',
      sequence: 'sequenceDiagram',
      class: 'classDiagram',
      state: 'stateDiagram',
      er: 'entityRelationshipDiagram',
      gantt: 'gantt',
      pie: 'pie',
      mindmap: 'mindmap',
    };
    return paths[type] || 'flowchart';
  }

  /**
   * 获取 Mermaid 语法说明
   */
  private _getMermaidSyntaxDoc(type: string): string {
    const docs: Record<string, string> = {
      flowchart: `- 使用 flowchart TB/LR/BT/RL 声明方向 (TB=上到下, LR=左到右)
- 节点形状: A[方形] B(圆角) C{菱形} D((圆形)) E>旗帜形] F([体育场形])
- 连接线: A --> B (箭头) A --- B (实线) A -.-> B (虚线) A ==> B (粗箭头)
- 连接文字: A -->|文字| B 或 A -- 文字 --> B
- 子图: subgraph 标题 ... end
- 注意: 节点ID只能是字母数字下划线，文本用[]包裹`,
      sequence: `- 使用 sequenceDiagram 声明
- 参与者: participant A as 别名
- 消息类型: A->>B (实线箭头) A-->>B (虚线箭头) A-)B (异步)
- 激活: activate A / deactivate A 或 A->>+B: / A->>-B:
- 注释: Note right of A: 内容
- 循环/条件: loop/alt/opt/par ... end`,
      class: `- 使用 classDiagram 声明
- 类定义: class 类名 { +公有方法() -私有属性 #保护 ~包 }
- 关系: A <|-- B (继承) A *-- B (组合) A o-- B (聚合) A --> B (关联)
- 基数: "1" -- "*" 表示一对多`,
      state: `- 使用 stateDiagram-v2 声明
- 状态定义: state "描述" as s1
- 转换: s1 --> s2 或 s1 --> s2 : 事件
- 特殊: [*] --> s1 (开始) s1 --> [*] (结束)
- 复合: state 父状态 { ... }`,
      er: `- 使用 erDiagram 声明
- 实体和关系: A ||--o{ B : "标签"
- 基数符号: || (恰好一个) |o (零或一个) }| (一个或多个) }o (零或多个)
- 属性: ENTITY { type name }`,
      gantt: `- 使用 gantt 声明
- 必须有 title 和 dateFormat (如 YYYY-MM-DD)
- 任务: 任务名 :状态, 开始, 结束/持续
- 状态: done/active/crit 或 crit,done
- 分组: section 名称`,
      pie: `- 使用 pie 或 pie showData 声明
- 可选 title "标题"
- 数据格式: "标签" : 数值`,
      mindmap: `- 使用 mindmap 声明
- 层级用缩进表示（2个空格）
- 根节点无缩进
- 可用形状: ((圆形)) [方形] (圆角)`,
    };
    return docs[type] || docs.flowchart;
  }

  /**
   * 构建测试修复提示
   */
  private _buildTestFixPrompt(
    code: string, 
    error: string, 
    framework?: string,
    language?: string
  ): string {
    const lang = language || this._detectLanguage(code);
    const fw = framework || this._detectTestFramework(code);

    return `你是一个测试代码专家。以下 ${fw || '单元测试'} 测试代码执行失败，请修复它。

**测试框架：** ${fw || '未知'}
**编程语言：** ${lang || '未知'}

**失败的测试代码：**
\`\`\`${lang || ''}
${code}
\`\`\`

**错误信息：**
\`\`\`
${error}
\`\`\`

**修复要求：**
1. 分析测试失败的原因
2. 修复测试代码中的问题
3. 确保测试逻辑正确
4. 保持原有测试覆盖范围
5. 如果是断言问题，检查期望值是否合理

请按以下格式返回：

**错误分析：**
[简要说明测试失败的原因]

**修复后代码：**
\`\`\`${lang || ''}
[修复后的完整测试代码]
\`\`\`

**修改说明：**
[说明做了哪些修改]

**注意事项：**
[如果有需要注意的地方，请说明]`;
  }

  /**
   * 构建通用代码修复提示
   */
  private _buildCodeFixPrompt(
    code: string,
    error: string,
    language?: string,
    context?: string
  ): string {
    const lang = language || this._detectLanguage(code);

    return `你是一个代码修复专家。以下代码存在错误，请修复它。

**编程语言：** ${lang || '未知'}

**有问题的代码：**
\`\`\`${lang || ''}
${code}
\`\`\`

**错误信息：**
\`\`\`
${error}
\`\`\`

${context ? `**上下文信息：**\n${context}\n` : ''}

**修复要求：**
1. 分析错误原因
2. 修复代码问题
3. 保持代码风格一致
4. 不要改变代码的主要逻辑

请按以下格式返回：

**错误分析：**
[简要说明错误原因]

**修复后代码：**
\`\`\`${lang || ''}
[修复后的完整代码]
\`\`\`

**修改说明：**
[说明做了哪些修改]`;
  }

  /**
   * 执行带重试的修复
   */
  private async _executeFixWithRetry(
    prompt: string,
    type: FixType,
    originalCode: string
  ): Promise<FixResult> {
    let lastError = '';
    
    for (let attempt = 0; attempt < this._maxRetries; attempt++) {
      try {
        const result = await this._executeFix(prompt, type);
        
        if (result.success && result.fixedCode) {
          // 验证修复结果
          const isValid = await this._validateFix(type, result.fixedCode);
          
          if (isValid) {
            // 记录成功的修复
            this._fixHistory.push({
              timestamp: Date.now(),
              type,
              originalCode,
              fixedCode: result.fixedCode,
              error: lastError,
            });
            return result;
          } else {
            lastError = '修复后的代码仍有问题';
            // 如果验证失败，更新 prompt 加入新的错误信息
            prompt += `\n\n**注意：** 上一次修复尝试未成功，修复后的代码仍有问题。请重新分析并修复。`;
          }
        } else {
          lastError = result.error || '修复失败';
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : '未知错误';
      }
    }

    return {
      success: false,
      error: `修复失败（尝试 ${this._maxRetries} 次后）: ${lastError}`,
      suggestions: [
        '请手动检查代码',
        '尝试简化代码后重试',
        '检查是否有语法错误',
      ],
    };
  }

  /**
   * 执行单次修复
   */
  private async _executeFix(prompt: string, type: FixType): Promise<FixResult> {
    return new Promise((resolve) => {
      let response = '';
      
      this._chatService!.sendMessage(
        [{ id: '0', role: 'user', content: prompt, timestamp: Date.now() }],
        {
          onToken: (token) => {
            response += token;
          },
          onComplete: () => {
            // 提取修复后的代码
            const fixedCode = this._extractFixedCode(response, type);
            const explanation = this._extractExplanation(response);
            
            if (fixedCode) {
              resolve({
                success: true,
                fixedCode,
                explanation,
              });
            } else {
              resolve({
                success: false,
                error: '无法从响应中提取修复后的代码',
              });
            }
          },
          onError: (error) => {
            resolve({
              success: false,
              error: error.message,
            });
          },
        }
      );
    });
  }

  /**
   * 提取修复后的代码
   */
  private _extractFixedCode(response: string, type: FixType): string | null {
    // 根据类型使用不同的提取逻辑
    let codeBlock: RegExpMatchArray | null;
    
    if (type === 'diagram') {
      // 优先查找 mermaid 代码块
      codeBlock = response.match(/```mermaid\s*([\s\S]*?)\s*```/);
    } else {
      // 查找任意语言的代码块
      codeBlock = response.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
    }

    if (codeBlock && codeBlock[1]) {
      return codeBlock[1].trim();
    }

    // 如果没有找到代码块，尝试查找缩进的代码
    const lines = response.split('\n');
    const codeLines: string[] = [];
    let inCode = false;

    for (const line of lines) {
      if (line.startsWith('    ') || line.startsWith('\t')) {
        inCode = true;
        codeLines.push(line);
      } else if (inCode && line.trim() === '') {
        codeLines.push(line);
      } else {
        inCode = false;
      }
    }

    if (codeLines.length > 3) {
      return codeLines.join('\n').trim();
    }

    return null;
  }

  /**
   * 提取解释说明
   */
  private _extractExplanation(response: string): string | undefined {
    const sections = [
      /\*\*错误分析[：:]\*\*\s*([\s\S]*?)(?=\*\*修复后代码|```|$)/,
      /\*\*修改说明[：:]\*\*\s*([\s\S]*?)(?=\*\*注意|$)/,
    ];

    const explanations: string[] = [];
    
    for (const pattern of sections) {
      const match = response.match(pattern);
      if (match && match[1]) {
        let content = match[1].trim();
        // 清理空的列表项（如 "1." 或 "- " 后面没有内容）
        content = content
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            // 过滤掉空行和只有列表符号的行
            if (!trimmed) return false;
            if (/^(\d+\.|[-*])\s*$/.test(trimmed)) return false;
            // 过滤掉不完整的句子（以冒号结尾但没有后续内容）
            if (/[:：]\s*$/.test(trimmed) && trimmed.length < 30) return false;
            return true;
          })
          .join('\n');
        
        if (content && content.length > 5) {
          explanations.push(content);
        }
      }
    }

    // 如果没有提取到内容，返回默认消息
    if (explanations.length === 0) {
      return '已自动修复代码中的语法问题';
    }

    return explanations.join('\n\n');
  }

  /**
   * 验证修复结果
   */
  private async _validateFix(type: FixType, code: string): Promise<boolean> {
    if (type === 'diagram') {
      return this._validateMermaid(code);
    }
    // 对于测试和代码，简单检查是否为空
    return code.trim().length > 10;
  }

  /**
   * 验证 Mermaid 代码
   */
  private _validateMermaid(code: string): boolean {
    // 基本语法检查
    const validStartPatterns = [
      /^flowchart\s+/m,
      /^graph\s+/m,
      /^sequenceDiagram/m,
      /^classDiagram/m,
      /^stateDiagram/m,
      /^erDiagram/m,
      /^gantt/m,
      /^pie/m,
      /^mindmap/m,
    ];

    return validStartPatterns.some(pattern => pattern.test(code.trim()));
  }

  /**
   * 检测编程语言
   */
  private _detectLanguage(code: string): string {
    if (code.includes('import React') || code.includes('from \'react\'')) {
      return 'typescript';
    }
    if (code.includes('def ') || code.includes('import ')) {
      if (code.includes('async def') || code.includes('await ')) {
        return 'python';
      }
    }
    if (code.includes('func ') && code.includes('package ')) {
      return 'go';
    }
    if (code.includes('fn ') && code.includes('let ')) {
      return 'rust';
    }
    if (code.includes('public class') || code.includes('private ')) {
      return 'java';
    }
    if (code.includes('const ') || code.includes('let ') || code.includes('function ')) {
      return 'typescript';
    }
    return '';
  }

  /**
   * 检测测试框架
   */
  private _detectTestFramework(code: string): string {
    if (code.includes('describe(') && code.includes('it(')) {
      if (code.includes('vitest')) return 'Vitest';
      if (code.includes('@jest')) return 'Jest';
      return 'Jest/Mocha';
    }
    if (code.includes('pytest') || code.includes('def test_')) {
      return 'pytest';
    }
    if (code.includes('@Test') || code.includes('junit')) {
      return 'JUnit';
    }
    if (code.includes('func Test')) {
      return 'Go testing';
    }
    return '';
  }
}
