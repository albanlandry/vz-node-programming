/**
 * Graph Management Types
 * 
 * Type definitions for the graph management system
 */

import type { GraphNode, GraphConnection, Viewport } from '../../store/graphStore';
import type { ExecutionResult, NodeError } from '../types';

/**
 * Graph metadata for listing and management
 */
export interface GraphMetadata {
  /** Unique identifier */
  id: string;
  /** Graph name */
  name: string;
  /** Graph description */
  description?: string;
  /** Author/creator */
  author?: string;
  /** Version number */
  version: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Tags for categorization */
  tags?: string[];
  /** Number of nodes in the graph */
  nodeCount: number;
  /** Number of connections in the graph */
  connectionCount: number;
}

/**
 * Complete graph definition with metadata and data
 */
export interface GraphDefinition {
  /** Unique identifier */
  id: string;
  /** Graph metadata */
  metadata: GraphMetadata;
  /** Graph data (nodes, connections, viewport) */
  data: {
    nodes: GraphNode[];
    connections: GraphConnection[];
    viewport: Viewport;
  };
}

/**
 * Graph execution request
 */
export interface ExecutionRequest {
  /** Input values for nodes (nodeId -> inputs map) */
  inputs?: Record<string, Record<string, unknown>>;
  /** Execution options */
  options?: {
    /** Execution timeout in milliseconds */
    timeout?: number;
    /** Whether to execute in parallel */
    parallel?: boolean;
  };
}

/**
 * Serialized execution result (for JSON responses)
 * Maps are converted to plain objects for JSON serialization
 */
export interface SerializedExecutionResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: NodeError;
  executionTime?: number;
}

/**
 * Graph execution response
 */
export interface ExecutionResponse {
  /** Whether execution was successful */
  success: boolean;
  /** Execution results by node ID (outputs are serialized as plain objects) */
  results?: Record<string, SerializedExecutionResult>;
  /** Execution errors */
  errors?: NodeError[];
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Execution logs */
  logs?: string[];
}

/**
 * Graph statistics
 */
export interface GraphStats {
  /** Total number of graphs */
  total: number;
  /** Number of graphs by category */
  byCategory?: Record<string, number>;
  /** Total nodes across all graphs */
  totalNodes: number;
  /** Total connections across all graphs */
  totalConnections: number;
}

/**
 * Validation result for graph operations
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors?: string[];
  /** Validation warnings */
  warnings?: string[];
}

