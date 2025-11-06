/**
 * API Route Handler for Graphs
 * 
 * Handles GET (list all) and POST (create new) operations for graphs
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

import { GraphManager } from '../../../src/graph-management';
import { logger } from '../../../src/utils/Logger';
import type { GraphDefinition } from '../../../src/graph-management/types';

/**
 * GET /api/graphs
 * Returns all saved graphs (metadata only)
 */
export async function GET() {
  try {
    const manager = new GraphManager();
    
    // Initialize test graph if it doesn't exist
    try {
      const graphs = await manager.listGraphs();
      const testGraphExists = graphs.some(g => g.id === 'test-live-execution-001');
      
      if (!testGraphExists) {
        const testGraphPath = join(process.cwd(), 'data', 'graphs', 'test-live-execution.json');
        try {
          const graphData = JSON.parse(readFileSync(testGraphPath, 'utf-8')) as GraphDefinition;
          // Save directly using storage to preserve the ID
          const { GraphStorage } = await import('../../../src/graph-management');
          const storage = new GraphStorage();
          await storage.save(graphData);
          logger.info('Test graph initialized');
        } catch (fileError) {
          // Test graph file doesn't exist or can't be read - that's okay
          logger.debug('Test graph file not found, skipping initialization');
        }
      }
    } catch (initError) {
      // Ignore initialization errors - test graph is optional
      logger.debug('Test graph initialization skipped:', initError);
    }
    
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

