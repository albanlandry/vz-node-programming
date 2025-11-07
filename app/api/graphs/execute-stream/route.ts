/**
 * API Route Handler for Streaming Graph Execution
 * 
 * Executes a graph definition with Server-Sent Events (SSE) for real-time updates
 */

import { NextRequest } from 'next/server';
import { GraphExecutionEngine } from '../../../../src/graph-management';
import type { GraphDefinition, ExecutionRequest } from '../../../../src/graph-management/types';
import { logger } from '../../../../src/utils/Logger';
import { NodeEventType } from '../../../../src/types';

/**
 * POST /api/graphs/execute-stream
 * Executes a graph definition with SSE streaming
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { graph, inputs, options } = body as {
      graph: GraphDefinition;
      inputs?: Record<string, Record<string, unknown>>;
      options?: {
        parallel?: boolean;
        timeout?: number;
        breakpoints?: string[];
        stepMode?: boolean;
      };
    };

    if (!graph) {
      return new Response(
        JSON.stringify({ error: 'Graph definition is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!graph.data || !graph.data.nodes) {
      return new Response(
        JSON.stringify({ error: 'Invalid graph definition: missing data.nodes' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (graph.data.nodes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Graph must have at least one node' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const startTime = Date.now();

        const sendEvent = (event: string, data: unknown) => {
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            logger.error('Error sending SSE event:', error);
          }
        };

        try {
          const engine = new GraphExecutionEngine();
          const executor = await engine.buildExecutor(graph);

          const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Send execution started event
          sendEvent('execution:started', {
            executionId,
            timestamp: Date.now(),
          });

          // Set up event listeners for streaming
          executor.on(NodeEventType.EXECUTION_STARTED, (event: any) => {
            sendEvent('node:executing', {
              nodeId: event.data.nodeId,
              executionId: event.data.executionId,
              timestamp: Date.now(),
            });
          });

          executor.on(NodeEventType.EXECUTION_COMPLETED, (event: any) => {
            const result = event.data.result;
            sendEvent('node:completed', {
              nodeId: event.data.nodeId,
              executionId: event.data.executionId,
              result: result
                ? {
                    success: result.success,
                    outputs: result.outputs instanceof Map
                      ? Object.fromEntries(result.outputs)
                      : result.outputs,
                    executionTime: result.executionTime,
                  }
                : null,
              timestamp: Date.now(),
            });
          });

          executor.on(NodeEventType.EXECUTION_FAILED, (event: any) => {
            sendEvent('node:failed', {
              nodeId: event.data.nodeId,
              executionId: event.data.executionId,
              error: event.data.error
                ? {
                    message: event.data.error.message,
                    nodeId: event.data.error.nodeId,
                    portId: event.data.error.portId,
                  }
                : null,
              timestamp: Date.now(),
            });
          });

          // Prepare initial inputs
          const initialInputs = new Map<string, Map<string, unknown>>();
          if (inputs) {
            for (const [nodeId, nodeInputs] of Object.entries(inputs)) {
              const inputMap = new Map<string, unknown>();
              for (const [portId, value] of Object.entries(nodeInputs)) {
                inputMap.set(portId, value);
              }
              initialInputs.set(nodeId, inputMap);
            }
          }

          // Execute graph
          const parallel = options?.parallel ?? false;
          let results: Map<string, any>;

          if (parallel) {
            results = await executor.executeParallel(initialInputs);
          } else {
            results = await executor.execute(initialInputs);
          }

          // Convert results to serializable format
          const resultsRecord: Record<string, any> = {};
          for (const [nodeId, result] of results.entries()) {
            let serializedOutputs: Record<string, any> | undefined;
            if (result.outputs) {
              if (result.outputs instanceof Map) {
                serializedOutputs = Object.fromEntries(result.outputs);
              } else if (typeof result.outputs === 'object' && result.outputs !== null) {
                serializedOutputs = result.outputs as Record<string, any>;
              }
            }

            resultsRecord[nodeId] = {
              success: result.success,
              outputs: serializedOutputs,
              error: result.error
                ? {
                    message: result.error.message,
                    nodeId: result.error.nodeId,
                    portId: result.error.portId,
                  }
                : undefined,
              executionTime: result.executionTime,
            };
          }

          const executionTime = Date.now() - startTime;

          // Send execution completed event
          sendEvent('execution:completed', {
            executionId,
            results: resultsRecord,
            executionTime,
            timestamp: Date.now(),
          });

          controller.close();
        } catch (error) {
          logger.error('Error in streaming execution:', error);
          sendEvent('execution:error', {
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    logger.error('Error in execute-stream route:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to start streaming execution',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

