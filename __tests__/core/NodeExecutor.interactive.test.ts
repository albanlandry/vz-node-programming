/**
 * Unit Tests for NodeExecutor Interactive Node Support
 */

import { EventEmitter } from 'events';

import { NodeExecutor } from '../../src/core/NodeExecutor';
import { BaseNode } from '../../src/core/BaseNode';
import type {
  INode,
  IInteractiveNode,
  ExecutionContext,
  ExecutionResult,
  InteractiveExecutionContext,
  Port,
  InteractiveNodeEventType,
} from '../../src/types';
import { DataTypes, InteractiveNodeType, InteractiveNodeEventType as EventType } from '../../src/types';

// Mock interactive node implementation
class MockInteractiveNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.USER_INPUT;
  private shouldRequestInput = true;
  private inputValue: unknown = null;

  constructor(id: string, shouldRequestInput = true) {
    super({
      id,
      name: 'Mock Interactive Node',
      inputs: [{ id: 'input1', name: 'Input 1', dataType: DataTypes.STRING }],
      outputs: [{ id: 'output1', name: 'Output 1', dataType: DataTypes.STRING }],
    });
    this.shouldRequestInput = shouldRequestInput;
  }

  setInputValue(value: unknown): void {
    this.inputValue = value;
  }

  protected async executeInternal(
    context: ExecutionContext | InteractiveExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();

    if (this.shouldRequestInput && 'requestUserInput' in context) {
      const interactiveContext = context as InteractiveExecutionContext;
      const userInput = await interactiveContext.requestUserInput({
        type: 'prompt',
        prompt: 'Enter a value',
      });
      this.inputValue = userInput;
    }

    outputs.set('output1', this.inputValue || 'default');
    return outputs;
  }

  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    try {
      const outputs = await this.executeInternal(context);
      return {
        success: true,
        outputs,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? new (await import('../../src/types')).NodeError(
              error.message,
              this.id,
            )
          : new (await import('../../src/types')).NodeError(
              String(error),
              this.id,
            ),
        executionTime: Date.now() - startTime,
      };
    }
  }
}

// Mock regular node
class MockRegularNode extends BaseNode {
  constructor(id: string) {
    super({
      id,
      name: 'Mock Regular Node',
      inputs: [],
      outputs: [{ id: 'output1', name: 'Output 1', dataType: DataTypes.STRING }],
    });
  }

  protected async executeInternal(
    context: ExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();
    outputs.set('output1', 'regular-output');
    return outputs;
  }
}

