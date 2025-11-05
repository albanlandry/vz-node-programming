/**
 * API Route Handler for Individual Custom Nodes
 * 
 * Handles GET (get by ID), PUT (update), and DELETE operations
 */

import { NextResponse } from 'next/server';

import {
  CustomNodeManager,
  CustomNodeStorage,
  CustomNode,
  TemplateRegistry,
  ExpressionValidator,
} from '../../../../src/custom-nodes';
import { CustomNodeConfig, CustomNodeMetadata } from '../../../../src/custom-nodes/types';
import { logger } from '../../../../src/utils/Logger';

/**
 * GET /api/custom-nodes/:id
 * Get a specific custom node by storage ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const storedNode = await CustomNodeStorage.load(id);

    if (!storedNode) {
      return NextResponse.json(
        { error: `Custom node with ID ${id} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      node: storedNode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching custom node:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch custom node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/custom-nodes/:id
 * Update an existing custom node
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json() as {
      type?: string;
      displayName?: string;
      category?: string;
      description?: string;
      version?: string;
      author?: string;
      tags?: string[];
      template?: string;
      expression?: string;
      inputs?: Array<{
        id: string;
        name: string;
        dataType: { name: string };
        required?: boolean;
        description?: string;
      }>;
      outputs?: Array<{
        id: string;
        name: string;
        dataType: { name: string };
        description?: string;
      }>;
    };

    // Load existing node
    const existingNode = await CustomNodeStorage.load(id);
    if (!existingNode) {
      return NextResponse.json(
        { error: `Custom node with ID ${id} not found` },
        { status: 404 },
      );
    }

    // Merge updates
    const updatedMetadata: CustomNodeMetadata = {
      ...existingNode.metadata,
      displayName: body.displayName ?? existingNode.metadata.displayName,
      category: body.category ?? existingNode.metadata.category,
      description: body.description ?? existingNode.metadata.description,
      version: body.version ?? existingNode.metadata.version,
      author: body.author ?? existingNode.metadata.author,
      tags: body.tags ?? existingNode.metadata.tags,
      template: (body.template as any) ?? existingNode.metadata.template,
      expression: body.expression ?? existingNode.metadata.expression,
      inputs: body.inputs
        ? body.inputs.map(input => ({
            id: input.id,
            name: input.name,
            dataType: {
              name: input.dataType.name,
              validator: undefined,
            },
            required: input.required ?? false,
            description: input.description,
          }))
        : existingNode.metadata.inputs,
      outputs: body.outputs
        ? body.outputs.map(output => ({
            id: output.id,
            name: output.name,
            dataType: {
              name: output.dataType.name,
              validator: undefined,
            },
            description: output.description,
          }))
        : existingNode.metadata.outputs,
      updatedAt: new Date(),
    };

    // Validate if expression changed
    if (body.expression) {
      const expressionValidation = ExpressionValidator.validate(
        body.expression,
        updatedMetadata.template,
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
    }

    // Create updated config
    const updatedConfig: CustomNodeConfig = {
      ...existingNode.config,
      name: updatedMetadata.displayName,
      description: updatedMetadata.description,
      template: updatedMetadata.template,
      expression: updatedMetadata.expression,
      inputs: updatedMetadata.inputs,
      outputs: updatedMetadata.outputs,
    };

    // Validate config
    const validation = CustomNode.validateConfig(updatedConfig);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid node configuration',
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Unregister old node
    CustomNodeManager.unregisterCustomNode(existingNode.metadata.type);

    // Register updated node
    CustomNodeManager.registerCustomNode(updatedConfig, updatedMetadata);

    // Save to storage
    await CustomNodeStorage.save({
      id,
      type: updatedMetadata.type,
      config: updatedConfig,
      metadata: updatedMetadata,
    });

    return NextResponse.json({
      success: true,
      node: {
        id,
        type: updatedMetadata.type,
        metadata: updatedMetadata,
      },
    });
  } catch (error) {
    logger.error('Error updating custom node:', error);
    return NextResponse.json(
      {
        error: 'Failed to update custom node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/custom-nodes/:id
 * Delete a custom node
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Load node to get type
    const storedNode = await CustomNodeStorage.load(id);
    if (!storedNode) {
      return NextResponse.json(
        { error: `Custom node with ID ${id} not found` },
        { status: 404 },
      );
    }

    // Unregister from registry
    CustomNodeManager.unregisterCustomNode(storedNode.metadata.type);

    // Delete from storage
    const deleted = await CustomNodeStorage.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: `Failed to delete custom node ${id}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Custom node ${id} deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting custom node:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete custom node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

