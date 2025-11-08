/**
 * Enhanced Debugger
 * 
 * Main debugging orchestrator that coordinates all debugging features
 */

import { EventEmitter } from 'events';
import { NodeId, ExecutionId, ExecutionContext, ExecutionResult, NodeError } from '../types';
import {
  DebuggerState,
  DebugOptions,
  Breakpoint,
  WatchExpression,
  ExecutionSnapshot,
  VariableSnapshot,
  DebugEvent,
  DebugEventType,
  BreakpointType,
} from './types';
import { BreakpointManager } from './BreakpointManager';
import { VariableInspector } from './VariableInspector';
import { WatchExpressionManager } from './WatchExpressionManager';
import { ExecutionHistory } from './ExecutionHistory';
import { ExecutionHistoryEntry } from './types';
import { logger } from '../utils/Logger';

/**
 * Enhanced debugger for node execution
 */
export class Debugger extends EventEmitter {
  private state: DebuggerState;
  private breakpointManager: BreakpointManager;
  private variableInspector: VariableInspector;
  private watchExpressionManager: WatchExpressionManager;
  private executionHistory: ExecutionHistory;
  private options: DebugOptions;

  constructor(options: DebugOptions = {}) {
    super();

    this.options = {
      enabled: false,
      createSnapshots: true,
      maxSnapshots: 1000,
      maxHistoryEntries: 100,
      evaluateWatches: true,
      breakOnError: false,
      ...options,
    };

    this.state = {
      enabled: this.options.enabled || false,
      paused: false,
      breakpoints: new Map(),
      watchExpressions: new Map(),
      history: [],
      snapshots: new Map(),
    };

    this.breakpointManager = new BreakpointManager();
    this.variableInspector = new VariableInspector();
    this.watchExpressionManager = new WatchExpressionManager();
    this.executionHistory = new ExecutionHistory();

    // Configure history limits
    this.executionHistory.configure({
      maxHistoryEntries: this.options.maxHistoryEntries,
      maxSnapshots: this.options.maxSnapshots,
    });

    // Forward events from sub-managers
    this.breakpointManager.on('breakpointHit', (event: DebugEvent) => {
      this.emit('debugEvent', event);
    });

    this.watchExpressionManager.on('watchChanged', (event: DebugEvent) => {
      this.emit('debugEvent', event);
    });
  }

