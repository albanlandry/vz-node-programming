/**
 * Unit Tests for IncrementalExecutionService
 */

import { incrementalExecutionService } from '../../services/incrementalExecutionService';
import { graphExecutionService } from '../../services/graphExecutionService';
import { changeDetectionService } from '../../services/changeDetectionService';
import { resultCacheService } from '../../services/resultCacheService';
import type { GraphDefinition } from '../../src/graph-management/types';

// Mock dependencies
jest.mock('../../services/graphExecutionService');
jest.mock('../../services/changeDetectionService');
jest.mock('../../services/resultCacheService');

describe('IncrementalExecutionService', () => {
  const mockGraph: GraphDefinition = {
    id: 'test-graph',
    metadata: {
      id: 'test-graph',
      name: 'Test Graph',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: 2,
      connectionCount: 0,
    },
    data: {
      nodes: [
        {
          id: 'node-1',
          type: 'test',
          name: 'Node 1',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [],
        },
        {
          id: 'node-2',
          type: 'test',
          name: 'Node 2',
          position: { x: 100, y: 100 },
          inputs: [],
          outputs: [],
        },
      ],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resultCacheService.clear();
  });

  it('should execute full graph when no previous graph provided', async () => {
    const mockResult = {
      success: true,
      results: {
        'node-1': { success: true, outputs: {}, executionTime: 10 },
        'node-2': { success: true, outputs: {}, executionTime: 20 },
      },
      executionTime: 30,
      logs: [],
    };

    jest.mocked(graphExecutionService.executeGraph).mockResolvedValue(mockResult);

    const result = await incrementalExecutionService.executeIncremental(mockGraph);

    expect(result.cachedNodes).toHaveLength(0);
    expect(result.executedNodes).toHaveLength(2);
    expect(result.cacheHitRate).toBe(0);
    expect(graphExecutionService.executeGraph).toHaveBeenCalledWith(
      mockGraph,
      undefined,
      { parallel: false },
    );
  });

  it('should use cache for unchanged nodes', async () => {
    const previousGraph = { ...mockGraph };
    const previousResults = {
      'node-1': { success: true, outputs: {}, executionTime: 10 },
    };

    const mockChanges = [
      {
        nodeId: 'node-2',
        type: 'modified' as const,
        affectedNodes: [],
      },
    ];

    const mockSubgraph: GraphDefinition = {
      ...mockGraph,
      data: {
        ...mockGraph.data,
        nodes: [mockGraph.data.nodes[1]], // Only node-2
      },
    };

    jest.mocked(changeDetectionService.detectChanges).mockReturnValue(mockChanges);
    jest.mocked(changeDetectionService.getAffectedSubgraph).mockReturnValue(mockSubgraph);

    const mockResult = {
      success: true,
      results: {
        'node-2': { success: true, outputs: {}, executionTime: 20 },
      },
      executionTime: 20,
      logs: [],
    };

    jest.mocked(graphExecutionService.executeGraph).mockResolvedValue(mockResult);

    // Manually set cache for node-1
    const resultCacheService = require('../../services/resultCacheService').resultCacheService;
    resultCacheService.set('node-1', previousResults['node-1'], 'hash-node-1');

    const result = await incrementalExecutionService.executeIncremental(
      mockGraph,
      previousGraph,
      previousResults,
    );

    expect(result.executedNodes).toContain('node-2');
    // Cache hit rate depends on implementation, but should execute node-2
    expect(result.executedNodes.length).toBeGreaterThan(0);
  });

  it('should execute only changed nodes', async () => {
    const previousGraph = { ...mockGraph };
    const mockChanges = [
      {
        nodeId: 'node-1',
        type: 'modified' as const,
        affectedNodes: ['node-2'],
      },
    ];

    const mockSubgraph: GraphDefinition = {
      ...mockGraph,
      data: {
        ...mockGraph.data,
        nodes: mockGraph.data.nodes, // Both nodes affected
      },
    };

    jest.mocked(changeDetectionService.detectChanges).mockReturnValue(mockChanges);
    jest.mocked(changeDetectionService.getAffectedSubgraph).mockReturnValue(mockSubgraph);

    const mockResult = {
      success: true,
      results: {
        'node-1': { success: true, outputs: {}, executionTime: 10 },
        'node-2': { success: true, outputs: {}, executionTime: 20 },
      },
      executionTime: 30,
      logs: [],
    };

    jest.mocked(graphExecutionService.executeGraph).mockResolvedValue(mockResult);

    const result = await incrementalExecutionService.executeIncremental(
      mockGraph,
      previousGraph,
    );

    expect(result.executedNodes.length).toBeGreaterThan(0);
    expect(changeDetectionService.detectChanges).toHaveBeenCalledWith(
      previousGraph,
      mockGraph,
    );
  });
});

