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
  IInteractiveNode,
  InteractiveExecutionContext,
  InteractiveNodeType,
  ExecutionResult,
  UserInputRequest,
} from '../types';

import { BaseNode } from '../core/BaseNode';
import { ExpressionValidator } from './ExpressionValidator';
import { TemplateRegistry, NodeTemplate } from './NodeTemplate';
import { CustomNodeConfig, TemplateType, CustomNodeMetadata } from './types';
import { logger } from '../utils/Logger';
import type { UINodeConfig } from '../types/uiNodeConfig';
import { mapFormDataToOutputs } from '../../services/uiDataService';
import { validateForm } from '../../services/validationService';
import type { UIDefinition } from '../types/uiDefinition';

/**
 * Custom Node class
 * Extends BaseNode to provide dynamic node creation via templates and expressions
 * Also supports interactive nodes when expression is 'ui'
 */
export class CustomNode extends BaseNode implements IInteractiveNode {
  /** Template used by this node */
  private readonly template: NodeTemplate | null;
  /** Expression to execute */
  private readonly expression: string;
  /** Pre-compiled expression function (cached for performance) */
  private compiledExpression: ((inputs: Record<string, unknown>) => unknown) | undefined;
  /** Storage ID if persisted */
  public readonly storageId?: string;
  /** Whether this is an interactive node */
  public readonly isInteractive: boolean;
  /** Interactive node type */
  public readonly interactiveType?: InteractiveNodeType;
  /** UI config for interactive nodes */
  private readonly uiConfig?: UINodeConfig;
  /** UI definition for interactive nodes (cached) */
  private readonly uiDefinition?: UIDefinition;

  /**
   * Creates a new CustomNode instance
   * 
   * @param config - Custom node configuration
   * @param metadata - Optional metadata (for interactive nodes with UI config)
   * @param uiDefinition - Optional UI definition (for interactive nodes)
   */
  constructor(
    config: CustomNodeConfig,
    metadata?: CustomNodeMetadata & { uiConfig?: UINodeConfig },
    uiDefinition?: UIDefinition,
  ) {
    // Check if this is an interactive node (expression is 'ui')
    const isInteractive = config.expression === 'ui';

    // Create base node config
    const baseConfig: NodeConfig = {
      id: config.id,
      name: config.name,
      description: config.description,
      inputs: config.inputs,
      outputs: config.outputs,
    };

    super(baseConfig);

    this.isInteractive = isInteractive;
    this.storageId = config.storageId;

    if (isInteractive) {
      // Interactive node - no template execution
      this.template = null;
      this.expression = 'ui';
      this.interactiveType = InteractiveNodeType.CUSTOM_UI;
      this.uiConfig = metadata?.uiConfig;
      this.uiDefinition = uiDefinition;
      
      if (!this.uiConfig) {
        logger.warn(`Interactive node ${this.id} created without UI config`);
      }
      if (!this.uiDefinition && this.uiConfig) {
        logger.warn(`Interactive node ${this.id} created without UI definition`);
      }
    } else {
      // Regular custom node - validate template and expression
      const template = TemplateRegistry.getTemplate(config.template);
      if (!template) {
        throw new Error(`Invalid template type: ${config.template}`);
      }

      // Validate expression (skip for interactive nodes)
      if (config.expression !== 'ui') {
        const validation = ExpressionValidator.validate(config.expression, config.template);
        if (!validation.valid) {
          throw new Error(
            `Invalid expression: ${validation.errors.join(', ')}`,
          );
        }
      }

      this.template = template;
      this.expression = config.expression;

      // Pre-compile expression for better performance (skip for interactive nodes)
      if (config.expression !== 'ui') {
        const compiled = ExpressionValidator.compileExpression(
          this.expression,
          this.inputs.map(input => input.id),
        );

        this.compiledExpression = compiled ?? undefined;

        if (this.compiledExpression === undefined) {
          logger.warn(`Failed to pre-compile expression for node ${this.id}`);
        }
      }
    }
  }

