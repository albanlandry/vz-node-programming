/**
 * Graph Execution Service
 * 
 * Client-side service for executing graphs via the API.
 * Handles communication with the inline execution endpoint.
 */

import type {
  GraphDefinition,
  ExecutionRequest,
  ExecutionResponse,
} from '../src/graph-management/types';
import type { GraphData } from '../store/graphStore';

/**
 * Graph Execution Service
 */
export class GraphExecutionService {
  /**
   * Execute a graph definition inline (without saving)
   * 
   * @param graph - Graph definition to execute
   * @param inputs - Optional input values for nodes
   * @param options - Execution options (parallel, timeout)
   * @returns Execution response with results
   */
  async executeGraph(
    graph: GraphDefinition,
    inputs?: Record<string, Record<string, unknown>>,
    options?: { parallel?: boolean; timeout?: number },
  ): Promise<ExecutionResponse> {
    try {
      const response = await fetch('/api/graphs/execute-inline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph,
          inputs,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}`,
        }));
        throw new Error(errorData.message || errorData.error || 'Execution failed');
      }

      const data = await response.json();
      return data.result as ExecutionResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to execute graph: ' + String(error));
    }
  }

  /**
   * Convert graph data from store to GraphDefinition format
   * 
   * @param graphData - Graph data from Zustand store
   * @param name - Optional graph name
   * @returns Graph definition ready for execution
   */
  convertToGraphDefinition(
    graphData: GraphData,
    name: string = 'Untitled Graph',
  ): GraphDefinition {
    return {
      id: `inline-${Date.now()}`,
      metadata: {
        id: `inline-${Date.now()}`,
        name,
        description: 'Inline execution graph',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodeCount: graphData.nodes.length,
        connectionCount: graphData.connections.length,
      },
      data: {
        nodes: graphData.nodes,
        connections: graphData.connections,
        viewport: graphData.viewport,
      },
    };
  }
}

/**
 * Singleton instance
 */
export const graphExecutionService = new GraphExecutionService();

