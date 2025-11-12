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
  { params }: { params: Promise<{ nodeId: string }> },
) {
  try {
    const { nodeId } = await params;
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
      logger.warn(`Executor not found for executionId: ${executionId}, available executors: ${Array.from(activeExecutors.keys()).join(', ')}`);
      return NextResponse.json(
        { error: 'Execution not found or expired' },
        { status: 404 },
      );
    }

    logger.info(`Providing user input to node ${nodeId} in execution ${executionId}`);

    // Provide user input to the node
    try {
      executor.provideUserInput(nodeId, value);
      logger.info(`User input provided successfully to node ${nodeId}`);
    } catch (error) {
      logger.error(`Error providing user input to node ${nodeId}:`, error);
      throw error;
    }

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

