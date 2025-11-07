/**
 * API Route Handler for User Input Submission
 * 
 * Handles user input submission for interactive nodes during execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../../src/utils/Logger';

// Store active executors by executionId
// In production, this should be stored in Redis or a similar service
const activeExecutors = new Map<string, any>();

/**
 * Register an executor for an execution
 * Called by execute-stream route
 */
export function registerExecutor(executionId: string, executor: any): void {
  activeExecutors.set(executionId, executor);
}

/**
 * Unregister an executor
 */
export function unregisterExecutor(executionId: string): void {
  activeExecutors.delete(executionId);
}

/**
 * Get active executors map (for use in other routes)
 */
export function getActiveExecutors(): Map<string, any> {
  return activeExecutors;
}

/**
 * POST /api/graphs/interactive/input/[nodeId]
 * Submit user input for an interactive node
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  try {
    const { nodeId } = params;
    const body = await request.json();
    const { executionId, value } = body as {
      executionId: string;
      value: unknown;
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
    const executor = activeExecutors.get(executionId);
    if (!executor) {
      return NextResponse.json(
        { error: 'Execution not found or expired' },
        { status: 404 },
      );
    }

    // Provide user input to the node
    executor.provideUserInput(nodeId, value);

    return NextResponse.json({
      success: true,
      message: 'User input submitted',
    });
  } catch (error) {
    logger.error('Error in user input route:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit user input',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

