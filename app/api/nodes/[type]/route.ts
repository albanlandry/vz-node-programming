import { NextRequest, NextResponse } from 'next/server';

import { NodeRegistry, registerBuiltInNodes } from '../../../../src/index';

/**
 * Route Handler for GET /api/nodes/[type]
 * Returns a specific node by type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } },
) {
  try {
    const { type } = params;

    if (!type) {
      return NextResponse.json(
        { error: 'Node type is required' },
        { status: 400 },
      );
    }

    // Register built-in nodes if not already registered
    const registry = NodeRegistry.getInstance();

    if (registry.getAllTypes().length === 0) {
      registerBuiltInNodes();
    }

    const metadata = registry.getMetadata(type);

    if (!metadata) {
      return NextResponse.json(
        { error: `Node type '${type}' not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      node: metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching node:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

