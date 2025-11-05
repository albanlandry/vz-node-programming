/**
 * API Route Handler for Custom Node Templates
 * 
 * Returns available templates for creating custom nodes
 */

import { NextResponse } from 'next/server';

import { TemplateRegistry } from '../../../../src/custom-nodes';
import { logger } from '../../../../src/utils/Logger';

/**
 * GET /api/custom-nodes/templates
 * Returns all available templates
 */
export async function GET() {
  try {
    const templates = TemplateRegistry.getAllTemplates();

    return NextResponse.json({
      templates: templates.map(template => ({
        type: template.type,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

