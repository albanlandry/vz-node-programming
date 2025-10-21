/**
 * Core types and interfaces for the Node-based programming system
 */

export type NodeId = string;
export type PortId = string;
export type ExecutionId = string;

/**
 * Represents a data type that can flow through the node system
 */
export interface DataType {
  name: string;
  description?: string;
  validator?: (value: any) => boolean;
}

/**
 * Standard data types
 */
export const DataTypes = {
  ANY: { name: 'any', description: 'Any type' },
  STRING: { name: 'string', description: 'String value' },
  NUMBER: { name: 'number', description: 'Numeric value' },
  BOOLEAN: { name: 'boolean', description: 'Boolean value' },
  OBJECT: { name: 'object', description: 'Object value' },
  ARRAY: { name: 'array', description: 'Array value' },
  FUNCTION: { name: 'function', description: 'Function value' },
  PROMISE: { name: 'promise', description: 'Promise value' }
} as const;

/**
 * Represents a port (input/output) on a node
 */
export interface Port {
  id: PortId;
  name: string;
  dataType: DataType;
  required?: boolean;
  description?: string;
}

/**
 * Represents a connection between two ports
 */
export interface Connection {
  id: string;
  fromNode: NodeId;
  fromPort: PortId;
  toNode: NodeId;
  toPort: PortId;
}

/**
 * Execution context passed to nodes during execution
 */
export interface ExecutionContext {
  executionId: ExecutionId;
  inputs: Map<PortId, any>;
  outputs: Map<PortId, any>;
  metadata: Map<string, any>;
  errorHandler?: (error: NodeError) => void;
}

/**
 * Custom error class for node execution errors
 */
export class NodeError extends Error {
  constructor(
    message: string,
    public nodeId: NodeId,
    public portId?: PortId,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NodeError';
  }
}

/**
 * Result of node execution
 */
export interface ExecutionResult {
  success: boolean;
  outputs?: Map<PortId, any>;
  error?: NodeError;
  executionTime?: number;
}

/**
 * Base interface that all nodes must implement
 */
export interface INode {
  readonly id: NodeId;
  readonly name: string;
  readonly description?: string;
  readonly inputs: Port[];
  readonly outputs: Port[];
  
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  validate(): boolean;
}

/**
 * Configuration for creating a new node
 */
export interface NodeConfig {
  id?: NodeId;
  name: string;
  description?: string;
  inputs?: Port[];
  outputs?: Port[];
}

/**
 * Event types for the node system
 */
export enum NodeEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  NODE_ADDED = 'node_added',
  NODE_REMOVED = 'node_removed',
  CONNECTION_ADDED = 'connection_added',
  CONNECTION_REMOVED = 'connection_removed'
}

/**
 * Event emitted by the node system
 */
export interface NodeEvent {
  type: NodeEventType;
  timestamp: Date;
  data: any;
}