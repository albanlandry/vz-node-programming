# Live Graph Execution Phase 3 - Implementation Guide

## Implementation Overview

This document provides detailed implementation steps for Phase 3 features: Incremental Execution and Advanced Visualization.

## 1. Incremental Execution

### 1.1 Change Detection Service

**File**: `services/changeDetectionService.ts`

```typescript
import type { GraphDefinition, GraphNode, GraphConnection } from '../src/graph-management/types';

export interface NodeChange {
  nodeId: string;
  type: 'added' | 'removed' | 'modified' | 'connection-changed';
  affectedNodes: string[];
  details?: {
    propertyChanges?: Record<string, { old: unknown; new: unknown }>;
    connectionChanges?: {
      added: GraphConnection[];
      removed: GraphConnection[];
    };
  };
}

export class ChangeDetectionService {
  /**
   * Generate hash for a node (node + its dependencies)
   */
  private hashNode(node: GraphNode, connections: GraphConnection[]): string {
    const dependencies = connections
      .filter(conn => conn.toNode === node.id)
      .map(conn => conn.fromNode)
      .sort();
    
    const nodeData = {
      id: node.id,
      type: node.type,
      properties: node.properties,
      inputs: node.inputs,
      outputs: node.outputs,
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
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Detect changes between two graphs
   */
  detectChanges(
    previousGraph: GraphDefinition,
    currentGraph: GraphDefinition
  ): NodeChange[] {
    const changes: NodeChange[] = [];
    const previousNodes = new Map(previousGraph.data.nodes.map(n => [n.id, n]));
    const currentNodes = new Map(currentGraph.data.nodes.map(n => [n.id, n]));
    const previousConnections = previousGraph.data.connections;
    const currentConnections = currentGraph.data.connections;

    // Detect added nodes
    for (const [nodeId, node] of currentNodes) {
      if (!previousNodes.has(nodeId)) {
        changes.push({
          nodeId,
          type: 'added',
          affectedNodes: this.getAffectedNodes(nodeId, currentGraph),
        });
      }
    }

    // Detect removed nodes
    for (const [nodeId] of previousNodes) {
      if (!currentNodes.has(nodeId)) {
        changes.push({
          nodeId,
          type: 'removed',
          affectedNodes: this.getAffectedNodes(nodeId, previousGraph),
        });
      }
    }

    // Detect modified nodes
    for (const [nodeId, currentNode] of currentNodes) {
      const previousNode = previousNodes.get(nodeId);
      if (previousNode) {
        const nodeChanges = this.detectNodeChanges(previousNode, currentNode);
        if (nodeChanges.length > 0) {
          changes.push({
            nodeId,
            type: 'modified',
            affectedNodes: this.getAffectedNodes(nodeId, currentGraph),
            details: {
              propertyChanges: nodeChanges.reduce((acc, change) => {
                acc[change.property] = { old: change.old, new: change.new };
                return acc;
              }, {} as Record<string, { old: unknown; new: unknown }>),
            },
          });
        }
      }
    }

    // Detect connection changes
    const connectionChanges = this.detectConnectionChanges(
      previousConnections,
      currentConnections
    );
    if (connectionChanges.added.length > 0 || connectionChanges.removed.length > 0) {
      const affectedNodes = new Set<string>();
      connectionChanges.added.forEach(conn => {
        affectedNodes.add(conn.toNode);
        affectedNodes.add(conn.fromNode);
      });
      connectionChanges.removed.forEach(conn => {
        affectedNodes.add(conn.toNode);
        affectedNodes.add(conn.fromNode);
      });

      changes.push({
        nodeId: 'connections',
        type: 'connection-changed',
        affectedNodes: Array.from(affectedNodes),
        details: { connectionChanges },
      });
    }

    return changes;
  }

  /**
   * Detect changes in a single node
   */
  private detectNodeChanges(
    previous: GraphNode,
    current: GraphNode
  ): Array<{ property: string; old: unknown; new: unknown }> {
    const changes: Array<{ property: string; old: unknown; new: unknown }> = [];

    // Check type
    if (previous.type !== current.type) {
      changes.push({ property: 'type', old: previous.type, new: current.type });
    }

    // Check properties
    const prevProps = JSON.stringify(previous.properties || {});
    const currProps = JSON.stringify(current.properties || {});
    if (prevProps !== currProps) {
      changes.push({ property: 'properties', old: previous.properties, new: current.properties });
    }

    // Check inputs/outputs (simplified - could be more detailed)
    if (JSON.stringify(previous.inputs) !== JSON.stringify(current.inputs)) {
      changes.push({ property: 'inputs', old: previous.inputs, new: current.inputs });
    }
    if (JSON.stringify(previous.outputs) !== JSON.stringify(current.outputs)) {
      changes.push({ property: 'outputs', old: previous.outputs, new: current.outputs });
    }

    return changes;
  }

  /**
   * Detect connection changes
   */
  private detectConnectionChanges(
    previous: GraphConnection[],
    current: GraphConnection[]
  ): { added: GraphConnection[]; removed: GraphConnection[] } {
    const prevSet = new Set(previous.map(c => `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`));
    const currSet = new Set(current.map(c => `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`));

    const added = current.filter(c => {
      const key = `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`;
      return !prevSet.has(key);
    });

    const removed = previous.filter(c => {
      const key = `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`;
      return !currSet.has(key);
    });

    return { added, removed };
  }

  /**
   * Get nodes affected by a change (downstream nodes)
   */
  private getAffectedNodes(nodeId: string, graph: GraphDefinition): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      affected.add(id);

      // Find all nodes that depend on this node
      graph.data.connections
        .filter(conn => conn.fromNode === id)
        .forEach(conn => {
          traverse(conn.toNode);
        });
    };

    traverse(nodeId);
    affected.delete(nodeId); // Don't include the changed node itself
    return Array.from(affected);
  }

  /**
   * Get subgraph that needs to be executed
   */
  getAffectedSubgraph(
    changes: NodeChange[],
    graph: GraphDefinition
  ): GraphDefinition {
    const affectedNodeIds = new Set<string>();

    // Add all changed nodes
    changes.forEach(change => {
      if (change.type !== 'removed') {
        affectedNodeIds.add(change.nodeId);
      }
      change.affectedNodes.forEach(id => affectedNodeIds.add(id));
    });

    // Get all affected nodes
    const affectedNodes = graph.data.nodes.filter(n => affectedNodeIds.has(n.id));

    // Get all connections between affected nodes
    const affectedConnections = graph.data.connections.filter(
      conn => affectedNodeIds.has(conn.fromNode) && affectedNodeIds.has(conn.toNode)
    );

    return {
      ...graph,
      data: {
        ...graph.data,
        nodes: affectedNodes,
        connections: affectedConnections,
      },
    };
  }
}

export const changeDetectionService = new ChangeDetectionService();
```

