/**
 * Unit Tests for Execute Stream API Route
 */

import { POST } from '../../app/api/graphs/execute-stream/route';
import { GraphExecutionEngine } from '../../src/graph-management/GraphExecutionEngine';
import { NodeExecutor } from '../../src/core/NodeExecutor';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('../../src/graph-management/GraphExecutionEngine');
jest.mock('../../src/utils/Logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('POST /api/graphs/execute-stream', () => {
  const mockGraph = {
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
      nodes: [
        {
          id: 'node-1',
          name: 'Test Node',
          type: 'utility.constant',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'result', name: 'Result', dataType: { name: 'any' } }],
          properties: { type: 'string', value: 'test' },
        },
      ],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if graph is missing', async () => {
    const request = new NextRequest('http://localhost/api/graphs/execute-stream', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Graph definition is required');
  });

  it('should return 400 if graph has no nodes', async () => {
    const request = new NextRequest('http://localhost/api/graphs/execute-stream', {
      method: 'POST',
      body: JSON.stringify({
        graph: {
          ...mockGraph,
          data: { ...mockGraph.data, nodes: [] },
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Graph must have at least one node');
  });

  it('should return SSE stream for valid graph', async () => {
    const mockExecutor = {
      on: jest.fn(),
      execute: jest.fn().mockResolvedValue(new Map()),
      executeParallel: jest.fn().mockResolvedValue(new Map()),
    };

    const mockBuildExecutor = jest.fn().mockResolvedValue(mockExecutor);
    jest.mocked(GraphExecutionEngine).mockImplementation(function() {
      const mockInstance = {
        buildExecutor: mockBuildExecutor,
      };
      return mockInstance;
    });

    const request = new NextRequest('http://localhost/api/graphs/execute-stream', {
      method: 'POST',
      body: JSON.stringify({ graph: mockGraph }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should handle execution errors gracefully', async () => {
    const mockExecutor = {
      on: jest.fn(),
      execute: jest.fn().mockRejectedValue(new Error('Execution failed')),
      executeParallel: jest.fn().mockRejectedValue(new Error('Execution failed')),
    };

    const mockBuildExecutor = jest.fn().mockResolvedValue(mockExecutor);
    jest.mocked(GraphExecutionEngine).mockImplementation(function() {
      const mockInstance = {
        buildExecutor: mockBuildExecutor,
      };
      return mockInstance;
    });

    const request = new NextRequest('http://localhost/api/graphs/execute-stream', {
      method: 'POST',
      body: JSON.stringify({ graph: mockGraph }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    // Should still return SSE stream, but with error event
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});

