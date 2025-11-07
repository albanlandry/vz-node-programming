/**
 * Unit Tests for UserInputNode
 */

import { UserInputNode } from '../../../src/nodes/interactive/UserInputNode';
import { InteractiveNodeType } from '../../../src/types';
import { EventEmitter } from 'events';
import type { InteractiveExecutionContext } from '../../../src/core/InteractiveExecutionContext';

describe('UserInputNode', () => {
  let node: UserInputNode;
  let eventEmitter: EventEmitter;
  let mockContext: InteractiveExecutionContext;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    node = new UserInputNode({
      id: 'test-node',
      prompt: 'Enter value:',
      inputType: 'prompt',
    });

    // Create mock context
    mockContext = {
      executionId: 'exec-1',
      inputs: new Map(),
      outputs: new Map(),
      metadata: new Map(),
      requestUserInput: jest.fn().mockResolvedValue('user-input-value'),
      displayImage: jest.fn(),
      updateStreamingData: jest.fn(),
      renderCustomUI: jest.fn(),
    } as unknown as InteractiveExecutionContext;
  });

  describe('Node Properties', () => {
    it('should have isInteractive set to true', () => {
      expect(node.isInteractive).toBe(true);
    });

    it('should have interactiveType set to USER_INPUT', () => {
      expect(node.interactiveType).toBe(InteractiveNodeType.USER_INPUT);
    });

    it('should have correct name', () => {
      expect(node.name).toBe('User Input');
    });

    it('should have value output port', () => {
      const outputs = node.outputs;
      expect(outputs).toHaveLength(1);
      expect(outputs[0].id).toBe('value');
      expect(outputs[0].name).toBe('Value');
    });
  });

  describe('executeInteractive - Prompt Type', () => {
    it('should request user input and return value', async () => {
      const result = await node.executeInteractive(mockContext);

      expect(mockContext.requestUserInput).toHaveBeenCalledWith({
        type: 'prompt',
        prompt: 'Enter value:',
      });
      expect(result.success).toBe(true);
      expect(result.outputs?.get('value')).toBe('user-input-value');
    });

    it('should handle user input error', async () => {
      const errorContext = {
        ...mockContext,
        requestUserInput: jest.fn().mockRejectedValue(new Error('User cancelled')),
      } as unknown as InteractiveExecutionContext;

      const result = await node.executeInteractive(errorContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('User cancelled');
    });
  });

  describe('executeInteractive - Form Type', () => {
    beforeEach(() => {
      node = new UserInputNode({
        id: 'test-node',
        inputType: 'form',
        formSchema: {
          title: 'Test Form',
          fields: [
            {
              id: 'name',
              label: 'Name',
              type: 'text',
              required: true,
            },
            {
              id: 'email',
              label: 'Email',
              type: 'email',
              required: true,
            },
          ],
        },
      });
    });

    it('should request user input with form schema', async () => {
      const formValue = { name: 'John', email: 'john@example.com' };
      const formContext = {
        ...mockContext,
        requestUserInput: jest.fn().mockResolvedValue(formValue),
      } as unknown as InteractiveExecutionContext;

      const result = await node.executeInteractive(formContext);

      const callArgs = (formContext.requestUserInput as jest.Mock).mock.calls[0][0];
      expect(callArgs.type).toBe('form');
      expect(callArgs.formSchema?.title).toBe('Test Form');
      expect(callArgs.formSchema?.fields).toHaveLength(2);
      expect(callArgs.formSchema?.fields[0].id).toBe('name');
      expect(callArgs.formSchema?.fields[1].id).toBe('email');
      expect(result.success).toBe(true);
      expect(result.outputs?.get('value')).toEqual(formValue);
    });
  });

  describe('executeInteractive - Confirm Type', () => {
    beforeEach(() => {
      node = new UserInputNode({
        id: 'test-node',
        inputType: 'confirm',
        prompt: 'Are you sure?',
      });
    });

    it('should request user input with confirm type', async () => {
      const confirmContext = {
        ...mockContext,
        requestUserInput: jest.fn().mockResolvedValue(true),
      } as unknown as InteractiveExecutionContext;

      const result = await node.executeInteractive(confirmContext);

      expect(confirmContext.requestUserInput).toHaveBeenCalledWith({
        type: 'confirm',
        prompt: 'Are you sure?',
      });
      expect(result.success).toBe(true);
      expect(result.outputs?.get('value')).toBe(true);
    });
  });

  describe('execute method', () => {
    it('should call executeInteractive as fallback', async () => {
      const result = await node.execute(mockContext as any);

      expect(mockContext.requestUserInput).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('Execution Time', () => {
    it('should measure execution time', async () => {
      const slowContext = {
        ...mockContext,
        requestUserInput: jest.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('value'), 100)),
        ),
      } as unknown as InteractiveExecutionContext;

      const result = await node.executeInteractive(slowContext);

      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(100);
    });
  });
});

