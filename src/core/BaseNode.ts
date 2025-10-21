import { v4 as uuidv4 } from 'uuid';
import { 
  INode, 
  NodeId, 
  PortId, 
  ExecutionId, 
  ExecutionContext, 
  ExecutionResult, 
  NodeConfig, 
  Port, 
  NodeError,
  DataType,
  DataTypes
} from '../types';

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

  constructor(config: NodeConfig) {
    this.id = config.id || uuidv4();
    this.name = config.name;
    this.description = config.description;
    this.inputs = config.inputs || [];
    this.outputs = config.outputs || [];
  }

  /**
   * Abstract method that must be implemented by subclasses
   * Contains the actual node logic
   */
  protected abstract executeInternal(context: ExecutionContext): Promise<Map<PortId, any>>;

  /**
   * Public execute method that handles common concerns
   */
  public async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      this.validateInputs(context.inputs);
      
      // Execute the node's internal logic
      const outputs = await this.executeInternal(context);
      
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
      
      // Call error handler if provided
      if (context.errorHandler) {
        context.errorHandler(nodeError);
      }
      
      return {
        success: false,
        error: nodeError,
        executionTime
      };
    }
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
      console.error(`Node validation failed for ${this.id}:`, error);
      return false;
    }
  }

  /**
   * Validates input values against port definitions
   */
  protected validateInputs(inputs: Map<PortId, any>): void {
    for (const input of this.inputs) {
      if (input.required && !inputs.has(input.id)) {
        throw new NodeError(
          `Required input '${input.name}' (${input.id}) is missing`,
          this.id,
          input.id
        );
      }
      
      const value = inputs.get(input.id);
      if (value !== undefined && input.dataType.validator) {
        if (!input.dataType.validator(value)) {
          throw new NodeError(
            `Input '${input.name}' (${input.id}) has invalid type. Expected ${input.dataType.name}`,
            this.id,
            input.id
          );
        }
      }
    }
  }

  /**
   * Validates output values against port definitions
   */
  protected validateOutputs(outputs: Map<PortId, any>): void {
    for (const output of this.outputs) {
      const value = outputs.get(output.id);
      if (value !== undefined && output.dataType.validator) {
        if (!output.dataType.validator(value)) {
          throw new NodeError(
            `Output '${output.name}' (${output.id}) has invalid type. Expected ${output.dataType.name}`,
            this.id,
            output.id
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
    description?: string
  ): Port {
    return {
      id,
      name,
      dataType,
      required,
      description
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
  protected setOutput(outputs: Map<PortId, any>, portId: PortId, value: any): void {
    outputs.set(portId, value);
  }
}