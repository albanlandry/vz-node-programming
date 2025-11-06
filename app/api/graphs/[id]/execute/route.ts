/**
 * API Route Handler for Graph Execution
 * 
 * Executes a saved graph
 */

import { NextRequest, NextResponse } from 'next/server';

import { GraphManager, GraphExecutionEngine } from '../../../../../src/graph-management';
import { logger } from '../../../../../src/utils/Logger';

/**
 * POST /api/graphs/[id]/execute
 * Executes a saved graph
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { inputs, options } = body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: 'Graph ID is required' },
        { status: 400 },
      );
    }

    // Load graph
    const manager = new GraphManager();
    const graph = await manager.getGraph(id);

    // Execute graph
    const engine = new GraphExecutionEngine();
    const result = await engine.execute(graph, { inputs, options });

    return NextResponse.json({
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing graph:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 },
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

