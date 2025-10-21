import { NodeId, ExecutionContext, ExecutionResult } from '../types';

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier: number;
  /** Whether to use jitter (randomization) */
  useJitter: boolean;
  /** Custom retry condition (return true to retry) */
  retryCondition?: (error: Error, attempt: number) => boolean;
  /** Called on each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true
};

/**
 * Retry policy for node execution
 */
export class RetryPolicy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { nodeId?: NodeId; nodeName?: string }
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
      try {
        // Execute the function
        const result = await fn();
        
        // Success - return immediately
        if (attempt > 0) {
          console.log(`✓ Retry succeeded on attempt ${attempt + 1}${context?.nodeName ? ` for ${context.nodeName}` : ''}`);
        }
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        const shouldRetry = this.shouldRetry(lastError, attempt);
        
        if (!shouldRetry || attempt === this.config.maxAttempts - 1) {
          // No more retries - throw the error
          throw new Error(
            `Failed after ${attempt + 1} attempt(s)${context?.nodeName ? ` for ${context.nodeName}` : ''}: ${lastError.message}`
          );
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        
        // Call retry callback if provided
        if (this.config.onRetry) {
          this.config.onRetry(lastError, attempt + 1, delay);
        } else {
          console.warn(
            `⚠️  Retry attempt ${attempt + 1}/${this.config.maxAttempts}${context?.nodeName ? ` for ${context.nodeName}` : ''} ` +
            `after ${delay}ms - ${lastError.message}`
          );
        }
        
        // Wait before retrying
        await this.delay(delay);
      }
    }
    
    // Should never reach here, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateDelay(attempt: number): number {
    // Base delay with exponential backoff
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter if enabled (randomize ±25%)
    if (this.config.useJitter) {
      const jitter = delay * 0.25;
      delay = delay - jitter + (Math.random() * jitter * 2);
    }
    
    return Math.floor(delay);
  }

  /**
   * Determine if we should retry based on the error
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Use custom retry condition if provided
    if (this.config.retryCondition) {
      return this.config.retryCondition(error, attempt);
    }
    
    // Default: retry on most errors except specific ones
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError'
    ];
    
    return !nonRetryableErrors.includes(error.name);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<RetryConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Predefined retry policies
 */
export const RetryPolicies = {
  /**
   * No retry - fail immediately
   */
  None: new RetryPolicy({
    maxAttempts: 1
  }),

  /**
   * Quick retry - 3 attempts with short delays
   */
  Quick: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5
  }),

  /**
   * Standard retry - balanced approach
   */
  Standard: new RetryPolicy(DEFAULT_RETRY_CONFIG),

  /**
   * Aggressive retry - many attempts with longer waits
   */
  Aggressive: new RetryPolicy({
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2.5
  }),

  /**
   * Network retry - optimized for network failures
   */
  Network: new RetryPolicy({
    maxAttempts: 4,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    useJitter: true,
    retryCondition: (error: Error) => {
      // Retry on network-related errors
      const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'NetworkError'];
      return networkErrors.some(errType => 
        error.message.includes(errType) || error.name.includes(errType)
      );
    }
  })
};
