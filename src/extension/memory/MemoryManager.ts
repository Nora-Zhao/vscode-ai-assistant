/**
 * 记忆管理系统 (v2 优化版)
 * 
 * 两层记忆：
 * - 短期记忆 (Short-term): 当前会话 + 最近对话的关键信息，自动过期
 * - 长期记忆 (Long-term): 经过筛选和压缩后持久保存的用户偏好和项目知识
 * 
 * v2 优化点：
 * - 关键词缓存，避免重复计算
 * - 防抖保存，减少IO
 * - 优化相似度算法（Jaccard系数 + 内容哈希）
 * - 更精确的晋升和淘汰策略
 */

import * as vscode from 'vscode';
import { Message, estimateTokens } from '../../types/shared';

// ============================================
// 类型定义
// ============================================

export interface MemoryEntry {
  id: string;
  type: 'preference' | 'project' | 'fact' | 'summary';
  content: string;
  keywords: string[];
  importance: number;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  expiresAt?: number;
}

export interface MemoryStats {
  shortTermCount: number;
  longTermCount: number;
  totalTokens: number;
}

export interface MemoryRetrievalResult {
  memories: MemoryEntry[];
  relevanceScore: number;
  tokenCount: number;
}

// ============================================
// 常量
// ============================================

const STORAGE_KEY = 'aiAssistant.memory.v2';
const SHORT_TERM_TTL = 2 * 60 * 60 * 1000;      // 2小时
const SHORT_TERM_MAX = 40;
const LONG_TERM_MAX = 100;
const PROMOTE_ACCESS = 3;
const PROMOTE_IMPORTANCE = 0.7;
const COMPRESS_INTERVAL = 30 * 60 * 1000;
const CLEANUP_INTERVAL = 10 * 60 * 1000;
const SAVE_DEBOUNCE = 3000;                       // 3秒防抖

// 停用词集合
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '这', '那', '你', '它', '也', '很', '到', '说', '要', '会',
  'the', 'a', 'an', 'is', 'are', 'was', 'be', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'this', 'that', 'it', 'he', 'she', 'we',
  'they', 'i', 'me', 'my', 'do', 'does', 'did', 'has', 'have', 'had',
  'can', 'will', 'would', 'should', 'could', 'may',
]);

// ============================================
// MemoryManager
// ============================================

export class MemoryManager {
  private static instance: MemoryManager | null = null;

  private context: vscode.ExtensionContext;
  private shortTerm: MemoryEntry[] = [];
  private longTerm: MemoryEntry[] = [];
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private compressTimer?: ReturnType<typeof setInterval>;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private dirty = false;

