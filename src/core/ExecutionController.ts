/**
 * Execution Controller
 * 
 * Provides execution control including cancellation and timeout management
 */

import { NodeError } from '../types';
import { logger } from '../utils/Logger';

// Use native AbortController if available, otherwise use polyfill
let AbortControllerClass: typeof AbortController;
let AbortSignalType: typeof AbortSignal;

if (typeof globalThis.AbortController !== 'undefined') {
  AbortControllerClass = globalThis.AbortController;
  AbortSignalType = globalThis.AbortSignal;
} else {
  // Fallback for older Node.js versions
  try {
    const abortControllerModule = require('abort-controller');
    AbortControllerClass = abortControllerModule.AbortController;
    AbortSignalType = abortControllerModule.AbortSignal;
  } catch {
    // If abort-controller is not available, create a simple polyfill
    class SimpleAbortController {
      signal: { aborted: boolean; addEventListener: (type: string, handler: () => void) => void };
      constructor() {
        this.signal = {
          aborted: false,
          addEventListener: () => {},
        };
      }
      abort() {
        this.signal.aborted = true;
      }
    }
    AbortControllerClass = SimpleAbortController as any;
    AbortSignalType = { aborted: false } as any;
  }
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Global timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Per-node timeout in milliseconds */
  nodeTimeout?: number;
  /** Execution ID (if not provided, will be generated) */
  executionId?: string;
}

/**
 * Execution controller for managing cancellation and timeouts
 */
export class ExecutionController {
  private abortController: InstanceType<typeof AbortControllerClass>;
  private timeoutId?: NodeJS.Timeout;
  private nodeTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private cancelled: boolean = false;
  private timeoutMs?: number;

  constructor(options: ExecutionOptions = {}) {
    this.abortController = new AbortControllerClass();
    this.timeoutMs = options.timeout;

    // Use provided abort signal or create new one
    if (options.abortSignal) {
      // Listen to external abort signal
      options.abortSignal.addEventListener('abort', () => {
        this.cancel('Execution cancelled by external signal');
      });
    }

    // Set global timeout if provided
    if (this.timeoutMs) {
      this.timeoutId = setTimeout(() => {
        this.cancel('Execution timeout');
      }, this.timeoutMs);
    }
  }

  /**
   * Get the abort signal
   */
  public getSignal(): AbortSignal {
    return this.abortController.signal;
  }

  /**
   * Check if execution is cancelled
   */
  public isCancelled(): boolean {
    return this.cancelled || this.abortController.signal.aborted;
  }

  /**
   * Cancel execution
   */
  public cancel(reason: string = 'Execution cancelled'): void {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;
    this.abortController.abort();

    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Clear all node timeouts
    for (const timeout of this.nodeTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.nodeTimeouts.clear();

    logger.warn(`Execution cancelled: ${reason}`);
  }

  /**
   * Set timeout for a specific node
   */
  public setNodeTimeout(nodeId: string, timeoutMs: number, onTimeout: () => void): void {
    // Clear existing timeout if any
    this.clearNodeTimeout(nodeId);

    const timeout = setTimeout(() => {
      this.nodeTimeouts.delete(nodeId);
      onTimeout();
    }, timeoutMs);

    this.nodeTimeouts.set(nodeId, timeout);
  }

  /**
   * Clear timeout for a specific node
   */
  public clearNodeTimeout(nodeId: string): void {
    const timeout = this.nodeTimeouts.get(nodeId);
    if (timeout) {
      clearTimeout(timeout);
      this.nodeTimeouts.delete(nodeId);
    }
  }

  /**
   * Cleanup all resources
   */
  public cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    for (const timeout of this.nodeTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.nodeTimeouts.clear();
  }

  /**
   * Create a timeout promise that rejects after specified time
   */
  public static createTimeoutPromise(timeoutMs: number, signal?: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new NodeError('Execution timeout', '', undefined, new Error('Timeout')));
      }, timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new NodeError('Execution cancelled', '', undefined, new Error('Cancelled')));
        });
      }
    });
  }

  /**
   * Execute a function with timeout
   */
  public static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    const timeoutPromise = this.createTimeoutPromise(timeoutMs, signal);
    return Promise.race([fn(), timeoutPromise]);
  }
}

