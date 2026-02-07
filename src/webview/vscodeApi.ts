// VS Code API singleton
// This module acquires the VS Code API once and exports it for use throughout the app

interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

let vscodeApi: VSCodeAPI | null = null;

export function getVSCodeAPI(): VSCodeAPI {
  if (vscodeApi) {
    return vscodeApi;
  }

  try {
    // @ts-ignore - acquireVsCodeApi is provided by VS Code webview
    if (typeof acquireVsCodeApi === 'function') {
      // @ts-ignore
      vscodeApi = acquireVsCodeApi();
      return vscodeApi!;
    }
  } catch (e) {
    console.error('Failed to acquire VS Code API:', e);
  }
  
  // Return a mock for development/testing outside VS Code
  const mockApi: VSCodeAPI = {
    postMessage: (msg: any) => console.log('[Mock VS Code] postMessage:', msg),
    getState: () => {
      console.log('[Mock VS Code] getState');
      return null;
    },
    setState: (state: any) => console.log('[Mock VS Code] setState:', state),
  };
  
  vscodeApi = mockApi;
  return mockApi;
}

// Export a pre-acquired instance for convenience
export const vscode = getVSCodeAPI();
