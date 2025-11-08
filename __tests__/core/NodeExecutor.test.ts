/**
 * Unit Tests for NodeExecutor - Basic Execution
 * 
 * Tests the core execution functionality of NodeExecutor including:
 * - Node management (add, remove)
 * - Connection management
 * - Sequential execution
 * - Parallel execution
 * - Dependency resolution
 * - Circular dependency detection
 * - Error handling
 * - Event emission
 */

import { NodeExecutor } from '../../src/core/NodeExecutor';
import { BaseNode } from '../../src/core/BaseNode';
import { DataTypes, NodeError, NodeEventType } from '../../src/types';
import type { ExecutionContext, PortId, Connection } from '../../src/types';

/**
 * Simple test node that outputs a value
 */
class SimpleNode extends BaseNode {
  private outputValue: unknown;

  constructor(id: string, outputValue: unknown = 'default') {
    super({
      id,
      name: 'Simple Node',
      inputs: [],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
    this.outputValue = outputValue;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    outputs.set('output', this.outputValue);
    return outputs;
  }
}

/**
 * Node that takes an input and transforms it
 */
class TransformNode extends BaseNode {
  private transformFn: (value: unknown) => unknown;

  constructor(id: string, transformFn: (value: unknown) => unknown = (v) => v) {
    super({
      id,
      name: 'Transform Node',
      inputs: [
        {
          id: 'input',
          name: 'Input',
          dataType: DataTypes.ANY,
          required: true,
        },
      ],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
    this.transformFn = transformFn;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const input = context.inputs.get('input');
    const outputs = new Map<PortId, unknown>();
    outputs.set('output', this.transformFn(input));
    return outputs;
  }
}

/**
 * Node that can fail
 */
class FailingNode extends BaseNode {
  private shouldFail: boolean;
  private errorMessage: string;

  constructor(id: string, shouldFail: boolean = false, errorMessage: string = 'Node failed') {
    super({
      id,
      name: 'Failing Node',
      inputs: [],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
    this.shouldFail = shouldFail;
    this.errorMessage = errorMessage;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }
    const outputs = new Map<PortId, unknown>();
    outputs.set('output', 'success');
    return outputs;
  }
}

/**
 * Async node that delays execution
 */
class DelayNode extends BaseNode {
  private delayMs: number;

  constructor(id: string, delayMs: number = 10) {
    super({
      id,
      name: 'Delay Node',
      inputs: [],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
    this.delayMs = delayMs;
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    await new Promise(resolve => setTimeout(resolve, this.delayMs));
    const outputs = new Map<PortId, unknown>();
    outputs.set('output', `delayed-${this.delayMs}`);
    return outputs;
  }
}

describe('NodeExecutor - Basic Execution', () => {
  let executor: NodeExecutor;

  beforeEach(() => {
    executor = new NodeExecutor();
  });

  describe('Node Management', () => {
    it('should add a node to the executor', () => {
      const node = new SimpleNode('node-1');
      executor.addNode(node);

      // Verify node was added (indirectly by executing)
      expect(() => executor.execute()).not.toThrow();
    });

    it('should throw error when adding invalid node', () => {
      class InvalidNode extends BaseNode {
        constructor() {
          super({
            name: 'Invalid Node',
            inputs: [
              {
                id: 'port1',
                name: 'Port 1',
                dataType: DataTypes.ANY,
              },
            ],
            outputs: [
              {
                id: 'port1', // Duplicate ID - invalid
                name: 'Port 1',
                dataType: DataTypes.ANY,
              },
            ],
          });
        }

        protected async executeInternal(): Promise<Map<PortId, unknown>> {
          return new Map();
        }
      }

      const node = new InvalidNode();
      expect(() => executor.addNode(node)).toThrow('failed validation');
    });

    it('should remove a node from the executor', () => {
      const node = new SimpleNode('node-1');
      executor.addNode(node);
      executor.removeNode('node-1');

      // Verify node was removed
      expect(() => executor.removeNode('node-1')).toThrow('not found');
    });

    it('should remove connections when removing a node', () => {
      const node1 = new SimpleNode('node-1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      });

      executor.removeNode('node-1');

      // Connection should be removed
      expect(() => executor.removeConnection('conn-1')).toThrow('not found');
    });

    it('should emit NODE_ADDED event when adding a node', (done) => {
      const node = new SimpleNode('node-1');
      
      executor.on(NodeEventType.NODE_ADDED, (event) => {
        expect(event.node).toBe(node);
        done();
      });

      executor.addNode(node);
    });

    it('should emit NODE_REMOVED event when removing a node', (done) => {
      const node = new SimpleNode('node-1');
      executor.addNode(node);

      executor.on(NodeEventType.NODE_REMOVED, (event) => {
        expect(event.nodeId).toBe('node-1');
        done();
      });

      executor.removeNode('node-1');
    });
  });

  describe('Connection Management', () => {
    it('should add a connection between nodes', () => {
      const node1 = new SimpleNode('node-1', 'value1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      const connection: Connection = {
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      };

      executor.addConnection(connection);

      // Verify connection works by executing
      const results = executor.execute();
      expect(results).toBeDefined();
    });

    it('should throw error when adding invalid connection', () => {
      const node1 = new SimpleNode('node-1');
      executor.addNode(node1);

      const connection: Connection = {
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'nonexistent', // Invalid port
        toNode: 'node-2', // Node doesn't exist
        toPort: 'input',
      };

      expect(() => executor.addConnection(connection)).toThrow();
    });

    it('should remove a connection', () => {
      const node1 = new SimpleNode('node-1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      });

      executor.removeConnection('conn-1');
      expect(() => executor.removeConnection('conn-1')).toThrow('not found');
    });

    it('should emit CONNECTION_ADDED event when adding a connection', (done) => {
      const node1 = new SimpleNode('node-1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      const connection: Connection = {
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      };

      executor.on(NodeEventType.CONNECTION_ADDED, (event) => {
        expect(event.connection).toEqual(connection);
        done();
      });

      executor.addConnection(connection);
    });

    it('should emit CONNECTION_REMOVED event when removing a connection', (done) => {
      const node1 = new SimpleNode('node-1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      });

      executor.on(NodeEventType.CONNECTION_REMOVED, (event) => {
        expect(event.connectionId).toBe('conn-1');
        done();
      });

      executor.removeConnection('conn-1');
    });
  });

  describe('Sequential Execution', () => {
    it('should execute a single node', async () => {
      const node = new SimpleNode('node-1', 'test-value');
      executor.addNode(node);

      const results = await executor.execute();

      expect(results.has('node-1')).toBe(true);
      const result = results.get('node-1');
      expect(result?.success).toBe(true);
      expect(result?.outputs?.get('output')).toBe('test-value');
    });

    it('should execute nodes in dependency order', async () => {
      const node1 = new SimpleNode('node-1', 'value1');
      const node2 = new TransformNode('node-2', (v) => `transformed-${v}`);
      executor.addNode(node1);
      executor.addNode(node2);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      });

      const results = await executor.execute();

      expect(results.get('node-1')?.success).toBe(true);
      expect(results.get('node-2')?.success).toBe(true);
      expect(results.get('node-2')?.outputs?.get('output')).toBe('transformed-value1');
    });

    it('should execute independent nodes in any order', async () => {
      const node1 = new SimpleNode('node-1', 'value1');
      const node2 = new SimpleNode('node-2', 'value2');
      executor.addNode(node1);
      executor.addNode(node2);

      const results = await executor.execute();

      expect(results.get('node-1')?.success).toBe(true);
      expect(results.get('node-2')?.success).toBe(true);
    });

    it('should handle initial inputs', async () => {
      const node = new TransformNode('node-1', (v) => `transformed-${v}`);
      executor.addNode(node);

      const initialInputs = new Map();
      initialInputs.set('node-1', new Map([['input', 'initial-value']]));

      const results = await executor.execute(initialInputs);

      expect(results.get('node-1')?.outputs?.get('output')).toBe('transformed-initial-value');
    });

    it('should emit execution events', async () => {
      const node = new SimpleNode('node-1');
      executor.addNode(node);

      const events: any[] = [];
      executor.on(NodeEventType.EXECUTION_STARTED, (event) => events.push({ type: 'started', event }));
      executor.on(NodeEventType.EXECUTION_COMPLETED, (event) => events.push({ type: 'completed', event }));

      await executor.execute();

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'completed')).toBe(true);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute independent nodes in parallel', async () => {
      const node1 = new DelayNode('node-1', 50);
      const node2 = new DelayNode('node-2', 50);
      const node3 = new DelayNode('node-3', 50);
      executor.addNode(node1);
      executor.addNode(node2);
      executor.addNode(node3);

      const startTime = Date.now();
      await executor.executeParallel();
      const duration = Date.now() - startTime;

      // If sequential, would take ~150ms. Parallel should be ~50ms
      expect(duration).toBeLessThan(100);
    });

    it('should respect dependencies in parallel execution', async () => {
      const node1 = new DelayNode('node-1', 20);
      const node2 = new DelayNode('node-2', 20);
      const node3 = new TransformNode('node-3');
      executor.addNode(node1);
      executor.addNode(node2);
      executor.addNode(node3);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      });
      executor.addConnection({
        id: 'conn-2',
        fromNode: 'node-2',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      });

      const startTime = Date.now();
      await executor.executeParallel();
      const duration = Date.now() - startTime;

      // node1 and node2 should run in parallel (~20ms), then node3 (~20ms)
      // Total should be ~40ms, not ~60ms (sequential)
      expect(duration).toBeLessThan(60);
    });
  });

  describe('Dependency Resolution', () => {
    it('should detect circular dependencies', () => {
      // Create nodes with both inputs and outputs for circular dependency test
      const node1 = new TransformNode('node-1');
      const node2 = new TransformNode('node-2');
      executor.addNode(node1);
      executor.addNode(node2);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      });

      executor.addConnection({
        id: 'conn-2',
        fromNode: 'node-2',
        fromPort: 'output',
        toNode: 'node-1',
        toPort: 'input',
      });

      expect(async () => {
        await executor.execute();
      }).rejects.toThrow('Circular dependency');
    });

    it('should handle complex dependency graphs', async () => {
      // Create a graph: A -> B -> D, A -> C -> D
      const nodeA = new SimpleNode('node-a', 'a');
      const nodeB = new TransformNode('node-b', (v) => `b-${v}`);
      const nodeC = new TransformNode('node-c', (v) => `c-${v}`);
      const nodeD = new TransformNode('node-d', (v) => `d-${v}`);

      executor.addNode(nodeA);
      executor.addNode(nodeB);
      executor.addNode(nodeC);
      executor.addNode(nodeD);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-a',
        fromPort: 'output',
        toNode: 'node-b',
        toPort: 'input',
      });
      executor.addConnection({
        id: 'conn-2',
        fromNode: 'node-a',
        fromPort: 'output',
        toNode: 'node-c',
        toPort: 'input',
      });
      executor.addConnection({
        id: 'conn-3',
        fromNode: 'node-b',
        fromPort: 'output',
        toNode: 'node-d',
        toPort: 'input',
      });
      executor.addConnection({
        id: 'conn-4',
        fromNode: 'node-c',
        fromPort: 'output',
        toNode: 'node-d',
        toPort: 'input',
      });

      const results = await executor.execute();

      expect(results.get('node-d')?.success).toBe(true);
      // node-d should receive input from both node-b and node-c
      // The last connection wins (node-c)
      expect(results.get('node-d')?.outputs?.get('output')).toContain('c-');
    });
  });

  describe('Error Handling', () => {
    it('should handle node execution errors', async () => {
      const node = new FailingNode('node-1', true, 'Test error');
      executor.addNode(node);

      const results = await executor.execute();

      expect(results.get('node-1')?.success).toBe(false);
      expect(results.get('node-1')?.error).toBeDefined();
      expect(results.get('node-1')?.error?.message).toBe('Test error');
    });

    it('should continue execution after node error', async () => {
      const node1 = new FailingNode('node-1', true, 'Error');
      const node2 = new SimpleNode('node-2', 'success');
      executor.addNode(node1);
      executor.addNode(node2);

      const results = await executor.execute();

      expect(results.get('node-1')?.success).toBe(false);
      expect(results.get('node-2')?.success).toBe(true);
    });

    it('should emit EXECUTION_FAILED event on error', async () => {
      const node = new FailingNode('node-1', true, 'Test error');
      executor.addNode(node);

      const events: any[] = [];
      executor.on(NodeEventType.EXECUTION_FAILED, (event) => events.push(event));

      await executor.execute();

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].error).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty executor', async () => {
      const results = await executor.execute();
      expect(results.size).toBe(0);
    });

    it('should handle node with no inputs or outputs', async () => {
      class EmptyNode extends BaseNode {
        constructor(id: string) {
          super({
            id,
            name: 'Empty Node',
            inputs: [],
            outputs: [],
          });
        }

        protected async executeInternal(): Promise<Map<PortId, unknown>> {
          return new Map();
        }
      }

      const node = new EmptyNode('node-1');
      executor.addNode(node);

      const results = await executor.execute();
      expect(results.get('node-1')?.success).toBe(true);
    });

    it('should handle multiple connections to same input', async () => {
      const node1 = new SimpleNode('node-1', 'value1');
      const node2 = new SimpleNode('node-2', 'value2');
      const node3 = new TransformNode('node-3', (v) => `transformed-${v}`);
      executor.addNode(node1);
      executor.addNode(node2);
      executor.addNode(node3);

      executor.addConnection({
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      });
      executor.addConnection({
        id: 'conn-2',
        fromNode: 'node-2',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      });

      const results = await executor.execute();
      // Last connection should win
      expect(results.get('node-3')?.outputs?.get('output')).toBe('transformed-value2');
    });
  });
});

