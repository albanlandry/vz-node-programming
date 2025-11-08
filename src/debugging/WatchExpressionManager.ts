/**
 * Watch Expression Manager
 * 
 * Manages watch expressions and evaluates them during execution
 */

import { EventEmitter } from 'events';
import { ExecutionContext, ExecutionResult, NodeError } from '../types';
import { WatchExpression, DebugEventType, DebugEvent } from './types';
import { logger } from '../utils/Logger';

/**
 * Manages watch expressions and evaluates them during execution
 */
export class WatchExpressionManager extends EventEmitter {
  private watchExpressions: Map<string, WatchExpression> = new Map();

  /**
   * Add a watch expression
   */
  public addWatchExpression(watch: WatchExpression): void {
    this.watchExpressions.set(watch.id, watch);
    logger.debug(`Watch expression added: ${watch.id} - ${watch.expression}`);
  }

  /**
   * Remove a watch expression
   */
  public removeWatchExpression(watchId: string): boolean {
    const removed = this.watchExpressions.delete(watchId);
    if (removed) {
      logger.debug(`Watch expression removed: ${watchId}`);
    }
    return removed;
  }

  /**
   * Get watch expression by ID
   */
  public getWatchExpression(watchId: string): WatchExpression | undefined {
    return this.watchExpressions.get(watchId);
  }

  /**
   * Get all watch expressions
   */
  public getAllWatchExpressions(): WatchExpression[] {
    return Array.from(this.watchExpressions.values());
  }

  /**
   * Evaluate all watch expressions
   */
  public async evaluateAll(
    context: ExecutionContext,
    result?: ExecutionResult,
    error?: NodeError,
  ): Promise<Map<string, { value: any; changed: boolean }>> {
    const results = new Map<string, { value: any; changed: boolean }>();

    for (const watch of this.watchExpressions.values()) {
      try {
        const value = await this.evaluateExpression(
          watch.expression,
          context,
          result,
          error,
        );

        const changed = watch.previousValue !== undefined && 
          !this.valuesEqual(watch.previousValue, value);

        watch.lastValue = value;
        watch.lastEvaluated = Date.now();

        results.set(watch.id, { value, changed });

        // Emit event if value changed and break on change is enabled
        if (changed && watch.breakOnChange) {
          this.emit('watchChanged', {
            type: DebugEventType.WATCH_CHANGED,
            timestamp: Date.now(),
            data: {
              watchId: watch.id,
              expression: watch.expression,
              previousValue: watch.previousValue,
              newValue: value,
            },
          } as DebugEvent);
        }

        watch.previousValue = value;
      } catch (error) {
        logger.warn(`Failed to evaluate watch expression ${watch.id}: ${error}`);
        results.set(watch.id, { value: undefined, changed: false });
      }
    }

    return results;
  }

  /**
   * Evaluate a single expression
   */
  private async evaluateExpression(
    expression: string,
    context: ExecutionContext,
    result?: ExecutionResult,
    error?: NodeError,
  ): Promise<any> {
    try {
      // Create evaluation context
      const evalContext = {
        inputs: context.inputs,
        outputs: context.outputs,
        metadata: context.metadata,
        result,
        error,
        executionId: context.executionId,
      };

      // Use Function constructor for evaluation
      // In production, consider using a more secure evaluator
      const func = new Function(
        'inputs',
        'outputs',
        'metadata',
        'result',
        'error',
        'executionId',
        `return ${expression}`,
      );

      return func(
        evalContext.inputs,
        evalContext.outputs,
        evalContext.metadata,
        evalContext.result,
        evalContext.error,
        evalContext.executionId,
      );
    } catch (error) {
      logger.error(`Error evaluating expression: ${error}`);
      throw error;
    }
  }

  /**
   * Compare two values for equality
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a === undefined || b === undefined) return false;

    // Deep equality for objects
    if (typeof a === 'object' && typeof b === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Clear all watch expressions
   */
  public clearAll(): void {
    this.watchExpressions.clear();
    logger.debug('All watch expressions cleared');
  }
}

