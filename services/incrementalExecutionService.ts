/**
 * Incremental Execution Service
 * 
 * Executes only changed parts of a graph, using cached results for unchanged nodes
 */

import { graphExecutionService } from './graphExecutionService';
import { changeDetectionService } from './changeDetectionService';
import { resultCacheService } from './resultCacheService';
import type {
  GraphDefinition,
  ExecutionResponse,
  SerializedExecutionResult,
} from '../src/graph-management/types';
import type { ExecutionResult } from '../src/types';
import type { GraphNode, GraphConnection } from '../store/graphStore';

/**
 * Convert SerializedExecutionResult to ExecutionResult
 */
function deserializeResult(serialized: SerializedExecutionResult): ExecutionResult {
  return {
    success: serialized.success,
    outputs: serialized.outputs ? new Map(Object.entries(serialized.outputs)) : undefined,
    error: serialized.error,
    executionTime: serialized.executionTime,
  };
}

export interface IncrementalExecutionOptions {
  useCache?: boolean;
  cacheTTL?: number;
  parallel?: boolean;
}

export interface IncrementalExecutionResponse extends ExecutionResponse {
  cachedNodes: string[];
  executedNodes: string[];
  cacheHitRate: number;
}

export class IncrementalExecutionService {
  /**
   * Execute graph incrementally
   */
  async executeIncremental(
    graph: GraphDefinition,
    previousGraph?: GraphDefinition,
    previousResults?: Record<string, ExecutionResult>,
    inputs?: Record<string, Record<string, unknown>>,
    options: IncrementalExecutionOptions = {},
  ): Promise<IncrementalExecutionResponse> {
    const { useCache = true, cacheTTL, parallel = false } = options;

    const cachedNodes: string[] = [];
    const executedNodes: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Detect changes if previous graph provided
    let changes: import('./changeDetectionService').NodeChange[] = [];
    let affectedSubgraph: GraphDefinition | null = null;

    if (previousGraph) {
      changes = changeDetectionService.detectChanges(previousGraph, graph);
      affectedSubgraph = changeDetectionService.getAffectedSubgraph(changes, graph);
    }

    // If no changes or no previous graph, execute full graph
    if (!previousGraph || changes.length === 0) {
      const result = await graphExecutionService.executeGraph(graph, inputs, { parallel });
      return {
        ...result,
        cachedNodes: [],
        executedNodes: graph.data.nodes.map((n) => n.id),
        cacheHitRate: 0,
      };
    }

    // Generate hash for each node
    const nodeHashes = new Map<string, string>();
    graph.data.nodes.forEach((node) => {
      const hash = this.hashNode(node, graph.data.connections);
      nodeHashes.set(node.id, hash);
    });

    // Check cache for unchanged nodes
    const nodesToExecute: string[] = [];
    const cachedResults: Record<string, ExecutionResult> = {};

    affectedSubgraph!.data.nodes.forEach((node) => {
      const hash = nodeHashes.get(node.id)!;
      const cached = useCache ? resultCacheService.get(node.id, hash) : null;

      if (cached) {
        cachedNodes.push(node.id);
        cachedResults[node.id] = cached.result;
        cacheHits++;
      } else {
        nodesToExecute.push(node.id);
        cacheMisses++;
      }
    });

    // Execute only changed/affected nodes
    if (nodesToExecute.length > 0) {
      const nodesToExecuteSet = new Set(nodesToExecute);
      const subgraph: GraphDefinition = {
        ...graph,
        data: {
          ...graph.data,
          nodes: graph.data.nodes.filter((n) => nodesToExecuteSet.has(n.id)),
          connections: graph.data.connections.filter(
            (c) => nodesToExecuteSet.has(c.fromNode) && nodesToExecuteSet.has(c.toNode),
          ),
        },
      };

      const executionResult = await graphExecutionService.executeGraph(subgraph, inputs, {
        parallel,
      });
      executedNodes.push(...nodesToExecute);

      // Cache results
      if (useCache && executionResult.results) {
        nodesToExecute.forEach((nodeId) => {
          const hash = nodeHashes.get(nodeId)!;
          const serializedResult = executionResult.results?.[nodeId];
          if (serializedResult) {
            const result = deserializeResult(serializedResult);
            resultCacheService.set(nodeId, result, hash, cacheTTL);
            cachedResults[nodeId] = result;
          }
        });
      }
    }

    const cacheHitRate =
      cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

    // Convert cached results to SerializedExecutionResult for response
    const serializedResults: Record<string, SerializedExecutionResult> = {};
    Object.entries(cachedResults).forEach(([nodeId, result]) => {
      serializedResults[nodeId] = {
        success: result.success,
        outputs: result.outputs ? Object.fromEntries(result.outputs) : undefined,
        error: result.error,
        executionTime: result.executionTime,
      };
    });

    return {
      success: true,
      results: serializedResults,
      executionTime: 0, // Would need to calculate from individual node times
      logs: [
        `Executed ${executedNodes.length} nodes, used cache for ${cachedNodes.length} nodes`,
      ],
      cachedNodes,
      executedNodes,
      cacheHitRate,
    };
  }

  /**
   * Hash a node (simplified version)
   */
  private hashNode(node: GraphNode, connections: GraphConnection[]): string {
    const dependencies = connections
      .filter((conn) => conn.toNode === node.id)
      .map((conn) => `${conn.fromNode}:${conn.fromPort}`)
      .sort()
      .join(',');

    const nodeData = {
      id: node.id,
      type: node.type,
      properties: JSON.stringify(node.properties || {}),
      inputs: JSON.stringify(node.inputs),
      outputs: JSON.stringify(node.outputs),
      dependencies,
    };

    return this.hashString(JSON.stringify(nodeData));
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

export const incrementalExecutionService = new IncrementalExecutionService();