describe('NodeExecutor - Interactive Node Support', () => {
  let executor: NodeExecutor;

  beforeEach(() => {
    executor = new NodeExecutor();
  });

  describe('Interactive Node Detection', () => {
    it('should detect interactive nodes', () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', false);
      executor.addNode(interactiveNode);

      // Node should be added successfully
      const nodes = executor.getNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('interactive-1');
    });

    it('should not treat regular nodes as interactive', () => {
      const regularNode = new MockRegularNode('regular-1');
      executor.addNode(regularNode);

      const nodes = executor.getNodes();
      expect(nodes).toHaveLength(1);
      const node = nodes[0] as IInteractiveNode;
      expect(node.isInteractive).toBeUndefined();
    });
  });

  describe('Interactive Node Execution', () => {
    it('should call executeInteractive for interactive nodes', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', false);
      executor.addNode(interactiveNode);

      const results = await executor.execute();

      expect(results.has('interactive-1')).toBe(true);
      const result = results.get('interactive-1');
      expect(result?.success).toBe(true);
      expect(result?.outputs?.get('output1')).toBe('default');
    });

    it('should fallback to execute() if executeInteractive not implemented', async () => {
      // Create a node that is interactive but doesn't implement executeInteractive
      class IncompleteInteractiveNode extends BaseNode implements IInteractiveNode {
        readonly isInteractive = true;
        readonly interactiveType = InteractiveNodeType.USER_INPUT;

        constructor() {
          super({
            id: 'incomplete-interactive',
            name: 'Incomplete Interactive Node',
            inputs: [],
            outputs: [{ id: 'output1', name: 'Output 1', dataType: DataTypes.STRING }],
          });
        }

        protected async executeInternal(
          context: ExecutionContext,
        ): Promise<Map<string, unknown>> {
          const outputs = new Map<string, unknown>();
          outputs.set('output1', 'fallback-output');
          return outputs;
        }
      }

      const node = new IncompleteInteractiveNode();
      executor.addNode(node);

      const results = await executor.execute();
      expect(results.has(node.id)).toBe(true);
      const result = results.get(node.id);
      expect(result?.success).toBe(true);
      expect(result?.outputs?.get('output1')).toBe('fallback-output');
    });

    it('should execute regular nodes normally', async () => {
      const regularNode = new MockRegularNode('regular-1');
      executor.addNode(regularNode);

      const results = await executor.execute();

      expect(results.has('regular-1')).toBe(true);
      const result = results.get('regular-1');
      expect(result?.success).toBe(true);
      expect(result?.outputs?.get('output1')).toBe('regular-output');
    });
  });

  describe('User Input Handling', () => {
    it('should provide user input to paused interactive node', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', true);
      executor.addNode(interactiveNode);

      // Start execution (will pause waiting for input)
      const executionPromise = executor.execute();

      // Wait a bit for the node to request input
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Provide input
      executor.provideUserInput('interactive-1', 'user-provided-value');

      // Wait for execution to complete
      const results = await executionPromise;

      expect(results.has('interactive-1')).toBe(true);
      const result = results.get('interactive-1');
      expect(result?.success).toBe(true);
      expect(result?.outputs?.get('output1')).toBe('user-provided-value');
    });

    it('should cancel user input request', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', true);
      executor.addNode(interactiveNode);

      // Start execution
      const executionPromise = executor.execute();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Cancel input
      executor.cancelUserInput('interactive-1', new Error('Cancelled by user'));

      // Execution should fail
      const results = await executionPromise;
      const result = results.get('interactive-1');
      expect(result?.success).toBe(false);
      expect(result?.error?.message).toContain('Cancelled');
    });

    it('should handle provideUserInput for non-existent node gracefully', () => {
      expect(() => {
        executor.provideUserInput('non-existent', 'value');
      }).not.toThrow();
    });

    it('should handle cancelUserInput for non-existent node gracefully', () => {
      expect(() => {
        executor.cancelUserInput('non-existent');
      }).not.toThrow();
    });
  });

  describe('Paused Node Tracking', () => {
    it('should track paused nodes', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', true);
      executor.addNode(interactiveNode);

      // Start execution
      const executionPromise = executor.execute();

      // Wait a bit for node to pause
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check if node is paused
      expect(executor.isNodePaused('interactive-1')).toBe(true);
      expect(executor.getPausedNodes()).toContain('interactive-1');

      // Provide input to resume
      executor.provideUserInput('interactive-1', 'value');
      await executionPromise;

      // Node should no longer be paused
      expect(executor.isNodePaused('interactive-1')).toBe(false);
      expect(executor.getPausedNodes()).not.toContain('interactive-1');
    });

    it('should return empty array when no nodes are paused', () => {
      expect(executor.getPausedNodes()).toEqual([]);
    });

    it('should return false for non-paused nodes', () => {
      expect(executor.isNodePaused('non-existent')).toBe(false);
    });
  });

  describe('Event Emission', () => {
    it('should emit interactive events when node requests input', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', true);
      executor.addNode(interactiveNode);

      const events: unknown[] = [];
      executor.on(EventType.USER_INPUT_REQUESTED, (data) => {
        events.push({ type: 'USER_INPUT_REQUESTED', data });
      });
      executor.on(EventType.NODE_PAUSED, (data) => {
        events.push({ type: 'NODE_PAUSED', data });
      });

      const executionPromise = executor.execute();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Provide input to complete execution
      executor.provideUserInput('interactive-1', 'value');
      await executionPromise;

      // Should have emitted events
      expect(events.length).toBeGreaterThan(0);
      const inputRequested = events.find(
        (e: any) => e.type === 'USER_INPUT_REQUESTED',
      );
      expect(inputRequested).toBeDefined();
      expect(inputRequested?.data.nodeId).toBe('interactive-1');
    });

    it('should emit NODE_RESUMED when input is provided', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', true);
      executor.addNode(interactiveNode);

      const events: unknown[] = [];
      executor.on(EventType.USER_INPUT_RECEIVED, (data) => {
        events.push({ type: 'USER_INPUT_RECEIVED', data });
      });
      executor.on(EventType.NODE_RESUMED, (data) => {
        events.push({ type: 'NODE_RESUMED', data });
      });

      const executionPromise = executor.execute();
      await new Promise((resolve) => setTimeout(resolve, 50));

      executor.provideUserInput('interactive-1', 'value');
      await executionPromise;

      const resumed = events.find((e: any) => e.type === 'NODE_RESUMED');
      expect(resumed).toBeDefined();
      expect(resumed?.data.nodeId).toBe('interactive-1');
    });
  });

  describe('Context Cleanup', () => {
    it('should clean up interactive context after successful execution', async () => {
      const interactiveNode = new MockInteractiveNode('interactive-1', false);
      executor.addNode(interactiveNode);

      await executor.execute();

      // Context should be cleaned up
      expect(executor.getPausedNodes()).not.toContain('interactive-1');
      expect(executor.isNodePaused('interactive-1')).toBe(false);
    });

    it('should clean up interactive context after failed execution', async () => {
      class FailingInteractiveNode extends BaseNode implements IInteractiveNode {
        readonly isInteractive = true;
        readonly interactiveType = InteractiveNodeType.USER_INPUT;

        constructor() {
          super({
            id: 'failing-interactive',
            name: 'Failing Interactive Node',
            inputs: [],
            outputs: [{ id: 'output1', name: 'Output 1', dataType: DataTypes.STRING }],
          });
        }

        protected async executeInternal(
          context: ExecutionContext,
        ): Promise<Map<string, unknown>> {
          throw new Error('Execution failed');
        }

        async executeInteractive(
          context: InteractiveExecutionContext,
        ): Promise<ExecutionResult> {
          throw new Error('Execution failed');
        }
      }

      const node = new FailingInteractiveNode();
      executor.addNode(node);

      try {
        await executor.execute();
      } catch {
        // Expected to throw
      }

      // Context should be cleaned up even on error
      expect(executor.getPausedNodes()).not.toContain(node.id);
    });
  });

  describe('Mixed Node Execution', () => {
    it('should execute both interactive and regular nodes in same graph', async () => {
      const regularNode = new MockRegularNode('regular-1');
      const interactiveNode = new MockInteractiveNode('interactive-1', false);
      executor.addNode(regularNode);
      executor.addNode(interactiveNode);

      const results = await executor.execute();

      expect(results.has('regular-1')).toBe(true);
      expect(results.has('interactive-1')).toBe(true);
      expect(results.get('regular-1')?.success).toBe(true);
      expect(results.get('interactive-1')?.success).toBe(true);
    });
  });
});

