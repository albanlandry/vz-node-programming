/**
 * API Route Handler for Custom Nodes
 * 
 * Handles GET (list all) and POST (create new) operations for custom nodes
 */

import { NextResponse } from 'next/server';

import {
  CustomNodeManager,
  CustomNodeStorage,
  CustomNode,
  TemplateRegistry,
  ExpressionValidator,
} from '../../../src/custom-nodes';
import { CustomNodeConfig, CustomNodeMetadata } from '../../../src/custom-nodes/types';
import { logger } from '../../../src/utils/Logger';

/**
 * GET /api/custom-nodes
 * Returns all custom nodes from storage
 */
export async function GET() {
  try {
    const storedNodes = await CustomNodeStorage.loadAll();
    const stats = await CustomNodeStorage.getStats();

    return NextResponse.json({
      nodes: storedNodes.map(node => ({
        id: node.id,
        metadata: node.metadata,
        config: node.config,
      })),
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching custom nodes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch custom nodes',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/custom-nodes
 * Creates a new custom node
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      type: string;
      displayName: string;
      category: string;
      description: string;
      version: string;
      author?: string;
      tags: string[];
      template: string;
      expression: string;
      inputs: Array<{
        id: string;
        name: string;
        dataType: { name: string };
        required?: boolean;
        description?: string;
      }>;
      outputs: Array<{
        id: string;
        name: string;
        dataType: { name: string };
        description?: string;
      }>;
    };

    // Validate required fields
    if (!body.type || !body.displayName || !body.template || !body.expression) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate template
    const template = TemplateRegistry.getTemplate(body.template as any);
    if (!template) {
      return NextResponse.json(
        { error: `Invalid template type: ${body.template}` },
        { status: 400 },
      );
    }

    // Validate expression
    const expressionValidation = ExpressionValidator.validate(
      body.expression,
      body.template,
    );
    if (!expressionValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid expression',
          details: expressionValidation.errors,
          warnings: expressionValidation.warnings,
        },
        { status: 400 },
      );
    }

    // Create custom node config
    const config: CustomNodeConfig = {
      name: body.displayName,
      description: body.description,
      template: body.template as any,
      expression: body.expression,
      inputs: (body.inputs || []).map(input => ({
        id: input.id,
        name: input.name,
        dataType: {
          name: input.dataType.name,
          validator: undefined, // Will be set based on type
        },
        required: input.required ?? false,
        description: input.description,
      })),
      outputs: (body.outputs || []).map(output => ({
        id: output.id,
        name: output.name,
        dataType: {
          name: output.dataType.name,
          validator: undefined,
        },
        description: output.description,
      })),
    };

    // Create metadata
    const metadata: CustomNodeMetadata = {
      type: body.type,
      displayName: body.displayName,
      category: body.category || 'Custom',
      description: body.description,
      version: body.version || '1.0.0',
      author: body.author,
      tags: body.tags || [],
      template: body.template as any,
      expression: body.expression,
      inputs: config.inputs || [],
      outputs: config.outputs || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate node config
    const validation = CustomNode.validateConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid node configuration',
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Register node
    const node = CustomNodeManager.registerCustomNode(config, metadata);

    // Save to storage
    const storageId = await CustomNodeStorage.save({
      id: node.storageId || `node-${Date.now()}`,
      type: metadata.type,
      config: {
        ...config,
        storageId: node.storageId,
      },
      metadata: {
        ...metadata,
        storageId: node.storageId,
      },
    });

    return NextResponse.json({
      success: true,
      node: {
        id: storageId,
        type: metadata.type,
        metadata,
      },
    });
  } catch (error) {
    logger.error('Error creating custom node:', error);
    return NextResponse.json(
      {
        error: 'Failed to create custom node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

