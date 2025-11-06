/**
 * Graph Manager
 * 
 * High-level interface for graph management operations
 */

import { GraphStorage } from './GraphStorage';
import type {
  GraphDefinition,
  GraphMetadata,
  ValidationResult,
} from './types';
import { logger } from '../utils/Logger';

/**
 * Graph Manager Class
 * Provides high-level graph management operations
 */
export class GraphManager {
  private storage: GraphStorage;

  constructor() {
    this.storage = new GraphStorage();
  }

  /**
   * Create a new graph
   */
  async createGraph(
    data: {
      nodes: GraphDefinition['data']['nodes'];
      connections: GraphDefinition['data']['connections'];
      viewport: GraphDefinition['data']['viewport'];
    },
    metadata: {
      name: string;
      description?: string;
      author?: string;
      tags?: string[];
    },
  ): Promise<GraphDefinition> {
    const id = this.storage.generateId();
    const now = new Date().toISOString();

    const graph: GraphDefinition = {
      id,
      metadata: {
        id,
        name: metadata.name,
        description: metadata.description,
        author: metadata.author,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
        tags: metadata.tags,
        nodeCount: data.nodes.length,
        connectionCount: data.connections.length,
      },
      data,
    };

    // Validate before saving
    const validation = this.validateGraph(graph);
    if (!validation.valid) {
      throw new Error(`Graph validation failed: ${validation.errors?.join(', ')}`);
    }

    await this.storage.save(graph);
    logger.info(`Graph created: ${id} (${metadata.name})`);

    return graph;
  }

  /**
   * Update an existing graph
   */
  async updateGraph(
    id: string,
    data?: {
      nodes?: GraphDefinition['data']['nodes'];
      connections?: GraphDefinition['data']['connections'];
      viewport?: GraphDefinition['data']['viewport'];
    },
    metadata?: {
      name?: string;
      description?: string;
      tags?: string[];
    },
  ): Promise<GraphDefinition> {
    const existing = await this.storage.load(id);

    const updatedGraph: GraphDefinition = {
      ...existing,
      metadata: {
        ...existing.metadata,
        ...metadata,
        updatedAt: new Date().toISOString(),
        nodeCount: data?.nodes?.length ?? existing.data.nodes.length,
        connectionCount: data?.connections?.length ?? existing.data.connections.length,
      },
      data: {
        nodes: data?.nodes ?? existing.data.nodes,
        connections: data?.connections ?? existing.data.connections,
        viewport: data?.viewport ?? existing.data.viewport,
      },
    };

    // Validate before saving
    const validation = this.validateGraph(updatedGraph);
    if (!validation.valid) {
      throw new Error(`Graph validation failed: ${validation.errors?.join(', ')}`);
    }

    await this.storage.save(updatedGraph);
    logger.info(`Graph updated: ${id}`);

    return updatedGraph;
  }

  /**
   * Get a graph by ID
   */
  async getGraph(id: string): Promise<GraphDefinition> {
    return await this.storage.load(id);
  }

  /**
   * List all graphs
   */
  async listGraphs(): Promise<GraphMetadata[]> {
    return await this.storage.list();
  }

  /**
   * Delete a graph
   */
  async deleteGraph(id: string): Promise<void> {
    await this.storage.delete(id);
    logger.info(`Graph deleted: ${id}`);
  }

  /**
   * Validate graph structure
   */
  validateGraph(graph: GraphDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!graph.metadata.name || graph.metadata.name.trim().length === 0) {
      errors.push('Graph name is required');
    }

    if (graph.metadata.name && graph.metadata.name.length > 100) {
      errors.push('Graph name must be less than 100 characters');
    }

    // Validate data
    if (!graph.data.nodes || !Array.isArray(graph.data.nodes)) {
      errors.push('Graph must have nodes array');
    }

    if (!graph.data.connections || !Array.isArray(graph.data.connections)) {
      errors.push('Graph must have connections array');
    }

    // Validate nodes
    if (graph.data.nodes) {
      const nodeIds = new Set<string>();
      for (const node of graph.data.nodes) {
        if (!node.id) {
          errors.push('Node must have an ID');
        } else if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`);
        } else {
          nodeIds.add(node.id);
        }

        if (!node.name || node.name.trim().length === 0) {
          errors.push(`Node ${node.id} must have a name`);
        }
      }

      // Validate connections
      if (graph.data.connections) {
        for (const conn of graph.data.connections) {
          if (!conn.fromNode || !graph.data.nodes.find((n) => n.id === conn.fromNode)) {
            errors.push(`Connection references non-existent node: ${conn.fromNode}`);
          }

          if (!conn.toNode || !graph.data.nodes.find((n) => n.id === conn.toNode)) {
            errors.push(`Connection references non-existent node: ${conn.toNode}`);
          }

          if (conn.fromNode === conn.toNode) {
            warnings.push(`Connection from node ${conn.fromNode} to itself`);
          }
        }
      }
    }

    // Check for orphaned nodes
    if (graph.data.nodes && graph.data.connections) {
      const connectedNodes = new Set<string>();
      for (const conn of graph.data.connections) {
        connectedNodes.add(conn.fromNode);
        connectedNodes.add(conn.toNode);
      }

      for (const node of graph.data.nodes) {
        if (!connectedNodes.has(node.id)) {
          warnings.push(`Node ${node.id} (${node.name}) is not connected`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get statistics
   */
  async getStats() {
    return await this.storage.getStats();
  }
}

