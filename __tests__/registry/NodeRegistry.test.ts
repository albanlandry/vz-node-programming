/**
 * Unit Tests for NodeRegistry
 * 
 * Tests the node registry functionality including:
 * - Registration and unregistration
 * - Node creation
 * - Search and filtering
 * - Metadata management
 * - Statistics
 */

import { NodeRegistry } from '../../src/registry/NodeRegistry';
import { BaseNode } from '../../src/core/BaseNode';
import { DataTypes } from '../../src/types';
import type { NodeMetadata } from '../../src/registry/NodeRegistry';

class TestNode extends BaseNode {
  constructor(config?: any) {
    super({
      id: config?.id,
      name: config?.name || 'Test Node',
      description: config?.description,
      inputs: config?.inputs || [],
      outputs: config?.outputs || [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
  }

  protected async executeInternal(): Promise<Map<string, unknown>> {
    return new Map();
  }
}

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    // Get fresh instance and clear it
    registry = NodeRegistry.getInstance();
    // Clear all registrations
    const allTypes = Array.from(registry.getAll().map(n => n.metadata.type));
    allTypes.forEach(type => {
      try {
        registry.unregister(type);
      } catch {
        // Ignore errors
      }
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NodeRegistry.getInstance();
      const instance2 = NodeRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Registration', () => {
    it('should register a node type', () => {
      const metadata: NodeMetadata = {
        type: 'test.simple',
        displayName: 'Simple Test',
        category: 'Test',
        description: 'A simple test node',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [
          {
            id: 'output',
            name: 'Output',
            dataType: DataTypes.ANY,
          },
        ],
      };

      registry.register(TestNode, metadata);

      expect(registry.has('test.simple')).toBe(true);
    });

    it('should throw error when registering duplicate type', () => {
      const metadata: NodeMetadata = {
        type: 'test.duplicate',
        displayName: 'Duplicate Test',
        category: 'Test',
        description: 'A duplicate test node',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      expect(() => {
        registry.register(TestNode, metadata);
      }).toThrow('already registered');
    });

    it('should validate metadata on registration', () => {
      const invalidMetadata = {
        type: '', // Empty type - invalid
        displayName: 'Test',
        category: 'Test',
        description: 'Test',
        version: '1.0.0',
        tags: [],
        inputs: [],
        outputs: [],
      } as NodeMetadata;

      expect(() => {
        registry.register(TestNode, invalidMetadata);
      }).toThrow();
    });

    it('should track categories and tags', () => {
      const metadata: NodeMetadata = {
        type: 'test.categorized',
        displayName: 'Categorized Test',
        category: 'CustomCategory',
        description: 'A categorized test node',
        version: '1.0.0',
        tags: ['tag1', 'tag2'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      const categories = registry.getCategories();
      expect(categories).toContain('CustomCategory');

      const tags = registry.getTags();
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
    });
  });

  describe('Unregistration', () => {
    it('should unregister a node type', () => {
      const metadata: NodeMetadata = {
        type: 'test.unregister',
        displayName: 'Unregister Test',
        category: 'Test',
        description: 'A test node to unregister',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);
      expect(registry.has('test.unregister')).toBe(true);

      registry.unregister('test.unregister');
      expect(registry.has('test.unregister')).toBe(false);
    });

    it('should throw error when unregistering non-existent type', () => {
      expect(() => {
        registry.unregister('test.nonexistent');
      }).toThrow('not registered');
    });
  });

  describe('Node Creation', () => {
    it('should create a node instance', () => {
      const metadata: NodeMetadata = {
        type: 'test.create',
        displayName: 'Create Test',
        category: 'Test',
        description: 'A test node for creation',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      const node = registry.create('test.create');
      expect(node).toBeInstanceOf(TestNode);
      expect(node.name).toBe('Test Node');
    });

    it('should create node with custom config', () => {
      const metadata: NodeMetadata = {
        type: 'test.create-config',
        displayName: 'Create Config Test',
        category: 'Test',
        description: 'A test node with config',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      const node = registry.create('test.create-config', {
        name: 'Custom Name',
        description: 'Custom description',
      });

      expect(node.name).toBe('Custom Name');
      expect(node.description).toBe('Custom description');
    });

    it('should throw error when creating non-existent type', () => {
      expect(() => {
        registry.create('test.nonexistent');
      }).toThrow('not registered');
    });
  });

  describe('Metadata Retrieval', () => {
    it('should get metadata for registered node', () => {
      const metadata: NodeMetadata = {
        type: 'test.metadata',
        displayName: 'Metadata Test',
        category: 'Test',
        description: 'A test node for metadata',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      const retrieved = registry.getMetadata('test.metadata');
      expect(retrieved).toEqual(metadata);
    });

    it('should return undefined for non-existent metadata', () => {
      const metadata = registry.getMetadata('test.nonexistent');
      expect(metadata).toBeUndefined();
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      // Register multiple nodes for testing
      registry.register(TestNode, {
        type: 'test.search1',
        displayName: 'HTTP Request Node',
        category: 'Network',
        description: 'Makes HTTP requests',
        version: '1.0.0',
        tags: ['http', 'network', 'api'],
        inputs: [],
        outputs: [],
      });

      registry.register(TestNode, {
        type: 'test.search2',
        displayName: 'Database Query',
        category: 'Database',
        description: 'Executes database queries',
        version: '1.0.0',
        tags: ['database', 'sql', 'query'],
        inputs: [],
        outputs: [],
      });

      registry.register(TestNode, {
        type: 'test.search3',
        displayName: 'Transform Data',
        category: 'Data',
        description: 'Transforms data structures',
        version: '1.0.0',
        tags: ['transform', 'data'],
        inputs: [],
        outputs: [],
      });
    });

    it('should search nodes by text', () => {
      const results = registry.search('http');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(n => n.metadata.type === 'test.search1')).toBe(true);
    });

    it('should search nodes by description', () => {
      const results = registry.search('database');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(n => n.metadata.type === 'test.search2')).toBe(true);
    });

    it('should filter nodes by category', () => {
      const networkNodes = registry.getByCategory('Network');
      expect(networkNodes.length).toBeGreaterThan(0);
      expect(networkNodes.every(n => n.metadata.category === 'Network')).toBe(true);
    });

    it('should filter nodes by tag', () => {
      const httpNodes = registry.getByTag('http');
      expect(httpNodes.length).toBeGreaterThan(0);
      expect(httpNodes.every(n => n.metadata.tags.includes('http'))).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const results = registry.getByCategory('NonExistent');
      expect(results).toEqual([]);
    });

    it('should return empty array for non-existent tag', () => {
      const results = registry.getByTag('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      registry.register(TestNode, {
        type: 'test.stats1',
        displayName: 'Stats Test 1',
        category: 'Category1',
        description: 'Test',
        version: '1.0.0',
        tags: ['tag1', 'tag2'],
        inputs: [],
        outputs: [],
      });

      registry.register(TestNode, {
        type: 'test.stats2',
        displayName: 'Stats Test 2',
        category: 'Category2',
        description: 'Test',
        version: '1.0.0',
        tags: ['tag2', 'tag3'],
        deprecated: true,
        inputs: [],
        outputs: [],
      });

      const stats = registry.getStats();

      expect(stats.totalNodes).toBeGreaterThanOrEqual(2);
      expect(stats.categories).toBeGreaterThanOrEqual(2);
      expect(stats.tags).toBeGreaterThanOrEqual(3);
      expect(stats.deprecated).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Catalog Export', () => {
    it('should export catalog of all nodes', () => {
      registry.register(TestNode, {
        type: 'test.catalog',
        displayName: 'Catalog Test',
        category: 'Test',
        description: 'A test node for catalog',
        version: '1.0.0',
        tags: ['test'],
        inputs: [],
        outputs: [],
      });

      const catalog = registry.exportCatalog();
      expect(catalog).toBeDefined();
      expect(catalog.nodes).toBeDefined();
      expect(Array.isArray(catalog.nodes)).toBe(true);
      expect(catalog.nodes.length).toBeGreaterThan(0);
    });

    it('should include metadata in catalog', () => {
      const metadata: NodeMetadata = {
        type: 'test.catalog-meta',
        displayName: 'Catalog Meta Test',
        category: 'Test',
        description: 'A test node with metadata',
        version: '1.0.0',
        tags: ['test'],
        icon: '🔧',
        color: '#FF0000',
        inputs: [],
        outputs: [],
      };

      registry.register(TestNode, metadata);

      const catalog = registry.exportCatalog();
      const node = catalog.nodes.find(n => n.metadata.type === 'test.catalog-meta');
      expect(node).toBeDefined();
      expect(node?.metadata.icon).toBe('🔧');
      expect(node?.metadata.color).toBe('#FF0000');
    });
  });

  describe('Get All', () => {
    it('should return all registered nodes', () => {
      registry.register(TestNode, {
        type: 'test.all1',
        displayName: 'All Test 1',
        category: 'Test',
        description: 'Test',
        version: '1.0.0',
        tags: [],
        inputs: [],
        outputs: [],
      });

      registry.register(TestNode, {
        type: 'test.all2',
        displayName: 'All Test 2',
        category: 'Test',
        description: 'Test',
        version: '1.0.0',
        tags: [],
        inputs: [],
        outputs: [],
      });

      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.some(n => n.metadata.type === 'test.all1')).toBe(true);
      expect(all.some(n => n.metadata.type === 'test.all2')).toBe(true);
    });
  });
});

