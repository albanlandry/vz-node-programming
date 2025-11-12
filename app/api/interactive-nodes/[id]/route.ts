/**
 * API Route Handler for Individual Interactive Nodes
 * 
 * Handles GET, PUT, DELETE operations for specific interactive nodes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CustomNodeStorage,
  CustomNodeManager,
} from '../../../src/custom-nodes';
import { logger } from '../../../src/utils/Logger';

/**
 * GET /api/interactive-nodes/[id]
 * Get a specific interactive node
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 },
      );
    }

    const storedNode = await CustomNodeStorage.load(id);

    if (!storedNode) {
      return NextResponse.json(
        { error: 'Interactive node not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      node: storedNode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching interactive node:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch interactive node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/interactive-nodes/[id]
 * Delete an interactive node
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 },
      );
    }

    // Load node to get type
    const storedNode = await CustomNodeStorage.load(id);
    if (!storedNode) {
      return NextResponse.json(
        { error: 'Interactive node not found' },
        { status: 404 },
      );
    }

    // Unregister from registry
    CustomNodeManager.unregisterCustomNode(storedNode.type);

    // Delete from storage
    await CustomNodeStorage.delete(id);

    logger.info(`Deleted interactive node: ${storedNode.type}`);

    return NextResponse.json({
      success: true,
      message: 'Interactive node deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error deleting interactive node:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete interactive node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