  /**
   * Enable/disable debugging
   */
  public setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    this.options.enabled = enabled;
    logger.debug(`Debugging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if debugging is enabled
   */
  public isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Pause execution
   */
  public pause(): void {
    if (!this.state.enabled) {
      return;
    }

    this.state.paused = true;
    this.emit('debugEvent', {
      type: DebugEventType.EXECUTION_PAUSED,
      timestamp: Date.now(),
      data: { executionId: this.state.currentExecutionId },
    } as DebugEvent);
    logger.debug('Execution paused');
  }

  /**
   * Resume execution
   */
  public resume(): void {
    if (!this.state.enabled) {
      return;
    }

    this.state.paused = false;
    this.emit('debugEvent', {
      type: DebugEventType.EXECUTION_RESUMED,
      timestamp: Date.now(),
      data: { executionId: this.state.currentExecutionId },
    } as DebugEvent);
    logger.debug('Execution resumed');
  }

  /**
   * Check if execution is paused
   */
  public isPaused(): boolean {
    return this.state.paused;
  }

  /**
   * Wait for resume if paused
   */
  public async waitForResume(): Promise<void> {
    if (!this.state.paused) {
      return;
    }

    return new Promise((resolve) => {
      const checkResume = () => {
        if (!this.state.paused) {
          resolve();
        } else {
          setTimeout(checkResume, 100);
        }
      };
      checkResume();
    });
  }

  /**
   * Add breakpoint
   */
  public addBreakpoint(breakpoint: Breakpoint): void {
    this.breakpointManager.addBreakpoint(breakpoint);
    this.state.breakpoints.set(breakpoint.id, breakpoint);
  }

  /**
   * Remove breakpoint
   */
  public removeBreakpoint(breakpointId: string): boolean {
    const removed = this.breakpointManager.removeBreakpoint(breakpointId);
    if (removed) {
      this.state.breakpoints.delete(breakpointId);
    }
    return removed;
  }

  /**
   * Get all breakpoints
   */
  public getBreakpoints(): Breakpoint[] {
    return this.breakpointManager.getAllBreakpoints();
  }

  /**
   * Add watch expression
   */
  public addWatchExpression(watch: WatchExpression): void {
    this.watchExpressionManager.addWatchExpression(watch);
    this.state.watchExpressions.set(watch.id, watch);
  }

  /**
   * Remove watch expression
   */
  public removeWatchExpression(watchId: string): boolean {
    const removed = this.watchExpressionManager.removeWatchExpression(watchId);
    if (removed) {
      this.state.watchExpressions.delete(watchId);
    }
    return removed;
  }

  /**
   * Get all watch expressions
   */
  public getWatchExpressions(): WatchExpression[] {
    return this.watchExpressionManager.getAllWatchExpressions();
  }

  /**
   * Check if should break before execution
   */
  public async checkBreakpointBefore(
    nodeId: NodeId,
    context: ExecutionContext,
  ): Promise<boolean> {
    if (!this.state.enabled) {
      return false;
    }

    const breakResult = await this.breakpointManager.shouldBreak(
      nodeId,
      BreakpointType.BEFORE_EXECUTE,
      context,
    );

    if (breakResult.shouldBreak) {
      this.pause();
      this.emit('debugEvent', {
        type: DebugEventType.BREAKPOINT_HIT,
        timestamp: Date.now(),
        data: {
          nodeId,
          breakpoint: breakResult.breakpoint,
          reason: breakResult.reason,
        },
      } as DebugEvent);
      return true;
    }

    return false;
  }

  /**
   * Check if should break after execution
   */
  public async checkBreakpointAfter(
    nodeId: NodeId,
    context: ExecutionContext,
    result: ExecutionResult,
  ): Promise<boolean> {
    if (!this.state.enabled) {
      return false;
    }

    const breakResult = await this.breakpointManager.shouldBreak(
      nodeId,
      BreakpointType.AFTER_EXECUTE,
      context,
      result,
    );

    if (breakResult.shouldBreak) {
      this.pause();
      this.emit('debugEvent', {
        type: DebugEventType.BREAKPOINT_HIT,
        timestamp: Date.now(),
        data: {
          nodeId,
          breakpoint: breakResult.breakpoint,
          reason: breakResult.reason,
        },
      } as DebugEvent);
      return true;
    }

    return false;
  }

  /**
   * Check if should break on error
   */
  public async checkBreakpointOnError(
    nodeId: NodeId,
    context: ExecutionContext,
    error: NodeError,
  ): Promise<boolean> {
    if (!this.state.enabled) {
      return false;
    }

    if (this.options.breakOnError) {
      this.pause();
      return true;
    }

    const breakResult = await this.breakpointManager.shouldBreak(
      nodeId,
      BreakpointType.ON_ERROR,
      context,
      undefined,
      error,
    );

    if (breakResult.shouldBreak) {
      this.pause();
      this.emit('debugEvent', {
        type: DebugEventType.BREAKPOINT_HIT,
        timestamp: Date.now(),
        data: {
          nodeId,
          breakpoint: breakResult.breakpoint,
          reason: breakResult.reason,
          error,
        },
      } as DebugEvent);
      return true;
    }

    return false;
  }

  /**
   * Inspect variables for a node
   */
  public inspectVariables(nodeId: NodeId, context: ExecutionContext): VariableSnapshot {
    return this.variableInspector.inspectContext(context, nodeId);
  }

  /**
   * Evaluate watch expressions
   */
  public async evaluateWatches(
    context: ExecutionContext,
    result?: ExecutionResult,
    error?: NodeError,
  ): Promise<Map<string, { value: any; changed: boolean }>> {
    if (!this.options.evaluateWatches) {
      return new Map();
    }

    return this.watchExpressionManager.evaluateAll(context, result, error);
  }

  /**
   * Create execution snapshot
   */
  public createSnapshot(
    executionId: ExecutionId,
    nodeStates: Map<NodeId, {
      status: 'idle' | 'queued' | 'executing' | 'completed' | 'failed';
      startTime?: number;
      endTime?: number;
      executionTime?: number;
      error?: NodeError;
    }>,
    variableSnapshots: Map<NodeId, VariableSnapshot>,
    results: Map<NodeId, ExecutionResult>,
    currentNodeId?: NodeId,
    stepNumber: number = 0,
  ): ExecutionSnapshot | undefined {
    if (!this.options.createSnapshots) {
      return undefined;
    }

    const snapshot = this.executionHistory.createSnapshot(
      executionId,
      nodeStates,
      variableSnapshots,
      results,
      currentNodeId,
      stepNumber,
    );

    this.state.snapshots.set(snapshot.id, snapshot);
    this.state.currentSnapshot = snapshot;

    this.emit('debugEvent', {
      type: DebugEventType.SNAPSHOT_CREATED,
      timestamp: Date.now(),
      data: { snapshot },
    } as DebugEvent);

    return snapshot;
  }

  /**
   * Get current snapshot
   */
  public getCurrentSnapshot(): ExecutionSnapshot | undefined {
    return this.state.currentSnapshot;
  }

  /**
   * Get snapshot by ID
   */
  public getSnapshot(snapshotId: string): ExecutionSnapshot | undefined {
    return this.executionHistory.getSnapshot(snapshotId);
  }

  /**
   * Get snapshots for execution
   */
  public getSnapshotsForExecution(executionId: ExecutionId): ExecutionSnapshot[] {
    return this.executionHistory.getSnapshotsForExecution(executionId);
  }

  /**
   * Navigate to previous snapshot (time-travel backward)
   */
  public stepBackward(): ExecutionSnapshot | undefined {
    if (!this.state.currentSnapshot) {
      return undefined;
    }

    const previous = this.executionHistory.getPreviousSnapshot(this.state.currentSnapshot);
    if (previous) {
      this.state.currentSnapshot = previous;
      this.emit('debugEvent', {
        type: DebugEventType.STEP_COMPLETE,
        timestamp: Date.now(),
        data: { snapshot: previous, direction: 'backward' },
      } as DebugEvent);
    }

    return previous;
  }

  /**
   * Navigate to next snapshot (time-travel forward)
   */
  public stepForward(): ExecutionSnapshot | undefined {
    if (!this.state.currentSnapshot) {
      return undefined;
    }

    const next = this.executionHistory.getNextSnapshot(this.state.currentSnapshot);
    if (next) {
      this.state.currentSnapshot = next;
      this.emit('debugEvent', {
        type: DebugEventType.STEP_COMPLETE,
        timestamp: Date.now(),
        data: { snapshot: next, direction: 'forward' },
      } as DebugEvent);
    }

    return next;
  }

  /**
   * Navigate to specific step
   */
  public navigateToStep(executionId: ExecutionId, stepNumber: number): ExecutionSnapshot | undefined {
    const snapshot = this.executionHistory.getSnapshotAtStep(executionId, stepNumber);
    if (snapshot) {
      this.state.currentSnapshot = snapshot;
      this.emit('debugEvent', {
        type: DebugEventType.STEP_COMPLETE,
        timestamp: Date.now(),
        data: { snapshot, stepNumber },
      } as DebugEvent);
    }
    return snapshot;
  }

  /**
   * Set current execution ID
   */
  public setCurrentExecution(executionId: ExecutionId): void {
    this.state.currentExecutionId = executionId;
  }

  /**
   * Get execution history
   */
  public getHistory(): ExecutionHistoryEntry[] {
    return this.executionHistory.getHistory();
  }

  /**
   * Get debugger state
   */
  public getState(): Readonly<DebuggerState> {
    return { ...this.state };
  }

  /**
   * Clear all debugging data
   */
  public clear(): void {
    this.breakpointManager.clearAll();
    this.watchExpressionManager.clearAll();
    this.executionHistory.clearHistory();
    this.state.breakpoints.clear();
    this.state.watchExpressions.clear();
    this.state.history = [];
    this.state.snapshots.clear();
    this.state.currentSnapshot = undefined;
    logger.debug('Debugger cleared');
  }
}

