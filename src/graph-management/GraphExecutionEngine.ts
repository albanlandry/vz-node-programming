/**
 * Graph Execution Engine
 * 
 * Executes saved graphs using NodeExecutor
 */

import { NodeExecutor } from '../core/NodeExecutor';
import { NodeRegistry } from '../registry/NodeRegistry';
import { GraphSerializer } from '../serialization/GraphSerializer';
import { logger } from '../utils/Logger';
import { registerBuiltInNodes } from '../index';
import type {
  GraphDefinition,
  ExecutionRequest,
  ExecutionResponse,
  SerializedExecutionResult,
  ValidationResult,
} from './types';
import type { ExecutionResult, INode } from '../types';
import { NodeError } from '../types';
import type { GraphNode, GraphConnection } from '../../store/graphStore';

/**
 * Graph Execution Engine
 * Converts graph definitions to executable NodeExecutor instances
 */
export class GraphExecutionEngine {
  private registry: NodeRegistry;
  private serializer: GraphSerializer;

  constructor() {
    this.registry = NodeRegistry.getInstance();

    // Register built-in nodes if not already registered
    if (this.registry.getAllTypes().length === 0) {
      registerBuiltInNodes();
    }

    this.serializer = new GraphSerializer();
  }

  /**
   * Execute a graph
   */
  async execute(
    graph: GraphDefinition,
    request: ExecutionRequest = {},
  ): Promise<ExecutionResponse> {
    const startTime = Date.now();
    const logs: string[] = [];
    const errors: NodeError[] = [];

    try {
      // Validate graph
      const validation = this.validateGraph(graph);
      if (!validation.valid) {
        throw new Error(`Graph validation failed: ${validation.errors?.join(', ')}`);
      }

      logs.push(`Starting execution of graph: ${graph.metadata.name}`);
      logs.push(`Graph contains ${graph.data.nodes.length} nodes and ${graph.data.connections.length} connections`);

      // Build executor from graph
      const executor = await this.buildExecutor(graph);

      // Prepare initial inputs
      const initialInputs = new Map<string, Map<string, unknown>>();
      if (request.inputs) {
        for (const [nodeId, inputs] of Object.entries(request.inputs)) {
          const inputMap = new Map<string, unknown>();
          for (const [portId, value] of Object.entries(inputs)) {
            inputMap.set(portId, value);
          }
          initialInputs.set(nodeId, inputMap);
        }
      }

      // Execute graph
      const parallel = request.options?.parallel ?? false;
      logs.push(`Executing in ${parallel ? 'parallel' : 'sequential'} mode`);

      let results: Map<string, ExecutionResult>;
      if (parallel) {
        results = await executor.executeParallel(initialInputs);
      } else {
        results = await executor.execute(initialInputs);
      }

      // Convert results to record
      // Convert Map outputs to plain objects for JSON serialization
      const resultsRecord: Record<string, SerializedExecutionResult> = {};
      for (const [nodeId, result] of results.entries()) {
        // Convert Map outputs to plain object for JSON serialization
        let serializedOutputs: Record<string, any> | undefined;
        if (result.outputs) {
          if (result.outputs instanceof Map) {
            serializedOutputs = Object.fromEntries(result.outputs);
          } else if (typeof result.outputs === 'object' && result.outputs !== null) {
            // Already a plain object
            serializedOutputs = result.outputs as Record<string, any>;
          }
        }

        const convertedResult: SerializedExecutionResult = {
          success: result.success,
          outputs: serializedOutputs,
          error: result.error,
          executionTime: result.executionTime,
        };
        resultsRecord[nodeId] = convertedResult;
      }

      // Check for errors
      for (const result of results.values()) {
        if (!result.success && result.error) {
          errors.push(result.error);
        }
      }

      const executionTime = Date.now() - startTime;
      logs.push(`Execution completed in ${executionTime}ms`);

      return {
        success: errors.length === 0,
        results: resultsRecord,
        errors: errors.length > 0 ? errors : undefined,
        executionTime,
        logs,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const nodeError = error instanceof Error
        ? new NodeError(error.message, '', undefined, error)
        : new NodeError(String(error), '');

      errors.push(nodeError);
      logs.push(`Execution failed: ${nodeError.message}`);

      logger.error('Graph execution failed:', error);

      return {
        success: false,
        errors,
        executionTime,
        logs,
      };
    }
  }

  /**
   * Build NodeExecutor from graph definition
   */
  public async buildExecutor(graph: GraphDefinition): Promise<NodeExecutor> {
    const executor = new NodeExecutor();

    // Create nodes from graph definition
    const nodeMap = new Map<string, INode>();
    for (const graphNode of graph.data.nodes) {
      try {
        // Get node metadata from registry
        const metadata = this.registry.getMetadata(graphNode.type);
        if (!metadata) {
          throw new Error(`Node type not found in registry: ${graphNode.type}`);
        }

        // Create node instance using registry
        // Extract properties separately to avoid ID conflicts
        const { id, name, inputs, outputs, properties: graphProperties, ...otherProps } = graphNode;
        const node = this.registry.create(graphNode.type, {
          id: id, // Explicitly set ID from graph node
          name: name,
          inputs: inputs,
          outputs: outputs,
          ...otherProps, // Spread other properties (should not contain id, name, inputs, outputs, properties)
        });

        // Set properties on the node if they exist
        if (graphProperties && typeof graphProperties === 'object') {
          if ('setProperty' in node && typeof (node as { setProperty?: (key: string, value: unknown) => void }).setProperty === 'function') {
            // Call setProperty as a method to preserve 'this' context
            const nodeWithSetProperty = node as { setProperty: (key: string, value: unknown) => void };
            for (const [key, value] of Object.entries(graphProperties)) {
              nodeWithSetProperty.setProperty(key, value);
            }
            logger.debug(`Set ${Object.keys(graphProperties).length} properties on node ${node.id}`);
          }
        }

        // Verify node ID matches expected ID
        if (node.id !== graphNode.id) {
          logger.warn(`Node ID mismatch: expected ${graphNode.id}, got ${node.id}. Using expected ID.`);
          // This shouldn't happen, but if it does, we need to handle it
        }

        nodeMap.set(graphNode.id, node);
        executor.addNode(node);
        logger.debug(`Added node ${node.id} (${graphNode.type}) to executor`);
      } catch (error) {
        logger.error(`Failed to create node ${graphNode.id} (${graphNode.type}):`, error);
        throw new Error(`Failed to create node ${graphNode.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add connections
    // First, verify all nodes were added successfully
    const addedNodeIds = executor.getNodes().map(n => n.id);
    const expectedNodeIds = graph.data.nodes.map(n => n.id);
    const missingNodes = expectedNodeIds.filter(id => !addedNodeIds.includes(id));
    
    if (missingNodes.length > 0) {
      logger.error(`Some nodes were not added to executor. Missing: ${missingNodes.join(', ')}`);
      logger.error(`Expected nodes: ${expectedNodeIds.join(', ')}`);
      logger.error(`Added nodes: ${addedNodeIds.join(', ')}`);
      throw new Error(`Failed to add nodes: ${missingNodes.join(', ')}`);
    }

    for (const connection of graph.data.connections) {
      try {
        executor.addConnection({
          id: connection.id,
          fromNode: connection.fromNode,
          fromPort: connection.fromPort,
          toNode: connection.toNode,
          toPort: connection.toPort,
        });
        logger.debug(`Added connection ${connection.id}: ${connection.fromNode} -> ${connection.toNode}`);
      } catch (error) {
        // Log detailed error information
        const addedNodeIds = executor.getNodes().map(n => n.id);
        logger.error(`Failed to add connection ${connection.id}:`, error);
        logger.error(`Connection: ${connection.fromNode} -> ${connection.toNode}`);
        logger.error(`Available nodes: ${addedNodeIds.join(', ')}`);
        throw new Error(`Failed to add connection: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return executor;
  }

  /**
   * Validate graph for execution
   */
  private validateGraph(graph: GraphDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if graph has nodes
    if (!graph.data.nodes || graph.data.nodes.length === 0) {
      errors.push('Graph must have at least one node');
    }

    // Check if all node types exist in registry
    for (const node of graph.data.nodes) {
      const metadata = this.registry.getMetadata(node.type);
      if (!metadata) {
        errors.push(`Node type not found in registry: ${node.type}`);
      }

      if (!this.registry.isRegistered(node.type)) {
        errors.push(`Node type not registered: ${node.type}`);
      }
    }

    // Check if connections reference valid nodes
    const nodeIds = new Set(graph.data.nodes.map((n) => n.id));
    for (const conn of graph.data.connections) {
      if (!nodeIds.has(conn.fromNode)) {
        errors.push(`Connection references non-existent node: ${conn.fromNode}`);
      }
      if (!nodeIds.has(conn.toNode)) {
        errors.push(`Connection references non-existent node: ${conn.toNode}`);
      }
    }

    // Check for cycles (basic check)
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recStack.add(nodeId);

      const outgoing = graph.data.connections.filter((c) => c.fromNode === nodeId);
      for (const conn of outgoing) {
        if (hasCycle(conn.toNode)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of graph.data.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          warnings.push('Graph contains cycles (may cause issues in sequential execution)');
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

