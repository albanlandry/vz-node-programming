import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  INode, 
  NodeId, 
  PortId, 
  ExecutionId, 
  ExecutionContext, 
  ExecutionResult, 
  Connection, 
  NodeEvent, 
  NodeEventType,
  NodeError
} from '../types';

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
  public async execute(initialInputs: Map<NodeId, Map<PortId, any>> = new Map()): Promise<Map<NodeId, ExecutionResult>> {
    const executionId = uuidv4();
    this.executionResults.clear();
    this.executingNodes.clear();
    
    try {
      // Build execution order based on dependencies
      const executionOrder = this.buildExecutionOrder();
      
      // Execute nodes in order
      for (const nodeId of executionOrder) {
        await this.executeNode(nodeId, executionId, initialInputs);
      }
      
      return new Map(this.executionResults);
    } catch (error) {
      this.emitEvent(NodeEventType.EXECUTION_FAILED, { 
        executionId, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute nodes in parallel where possible
   * Groups nodes into execution levels based on dependencies
   * Nodes in the same level have no dependencies on each other and can run in parallel
   */
  public async executeParallel(initialInputs: Map<NodeId, Map<PortId, any>> = new Map()): Promise<Map<NodeId, ExecutionResult>> {
    const executionId = uuidv4();
    this.executionResults.clear();
    this.executingNodes.clear();
    
    try {
      // Build execution levels for parallel execution
      const executionLevels = this.buildExecutionLevels();
      
      // Execute each level in parallel
      for (const level of executionLevels) {
        // Execute all nodes in this level concurrently
        const levelPromises = level.map(nodeId => 
          this.executeNode(nodeId, executionId, initialInputs)
        );
        
        // Wait for all nodes in this level to complete
        await Promise.all(levelPromises);
      }
      
      return new Map(this.executionResults);
    } catch (error) {
      this.emitEvent(NodeEventType.EXECUTION_FAILED, { 
        executionId, 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    nodeId: NodeId, 
    executionId: ExecutionId, 
    initialInputs: Map<NodeId, Map<PortId, any>>
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
      
      // Create execution context
      const context: ExecutionContext = {
        executionId,
        inputs,
        outputs: new Map(),
        metadata: new Map(),
        errorHandler: (error: NodeError) => {
          this.handleNodeError(error, nodeId);
        }
      };

      // Execute the node
      const result = await node.execute(context);
      
      // Store the result
      this.executionResults.set(nodeId, result);
      
      if (result.success) {
        this.emitEvent(NodeEventType.EXECUTION_COMPLETED, { 
          nodeId, 
          executionId, 
          result 
        });
      } else {
        this.emitEvent(NodeEventType.EXECUTION_FAILED, { 
          nodeId, 
          executionId, 
          error: result.error 
        });
      }
    } finally {
      this.executingNodes.delete(nodeId);
    }
  }

  /**
   * Gather inputs for a node from connected nodes
   */
  private gatherNodeInputs(
    nodeId: NodeId, 
    initialInputs: Map<NodeId, Map<PortId, any>>
  ): Map<PortId, any> {
    const inputs = new Map<PortId, any>();
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
        .filter(([_, level]) => level === i)
        .map(([nodeId, _]) => nodeId);
      
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
        `Type mismatch: cannot connect ${fromPort.dataType.name} to ${toPort.dataType.name}`
      );
    }
  }

  /**
   * Handle node execution errors
   */
  private handleNodeError(error: NodeError, nodeId: NodeId): void {
    console.error(`Node ${nodeId} execution error:`, error);
    // Could implement retry logic, circuit breakers, etc. here
  }

  /**
   * Emit a node event
   */
  private emitEvent(type: NodeEventType, data: any): void {
    const event: NodeEvent = {
      type,
      timestamp: new Date(),
      data
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