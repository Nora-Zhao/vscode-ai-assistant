import { Message, ModelConfig, Attachment } from '../../types/shared';

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

// 可选的请求配置
export interface RequestOptions {
  maxTokens?: number;
  temperature?: number;
  requestId?: string;  // ✅ 新增：用于标识独立请求
}

export abstract class BaseAdapter {
  protected config: ModelConfig;
  
  // ✅ 修复：使用 Map 管理多个独立的 AbortController
  // 这样不同任务（chat, diagram, test）的请求互不影响
  protected abortControllers: Map<string, AbortController> = new Map();
  
  // ✅ 保留向后兼容的单一 controller（用于没有指定 requestId 的情况）
  protected defaultAbortController: AbortController | null = null;

  // ✅ 新增：存储活动的 reader，以便取消时能主动中断流式读取
  protected activeReaders: Map<string, ReadableStreamDefaultReader<Uint8Array>> = new Map();
  protected defaultReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract sendMessage(
    messages: Message[],
    callbacks: StreamCallback,
    options?: RequestOptions
  ): Promise<void>;

  abstract getEndpoint(): string;

  /**
   * ✅ 创建或获取 AbortController
   * @param requestId 可选的请求ID，用于隔离不同任务的取消操作
   */
  protected createAbortController(requestId?: string): AbortController {
    const controller = new AbortController();
    
    if (requestId) {
      // 如果有 requestId，存入 Map
      // 先取消之前同ID的请求（如果存在）
      this.cancelRequest(requestId);
      this.abortControllers.set(requestId, controller);
    } else {
      // 没有 requestId，使用默认 controller（向后兼容）
      this.defaultAbortController = controller;
    }
    
    return controller;
  }

