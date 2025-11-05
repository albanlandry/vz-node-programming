/**
 * Custom Node Implementation
 * 
 * A custom node that extends BaseNode and executes user-defined expressions
 * using predefined templates. This allows users to create nodes dynamically
 * without writing full TypeScript classes.
 * 
 * The node uses a template system to provide structure and safety, while
 * allowing flexible expression-based logic.
 */

import { v4 as uuidv4 } from 'uuid';

import {
  ExecutionContext,
  NodeConfig,
  NodeError,
  PortId,
} from '../types';

import { BaseNode } from '../core/BaseNode';
import { ExpressionValidator } from './ExpressionValidator';
import { TemplateRegistry, NodeTemplate } from './NodeTemplate';
import { CustomNodeConfig, TemplateType } from './types';
import { logger } from '../utils/Logger';

/**
 * Custom Node class
 * Extends BaseNode to provide dynamic node creation via templates and expressions
 */
export class CustomNode extends BaseNode {
  /** Template used by this node */
  private readonly template: NodeTemplate;
  /** Expression to execute */
  private readonly expression: string;
  /** Pre-compiled expression function (cached for performance) */
  private compiledExpression: ((inputs: Record<string, unknown>) => unknown) | undefined;
  /** Storage ID if persisted */
  public readonly storageId?: string;

  /**
   * Creates a new CustomNode instance
   * 
   * @param config - Custom node configuration
   */
  constructor(config: CustomNodeConfig) {
    // Validate template
    const template = TemplateRegistry.getTemplate(config.template);
    if (!template) {
      throw new Error(`Invalid template type: ${config.template}`);
    }

    // Validate expression
    const validation = ExpressionValidator.validate(config.expression, config.template);
    if (!validation.valid) {
      throw new Error(
        `Invalid expression: ${validation.errors.join(', ')}`,
      );
    }

    // Create base node config
    const baseConfig: NodeConfig = {
      id: config.id,
      name: config.name,
      description: config.description,
      inputs: config.inputs,
      outputs: config.outputs,
    };

    super(baseConfig);

    this.template = template;
    this.expression = config.expression;
    this.storageId = config.storageId;

    // Pre-compile expression for better performance
    const compiled = ExpressionValidator.compileExpression(
      this.expression,
      this.inputs.map(input => input.id),
    );

    this.compiledExpression = compiled ?? undefined;

    if (this.compiledExpression === undefined) {
      logger.warn(`Failed to pre-compile expression for node ${this.id}`);
    }
  }

  /**
   * Execute the custom node
   * This method is called by the execution engine
   * 
   * @param context - Execution context with inputs
   * @returns Map of output port IDs to values
   */
  protected async executeInternal(
    context: ExecutionContext,
  ): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    try {
      // Execute using template
      const result = await this.template.execute(
        this.expression,
        context.inputs,
        this.compiledExpression,
      );

      if (!result.success) {
        throw new NodeError(
          result.error ?? 'Template execution failed',
          this.id,
          undefined,
        );
      }

      // Map template outputs to output ports
      this.outputs.forEach((output, index) => {
        const value = result.outputs[index];
        outputs.set(output.id, value ?? null);
      });

      // If template returned fewer outputs than expected, fill with null
      for (let i = result.outputs.length; i < this.outputs.length; i++) {
        const output = this.outputs[i];
        outputs.set(output.id, null);
      }

      return outputs;
    } catch (error) {
      logger.error(`Custom node ${this.id} execution error:`, error);

      // Return error in outputs or throw
      if (error instanceof NodeError) {
        throw error;
      }

      throw new NodeError(
        `Custom node execution failed: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Get the template type used by this node
   * 
   * @returns Template type
   */
  public getTemplateType(): TemplateType {
    return this.template.type;
  }

  /**
   * Get the expression used by this node
   * 
   * @returns Expression string
   */
  public getExpression(): string {
    return this.expression;
  }

  /**
   * Validate the node configuration
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  public static validateConfig(config: Partial<CustomNodeConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!config.name) {
      errors.push('Node name is required');
    }

    if (!config.template) {
      errors.push('Template type is required');
    } else if (!TemplateRegistry.hasTemplate(config.template)) {
      errors.push(`Invalid template type: ${config.template}`);
    }

    if (!config.expression) {
      errors.push('Expression is required');
    } else if (config.template) {
      const validation = ExpressionValidator.validate(config.expression, config.template);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    // Check ports
    if (!config.inputs || config.inputs.length === 0) {
      errors.push('At least one input port is required');
    }

    if (!config.outputs || config.outputs.length === 0) {
      errors.push('At least one output port is required');
    }

    // Validate port structure
    if (config.inputs) {
      config.inputs.forEach((input, index) => {
        if (!input.id) {
          errors.push(`Input port ${index} missing ID`);
        }
        if (!input.name) {
          errors.push(`Input port ${index} missing name`);
        }
        if (!input.dataType) {
          errors.push(`Input port ${index} missing data type`);
        }
      });
    }

    if (config.outputs) {
      config.outputs.forEach((output, index) => {
        if (!output.id) {
          errors.push(`Output port ${index} missing ID`);
        }
        if (!output.name) {
          errors.push(`Output port ${index} missing name`);
        }
        if (!output.dataType) {
          errors.push(`Output port ${index} missing data type`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

