import { NodeId } from '../types';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes needed to close circuit from half-open */
  successThreshold: number;
  /** Time in ms to wait before attempting to recover (half-open) */
  resetTimeout: number;
  /** Time window in ms for counting failures */
  failureWindow: number;
  /** Called when circuit state changes */
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
  /** Called when circuit opens */
  onOpen?: (failures: number) => void;
  /** Called when circuit closes */
  onClose?: () => void;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 60000, // 1 minute
  failureWindow: 10000  // 10 seconds
};

/**
 * Failure record
 */
interface FailureRecord {
  timestamp: number;
  error: Error;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successes: number = 0;
  private nextAttemptTime: number = 0;
  private readonly nodeId?: NodeId;
  private readonly nodeName?: string;

  constructor(
    config: Partial<CircuitBreakerConfig> = {},
    context?: { nodeId?: NodeId; nodeName?: string }
  ) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.nodeId = context?.nodeId;
    this.nodeName = context?.nodeName;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again (half-open)
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(
          `Circuit breaker is OPEN${this.nodeName ? ` for ${this.nodeName}` : ''}. ` +
          `Next attempt in ${Math.ceil((this.nextAttemptTime - Date.now()) / 1000)}s`
        );
      }
    }

    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.onSuccess();
      
      return result;
      
    } catch (error) {
      // Record failure
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.config.successThreshold) {
        // Enough successes - close the circuit
        this.transitionTo(CircuitState.CLOSED);
        this.failures = [];
        this.successes = 0;
        
        if (this.config.onClose) {
          this.config.onClose();
        }
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failures = [];
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    const now = Date.now();
    
    // Add failure record
    this.failures.push({
      timestamp: now,
      error
    });
    
    // Remove old failures outside the window
    this.failures = this.failures.filter(
      f => now - f.timestamp < this.config.failureWindow
    );
    
    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.failures.length >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
        this.nextAttemptTime = now + this.config.resetTimeout;
        this.successes = 0;
        
        if (this.config.onOpen) {
          this.config.onOpen(this.failures.length);
        }
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    
    if (oldState !== newState) {
      this.state = newState;
      
      console.log(
        `🔌 Circuit breaker${this.nodeName ? ` for ${this.nodeName}` : ''}: ` +
        `${oldState} → ${newState}`
      );
      
      if (this.config.onStateChange) {
        this.config.onStateChange(oldState, newState);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count in current window
   */
  getFailureCount(): number {
    const now = Date.now();
    return this.failures.filter(
      f => now - f.timestamp < this.config.failureWindow
    ).length;
  }

  /**
   * Get statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    nextAttemptTime?: number;
  } {
    return {
      state: this.state,
      failures: this.getFailureCount(),
      successes: this.successes,
      nextAttemptTime: this.state === CircuitState.OPEN ? this.nextAttemptTime : undefined
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failures = [];
    this.successes = 0;
    this.nextAttemptTime = 0;
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transitionTo(CircuitState.OPEN);
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<NodeId, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create a circuit breaker for a node
   */
  getOrCreate(
    nodeId: NodeId,
    config?: Partial<CircuitBreakerConfig>,
    nodeName?: string
  ): CircuitBreaker {
    if (!this.breakers.has(nodeId)) {
      this.breakers.set(
        nodeId,
        new CircuitBreaker(config, { nodeId, nodeName })
      );
    }
    return this.breakers.get(nodeId)!;
  }

  /**
   * Get a circuit breaker if it exists
   */
  get(nodeId: NodeId): CircuitBreaker | undefined {
    return this.breakers.get(nodeId);
  }

  /**
   * Remove a circuit breaker
   */
  remove(nodeId: NodeId): boolean {
    return this.breakers.delete(nodeId);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<NodeId, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get statistics for all breakers
   */
  getAllStats(): Map<NodeId, ReturnType<CircuitBreaker['getStats']>> {
    const stats = new Map();
    this.breakers.forEach((breaker, nodeId) => {
      stats.set(nodeId, breaker.getStats());
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }
}
