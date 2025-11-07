/**
 * API Route Handler for Incremental Graph Execution
 * 
 * Executes only changed parts of a graph, using cached results for unchanged nodes
 */

import { NextRequest } from 'next/server';
import { GraphExecutionEngine } from '../../../../src/graph-management';
import type { GraphDefinition } from '../../../../src/graph-management/types';
import { logger } from '../../../../src/utils/Logger';
import { changeDetectionService } from '../../../../services/changeDetectionService';
import { resultCacheService } from '../../../../services/resultCacheService';

/**
 * POST /api/graphs/execute-incremental
 * Executes a graph incrementally (only changed nodes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { graph, previousGraph, previousResults, inputs, options } = body as {
      graph: GraphDefinition;
      previousGraph?: GraphDefinition;
      previousResults?: Record<string, any>;
      inputs?: Record<string, Record<string, unknown>>;
      options?: {
        useCache?: boolean;
        cacheTTL?: number;
        parallel?: boolean;
      };
    };

    if (!graph) {
      return new Response(
        JSON.stringify({ error: 'Graph definition is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!graph.data || !graph.data.nodes) {
      return new Response(
        JSON.stringify({ error: 'Invalid graph definition: missing data.nodes' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (graph.data.nodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Graph must have at least one node' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const useCache = options?.useCache ?? true;
    const parallel = options?.parallel ?? false;

    // If no previous graph, execute full graph
    if (!previousGraph) {
      const engine = new GraphExecutionEngine();
      const result = await engine.execute(graph, { inputs, options: { parallel } });

      return new Response(
        JSON.stringify({
          success: result.success,
          results: result.results,
          executionTime: result.executionTime,
          logs: result.logs,
          cachedNodes: [],
          executedNodes: graph.data.nodes.map((n) => n.id),
          cacheHitRate: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Detect changes
    const changes = changeDetectionService.detectChanges(previousGraph, graph);
    
    if (changes.length === 0) {
      // No changes, return previous results
      return new Response(
        JSON.stringify({
          success: true,
          results: previousResults || {},
          executionTime: 0,
          logs: ['No changes detected, using previous results'],
          cachedNodes: graph.data.nodes.map((n) => n.id),
          executedNodes: [],
          cacheHitRate: 1,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Get affected subgraph
    const affectedSubgraph = changeDetectionService.getAffectedSubgraph(changes, graph);

    // Execute affected subgraph
    const engine = new GraphExecutionEngine();
    const result = await engine.execute(affectedSubgraph, { inputs, options: { parallel } });

    // Merge with previous results
    const mergedResults = { ...(previousResults || {}) };
    if (result.results) {
      Object.assign(mergedResults, result.results);
    }

    const executedNodeIds = affectedSubgraph.data.nodes.map((n) => n.id);
    const cachedNodeIds = graph.data.nodes
      .filter((n) => !executedNodeIds.includes(n.id))
      .map((n) => n.id);

    const cacheHitRate =
      graph.data.nodes.length > 0
        ? cachedNodeIds.length / graph.data.nodes.length
        : 0;

    return new Response(
      JSON.stringify({
        success: result.success,
        results: mergedResults,
        executionTime: result.executionTime,
        logs: [
          ...(result.logs || []),
          `Incremental execution: ${executedNodeIds.length} nodes executed, ${cachedNodeIds.length} nodes used from cache`,
        ],
        cachedNodes: cachedNodeIds,
        executedNodes: executedNodeIds,
        cacheHitRate,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    logger.error('Error in execute-incremental route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to execute graph incrementally',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

