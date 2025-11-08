/**
 * Debug Executor
 * 
 * Wraps NodeExecutor with debugging capabilities
 */

import { NodeExecutor, ExecutionOptions } from '../core/NodeExecutor';
import { NodeId, ExecutionId, ExecutionContext, ExecutionResult, NodeError } from '../types';
import { Debugger, DebugOptions } from './Debugger';
import { VariableSnapshot, ExecutionSnapshot } from './types';
import { logger } from '../utils/Logger';

/**
 * NodeExecutor wrapper with debugging support
 */
export class DebugExecutor {
  private executor: NodeExecutor;
  private debugger: Debugger;
  private stepNumber: number = 0;
  private nodeStates: Map<NodeId, {
    status: 'idle' | 'queued' | 'executing' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    executionTime?: number;
    error?: NodeError;
  }> = new Map();

  constructor(executor: NodeExecutor, debugOptions: DebugOptions = {}) {
    this.executor = executor;
    this.debugger = new Debugger(debugOptions);

    // Forward executor events
    this.executor.on('*', (...args) => {
      // Forward all events
    });

    // Integrate debugging hooks
    this.setupDebuggingHooks();
  }

  /**
   * Get the underlying executor
   */
  public getExecutor(): NodeExecutor {
    return this.executor;
  }

  /**
   * Get the debugger
   */
  public getDebugger(): Debugger {
    return this.debugger;
  }

  /**
   * Setup debugging hooks
   */
  private setupDebuggingHooks(): void {
    // Listen to executor events
    this.executor.on('execution_started', (data: { nodeId: NodeId; executionId: ExecutionId }) => {
      if (!this.debugger.isEnabled()) {
        return;
      }

      const { nodeId, executionId } = data;
      this.debugger.setCurrentExecution(executionId);
      
      // Update node state
      this.nodeStates.set(nodeId, {
        status: 'executing',
        startTime: Date.now(),
      });
    });

    this.executor.on('execution_completed', (data: { nodeId: NodeId; executionId: ExecutionId; result: ExecutionResult }) => {
      if (!this.debugger.isEnabled()) {
        return;
      }

      const { nodeId, result } = data;
      
      // Update node state
      const state = this.nodeStates.get(nodeId);
      if (state) {
        state.status = 'completed';
        state.endTime = Date.now();
        state.executionTime = result.executionTime;
      }

      // Create snapshot
      this.createSnapshot(data.executionId, nodeId);
    });

    this.executor.on('execution_failed', (data: { nodeId: NodeId; executionId: ExecutionId; error: NodeError }) => {
      if (!this.debugger.isEnabled()) {
        return;
      }

      const { nodeId, error } = data;
      
      // Update node state
      const state = this.nodeStates.get(nodeId);
      if (state) {
        state.status = 'failed';
        state.endTime = Date.now();
        state.error = error;
      }

      // Create snapshot
      this.createSnapshot(data.executionId, nodeId);
    });
  }

  /**
   * Create execution snapshot
   */
  private createSnapshot(executionId: ExecutionId, currentNodeId?: NodeId): void {
    if (!this.debugger.isEnabled()) {
      return;
    }

    // Collect variable snapshots
    const variableSnapshots = new Map<NodeId, VariableSnapshot>();
    
    // Collect results
    const results = new Map<NodeId, ExecutionResult>();
    // Note: In a real implementation, we'd get these from the executor

    // Create snapshot
    this.debugger.createSnapshot(
      executionId,
      new Map(this.nodeStates),
      variableSnapshots,
      results,
      currentNodeId,
      this.stepNumber++,
    );
  }

  /**
   * Execute with debugging support
   */
  public async execute(
    initialInputs: Map<NodeId, Map<string, unknown>> = new Map(),
    options: ExecutionOptions = {},
  ): Promise<void> {
    if (!this.debugger.isEnabled()) {
      return this.executor.execute(initialInputs, options);
    }

    // Reset state
    this.stepNumber = 0;
    this.nodeStates.clear();

    // Execute with debugging
    try {
      await this.executor.execute(initialInputs, options);
    } catch (error) {
      logger.error('Execution failed:', error);
      throw error;
    }
  }

  /**
   * Delegate all other methods to executor
   */
  public addNode(node: any): void {
    this.executor.addNode(node);
  }

  public removeNode(nodeId: NodeId): void {
    this.executor.removeNode(nodeId);
  }

  public addConnection(connection: any): void {
    this.executor.addConnection(connection);
  }

  public removeConnection(connectionId: string): void {
    this.executor.removeConnection(connectionId);
  }

  public cancel(reason?: string): void {
    this.executor.cancel(reason);
  }

  public isCancelled(): boolean {
    return this.executor.isCancelled();
  }
}