  // 关键词缓存
  private keywordCache = new Map<string, string[]>();
  private readonly CACHE_MAX = 200;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.load();
    this.startTimers();
  }

  static getInstance(context: vscode.ExtensionContext): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager(context);
    }
    return MemoryManager.instance;
  }

  // ============================================
  // 写入
  // ============================================

  addShortTerm(entry: Pick<MemoryEntry, 'type' | 'content' | 'keywords' | 'importance'>): void {
    const existing = this.shortTerm.find(e =>
      e.type === entry.type && this.similarity(e.content, entry.content) > 0.8
    );
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
      existing.importance = Math.max(existing.importance, entry.importance);
      this.markDirty();
      return;
    }

    this.shortTerm.push({
      id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...entry,
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      expiresAt: Date.now() + SHORT_TERM_TTL,
    });

    if (this.shortTerm.length > SHORT_TERM_MAX) {
      this.evictShortTerm();
    }
    this.markDirty();
  }

  addLongTerm(entry: Pick<MemoryEntry, 'type' | 'content' | 'keywords' | 'importance'>): void {
    const existing = this.longTerm.find(e =>
      e.type === entry.type && this.similarity(e.content, entry.content) > 0.8
    );
    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
      existing.importance = Math.max(existing.importance, entry.importance);
      this.markDirty();
      return;
    }

    this.longTerm.push({
      id: `lt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...entry,
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
    });

    if (this.longTerm.length > LONG_TERM_MAX) {
      this.compressLongTerm();
    }
    this.markDirty();
  }

  // ============================================
  // 从消息中提取记忆
  // ============================================

  extractFromMessage(message: Message): void {
    if (message.role !== 'user') return;
    const text = message.content;
    if (!text || text.length < 5) return;

    // 偏好提取
    const prefPatterns = [
      /我(喜欢|偏好|习惯|想要|需要|通常|一般)(.{4,60})/g,
      /请(使用|采用|遵循|用)(.{4,40})/g,
    ];
    for (const p of prefPatterns) {
      let m;
      while ((m = p.exec(text)) !== null) {
        this.addShortTerm({
          type: 'preference',
          content: m[0].trim(),
          keywords: this.extractKeywords(m[0]),
          importance: 0.65,
        });
      }
    }

    // 技术栈提取
    const techPattern = /(?:使用|采用|基于)\s*(React|Vue|Angular|Next\.?js|TypeScript|JavaScript|Python|Go|Rust|Java|Spring|Django|Flask|Express)/gi;
    let m;
    while ((m = techPattern.exec(text)) !== null) {
      this.addShortTerm({
        type: 'project',
        content: `项目技术: ${m[0].trim()}`,
        keywords: this.extractKeywords(m[0]),
        importance: 0.75,
      });
    }
  }

  compressSession(sessionId: string, messages: Message[]): void {
    if (messages.length < 6) return;

    const topics = new Set<string>();
    messages
      .filter(m => m.role === 'user')
      .forEach(m => this.extractKeywords(m.content).slice(0, 3).forEach(k => topics.add(k)));

    const topicStr = [...topics].slice(0, 8).join(', ');
    this.addLongTerm({
      type: 'summary',
      content: `会话(${messages.length}条)讨论了: ${topicStr}`,
      keywords: [...topics].slice(0, 10),
      importance: 0.5,
    });
  }

  // ============================================
  // 检索
  // ============================================

  retrieve(query: string, limit: number = 5): MemoryRetrievalResult {
    const qKeywords = this.extractKeywords(query);
    if (qKeywords.length === 0) {
      return { memories: [], relevanceScore: 0, tokenCount: 0 };
    }

    const scored: Array<MemoryEntry & { score: number }> = [];
    const allEntries = [...this.shortTerm, ...this.longTerm];

    for (const entry of allEntries) {
      const score = this.relevanceScore(qKeywords, entry);
      if (score > 0.1) {
        scored.push({ ...entry, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    // 更新访问计数
    for (const item of top) {
      const original = allEntries.find(e => e.id === item.id);
      if (original) {
        original.accessCount++;
        original.lastAccessed = Date.now();
      }
    }

    if (top.length > 0) this.markDirty();

    return {
      memories: top,
      relevanceScore: top.length > 0 ? top[0].score : 0,
      tokenCount: top.reduce((s, e) => s + estimateTokens(e.content), 0),
    };
  }

  buildContextString(query: string, maxTokens: number = 800): string {
    const result = this.retrieve(query, 6);
    if (result.memories.length === 0) return '';

    const typeLabels: Record<string, string> = {
      preference: '偏好', project: '项目', summary: '历史', fact: '信息',
    };

    let context = '\n\n=== 相关记忆 ===\n';
    let tokens = 0;

    for (const mem of result.memories) {
      const entryTokens = estimateTokens(mem.content);
      if (tokens + entryTokens > maxTokens) break;
      context += `- [${typeLabels[mem.type] || '信息'}] ${mem.content}\n`;
      tokens += entryTokens;
    }

    context += '请在回复时适当考虑上述信息。\n';
    return context;
  }

  // ============================================
  // 清洗 & 压缩
  // ============================================

  cleanup(): void {
    const now = Date.now();
    const toPromote: MemoryEntry[] = [];
    const kept: MemoryEntry[] = [];

    for (const entry of this.shortTerm) {
      const expired = entry.expiresAt && entry.expiresAt < now;

      if (entry.accessCount >= PROMOTE_ACCESS || entry.importance >= PROMOTE_IMPORTANCE) {
        toPromote.push(entry);
        continue;
      }

      if (!expired) {
        kept.push(entry);
      }
    }

    const changed = kept.length !== this.shortTerm.length || toPromote.length > 0;
    this.shortTerm = kept;

    for (const entry of toPromote) {
      this.addLongTerm({
        type: entry.type,
        content: entry.content,
        keywords: entry.keywords,
        importance: Math.min(entry.importance + 0.1, 1),
      });
    }

    if (changed) this.markDirty();
  }

  compressLongTerm(): void {
    if (this.longTerm.length <= LONG_TERM_MAX * 0.8) return;

    const merged: MemoryEntry[] = [];
    const used = new Set<string>();

    for (let i = 0; i < this.longTerm.length; i++) {
      if (used.has(this.longTerm[i].id)) continue;

      const current = { ...this.longTerm[i] };

      for (let j = i + 1; j < this.longTerm.length; j++) {
        if (used.has(this.longTerm[j].id)) continue;

        if (this.similarity(current.content, this.longTerm[j].content) > 0.6) {
          used.add(this.longTerm[j].id);
          current.accessCount += this.longTerm[j].accessCount;
          current.importance = Math.max(current.importance, this.longTerm[j].importance);
          current.lastAccessed = Math.max(current.lastAccessed, this.longTerm[j].lastAccessed);
          const kw = new Set([...current.keywords, ...this.longTerm[j].keywords]);
          current.keywords = [...kw].slice(0, 15);
        }
      }

      merged.push(current);
    }

    if (merged.length > LONG_TERM_MAX) {
      merged.sort((a, b) => {
        const scoreA = a.importance * 0.5 + Math.min(a.accessCount * 0.1, 0.3) + (a.type === 'preference' ? 0.2 : 0);
        const scoreB = b.importance * 0.5 + Math.min(b.accessCount * 0.1, 0.3) + (b.type === 'preference' ? 0.2 : 0);
        return scoreB - scoreA;
      });
      this.longTerm = merged.slice(0, LONG_TERM_MAX);
    } else {
      this.longTerm = merged;
    }

    this.markDirty();
  }

  private evictShortTerm(): void {
    this.shortTerm.sort((a, b) => {
      const now = Date.now();
      const scoreA = a.importance * 0.6 + Math.min(a.accessCount * 0.1, 0.2) + (a.expiresAt ? Math.max(0, (a.expiresAt - now) / SHORT_TERM_TTL * 0.2) : 0);
      const scoreB = b.importance * 0.6 + Math.min(b.accessCount * 0.1, 0.2) + (b.expiresAt ? Math.max(0, (b.expiresAt - now) / SHORT_TERM_TTL * 0.2) : 0);
      return scoreB - scoreA;
    });
    this.shortTerm = this.shortTerm.slice(0, SHORT_TERM_MAX);
  }

  // ============================================
  // 统计 & 管理
  // ============================================

  getStats(): MemoryStats {
    const allEntries = [...this.shortTerm, ...this.longTerm];
    return {
      shortTermCount: this.shortTerm.length,
      longTermCount: this.longTerm.length,
      totalTokens: allEntries.reduce((s, e) => s + estimateTokens(e.content), 0),
    };
  }

  clearAll(): void {
    this.shortTerm = [];
    this.longTerm = [];
    this.keywordCache.clear();
    this.save();
  }

  // ============================================
  // 持久化（带防抖）
  // ============================================

  private markDirty(): void {
    this.dirty = true;
    // 防抖保存
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      if (this.dirty) this.save();
    }, SAVE_DEBOUNCE);
  }

  private save(): void {
    this.context.globalState.update(STORAGE_KEY, {
      shortTerm: this.shortTerm,
      longTerm: this.longTerm,
      savedAt: Date.now(),
    });
    this.dirty = false;
  }

  private load(): void {
    const data = this.context.globalState.get<any>(STORAGE_KEY);
    if (data) {
      this.shortTerm = data.shortTerm || [];
      this.longTerm = data.longTerm || [];
    }
    this.cleanup();
  }

  private startTimers(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);

    this.compressTimer = setInterval(() => {
      this.compressLongTerm();
    }, COMPRESS_INTERVAL);
  }

  dispose(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.compressTimer) clearInterval(this.compressTimer);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (this.dirty) this.save();
  }

  // ============================================
  // 工具方法（带缓存）
  // ============================================

  extractKeywords(text: string): string[] {
    // 缓存检查
    const cacheKey = text.substring(0, 100);
    const cached = this.keywordCache.get(cacheKey);
    if (cached) return cached;

    const words = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    const result = [...new Set(words)].slice(0, 15);

    // 缓存管理
    if (this.keywordCache.size > this.CACHE_MAX) {
      const firstKey = this.keywordCache.keys().next().value;
      if (firstKey !== undefined) this.keywordCache.delete(firstKey);
    }
    this.keywordCache.set(cacheKey, result);

    return result;
  }

  private relevanceScore(queryKeywords: string[], entry: MemoryEntry): number {
    if (queryKeywords.length === 0 || entry.keywords.length === 0) return 0;

    let matches = 0;
    const contentLower = entry.content.toLowerCase();

    for (const qk of queryKeywords) {
      if (entry.keywords.includes(qk) || contentLower.includes(qk)) {
        matches++;
      }
    }

    const keywordScore = matches / queryKeywords.length;
    const importanceBonus = entry.importance * 0.15;
    const accessBonus = Math.min(entry.accessCount * 0.03, 0.15);
    const recencyBonus = entry.lastAccessed > Date.now() - 3600000 ? 0.1 : 0;

    return keywordScore + importanceBonus + accessBonus + recencyBonus;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(this.extractKeywords(a));
    const wordsB = new Set(this.extractKeywords(b));
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    return intersection / (wordsA.size + wordsB.size - intersection);
  }
}

export { MemoryManager as default };