  /**
   * ✅ 取消特定请求 - 修复：同时取消 reader
   * @param requestId 请求ID，如果不指定则取消默认请求
   */
  cancelRequest(requestId?: string): void {
    if (requestId) {
      const controller = this.abortControllers.get(requestId);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(requestId);
      }
      // ✅ 修复：同时取消活动的 reader
      const reader = this.activeReaders.get(requestId);
      if (reader) {
        try {
          reader.cancel();
        } catch (e) {
          // 忽略取消错误
        }
        this.activeReaders.delete(requestId);
      }
    } else {
      // 取消默认请求
      if (this.defaultAbortController) {
        this.defaultAbortController.abort();
        this.defaultAbortController = null;
      }
      // ✅ 修复：同时取消默认 reader
      if (this.defaultReader) {
        try {
          this.defaultReader.cancel();
        } catch (e) {
          // 忽略取消错误
        }
        this.defaultReader = null;
      }
    }
  }

  /**
   * ✅ 取消所有请求（保留向后兼容）
   */
  cancel(): void {
    // 取消默认请求
    if (this.defaultAbortController) {
      this.defaultAbortController.abort();
      this.defaultAbortController = null;
    }
    if (this.defaultReader) {
      try {
        this.defaultReader.cancel();
      } catch (e) {}
      this.defaultReader = null;
    }
    
    // 取消所有带 ID 的请求
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
    }
    this.abortControllers.clear();
    
    // ✅ 修复：取消所有活动的 reader
    for (const [id, reader] of this.activeReaders) {
      try {
        reader.cancel();
      } catch (e) {}
    }
    this.activeReaders.clear();
  }

  /**
   * ✅ 清理已完成的请求
   */
  protected cleanupRequest(requestId?: string): void {
    if (requestId) {
      this.abortControllers.delete(requestId);
      this.activeReaders.delete(requestId);
    } else {
      this.defaultReader = null;
    }
  }

  protected buildMessageContent(message: Message): any {
    if (!message.attachments || message.attachments.length === 0) {
      return message.content;
    }

    const content: any[] = [{ type: 'text', text: message.content }];

    for (const attachment of message.attachments) {
      if (attachment.type === 'image') {
        // 图片附件
        content.push({
          type: 'image_url',
          image_url: {
            url: attachment.data.startsWith('data:')
              ? attachment.data
              : `data:${attachment.mimeType};base64,${attachment.data}`,
          },
        });
      } else if (attachment.type === 'file') {
        // 文件附件 - 根据类型进行处理
        const fileInfo = `\n\n---\n📎 **附件: ${attachment.name}**`;
        const mimeType = attachment.mimeType || '';
        const fileName = attachment.name || '';
        
        // 处理文本文件
        if (this.isTextFile(mimeType, fileName)) {
          try {
            const fileContent = attachment.data.startsWith('data:')
              ? this.decodeBase64(attachment.data.split(',')[1] || '')
              : attachment.data;
            const ext = this.getFileExtension(fileName);
            content.push({
              type: 'text',
              text: `${fileInfo}\n\`\`\`${ext}\n${fileContent}\n\`\`\``,
            });
          } catch (e) {
            content.push({
              type: 'text',
              text: `${fileInfo}\n[文件解析错误]`,
            });
          }
        }
        // 处理 CSV 文件
        else if (this.isCsvFile(mimeType, fileName)) {
          try {
            const csvContent = attachment.data.startsWith('data:')
              ? this.decodeBase64(attachment.data.split(',')[1] || '')
              : attachment.data;
            const parsedCsv = this.parseCSV(csvContent);
            content.push({
              type: 'text',
              text: `${fileInfo}\n\n**CSV 数据预览（前20行）:**\n${parsedCsv}`,
            });
          } catch (e) {
            content.push({
              type: 'text',
              text: `${fileInfo}\n[CSV 解析错误]`,
            });
          }
        }
        // 处理 JSON 文件
        else if (this.isJsonFile(mimeType, fileName)) {
          try {
            const jsonContent = attachment.data.startsWith('data:')
              ? this.decodeBase64(attachment.data.split(',')[1] || '')
              : attachment.data;
            // 尝试格式化 JSON
            const parsed = JSON.parse(jsonContent);
            const formatted = JSON.stringify(parsed, null, 2);
            content.push({
              type: 'text',
              text: `${fileInfo}\n\`\`\`json\n${formatted.slice(0, 10000)}${formatted.length > 10000 ? '\n...(截断)' : ''}\n\`\`\``,
            });
          } catch (e) {
            content.push({
              type: 'text',
              text: `${fileInfo}\n[JSON 解析错误]`,
            });
          }
        }
        // 处理 PDF 文件 - 提示用户该功能有限
        else if (this.isPdfFile(mimeType, fileName)) {
          content.push({
            type: 'text',
            text: `${fileInfo}\n[PDF 文件，大小: ${attachment.size ? Math.round(attachment.size / 1024) + 'KB' : '未知'}]\n\n💡 **提示**: PDF 内容无法直接解析。如果您使用支持视觉的模型（如 GPT-4o、Claude 3），可以将 PDF 截图后上传图片。`,
          });
        }
        // 处理 Excel 文件 - 提示用户转换为 CSV
        else if (this.isExcelFile(mimeType, fileName)) {
          content.push({
            type: 'text',
            text: `${fileInfo}\n[Excel 文件，大小: ${attachment.size ? Math.round(attachment.size / 1024) + 'KB' : '未知'}]\n\n💡 **提示**: Excel 文件无法直接解析。建议您将其导出为 CSV 格式后重新上传。`,
          });
        }
        // 其他二进制文件
        else {
          content.push({
            type: 'text',
            text: `${fileInfo}\n[二进制文件，类型: ${mimeType || '未知'}，大小: ${attachment.size ? Math.round(attachment.size / 1024) + 'KB' : '未知'}]`,
          });
        }
      } else if (attachment.type === 'voice') {
        // 语音附件 - 提示用户语音已转为文本
        content.push({
          type: 'text',
          text: `\n\n---\n🎤 **语音输入** (时长: ${attachment.duration ? attachment.duration + '秒' : '未知'})`,
        });
      }
    }

    return content;
  }

  /**
   * 安全解码 Base64
   */
  private decodeBase64(base64: string): string {
    try {
      // 浏览器环境
      if (typeof atob !== 'undefined') {
        return decodeURIComponent(escape(atob(base64)));
      }
      // Node.js 环境
      return Buffer.from(base64, 'base64').toString('utf-8');
    } catch {
      // 如果 UTF-8 解码失败，尝试 Latin1
      if (typeof atob !== 'undefined') {
        return atob(base64);
      }
      return Buffer.from(base64, 'base64').toString('latin1');
    }
  }

  /**
   * 解析 CSV 内容为表格格式
   */
  private parseCSV(content: string, maxRows: number = 20): string {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const displayLines = lines.slice(0, maxRows);
    
    if (displayLines.length === 0) return '(空文件)';
    
    // 尝试检测分隔符
    const firstLine = displayLines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : 
                      firstLine.includes(';') ? ';' : ',';
    
    // 解析为表格
    const rows = displayLines.map(line => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
    
    // 生成 Markdown 表格
    if (rows.length === 0) return '(空文件)';
    
    const header = rows[0];
    const separator = header.map(() => '---');
    const dataRows = rows.slice(1);
    
    let result = `| ${header.join(' | ')} |\n| ${separator.join(' | ')} |\n`;
    for (const row of dataRows) {
      result += `| ${row.join(' | ')} |\n`;
    }
    
    if (lines.length > maxRows) {
      result += `\n... (共 ${lines.length} 行，仅显示前 ${maxRows} 行)`;
    }
    
    return result;
  }

  private isTextFile(mimeType?: string, fileName?: string): boolean {
    const textMimeTypes = [
      'text/', 
      'application/javascript',
      'application/typescript',
      'application/x-python',
      'application/x-ruby',
      'application/x-sh',
      'application/x-yaml',
    ];
    const textExtensions = [
      '.txt', '.md', '.markdown', '.html', '.htm', '.css', '.js', '.ts', 
      '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.go', 
      '.rs', '.rb', '.php', '.sh', '.bash', '.zsh', '.yaml', '.yml', '.toml', 
      '.ini', '.cfg', '.conf', '.sql', '.vue', '.svelte', '.r', '.scala',
      '.swift', '.kt', '.kts', '.gradle', '.cmake', '.makefile', '.dockerfile',
      '.gitignore', '.env', '.env.local', '.env.example'
    ];
    
    // 排除 JSON 和 CSV（单独处理）
    if (this.isJsonFile(mimeType, fileName) || this.isCsvFile(mimeType, fileName)) {
      return false;
    }
    
    if (mimeType && textMimeTypes.some(t => mimeType.startsWith(t))) {
      return true;
    }
    if (fileName) {
      const lowerName = fileName.toLowerCase();
      if (textExtensions.some(ext => lowerName.endsWith(ext))) {
        return true;
      }
      // 无扩展名的常见配置文件
      const noExtNames = ['makefile', 'dockerfile', 'jenkinsfile', 'vagrantfile', '.gitignore', '.dockerignore', '.editorconfig'];
      if (noExtNames.some(name => lowerName === name || lowerName.endsWith('/' + name))) {
        return true;
      }
    }
    return false;
  }

  private isCsvFile(mimeType?: string, fileName?: string): boolean {
    if (mimeType === 'text/csv' || mimeType === 'application/csv') return true;
    if (fileName && (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.tsv'))) return true;
    return false;
  }

  private isJsonFile(mimeType?: string, fileName?: string): boolean {
    if (mimeType === 'application/json') return true;
    if (fileName && fileName.toLowerCase().endsWith('.json')) return true;
    return false;
  }

  private isPdfFile(mimeType?: string, fileName?: string): boolean {
    if (mimeType === 'application/pdf') return true;
    if (fileName && fileName.toLowerCase().endsWith('.pdf')) return true;
    return false;
  }

  private isExcelFile(mimeType?: string, fileName?: string): boolean {
    const excelMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];
    if (mimeType && excelMimes.includes(mimeType)) return true;
    if (fileName) {
      const lowerName = fileName.toLowerCase();
      if (['.xls', '.xlsx', '.xlsm', '.ods'].some(ext => lowerName.endsWith(ext))) return true;
    }
    return false;
  }

  private getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'sh': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'sql': 'sql',
      'vue': 'vue',
    };
    return langMap[ext] || ext;
  }

  protected async handleSSEStream(
    response: Response,
    callbacks: StreamCallback,
    extractContent: (data: any) => string | null,
    requestId?: string  // ✅ 新增：传入 requestId 用于检查正确的 controller
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    // ✅ 修复：存储 reader 以便取消时能主动中断
    if (requestId) {
      this.activeReaders.set(requestId, reader);
    } else {
      this.defaultReader = reader;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    // ✅ 获取正确的 AbortController
    const controller = requestId 
      ? this.abortControllers.get(requestId) 
      : this.defaultAbortController;

    try {
      while (true) {
        // ✅ 检查正确的 controller 是否已被取消
        if (controller?.signal.aborted) {
          try {
            reader.cancel();
          } catch (e) {}
          return; // 直接返回，不调用onComplete
        }

        const { done, value } = await reader.read();
        if (done) break;

        // ✅ 再次检查是否被取消（在读取后）
        if (controller?.signal.aborted) {
          try {
            reader.cancel();
          } catch (e) {}
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = extractContent(parsed);
              if (content) {
                fullResponse += content;
                callbacks.onToken(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      callbacks.onComplete(fullResponse);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 被取消时不调用onComplete，直接返回
        return;
      } else {
        throw error;
      }
    } finally {
      // ✅ 清理请求和 reader
      this.cleanupRequest(requestId);
    }
  }
}
