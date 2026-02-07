/**
 * MCP (Model Context Protocol) 模块
 * 
 * 提供工具注册、执行和Agent自动化能力
 */

export * from './types';
export { MCPRegistry } from './MCPRegistry';
export { MCPExecutor, ExecutionHistory } from './MCPExecutor';
export { MCPAgent, AgentStatus, AgentStep } from './MCPAgent';
export { 
  AutonomousAgent, 
  AutonomousAgentStatus, 
  AutonomousAgentRequest, 
  AutonomousAgentResult,
  IterationRecord,
  ThoughtStep,
  ToolCall,
  ExecutionResult,
} from './AutonomousAgent';
export { MCPParser, MCPParseResult, MCPParseResultType } from './MCPParser';
export { MCPPanelProvider } from './MCPPanelProvider';
export { getBuiltinTools, builtinFunctions } from './builtins';
export { getAdditionalBuiltinTools, additionalBuiltinFunctions } from './additionalBuiltins';
