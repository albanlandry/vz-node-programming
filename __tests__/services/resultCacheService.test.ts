/**
 * Unit Tests for ResultCacheService
 */

import { resultCacheService } from '../../services/resultCacheService';
import type { ExecutionResult } from '../../src/types';

describe('ResultCacheService', () => {
  beforeEach(() => {
    resultCacheService.clear();
  });

  describe('get and set', () => {
    it('should cache and retrieve results', () => {
      const nodeId = 'node-1';
      const hash = 'hash-123';
      const result: ExecutionResult = {
        success: true,
        outputs: new Map([['output', 'value']]),
        executionTime: 10,
      };

      resultCacheService.set(nodeId, result, hash);
      const cached = resultCacheService.get(nodeId, hash);

      expect(cached).toBeDefined();
      expect(cached?.nodeId).toBe(nodeId);
      expect(cached?.graphHash).toBe(hash);
      expect(cached?.result.success).toBe(true);
    });

    it('should return null for non-existent cache', () => {
      const cached = resultCacheService.get('node-1', 'hash-123');
      expect(cached).toBeNull();
    });

    it('should return null for mismatched hash', () => {
      const nodeId = 'node-1';
      const hash1 = 'hash-123';
      const hash2 = 'hash-456';
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set(nodeId, result, hash1);
      const cached = resultCacheService.get(nodeId, hash2);

      expect(cached).toBeNull();
    });

    it('should expire cached results after TTL', () => {
      const nodeId = 'node-1';
      const hash = 'hash-123';
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set(nodeId, result, hash, 100); // 100ms TTL

      // Should be available immediately
      expect(resultCacheService.get(nodeId, hash)).toBeDefined();

      // Wait for TTL to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cached = resultCacheService.get(nodeId, hash);
          expect(cached).toBeNull();
          resolve();
        }, 150);
      });
    });
  });

  describe('invalidate', () => {
    it('should invalidate cache for a specific node', () => {
      const nodeId1 = 'node-1';
      const nodeId2 = 'node-2';
      const hash = 'hash-123';
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set(nodeId1, result, hash);
      resultCacheService.set(nodeId2, result, hash);

      resultCacheService.invalidate(nodeId1);

      expect(resultCacheService.get(nodeId1, hash)).toBeNull();
      expect(resultCacheService.get(nodeId2, hash)).toBeDefined();
    });

    it('should clear all cache when no nodeId provided', () => {
      const nodeId1 = 'node-1';
      const nodeId2 = 'node-2';
      const hash = 'hash-123';
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set(nodeId1, result, hash);
      resultCacheService.set(nodeId2, result, hash);

      resultCacheService.clear();

      expect(resultCacheService.get(nodeId1, hash)).toBeNull();
      expect(resultCacheService.get(nodeId2, hash)).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set('node-1', result, 'hash-1');
      resultCacheService.set('node-2', result, 'hash-2');

      const stats = resultCacheService.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(1000);
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired entries', () => {
      const result: ExecutionResult = {
        success: true,
        outputs: new Map(),
        executionTime: 10,
      };

      resultCacheService.set('node-1', result, 'hash-1', 100); // Expires
      resultCacheService.set('node-2', result, 'hash-2', 10000); // Doesn't expire

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cleaned = resultCacheService.cleanExpired();
          expect(cleaned).toBe(1);
          expect(resultCacheService.get('node-1', 'hash-1')).toBeNull();
          expect(resultCacheService.get('node-2', 'hash-2')).toBeDefined();
          resolve();
        }, 150);
      });
    });
  });
});