  /**
   * Execute interactive node with UI
   * This method is called for interactive nodes
   * 
   * @param context - Interactive execution context
   * @returns Execution result
   */
  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Get UI config from node properties (set during graph execution) or from constructor
    const uiConfigFromProperties = this.getProperty<UINodeConfig>('uiConfig');
    const activeUIConfig = uiConfigFromProperties || this.uiConfig;

    if (!activeUIConfig) {
      throw new NodeError(
        'Interactive node missing UI configuration',
        this.id,
        undefined,
      );
    }

    try {
      // Get UI definition from properties or use cached one
      let uiDefinition = this.getProperty<UIDefinition>('uiDefinition') || this.uiDefinition;

      // If not found, try to load from API (for server-side execution)
      if (!uiDefinition && activeUIConfig.uiDefinitionId) {
        try {
          // In server context, we can't access localStorage, so we need the UI definition
          // to be passed via properties or loaded from an API
          // For now, we'll construct a minimal UI definition from the request
          // The actual UI definition should be loaded client-side and passed via properties
          logger.warn(`UI definition ${activeUIConfig.uiDefinitionId} not found in properties. Interactive node may not work correctly.`);
        } catch (error) {
          logger.error('Failed to load UI definition:', error);
        }
      }

      if (!uiDefinition) {
        // Create a minimal fallback UI definition from the request
        // This allows the node to still request user input, but the UI will be basic
        logger.warn(`Using fallback UI definition for ${activeUIConfig.uiDefinitionId}`);
        uiDefinition = {
          id: activeUIConfig.uiDefinitionId,
          name: 'Interactive Form',
          version: '1.0.0',
          components: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Get content from input if provided
      const content = context.inputs.get('content');

      // Build user input request with UI definition
      // Include UI definition ID in the request so the frontend can load it
      const request: UserInputRequest = {
        type: 'form',
        formSchema: {
          fields: uiDefinition.components
            .filter((comp) => comp.type !== 'button' && comp.type !== 'label' && comp.name)
            .map((comp) => ({
              id: comp.name || comp.id,
              label: comp.label || comp.name || '',
              type: comp.type === 'textarea' ? 'textarea' : comp.type === 'number' ? 'number' : 'text',
              required: comp.required || false,
              placeholder: comp.placeholder,
              defaultValue: comp.defaultValue,
              options: comp.options,
            })),
        },
        content,
        // Add UI definition ID to request so frontend can identify custom UI nodes
        uiDefinitionId: activeUIConfig.uiDefinitionId,
      };

      // Request user input (execution will pause here)
      const userInput = await context.requestUserInput(request);

      // Validate if required
      if (activeUIConfig.validateBeforeSubmit) {
        const validation = validateForm(uiDefinition.components, userInput as Record<string, unknown>);
        if (!validation.isValid) {
          throw new NodeError(
            `Form validation failed: ${validation.errors.join(', ')}`,
            this.id,
            undefined,
          );
        }
      }

      // Map form data to outputs
      const mappedOutputs = mapFormDataToOutputs(
        userInput as Record<string, unknown>,
        activeUIConfig.outputMapping,
      );

      // Create outputs map
      const outputs = new Map<PortId, unknown>();
      this.outputs.forEach((output) => {
        const value = mappedOutputs[output.id] ?? null;
        outputs.set(output.id, value);
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        outputs,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (error instanceof NodeError) {
        return {
          success: false,
          error: error.message,
          executionTime,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      };
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
    // Interactive nodes should use executeInteractive instead
    if (this.isInteractive) {
      throw new NodeError(
        'Interactive nodes must use executeInteractive method',
        this.id,
        undefined,
      );
    }

    if (!this.template) {
      throw new NodeError(
        'Node template not available',
        this.id,
        undefined,
      );
    }

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

