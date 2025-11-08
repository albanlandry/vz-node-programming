import { EventEmitter } from 'events';

import { v4 as uuidv4 } from 'uuid';

import {
  INode,
  IInteractiveNode,
  NodeId,
  PortId,
  ExecutionId,
  ExecutionContext,
  ExecutionResult,
  Connection,
  NodeEvent,
  NodeEventType,
  NodeError,
} from '../types';
import { logger } from '../utils/Logger';
import { InteractiveExecutionContext } from './InteractiveExecutionContext';
import { ExecutionController, type ExecutionOptions } from './ExecutionController';

/**
 * Node execution engine that manages the execution of connected nodes
 * Supports async execution, error propagation, and event handling
 */
export class NodeExecutor extends EventEmitter {
  private nodes: Map<NodeId, INode> = new Map();
  private connections: Map<string, Connection> = new Map();
  private executionQueue: NodeId[] = [];
  private executingNodes: Set<NodeId> = new Set();
  private executionResults: Map<NodeId, ExecutionResult> = new Map();
  private interactiveContexts: Map<NodeId, InteractiveExecutionContext> = new Map();
  private pausedNodes: Set<NodeId> = new Set();
  private executionController?: ExecutionController;

  constructor() {
    super();
  }

  /**
   * Add a node to the executor
   */
  public addNode(node: INode): void {
    if (!node.validate()) {
      throw new Error(`Node ${node.id} failed validation`);
    }

    this.nodes.set(node.id, node);
    this.emitEvent(NodeEventType.NODE_ADDED, { node });
  }

