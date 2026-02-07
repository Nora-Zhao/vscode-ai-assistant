import * as vscode from 'vscode';
import { Message, Session, Attachment, DiagramType, Diagram } from '../../types/shared';
import { ChatService } from '../api/ChatService';
import { ConfigManager } from '../ConfigManager';
import { SessionManager } from '../session/SessionManager';
import { DiagramGenerator } from '../diagram/DiagramGenerator';
import { TestGenerator } from '../test-generator/TestGenerator';
import { AutoFixService } from '../services/AutoFixService';
import { EnhancedProjectAnalyzer } from '../analyzer/EnhancedProjectAnalyzer';
import { SmartInputParser } from '../commands/SmartInputParser';
import { CommandParser } from '../commands/CommandParser';

// 任务类型定义
export type TaskType = 'chat' | 'diagram' | 'test' | 'command' | 'skill' | 'mcp';
export type TaskStatus = 'idle' | 'running' | 'success' | 'error';

export interface TaskState {
  status: TaskStatus;
  message?: string;
  abortController?: AbortController;
  timestamp: number;
}

// 最近生成的图表上下文
export interface LastGeneratedDiagram {
  type: string;
  code: string;
  description: string;
  timestamp: number;
}

// 最近生成的测试上下文
export interface LastGeneratedTest {
  code: string;
  framework: string;
  sourceFile: string;
  timestamp: number;
}

/**
 * ChatViewProvider的共享上下文
 * 用于在各个Handler之间共享状态和服务
 */
export interface ChatViewContext {
  // VSCode 相关
  extensionUri: vscode.Uri;
  extensionContext: vscode.ExtensionContext;
  view: vscode.WebviewView | undefined;
  
  // 服务实例
  chatService: ChatService | undefined;
  configManager: ConfigManager;
  sessionManager: SessionManager;
  diagramGenerator: DiagramGenerator;
  testGenerator: TestGenerator;
  autoFixService: AutoFixService;
  projectAnalyzer: EnhancedProjectAnalyzer;
  inputParser: SmartInputParser;
  commandParser: CommandParser;
  
  // 状态
  taskStates: Record<TaskType, TaskState>;
  currentStreamingMessage: Message | null;
  messageHistory: string[];
  historyIndex: number;
  projectContext: string | undefined;
  lastGeneratedDiagram: LastGeneratedDiagram | undefined;
  lastGeneratedTest: LastGeneratedTest | undefined;
  
  // 方法
  postMessage: (message: any) => void;
  updateTaskStatus: (taskType: TaskType, status: TaskStatus, message?: string) => void;
  isTaskRunning: (taskType: TaskType) => boolean;
  setProcessingContext: (processing: boolean) => void;
  ensureChatService: () => Promise<ChatService | null>;
}

/**
 * 消息处理器接口
 */
export interface MessageHandler {
  /**
   * 处理指定类型的消息
   * @param data 消息数据
   * @returns 是否已处理该消息
   */
  handle(data: any): Promise<boolean>;
}

/**
 * WebView消息类型定义
 */
export interface WebViewMessage {
  type: string;
  [key: string]: any;
}

// 代码操作上下文
export interface CodeActionContext {
  action: string;
  prompt: string;
  fileName: string;
  language: string;
  code: string;
  useSearchReplace: boolean;
}
