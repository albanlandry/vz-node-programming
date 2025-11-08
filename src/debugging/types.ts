/**
 * Types and interfaces for the Enhanced Debugging System
 */

import { NodeId, PortId, ExecutionId, ExecutionContext, ExecutionResult, NodeError } from '../types';

/**
 * Breakpoint types
 */
export enum BreakpointType {
  /** Break before node execution */
  BEFORE_EXECUTE = 'before_execute',
  /** Break after node execution */
  AFTER_EXECUTE = 'after_execute',
  /** Break on error */
  ON_ERROR = 'on_error',
  /** Break on condition */
  CONDITIONAL = 'conditional',
}

/**
 * Breakpoint configuration
 */
export interface Breakpoint {
  id: string;
  nodeId: NodeId;
  type: BreakpointType;
  enabled: boolean;
  /** Conditional expression (evaluated in context) */
  condition?: string;
  /** Hit count threshold */
  hitCount?: number;
  /** Current hit count */
  currentHitCount?: number;
  /** Log message instead of breaking */
  logOnly?: boolean;
}

/**
 * Watch expression
 */
export interface WatchExpression {
  id: string;
  /** Expression to evaluate (e.g., "inputs.get('value')", "outputs.size") */
  expression: string;
  /** Description/label */
  label?: string;
  /** Last evaluated value */
  lastValue?: any;
  /** Last evaluation timestamp */
  lastEvaluated?: number;
  /** Whether to break when value changes */
  breakOnChange?: boolean;
  /** Previous value for change detection */
  previousValue?: any;
}

/**
 * Variable snapshot at a point in time
 */
export interface VariableSnapshot {
  /** Node ID */
  nodeId: NodeId;
  /** Execution ID */
  executionId: ExecutionId;
  /** Timestamp */
  timestamp: number;
  /** Input values */
  inputs: Map<PortId, any>;
  /** Output values */
  outputs: Map<PortId, any>;
  /** Local variables (if available) */
  locals?: Map<string, any>;
  /** Metadata */
  metadata: Map<string, any>;
}

/**
 * Execution snapshot for time-travel debugging
 */
export interface ExecutionSnapshot {
  /** Snapshot ID */
  id: string;
  /** Execution ID */
  executionId: ExecutionId;
  /** Timestamp */
  timestamp: number;
  /** Node execution states */
  nodeStates: Map<NodeId, {
    status: 'idle' | 'queued' | 'executing' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    executionTime?: number;
    error?: NodeError;
  }>;
  /** Variable snapshots for all nodes */
  variableSnapshots: Map<NodeId, VariableSnapshot>;
  /** Execution results */
  results: Map<NodeId, ExecutionResult>;
  /** Current executing node */
  currentNodeId?: NodeId;
  /** Execution step number */
  stepNumber: number;
}

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  /** Execution ID */
  executionId: ExecutionId;
  /** Graph ID */
  graphId?: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime?: number;
  /** Execution duration */
  duration?: number;
  /** Success status */
  success: boolean;
  /** Error if failed */
  error?: NodeError;
  /** Number of snapshots */
  snapshotCount: number;
  /** Snapshot IDs */
  snapshotIds: string[];
  /** Execution mode */
  mode: 'sequential' | 'parallel';
}

/**
 * Debugger state
 */
export interface DebuggerState {
  /** Whether debugging is enabled */
  enabled: boolean;
  /** Whether execution is paused */
  paused: boolean;
  /** Current execution ID */
  currentExecutionId?: ExecutionId;
  /** Current step number */
  currentStep: number;
  /** Breakpoints */
  breakpoints: Map<string, Breakpoint>;
  /** Watch expressions */
  watchExpressions: Map<string, WatchExpression>;
  /** Execution history */
  history: ExecutionHistoryEntry[];
  /** Current snapshot */
  currentSnapshot?: ExecutionSnapshot;
  /** Snapshot storage */
  snapshots: Map<string, ExecutionSnapshot>;
}

/**
 * Debug event types
 */
export enum DebugEventType {
  BREAKPOINT_HIT = 'breakpoint_hit',
  WATCH_CHANGED = 'watch_changed',
  STEP_COMPLETE = 'step_complete',
  EXECUTION_PAUSED = 'execution_paused',
  EXECUTION_RESUMED = 'execution_resumed',
  SNAPSHOT_CREATED = 'snapshot_created',
  VARIABLE_INSPECTED = 'variable_inspected',
}

/**
 * Debug event
 */
export interface DebugEvent {
  type: DebugEventType;
  timestamp: number;
  data: any;
}

/**
 * Variable inspection result
 */
export interface VariableInspection {
  /** Variable name/path */
  name: string;
  /** Variable value */
  value: any;
  /** Variable type */
  type: string;
  /** Whether value is expandable (object/array) */
  expandable: boolean;
  /** Children (for objects/arrays) */
  children?: VariableInspection[];
}

/**
 * Debug options
 */
export interface DebugOptions {
  /** Enable debugging */
  enabled?: boolean;
  /** Create snapshots on each step */
  createSnapshots?: boolean;
  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;
  /** Maximum history entries */
  maxHistoryEntries?: number;
  /** Evaluate watch expressions on each step */
  evaluateWatches?: boolean;
  /** Break on errors */
  breakOnError?: boolean;
}

