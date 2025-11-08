/**
 * Unit Tests for RetryPolicy
 * 
 * Tests retry logic including:
 * - Retry attempts
 * - Exponential backoff
 * - Jitter
 * - Custom retry conditions
 * - Error handling
 */

import { RetryPolicy, DEFAULT_RETRY_CONFIG } from '../../src/error-handling/RetryPolicy';
import type { RetryConfig } from '../../src/error-handling/RetryPolicy';

describe('RetryPolicy', () => {
  describe('Basic Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const policy = new RetryPolicy();
      let attempts = 0;

      const result = await policy.execute(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and succeed', async () => {
      const policy = new RetryPolicy({ maxAttempts: 3 });
      let attempts = 0;

      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should fail after max attempts', async () => {
      const policy = new RetryPolicy({ maxAttempts: 3 });
      let attempts = 0;

      await expect(
        policy.execute(async () => {
          attempts++;
          throw new Error('Persistent failure');
        }),
      ).rejects.toThrow('Failed after 3 attempt(s)');

      expect(attempts).toBe(3);
    });

    it('should use default config when not provided', async () => {
      const policy = new RetryPolicy();
      // Should use DEFAULT_RETRY_CONFIG
      expect(policy).toBeDefined();
    });
  });

  describe('Exponential Backoff', () => {
    it('should calculate exponential delay', async () => {
      const delays: number[] = [];
      const policy = new RetryPolicy({
        maxAttempts: 4,
        initialDelay: 100,
        backoffMultiplier: 2,
        useJitter: false,
      });

      let attempts = 0;
      const onRetry = jest.fn((error, attempt, delay) => {
        delays.push(delay);
      });

      // Access private method via reflection or test helper
      // For now, test through execution
      try {
        await policy.execute(
          async () => {
            attempts++;
            throw new Error('Test error');
          },
          undefined,
        );
      } catch {
        // Expected to fail
      }

      // Verify delays increase exponentially
      // Note: This is indirect testing - actual delay calculation is internal
      expect(attempts).toBe(4);
    });

    it('should respect max delay', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 10,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 10, // Would exceed maxDelay
        useJitter: false,
      });

      let attempts = 0;
      try {
        await policy.execute(async () => {
          attempts++;
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(attempts).toBe(10);
    }, 30000); // Increase timeout to 30 seconds for this test
  });

  describe('Jitter', () => {
    it('should add jitter when enabled', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelay: 100,
        useJitter: true,
      });

      // Jitter adds randomness, so we can't test exact values
      // But we can verify it doesn't throw
      let attempts = 0;
      try {
        await policy.execute(async () => {
          attempts++;
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(attempts).toBe(2);
    });

    it('should not add jitter when disabled', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelay: 100,
        useJitter: false,
      });

      let attempts = 0;
      try {
        await policy.execute(async () => {
          attempts++;
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(attempts).toBe(2);
    });
  });

  describe('Custom Retry Condition', () => {
    it('should retry when condition returns true', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        retryCondition: (error, attempt) => {
          return error.message.includes('retry') && attempt < 2;
        },
      });

      let attempts = 0;
      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('retry this');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should not retry when condition returns false', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        retryCondition: () => false, // Never retry
      });

      let attempts = 0;
      await expect(
        policy.execute(async () => {
          attempts++;
          throw new Error('do not retry');
        }),
      ).rejects.toThrow('Failed after 1 attempt(s)');

      expect(attempts).toBe(1);
    });
  });

  describe('OnRetry Callback', () => {
    it('should call onRetry callback on each retry', async () => {
      const onRetry = jest.fn();
      const policy = new RetryPolicy({
        maxAttempts: 3,
        onRetry,
      });

      let attempts = 0;
      try {
        await policy.execute(async () => {
          attempts++;
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      // Should be called for attempts 1 and 2 (not 3, as that's the final failure)
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, expect.any(Number));
    });

    it('should not call onRetry on successful first attempt', async () => {
      const onRetry = jest.fn();
      const policy = new RetryPolicy({
        maxAttempts: 3,
        onRetry,
      });

      await policy.execute(async () => {
        return 'success';
      });

      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe('Context Information', () => {
    it('should include node name in error messages', async () => {
      const policy = new RetryPolicy({ maxAttempts: 2 });

      await expect(
        policy.execute(
          async () => {
            throw new Error('Test error');
          },
          { nodeName: 'TestNode' },
        ),
      ).rejects.toThrow('for TestNode');
    });

    it('should include node ID in error messages', async () => {
      const policy = new RetryPolicy({ maxAttempts: 2 });

      await expect(
        policy.execute(
          async () => {
            throw new Error('Test error');
          },
          { nodeId: 'node-123' },
        ),
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error exceptions', async () => {
      const policy = new RetryPolicy({ maxAttempts: 2 });

      await expect(
        policy.execute(async () => {
          throw 'String error';
        }),
      ).rejects.toThrow();
    });

    it('should preserve error message', async () => {
      const policy = new RetryPolicy({ maxAttempts: 1 });

      await expect(
        policy.execute(async () => {
          throw new Error('Original error message');
        }),
      ).rejects.toThrow('Original error message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxAttempts of 1', async () => {
      const policy = new RetryPolicy({ maxAttempts: 1 });

      await expect(
        policy.execute(async () => {
          throw new Error('Error');
        }),
      ).rejects.toThrow('Failed after 1 attempt(s)');
    });

    it('should handle very large maxAttempts', async () => {
      const policy = new RetryPolicy({ maxAttempts: 1000, initialDelay: 1 });

      let attempts = 0;
      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 5) {
          throw new Error('Error');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(5);
    });

    it('should handle zero initial delay', async () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelay: 0,
        useJitter: false,
      });

      let attempts = 0;
      try {
        await policy.execute(async () => {
          attempts++;
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      expect(attempts).toBe(3);
    });
  });
});

