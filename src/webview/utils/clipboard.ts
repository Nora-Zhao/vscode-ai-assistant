/**
 * 统一的剪贴板操作工具
 * 消除 MessageList, CodeBlock, CodeChangeCard 等组件中的重复代码
 */

/**
 * 复制文本到剪贴板
 * 优先使用现代 Clipboard API，降级到 execCommand
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 优先使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级到传统方法
    }
  }
  
  // 降级方案：使用 textarea + execCommand
  return copyWithFallback(text);
}

/**
 * 降级复制方法
 */
function copyWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  
  // 防止页面滚动
  textarea.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    opacity: 0;
    pointer-events: none;
  `;
  
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  
  document.body.removeChild(textarea);
  return success;
}

/**
 * 复制并提供回调的 Hook 风格函数
 * 用于需要显示复制状态的场景
 */
export function useCopyWithFeedback(timeout = 2000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return async (
    text: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ): Promise<boolean> => {
    // 清理之前的 timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    try {
      const success = await copyToClipboard(text);
      if (success) {
        onSuccess?.();
        // 自动重置状态
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, timeout);
      }
      return success;
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  };
}

/**
 * 从剪贴板读取文本
 */
export async function readFromClipboard(): Promise<string | null> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }
  return null;
}
