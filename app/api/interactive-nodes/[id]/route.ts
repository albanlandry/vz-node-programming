/**
 * API Route Handler for Individual Interactive Nodes
 * 
 * Handles GET, PUT, DELETE operations for specific interactive nodes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CustomNodeStorage,
  CustomNodeManager,
} from '../../../../src/custom-nodes';
import { logger } from '../../../../src/utils/Logger';

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
 * PUT /api/interactive-nodes/[id]
 * Update an interactive node
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json() as {
      displayName: string;
      description: string;
      category: string;
      version: string;
      tags: string[];
      uiDefinitionId: string;
      outputMapping: {
        fieldToPort: Record<string, string>;
        transformations?: Record<string, unknown>;
        conditionalRules?: unknown[];
        filters?: unknown;
      };
      validateBeforeSubmit: boolean;
      outputs: Array<{
        id: string;
        name: string;
        dataType: { name: string };
        description?: string;
      }>;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 },
      );
    }

    // Load existing node
    const existingNode = await CustomNodeStorage.load(id);
    if (!existingNode) {
      return NextResponse.json(
        { error: 'Interactive node not found' },
        { status: 404 },
      );
    }

    // Import required modules
    const { TemplateType } = await import('../../../../src/custom-nodes/types');
    const { DataTypes } = await import('../../../../src/types');

    // Create updated config
    const updatedConfig = {
      ...existingNode.config,
      name: body.displayName,
      description: body.description,
      template: TemplateType.TRANSFORM,
      expression: 'ui',
      inputs: [
        {
          id: 'content',
          name: 'Content',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Content to display to the user (optional)',
        },
      ],
      outputs: body.outputs.map((output) => ({
        id: output.id,
        name: output.name,
        dataType: {
          name: output.dataType.name,
          validator: undefined,
        },
        description: output.description,
      })),
    };

    // Create updated metadata
    const updatedMetadata = {
      ...existingNode.metadata,
      displayName: body.displayName,
      category: body.category || 'Interactive',
      description: body.description,
      version: body.version || '1.0.0',
      tags: [...body.tags, 'interactive', 'user-input'],
      template: TemplateType.TRANSFORM,
      expression: 'ui',
      inputs: updatedConfig.inputs ?? [],
      outputs: updatedConfig.outputs ?? [],
      updatedAt: new Date(),
      uiConfig: {
        uiDefinitionId: body.uiDefinitionId,
        outputMapping: body.outputMapping,
        validateBeforeSubmit: body.validateBeforeSubmit,
      },
    };

    // Unregister old node
    CustomNodeManager.unregisterCustomNode(existingNode.metadata.type);

    // Register updated node
    CustomNodeManager.registerCustomNode(updatedConfig, updatedMetadata as any);

    // Save to storage
    await CustomNodeStorage.save({
      id,
      type: updatedMetadata.type,
      config: {
        ...updatedConfig,
        storageId: existingNode.config.storageId ?? id,
      },
      metadata: {
        ...updatedMetadata,
        storageId: existingNode.config.storageId ?? id,
      },
    });

    logger.info(`Updated interactive node: ${updatedMetadata.type}`);

    return NextResponse.json({
      success: true,
      node: {
        id,
        type: updatedMetadata.type,
        displayName: updatedMetadata.displayName,
        category: updatedMetadata.category,
        description: updatedMetadata.description,
        version: updatedMetadata.version,
        createdAt: existingNode.metadata.createdAt,
        updatedAt: updatedMetadata.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating interactive node:', error);
    return NextResponse.json(
      {
        error: 'Failed to update interactive node',
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

