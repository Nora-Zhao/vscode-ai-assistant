import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Message,
  ModelConfig,
  AVAILABLE_MODELS,
  Provider,
  Attachment,
  Diagram,
  SlashCommand,
  TestHistoryItem,
  DiagramType,
} from "../types/shared";
import MessageList from "./components/MessageList";
import InputBox from "./components/InputBox";
import ModelSwitcher from "./components/ModelSwitcher";
import SettingsPanel from "./components/SettingsPanel";
import DiagramView from "./components/DiagramView";
import TestView from "./components/TestView";
import HistoryPanel from "./components/HistoryPanel";
import SessionHistoryPanel from "./components/SessionHistoryPanel";
import SearchBar from "./components/SearchBar";
import TokenStats from "./components/TokenStats";
import GitCommandPanel from "./components/GitCommandPanel";
import SmartInputHint, { QuickCommands } from "./components/SmartInputHint";
import SkillManagePanel from "./components/SkillManagePanel";
import TaskLogPanel, {
  TaskLogEntry,
  TaskType,
  TaskStatus,
  createLogEntry,
  getDefaultMessage,
} from "./components/TaskLogPanel";
import { LanguageSwitcher } from "./components/ParallelTaskPanel";
import { vscode } from "./vscodeApi";

// 辅助函数：获取文件图标
function getFileIcon(mimeType: string, fileName: string): string {
  if (mimeType.includes("pdf")) return "📕";
  if (
    mimeType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  )
    return "📘";
  if (
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".csv")
  )
    return "📗";
  if (
    mimeType.includes("text") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md")
  )
    return "📄";
  if (mimeType.includes("json")) return "📋";
  if (mimeType.includes("image")) return "🖼️";
  return "📎";
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// 布局尺寸类型
type LayoutSize = "compact" | "normal" | "wide";

// 标签类型
type TabType = "chat" | "diagram" | "test";

interface AppState {
  messages: Message[];
  isLoading: boolean;
  modelConfig: ModelConfig;
  showSettings: boolean;
  currentDiagram: Diagram | null;
  generatedTest: { code: string; path: string; framework: string } | null;
  testResult: { success: boolean; output: string; errors?: string[] } | null;
  error: string | null;
  suggestions: SlashCommand[];
  activeTab: TabType;
  showDiagramHistory: boolean;
  showTestHistory: boolean;
  showSessionHistory: boolean;
  showSearch: boolean;
  showGitPanel: boolean;
  showSkillPanel: boolean;
  showQuickCommands: boolean;
  taskLogs: TaskLogEntry[]; // 任务日志
  showTaskLog: boolean; // 任务日志面板是否展开
  // V17 简化版功能状态
  currentLanguage: "zh-CN" | "en-US";
}

