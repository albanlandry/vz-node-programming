/**
 * API Route Handler for Expression Validation
 * 
 * Validates custom node expressions for safety and correctness
 */

import { NextResponse } from 'next/server';

import { ExpressionValidator } from '../../../../src/custom-nodes';
import { logger } from '../../../../src/utils/Logger';

/**
 * POST /api/custom-nodes/validate-expression
 * Validates an expression
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      expression: string;
      template?: string;
    };

    if (!body.expression) {
      return NextResponse.json(
        { error: 'Expression is required' },
        { status: 400 },
      );
    }

    const validation = ExpressionValidator.validate(
      body.expression,
      body.template,
    );

    return NextResponse.json(validation);
  } catch (error) {
    logger.error('Error validating expression:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate expression',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

