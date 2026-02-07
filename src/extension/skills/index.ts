// Core interfaces
export * from './interfaces';

// Base classes
export { BaseSkill } from './BaseSkill';

// Language adapters
export * from './adapters';

// Skill implementations
export * from './implementations';

// Skill Package System (新增)
// 注意：package/types.ts 中的 SkillResult 与 interfaces.ts 中的重名
// 使用显式导出避免冲突
export {
  SkillManifest,
  SkillRuntime,
  SkillConfigOption,
  SkillPermission,
  SkillEntryPoints,
  SkillStatus,
  InstalledSkill,
  SkillSource,
  SkillMarkdown,
  SkillContext,
  SkillMCPBridge,
  SkillToolResult,
  SkillResult as PackageSkillResult,  // 重命名以避免冲突
  SkillInstallOptions,
} from './package/types';

export { SkillLoader } from './package/SkillLoader';
export { SkillExecutor } from './package/SkillExecutor';
export { SkillManager } from './package/SkillManager';
export { SkillMCPBridgeFactory, SkillMCPBridgeImpl } from './package/SkillMCPBridge';
