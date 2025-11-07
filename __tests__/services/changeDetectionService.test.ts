/**
 * Unit Tests for ChangeDetectionService
 */

import { changeDetectionService } from '../../services/changeDetectionService';
import type { GraphDefinition } from '../../src/graph-management/types';

describe('ChangeDetectionService', () => {
  const createMockGraph = (nodes: any[], connections: any[]): GraphDefinition => ({
    id: 'test-graph',
    metadata: {
      id: 'test-graph',
      name: 'Test Graph',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      connectionCount: connections.length,
    },
    data: {
      nodes,
      connections,
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  });

  describe('detectChanges', () => {
    it('should detect added nodes', () => {
      const previous = createMockGraph(
        [{ id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] }],
        [],
      );
      const current = createMockGraph(
        [
          { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
          { id: 'node-2', type: 'test', position: { x: 100, y: 100 }, inputs: [], outputs: [] },
        ],
        [],
      );

      const changes = changeDetectionService.detectChanges(previous, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('added');
      expect(changes[0].nodeId).toBe('node-2');
    });

    it('should detect removed nodes', () => {
      const previous = createMockGraph(
        [
          { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
          { id: 'node-2', type: 'test', position: { x: 100, y: 100 }, inputs: [], outputs: [] },
        ],
        [],
      );
      const current = createMockGraph(
        [{ id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] }],
        [],
      );

      const changes = changeDetectionService.detectChanges(previous, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('removed');
      expect(changes[0].nodeId).toBe('node-2');
    });

    it('should detect modified nodes', () => {
      const previous = createMockGraph(
        [
          {
            id: 'node-1',
            type: 'test',
            position: { x: 0, y: 0 },
            inputs: [],
            outputs: [],
            properties: { value: 'old' },
          },
        ],
        [],
      );
      const current = createMockGraph(
        [
          {
            id: 'node-1',
            type: 'test',
            position: { x: 0, y: 0 },
            inputs: [],
            outputs: [],
            properties: { value: 'new' },
          },
        ],
        [],
      );

      const changes = changeDetectionService.detectChanges(previous, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('modified');
      expect(changes[0].nodeId).toBe('node-1');
      expect(changes[0].details?.propertyChanges).toBeDefined();
    });

    it('should detect connection changes', () => {
      const previous = createMockGraph(
        [
          { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
          { id: 'node-2', type: 'test', position: { x: 100, y: 100 }, inputs: [], outputs: [] },
        ],
        [],
      );
      const current = createMockGraph(
        [
          { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
          { id: 'node-2', type: 'test', position: { x: 100, y: 100 }, inputs: [], outputs: [] },
        ],
        [
          {
            id: 'conn-1',
            fromNode: 'node-1',
            fromPort: 'output',
            toNode: 'node-2',
            toPort: 'input',
          },
        ],
      );

      const changes = changeDetectionService.detectChanges(previous, current);

      expect(changes.some((c) => c.type === 'connection-changed')).toBe(true);
    });

    it('should return empty array when no changes', () => {
      const graph = createMockGraph(
        [{ id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] }],
        [],
      );

      const changes = changeDetectionService.detectChanges(graph, graph);

      expect(changes).toHaveLength(0);
    });
  });

  describe('getAffectedSubgraph', () => {
    it('should return subgraph with affected nodes', () => {
      const graph = createMockGraph(
        [
          { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
          { id: 'node-2', type: 'test', position: { x: 100, y: 100 }, inputs: [], outputs: [] },
          { id: 'node-3', type: 'test', position: { x: 200, y: 200 }, inputs: [], outputs: [] },
        ],
        [
          {
            id: 'conn-1',
            fromNode: 'node-1',
            fromPort: 'output',
            toNode: 'node-2',
            toPort: 'input',
          },
          {
            id: 'conn-2',
            fromNode: 'node-2',
            fromPort: 'output',
            toNode: 'node-3',
            toPort: 'input',
          },
        ],
      );

      const changes = [
        {
          nodeId: 'node-1',
          type: 'modified' as const,
          affectedNodes: ['node-2', 'node-3'],
        },
      ];

      const subgraph = changeDetectionService.getAffectedSubgraph(changes, graph);

      expect(subgraph.data.nodes).toHaveLength(3);
      expect(subgraph.data.nodes.map((n) => n.id)).toEqual(['node-1', 'node-2', 'node-3']);
      expect(subgraph.data.connections).toHaveLength(2);
    });
  });
});


