/**
 * Interactive Node Execution Context
 * 
 * Provides extended execution context for interactive nodes that can request
 * user input, display images, stream data, and render custom UI components.
 */

import { EventEmitter } from 'events';

import type {
  ExecutionContext,
  InteractiveExecutionContext as IInteractiveExecutionContext,
  UserInputRequest,
  ImageData,
} from '../types';
import { InteractiveNodeEventType } from '../types';

/**
 * Interactive node execution context implementation
 * Wraps a base ExecutionContext and adds interactive capabilities
 */
export class InteractiveExecutionContext implements IInteractiveExecutionContext {
  private inputResolver?: (value: unknown) => void;
  private inputRejecter?: (error: Error) => void;
  private readonly nodeId: string;
  
  constructor(
    private readonly baseContext: ExecutionContext,
    private readonly eventEmitter: EventEmitter,
    nodeId: string,
  ) {
    this.nodeId = nodeId;
  }

  /**
   * Request user input from the UI
   * Execution will pause until input is provided
   */
  async requestUserInput(request: UserInputRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.inputResolver = resolve;
      this.inputRejecter = reject;
      
      // Emit event: Display input request in UI
      this.eventEmitter.emit(InteractiveNodeEventType.USER_INPUT_REQUESTED, {
        nodeId: this.nodeId,
        executionId: this.baseContext.executionId,
        request,
      });
      
      // Emit event: Pause node
      // Note: The executor will track this via pausedNodes Set
      this.eventEmitter.emit(InteractiveNodeEventType.NODE_PAUSED, {
        nodeId: this.nodeId,
        executionId: this.baseContext.executionId,
      });
    });
  }
  
  /**
   * Request image display in the UI
   */
  displayImage(imageData: ImageData): void {
    this.eventEmitter.emit(InteractiveNodeEventType.IMAGE_DISPLAY_REQUESTED, {
      nodeId: this.nodeId,
      executionId: this.baseContext.executionId,
      imageData,
    });
  }
  
  /**
   * Update streaming data in the UI
   */
  updateStreamingData(data: unknown): void {
    this.eventEmitter.emit(InteractiveNodeEventType.STREAMING_DATA_UPDATE, {
      nodeId: this.nodeId,
      executionId: this.baseContext.executionId,
      data,
    });
  }
  
  /**
   * Request custom UI component rendering
   */
  renderCustomUI(componentType: string, props: Record<string, unknown>): void {
    this.eventEmitter.emit(InteractiveNodeEventType.CUSTOM_UI_RENDER, {
      nodeId: this.nodeId,
      executionId: this.baseContext.executionId,
      componentType,
      props,
    });
  }
  
  /**
   * Provide user input (called by execution engine when input is received)
   * @internal
   */
  provideUserInput(value: unknown): void {
    if (this.inputResolver) {
      this.inputResolver(value);
      this.inputResolver = undefined;
      this.inputRejecter = undefined;
      
      this.eventEmitter.emit(InteractiveNodeEventType.USER_INPUT_RECEIVED, {
        nodeId: this.nodeId,
        executionId: this.baseContext.executionId,
      });
      
      this.eventEmitter.emit(InteractiveNodeEventType.NODE_RESUMED, {
        nodeId: this.nodeId,
        executionId: this.baseContext.executionId,
      });
    }
  }
  
  /**
   * Cancel user input request (called by execution engine)
   * @internal
   */
  cancelUserInput(error?: Error): void {
    if (this.inputRejecter) {
      this.inputRejecter(error || new Error('User input cancelled'));
      this.inputResolver = undefined;
      this.inputRejecter = undefined;
    }
  }
  
  // ExecutionContext delegation
  get executionId(): string {
    return this.baseContext.executionId;
  }
  
  get inputs(): Map<string, unknown> {
    return this.baseContext.inputs;
  }
  
  get outputs(): Map<string, unknown> {
    return this.baseContext.outputs;
  }
  
  get metadata(): Map<string, unknown> {
    return this.baseContext.metadata;
  }
  
  get errorHandler(): ((error: import('../types').NodeError) => void) | undefined {
    return this.baseContext.errorHandler;
  }
}

