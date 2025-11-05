import { NextResponse } from 'next/server';

import { NodeRegistry, registerBuiltInNodes } from '../../../src/index';

/**
 * Route Handler for GET /api/nodes
 * Returns all registered nodes with metadata
 */
export async function GET() {
  try {
    // Register built-in nodes if not already registered
    const registry = NodeRegistry.getInstance();

    // Check if nodes are already registered
    if (registry.getAllTypes().length === 0) {
      registerBuiltInNodes();
    }

    // Get all nodes with metadata
    const nodes = registry.getAllNodes();
    const categories = registry.getCategories();
    const stats = registry.getStats();

    return NextResponse.json({
      nodes,
      categories,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch nodes',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

