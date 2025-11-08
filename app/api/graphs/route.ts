/**
 * API Route Handler for Graphs
 * 
 * Handles GET (list all) and POST (create new) operations for graphs
 */

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
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
    
    // Initialize example graphs if they don't exist (test graph + example graphs)
    try {
      const graphs = await manager.listGraphs();
      const { GraphStorage } = await import('../../../src/graph-management');
      const storage = new GraphStorage();
      const graphsDir = join(process.cwd(), 'data', 'graphs');
      
      // List of graphs to auto-initialize
      const graphsToInit = [
        { id: 'test-live-execution-001', file: 'test-live-execution.json' },
        { id: 'graph-interactive-nodes', file: 'interactive-nodes-graph.json' },
        { id: 'graph-download-image', file: 'download-image-graph.json' },
        { id: 'graph-download-transform-save', file: 'download-transform-save-graph.json' },
        { id: 'graph-load-file-display', file: 'load-file-display-graph.json' },
      ];
      
      for (const { id, file } of graphsToInit) {
        const graphPath = join(graphsDir, file);
        try {
          // Always reload from JSON source file if it exists (to pick up updates)
          if (existsSync(graphPath)) {
            const graphData = JSON.parse(readFileSync(graphPath, 'utf-8')) as GraphDefinition;
            // Save directly using storage to preserve the ID (this will update if it exists)
            await storage.save(graphData);
            logger.info(`Graph loaded/updated from JSON: ${id}`);
          }
        } catch (fileError) {
          // Graph file doesn't exist or can't be read - that's okay
          logger.debug(`Graph file not found: ${file}, skipping initialization`);
        }
      }
    } catch (initError) {
      // Ignore initialization errors - example graphs are optional
      logger.debug('Graph initialization skipped:', initError);
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