  /**
   * Remove a node from the executor
   */
  public removeNode(nodeId: NodeId): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Remove all connections involving this node
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => conn.fromNode === nodeId || conn.toNode === nodeId);

    connectionsToRemove.forEach(conn => this.removeConnection(conn.id));

    this.nodes.delete(nodeId);
    this.emitEvent(NodeEventType.NODE_REMOVED, { nodeId });
  }

  /**
   * Add a connection between two ports
   */
  public addConnection(connection: Connection): void {
    // Validate connection
    this.validateConnection(connection);

    this.connections.set(connection.id, connection);
    this.emitEvent(NodeEventType.CONNECTION_ADDED, { connection });
  }

  /**
   * Remove a connection
   */
  public removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    this.connections.delete(connectionId);
    this.emitEvent(NodeEventType.CONNECTION_REMOVED, { connectionId });
  }

  /**
   * Execute all nodes in the correct order based on dependencies (sequential)
   */
  public async execute(
    initialInputs: Map<NodeId, Map<PortId, unknown>> = new Map(),
    options: ExecutionOptions = {},
  ): Promise<Map<NodeId, ExecutionResult>> {
    const executionId = uuidv4();
    this.executionResults.clear();
    this.executingNodes.clear();

    // Create execution controller
    this.executionController = new ExecutionController(options);

    try {
      // Check if already cancelled
      if (this.executionController.isCancelled()) {
        throw new Error('Execution cancelled before start');
      }

      // Build execution order based on dependencies
      const executionOrder = this.buildExecutionOrder();

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        // Check for cancellation
        if (this.executionController.isCancelled()) {
          this.emitEvent(NodeEventType.EXECUTION_CANCELLED, {
            executionId,
            nodeId,
          });
          throw new Error('Execution cancelled');
        }

        await this.executeNode(nodeId, executionId, initialInputs, options.nodeTimeout);
      }

      // Cleanup
      this.executionController.cleanup();
      this.executionController = undefined;

      return new Map(this.executionResults);
    } catch (error) {
      // Cleanup on error
      if (this.executionController) {
        this.executionController.cleanup();
        this.executionController = undefined;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        this.emitEvent(NodeEventType.EXECUTION_TIMEOUT, {
          executionId,
          error: errorMessage,
        });
      } else if (errorMessage.includes('cancelled') || errorMessage.includes('Cancelled')) {
        this.emitEvent(NodeEventType.EXECUTION_CANCELLED, {
          executionId,
          error: errorMessage,
        });
      } else {
        this.emitEvent(NodeEventType.EXECUTION_FAILED, {
          executionId,
          error: errorMessage,
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute nodes in parallel where possible
   * Groups nodes into execution levels based on dependencies
   * Nodes in the same level have no dependencies on each other and can run in parallel
   */
  public async executeParallel(
    initialInputs: Map<NodeId, Map<PortId, unknown>> = new Map(),
    options: ExecutionOptions = {},
  ): Promise<Map<NodeId, ExecutionResult>> {
    const executionId = uuidv4();
    this.executionResults.clear();
    this.executingNodes.clear();

    // Create execution controller
    this.executionController = new ExecutionController(options);

    try {
      // Check if already cancelled
      if (this.executionController.isCancelled()) {
        throw new Error('Execution cancelled before start');
      }

      // Build execution levels for parallel execution
      const executionLevels = this.buildExecutionLevels();

      // Execute each level in parallel
      for (const level of executionLevels) {
        // Check for cancellation
        if (this.executionController.isCancelled()) {
          this.emitEvent(NodeEventType.EXECUTION_CANCELLED, {
            executionId,
          });
          throw new Error('Execution cancelled');
        }

        // Execute all nodes in this level concurrently
        const levelPromises = level.map(nodeId =>
          this.executeNode(nodeId, executionId, initialInputs, options.nodeTimeout),
        );

        // Wait for all nodes in this level to complete
        await Promise.all(levelPromises);
      }

      // Cleanup
      this.executionController.cleanup();
      this.executionController = undefined;

      return new Map(this.executionResults);
    } catch (error) {
      // Cleanup on error
      if (this.executionController) {
        this.executionController.cleanup();
        this.executionController = undefined;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        this.emitEvent(NodeEventType.EXECUTION_TIMEOUT, {
          executionId,
          error: errorMessage,
        });
      } else if (errorMessage.includes('cancelled') || errorMessage.includes('Cancelled')) {
        this.emitEvent(NodeEventType.EXECUTION_CANCELLED, {
          executionId,
          error: errorMessage,
        });
      } else {
        this.emitEvent(NodeEventType.EXECUTION_FAILED, {
          executionId,
          error: errorMessage,
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    nodeId: NodeId,
    executionId: ExecutionId,
    initialInputs: Map<NodeId, Map<PortId, unknown>>,
    nodeTimeout?: number,
  ): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    this.executingNodes.add(nodeId);
    this.emitEvent(NodeEventType.EXECUTION_STARTED, { nodeId, executionId });

    try {
      // Gather inputs from connected nodes
      const inputs = this.gatherNodeInputs(nodeId, initialInputs);

      // Create base execution context with abort signal and timeout
      const baseContext: ExecutionContext = {
        executionId,
        inputs,
        outputs: new Map(),
        metadata: new Map(),
        abortSignal: this.executionController?.getSignal(),
        timeout: nodeTimeout,
        errorHandler: (error: NodeError) => {
          this.handleNodeError(error, nodeId);
        },
      };

      // Set node timeout if provided
      if (nodeTimeout && this.executionController) {
        this.executionController.setNodeTimeout(nodeId, nodeTimeout, () => {
          this.emitEvent(NodeEventType.EXECUTION_TIMEOUT, {
            nodeId,
            executionId,
          });
        });
      }

      // Check if node is interactive
      const isInteractive = this.isInteractiveNode(node);
      let result: ExecutionResult;

      // Check for cancellation before execution
      if (this.executionController?.isCancelled()) {
        throw new Error('Execution cancelled');
      }

      if (isInteractive) {
        // Create interactive context
        const interactiveContext = new InteractiveExecutionContext(
          baseContext,
          this,
          nodeId,
        );
        
        // Store interactive context for potential user input
        this.interactiveContexts.set(nodeId, interactiveContext);

        // Execute with interactive context if method exists
        const interactiveNode = node as IInteractiveNode;
        if (interactiveNode.executeInteractive) {
          // Mark node as potentially pausable
          this.pausedNodes.add(nodeId);
          
          // Execute with timeout if provided
          if (nodeTimeout) {
            result = await ExecutionController.executeWithTimeout(
              () => interactiveNode.executeInteractive(interactiveContext),
              nodeTimeout,
              baseContext.abortSignal,
            );
          } else {
            result = await interactiveNode.executeInteractive(interactiveContext);
          }
        } else {
          // Fallback to regular execute if executeInteractive not implemented
          if (nodeTimeout) {
            result = await ExecutionController.executeWithTimeout(
              () => node.execute(baseContext),
              nodeTimeout,
              baseContext.abortSignal,
            );
          } else {
            result = await node.execute(baseContext);
          }
        }
      } else {
        // Execute normally with timeout if provided
        if (nodeTimeout) {
          result = await ExecutionController.executeWithTimeout(
            () => node.execute(baseContext),
            nodeTimeout,
            baseContext.abortSignal,
          );
        } else {
          result = await node.execute(baseContext);
        }
      }

      // Clear node timeout on success
      if (this.executionController) {
        this.executionController.clearNodeTimeout(nodeId);
      }

      // Store the result
      this.executionResults.set(nodeId, result);

      // Clean up interactive context
      this.interactiveContexts.delete(nodeId);
      this.pausedNodes.delete(nodeId);

      if (result.success) {
        this.emitEvent(NodeEventType.EXECUTION_COMPLETED, {
          nodeId,
          executionId,
          result,
        });
      } else {
        this.emitEvent(NodeEventType.EXECUTION_FAILED, {
          nodeId,
          executionId,
          error: result.error,
        });
      }
    } catch (error) {
      // Clean up on error
      this.interactiveContexts.delete(nodeId);
      this.pausedNodes.delete(nodeId);
      if (this.executionController) {
        this.executionController.clearNodeTimeout(nodeId);
      }
      throw error;
    } finally {
      this.executingNodes.delete(nodeId);
    }
  }

  /**
   * Cancel ongoing execution
   */
  public cancel(reason?: string): void {
    if (this.executionController) {
      this.executionController.cancel(reason || 'Execution cancelled by user');
    }
  }

  /**
   * Check if execution is cancelled
   */
  public isCancelled(): boolean {
    return this.executionController?.isCancelled() ?? false;
  }

  /**
   * Check if a node is interactive
   */
  private isInteractiveNode(node: INode): boolean {
    const interactiveNode = node as IInteractiveNode;
    return interactiveNode.isInteractive === true;
  }

  /**
   * Provide user input to a paused interactive node
   * @param nodeId - The ID of the node waiting for input
   * @param value - The user input value
   */
  public provideUserInput(nodeId: NodeId, value: unknown): void {
    const context = this.interactiveContexts.get(nodeId);
    if (context) {
      context.provideUserInput(value);
      this.pausedNodes.delete(nodeId);
    } else {
      logger.warn(`No interactive context found for node ${nodeId}`);
    }
  }

  /**
   * Cancel user input request for a paused interactive node
   * @param nodeId - The ID of the node waiting for input
   * @param error - Optional error to pass to the node
   */
  public cancelUserInput(nodeId: NodeId, error?: Error): void {
    const context = this.interactiveContexts.get(nodeId);
    if (context) {
      context.cancelUserInput(error);
      this.pausedNodes.delete(nodeId);
    } else {
      logger.warn(`No interactive context found for node ${nodeId}`);
    }
  }

  /**
   * Get list of nodes currently paused waiting for user input
   */
  public getPausedNodes(): NodeId[] {
    return Array.from(this.pausedNodes);
  }

  /**
   * Check if a node is currently paused
   */
  public isNodePaused(nodeId: NodeId): boolean {
    return this.pausedNodes.has(nodeId);
  }

  /**
   * Gather inputs for a node from connected nodes
   */
  private gatherNodeInputs(
    nodeId: NodeId,
    initialInputs: Map<NodeId, Map<PortId, unknown>>,
  ): Map<PortId, unknown> {
    const inputs = new Map<PortId, unknown>();
    const node = this.nodes.get(nodeId);

    if (!node) {
      return inputs;
    }

    // Add initial inputs if provided
    const nodeInitialInputs = initialInputs.get(nodeId);
    if (nodeInitialInputs) {
      nodeInitialInputs.forEach((value, portId) => {
        inputs.set(portId, value);
      });
    }

    // Gather inputs from connected nodes
    const incomingConnections = Array.from(this.connections.values())
      .filter(conn => conn.toNode === nodeId);

    for (const connection of incomingConnections) {
      const sourceResult = this.executionResults.get(connection.fromNode);
      if (sourceResult && sourceResult.success && sourceResult.outputs) {
        const value = sourceResult.outputs.get(connection.fromPort);
        if (value !== undefined) {
          inputs.set(connection.toPort, value);
        }
      }
    }

    // Use node properties as default values for unconnected inputs
    // Only use properties if the input is not already set (from connection or initial input)
    if ('getProperty' in node && typeof (node as { getProperty?: (key: string) => unknown }).getProperty === 'function') {
      // Call getProperty as a method to preserve 'this' context
      const nodeWithGetProperty = node as { getProperty: (key: string) => unknown };
      for (const inputPort of node.inputs) {
        // Skip if input already has a value
        if (inputs.has(inputPort.id)) {
          continue;
        }

        // Check if there's a property with the same name as the input port
        const propertyValue = nodeWithGetProperty.getProperty(inputPort.id);
        if (propertyValue !== undefined) {
          inputs.set(inputPort.id, propertyValue);
        }
      }
    }

    return inputs;
  }

  /**
   * Build execution order based on node dependencies
   */
  private buildExecutionOrder(): NodeId[] {
    const visited = new Set<NodeId>();
    const visiting = new Set<NodeId>();
    const order: NodeId[] = [];

    const visit = (nodeId: NodeId): void => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node ${nodeId}`);
      }

      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      // Visit dependencies first
      const dependencies = this.getNodeDependencies(nodeId);
      for (const dep of dependencies) {
        visit(dep);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Visit all nodes
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return order;
  }

  /**
   * Build execution levels for parallel execution
   * Groups nodes into levels where all nodes in a level can execute in parallel
   */
  private buildExecutionLevels(): NodeId[][] {
    const levels: NodeId[][] = [];
    const nodeLevels = new Map<NodeId, number>();
    const visited = new Set<NodeId>();

    // Calculate the level for each node
    const calculateLevel = (nodeId: NodeId): number => {
      if (nodeLevels.has(nodeId)) {
        return nodeLevels.get(nodeId)!;
      }

      if (visited.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node ${nodeId}`);
      }

      visited.add(nodeId);

      const dependencies = this.getNodeDependencies(nodeId);

      if (dependencies.length === 0) {
        // No dependencies, can execute at level 0
        nodeLevels.set(nodeId, 0);
        return 0;
      }

      // Node's level is 1 + max level of its dependencies
      const maxDepLevel = Math.max(...dependencies.map(dep => calculateLevel(dep)));
      const level = maxDepLevel + 1;
      nodeLevels.set(nodeId, level);

      visited.delete(nodeId);
      return level;
    };

    // Calculate levels for all nodes
    for (const nodeId of this.nodes.keys()) {
      calculateLevel(nodeId);
    }

    // Group nodes by level
    const maxLevel = Math.max(...Array.from(nodeLevels.values()));
    for (let i = 0; i <= maxLevel; i++) {
      const nodesAtLevel = Array.from(nodeLevels.entries())
        .filter(([, level]) => level === i)
        .map(([nodeId]) => nodeId);

      if (nodesAtLevel.length > 0) {
        levels.push(nodesAtLevel);
      }
    }

    return levels;
  }

  /**
   * Get dependencies for a node (nodes that provide inputs to this node)
   */
  private getNodeDependencies(nodeId: NodeId): NodeId[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.toNode === nodeId)
      .map(conn => conn.fromNode);
  }

  /**
   * Validate a connection
   */
  private validateConnection(connection: Connection): void {
    const fromNode = this.nodes.get(connection.fromNode);
    const toNode = this.nodes.get(connection.toNode);

    if (!fromNode) {
      throw new Error(`Source node ${connection.fromNode} not found`);
    }

    if (!toNode) {
      throw new Error(`Target node ${connection.toNode} not found`);
    }

    const fromPort = fromNode.outputs.find(port => port.id === connection.fromPort);
    const toPort = toNode.inputs.find(port => port.id === connection.toPort);

    if (!fromPort) {
      throw new Error(`Output port ${connection.fromPort} not found on node ${connection.fromNode}`);
    }

    if (!toPort) {
      throw new Error(`Input port ${connection.toPort} not found on node ${connection.toNode}`);
    }

    // Check for type compatibility
    if (fromPort.dataType.name !== toPort.dataType.name &&
        fromPort.dataType.name !== 'any' &&
        toPort.dataType.name !== 'any') {
      throw new Error(
        `Type mismatch: cannot connect ${fromPort.dataType.name} to ${toPort.dataType.name}`,
      );
    }

    // Check for circular dependency (basic check - will be fully validated during execution)
    // This is a simple check to catch obvious cycles at connection time
    if (this.wouldCreateCycle(connection.fromNode, connection.toNode)) {
      throw new Error(`Circular dependency detected: cannot connect ${connection.fromNode} to ${connection.toNode}`);
    }
  }

  /**
   * Check if adding a connection would create a cycle
   */
  private wouldCreateCycle(fromNode: NodeId, toNode: NodeId): boolean {
    // If we're connecting toNode -> fromNode, check if fromNode can reach toNode
    const visited = new Set<NodeId>();
    const queue: NodeId[] = [toNode];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fromNode) {
        return true; // Cycle detected
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      // Get all nodes that current depends on
      const dependencies = this.getNodeDependencies(current);
      queue.push(...dependencies);
    }

    return false;
  }

  /**
   * Handle node execution errors
   */
  private handleNodeError(error: NodeError, nodeId: NodeId): void {
    logger.error(`Node ${nodeId} execution error:`, error);
    // Could implement retry logic, circuit breakers, etc. here
  }

  /**
   * Emit a node event
   */
  private emitEvent(type: NodeEventType, data: any): void {
    const event: NodeEvent = {
      type,
      timestamp: new Date(),
      data,
      // Spread data properties onto event for easier access in tests/consumers
      ...(typeof data === 'object' && data !== null ? data : {}),
    };
    this.emit(type, event);
  }

  /**
   * Get all nodes
   */
  public getNodes(): INode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all connections
   */
  public getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get execution results
   */
  public getExecutionResults(): Map<NodeId, ExecutionResult> {
    return new Map(this.executionResults);
  }
}
