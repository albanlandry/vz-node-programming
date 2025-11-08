/**
 * Rate Limiter
 * 
 * Provides rate limiting functionality to prevent abuse and DoS attacks.
 * Uses in-memory storage (can be extended to Redis for distributed systems).
 */

import { logger } from '../utils/Logger';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Message to return when limit is exceeded */
  message?: string;
  /** Whether to skip successful requests */
  skipSuccessfulRequests?: boolean;
  /** Whether to skip failed requests */
  skipFailedRequests?: boolean;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Rate limiter implementation
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      max: config.max,
      windowMs: config.windowMs,
      message: config.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if a request should be allowed
   * 
   * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
   * @returns Rate limit result
   */
  public check(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    let entry = this.store.get(key);

    // Create new entry if doesn't exist
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
      this.store.set(key, entry);
    }

    // Reset if window expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.firstRequest = now;
    }

    // Check limit
    if (entry.count >= this.config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment count
    entry.count++;

    return {
      allowed: true,
      remaining: this.config.max - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Record a successful request (for skipSuccessfulRequests)
   */
  public recordSuccess(key: string): void {
    if (this.config.skipSuccessfulRequests) {
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  /**
   * Record a failed request (for skipFailedRequests)
   */
  public recordFailure(key: string): void {
    if (this.config.skipFailedRequests) {
      const entry = this.store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  /**
   * Reset rate limit for a key
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current rate limit status for a key
   */
  public getStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.resetTime) {
      return {
        count: 0,
        remaining: this.config.max,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.max - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.resetTime + this.config.windowMs) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.store.delete(key);
      }

      if (keysToDelete.length > 0) {
        logger.debug(`Rate limiter cleanup: removed ${keysToDelete.length} expired entries`);
      }
    }, this.config.windowMs);
  }

  /**
   * Stop cleanup interval
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Clear all entries
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalKeys: number;
    config: RateLimitConfig;
  } {
    return {
      totalKeys: this.store.size,
      config: this.config,
    };
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Default rate limiters
 */
export const defaultRateLimiters = {
  /** General API rate limiter: 100 requests per minute */
  api: createRateLimiter({
    max: 100,
    windowMs: 60 * 1000,
    message: 'API rate limit exceeded. Please try again later.',
  }),

  /** Graph execution rate limiter: 10 executions per minute */
  graphExecution: createRateLimiter({
    max: 10,
    windowMs: 60 * 1000,
    message: 'Graph execution rate limit exceeded. Please try again later.',
  }),

  /** Custom node creation rate limiter: 5 creations per hour */
  customNodeCreation: createRateLimiter({
    max: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Custom node creation rate limit exceeded. Please try again later.',
  }),
};

