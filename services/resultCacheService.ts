/**
 * Result Cache Service
 * 
 * Manages caching of execution results for incremental execution
 */

import type { ExecutionResult } from '../src/types';

export interface CachedResult {
  nodeId: string;
  result: ExecutionResult;
  graphHash: string;
  timestamp: number;
  ttl?: number;
}

export class ResultCacheService {
  private cache: Map<string, CachedResult> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000; // Maximum number of cached results

  /**
   * Generate cache key
   */
  private getCacheKey(nodeId: string, graphHash: string): string {
    return `${nodeId}:${graphHash}`;
  }

  /**
   * Get cached result
   */
  get(nodeId: string, graphHash: string): CachedResult | null {
    const key = this.getCacheKey(nodeId, graphHash);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check TTL
    const ttl = cached.ttl || this.defaultTTL;
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cached result
   */
  set(nodeId: string, result: ExecutionResult, graphHash: string, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.getCacheKey(nodeId, graphHash);
    this.cache.set(key, {
      nodeId,
      result,
      graphHash,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache for a node
   */
  invalidate(nodeId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((cached, key) => {
      if (cached.nodeId === nodeId) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate cache for multiple nodes
   */
  invalidateNodes(nodeIds: string[]): void {
    nodeIds.forEach((nodeId) => this.invalidate(nodeId));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((cached, key) => {
      const ttl = cached.ttl || this.defaultTTL;
      if (now - cached.timestamp > ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
    return keysToDelete.length;
  }
}

export const resultCacheService = new ResultCacheService();


