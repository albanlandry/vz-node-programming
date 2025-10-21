/**
 * VZ Programming - Node-based Programming System
 * Main entry point and exports
 */

// Core types and interfaces
export * from './types';

// Core classes
export { BaseNode } from './core/BaseNode';
export { NodeExecutor } from './core/NodeExecutor';

// Registry and Discovery
export { NodeRegistry, RegisterNode, registerNode, createNode } from './registry/NodeRegistry';
export type { NodeMetadata, NodeFactory } from './registry/NodeRegistry';
export { registerBuiltInNodes } from './registry/registerBuiltInNodes';

// Serialization
export { GraphSerializer } from './serialization/GraphSerializer';
export type { SerializedNode, SerializedConnection, GraphDefinition } from './serialization/GraphSerializer';

// Error Handling
export {
  RetryPolicy,
  RetryPolicies,
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitState,
  DeadLetterQueue,
  ErrorHandlingNode,
  ErrorBoundaryNode,
  FallbackNode
} from './error-handling';
export type {
  RetryConfig,
  CircuitBreakerConfig,
  DeadLetterEntry,
  DLQConfig,
  ErrorHandlingConfig
} from './error-handling';

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