/**
 * API Route Handler for Graphs
 * 
 * Handles GET (list all) and POST (create new) operations for graphs
 */

import { NextResponse } from 'next/server';

import { GraphManager } from '../../../src/graph-management';
import { logger } from '../../../src/utils/Logger';

/**
 * GET /api/graphs
 * Returns all saved graphs (metadata only)
 */
export async function GET() {
  try {
    const manager = new GraphManager();
    const graphs = await manager.listGraphs();
    const stats = await manager.getStats();

    return NextResponse.json({
      graphs,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching graphs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch graphs',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/graphs
 * Creates a new graph
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, metadata } = body;

    if (!data || !metadata || !metadata.name) {
      return NextResponse.json(
        { error: 'Missing required fields: data and metadata.name' },
        { status: 400 },
      );
    }

    const manager = new GraphManager();
    const graph = await manager.createGraph(data, metadata);

    return NextResponse.json({
      graph,
      message: 'Graph created successfully',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to create graph',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

