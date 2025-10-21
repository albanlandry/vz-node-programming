import { INode, NodeConfig, Port, DataType } from '../types';
import { BaseNode } from '../core/BaseNode';

/**
 * Metadata for a registered node type
 */
export interface NodeMetadata {
  /** Unique identifier for the node type */
  type: string;
  /** Display name for the node */
  displayName: string;
  /** Category for organization */
  category: string;
  /** Detailed description */
  description: string;
  /** Version of the node implementation */
  version: string;
  /** Author/creator information */
  author?: string;
  /** Tags for searching/filtering */
  tags: string[];
  /** Icon or emoji for visual representation */
  icon?: string;
  /** Color for UI representation (hex) */
  color?: string;
  /** Whether the node is deprecated */
  deprecated?: boolean;
  /** Input port definitions */
  inputs: Port[];
  /** Output port definitions */
  outputs: Port[];
  /** Example usage */
  examples?: string[];
  /** Documentation URL */
  docsUrl?: string;
}

/**
 * Factory function to create a node instance
 */
export type NodeFactory = (config?: Partial<NodeConfig>) => INode;

/**
 * Registered node type information
 */
interface RegisteredNode {
  metadata: NodeMetadata;
  factory: NodeFactory;
  nodeClass: new (config?: Partial<NodeConfig>) => INode;
}

/**
 * Central registry for all node types
 * Provides discovery, instantiation, and metadata management
 */
export class NodeRegistry {
  private static instance: NodeRegistry;
  private nodes: Map<string, RegisteredNode> = new Map();
  private categories: Set<string> = new Set();
  private tags: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  /**
   * Register a node type with the registry
   */
  public register(
    nodeClass: new (config?: Partial<NodeConfig>) => INode,
    metadata: NodeMetadata
  ): void {
    if (this.nodes.has(metadata.type)) {
      throw new Error(`Node type '${metadata.type}' is already registered`);
    }

    // Validate metadata
    this.validateMetadata(metadata);

    // Create factory function
    const factory: NodeFactory = (config?: Partial<NodeConfig>) => {
      return new nodeClass(config);
    };

    // Store registration
    this.nodes.set(metadata.type, {
      metadata,
      factory,
      nodeClass
    });

    // Update categories and tags
    this.categories.add(metadata.category);
    metadata.tags.forEach(tag => this.tags.add(tag));
  }

  /**
   * Unregister a node type
   */
  public unregister(type: string): boolean {
    return this.nodes.delete(type);
  }

  /**
   * Create a new instance of a registered node
   */
  public create(type: string, config?: Partial<NodeConfig>): INode {
    const registered = this.nodes.get(type);
    if (!registered) {
      throw new Error(`Node type '${type}' is not registered`);
    }

    return registered.factory(config);
  }

  /**
   * Get metadata for a registered node type
   */
  public getMetadata(type: string): NodeMetadata | undefined {
    return this.nodes.get(type)?.metadata;
  }

  /**
   * Get all registered node types
   */
  public getAllTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get all registered nodes with their metadata
   */
  public getAllNodes(): NodeMetadata[] {
    return Array.from(this.nodes.values()).map(n => n.metadata);
  }

  /**
   * Get nodes by category
   */
  public getByCategory(category: string): NodeMetadata[] {
    return this.getAllNodes().filter(n => n.category === category);
  }

  /**
   * Get nodes by tag
   */
  public getByTag(tag: string): NodeMetadata[] {
    return this.getAllNodes().filter(n => n.tags.includes(tag));
  }

  /**
   * Search nodes by keyword
   */
  public search(keyword: string): NodeMetadata[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.getAllNodes().filter(n => 
      n.displayName.toLowerCase().includes(lowerKeyword) ||
      n.description.toLowerCase().includes(lowerKeyword) ||
      n.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      n.type.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get all categories
   */
  public getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Get all tags
   */
  public getTags(): string[] {
    return Array.from(this.tags);
  }

  /**
   * Check if a node type is registered
   */
  public isRegistered(type: string): boolean {
    return this.nodes.has(type);
  }

  /**
   * Get statistics about registered nodes
   */
  public getStats(): {
    totalNodes: number;
    categories: number;
    tags: number;
    deprecated: number;
  } {
    const allNodes = this.getAllNodes();
    return {
      totalNodes: allNodes.length,
      categories: this.categories.size,
      tags: this.tags.size,
      deprecated: allNodes.filter(n => n.deprecated).length
    };
  }

  /**
   * Export registry metadata as JSON
   */
  public exportMetadata(): string {
    const data = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      nodes: this.getAllNodes(),
      categories: this.getCategories(),
      tags: this.getTags()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all registrations (useful for testing)
   */
  public clear(): void {
    this.nodes.clear();
    this.categories.clear();
    this.tags.clear();
  }

  /**
   * Validate node metadata
   */
  private validateMetadata(metadata: NodeMetadata): void {
    if (!metadata.type) {
      throw new Error('Node type is required');
    }
    if (!metadata.displayName) {
      throw new Error('Node displayName is required');
    }
    if (!metadata.category) {
      throw new Error('Node category is required');
    }
    if (!metadata.description) {
      throw new Error('Node description is required');
    }
    if (!metadata.version) {
      throw new Error('Node version is required');
    }
    if (!Array.isArray(metadata.tags)) {
      throw new Error('Node tags must be an array');
    }
    if (!Array.isArray(metadata.inputs)) {
      throw new Error('Node inputs must be an array');
    }
    if (!Array.isArray(metadata.outputs)) {
      throw new Error('Node outputs must be an array');
    }
  }
}

/**
 * Decorator to automatically register a node class
 */
export function RegisterNode(metadata: NodeMetadata) {
  return function <T extends new (...args: any[]) => INode>(constructor: T) {
    const registry = NodeRegistry.getInstance();
    registry.register(constructor as any, metadata);
    return constructor;
  };
}

/**
 * Helper function to register a node
 */
export function registerNode(
  nodeClass: new (config?: Partial<NodeConfig>) => INode,
  metadata: NodeMetadata
): void {
  const registry = NodeRegistry.getInstance();
  registry.register(nodeClass, metadata);
}

/**
 * Helper function to create a node by type
 */
export function createNode(type: string, config?: Partial<NodeConfig>): INode {
  const registry = NodeRegistry.getInstance();
  return registry.create(type, config);
}
