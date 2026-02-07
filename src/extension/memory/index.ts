/**
 * 记忆管理系统模块 (精简版)
 * 
 * 两层记忆架构：短期记忆 + 长期记忆
 * 支持定期清洗和压缩
 */

export { MemoryManager } from './MemoryManager';

export type {
  MemoryEntry,
  MemoryRetrievalResult,
  MemoryStats,
} from './MemoryManager';
