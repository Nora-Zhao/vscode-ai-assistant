/**
 * 新功能服务
 * 整合语言切换等便捷入口
 * 
 * 注：已移除批处理功能（业务不需要）
 */

import * as vscode from 'vscode';
import { 
  I18nManager, 
  i18n, 
  t, 
  tf,
  SupportedLanguage, 
  SUPPORTED_LANGUAGES 
} from '../i18n';

/**
 * 新功能服务类
 * 提供统一的API来访问新功能
 */
export class NewFeaturesService {
  private static instance: NewFeaturesService | null = null;
  
  private context: vscode.ExtensionContext;
  
  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // 初始化i18n
    i18n.initialize(context);
  }

  static getInstance(context: vscode.ExtensionContext): NewFeaturesService {
    if (!NewFeaturesService.instance) {
      NewFeaturesService.instance = new NewFeaturesService(context);
    }
    return NewFeaturesService.instance;
  }

  // ============ 语言配置功能 ============

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return i18n.getCurrentLanguage();
  }

  /**
   * 设置语言
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    await i18n.setLanguage(language);
    vscode.window.showInformationMessage(
      language === 'zh-CN' 
        ? '✅ 语言已切换为中文' 
        : '✅ Language switched to English'
    );
  }

  /**
   * 显示语言选择器
   */
  async showLanguageSelector(): Promise<void> {
    const languages = SUPPORTED_LANGUAGES;
    const currentLanguage = i18n.getCurrentLanguage();
    
    const items = languages.map(lang => ({
      label: `${lang.code === currentLanguage ? '$(check) ' : ''}${lang.nativeName}`,
      description: lang.name,
      code: lang.code,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: t('chat', 'selectProvider'),
    });

    if (selected) {
      await this.setLanguage(selected.code);
    }
  }

  /**
   * 获取 AI 系统提示（含语言指示）
   */
  getAISystemPrompt(type: 'general' | 'code' | 'diagram' | 'test' = 'general'): string {
    return i18n.getFullAIPrompt(type);
  }

  /**
   * 获取翻译文本
   */
  translate<K extends keyof import('../i18n/I18nManager').Translations>(
    category: K,
    key: keyof import('../i18n/I18nManager').Translations[K]
  ): string {
    return t(category, key);
  }
}

/**
 * 注册新功能命令
 */
export function registerNewFeaturesCommands(
  context: vscode.ExtensionContext,
  service: NewFeaturesService
): void {
  // 语言切换命令
  context.subscriptions.push(
    vscode.commands.registerCommand('aiAssistant.setLanguage', () => {
      service.showLanguageSelector();
    })
  );
}

// 导出单例获取函数
export function getNewFeaturesService(context: vscode.ExtensionContext): NewFeaturesService {
  return NewFeaturesService.getInstance(context);
}
