/**
 * API Route Handler for Interactive Nodes
 *
 * Handles CRUD operations for interactive nodes
 */

import { NextResponse } from 'next/server';

import {
  CustomNodeManager,
  CustomNodeStorage,
} from '../../../src/custom-nodes';
import type { CustomNodeConfig, CustomNodeMetadata } from '../../../src/custom-nodes/types';
import { TemplateType } from '../../../src/custom-nodes/types';
import { DataTypes } from '../../../src/types';
import { logger } from '../../../src/utils/Logger';

/**
 * GET /api/interactive-nodes
 * Get all interactive nodes
 */
export async function GET() {
  try {
    const storedNodes = await CustomNodeStorage.loadAll();

    // Filter interactive nodes (those with UI config)
    const interactiveNodes = storedNodes.filter((node) => {
      // Check if node has UI configuration
      return node.metadata.tags.includes('interactive') ||
             (node.config.storageId && node.config.storageId.includes('interactive'));
    });

    return NextResponse.json({
      nodes: interactiveNodes.map((node) => ({
        id: node.id,
        type: node.type,
        displayName: node.metadata.displayName,
        category: node.metadata.category,
        description: node.metadata.description,
        version: node.metadata.version,
        createdAt: node.metadata.createdAt,
        updatedAt: node.metadata.updatedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching interactive nodes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch interactive nodes',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/interactive-nodes
 * Create a new interactive node
 */
export async function POST(request: Request) {
  try {
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

    // Validate required fields
    if (!body.displayName || !body.uiDefinitionId) {
      return NextResponse.json(
        { error: 'Missing required fields: displayName, uiDefinitionId' },
        { status: 400 },
      );
    }

    // Generate node type
    const nodeType = `interactive.${body.displayName.toLowerCase().replace(/\s+/g, '-')}`;

    // Create custom node config for interactive node
    // Interactive nodes use a special template that handles UI rendering
    const config: CustomNodeConfig = {
      name: body.displayName,
      description: body.description,
      template: TemplateType.TRANSFORM,
      expression: 'ui', // Special marker for interactive nodes
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

    // Create metadata with UI config stored in a custom property
    const metadata: CustomNodeMetadata & { uiConfig?: {
      uiDefinitionId: string;
      outputMapping: typeof body.outputMapping;
      validateBeforeSubmit: boolean;
    } } = {
      type: nodeType,
      displayName: body.displayName,
      category: body.category || 'Interactive',
      description: body.description,
      version: body.version || '1.0.0',
      tags: [...body.tags, 'interactive', 'user-input'],
      template: TemplateType.TRANSFORM,
      expression: 'ui',
      inputs: config.inputs ?? [],
      outputs: config.outputs ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store UI config in metadata
      uiConfig: {
        uiDefinitionId: body.uiDefinitionId,
        outputMapping: body.outputMapping,
        validateBeforeSubmit: body.validateBeforeSubmit,
      },
    };

    // Register node
    const node = CustomNodeManager.registerCustomNode(config, metadata);

    // Generate storage ID
    const storageId = `interactive-${Date.now()}`;

    // Save to storage
    const savedId = await CustomNodeStorage.save({
      id: storageId,
      type: metadata.type,
      config: {
        ...config,
        storageId: node.storageId ?? storageId,
      },
      metadata: {
        ...metadata,
        storageId: node.storageId ?? storageId,
      },
    });

    logger.info(`Created interactive node: ${metadata.type}`);

    return NextResponse.json({
      success: true,
      node: {
        id: savedId,
        type: metadata.type,
        displayName: metadata.displayName,
        category: metadata.category,
        description: metadata.description,
        version: metadata.version,
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error creating interactive node:', error);
    return NextResponse.json(
      {
        error: 'Failed to create interactive node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

