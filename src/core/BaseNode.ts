import { v4 as uuidv4 } from 'uuid';

import {
  INode,
  NodeId,
  PortId,
  ExecutionContext,
  ExecutionResult,
  NodeConfig,
  Port,
  NodeError,
  DataType,
  NodeLifecycleHooks,
} from '../types';
import { logger } from '../utils/Logger';
import { ExecutionController } from './ExecutionController';

/**
 * Abstract base class for all nodes
 * Provides common functionality and enforces the INode interface
 */
export abstract class BaseNode implements INode {
  public readonly id: NodeId;
  public readonly name: string;
  public readonly description?: string;
  public readonly inputs: Port[];
  public readonly outputs: Port[];
  protected properties: Map<string, unknown> = new Map();
  private lifecycleHooks?: NodeLifecycleHooks;
  private initialized: boolean = false;
  private resources: Set<{ cleanup: () => Promise<void> | void }> = new Set();

  constructor(config: NodeConfig) {
    this.id = config.id ?? uuidv4();
    this.name = config.name;
    this.description = config.description;
    this.inputs = config.inputs ?? [];
    this.outputs = config.outputs ?? [];
    this.lifecycleHooks = config.lifecycleHooks;
  }

  /**
   * Initialize node resources
   * Called once on first execution if onInitialize hook is provided
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (this.lifecycleHooks?.onInitialize) {
        await this.lifecycleHooks.onInitialize();
      }
      this.initialized = true;
    } catch (error) {
      logger.error(`Failed to initialize node ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * Register a resource that needs cleanup
   * @param resource - Resource with cleanup method
   */
  protected registerResource(resource: { cleanup: () => Promise<void> | void }): void {
    this.resources.add(resource);
  }

  /**
   * Unregister a resource
   * @param resource - Resource to unregister
   */
  protected unregisterResource(resource: { cleanup: () => Promise<void> | void }): void {
    this.resources.delete(resource);
  }

  /**
   * Abstract method that must be implemented by subclasses
   * Contains the actual node logic
   */
  protected abstract executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>>;

  /**
   * Public execute method that handles common concerns
   */
  public async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Initialize node if not already initialized
      await this.initialize();

      // Check for cancellation
      if (context.abortSignal?.aborted) {
        throw new NodeError('Execution cancelled', this.id);
      }

      // Call onBeforeExecute hook
      if (this.lifecycleHooks?.onBeforeExecute) {
        try {
          await this.lifecycleHooks.onBeforeExecute(context);
        } catch (hookError) {
          logger.error(`onBeforeExecute hook failed for node ${this.id}:`, hookError);
          throw new NodeError(
            `onBeforeExecute hook failed: ${hookError instanceof Error ? hookError.message : String(hookError)}`,
            this.id,
          );
        }
      }

      // Check for cancellation after before hook
      if (context.abortSignal?.aborted) {
        throw new NodeError('Execution cancelled', this.id);
      }

      // Validate inputs
      this.validateInputs(context.inputs);

      // Check for cancellation again
      if (context.abortSignal?.aborted) {
        throw new NodeError('Execution cancelled', this.id);
      }

      // Execute with timeout if provided
      let outputs: Map<PortId, unknown>;
      if (context.timeout) {
        outputs = await ExecutionController.executeWithTimeout(
          () => this.executeInternal(context),
          context.timeout,
          context.abortSignal,
        );
      } else {
        outputs = await this.executeInternal(context);
      }

      // Check for cancellation after execution
      if (context.abortSignal?.aborted) {
        throw new NodeError('Execution cancelled', this.id);
      }

      // Validate outputs
      this.validateOutputs(outputs);

      const executionTime = Date.now() - startTime;

      const result: ExecutionResult = {
        success: true,
        outputs,
        executionTime,
      };

