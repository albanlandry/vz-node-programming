/**
 * Unit Tests for BaseNode
 * 
 * Tests the core functionality of the BaseNode abstract class including:
 * - Node initialization
 * - Input/output validation
 * - Property management
 * - Error handling
 * - Execution flow
 */

import { BaseNode } from '../../src/core/BaseNode';
import { DataTypes, NodeError, ExecutionContext, PortId } from '../../src/types';

/**
 * Concrete implementation of BaseNode for testing
 */
class TestNode extends BaseNode {
  private outputValue: unknown = 'default';

  constructor(config: {
    id?: string;
    name: string;
    description?: string;
    inputs?: any[];
    outputs?: any[];
  }) {
    super(config);
  }

  setOutputValue(value: unknown): void {
    this.outputValue = value;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    if (this.outputs.length > 0) {
      outputs.set(this.outputs[0].id, this.outputValue);
    }
    return outputs;
  }
}

describe('BaseNode', () => {
  describe('Initialization', () => {
    it('should create a node with provided ID', () => {
      const node = new TestNode({
        id: 'test-node-1',
        name: 'Test Node',
        inputs: [],
        outputs: [],
      });

      expect(node.id).toBe('test-node-1');
      expect(node.name).toBe('Test Node');
    });

    it('should generate UUID if ID not provided', () => {
      const node1 = new TestNode({
        name: 'Test Node 1',
        inputs: [],
        outputs: [],
      });
      const node2 = new TestNode({
        name: 'Test Node 2',
        inputs: [],
        outputs: [],
      });

      expect(node1.id).toBeDefined();
      expect(node2.id).toBeDefined();
      expect(node1.id).not.toBe(node2.id);
    });

    it('should initialize with description', () => {
      const node = new TestNode({
        name: 'Test Node',
        description: 'A test node',
        inputs: [],
        outputs: [],
      });

      expect(node.description).toBe('A test node');
    });

    it('should initialize with empty inputs and outputs if not provided', () => {
      const node = new TestNode({
        name: 'Test Node',
      });

      expect(node.inputs).toEqual([]);
      expect(node.outputs).toEqual([]);
    });

    it('should initialize with provided inputs and outputs', () => {
      const inputs = [
        {
          id: 'input1',
          name: 'Input 1',
          dataType: DataTypes.STRING,
          required: true,
        },
      ];
      const outputs = [
        {
          id: 'output1',
          name: 'Output 1',
          dataType: DataTypes.STRING,
        },
      ];

      const node = new TestNode({
        name: 'Test Node',
        inputs,
        outputs,
      });

      expect(node.inputs).toEqual(inputs);
      expect(node.outputs).toEqual(outputs);
    });
  });

  describe('Validation', () => {
    it('should validate node with valid configuration', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
          },
        ],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: DataTypes.STRING,
          },
        ],
      });

      expect(node.validate()).toBe(true);
    });

    it('should fail validation with duplicate port IDs', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'port1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
          },
        ],
        outputs: [
          {
            id: 'port1', // Duplicate ID
            name: 'Output 1',
            dataType: DataTypes.STRING,
          },
        ],
      });

      expect(node.validate()).toBe(false);
    });

    it('should fail validation with missing port id', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            // Missing id
            name: 'Input 1',
            dataType: DataTypes.STRING,
          } as any,
        ],
        outputs: [],
      });

      expect(node.validate()).toBe(false);
    });

    it('should fail validation with missing port name', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            // Missing name
            dataType: DataTypes.STRING,
          } as any,
        ],
        outputs: [],
      });

      expect(node.validate()).toBe(false);
    });

    it('should fail validation with missing port dataType', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            // Missing dataType
          } as any,
        ],
        outputs: [],
      });

      expect(node.validate()).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should accept valid required input', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
            required: true,
          },
        ],
        outputs: [],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map([['input1', 'test value']]),
        outputs: new Map(),
        metadata: new Map(),
      };

      // Should not throw
      expect(() => {
        // Access protected method via public execute
        node.execute(context);
      }).not.toThrow();
    });

    it('should throw error for missing required input', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
            required: true,
          },
        ],
        outputs: [],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(), // Missing required input
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NodeError);
      expect(result.error?.message).toContain('Required input');
    });

    it('should accept optional input when not provided', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
            required: false,
          },
        ],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: DataTypes.STRING,
          },
        ],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(), // Optional input not provided
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);
      expect(result.success).toBe(true);
    });

    it('should validate input type with validator', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: {
              name: 'number',
              validator: (value: any) => typeof value === 'number',
            },
            required: true,
          },
        ],
        outputs: [],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map([['input1', 'not a number']]), // Invalid type
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('invalid type');
    });
  });

  describe('Output Validation', () => {
    it('should validate output type with validator', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: {
              name: 'number',
              validator: (value: any) => typeof value === 'number',
            },
          },
        ],
      });

      node.setOutputValue('not a number'); // Invalid output type

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('invalid type');
    });

    it('should accept valid output type', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: {
              name: 'number',
              validator: (value: any) => typeof value === 'number',
            },
          },
        ],
      });

      node.setOutputValue(42); // Valid output type

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);
      expect(result.success).toBe(true);
      expect(result.outputs?.get('output1')).toBe(42);
    });
  });

  describe('Execution', () => {
    it('should execute successfully and return result', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: DataTypes.STRING,
          },
        ],
      });

      node.setOutputValue('test output');

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);

      expect(result.success).toBe(true);
      expect(result.outputs?.get('output1')).toBe('test output');
      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle execution errors gracefully', async () => {
      class ErrorNode extends BaseNode {
        constructor() {
          super({
            name: 'Error Node',
            inputs: [],
            outputs: [],
          });
        }

        protected async executeInternal(): Promise<Map<PortId, unknown>> {
          throw new Error('Execution failed');
        }
      }

      const node = new ErrorNode();
      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NodeError);
      expect(result.error?.message).toBe('Execution failed');
      expect(result.executionTime).toBeDefined();
    });

    it('should call error handler if provided', async () => {
      class ErrorNode extends BaseNode {
        constructor() {
          super({
            name: 'Error Node',
            inputs: [],
            outputs: [],
          });
        }

        protected async executeInternal(): Promise<Map<PortId, unknown>> {
          throw new Error('Execution failed');
        }
      }

      const node = new ErrorNode();
      const errorHandler = jest.fn();
      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
        errorHandler,
      };

      await node.execute(context);

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(expect.any(NodeError));
    });

    it('should preserve NodeError instances', async () => {
      class ErrorNode extends BaseNode {
        constructor() {
          super({
            name: 'Error Node',
            inputs: [],
            outputs: [],
          });
        }

        protected async executeInternal(): Promise<Map<PortId, unknown>> {
          throw new NodeError('Custom error', 'node-id', 'port-id');
        }
      }

      const node = new ErrorNode();
      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      const result = await node.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NodeError);
      expect(result.error?.nodeId).toBe('node-id');
      expect(result.error?.portId).toBe('port-id');
    });
  });

  describe('Property Management', () => {
    it('should set and get properties', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [],
      });

      node.setProperty('key1', 'value1');
      node.setProperty('key2', 42);

      expect(node.getProperty('key1')).toBe('value1');
      expect(node.getProperty<number>('key2')).toBe(42);
      expect(node.getProperty('nonexistent')).toBeUndefined();
    });

    it('should get all properties', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [],
      });

      node.setProperty('key1', 'value1');
      node.setProperty('key2', 42);
      node.setProperty('key3', { nested: 'object' });

      const properties = node.getProperties();
      expect(properties).toEqual({
        key1: 'value1',
        key2: 42,
        key3: { nested: 'object' },
      });
    });

    it('should overwrite existing properties', () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [],
      });

      node.setProperty('key1', 'value1');
      node.setProperty('key1', 'value2');

      expect(node.getProperty('key1')).toBe('value2');
    });
  });

  describe('Helper Methods', () => {
    it('should get input value with type safety', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
          },
        ],
        outputs: [],
      });

      // Access protected method via a test helper
      class TestableNode extends TestNode {
        public testGetInput<T>(context: ExecutionContext, portId: PortId): T | undefined {
          return this.getInput<T>(context, portId);
        }
      }

      const testNode = new TestableNode({
        name: 'Test Node',
        inputs: [
          {
            id: 'input1',
            name: 'Input 1',
            dataType: DataTypes.STRING,
          },
        ],
        outputs: [],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map([['input1', 'test value']]),
        outputs: new Map(),
        metadata: new Map(),
      };

      const value = testNode.testGetInput<string>(context, 'input1');
      expect(value).toBe('test value');
    });

    it('should set output value', async () => {
      const node = new TestNode({
        name: 'Test Node',
        inputs: [],
        outputs: [
          {
            id: 'output1',
            name: 'Output 1',
            dataType: DataTypes.STRING,
          },
        ],
      });

      const context: ExecutionContext = {
        executionId: 'exec-1',
        inputs: new Map(),
        outputs: new Map(),
        metadata: new Map(),
      };

      node.setOutputValue('test output');
      const result = await node.execute(context);

      expect(result.outputs?.get('output1')).toBe('test output');
    });
  });
});

