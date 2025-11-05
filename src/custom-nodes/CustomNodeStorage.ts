/**
 * Custom Node Storage System
 * 
 * Handles persistence of custom nodes to the file system.
 * Currently uses JSON files, but designed to be easily migratable to a database.
 * 
 * Storage structure:
 * storage/custom-nodes/
 *   ├── {node-id}.json
 *   └── index.json (list of all nodes)
 */

import { promises as fs } from 'fs';
import { join } from 'path';

import { CustomNodeMetadata, StoredCustomNode } from './types';
import { logger } from '../utils/Logger';

/**
 * Storage configuration
 */
const STORAGE_DIR = join(process.cwd(), 'storage', 'custom-nodes');
const INDEX_FILE = join(STORAGE_DIR, 'index.json');

/**
 * Custom Node Storage Manager
 * Handles saving, loading, and managing custom nodes
 */
export class CustomNodeStorage {
  /**
   * Ensure storage directory exists
   */
  private static async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(STORAGE_DIR, { recursive: true });
    } catch (error) {
      logger.error('Failed to create storage directory:', error);
      throw new Error('Failed to initialize storage directory');
    }
  }

  /**
   * Load index file with all node references
   * 
   * @returns Array of node IDs
   */
  private static async loadIndex(): Promise<string[]> {
    try {
      await this.ensureStorageDir();
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      const index = JSON.parse(data) as { nodes: string[] };
      return index.nodes ?? [];
    } catch (error) {
      // Index doesn't exist yet, return empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      logger.error('Failed to load index:', error);
      throw error;
    }
  }

  /**
   * Save index file with all node references
   * 
   * @param nodeIds - Array of node IDs to save
   */
  private static async saveIndex(nodeIds: string[]): Promise<void> {
    try {
      await this.ensureStorageDir();
      const index = {
        nodes: nodeIds,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save index:', error);
      throw error;
    }
  }

  /**
   * Save a custom node to storage
   * 
   * @param node - The custom node to save
   * @returns Storage ID
   */
  public static async save(node: StoredCustomNode): Promise<string> {
    try {
      await this.ensureStorageDir();

      const storageId = node.id || node.metadata.storageId || `node-${Date.now()}`;
      const filePath = join(STORAGE_DIR, `${storageId}.json`);

      // Update timestamps
      const nodeToSave: StoredCustomNode = {
        ...node,
        id: storageId,
        metadata: {
          ...node.metadata,
          storageId,
          updatedAt: new Date(),
          createdAt: node.metadata.createdAt || new Date(),
        },
      };

      // Save node file
      await fs.writeFile(filePath, JSON.stringify(nodeToSave, null, 2), 'utf-8');

      // Update index
      const index = await this.loadIndex();
      if (!index.includes(storageId)) {
        index.push(storageId);
        await this.saveIndex(index);
      }

      logger.info(`Saved custom node: ${storageId}`);
      return storageId;
    } catch (error) {
      logger.error('Failed to save custom node:', error);
      throw error;
    }
  }

  /**
   * Load a custom node by storage ID
   * 
   * @param storageId - Storage ID of the node
   * @returns Stored custom node or null if not found
   */
  public static async load(storageId: string): Promise<StoredCustomNode | null> {
    try {
      const filePath = join(STORAGE_DIR, `${storageId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const node = JSON.parse(data) as StoredCustomNode;

      // Parse dates
      if (node.metadata.createdAt) {
        node.metadata.createdAt = new Date(node.metadata.createdAt);
      }
      if (node.metadata.updatedAt) {
        node.metadata.updatedAt = new Date(node.metadata.updatedAt);
      }

      return node;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      logger.error(`Failed to load custom node ${storageId}:`, error);
      throw error;
    }
  }

  /**
   * Load all custom nodes
   * 
   * @returns Array of all stored custom nodes
   */
  public static async loadAll(): Promise<StoredCustomNode[]> {
    try {
      const index = await this.loadIndex();
      const nodes: StoredCustomNode[] = [];

      for (const storageId of index) {
        const node = await this.load(storageId);
        if (node) {
          nodes.push(node);
        }
      }

      return nodes;
    } catch (error) {
      logger.error('Failed to load all custom nodes:', error);
      throw error;
    }
  }

  /**
   * Delete a custom node
   * 
   * @param storageId - Storage ID of the node to delete
   * @returns True if deleted, false if not found
   */
  public static async delete(storageId: string): Promise<boolean> {
    try {
      const filePath = join(STORAGE_DIR, `${storageId}.json`);
      await fs.unlink(filePath);

      // Update index
      const index = await this.loadIndex();
      const updatedIndex = index.filter(id => id !== storageId);
      await this.saveIndex(updatedIndex);

      logger.info(`Deleted custom node: ${storageId}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      logger.error(`Failed to delete custom node ${storageId}:`, error);
      throw error;
    }
  }

  /**
   * Find a custom node by type
   * 
   * @param type - Node type to find
   * @returns Stored custom node or null if not found
   */
  public static async findByType(type: string): Promise<StoredCustomNode | null> {
    try {
      const allNodes = await this.loadAll();
      return allNodes.find(node => node.metadata.type === type) || null;
    } catch (error) {
      logger.error(`Failed to find custom node by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Check if a node exists
   * 
   * @param storageId - Storage ID to check
   * @returns True if node exists
   */
  public static async exists(storageId: string): Promise<boolean> {
    try {
      const filePath = join(STORAGE_DIR, `${storageId}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics
   * 
   * @returns Storage statistics
   */
  public static async getStats(): Promise<{
    totalNodes: number;
    storageSize: number;
    lastUpdated?: Date;
  }> {
    try {
      const index = await this.loadIndex();
      let totalSize = 0;

      for (const storageId of index) {
        try {
          const filePath = join(STORAGE_DIR, `${storageId}.json`);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // File might not exist, skip
        }
      }

      return {
        totalNodes: index.length,
        storageSize: totalSize,
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return {
        totalNodes: 0,
        storageSize: 0,
      };
    }
  }
}

