/**
 * API Route Handler for Inline Graph Execution
 * 
 * Executes a graph definition directly without requiring it to be saved first.
 * This is used for live execution in the Graph Editor.
 */

import { NextRequest, NextResponse } from 'next/server';

import { GraphExecutionEngine } from '../../../../src/graph-management';
import type { GraphDefinition, ExecutionRequest } from '../../../../src/graph-management/types';
import { logger } from '../../../../src/utils/Logger';

/**
 * POST /api/graphs/execute-inline
 * Executes a graph definition inline (without saving)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { graph, inputs, options } = body as {
      graph: GraphDefinition;
      inputs?: Record<string, Record<string, unknown>>;
      options?: { parallel?: boolean; timeout?: number };
    };

    if (!graph) {
      return NextResponse.json(
        { error: 'Graph definition is required' },
        { status: 400 },
      );
    }

    if (!graph.data || !graph.data.nodes) {
      return NextResponse.json(
        { error: 'Invalid graph definition: missing data.nodes' },
        { status: 400 },
      );
    }

    // Validate graph has nodes
    if (graph.data.nodes.length === 0) {
      return NextResponse.json(
        { error: 'Graph must have at least one node' },
        { status: 400 },
      );
    }

    // Execute graph
    const engine = new GraphExecutionEngine();
    const executionRequest: ExecutionRequest = {
      inputs,
      options: {
        parallel: options?.parallel ?? false,
        timeout: options?.timeout,
      },
    };

    const result = await engine.execute(graph, executionRequest);

    return NextResponse.json({
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing graph inline:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json(
        {
          error: 'Graph validation failed',
          message: error.message,
        },
        { status: 400 },
      );
    }

    // Handle node creation errors
    if (error instanceof Error && error.message.includes('Failed to create node')) {
      return NextResponse.json(
        {
          error: 'Node creation failed',
          message: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to execute graph',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

