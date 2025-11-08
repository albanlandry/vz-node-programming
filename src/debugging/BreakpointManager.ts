/**
 * Breakpoint Manager
 * 
 * Manages breakpoints including conditional breakpoints
 */

import { EventEmitter } from 'events';
import { NodeId, ExecutionContext, ExecutionResult, NodeError } from '../types';
import { Breakpoint, BreakpointType, DebugEventType, DebugEvent } from './types';
import { logger } from '../utils/Logger';

/**
 * Manages breakpoints and evaluates break conditions
 */
export class BreakpointManager extends EventEmitter {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private nodeBreakpoints: Map<NodeId, Breakpoint[]> = new Map();

  /**
   * Add a breakpoint
   */
  public addBreakpoint(breakpoint: Breakpoint): void {
    this.breakpoints.set(breakpoint.id, breakpoint);
    
    // Index by node ID for faster lookup
    const nodeBreakpoints = this.nodeBreakpoints.get(breakpoint.nodeId) || [];
    nodeBreakpoints.push(breakpoint);
    this.nodeBreakpoints.set(breakpoint.nodeId, nodeBreakpoints);

    logger.debug(`Breakpoint added: ${breakpoint.id} on node ${breakpoint.nodeId}`);
  }

  /**
   * Remove a breakpoint
   */
  public removeBreakpoint(breakpointId: string): boolean {
    const breakpoint = this.breakpoints.get(breakpointId);
    if (!breakpoint) {
      return false;
    }

    this.breakpoints.delete(breakpointId);
    
    // Remove from node index
    const nodeBreakpoints = this.nodeBreakpoints.get(breakpoint.nodeId) || [];
    const index = nodeBreakpoints.findIndex(bp => bp.id === breakpointId);
    if (index >= 0) {
      nodeBreakpoints.splice(index, 1);
      if (nodeBreakpoints.length === 0) {
        this.nodeBreakpoints.delete(breakpoint.nodeId);
      } else {
        this.nodeBreakpoints.set(breakpoint.nodeId, nodeBreakpoints);
      }
    }

    logger.debug(`Breakpoint removed: ${breakpointId}`);
    return true;
  }

  /**
   * Get breakpoint by ID
   */
  public getBreakpoint(breakpointId: string): Breakpoint | undefined {
    return this.breakpoints.get(breakpointId);
  }

  /**
   * Get all breakpoints
   */
  public getAllBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Get breakpoints for a node
   */
  public getBreakpointsForNode(nodeId: NodeId): Breakpoint[] {
    return this.nodeBreakpoints.get(nodeId) || [];
  }

  /**
   * Enable/disable a breakpoint
   */
  public setBreakpointEnabled(breakpointId: string, enabled: boolean): boolean {
    const breakpoint = this.breakpoints.get(breakpointId);
    if (!breakpoint) {
      return false;
    }

    breakpoint.enabled = enabled;
    return true;
  }

  /**
   * Check if execution should break at this point
   */
  public async shouldBreak(
    nodeId: NodeId,
    type: BreakpointType,
    context: ExecutionContext,
    result?: ExecutionResult,
    error?: NodeError,
  ): Promise<{ shouldBreak: boolean; breakpoint?: Breakpoint; reason?: string }> {
    const nodeBreakpoints = this.nodeBreakpoints.get(nodeId) || [];
    
    for (const breakpoint of nodeBreakpoints) {
      if (!breakpoint.enabled || breakpoint.type !== type) {
        continue;
      }

      // Check hit count
      if (breakpoint.hitCount !== undefined) {
        breakpoint.currentHitCount = (breakpoint.currentHitCount || 0) + 1;
        if (breakpoint.currentHitCount < breakpoint.hitCount) {
          continue;
        }
      }

      // Evaluate condition if present
      if (breakpoint.condition) {
        try {
          const shouldBreak = await this.evaluateCondition(
            breakpoint.condition,
            context,
            result,
            error,
          );

          if (!shouldBreak) {
            continue;
          }
        } catch (error) {
          logger.warn(`Failed to evaluate breakpoint condition: ${error}`);
          continue;
        }
      }

      // Log only breakpoints don't actually break
      if (breakpoint.logOnly) {
        logger.info(`[Breakpoint ${breakpoint.id}] Node ${nodeId} - ${type}`);
        continue;
      }

      return {
        shouldBreak: true,
        breakpoint,
        reason: breakpoint.condition
          ? `Condition met: ${breakpoint.condition}`
          : `Breakpoint ${breakpoint.id} hit`,
      };
    }

    return { shouldBreak: false };
  }

  /**
   * Evaluate a conditional expression
   */
  private async evaluateCondition(
    condition: string,
    context: ExecutionContext,
    result?: ExecutionResult,
    error?: NodeError,
  ): Promise<boolean> {
    try {
      // Create a safe evaluation context
      const evalContext = {
        inputs: context.inputs,
        outputs: context.outputs,
        metadata: context.metadata,
        result,
        error,
        executionId: context.executionId,
      };

      // Use Function constructor for safe evaluation
      // In production, consider using a more secure evaluator
      const func = new Function(
        'inputs',
        'outputs',
        'metadata',
        'result',
        'error',
        'executionId',
        `return ${condition}`,
      );

      const result = func(
        evalContext.inputs,
        evalContext.outputs,
        evalContext.metadata,
        evalContext.result,
        evalContext.error,
        evalContext.executionId,
      );

      return Boolean(result);
    } catch (error) {
      logger.error(`Error evaluating breakpoint condition: ${error}`);
      return false;
    }
  }

  /**
   * Clear all breakpoints
   */
  public clearAll(): void {
    this.breakpoints.clear();
    this.nodeBreakpoints.clear();
    logger.debug('All breakpoints cleared');
  }

  /**
   * Reset hit counts for all breakpoints
   */
  public resetHitCounts(): void {
    for (const breakpoint of this.breakpoints.values()) {
      breakpoint.currentHitCount = 0;
    }
  }
}

