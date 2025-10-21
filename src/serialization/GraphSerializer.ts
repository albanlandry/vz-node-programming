import { INode, NodeId, Connection, PortId } from '../types';
import { NodeRegistry } from '../registry/NodeRegistry';
import { NodeExecutor } from '../core/NodeExecutor';

/**
 * Serialized node representation
 */
export interface SerializedNode {
  id: NodeId;
  type: string;
  name: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

/**
 * Serialized connection representation
 */
export interface SerializedConnection {
  id: string;
  from: {
    nodeId: NodeId;
    portId: PortId;
  };
  to: {
    nodeId: NodeId;
    portId: PortId;
  };
}

/**
 * Complete graph definition
 */
export interface GraphDefinition {
  version: string;
  name: string;
  description?: string;
  author?: string;
  created?: string;
  modified?: string;
  nodes: SerializedNode[];
  connections: SerializedConnection[];
  metadata?: Record<string, any>;
}

/**
 * Serializes and deserializes node graphs to/from JSON/YAML
 */
export class GraphSerializer {
  private registry: NodeRegistry;

  constructor() {
    this.registry = NodeRegistry.getInstance();
  }

  /**
   * Serialize an executor's graph to a definition
   */
  public serializeExecutor(executor: NodeExecutor, metadata?: {
    name?: string;
    description?: string;
    author?: string;
  }): GraphDefinition {
    const nodes = executor.getNodes();
    const connections = executor.getConnections();

    return this.serializeGraph(nodes, connections, metadata);
  }

  /**
   * Serialize nodes and connections to a graph definition
   */
  public serializeGraph(
    nodes: INode[],
    connections: Connection[],
    metadata?: {
      name?: string;
      description?: string;
      author?: string;
    }
  ): GraphDefinition {
    const serializedNodes: SerializedNode[] = nodes.map(node => {
      const nodeMetadata = this.registry.getMetadata(this.getNodeType(node));
      
      return {
        id: node.id,
        type: this.getNodeType(node),
        name: node.name,
        config: {
          description: node.description
        },
        position: { x: 0, y: 0 }, // Default position, can be updated by UI
        metadata: nodeMetadata ? {
          category: nodeMetadata.category,
          icon: nodeMetadata.icon,
          color: nodeMetadata.color
        } : undefined
      };
    });

    const serializedConnections: SerializedConnection[] = connections.map(conn => ({
      id: conn.id,
      from: {
        nodeId: conn.fromNode,
        portId: conn.fromPort
      },
      to: {
        nodeId: conn.toNode,
        portId: conn.toPort
      }
    }));

    return {
      version: '1.0.0',
      name: metadata?.name || 'Untitled Graph',
      description: metadata?.description,
      author: metadata?.author,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodes: serializedNodes,
      connections: serializedConnections,
      metadata: {}
    };
  }

  /**
   * Export graph definition to JSON string
   */
  public toJSON(definition: GraphDefinition, pretty: boolean = true): string {
    return JSON.stringify(definition, null, pretty ? 2 : 0);
  }

  /**
   * Export graph definition to YAML string
   */
  public toYAML(definition: GraphDefinition): string {
    // Simple YAML serialization
    // For production, consider using a library like 'js-yaml'
    return this.simpleYAMLStringify(definition);
  }

