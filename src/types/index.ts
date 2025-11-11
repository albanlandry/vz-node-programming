/**
 * Core types and interfaces for the Node-based programming system
 */

// Export UI Definition types
export * from './uiDefinition';

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
  PROMISE: { name: 'promise', description: 'Promise value' },
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
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Custom error class for node execution errors
 */
export class NodeError extends Error {
  constructor(
    message: string,
    public nodeId: NodeId,
    public portId?: PortId,
    public originalError?: Error,
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
 * Lifecycle hooks for node execution
 */
export interface NodeLifecycleHooks {
  /**
   * Called before node execution starts
   * Can be used for resource initialization, validation, or setup
   * @param context - Execution context
   * @returns Promise that resolves when initialization is complete
   */
  onBeforeExecute?: (context: ExecutionContext) => Promise<void> | void;

  /**
   * Called after node execution completes successfully
   * Can be used for cleanup, logging, or post-processing
   * @param context - Execution context
   * @param result - Execution result
   * @returns Promise that resolves when cleanup is complete
   */
  onAfterExecute?: (context: ExecutionContext, result: ExecutionResult) => Promise<void> | void;

  /**
   * Called when node execution fails
   * Can be used for error handling, cleanup, or recovery
   * @param context - Execution context
   * @param error - The error that occurred
   * @returns Promise that resolves when error handling is complete
   */
  onError?: (context: ExecutionContext, error: NodeError) => Promise<void> | void;

  /**
   * Called when node is initialized (constructor)
   * Can be used for resource initialization that happens once
   * @returns Promise that resolves when initialization is complete
   */
  onInitialize?: () => Promise<void> | void;

  /**
   * Called when node is being destroyed/cleaned up
   * Can be used for resource cleanup, closing connections, etc.
   * @returns Promise that resolves when cleanup is complete
   */
  onCleanup?: () => Promise<void> | void;
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
  /** Lifecycle hooks for node execution */
  lifecycleHooks?: NodeLifecycleHooks;
}

/**
 * Event types for the node system
 */
export enum NodeEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  EXECUTION_CANCELLED = 'execution_cancelled',
  EXECUTION_TIMEOUT = 'execution_timeout',
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

/**
 * Interactive node types
 */
export enum InteractiveNodeType {
  USER_INPUT = 'user-input',      // User input request
  IMAGE_DISPLAY = 'image-display', // Image display
  STREAMING = 'streaming',         // Streaming data
  CUSTOM_UI = 'custom-ui',         // Custom UI component
}

/**
 * User input request
 */
export interface UserInputRequest {
  type: 'form' | 'prompt' | 'confirm';
  formSchema?: FormSchema;
  prompt?: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
  content?: unknown; // Content to display (for confirm type or display purposes)
}

/**
 * Form schema
 */
export interface FormSchema {
  fields: FormField[];
  title?: string;
  description?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[]; // for select
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message?: string;
  validator?: (value: unknown) => boolean | string;
}

/**
 * Image data
 */
export interface ImageData {
  url?: string;
  base64?: string;
  blob?: Blob;
  format: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Interactive node execution context extension
 */
export interface InteractiveExecutionContext extends ExecutionContext {
  /**
   * Request user input
   * When a node calls this method, execution is paused and UI is displayed
   */
  requestUserInput(request: UserInputRequest): Promise<unknown>;
  
  /**
   * Request image display
   */
  displayImage(imageData: ImageData): void;
  
  /**
   * Update streaming data
   */
  updateStreamingData(data: unknown): void;
  
  /**
   * Request custom UI component rendering
   */
  renderCustomUI(componentType: string, props: Record<string, unknown>): void;
}

/**
 * Interactive node interface
 */
export interface IInteractiveNode extends INode {
  /**
   * Whether this node is interactive
   */
  readonly isInteractive: boolean;
  
  /**
   * Interactive node type
   */
  readonly interactiveType?: InteractiveNodeType;
  
  /**
   * Execute with interactive context
   * If this method exists, it will be called instead of execute() for interactive nodes
   */
  executeInteractive?(context: InteractiveExecutionContext): Promise<ExecutionResult>;
}

/**
 * Event types for interactive node execution
 */
export enum InteractiveNodeEventType {
  USER_INPUT_REQUESTED = 'interactive:user-input-requested',
  USER_INPUT_RECEIVED = 'interactive:user-input-received',
  IMAGE_DISPLAY_REQUESTED = 'interactive:image-display-requested',
  STREAMING_DATA_UPDATE = 'interactive:streaming-data-update',
  CUSTOM_UI_RENDER = 'interactive:custom-ui-render',
  NODE_PAUSED = 'interactive:node-paused',
  NODE_RESUMED = 'interactive:node-resumed',
}
