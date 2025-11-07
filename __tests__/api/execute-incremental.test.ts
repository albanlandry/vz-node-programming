/**
 * Unit Tests for Execute Incremental API Route
 */

import { POST } from '../../app/api/graphs/execute-incremental/route';
import { NextRequest } from 'next/server';
import { GraphExecutionEngine } from '../../src/graph-management/GraphExecutionEngine';
import { changeDetectionService } from '../../services/changeDetectionService';

// Mock dependencies
jest.mock('../../src/graph-management/GraphExecutionEngine');
jest.mock('../../services/changeDetectionService');
jest.mock('../../src/utils/Logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('POST /api/graphs/execute-incremental', () => {
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
    const request = new NextRequest('http://localhost/api/graphs/execute-incremental', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Graph definition is required');
  });

  it('should execute full graph when no previous graph provided', async () => {
    const mockResult = {
      success: true,
      results: { 'node-1': { success: true, outputs: {}, executionTime: 10 } },
      executionTime: 10,
      logs: [],
    };

    jest.mocked(GraphExecutionEngine).mockImplementation(function() {
      return {
        execute: jest.fn().mockResolvedValue(mockResult),
      } as any;
    });

    const request = new NextRequest('http://localhost/api/graphs/execute-incremental', {
      method: 'POST',
      body: JSON.stringify({ graph: mockGraph }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cachedNodes).toHaveLength(0);
    expect(data.executedNodes).toHaveLength(1);
  });

  it('should use previous results when no changes detected', async () => {
    const previousResults = {
      'node-1': { success: true, outputs: {}, executionTime: 10 },
    };

    jest.mocked(changeDetectionService.detectChanges).mockReturnValue([]);

    const request = new NextRequest('http://localhost/api/graphs/execute-incremental', {
      method: 'POST',
      body: JSON.stringify({
        graph: mockGraph,
        previousGraph: mockGraph,
        previousResults,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cachedNodes).toHaveLength(1);
    expect(data.executedNodes).toHaveLength(0);
    expect(data.cacheHitRate).toBe(1);
  });

  it('should execute only changed nodes', async () => {
    const previousGraph = { ...mockGraph };
    const previousResults = {
      'node-1': { success: true, outputs: {}, executionTime: 10 },
    };

    const mockChanges = [
      {
        nodeId: 'node-1',
        type: 'modified' as const,
        affectedNodes: [],
      },
    ];

    const mockSubgraph = {
      ...mockGraph,
      data: {
        ...mockGraph.data,
        nodes: mockGraph.data.nodes,
      },
    };

    jest.mocked(changeDetectionService.detectChanges).mockReturnValue(mockChanges);
    jest.mocked(changeDetectionService.getAffectedSubgraph).mockReturnValue(mockSubgraph);

    const mockResult = {
      success: true,
      results: { 'node-1': { success: true, outputs: {}, executionTime: 15 } },
      executionTime: 15,
      logs: [],
    };

    jest.mocked(GraphExecutionEngine).mockImplementation(function() {
      return {
        execute: jest.fn().mockResolvedValue(mockResult),
      } as any;
    });

    const request = new NextRequest('http://localhost/api/graphs/execute-incremental', {
      method: 'POST',
      body: JSON.stringify({
        graph: mockGraph,
        previousGraph,
        previousResults,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.executedNodes.length).toBeGreaterThan(0);
  });
});