### 1.2 Result Cache Service

**File**: `services/resultCacheService.ts`

```typescript
import type { ExecutionResult } from '../src/types';

export interface CachedResult {
  nodeId: string;
  result: ExecutionResult;
  graphHash: string;
  timestamp: number;
  ttl?: number;
}

export class ResultCacheService {
  private cache: Map<string, CachedResult> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key
   */
  private getCacheKey(nodeId: string, graphHash: string): string {
    return `${nodeId}:${graphHash}`;
  }

  /**
   * Get cached result
   */
  get(nodeId: string, graphHash: string): CachedResult | null {
    const key = this.getCacheKey(nodeId, graphHash);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check TTL
    const ttl = cached.ttl || this.defaultTTL;
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cached result
   */
  set(nodeId: string, result: ExecutionResult, graphHash: string, ttl?: number): void {
    const key = this.getCacheKey(nodeId, graphHash);
    this.cache.set(key, {
      nodeId,
      result,
      graphHash,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache for a node
   */
  invalidate(nodeId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((cached, key) => {
      if (cached.nodeId === nodeId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

export const resultCacheService = new ResultCacheService();
```

### 1.3 Incremental Execution Service

**File**: `services/incrementalExecutionService.ts`

```typescript
import { graphExecutionService } from './graphExecutionService';
import { changeDetectionService } from './changeDetectionService';
import { resultCacheService } from './resultCacheService';
import type { GraphDefinition, ExecutionResponse } from '../src/graph-management/types';

export interface IncrementalExecutionOptions {
  useCache?: boolean;
  cacheTTL?: number;
  parallel?: boolean;
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
    options: IncrementalExecutionOptions = {}
  ): Promise<ExecutionResponse & { cachedNodes: string[]; executedNodes: string[]; cacheHitRate: number }> {
    const {
      useCache = true,
      cacheTTL,
      parallel = false,
    } = options;

    const cachedNodes: string[] = [];
    const executedNodes: string[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;

    // Detect changes if previous graph provided
    let changes: NodeChange[] = [];
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
        executedNodes: graph.data.nodes.map(n => n.id),
        cacheHitRate: 0,
      };
    }

    // Generate hash for each node
    const nodeHashes = new Map<string, string>();
    graph.data.nodes.forEach(node => {
      const hash = this.hashNode(node, graph.data.connections);
      nodeHashes.set(node.id, hash);
    });

    // Check cache for unchanged nodes
    const nodesToExecute: string[] = [];
    const cachedResults: Record<string, ExecutionResult> = {};

    affectedSubgraph!.data.nodes.forEach(node => {
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
          nodes: graph.data.nodes.filter(n => nodesToExecuteSet.has(n.id)),
          connections: graph.data.connections.filter(
            c => nodesToExecuteSet.has(c.fromNode) && nodesToExecuteSet.has(c.toNode)
          ),
        },
      };

      const executionResult = await graphExecutionService.executeGraph(subgraph, inputs, { parallel });
      executedNodes.push(...nodesToExecute);

      // Cache results
      if (useCache) {
        nodesToExecute.forEach(nodeId => {
          const hash = nodeHashes.get(nodeId)!;
          const result = executionResult.results?.[nodeId];
          if (result) {
            resultCacheService.set(nodeId, result, hash, cacheTTL);
            cachedResults[nodeId] = result;
          }
        });
      }
    }

    const cacheHitRate = cacheHits + cacheMisses > 0
      ? cacheHits / (cacheHits + cacheMisses)
      : 0;

    return {
      success: true,
      results: cachedResults,
      executionTime: 0, // Would need to calculate
      logs: [`Executed ${executedNodes.length} nodes, used cache for ${cachedNodes.length} nodes`],
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
      .filter(conn => conn.toNode === node.id)
      .map(conn => `${conn.fromNode}:${conn.fromPort}`)
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
```

