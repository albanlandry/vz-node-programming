/**
 * API Route Handler for Individual Graphs
 * 
 * Handles GET, PUT, and DELETE operations for a specific graph
 */

import { NextRequest, NextResponse } from 'next/server';

import { GraphManager } from '../../../../src/graph-management';
import { logger } from '../../../../src/utils/Logger';

/**
 * GET /api/graphs/[id]
 * Returns a specific graph by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Graph ID is required' },
        { status: 400 },
      );
    }

    const manager = new GraphManager();
    const graph = await manager.getGraph(id);

    return NextResponse.json({
      graph,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching graph:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch graph',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/graphs/[id]
 * Updates an existing graph
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { data, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Graph ID is required' },
        { status: 400 },
      );
    }

    const manager = new GraphManager();
    const graph = await manager.updateGraph(id, data, metadata);

    return NextResponse.json({
      graph,
      message: 'Graph updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating graph:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to update graph',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/graphs/[id]
 * Deletes a graph
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Graph ID is required' },
        { status: 400 },
      );
    }

    const manager = new GraphManager();
    await manager.deleteGraph(id);

    return NextResponse.json({
      message: 'Graph deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting graph:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Graph not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to delete graph',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

