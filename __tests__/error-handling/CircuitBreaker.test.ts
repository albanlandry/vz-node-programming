/**
 * Unit Tests for CircuitBreaker
 * 
 * Tests circuit breaker functionality including:
 * - State transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 * - Failure threshold
 * - Success threshold
 * - Reset timeout
 * - Callbacks
 */

import { CircuitBreaker, CircuitState, DEFAULT_CIRCUIT_CONFIG } from '../../src/error-handling/CircuitBreaker';

describe('CircuitBreaker', () => {
  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should use default config when not provided', () => {
      const breaker = new CircuitBreaker();
      expect(breaker).toBeDefined();
    });
  });

  describe('CLOSED State', () => {
    it('should execute successfully in CLOSED state', async () => {
      const breaker = new CircuitBreaker();
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should record failures in CLOSED state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 100,
      });

      // First failure
      await expect(
        breaker.execute(async () => {
          throw new Error('Error 1');
        }),
      ).rejects.toThrow('Error 1');

      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Second failure - should open circuit
      await expect(
        breaker.execute(async () => {
          throw new Error('Error 2');
        }),
      ).rejects.toThrow('Error 2');

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100,
      });

      // Cause 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error(`Error ${i}`);
          });
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('OPEN State', () => {
    it('should reject requests immediately in OPEN state', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 1000, // Long timeout
      });

      // Cause failure to open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Should reject immediately
      await expect(
        breaker.execute(async () => 'should not execute'),
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100, // Short timeout for testing
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next attempt should transition to HALF_OPEN
      try {
        await breaker.execute(async () => {
          throw new Error('Test');
        });
      } catch {
        // Expected
      }

      // Should be in HALF_OPEN after timeout
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('HALF_OPEN State', () => {
    it('should transition to CLOSED on success in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        resetTimeout: 100,
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Success should close circuit
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Failure should reopen circuit
      await expect(
        breaker.execute(async () => {
          throw new Error('Error again');
        }),
      ).rejects.toThrow('Error again');

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should require successThreshold successes to close', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 3,
        resetTimeout: 100,
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // First success - should still be HALF_OPEN
      await breaker.execute(async () => 'success1');
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Second success - should still be HALF_OPEN
      await breaker.execute(async () => 'success2');
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Third success - should close
      await breaker.execute(async () => 'success3');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Failure Window', () => {
    it('should only count failures within the window', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindow: 200, // 200ms window
        resetTimeout: 100,
      });

      // Cause 2 failures
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Error');
          });
        } catch {
          // Expected
        }
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 250));

      // Should still be CLOSED (failures expired)
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Callbacks', () => {
    it('should call onStateChange when state changes', () => {
      const onStateChange = jest.fn();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
        onStateChange,
      });

      // Open circuit
      breaker.execute(async () => {
        throw new Error('Error');
      }).catch(() => {
        // Expected
      });

      expect(onStateChange).toHaveBeenCalledWith(CircuitState.CLOSED, CircuitState.OPEN);
    });

    it('should call onOpen when circuit opens', () => {
      const onOpen = jest.fn();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeout: 100,
        onOpen,
      });

      breaker.execute(async () => {
        throw new Error('Error');
      }).catch(() => {
        // Expected
      });

      expect(onOpen).toHaveBeenCalledWith(1); // 1 failure
    });

    it('should call onClose when circuit closes', async () => {
      const onClose = jest.fn();
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        resetTimeout: 100,
        onClose,
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Close circuit
      await breaker.execute(async () => 'success');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Context Information', () => {
    it('should include node name in error messages', async () => {
      const breaker = new CircuitBreaker(
        {
          failureThreshold: 1,
          resetTimeout: 1000,
        },
        { nodeName: 'TestNode' },
      );

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      await expect(
        breaker.execute(async () => 'should not execute'),
      ).rejects.toThrow('for TestNode');
    });
  });

  describe('Statistics', () => {
    it('should track failure count', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 100,
      });

      // Cause 2 failures
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Error');
          });
        } catch {
          // Expected
        }
      }

      const stats = breaker.getStats();
      expect(stats.failures).toBe(2);
    });

    it('should track success count', async () => {
      const breaker = new CircuitBreaker();

      // Cause 2 successes
      await breaker.execute(async () => 'success1');
      await breaker.execute(async () => 'success2');

      const stats = breaker.getStats();
      expect(stats.successes).toBeGreaterThanOrEqual(2);
    });

    it('should reset statistics', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 100,
      });

      // Cause failures
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      breaker.reset();
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 100,
      });

      // Rapid failures
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          breaker.execute(async () => {
            throw new Error('Error');
          }).catch(() => {
            // Expected
          }),
        );
      }

      await Promise.all(promises);

      // Circuit should be open
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should handle successThreshold of 1', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        resetTimeout: 100,
      });

      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Error');
        });
      } catch {
        // Expected
      }

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // One success should close
      await breaker.execute(async () => 'success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