## 2. Advanced Visualization

### 2.1 Execution Timeline Component

**File**: `components/graph/ExecutionTimeline.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import { useGraphStore } from '../../store/graphStore';

interface TimelineEvent {
  nodeId: string;
  nodeName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed';
  dependencies: string[];
}

export default function ExecutionTimeline() {
  const { execution, nodes } = useGraphStore();

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    nodes.forEach(node => {
      const nodeState = execution.nodeStates[node.id];
      if (nodeState && nodeState.startTime && nodeState.endTime) {
        events.push({
          nodeId: node.id,
          nodeName: node.name,
          startTime: nodeState.startTime,
          endTime: nodeState.endTime,
          duration: (nodeState.endTime - nodeState.startTime),
          status: nodeState.status === 'completed' ? 'completed' : 'failed',
          dependencies: [], // Would need to calculate from connections
        });
      }
    });

    return events.sort((a, b) => a.startTime - b.startTime);
  }, [execution.nodeStates, nodes]);

  if (timelineEvents.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No execution timeline available
      </div>
    );
  }

  const minTime = Math.min(...timelineEvents.map(e => e.startTime));
  const maxTime = Math.max(...timelineEvents.map(e => e.endTime));
  const totalDuration = maxTime - minTime;

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4">Execution Timeline</h3>
      <div className="space-y-2">
        {timelineEvents.map(event => {
          const left = ((event.startTime - minTime) / totalDuration) * 100;
          const width = (event.duration / totalDuration) * 100;

          return (
            <div key={event.nodeId} className="relative h-8">
              <div
                className={`absolute h-full ${
                  event.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                } text-white text-xs flex items-center px-2`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: '50px',
                }}
                title={`${event.nodeName}: ${event.duration}ms`}
              >
                {event.nodeName}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Total Duration: {totalDuration}ms
      </div>
    </div>
  );
}
```

### 2.2 Performance Metrics Component

**File**: `components/graph/PerformanceMetrics.tsx`

```typescript
'use client';

import { useGraphStore } from '../../store/graphStore';

export default function PerformanceMetrics() {
  const { performanceMetrics } = useGraphStore();

  if (!performanceMetrics || Object.keys(performanceMetrics.nodes).length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No performance metrics available
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4">Performance Metrics</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-2">Node</th>
              <th className="text-right p-2">Executions</th>
              <th className="text-right p-2">Avg Time</th>
              <th className="text-right p-2">Min Time</th>
              <th className="text-right p-2">Max Time</th>
              <th className="text-right p-2">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(performanceMetrics.nodes).map(([nodeId, metrics]) => (
              <tr key={nodeId} className="border-b border-gray-100">
                <td className="p-2 font-medium">{metrics.nodeName}</td>
                <td className="p-2 text-right">{metrics.executionCount}</td>
                <td className="p-2 text-right">{metrics.averageExecutionTime.toFixed(2)}ms</td>
                <td className="p-2 text-right">{metrics.minExecutionTime}ms</td>
                <td className="p-2 text-right">{metrics.maxExecutionTime}ms</td>
                <td className="p-2 text-right">
                  {(metrics.successRate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Integration

### Update Graph Store

Add to `store/graphStore.ts`:

```typescript
// Add to GraphState interface
interface GraphState {
  // ... existing
  
  // Incremental execution
  previousGraphHash: string | null;
  cachedResults: Record<string, CachedResult>;
  
  // Performance metrics
  performanceMetrics: GraphPerformanceMetrics;
  
  // Visualization
  executionTimeline: ExecutionTimeline | null;
  
  // Actions
  setCachedResult: (nodeId: string, result: ExecutionResult, hash: string) => void;
  getCachedResult: (nodeId: string, hash: string) => CachedResult | null;
  updatePerformanceMetrics: (nodeId: string, metrics: Partial<NodePerformanceMetrics>) => void;
  setExecutionTimeline: (timeline: ExecutionTimeline) => void;
}
```

### Update ExecutionToolbar

Add incremental execution option and visualization toggles.


