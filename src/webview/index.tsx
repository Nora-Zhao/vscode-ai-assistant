import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.css';
import './styles/new-features.css';
import './styles/new-features-v2.css';

// Add error boundary for debugging
window.onerror = (message, source, lineno, colno, error) => {
  // Suppress ServiceWorker errors - not supported in VS Code webviews
  const messageStr = String(message);
  if (messageStr.includes('ServiceWorker') || messageStr.includes('service worker')) {
    console.warn('ServiceWorker not supported in VS Code webview (ignored):', message);
    return true; // Prevent error from propagating
  }
  
  console.error('Global error:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="padding: 20px; color: var(--vscode-errorForeground, red);">
      <h3>Error loading webview</h3>
      <pre style="white-space: pre-wrap; word-break: break-word;">${message}\n${source}:${lineno}:${colno}\n${error?.stack || ''}</pre>
    </div>`;
  }
  return false;
};

// Handle unhandled promise rejections (including ServiceWorker errors)
window.onunhandledrejection = (event) => {
  const reason = String(event.reason);
  if (reason.includes('ServiceWorker') || reason.includes('service worker') || reason.includes('InvalidStateError')) {
    console.warn('ServiceWorker promise rejection (ignored):', event.reason);
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
};

try {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  } else {
    console.error('Root container not found');
  }
} catch (e) {
  console.error('Failed to render React app:', e);
  const container = document.getElementById('root');
  if (container) {
    container.innerHTML = `<div style="padding: 20px; color: red;">
      <h3>Failed to initialize</h3>
      <pre>${e instanceof Error ? e.message + '\n' + e.stack : String(e)}</pre>
    </div>`;
  }
}
