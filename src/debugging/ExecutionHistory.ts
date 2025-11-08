/**
 * Execution History
 * 
 * Stores execution snapshots for time-travel debugging
 */

import { NodeId, ExecutionId, ExecutionResult, NodeError } from '../types';
import { ExecutionSnapshot, ExecutionHistoryEntry, VariableSnapshot } from './types';
import { VariableInspector } from './VariableInspector';
import { logger } from '../utils/Logger';

/**
 * Manages execution history and snapshots for time-travel debugging
 */
export class ExecutionHistory {
  private history: ExecutionHistoryEntry[] = [];
  private snapshots: Map<string, ExecutionSnapshot> = new Map();
  private inspector: VariableInspector = new VariableInspector();
  private maxHistoryEntries: number = 100;
  private maxSnapshots: number = 1000;

  /**
   * Configure history limits
   */
  public configure(options: { maxHistoryEntries?: number; maxSnapshots?: number }): void {
    if (options.maxHistoryEntries !== undefined) {
      this.maxHistoryEntries = options.maxHistoryEntries;
    }
    if (options.maxSnapshots !== undefined) {
      this.maxSnapshots = options.maxSnapshots;
    }
  }

  /**
   * Create a snapshot of current execution state
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
  ): ExecutionSnapshot {
    const snapshot: ExecutionSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionId,
      timestamp: Date.now(),
      nodeStates: new Map(nodeStates),
      variableSnapshots: new Map(variableSnapshots),
      results: new Map(results),
      currentNodeId,
      stepNumber,
    };

    // Store snapshot
    this.snapshots.set(snapshot.id, snapshot);

    // Enforce max snapshots limit
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestSnapshot = Array.from(this.snapshots.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      this.snapshots.delete(oldestSnapshot.id);
    }

    logger.debug(`Snapshot created: ${snapshot.id} (step ${stepNumber})`);
    return snapshot;
  }

  /**
   * Get snapshot by ID
   */
  public getSnapshot(snapshotId: string): ExecutionSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get all snapshots for an execution
   */
  public getSnapshotsForExecution(executionId: ExecutionId): ExecutionSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(snapshot => snapshot.executionId === executionId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  /**
   * Add execution history entry
   */
  public addHistoryEntry(entry: ExecutionHistoryEntry): void {
    this.history.push(entry);

    // Enforce max history limit
    if (this.history.length > this.maxHistoryEntries) {
      const removed = this.history.shift();
      if (removed) {
        // Clean up snapshots for removed execution
        const snapshotsToRemove = Array.from(this.snapshots.values())
          .filter(s => s.executionId === removed.executionId);
        snapshotsToRemove.forEach(s => this.snapshots.delete(s.id));
      }
    }

    logger.debug(`History entry added: ${entry.executionId}`);
  }

  /**
   * Get execution history
   */
  public getHistory(): ExecutionHistoryEntry[] {
    return [...this.history].sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get history entry by execution ID
   */
  public getHistoryEntry(executionId: ExecutionId): ExecutionHistoryEntry | undefined {
    return this.history.find(entry => entry.executionId === executionId);
  }

  /**
   * Get snapshot at a specific step
   */
  public getSnapshotAtStep(executionId: ExecutionId, stepNumber: number): ExecutionSnapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(executionId);
    return snapshots.find(s => s.stepNumber === stepNumber);
  }

  /**
   * Get previous snapshot
   */
  public getPreviousSnapshot(currentSnapshot: ExecutionSnapshot): ExecutionSnapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(currentSnapshot.executionId);
    const currentIndex = snapshots.findIndex(s => s.id === currentSnapshot.id);
    
    if (currentIndex > 0) {
      return snapshots[currentIndex - 1];
    }

    return undefined;
  }

  /**
   * Get next snapshot
   */
  public getNextSnapshot(currentSnapshot: ExecutionSnapshot): ExecutionSnapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(currentSnapshot.executionId);
    const currentIndex = snapshots.findIndex(s => s.id === currentSnapshot.id);
    
    if (currentIndex >= 0 && currentIndex < snapshots.length - 1) {
      return snapshots[currentIndex + 1];
    }

    return undefined;
  }

  /**
   * Clear all history
   */
  public clearHistory(): void {
    this.history = [];
    this.snapshots.clear();
    logger.debug('Execution history cleared');
  }

  /**
   * Clear history for a specific execution
   */
  public clearExecutionHistory(executionId: ExecutionId): void {
    this.history = this.history.filter(entry => entry.executionId !== executionId);
    
    const snapshotsToRemove = Array.from(this.snapshots.values())
      .filter(s => s.executionId === executionId);
    snapshotsToRemove.forEach(s => this.snapshots.delete(s.id));

    logger.debug(`History cleared for execution: ${executionId}`);
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalHistoryEntries: number;
    totalSnapshots: number;
    oldestEntry?: ExecutionHistoryEntry;
    newestEntry?: ExecutionHistoryEntry;
  } {
    const sortedHistory = [...this.history].sort((a, b) => a.startTime - b.startTime);
    
    return {
      totalHistoryEntries: this.history.length,
      totalSnapshots: this.snapshots.size,
      oldestEntry: sortedHistory[0],
      newestEntry: sortedHistory[sortedHistory.length - 1],
    };
  }
}

