/**
 * Change Detection Service
 * 
 * Detects changes between graph versions for incremental execution
 */

import type { GraphDefinition } from '../src/graph-management/types';
import type { GraphNode, GraphConnection } from '../store/graphStore';

export interface NodeChange {
  nodeId: string;
  type: 'added' | 'removed' | 'modified' | 'connection-changed';
  affectedNodes: string[];
  details?: {
    propertyChanges?: Record<string, { old: unknown; new: unknown }>;
    connectionChanges?: {
      added: GraphConnection[];
      removed: GraphConnection[];
    };
  };
}

export class ChangeDetectionService {
  /**
   * Generate hash for a node (node + its dependencies)
   */
  private hashNode(node: GraphNode, connections: GraphConnection[]): string {
    const dependencies = connections
      .filter((conn) => conn.toNode === node.id)
      .map((conn) => conn.fromNode)
      .sort();

    const nodeData = {
      id: node.id,
      type: node.type,
      properties: node.properties,
      inputs: node.inputs,
      outputs: node.outputs,
      dependencies,
    };

    return this.hashString(JSON.stringify(nodeData));
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Detect changes between two graphs
   */
  detectChanges(
    previousGraph: GraphDefinition,
    currentGraph: GraphDefinition,
  ): NodeChange[] {
    const changes: NodeChange[] = [];
    const previousNodes = new Map(previousGraph.data.nodes.map((n) => [n.id, n]));
    const currentNodes = new Map(currentGraph.data.nodes.map((n) => [n.id, n]));
    const previousConnections = previousGraph.data.connections;
    const currentConnections = currentGraph.data.connections;

    // Detect added nodes
    for (const [nodeId, node] of currentNodes) {
      if (!previousNodes.has(nodeId)) {
        changes.push({
          nodeId,
          type: 'added',
          affectedNodes: this.getAffectedNodes(nodeId, currentGraph),
        });
      }
    }

    // Detect removed nodes
    for (const [nodeId] of previousNodes) {
      if (!currentNodes.has(nodeId)) {
        changes.push({
          nodeId,
          type: 'removed',
          affectedNodes: this.getAffectedNodes(nodeId, previousGraph),
        });
      }
    }

    // Detect modified nodes
    for (const [nodeId, currentNode] of currentNodes) {
      const previousNode = previousNodes.get(nodeId);
      if (previousNode) {
        const nodeChanges = this.detectNodeChanges(previousNode, currentNode);
        if (nodeChanges.length > 0) {
          changes.push({
            nodeId,
            type: 'modified',
            affectedNodes: this.getAffectedNodes(nodeId, currentGraph),
            details: {
              propertyChanges: nodeChanges.reduce(
                (acc, change) => {
                  acc[change.property] = { old: change.old, new: change.new };
                  return acc;
                },
                {} as Record<string, { old: unknown; new: unknown }>,
              ),
            },
          });
        }
      }
    }

    // Detect connection changes
    const connectionChanges = this.detectConnectionChanges(
      previousConnections,
      currentConnections,
    );
    if (connectionChanges.added.length > 0 || connectionChanges.removed.length > 0) {
      const affectedNodes = new Set<string>();
      connectionChanges.added.forEach((conn) => {
        affectedNodes.add(conn.toNode);
        affectedNodes.add(conn.fromNode);
      });
      connectionChanges.removed.forEach((conn) => {
        affectedNodes.add(conn.toNode);
        affectedNodes.add(conn.fromNode);
      });

      changes.push({
        nodeId: 'connections',
        type: 'connection-changed',
        affectedNodes: Array.from(affectedNodes),
        details: { connectionChanges },
      });
    }

    return changes;
  }

  /**
   * Detect changes in a single node
   */
  private detectNodeChanges(
    previous: GraphNode,
    current: GraphNode,
  ): Array<{ property: string; old: unknown; new: unknown }> {
    const changes: Array<{ property: string; old: unknown; new: unknown }> = [];

    // Check type
    if (previous.type !== current.type) {
      changes.push({ property: 'type', old: previous.type, new: current.type });
    }

    // Check properties
    const prevProps = JSON.stringify(previous.properties || {});
    const currProps = JSON.stringify(current.properties || {});
    if (prevProps !== currProps) {
      changes.push({
        property: 'properties',
        old: previous.properties,
        new: current.properties,
      });
    }

    // Check inputs/outputs
    if (JSON.stringify(previous.inputs) !== JSON.stringify(current.inputs)) {
      changes.push({ property: 'inputs', old: previous.inputs, new: current.inputs });
    }
    if (JSON.stringify(previous.outputs) !== JSON.stringify(current.outputs)) {
      changes.push({ property: 'outputs', old: previous.outputs, new: current.outputs });
    }

    return changes;
  }

  /**
   * Detect connection changes
   */
  private detectConnectionChanges(
    previous: GraphConnection[],
    current: GraphConnection[],
  ): { added: GraphConnection[]; removed: GraphConnection[] } {
    const prevSet = new Set(
      previous.map((c) => `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`),
    );
    const currSet = new Set(
      current.map((c) => `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`),
    );

    const added = current.filter((c) => {
      const key = `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`;
      return !prevSet.has(key);
    });

    const removed = previous.filter((c) => {
      const key = `${c.fromNode}:${c.fromPort}:${c.toNode}:${c.toPort}`;
      return !currSet.has(key);
    });

    return { added, removed };
  }

  /**
   * Get nodes affected by a change (downstream nodes)
   */
  private getAffectedNodes(nodeId: string, graph: GraphDefinition): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      affected.add(id);

      // Find all nodes that depend on this node
      graph.data.connections
        .filter((conn) => conn.fromNode === id)
        .forEach((conn) => {
          traverse(conn.toNode);
        });
    };

    traverse(nodeId);
    affected.delete(nodeId); // Don't include the changed node itself
    return Array.from(affected);
  }

  /**
   * Get subgraph that needs to be executed
   */
  getAffectedSubgraph(
    changes: NodeChange[],
    graph: GraphDefinition,
  ): GraphDefinition {
    const affectedNodeIds = new Set<string>();

    // Add all changed nodes
    changes.forEach((change) => {
      if (change.type !== 'removed') {
        affectedNodeIds.add(change.nodeId);
      }
      change.affectedNodes.forEach((id) => affectedNodeIds.add(id));
    });

    // Get all affected nodes
    const affectedNodes = graph.data.nodes.filter((n) => affectedNodeIds.has(n.id));

    // Get all connections between affected nodes
    const affectedConnections = graph.data.connections.filter(
      (conn) => affectedNodeIds.has(conn.fromNode) && affectedNodeIds.has(conn.toNode),
    );

    return {
      ...graph,
      data: {
        ...graph.data,
        nodes: affectedNodes,
        connections: affectedConnections,
      },
    };
  }
}

export const changeDetectionService = new ChangeDetectionService();