      // Call onAfterExecute hook
      if (this.lifecycleHooks?.onAfterExecute) {
        try {
          await this.lifecycleHooks.onAfterExecute(context, result);
        } catch (hookError) {
          logger.error(`onAfterExecute hook failed for node ${this.id}:`, hookError);
          // Don't fail execution if after hook fails, just log it
        }
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const nodeError = error instanceof NodeError
        ? error
        : new NodeError(
          error instanceof Error ? error.message : String(error),
          this.id,
          undefined,
          error instanceof Error ? error : undefined,
        );

      // Call onError hook
      if (this.lifecycleHooks?.onError) {
        try {
          await this.lifecycleHooks.onError(context, nodeError);
        } catch (hookError) {
          logger.error(`onError hook failed for node ${this.id}:`, hookError);
          // Don't suppress the original error if error hook fails
        }
      }

      // Call error handler if provided
      if (context.errorHandler) {
        context.errorHandler(nodeError);
      }

      return {
        success: false,
        error: nodeError,
        executionTime,
      };
    }
  }

  /**
   * Cleanup all registered resources
   * Should be called when node is being destroyed
   */
  public async cleanup(): Promise<void> {
    // Cleanup all registered resources
    const cleanupPromises = Array.from(this.resources).map(resource => {
      try {
        return Promise.resolve(resource.cleanup());
      } catch (error) {
        logger.error(`Resource cleanup failed for node ${this.id}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(cleanupPromises);
    this.resources.clear();

    // Call onCleanup hook
    if (this.lifecycleHooks?.onCleanup) {
      try {
        await this.lifecycleHooks.onCleanup();
      } catch (error) {
        logger.error(`onCleanup hook failed for node ${this.id}:`, error);
      }
    }
  }

  /**
   * Check if node is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Validates that the node configuration is correct
   */
  public validate(): boolean {
    try {
      // Check for duplicate port IDs
      const allPorts = [...this.inputs, ...this.outputs];
      const portIds = allPorts.map(port => port.id);
      const uniquePortIds = new Set(portIds);

      if (portIds.length !== uniquePortIds.size) {
        throw new Error(`Duplicate port IDs found in node ${this.id}`);
      }

      // Validate each port
      allPorts.forEach(port => {
        if (!port.id || !port.name || !port.dataType) {
          throw new Error(`Invalid port configuration in node ${this.id}`);
        }
      });

      return true;
    } catch (error) {
      logger.error(`Node validation failed for ${this.id}:`, error);
      return false;
    }
  }

  /**
   * Validates input values against port definitions
   */
  protected validateInputs(inputs: Map<PortId, unknown>): void {
    for (const input of this.inputs) {
      if (input.required && !inputs.has(input.id)) {
        throw new NodeError(
          `Required input '${input.name}' (${input.id}) is missing`,
          this.id,
          input.id,
        );
      }

      const value = inputs.get(input.id);
      if (value !== undefined && input.dataType.validator) {
        if (!input.dataType.validator(value)) {
          throw new NodeError(
            `Input '${input.name}' (${input.id}) has invalid type. Expected ${input.dataType.name}`,
            this.id,
            input.id,
          );
        }
      }
    }
  }

  /**
   * Validates output values against port definitions
   */
  protected validateOutputs(outputs: Map<PortId, unknown>): void {
    for (const output of this.outputs) {
      const value = outputs.get(output.id);
      if (value !== undefined && output.dataType.validator) {
        if (!output.dataType.validator(value)) {
          throw new NodeError(
            `Output '${output.name}' (${output.id}) has invalid type. Expected ${output.dataType.name}`,
            this.id,
            output.id,
          );
        }
      }
    }
  }

  /**
   * Helper method to create a port
   */
  protected createPort(
    id: PortId,
    name: string,
    dataType: DataType,
    required: boolean = false,
    description?: string,
  ): Port {
    return {
      id,
      name,
      dataType,
      required,
      description,
    };
  }

  /**
   * Helper method to get input value with type safety
   */
  protected getInput<T>(context: ExecutionContext, portId: PortId): T | undefined {
    return context.inputs.get(portId) as T;
  }

  /**
   * Helper method to set output value
   */
  protected setOutput(outputs: Map<PortId, unknown>, portId: PortId, value: unknown): void {
    outputs.set(portId, value);
  }

  /**
   * Set a property value
   */
  public setProperty(key: string, value: unknown): void {
    this.properties.set(key, value);
  }

  /**
   * Get a property value
   */
  public getProperty<T = unknown>(key: string): T | undefined {
    return this.properties.get(key) as T | undefined;
  }

  /**
   * Get all properties
   */
  public getProperties(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.properties.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
