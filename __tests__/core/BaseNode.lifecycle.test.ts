/**
 * Unit Tests for BaseNode Lifecycle Hooks
 * 
 * Tests the lifecycle hook functionality including:
 * - onBeforeExecute hook
 * - onAfterExecute hook
 * - onError hook
 * - onInitialize hook
 * - onCleanup hook
 * - Resource registration and cleanup
 */

import { BaseNode } from '../../src/core/BaseNode';
import { DataTypes, ExecutionContext, NodeError, NodeLifecycleHooks } from '../../src/types';

class TestNodeWithHooks extends BaseNode {
  public beforeExecuteCalled: boolean = false;
  public afterExecuteCalled: boolean = false;
  public errorHookCalled: boolean = false;
  public initializeCalled: boolean = false;
  public cleanupCalled: boolean = false;
  public beforeExecuteContext?: ExecutionContext;
  public afterExecuteResult?: any;
  public errorHookError?: NodeError;
  public registeredResources: number = 0;

  constructor(hooks?: NodeLifecycleHooks) {
    super({
      name: 'Test Node',
      inputs: [
        {
          id: 'input',
          name: 'Input',
          dataType: DataTypes.ANY,
        },
      ],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
      lifecycleHooks: hooks,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();
    const input = context.inputs.get('input');
    outputs.set('output', input);
    return outputs;
  }
}

class FailingNodeWithHooks extends BaseNode {
  public errorHookCalled: boolean = false;
  public errorHookError?: NodeError;

  constructor(hooks?: NodeLifecycleHooks) {
    super({
      name: 'Failing Node',
      inputs: [],
      outputs: [
        {
          id: 'output',
          name: 'Output',
          dataType: DataTypes.ANY,
        },
      ],
      lifecycleHooks: hooks,
    });
  }

  protected async executeInternal(): Promise<Map<string, unknown>> {
    throw new Error('Test error');
  }
}

describe('BaseNode Lifecycle Hooks', () => {
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockContext = {
      executionId: 'test-exec',
      inputs: new Map([['input', 'test-value']]),
      outputs: new Map(),
      metadata: new Map(),
    };
  });

  describe('onBeforeExecute Hook', () => {
    it('should call onBeforeExecute before execution', async () => {
      const beforeExecute = jest.fn();
      const node = new TestNodeWithHooks({
        onBeforeExecute: beforeExecute,
      });

      await node.execute(mockContext);

      expect(beforeExecute).toHaveBeenCalledTimes(1);
      expect(beforeExecute).toHaveBeenCalledWith(mockContext);
      expect(node.beforeExecuteCalled).toBe(false); // Not using the test node's flag
    });

    it('should pass execution context to onBeforeExecute', async () => {
      let receivedContext: ExecutionContext | undefined;
      const node = new TestNodeWithHooks({
        onBeforeExecute: (context) => {
          receivedContext = context;
        },
      });

      await node.execute(mockContext);

      expect(receivedContext).toBeDefined();
      expect(receivedContext?.executionId).toBe('test-exec');
      expect(receivedContext?.inputs.get('input')).toBe('test-value');
    });

    it('should fail execution if onBeforeExecute throws', async () => {
      const node = new TestNodeWithHooks({
        onBeforeExecute: () => {
          throw new Error('Before execute failed');
        },
      });

      const result = await node.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('onBeforeExecute hook failed');
    });

    it('should support async onBeforeExecute', async () => {
      const beforeExecute = jest.fn().mockResolvedValue(undefined);
      const node = new TestNodeWithHooks({
        onBeforeExecute: beforeExecute,
      });

      await node.execute(mockContext);

      expect(beforeExecute).toHaveBeenCalled();
    });
  });

  describe('onAfterExecute Hook', () => {
    it('should call onAfterExecute after successful execution', async () => {
      const afterExecute = jest.fn();
      const node = new TestNodeWithHooks({
        onAfterExecute: afterExecute,
      });

      const result = await node.execute(mockContext);

      expect(afterExecute).toHaveBeenCalledTimes(1);
      expect(afterExecute).toHaveBeenCalledWith(mockContext, result);
      expect(result.success).toBe(true);
    });

    it('should pass execution result to onAfterExecute', async () => {
      let receivedResult: any;
      const node = new TestNodeWithHooks({
        onAfterExecute: (context, result) => {
          receivedResult = result;
        },
      });

      const result = await node.execute(mockContext);

      expect(receivedResult).toBeDefined();
      expect(receivedResult.success).toBe(true);
      expect(receivedResult.outputs).toBeDefined();
    });

    it('should not fail execution if onAfterExecute throws', async () => {
      const node = new TestNodeWithHooks({
        onAfterExecute: () => {
          throw new Error('After execute failed');
        },
      });

      const result = await node.execute(mockContext);

      // Execution should still succeed even if after hook fails
      expect(result.success).toBe(true);
    });

    it('should not call onAfterExecute if execution fails', async () => {
      const afterExecute = jest.fn();
      const node = new FailingNodeWithHooks({
        onAfterExecute: afterExecute,
      });

      await node.execute(mockContext);

      expect(afterExecute).not.toHaveBeenCalled();
    });
  });

  describe('onError Hook', () => {
    it('should call onError when execution fails', async () => {
      const onError = jest.fn();
      const node = new FailingNodeWithHooks({
        onError,
      });

      const result = await node.execute(mockContext);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should pass error to onError hook', async () => {
      let receivedError: NodeError | undefined;
      const node = new FailingNodeWithHooks({
        onError: (context, error) => {
          receivedError = error;
        },
      });

      await node.execute(mockContext);

      expect(receivedError).toBeDefined();
      expect(receivedError?.message).toContain('Test error');
    });

    it('should not suppress original error if onError throws', async () => {
      const node = new FailingNodeWithHooks({
        onError: () => {
          throw new Error('Error hook failed');
        },
      });

      const result = await node.execute(mockContext);

      // Original error should still be present
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Test error');
    });
  });

  describe('onInitialize Hook', () => {
    it('should call onInitialize on first execution', async () => {
      const onInitialize = jest.fn();
      const node = new TestNodeWithHooks({
        onInitialize,
      });

      expect(node.isInitialized()).toBe(false);

      await node.execute(mockContext);

      expect(onInitialize).toHaveBeenCalledTimes(1);
      expect(node.isInitialized()).toBe(true);
    });

    it('should only call onInitialize once', async () => {
      const onInitialize = jest.fn();
      const node = new TestNodeWithHooks({
        onInitialize,
      });

      await node.execute(mockContext);
      await node.execute(mockContext);
      await node.execute(mockContext);

      expect(onInitialize).toHaveBeenCalledTimes(1);
    });

    it('should fail execution if onInitialize throws', async () => {
      const node = new TestNodeWithHooks({
        onInitialize: () => {
          throw new Error('Initialize failed');
        },
      });

      const result = await node.execute(mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Initialize failed');
    });

    it('should support async onInitialize', async () => {
      const onInitialize = jest.fn().mockResolvedValue(undefined);
      const node = new TestNodeWithHooks({
        onInitialize,
      });

      await node.execute(mockContext);

      expect(onInitialize).toHaveBeenCalled();
      expect(node.isInitialized()).toBe(true);
    });
  });

  describe('onCleanup Hook', () => {
    it('should call onCleanup when cleanup is called', async () => {
      const onCleanup = jest.fn();
      const node = new TestNodeWithHooks({
        onCleanup,
      });

      await node.cleanup();

      expect(onCleanup).toHaveBeenCalledTimes(1);
    });

    it('should support async onCleanup', async () => {
      const onCleanup = jest.fn().mockResolvedValue(undefined);
      const node = new TestNodeWithHooks({
        onCleanup,
      });

      await node.cleanup();

      expect(onCleanup).toHaveBeenCalled();
    });
  });

  describe('Resource Management', () => {
    it('should register and cleanup resources', async () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();
      const resource1 = { cleanup: cleanup1 };
      const resource2 = { cleanup: cleanup2 };

      class ResourceNode extends BaseNode {
        constructor() {
          super({
            name: 'Resource Node',
            inputs: [],
            outputs: [],
          });
          this.registerResource(resource1);
          this.registerResource(resource2);
        }

        protected async executeInternal(): Promise<Map<string, unknown>> {
          return new Map();
        }
      }

      const node = new ResourceNode();
      await node.cleanup();

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });

    it('should handle resource cleanup errors gracefully', async () => {
      const resource1 = { cleanup: () => { throw new Error('Cleanup failed'); } };
      const resource2 = { cleanup: jest.fn() };

      class ResourceNode extends BaseNode {
        constructor() {
          super({
            name: 'Resource Node',
            inputs: [],
            outputs: [],
          });
          this.registerResource(resource1);
          this.registerResource(resource2);
        }

        protected async executeInternal(): Promise<Map<string, unknown>> {
          return new Map();
        }
      }

      const node = new ResourceNode();
      await node.cleanup();

      // Both should be called, even if one fails
      expect(resource2.cleanup).toHaveBeenCalled();
    });

    it('should unregister resources', async () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();
      const resource1 = { cleanup: cleanup1 };
      const resource2 = { cleanup: cleanup2 };

      class ResourceNode extends BaseNode {
        constructor() {
          super({
            name: 'Resource Node',
            inputs: [],
            outputs: [],
          });
          this.registerResource(resource1);
          this.registerResource(resource2);
          this.unregisterResource(resource1);
        }

        protected async executeInternal(): Promise<Map<string, unknown>> {
          return new Map();
        }
      }

      const node = new ResourceNode();
      await node.cleanup();

      expect(cleanup1).not.toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Execution Order', () => {
    it('should execute hooks in correct order', async () => {
      const executionOrder: string[] = [];

      const node = new TestNodeWithHooks({
        onInitialize: () => {
          executionOrder.push('initialize');
        },
        onBeforeExecute: () => {
          executionOrder.push('before');
        },
        onAfterExecute: () => {
          executionOrder.push('after');
        },
      });

      await node.execute(mockContext);

      expect(executionOrder).toEqual(['initialize', 'before', 'after']);
    });

    it('should call onError instead of onAfterExecute on failure', async () => {
      const executionOrder: string[] = [];

      const node = new FailingNodeWithHooks({
        onBeforeExecute: () => {
          executionOrder.push('before');
        },
        onAfterExecute: () => {
          executionOrder.push('after');
        },
        onError: () => {
          executionOrder.push('error');
        },
      });

      await node.execute(mockContext);

      expect(executionOrder).toEqual(['before', 'error']);
      expect(executionOrder).not.toContain('after');
    });
  });
});