  /**
   * Parse graph definition from JSON string
   */
  public fromJSON(json: string): GraphDefinition {
    try {
      const definition = JSON.parse(json) as GraphDefinition;
      this.validateGraphDefinition(definition);
      return definition;
    } catch (error) {
      throw new Error(`Failed to parse graph JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Deserialize graph definition into executor
   */
  public deserializeToExecutor(definition: GraphDefinition): NodeExecutor {
    this.validateGraphDefinition(definition);

    const executor = new NodeExecutor();
    const nodeMap = new Map<NodeId, INode>();

    // Create nodes
    for (const serializedNode of definition.nodes) {
      try {
        const node = this.registry.create(serializedNode.type, {
          id: serializedNode.id,
          name: serializedNode.name,
          description: serializedNode.config?.description
        });

        executor.addNode(node);
        nodeMap.set(serializedNode.id, node);
      } catch (error) {
        console.warn(`Failed to create node ${serializedNode.id} of type ${serializedNode.type}:`, error);
      }
    }

    // Create connections
    for (const serializedConn of definition.connections) {
      try {
        const connection: Connection = {
          id: serializedConn.id,
          fromNode: serializedConn.from.nodeId,
          fromPort: serializedConn.from.portId,
          toNode: serializedConn.to.nodeId,
          toPort: serializedConn.to.portId
        };

        executor.addConnection(connection);
      } catch (error) {
        console.warn(`Failed to create connection ${serializedConn.id}:`, error);
      }
    }

    return executor;
  }

  /**
   * Clone a graph definition
   */
  public cloneDefinition(definition: GraphDefinition): GraphDefinition {
    return JSON.parse(JSON.stringify(definition));
  }

  /**
   * Merge two graph definitions
   */
  public mergeDefinitions(def1: GraphDefinition, def2: GraphDefinition): GraphDefinition {
    return {
      version: def1.version,
      name: `${def1.name} + ${def2.name}`,
      description: `Merged: ${def1.description || ''} + ${def2.description || ''}`,
      author: def1.author,
      created: def1.created,
      modified: new Date().toISOString(),
      nodes: [...def1.nodes, ...def2.nodes],
      connections: [...def1.connections, ...def2.connections],
      metadata: { ...def1.metadata, ...def2.metadata }
    };
  }

  /**
   * Validate graph definition
   */
  private validateGraphDefinition(definition: GraphDefinition): void {
    if (!definition.version) {
      throw new Error('Graph definition missing version');
    }
    if (!definition.name) {
      throw new Error('Graph definition missing name');
    }
    if (!Array.isArray(definition.nodes)) {
      throw new Error('Graph definition nodes must be an array');
    }
    if (!Array.isArray(definition.connections)) {
      throw new Error('Graph definition connections must be an array');
    }

    // Validate nodes
    for (const node of definition.nodes) {
      if (!node.id) {
        throw new Error('Node missing id');
      }
      if (!node.type) {
        throw new Error(`Node ${node.id} missing type`);
      }
      if (!this.registry.isRegistered(node.type)) {
        console.warn(`Node type ${node.type} is not registered`);
      }
    }

    // Validate connections
    const nodeIds = new Set(definition.nodes.map(n => n.id));
    for (const conn of definition.connections) {
      if (!nodeIds.has(conn.from.nodeId)) {
        throw new Error(`Connection ${conn.id} references non-existent node ${conn.from.nodeId}`);
      }
      if (!nodeIds.has(conn.to.nodeId)) {
        throw new Error(`Connection ${conn.id} references non-existent node ${conn.to.nodeId}`);
      }
    }
  }

  /**
   * Get node type from node instance
   * This tries to match the node to a registered type
   */
  private getNodeType(node: INode): string {
    // Try to find matching type in registry
    const allTypes = this.registry.getAllTypes();
    
    for (const type of allTypes) {
      const metadata = this.registry.getMetadata(type);
      if (metadata && metadata.displayName === node.name) {
        return type;
      }
    }

    // Fallback: use node name as type
    return node.name.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Simple YAML serialization (basic implementation)
   * For production, use a proper YAML library
   */
  private simpleYAMLStringify(obj: any, indent: number = 0): string {
    const spaces = ' '.repeat(indent);
    const lines: string[] = [];

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${spaces}-`);
          lines.push(this.simpleYAMLStringify(item, indent + 2));
        } else {
          lines.push(`${spaces}- ${this.yamlValue(item)}`);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          lines.push(`${spaces}${key}:`);
          lines.push(this.simpleYAMLStringify(value, indent + 2));
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`${spaces}${key}:`);
          lines.push(this.simpleYAMLStringify(value, indent + 2));
        } else {
          lines.push(`${spaces}${key}: ${this.yamlValue(value)}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * Format value for YAML
   */
  private yamlValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      // Escape strings if needed
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }
}
