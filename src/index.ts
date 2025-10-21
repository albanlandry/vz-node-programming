/**
 * VZ Programming - Node-based Programming System
 * Main entry point and exports
 */

// Core types and interfaces
export * from './types';

// Core classes
export { BaseNode } from './core/BaseNode';
export { NodeExecutor } from './core/NodeExecutor';

// Functional programming nodes
export { MapNode, FilterNode, ReduceNode, ComposeNode } from './nodes/functional/FunctionalNodes';

// Object-oriented programming nodes
export { CalculatorNode, CounterNode, BankAccountNode } from './nodes/oop/ObjectOrientedNodes';

// Async programming nodes
export { DelayNode, HttpRequestNode, PromiseAllNode, PromiseRaceNode, RetryNode } from './nodes/async/AsyncNodes';

// Utility nodes
export { ConditionalNode, MathNode, StringNode, TransformNode, LoggerNode } from './nodes/utility/UtilityNodes';

// Re-export commonly used types for convenience
export type { 
  INode, 
  NodeId, 
  PortId, 
  ExecutionId, 
  ExecutionContext, 
  ExecutionResult, 
  Connection, 
  Port, 
  DataType,
  NodeError,
  NodeEvent,
  NodeEventType
} from './types';