export default function App() {
  const [state, setState] = useState<AppState>({
    messages: [],
    isLoading: false,
    modelConfig: {
      provider: "deepseek",
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 4096,
    },
    showSettings: false,
    currentDiagram: null,
    generatedTest: null,
    testResult: null,
    error: null,
    suggestions: [],
    activeTab: "chat",
    showDiagramHistory: false,
    showTestHistory: false,
    showSessionHistory: false,
    showSearch: false,
    showGitPanel: false,
    showSkillPanel: false,
    showQuickCommands: false,
    taskLogs: [],
    showTaskLog: false,
    // V17 简化版
    currentLanguage: "zh-CN",
  });

  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [layoutSize, setLayoutSize] = useState<LayoutSize>("normal");
  const appRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // ✅ 修复问题2：添加当前会话ID的ref，用于页面切换时恢复正确的会话
  const currentSessionIdRef = useRef<string | null>(null);
  
  // ✅ 新增：追踪消息数量的ref，用于判断前端是否有数据
  const hasMessagesRef = useRef<boolean>(false);

  // 使用ResizeObserver监听容器大小变化
  useEffect(() => {
    if (!appRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width < 400) {
          setLayoutSize("compact");
        } else if (width < 600) {
          setLayoutSize("normal");
        } else {
          setLayoutSize("wide");
        }
      }
    });

    resizeObserver.observe(appRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 清空任务日志
  const clearTaskLogs = useCallback(() => {
    setState((prev) => ({ ...prev, taskLogs: [] }));
  }, []);

  // 全局快捷键处理
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setState((prev) => ({ ...prev, showSearch: true }));
      }
      // Escape 关闭搜索
      if (e.key === "Escape" && state.showSearch) {
        setState((prev) => ({ ...prev, showSearch: false }));
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [state.showSearch]);

  // 滚动到指定消息
  const scrollToMessage = useCallback((messageId: string) => {
    const element = messageRefs.current.get(messageId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // 高亮闪烁效果
      element.classList.add("highlight-flash");
      setTimeout(() => {
        element.classList.remove("highlight-flash");
      }, 2000);
    }
  }, []);

  // Handle messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      switch (data.type) {
        case "init":
          // ✅ 修复问题2：初始化时记录当前会话ID
          if (data.sessionId) {
            currentSessionIdRef.current = data.sessionId;
          }
          // 更新消息状态追踪
          hasMessagesRef.current = (data.messages?.length || 0) > 0;
          setState((prev) => ({
            ...prev,
            messages: data.messages || [],
            modelConfig: data.modelConfig || prev.modelConfig,
            // ✅ 修复：如果后端告诉我们正在流式输出，设置 isLoading
            isLoading: data.isStreaming || false,
          }));
          break;

        case "resumeStreaming":
          // ✅ 修复：恢复流式输出状态
          // 当用户切换页面再切回来时，如果有正在进行的流式输出，更新消息内容并继续显示加载状态
          setState((prev) => {
            const updatedMessages = prev.messages.map((m) =>
              m.id === data.messageId ? { ...m, content: data.content } : m,
            );
            return {
              ...prev,
              messages: updatedMessages,
              isLoading: true,
            };
          });
          break;

        case "addMessage":
          hasMessagesRef.current = true;  // 有新消息了
          setState((prev) => {
            // ✅ 修复：检查消息是否已存在，避免重复添加
            const messageExists = prev.messages.some(m => m.id === data.message.id);
            if (messageExists) {
              // 消息已存在，更新内容而不是添加
              return {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === data.message.id ? { ...m, ...data.message } : m,
                ),
                isLoading: data.streaming || false,
              };
            }
            // 消息不存在，正常添加
            return {
              ...prev,
              messages: [...prev.messages, data.message],
              isLoading: data.streaming || false,
            };
          });
          break;

        case "updateMessage":
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === data.messageId ? { ...m, content: data.content } : m,
            ),
          }));
          break;

        case "completeMessage":
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === data.messageId ? { ...m, content: data.content } : m,
            ),
            isLoading: false,
          }));
          break;

        case "error":
          setState((prev) => ({
            ...prev,
            error: data.message,
            isLoading: false,
          }));
          setTimeout(() => {
            setState((prev) => ({ ...prev, error: null }));
          }, 5000);
          break;

        case "chatCleared":
          hasMessagesRef.current = false;  // 清空了消息
          if (data.sessionId) {
            console.log("new session:", data.sessionId);
            currentSessionIdRef.current = data.sessionId;
          }
          console.log("Chat cleared, resetting messages.");
          setState((prev) => ({
            ...prev,
            messages: [],
            activeTab: "chat",
          }));
          break;

        case "sessionLoaded":
          // ✅ 修复问题2：切换会话时记录新的会话ID
          if (data.sessionId) {
            currentSessionIdRef.current = data.sessionId;
          }
          hasMessagesRef.current = (data.messages?.length || 0) > 0;  // 更新消息状态
          // 切换会话时只更新消息，保持其他UI状态
          setState((prev) => ({
            ...prev,
            messages: data.messages || [],
            // 不清除 currentDiagram、generatedTest 等状态
            // 不强制切换到 chat tab
          }));
          break;

        case "taskStopped":
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
          break;

        case "removeMessage":
          setState((prev) => ({
            ...prev,
            messages: prev.messages.filter((m) => m.id !== data.messageId),
          }));
          break;

        case "streamingInterrupted":
          // 流式响应被中断时，只需标记加载完成，不添加"已中断"文字
          // 保持消息内容原样，确保Markdown渲染良好
          setState((prev) => {
            return { ...prev, isLoading: false };
          });
          break;

        case "historyMessage":
          setHistoryMessage(data.message);
          break;

        case "suggestions":
          setState((prev) => ({
            ...prev,
            suggestions: data.suggestions,
          }));
          break;

        case "diagramGenerated":
        case "diagramUpdated":
          setState((prev) => ({
            ...prev,
            currentDiagram: data.diagram,
            activeTab: "diagram",
          }));
          break;

        case "testGenerated":
          setState((prev) => ({
            ...prev,
            generatedTest: {
              code: data.code,
              path: data.suggestedPath,
              framework: data.framework,
            },
            testResult: null, // 重置测试结果
            activeTab: "test",
          }));
          break;

        case "testGenerating":
          setState((prev) => ({
            ...prev,
            generatedTest: prev.generatedTest
              ? {
                  ...prev.generatedTest,
                  code: data.content,
                }
              : {
                  code: data.content,
                  path: "",
                  framework: "unknown",
                },
          }));
          break;

        case "testResult":
          setState((prev) => ({
            ...prev,
            testResult: {
              success: data.success,
              output: data.output,
              errors: data.errors,
            },
          }));
          break;

        case "testAutoFixed":
          setState((prev) => ({
            ...prev,
            generatedTest: prev.generatedTest
              ? {
                  ...prev.generatedTest,
                  code: data.code,
                }
              : null,
            testResult: null, // 清除之前的测试结果
          }));
          break;

        case "diagramAutoFixed":
          setState((prev) => ({
            ...prev,
            currentDiagram: prev.currentDiagram
              ? {
                  ...prev.currentDiagram,
                  code: data.code,
                }
              : null,
          }));
          break;

        case "modelUpdated":
          setState((prev) => ({
            ...prev,
            modelConfig: {
              ...prev.modelConfig,
              provider: data.provider,
              model: data.model,
            },
          }));
          break;

        case "config":
          setState((prev) => ({
            ...prev,
            modelConfig: data.modelConfig,
          }));
          break;

        case "setInput":
          if (data.content) {
            setInputValue(data.content);
          }
          break;

        case "clearInput":
          setInputValue("");
          break;

        case "contextCompacted":
          setState((prev) => ({
            ...prev,
            messages: [
              {
                id: "summary",
                role: "system",
                content: `[上下文摘要]\n${data.summary}`,
                timestamp: Date.now(),
              },
            ],
          }));
          break;

        case "inputHint":
          // 显示智能输入提示（由SmartInputHint组件处理）
          // 这里可以选择性地显示一个临时通知
          if (data.hint && data.possibleCommand) {
            console.log("Input hint:", data.hint, data.possibleCommand);
          }
          break;

        case "taskStatus":
          // 添加或更新任务日志
          // 支持并行任务：使用taskId区分不同的任务实例
          setState((prev) => {
            const { taskType, status, message, taskId } = data;

            // 跳过chat类型的任务（这些在chatbox中已有显示）
            if (taskType === "chat") {
              return prev;
            }

            const logMessage = message || getDefaultMessage(taskType, status);

            // 如果有taskId，使用taskId作为唯一标识（并行任务）
            if (taskId) {
              if (status === "running") {
                // 新的并行任务
                const newLog = {
                  id: taskId,
                  type: taskType as TaskType,
                  status,
                  message: logMessage,
                  timestamp: Date.now(),
                };
                return {
                  ...prev,
                  taskLogs: [...prev.taskLogs, newLog].slice(-50),
                  showTaskLog: true,
                };
              } else {
                // 更新指定taskId的任务状态
                const logs = prev.taskLogs.map((log) =>
                  log.id === taskId
                    ? {
                        ...log,
                        status,
                        message: logMessage,
                        timestamp: Date.now(),
                      }
                    : log,
                );
                return { ...prev, taskLogs: logs };
              }
            }

            // 没有taskId的情况（旧的单任务模式）
            if (status === "running") {
              const newLog = createLogEntry(taskType, status, logMessage);
              return {
                ...prev,
                taskLogs: [...prev.taskLogs, newLog].slice(-50),
                showTaskLog: true,
              };
            } else if (
              status === "success" ||
              status === "error" ||
              status === "cancelled"
            ) {
              const logs = [...prev.taskLogs];
              // 找到最新的同类型running任务并更新
              for (let i = logs.length - 1; i >= 0; i--) {
                if (logs[i].type === taskType && logs[i].status === "running") {
                  logs[i] = {
                    ...logs[i],
                    status,
                    message: logMessage,
                    timestamp: Date.now(),
                  };
                  break;
                }
              }
              return { ...prev, taskLogs: logs };
            }
            return prev;
          });
          break;

        // ==================== V17 新功能消息处理 ====================
        case "languageChanged":
        case "currentLanguage":
          setState((prev) => ({
            ...prev,
            currentLanguage: data.language,
          }));
          break;

        // viewBecameVisible 已被移除 - 后端现在直接发送 init 消息
      }
    };

    window.addEventListener("message", handleMessage);
    vscode.postMessage({ type: "getConfig" });
    vscode.postMessage({ type: "getLanguage" });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 跟踪用户是否在底部（用于智能滚动）
  const userAtBottomRef = useRef(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 监听滚动事件，检测用户是否在底部
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 如果用户滚动到距离底部50px以内，认为在底部
      userAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [state.activeTab]);

  // Auto-scroll to bottom (智能滚动 - 只有用户在底部时才自动滚动)
  useEffect(() => {
    if (state.activeTab === "chat" && userAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.messages, state.activeTab]);

  // ✅ 自动同步 hasMessagesRef，确保在任何消息变化时都能正确追踪
  useEffect(() => {
    hasMessagesRef.current = state.messages.length > 0;
  }, [state.messages]);

  // 新消息发送时，强制滚动到底部
  const scrollToBottom = useCallback(() => {
    userAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Apply history message to input
  useEffect(() => {
    if (historyMessage !== null) {
      setInputValue(historyMessage);
      setHistoryMessage(null);
    }
  }, [historyMessage]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() && attachments.length === 0) return;

    vscode.postMessage({
      type: "sendMessage",
      message: inputValue,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setInputValue("");
    setAttachments([]);

    // 发送消息后滚动到底部
    scrollToBottom();
  }, [inputValue, attachments, scrollToBottom]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    // 已移除 "/" 命令自动提示功能，用户可以直接输入命令
    // 如需查看可用命令，请输入 /help
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleSend();
      } else if (e.key === "ArrowUp") {
        setInputValue("");
        vscode.postMessage({ type: "getHistory", direction: "up" });
      } else if (e.key === "ArrowDown") {
        setInputValue("");
        vscode.postMessage({ type: "getHistory", direction: "down" });
      } else if (e.key === "Tab" && state.suggestions.length > 0) {
        e.preventDefault();
        const firstSuggestion = state.suggestions[0];
        setInputValue("/" + firstSuggestion.name + " ");
        setState((prev) => ({ ...prev, suggestions: [] }));
      }
    },
    [inputValue, handleSend, state.suggestions],
  );

  const handleCancel = useCallback(() => {
    vscode.postMessage({ type: "cancelRequest" });
  }, []);

  // 处理文件上传 - 兼容InputBox接口 (file: File, type: string)
  const handleFileUpload = useCallback(async (file: File, type: string) => {
    const reader = new FileReader();

    await new Promise<void>((resolve) => {
      reader.onload = (e) => {
        const data = e.target?.result as string;
        const newAttachment: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: type === "image" ? "image" : "file",
          name: file.name,
          data,
          mimeType: file.type,
          size: file.size,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        resolve();
      };
      reader.onerror = () => {
        setState((prev) => ({ ...prev, error: `文件读取失败: ${file.name}` }));
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 处理语音输入 - 接收转录文本并追加到输入框
  const handleVoiceInput = useCallback((transcript: string) => {
    if (transcript) {
      setInputValue((prev) => prev + transcript);
    }
  }, []);

  const handleModelChange = useCallback((provider: Provider, model: string) => {
    vscode.postMessage({ type: "updateModel", provider, model });
  }, []);

  const handleRegenerate = useCallback(() => {
    vscode.postMessage({ type: "regenerate" });
  }, []);

  const handleDiagramUpdate = useCallback(
    (code: string) => {
      if (state.currentDiagram) {
        vscode.postMessage({
          type: "updateDiagram",
          diagramId: state.currentDiagram.id,
          code,
        });
      }
    },
    [state.currentDiagram],
  );

  const handleDiagramExport = useCallback(
    (format: string) => {
      if (state.currentDiagram) {
        vscode.postMessage({
          type: "exportDiagram",
          diagramId: state.currentDiagram.id,
          format,
        });
      }
    },
    [state.currentDiagram],
  );

  const handleTestSave = useCallback(() => {
    if (state.generatedTest) {
      vscode.postMessage({
        type: "saveTest",
        code: state.generatedTest.code,
        path: state.generatedTest.path,
      });
    }
  }, [state.generatedTest]);

  const handleTestRun = useCallback(() => {
    if (state.generatedTest) {
      vscode.postMessage({
        type: "runTest",
        path: state.generatedTest.path,
      });
    }
  }, [state.generatedTest]);

  // 图表自动修复
  const handleDiagramAutoFix = useCallback((code: string, error: string) => {
    vscode.postMessage({
      type: "autoFixDiagram",
      code,
      error,
    });
  }, []);

  // 测试自动修复
  const handleTestAutoFix = useCallback(
    (code: string, errors: string) => {
      vscode.postMessage({
        type: "autoFixTest",
        code,
        errors,
        framework: state.generatedTest?.framework,
        path: state.generatedTest?.path,
      });
    },
    [state.generatedTest],
  );

  // 测试代码优化/修复（不是基于运行错误，而是优化生成的代码）
  const handleTestRefine = useCallback(
    (code: string) => {
      vscode.postMessage({
        type: "refineTest",
        code,
        framework: state.generatedTest?.framework,
        path: state.generatedTest?.path,
      });
    },
    [state.generatedTest],
  );

  const dismissError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Git 命令执行
  const handleGitCommand = useCallback((command: string) => {
    vscode.postMessage({ type: "sendMessage", message: `/run ${command}` });
    setState((prev) => ({ ...prev, showGitPanel: false }));
  }, []);

  // 智能输入建议点击
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  // 快捷命令选择
  const handleQuickCommandSelect = useCallback((command: string) => {
    setInputValue(command);
    setState((prev) => ({ ...prev, showQuickCommands: false }));
  }, []);

  const switchTab = useCallback((tab: TabType) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  // 渲染固定标签栏 - 始终显示所有标签
  const renderTabs = () => {
    const tabs: {
      key: TabType;
      label: string;
      icon: string;
      hasContent: boolean;
    }[] = [
      { key: "chat", label: "对话", icon: "💬", hasContent: true },
      {
        key: "diagram",
        label: "图表",
        icon: "📊",
        hasContent: !!state.currentDiagram,
      },
      {
        key: "test",
        label: "测试",
        icon: "🧪",
        hasContent: !!state.generatedTest,
      },
    ];

    return (
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${state.activeTab === tab.key ? "active" : ""} ${!tab.hasContent && tab.key !== "chat" ? "empty" : ""}`}
            onClick={() => switchTab(tab.key)}
            title={
              !tab.hasContent && tab.key !== "chat"
                ? `暂无${tab.label}内容`
                : tab.label
            }
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.hasContent && tab.key !== "chat" && (
              <span
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  if (tab.key === "diagram") {
                    setState((prev) => ({
                      ...prev,
                      currentDiagram: null,
                      activeTab: "chat",
                    }));
                  } else if (tab.key === "test") {
                    setState((prev) => ({
                      ...prev,
                      generatedTest: null,
                      activeTab: "chat",
                    }));
                  }
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}

        {/* 历史按钮 */}
        <div className="tab-actions">
          <button
            className="tab-action-btn"
            onClick={() =>
              setState((prev) => ({ ...prev, showDiagramHistory: true }))
            }
            title="图表历史"
          >
            📊 历史
          </button>
          <button
            className="tab-action-btn"
            onClick={() =>
              setState((prev) => ({ ...prev, showTestHistory: true }))
            }
            title="测试历史"
          >
            🧪 历史
          </button>
          <button
            className="tab-action-btn search-btn"
            onClick={() => setState((prev) => ({ ...prev, showSearch: true }))}
            title="搜索 (⌘F)"
          >
            🔍
          </button>
        </div>
      </div>
    );
  };

  // 渲染主内容区域
  const renderContent = () => {
    switch (state.activeTab) {
      case "diagram":
        if (state.currentDiagram) {
          return (
            <div className="content-panel">
              <DiagramView
                diagram={state.currentDiagram}
                onUpdate={handleDiagramUpdate}
                onExport={handleDiagramExport}
                onClose={() => switchTab("chat")}
                onAutoFix={handleDiagramAutoFix}
              />
            </div>
          );
        }
        return (
          <div className="content-panel empty-state">
            <div className="empty-message">
              <span className="empty-icon">📊</span>
              <p>暂无图表</p>
              <p className="empty-hint">
                选中代码后右键生成，或使用 <code>/diagram</code> 命令
              </p>
            </div>
          </div>
        );
      case "test":
        if (state.generatedTest) {
          return (
            <div className="content-panel">
              <TestView
                code={state.generatedTest.code}
                path={state.generatedTest.path}
                framework={state.generatedTest.framework}
                onSave={handleTestSave}
                onRun={handleTestRun}
                onClose={() => switchTab("chat")}
                testResult={state.testResult || undefined}
                onAutoFix={handleTestAutoFix}
                onRefine={handleTestRefine}
              />
            </div>
          );
        }
        return (
          <div className="content-panel empty-state">
            <div className="empty-message">
              <span className="empty-icon">🧪</span>
              <p>暂无测试</p>
              <p className="empty-hint">
                选中代码后右键生成，或使用 <code>/gentest</code> 命令
              </p>
            </div>
          </div>
        );
    }

    // 默认显示聊天
    return (
      <main className="messages-container" ref={messagesContainerRef}>
        <MessageList
          messages={state.messages}
          isLoading={state.isLoading}
          onRegenerate={handleRegenerate}
          currentDiagram={state.currentDiagram}
          onViewDiagram={() => switchTab("diagram")}
          messageRefs={messageRefs}
        />
        <div ref={messagesEndRef} />
      </main>
    );
  };

  // 新会话处理
  const handleNewChat = useCallback(() => {
    console.log("Click button and Starting new chat session");
    vscode.postMessage({ type: "newChat" });
    setState((prev) => ({
      ...prev,
      messages: [],
      currentDiagram: null,
      generatedTest: null,
      activeTab: "chat",
    }));
  }, []);

  // 清除当前会话
  const handleClearChat = useCallback(() => {
    console.log("Clearing chat session");
    vscode.postMessage({ type: "clearChat" });
  }, []);

  return (
    <div className={`app layout-${layoutSize}`} ref={appRef}>
      {/* 紧凑的单行顶部栏 */}
      <header className="header header-compact">
        {/* 左侧: 模型选择 */}
        <div className="header-left">
          <ModelSwitcher
            currentProvider={state.modelConfig.provider}
            currentModel={state.modelConfig.model}
            onModelChange={handleModelChange}
          />
        </div>

        {/* 中间: 主要操作 */}
        <div className="header-center">
          <button
            className="header-btn icon-btn"
            onClick={handleNewChat}
            title="新会话"
          >
            ➕
          </button>
          <button
            className="header-btn icon-btn"
            onClick={handleClearChat}
            title="清空对话"
          >
            🗑️
          </button>
          <button
            className="header-btn icon-btn"
            onClick={() => vscode.postMessage({ type: "getConfig" })}
            title="刷新会话"
          >
            🔄
          </button>
          <button
            className="header-btn icon-btn"
            onClick={() =>
              setState((prev) => ({ ...prev, showSessionHistory: true }))
            }
            title="历史记录"
          >
            🕐
          </button>
        </div>

        {/* 右侧: Token统计和设置 */}
        <div className="header-right">
          {/* V16: 语言切换 */}
          <LanguageSwitcher
            currentLanguage={state.currentLanguage}
            onLanguageChange={(lang) => {
              vscode.postMessage({ type: "setLanguage", language: lang });
            }}
          />
          <TokenStats
            messages={state.messages}
            provider={state.modelConfig.provider}
            model={state.modelConfig.model}
          />
          <button
              className="header-btn icon-btn"
              onClick={() => setState((prev) => ({ ...prev, showGitPanel: true }))}
              title="Git 命令面板"
            >
            Git
          </button>
          <button
              className="header-btn icon-btn"
              onClick={() => setState((prev) => ({ ...prev, showSkillPanel: true }))}
              title="Skill 技能管理"
            >
            🎯
          </button>
          <button
            className="header-btn icon-btn"
            onClick={() => setState((prev) => ({ ...prev, showSearch: true }))}
            title="搜索 (Ctrl+F)"
          >
            🔍
          </button>
          <button
            className="header-btn icon-btn"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                showSettings: !prev.showSettings,
              }))
            }
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 固定的标签栏 */}
      {renderTabs()}

      {state.error && (
        <div className="error-banner" onClick={dismissError}>
          <span className="error-icon">⚠️</span>
          <span className="error-text">{state.error}</span>
          <span className="dismiss">×</span>
        </div>
      )}

      {state.showSettings && (
        <SettingsPanel
          config={state.modelConfig}
          onClose={() => setState((prev) => ({ ...prev, showSettings: false }))}
        />
      )}

      {renderContent()}

      {/* 任务日志面板 - 类似终端 */}
      <TaskLogPanel
        logs={state.taskLogs}
        isExpanded={state.showTaskLog}
        onToggle={() =>
          setState((prev) => ({ ...prev, showTaskLog: !prev.showTaskLog }))
        }
        onClear={clearTaskLogs}
      />

      {/* 只在聊天标签显示输入框 */}
      {state.activeTab === "chat" && (
        <footer className="input-container">
          {/* 智能输入提示 */}
          <SmartInputHint
            input={inputValue}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* 快捷命令栏 */}
          {state.showQuickCommands && (
            <QuickCommands onSelect={handleQuickCommandSelect} />
          )}

          {state.suggestions.length > 0 && (
            <div className="suggestions">
              {state.suggestions.map((cmd, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => {
                    setInputValue("/" + cmd.name + " ");
                    setState((prev) => ({ ...prev, suggestions: [] }));
                  }}
                >
                  <span className="suggestion-cmd">/{cmd.name}</span>
                  <span className="suggestion-desc">{cmd.description}</span>
                </div>
              ))}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="attachments-preview">
              {attachments.map((a, i) => (
                <div key={i} className="attachment-item">
                  {a.type === "image" && <img src={a.data} alt={a.name} />}
                  {a.type === "file" && (
                    <div className="file-preview">
                      <span className="file-icon">
                        {getFileIcon(a.mimeType || "", a.name)}
                      </span>
                      <span className="file-name" title={a.name}>
                        {a.name.length > 20
                          ? a.name.slice(0, 17) + "..."
                          : a.name}
                      </span>
                      {a.size && (
                        <span className="file-size">
                          {formatFileSize(a.size)}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    title="移除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <InputBox
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            onCancel={handleCancel}
            onFileUpload={handleFileUpload}
            onVoiceInput={handleVoiceInput}
            isLoading={state.isLoading}
            placeholder="输入消息或 / 查看命令..."
          />
        </footer>
      )}

      {/* Git 命令面板 */}
      <GitCommandPanel
        isOpen={state.showGitPanel}
        onClose={() => setState((prev) => ({ ...prev, showGitPanel: false }))}
        onExecuteCommand={handleGitCommand}
      />

      {/* Skill 技能管理面板 */}
      {state.showSkillPanel && (
        <div className="skill-panel-overlay">
          <SkillManagePanel
            isOpen={state.showSkillPanel}
            onClose={() => setState((prev) => ({ ...prev, showSkillPanel: false }))}
            onSelectSkill={(skillId) => {
              setInputValue(`@skill:${skillId} `);
              setState((prev) => ({ ...prev, showSkillPanel: false }));
            }}
          />
        </div>
      )}

      {/* 搜索栏 */}
      <SearchBar
        isOpen={state.showSearch}
        onClose={() => setState((prev) => ({ ...prev, showSearch: false }))}
        onScrollToMessage={scrollToMessage}
      />

      {/* 图表历史面板 */}
      {state.showDiagramHistory && (
        <HistoryPanel
          type="diagram"
          onClose={() =>
            setState((prev) => ({ ...prev, showDiagramHistory: false }))
          }
          onSelect={(diagram) => {
            setState((prev) => ({
              ...prev,
              currentDiagram: diagram,
              activeTab: "diagram",
              showDiagramHistory: false,
            }));
          }}
        />
      )}

      {/* 测试历史面板 */}
      {state.showTestHistory && (
        <HistoryPanel
          type="test"
          onClose={() =>
            setState((prev) => ({ ...prev, showTestHistory: false }))
          }
          onSelect={(test) => {
            setState((prev) => ({
              ...prev,
              generatedTest: {
                code: test.code,
                path: test.path,
                framework: test.framework,
              },
              activeTab: "test",
              showTestHistory: false,
            }));
          }}
        />
      )}

      {/* 会话历史面板 */}
      {state.showSessionHistory && (
        <SessionHistoryPanel
          onClose={() =>
            setState((prev) => ({ ...prev, showSessionHistory: false }))
          }
          onSelect={(sessionId) => {
            vscode.postMessage({ type: "loadSession", sessionId });
            setState((prev) => ({ ...prev, showSessionHistory: false }));
          }}
        />
      )}

    </div>
  );
}
