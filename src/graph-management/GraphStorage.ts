/**
 * Graph Storage
 * 
 * Handles persistence of graphs to JSON files
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../utils/Logger';
import type {
  GraphDefinition,
  GraphMetadata,
  GraphStats,
} from './types';

/**
 * Graph storage directory
 */
const GRAPH_STORAGE_DIR = join(process.cwd(), 'data', 'graphs');
const GRAPH_INDEX_FILE = join(GRAPH_STORAGE_DIR, 'index.json');

/**
 * Graph Storage Class
 * Manages graph persistence using JSON files
 */
export class GraphStorage {
  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(GRAPH_STORAGE_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create graph storage directory:', error);
      throw new Error('Failed to initialize graph storage');
    }
  }

  /**
   * Get graph file path
   */
  private getGraphFilePath(id: string): string {
    return join(GRAPH_STORAGE_DIR, `graph-${id}.json`);
  }

  /**
   * Load graph index
   */
  private async loadIndex(): Promise<GraphMetadata[]> {
    try {
      const data = await fs.readFile(GRAPH_INDEX_FILE, 'utf-8');
      return JSON.parse(data) as GraphMetadata[];
    } catch (error) {
      // Index file doesn't exist yet, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      logger.error('Failed to load graph index:', error);
      throw new Error('Failed to load graph index');
    }
  }

  /**
   * Save graph index
   */
  private async saveIndex(index: GraphMetadata[]): Promise<void> {
    try {
      await fs.writeFile(GRAPH_INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save graph index:', error);
      throw new Error('Failed to save graph index');
    }
  }

  /**
   * Save a graph
   */
  async save(graph: GraphDefinition): Promise<void> {
    await this.ensureStorageDir();

    try {
      // Save graph file
      const graphFilePath = this.getGraphFilePath(graph.id);
      await fs.writeFile(
        graphFilePath,
        JSON.stringify(graph, null, 2),
        'utf-8',
      );

      // Update index
      const index = await this.loadIndex();
      const existingIndex = index.findIndex((g) => g.id === graph.id);

      const metadata: GraphMetadata = {
        id: graph.id,
        name: graph.metadata.name,
        description: graph.metadata.description,
        author: graph.metadata.author,
        version: graph.metadata.version,
        createdAt: graph.metadata.createdAt,
        updatedAt: graph.metadata.updatedAt,
        tags: graph.metadata.tags,
        nodeCount: graph.data.nodes.length,
        connectionCount: graph.data.connections.length,
      };

      if (existingIndex >= 0) {
        index[existingIndex] = metadata;
      } else {
        index.push(metadata);
      }

      await this.saveIndex(index);
      logger.info(`Graph saved: ${graph.id} (${graph.metadata.name})`);
    } catch (error) {
      logger.error('Failed to save graph:', error);
      throw new Error('Failed to save graph');
    }
  }

  /**
   * Load a graph by ID
   */
  async load(id: string): Promise<GraphDefinition> {
    try {
      const graphFilePath = this.getGraphFilePath(id);
      const data = await fs.readFile(graphFilePath, 'utf-8');
      return JSON.parse(data) as GraphDefinition;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Graph ${id} not found`);
      }
      logger.error('Failed to load graph:', error);
      throw new Error('Failed to load graph');
    }
  }

  /**
   * List all graphs (metadata only)
   */
  async list(): Promise<GraphMetadata[]> {
    try {
      return await this.loadIndex();
    } catch (error) {
      logger.error('Failed to list graphs:', error);
      throw new Error('Failed to list graphs');
    }
  }

  /**
   * Delete a graph
   */
  async delete(id: string): Promise<void> {
    try {
      // Delete graph file
      const graphFilePath = this.getGraphFilePath(id);
      await fs.unlink(graphFilePath);

      // Update index
      const index = await this.loadIndex();
      const filteredIndex = index.filter((g) => g.id !== id);
      await this.saveIndex(filteredIndex);

      logger.info(`Graph deleted: ${id}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Graph file doesn't exist, but try to remove from index anyway
        const index = await this.loadIndex();
        const filteredIndex = index.filter((g) => g.id !== id);
        await this.saveIndex(filteredIndex);
        return;
      }
      logger.error('Failed to delete graph:', error);
      throw new Error('Failed to delete graph');
    }
  }

  /**
   * Update graph metadata
   */
  async update(id: string, updates: Partial<GraphDefinition>): Promise<void> {
    try {
      const graph = await this.load(id);

      // Merge updates
      const updatedGraph: GraphDefinition = {
        ...graph,
        metadata: {
          ...graph.metadata,
          ...updates.metadata,
          updatedAt: new Date().toISOString(),
        },
        data: {
          ...graph.data,
          ...updates.data,
        },
      };

      await this.save(updatedGraph);
      logger.info(`Graph updated: ${id}`);
    } catch (error) {
      logger.error('Failed to update graph:', error);
      throw new Error('Failed to update graph');
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<GraphStats> {
    try {
      const index = await this.loadIndex();

      const stats: GraphStats = {
        total: index.length,
        totalNodes: index.reduce((sum, g) => sum + g.nodeCount, 0),
        totalConnections: index.reduce((sum, g) => sum + g.connectionCount, 0),
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get graph stats:', error);
      throw new Error('Failed to get graph statistics');
    }
  }

  /**
   * Generate a new graph ID
   */
  generateId(): string {
    return uuidv4();
  }
}

