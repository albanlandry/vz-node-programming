/**
 * API Route Handler for Cancelling User Input
 * 
 * Handles cancellation of user input requests for interactive nodes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../../../src/utils/Logger';
import { getActiveExecutors } from '../route';

/**
 * POST /api/graphs/interactive/input/[nodeId]/cancel
 * Cancel user input request for an interactive node
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  try {
    const { nodeId } = params;
    const body = await request.json();
    const { executionId } = body as {
      executionId: string;
    };

    if (!executionId) {
      return NextResponse.json(
        { error: 'executionId is required' },
        { status: 400 },
      );
    }

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId is required' },
        { status: 400 },
      );
    }

    // Get the executor for this execution
    const activeExecutors = getActiveExecutors();
    const executor = activeExecutors.get(executionId);
    if (!executor) {
      return NextResponse.json(
        { error: 'Execution not found or expired' },
        { status: 404 },
      );
    }

    // Cancel user input
    executor.cancelUserInput(nodeId, new Error('User input cancelled'));

    return NextResponse.json({
      success: true,
      message: 'User input cancelled',
    });
  } catch (error) {
    logger.error('Error in cancel user input route:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel user input',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

