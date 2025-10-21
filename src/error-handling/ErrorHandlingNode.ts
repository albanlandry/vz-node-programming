import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, ExecutionResult, NodeConfig, PortId, NodeError, DataTypes } from '../types';
import { RetryPolicy } from './RetryPolicy';
import { CircuitBreaker } from './CircuitBreaker';
import { DeadLetterQueue } from './DeadLetterQueue';

/**
 * Error handling configuration for nodes
 */
export interface ErrorHandlingConfig {
  /** Retry policy */
  retryPolicy?: RetryPolicy;
  /** Circuit breaker */
  circuitBreaker?: CircuitBreaker;
  /** Enable dead letter queue */
  enableDLQ?: boolean;
  /** Fallback function */
  fallbackFn?: (error: Error, context: ExecutionContext) => Promise<Map<PortId, any>>;
  /** Whether to suppress errors (return empty result instead of throwing) */
  suppressErrors?: boolean;
}

/**
 * Base node with advanced error handling capabilities
 */
export abstract class ErrorHandlingNode extends BaseNode {
  protected errorConfig: ErrorHandlingConfig;

  constructor(config: NodeConfig, errorConfig: ErrorHandlingConfig = {}) {
    super(config);
    this.errorConfig = errorConfig;
  }

  /**
   * Override execute to add error handling
   */
  public async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      this.validateInputs(context.inputs);
      
      // Wrap execution with error handling
      const outputs = await this.executeWithErrorHandling(context);
      
      // Validate outputs
      this.validateOutputs(outputs);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        outputs,
        executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const nodeError = error instanceof NodeError 
        ? error 
        : new NodeError(
            error instanceof Error ? error.message : String(error), 
            this.id, 
            undefined, 
            error instanceof Error ? error : undefined
          );
      
      // Add to dead letter queue if enabled
      if (this.errorConfig.enableDLQ) {
        const dlq = DeadLetterQueue.getInstance();
        await dlq.add({
          executionId: context.executionId,
          nodeId: this.id,
          nodeName: this.name,
          error: nodeError,
          context,
          result: {
            success: false,
            error: nodeError,
            executionTime
          }
        });
      }
      
      // Call error handler if provided
      if (context.errorHandler) {
        context.errorHandler(nodeError);
      }
      
      // Suppress error if configured
      if (this.errorConfig.suppressErrors) {
        return {
          success: false,
          outputs: new Map(),
          error: nodeError,
          executionTime
        };
      }
      
      return {
        success: false,
        error: nodeError,
        executionTime
      };
    }
  }

  /**
   * Execute with retry, circuit breaker, and fallback support
   */
  private async executeWithErrorHandling(context: ExecutionContext): Promise<Map<PortId, any>> {
    const executeFn = async () => {
      // Use circuit breaker if provided
      if (this.errorConfig.circuitBreaker) {
        return await this.errorConfig.circuitBreaker.execute(async () => {
          return await this.executeInternal(context);
        });
      } else {
        return await this.executeInternal(context);
      }
    };

    try {
      // Use retry policy if provided
      if (this.errorConfig.retryPolicy) {
        return await this.errorConfig.retryPolicy.execute(
          executeFn,
          { nodeId: this.id, nodeName: this.name }
        );
      } else {
        return await executeFn();
      }
      
    } catch (error) {
      // Try fallback if provided
      if (this.errorConfig.fallbackFn) {
        console.warn(`⚠️  Using fallback for ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
        return await this.errorConfig.fallbackFn(error instanceof Error ? error : new Error(String(error)), context);
      }
      
      throw error;
    }
  }

  /**
   * Update error handling configuration
   */
  updateErrorConfig(config: Partial<ErrorHandlingConfig>): void {
    this.errorConfig = { ...this.errorConfig, ...config };
  }

  /**
   * Get current error handling configuration
   */
  getErrorConfig(): Readonly<ErrorHandlingConfig> {
    return { ...this.errorConfig };
  }
}

/**
 * Error Boundary Node - catches errors from connected nodes
 */
export class ErrorBoundaryNode extends BaseNode {
  private caughtErrors: Map<string, Error> = new Map();

  constructor(config?: Partial<NodeConfig>) {
    super({
      ...config,
      name: config?.name || 'Error Boundary',
      description: config?.description || 'Catches and handles errors from upstream nodes',
      inputs: [
        {
          id: 'value',
          name: 'Value',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Input value (may fail)'
        },
        {
          id: 'defaultValue',
          name: 'Default Value',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Default value to use on error'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Output value (input or default)'
        },
        {
          id: 'hasError',
          name: 'Has Error',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether an error occurred'
        },
        {
          id: 'error',
          name: 'Error',
          dataType: DataTypes.OBJECT,
          description: 'Error details if any'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    try {
      const value = this.getInput<any>(context, 'value');
      
      // If we got a value, no error occurred upstream
      this.setOutput(outputs, 'result', value);
      this.setOutput(outputs, 'hasError', false);
      this.setOutput(outputs, 'error', null);
      
    } catch (error) {
      // Error occurred - use default value
      const defaultValue = this.getInput<any>(context, 'defaultValue');
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      this.caughtErrors.set(context.executionId, errorObj);
      
      this.setOutput(outputs, 'result', defaultValue);
      this.setOutput(outputs, 'hasError', true);
      this.setOutput(outputs, 'error', {
        message: errorObj.message,
        name: errorObj.name,
        stack: errorObj.stack
      });
      
      console.warn(`🛡️  Error Boundary caught error: ${errorObj.message}`);
    }
    
    return outputs;
  }

  /**
   * Get caught errors
   */
  getCaughtErrors(): Map<string, Error> {
    return new Map(this.caughtErrors);
  }

  /**
   * Clear caught errors
   */
  clearErrors(): void {
    this.caughtErrors.clear();
  }
}

/**
 * Fallback Node - provides alternative execution path
 */
export class FallbackNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      ...config,
      name: config?.name || 'Fallback',
      description: config?.description || 'Provides fallback value when primary source fails',
      inputs: [
        {
          id: 'primary',
          name: 'Primary',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Primary value source'
        },
        {
          id: 'fallback',
          name: 'Fallback',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Fallback value'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Primary or fallback value'
        },
        {
          id: 'usedFallback',
          name: 'Used Fallback',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether fallback was used'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const primary = this.getInput<any>(context, 'primary');
    const fallback = this.getInput<any>(context, 'fallback');
    
    // Use primary if available and not null/undefined
    if (primary !== null && primary !== undefined) {
      this.setOutput(outputs, 'result', primary);
      this.setOutput(outputs, 'usedFallback', false);
    } else {
      // Use fallback
      this.setOutput(outputs, 'result', fallback);
      this.setOutput(outputs, 'usedFallback', true);
      console.log(`🔄 Fallback node using fallback value`);
    }
    
    return outputs;
  }
}
