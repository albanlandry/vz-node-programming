/**
 * Test Utilities and Helpers
 * 
 * Common utilities for writing tests including:
 * - Mock node factories
 * - Test data generators
 * - Assertion helpers
 * - Execution helpers
 */

import { BaseNode } from '../../src/core/BaseNode';
import { NodeExecutor } from '../../src/core/NodeExecutor';
import { DataTypes, ExecutionContext, PortId } from '../../src/types';
import type { INode, Connection } from '../../src/types';

/**
 * Simple mock node for testing
 */
export class MockNode extends BaseNode {
  private outputValue: unknown;
  private shouldFail: boolean = false;
  private errorMessage: string = 'Mock error';
  private delayMs: number = 0;

  constructor(config: {
    id?: string;
    name?: string;
    outputValue?: unknown;
    shouldFail?: boolean;
    errorMessage?: string;
    delayMs?: number;
    inputs?: any[];
    outputs?: any[];
  } = {}) {
    super({
      id: config.id,
      name: config.name || 'Mock Node',
      inputs: config.inputs || [],
      outputs: config.outputs || [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
    });
    this.outputValue = config.outputValue ?? 'default';
    this.shouldFail = config.shouldFail ?? false;
    this.errorMessage = config.errorMessage ?? 'Mock error';
    this.delayMs = config.delayMs ?? 0;
  }

  setOutputValue(value: unknown): void {
    this.outputValue = value;
  }

  setShouldFail(shouldFail: boolean, errorMessage?: string): void {
    this.shouldFail = shouldFail;
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFail) {
      throw new Error(this.errorMessage);
    }

    const outputs = new Map<PortId, unknown>();
    if (this.outputs.length > 0) {
      outputs.set(this.outputs[0].id, this.outputValue);
    }
    return outputs;
  }
}

/**
 * Transform mock node that processes input
 */
export class MockTransformNode extends BaseNode {
  private transformFn: (value: unknown) => unknown;

  constructor(config: {
    id?: string;
    name?: string;
    transformFn?: (value: unknown) => unknown;
  } = {}) {
    super({
      id: config.id,
      name: config.name || 'Mock Transform Node',
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
    this.transformFn = config.transformFn ?? ((v) => v);
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const input = context.inputs.get('input');
    const outputs = new Map<PortId, unknown>();
    outputs.set('output', this.transformFn(input));
    return outputs;
  }
}

/**
 * Create a simple executor with nodes for testing
 */
export function createTestExecutor(nodes: INode[] = [], connections: Connection[] = []): NodeExecutor {
  const executor = new NodeExecutor();
  nodes.forEach(node => executor.addNode(node));
  connections.forEach(conn => executor.addConnection(conn));
  return executor;
}

/**
 * Create a simple linear graph: node1 -> node2 -> node3
 */
export function createLinearGraph(): {
  executor: NodeExecutor;
  node1: MockNode;
  node2: MockTransformNode;
  node3: MockTransformNode;
} {
  const node1 = new MockNode({ id: 'node-1', name: 'Node 1', outputValue: 'value1' });
  const node2 = new MockTransformNode({ id: 'node-2', name: 'Node 2', transformFn: (v) => `transformed-${v}` });
  const node3 = new MockTransformNode({ id: 'node-3', name: 'Node 3', transformFn: (v) => `final-${v}` });

  const executor = createTestExecutor(
    [node1, node2, node3],
    [
      {
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      },
      {
        id: 'conn-2',
        fromNode: 'node-2',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      },
    ],
  );

  return { executor, node1, node2, node3 };
}

/**
 * Create a parallel graph: node1 -> node2, node1 -> node3
 */
export function createParallelGraph(): {
  executor: NodeExecutor;
  node1: MockNode;
  node2: MockTransformNode;
  node3: MockTransformNode;
} {
  const node1 = new MockNode({ id: 'node-1', name: 'Node 1', outputValue: 'value1' });
  const node2 = new MockTransformNode({ id: 'node-2', name: 'Node 2', transformFn: (v) => `branch1-${v}` });
  const node3 = new MockTransformNode({ id: 'node-3', name: 'Node 3', transformFn: (v) => `branch2-${v}` });

  const executor = createTestExecutor(
    [node1, node2, node3],
    [
      {
        id: 'conn-1',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-2',
        toPort: 'input',
      },
      {
        id: 'conn-2',
        fromNode: 'node-1',
        fromPort: 'output',
        toNode: 'node-3',
        toPort: 'input',
      },
    ],
  );

  return { executor, node1, node2, node3 };
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock execution context
 */
export function createMockContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    executionId: 'exec-1',
    inputs: new Map(),
    outputs: new Map(),
    metadata: new Map(),
    ...overrides,
  };
}

/**
 * Assert that a promise rejects with a specific error message
 */
export async function expectRejection(
  promise: Promise<any>,
  expectedMessage?: string,
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (expectedMessage) {
      expect(error instanceof Error ? error.message : String(error)).toContain(expectedMessage);
    }
  }
}

/**
 * Create a node that delays execution
 */
export function createDelayNode(id: string, delayMs: number): MockNode {
  return new MockNode({ id, delayMs });
}

/**
 * Create a node that fails
 */
export function createFailingNode(id: string, errorMessage: string = 'Test error'): MockNode {
  return new MockNode({ id, shouldFail: true, errorMessage });
}

