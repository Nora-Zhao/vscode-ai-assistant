import { useReducer, useCallback, Dispatch } from 'react';
import { Message, ModelConfig, Diagram, SlashCommand, Attachment } from '../../types/shared';

// 标签类型
export type TabType = 'chat' | 'diagram' | 'test';

// 应用状态
export interface AppState {
  // 核心状态
  messages: Message[];
  isLoading: boolean;
  modelConfig: ModelConfig;
  error: string | null;
  
  // UI 面板状态
  showSettings: boolean;
  showDiagramHistory: boolean;
  showTestHistory: boolean;
  showSessionHistory: boolean;
  showSearch: boolean;
  showGitPanel: boolean;
  showQuickCommands: boolean;
  showTaskLog: boolean;
  
  // 功能状态
  activeTab: TabType;
  currentDiagram: Diagram | null;
  generatedTest: { code: string; path: string; framework: string } | null;
  testResult: { success: boolean; output: string; errors?: string[] } | null;
  suggestions: SlashCommand[];
  taskLogs: any[];
  
  // 配置状态
  currentLanguage: 'zh-CN' | 'en-US';
}

// Action 类型
export type AppAction =
  // 消息相关
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; messageId: string; content: string }
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  | { type: 'CLEAR_MESSAGES' }
  
  // 加载状态
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  
  // 配置
  | { type: 'SET_MODEL_CONFIG'; config: ModelConfig }
  | { type: 'SET_LANGUAGE'; language: 'zh-CN' | 'en-US' }
  
  // 面板切换
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'TOGGLE_DIAGRAM_HISTORY' }
  | { type: 'TOGGLE_TEST_HISTORY' }
  | { type: 'TOGGLE_SESSION_HISTORY' }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'TOGGLE_GIT_PANEL' }
  | { type: 'TOGGLE_QUICK_COMMANDS' }
  | { type: 'TOGGLE_TASK_LOG' }
  | { type: 'CLOSE_ALL_PANELS' }
  
  // 标签切换
  | { type: 'SET_ACTIVE_TAB'; tab: TabType }
  
  // 图表
  | { type: 'SET_DIAGRAM'; diagram: Diagram | null }
  
  // 测试
  | { type: 'SET_TEST'; test: { code: string; path: string; framework: string } | null }
  | { type: 'SET_TEST_RESULT'; result: { success: boolean; output: string; errors?: string[] } | null }
  
  // 建议
  | { type: 'SET_SUGGESTIONS'; suggestions: SlashCommand[] }
  
  // 任务日志
  | { type: 'ADD_TASK_LOG'; log: any }
  | { type: 'CLEAR_TASK_LOGS' }
  
  // 批量更新
  | { type: 'BATCH_UPDATE'; updates: Partial<AppState> }
  
  // 重置
  | { type: 'RESET_CHAT' };

// 初始状态
export const initialState: AppState = {
  messages: [],
  isLoading: false,
  modelConfig: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4096,
  },
  error: null,
  showSettings: false,
  showDiagramHistory: false,
  showTestHistory: false,
  showSessionHistory: false,
  showSearch: false,
  showGitPanel: false,
  showQuickCommands: false,
  showTaskLog: false,
  activeTab: 'chat',
  currentDiagram: null,
  generatedTest: null,
  testResult: null,
  suggestions: [],
  taskLogs: [],
  currentLanguage: 'zh-CN',
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // 消息相关
    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.messageId ? { ...m, content: action.content } : m
        ),
      };
    
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(m => m.id !== action.messageId),
      };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    
    // 加载状态
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    // 配置
    case 'SET_MODEL_CONFIG':
      return { ...state, modelConfig: action.config };
    
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.language };
    
    // 面板切换
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    
    case 'TOGGLE_DIAGRAM_HISTORY':
      return { ...state, showDiagramHistory: !state.showDiagramHistory };
    
    case 'TOGGLE_TEST_HISTORY':
      return { ...state, showTestHistory: !state.showTestHistory };
    
    case 'TOGGLE_SESSION_HISTORY':
      return { ...state, showSessionHistory: !state.showSessionHistory };
    
    case 'TOGGLE_SEARCH':
      return { ...state, showSearch: !state.showSearch };
    
    case 'TOGGLE_GIT_PANEL':
      return { ...state, showGitPanel: !state.showGitPanel };
    
    case 'TOGGLE_QUICK_COMMANDS':
      return { ...state, showQuickCommands: !state.showQuickCommands };
    
    case 'TOGGLE_TASK_LOG':
      return { ...state, showTaskLog: !state.showTaskLog };
    
    case 'CLOSE_ALL_PANELS':
      return {
        ...state,
        showSettings: false,
        showDiagramHistory: false,
        showTestHistory: false,
        showSessionHistory: false,
        showSearch: false,
        showGitPanel: false,
        showQuickCommands: false,
      };
    
    // 标签切换
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    
    // 图表
    case 'SET_DIAGRAM':
      return { ...state, currentDiagram: action.diagram };
    
    // 测试
    case 'SET_TEST':
      return { ...state, generatedTest: action.test };
    
    case 'SET_TEST_RESULT':
      return { ...state, testResult: action.result };
    
    // 建议
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.suggestions };
    
    // 任务日志
    case 'ADD_TASK_LOG':
      return { ...state, taskLogs: [...state.taskLogs, action.log] };
    
    case 'CLEAR_TASK_LOGS':
      return { ...state, taskLogs: [] };
    
    // 批量更新
    case 'BATCH_UPDATE':
      return { ...state, ...action.updates };
    
    // 重置聊天
    case 'RESET_CHAT':
      return {
        ...state,
        messages: [],
        currentDiagram: null,
        generatedTest: null,
        activeTab: 'chat',
      };
    
    default:
      return state;
  }
}

// 自定义 Hook
export function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 便捷方法
  const actions = {
    setMessages: useCallback((messages: Message[]) => {
      dispatch({ type: 'SET_MESSAGES', messages });
    }, []),

    addMessage: useCallback((message: Message) => {
      dispatch({ type: 'ADD_MESSAGE', message });
    }, []),

    updateMessage: useCallback((messageId: string, content: string) => {
      dispatch({ type: 'UPDATE_MESSAGE', messageId, content });
    }, []),

    setLoading: useCallback((isLoading: boolean) => {
      dispatch({ type: 'SET_LOADING', isLoading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', error });
    }, []),

    togglePanel: useCallback((panel: 'settings' | 'search' | 'sessionHistory' | 'gitPanel' | 'taskLog') => {
      const actionMap = {
        settings: 'TOGGLE_SETTINGS',
        search: 'TOGGLE_SEARCH',
        sessionHistory: 'TOGGLE_SESSION_HISTORY',
        gitPanel: 'TOGGLE_GIT_PANEL',
        taskLog: 'TOGGLE_TASK_LOG',
      } as const;
      dispatch({ type: actionMap[panel] });
    }, []),

    setActiveTab: useCallback((tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', tab });
    }, []),

    setDiagram: useCallback((diagram: Diagram | null) => {
      dispatch({ type: 'SET_DIAGRAM', diagram });
    }, []),

    resetChat: useCallback(() => {
      dispatch({ type: 'RESET_CHAT' });
    }, []),

    clearTaskLogs: useCallback(() => {
      dispatch({ type: 'CLEAR_TASK_LOGS' });
    }, []),

    batchUpdate: useCallback((updates: Partial<AppState>) => {
      dispatch({ type: 'BATCH_UPDATE', updates });
    }, []),
  };

  return { state, dispatch, actions };
}

export type { Dispatch };
