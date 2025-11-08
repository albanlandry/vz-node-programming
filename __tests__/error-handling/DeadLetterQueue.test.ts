/**
 * Unit Tests for DeadLetterQueue
 * 
 * Tests DLQ functionality including:
 * - Adding entries
 * - Retrieving entries
 * - Marking as processed
 * - Statistics
 * - Cleanup
 * - Max entries limit
 */

import { DeadLetterQueue } from '../../src/error-handling/DeadLetterQueue';
import type { DeadLetterEntry, ExecutionContext, ExecutionResult } from '../../src/error-handling/DeadLetterQueue';
import { NodeError } from '../../src/types';

describe('DeadLetterQueue', () => {
  let dlq: DeadLetterQueue;
  let mockContext: ExecutionContext;
  let mockResult: ExecutionResult;

  beforeEach(() => {
    // Get fresh instance
    dlq = DeadLetterQueue.getInstance({ maxEntries: 10, retentionPeriod: 1000 });
    dlq.clear();

    mockContext = {
      executionId: 'exec-1',
      inputs: new Map(),
      outputs: new Map(),
      metadata: new Map(),
    };

    mockResult = {
      success: false,
      error: new NodeError('Test error', 'node-1'),
      executionTime: 100,
    };
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DeadLetterQueue.getInstance();
      const instance2 = DeadLetterQueue.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Adding Entries', () => {
    it('should add an entry to the DLQ', async () => {
      const entry = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.nodeId).toBe('node-1');
      expect(entry.nodeName).toBe('Test Node');
      expect(entry.error.message).toBe('Test error');
      expect(entry.processed).toBe(false);
    });

    it('should generate unique IDs for entries', async () => {
      const entry1 = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      const entry2 = await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should include retry attempts if provided', async () => {
      const entry = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
        retryAttempts: 3,
      });

      expect(entry.retryAttempts).toBe(3);
    });

    it('should include metadata if provided', async () => {
      const entry = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
        metadata: { custom: 'value' },
      });

      expect(entry.metadata).toEqual({ custom: 'value' });
    });

    it('should call onEntryAdded callback if provided', async () => {
      const onEntryAdded = jest.fn();
      const dlqWithCallback = DeadLetterQueue.getInstance({ onEntryAdded });

      await dlqWithCallback.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      expect(onEntryAdded).toHaveBeenCalledTimes(1);
      expect(onEntryAdded).toHaveBeenCalledWith(expect.objectContaining({
        nodeId: 'node-1',
      }));
    });
  });

  describe('Retrieving Entries', () => {
    it('should get an entry by ID', async () => {
      const entry = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      const retrieved = dlq.get(entry.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(entry.id);
    });

    it('should return undefined for non-existent entry', () => {
      const entry = dlq.get('nonexistent-id');
      expect(entry).toBeUndefined();
    });

    it('should get all entries', async () => {
      await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      const all = dlq.getAll();
      expect(all.length).toBe(2);
    });

    it('should get entries by node ID', async () => {
      await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      await dlq.add({
        executionId: 'exec-3',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 3'),
        context: mockContext,
        result: mockResult,
      });

      const node1Entries = dlq.getByNodeId('node-1');
      expect(node1Entries.length).toBe(2);
      expect(node1Entries.every(e => e.nodeId === 'node-1')).toBe(true);
    });

    it('should get unprocessed entries', async () => {
      const entry1 = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      const entry2 = await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      dlq.markAsProcessed(entry1.id);

      const unprocessed = dlq.getUnprocessed();
      expect(unprocessed.length).toBe(1);
      expect(unprocessed[0].id).toBe(entry2.id);
    });
  });

  describe('Marking as Processed', () => {
    it('should mark an entry as processed', async () => {
      const entry = await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      expect(entry.processed).toBe(false);

      dlq.markAsProcessed(entry.id);
      const retrieved = dlq.get(entry.id);
      expect(retrieved?.processed).toBe(true);
    });

    it('should return false when marking non-existent entry', () => {
      const result = dlq.markAsProcessed('nonexistent-id');
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      const entry3 = await dlq.add({
        executionId: 'exec-3',
        nodeId: 'node-3',
        nodeName: 'Node 3',
        error: new Error('Error 3'),
        context: mockContext,
        result: mockResult,
      });

      dlq.markAsProcessed(entry3.id);

      const stats = dlq.getStats();
      expect(stats.total).toBe(3);
      expect(stats.unprocessed).toBe(2);
      expect(stats.processed).toBe(1);
    });

    it('should return zero statistics for empty DLQ', () => {
      const stats = dlq.getStats();
      expect(stats.total).toBe(0);
      expect(stats.unprocessed).toBe(0);
      expect(stats.processed).toBe(0);
    });
  });

  describe('Max Entries Limit', () => {
    it('should remove oldest entries when max entries reached', async () => {
      const dlqLimited = DeadLetterQueue.getInstance({ maxEntries: 3 });
      dlqLimited.clear();

      // Add 5 entries
      const entryIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const entry = await dlqLimited.add({
          executionId: `exec-${i}`,
          nodeId: `node-${i}`,
          nodeName: `Node ${i}`,
          error: new Error(`Error ${i}`),
          context: mockContext,
          result: mockResult,
        });
        entryIds.push(entry.id);
      }

      // Should only have 3 entries (oldest 2 removed)
      const all = dlqLimited.getAll();
      expect(all.length).toBe(3);

      // Oldest entries should be removed
      expect(dlqLimited.get(entryIds[0])).toBeUndefined();
      expect(dlqLimited.get(entryIds[1])).toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should remove old entries based on retention period', async () => {
      const dlqWithRetention = DeadLetterQueue.getInstance({
        maxEntries: 100,
        retentionPeriod: 100, // 100ms retention
      });
      dlqWithRetention.clear();

      // Add entry
      const entry = await dlqWithRetention.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      // Wait for retention period
      await new Promise(resolve => setTimeout(resolve, 150));

      // Manually trigger cleanup
      dlqWithRetention.cleanup();

      // Entry should be removed
      expect(dlqWithRetention.get(entry.id)).toBeUndefined();
    });

    it('should clear all entries', async () => {
      await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Test Node',
        error: new Error('Test error'),
        context: mockContext,
        result: mockResult,
      });

      dlq.clear();

      const stats = dlq.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Export', () => {
    it('should export all entries', async () => {
      await dlq.add({
        executionId: 'exec-1',
        nodeId: 'node-1',
        nodeName: 'Node 1',
        error: new Error('Error 1'),
        context: mockContext,
        result: mockResult,
      });

      await dlq.add({
        executionId: 'exec-2',
        nodeId: 'node-2',
        nodeName: 'Node 2',
        error: new Error('Error 2'),
        context: mockContext,
        result: mockResult,
      });

      const exported = dlq.export();
      expect(exported.length).toBe(2);
      expect(exported[0].nodeId).toBe('node-1');
      expect(exported[1].nodeId).toBe('node-2');
    });
  });
});

