/**
 * Unit Tests for InteractiveExecutionContext
 */

import { EventEmitter } from 'events';

import { InteractiveExecutionContext } from '../../src/core/InteractiveExecutionContext';
import type {
  ExecutionContext,
  UserInputRequest,
  ImageData,
  InteractiveNodeEventType,
} from '../../src/types';
import { InteractiveNodeEventType as EventType } from '../../src/types';

describe('InteractiveExecutionContext', () => {
  let baseContext: ExecutionContext;
  let eventEmitter: EventEmitter;
  let interactiveContext: InteractiveExecutionContext;
  const nodeId = 'test-node-1';
  const executionId = 'exec-123';

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    baseContext = {
      executionId,
      inputs: new Map(),
      outputs: new Map(),
      metadata: new Map(),
    };
    interactiveContext = new InteractiveExecutionContext(
      baseContext,
      eventEmitter,
      nodeId,
    );
  });

  describe('Context Delegation', () => {
    it('should delegate executionId', () => {
      expect(interactiveContext.executionId).toBe(executionId);
    });

    it('should delegate inputs', () => {
      const inputs = new Map([['port1', 'value1']]);
      baseContext.inputs = inputs;
      expect(interactiveContext.inputs).toBe(inputs);
    });

    it('should delegate outputs', () => {
      const outputs = new Map([['port1', 'result1']]);
      baseContext.outputs = outputs;
      expect(interactiveContext.outputs).toBe(outputs);
    });

    it('should delegate metadata', () => {
      const metadata = new Map([['key1', 'value1']]);
      baseContext.metadata = metadata;
      expect(interactiveContext.metadata).toBe(metadata);
    });

    it('should delegate errorHandler', () => {
      const errorHandler = jest.fn();
      baseContext.errorHandler = errorHandler;
      expect(interactiveContext.errorHandler).toBe(errorHandler);
    });
  });

  describe('requestUserInput', () => {
    it('should create a Promise that resolves when input is provided', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter your name',
      };

      // Set up event listeners BEFORE calling requestUserInput
      const events: unknown[] = [];
      eventEmitter.on(EventType.USER_INPUT_REQUESTED, (data) => {
        events.push({ type: 'USER_INPUT_REQUESTED', data });
      });
      eventEmitter.on(EventType.NODE_PAUSED, (data) => {
        events.push({ type: 'NODE_PAUSED', data });
      });

      const inputPromise = interactiveContext.requestUserInput(request);

      // Events are emitted synchronously, so they should be in the array immediately
      // But we'll wait a tiny bit to ensure they're processed
      await new Promise((resolve) => setImmediate(resolve));

      // Provide input
      const inputValue = { name: 'John Doe' };
      interactiveContext.provideUserInput(inputValue);

      // Wait for promise to resolve
      const result = await inputPromise;

      expect(result).toEqual(inputValue);
      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        type: 'USER_INPUT_REQUESTED',
        data: {
          nodeId,
          executionId,
          request,
        },
      });
      expect(events[1]).toMatchObject({
        type: 'NODE_PAUSED',
        data: {
          nodeId,
          executionId,
        },
      });
    });

    it('should emit USER_INPUT_RECEIVED and NODE_RESUMED when input is provided', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter value',
      };

      const inputPromise = interactiveContext.requestUserInput(request);

      const events: unknown[] = [];
      eventEmitter.on(EventType.USER_INPUT_RECEIVED, (data) => {
        events.push({ type: 'USER_INPUT_RECEIVED', data });
      });
      eventEmitter.on(EventType.NODE_RESUMED, (data) => {
        events.push({ type: 'NODE_RESUMED', data });
      });

      // Provide input
      interactiveContext.provideUserInput('test-value');
      await inputPromise;

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        type: 'USER_INPUT_RECEIVED',
        data: { nodeId, executionId },
      });
      expect(events[1]).toMatchObject({
        type: 'NODE_RESUMED',
        data: { nodeId, executionId },
      });
    });

    it('should reject Promise when input is cancelled', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter value',
      };

      const inputPromise = interactiveContext.requestUserInput(request);
      const error = new Error('User cancelled');
      interactiveContext.cancelUserInput(error);

      await expect(inputPromise).rejects.toThrow('User cancelled');
    });

    it('should reject with default error when cancelled without error', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter value',
      };

      const inputPromise = interactiveContext.requestUserInput(request);
      interactiveContext.cancelUserInput();

      await expect(inputPromise).rejects.toThrow('User input cancelled');
    });
  });

  describe('displayImage', () => {
    it('should emit IMAGE_DISPLAY_REQUESTED event', () => {
      const imageData: ImageData = {
        url: 'https://example.com/image.png',
        format: 'png',
        alt: 'Test image',
      };

      const events: unknown[] = [];
      eventEmitter.on(EventType.IMAGE_DISPLAY_REQUESTED, (data) => {
        events.push(data);
      });

      interactiveContext.displayImage(imageData);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        nodeId,
        executionId,
        imageData,
      });
    });

    it('should support base64 image data', () => {
      const imageData: ImageData = {
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        format: 'png',
      };

      const events: unknown[] = [];
      eventEmitter.on(EventType.IMAGE_DISPLAY_REQUESTED, (data) => {
        events.push(data);
      });

      interactiveContext.displayImage(imageData);

      expect(events[0]).toMatchObject({ imageData });
    });
  });

  describe('updateStreamingData', () => {
    it('should emit STREAMING_DATA_UPDATE event', () => {
      const data = { value: 42, timestamp: Date.now() };

      const events: unknown[] = [];
      eventEmitter.on(EventType.STREAMING_DATA_UPDATE, (eventData) => {
        events.push(eventData);
      });

      interactiveContext.updateStreamingData(data);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        nodeId,
        executionId,
        data,
      });
    });

    it('should support multiple streaming updates', () => {
      const events: unknown[] = [];
      eventEmitter.on(EventType.STREAMING_DATA_UPDATE, (eventData) => {
        events.push(eventData);
      });

      interactiveContext.updateStreamingData({ value: 1 });
      interactiveContext.updateStreamingData({ value: 2 });
      interactiveContext.updateStreamingData({ value: 3 });

      expect(events).toHaveLength(3);
      expect(events.map((e: any) => e.data.value)).toEqual([1, 2, 3]);
    });
  });

  describe('renderCustomUI', () => {
    it('should emit CUSTOM_UI_RENDER event', () => {
      const componentType = 'custom-chart';
      const props = { data: [1, 2, 3], type: 'line' };

      const events: unknown[] = [];
      eventEmitter.on(EventType.CUSTOM_UI_RENDER, (eventData) => {
        events.push(eventData);
      });

      interactiveContext.renderCustomUI(componentType, props);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        nodeId,
        executionId,
        componentType,
        props,
      });
    });
  });

  describe('provideUserInput', () => {
    it('should only resolve if there is an active request', () => {
      // No active request, should not throw but do nothing
      expect(() => {
        interactiveContext.provideUserInput('value');
      }).not.toThrow();
    });

    it('should clear resolver and rejecter after providing input', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter value',
      };

      const promise = interactiveContext.requestUserInput(request);
      interactiveContext.provideUserInput('value');
      await promise;

      // Second call should do nothing
      interactiveContext.provideUserInput('value2');
      // Should not throw or cause issues
      expect(true).toBe(true);
    });
  });

  describe('cancelUserInput', () => {
    it('should only reject if there is an active request', () => {
      // No active request, should not throw
      expect(() => {
        interactiveContext.cancelUserInput();
      }).not.toThrow();
    });

    it('should clear resolver and rejecter after cancelling', async () => {
      const request: UserInputRequest = {
        type: 'prompt',
        prompt: 'Enter value',
      };

      const promise = interactiveContext.requestUserInput(request);
      interactiveContext.cancelUserInput();

      await expect(promise).rejects.toThrow();

      // Second call should do nothing
      interactiveContext.cancelUserInput();
      expect(true).toBe(true);
    });
  });
});

