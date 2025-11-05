/**
 * Custom Node Manager
 * 
 * Manages the lifecycle of custom nodes:
 * - Registration with NodeRegistry
 * - Loading from storage
 * - Synchronization between storage and registry
 */

import { NodeRegistry, NodeMetadata } from '../registry/NodeRegistry';
import { CustomNode } from './CustomNode';
import { CustomNodeConfig, CustomNodeMetadata, StoredCustomNode } from './types';
import { CustomNodeStorage } from './CustomNodeStorage';
import { logger } from '../utils/Logger';

/**
 * Custom Node Manager
 * Handles registration and management of custom nodes
 */
export class CustomNodeManager {
  /** Store custom node configurations for factory creation */
  private static customNodeConfigs: Map<string, { config: CustomNodeConfig; metadata: CustomNodeMetadata }> = new Map();

  /**
   * Register a custom node with the registry
   * 
   * @param config - Custom node configuration
   * @param metadata - Node metadata
   * @returns The created CustomNode instance
   */
  public static registerCustomNode(
    config: CustomNodeConfig,
    metadata: CustomNodeMetadata,
  ): CustomNode {
    const registry = NodeRegistry.getInstance();

    // Check if already registered
    if (registry.isRegistered(metadata.type)) {
      logger.warn(`Node type ${metadata.type} is already registered, unregistering first`);
      registry.unregister(metadata.type);
    }

    // Store config for factory creation
    this.customNodeConfigs.set(metadata.type, { config, metadata });

    // Create node instance
    const node = new CustomNode(config);

    // Register with registry - create a factory class
    const registryMetadata: NodeMetadata = {
      type: metadata.type,
      displayName: metadata.displayName,
      category: metadata.category,
      description: metadata.description,
      version: metadata.version,
      author: metadata.author,
      tags: metadata.tags,
      icon: '🎨', // Custom node icon
      color: '#9333EA', // Custom node color
      inputs: metadata.inputs,
      outputs: metadata.outputs,
      examples: [`Custom node created via web UI`],
    };

    // Create a factory class that uses stored config
    const FactoryClass = class extends CustomNode {
      constructor(factoryConfig?: Partial<CustomNodeConfig>) {
        const stored = CustomNodeManager.customNodeConfigs.get(metadata.type);
        if (stored) {
          // Merge factory config with stored config
          super({
            ...stored.config,
            ...factoryConfig,
          } as CustomNodeConfig);
        } else {
          // Fallback - should not happen
          super(config);
        }
      }
    };

    registry.register(
      FactoryClass as new (config?: Partial<CustomNodeConfig>) => CustomNode,
      registryMetadata,
    );

    logger.info(`Registered custom node: ${metadata.type}`);
    return node;
  }

  /**
   * Create and register a custom node from stored data
   * 
   * @param storedNode - Stored custom node data
   * @returns The created CustomNode instance
   */
  public static registerFromStorage(storedNode: StoredCustomNode): CustomNode {
    const config: CustomNodeConfig = {
      ...storedNode.config,
      storageId: storedNode.id,
    };

    return this.registerCustomNode(config, storedNode.metadata);
  }

  /**
   * Load all custom nodes from storage and register them
   * 
   * @returns Number of nodes loaded
   */
  public static async loadAllFromStorage(): Promise<number> {
    try {
      const storedNodes = await CustomNodeStorage.loadAll();
      let loaded = 0;

      for (const storedNode of storedNodes) {
        try {
          this.registerFromStorage(storedNode);
          loaded++;
        } catch (error) {
          logger.error(`Failed to load custom node ${storedNode.id}:`, error);
        }
      }

      logger.info(`Loaded ${loaded} custom nodes from storage`);
      return loaded;
    } catch (error) {
      logger.error('Failed to load custom nodes from storage:', error);
      throw error;
    }
  }

  /**
   * Unregister a custom node
   * 
   * @param type - Node type to unregister
   * @returns True if unregistered, false if not found
   */
  public static unregisterCustomNode(type: string): boolean {
    const registry = NodeRegistry.getInstance();
    return registry.unregister(type);
  }

  /**
   * Check if a custom node is registered
   * 
   * @param type - Node type to check
   * @returns True if registered
   */
  public static isRegistered(type: string): boolean {
    const registry = NodeRegistry.getInstance();
    return registry.isRegistered(type);
  }

  /**
   * Get metadata for a custom node
   * 
   * @param type - Node type
   * @returns Metadata or undefined
   */
  public static getMetadata(type: string): NodeMetadata | undefined {
    const registry = NodeRegistry.getInstance();
    return registry.getMetadata(type);
  }
}

