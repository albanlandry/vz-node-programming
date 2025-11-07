/**
 * Unit Tests for StreamingExecutionService
 */

import { StreamingExecutionService } from '../../services/streamingExecutionService';
import type { GraphDefinition } from '../../src/graph-management/types';

// Mock fetch
global.fetch = jest.fn();

describe('StreamingExecutionService', () => {
  let service: StreamingExecutionService;

  beforeEach(() => {
    service = new StreamingExecutionService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.cancel();
  });

  describe('executeStream', () => {
    it('should start streaming execution', async () => {
      const mockGraph: GraphDefinition = {
        id: 'test-graph',
        metadata: {
          id: 'test-graph',
          name: 'Test Graph',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodeCount: 1,
          connectionCount: 0,
        },
        data: {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => ({
            read: jest.fn(() => Promise.resolve({ done: true, value: undefined })),
          })),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.executeStream(mockGraph)).resolves.not.toThrow();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/graphs/execute-stream',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should handle SSE events correctly', async () => {
      const mockGraph: GraphDefinition = {
        id: 'test-graph',
        metadata: {
          id: 'test-graph',
          name: 'Test Graph',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodeCount: 1,
          connectionCount: 0,
        },
        data: {
          nodes: [],
          connections: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      };

      const eventData = new TextEncoder().encode(
        'event: node:completed\ndata: {"nodeId":"node-1","result":{"success":true}}\n\n',
      );

      let readCallCount = 0;
      const mockReader = {
        read: jest.fn(() => {
          readCallCount++;
          if (readCallCount === 1) {
            return Promise.resolve({ done: false, value: eventData });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn(() => mockReader),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const eventHandler = jest.fn();
      service.on('node:completed', eventHandler);

      await service.executeStream(mockGraph);

      expect(eventHandler).toHaveBeenCalled();
    });

    it('should cancel execution', () => {
      const abortController = new AbortController();
      const abortSpy = jest.spyOn(abortController, 'abort');

      service.cancel();
      expect(service.getIsStreaming()).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should register and emit events', () => {
      const handler = jest.fn();
      service.on('execution:started', handler);

      // Simulate event emission
      (service as any).emit('execution:started', {
        type: 'execution:started',
        data: { executionId: 'test-123' },
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should unregister event listeners', () => {
      const handler = jest.fn();
      service.on('execution:started', handler);
      service.off('execution:started', handler);

      (service as any).emit('execution:started', {
        type: 'execution:started',
        data: {},
        timestamp: Date.now(),
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

