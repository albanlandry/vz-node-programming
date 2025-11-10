/**
 * User Input Node
 * 
 * Example interactive node that requests user input during execution
 */

import { BaseNode } from '../../core/BaseNode';
import {
  DataTypes,
  InteractiveNodeType,
  NodeError,
} from '../../types';
import type {
  IInteractiveNode,
  InteractiveExecutionContext,
  ExecutionContext,
  ExecutionResult,
  Port,
  UserInputRequest,
} from '../../types';

export interface UserInputNodeConfig {
  id?: string;
  prompt?: string;
  inputType?: 'form' | 'prompt' | 'confirm';
  formSchema?: {
    fields: Array<{
      id: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea' | 'date';
      required?: boolean;
      placeholder?: string;
      defaultValue?: unknown;
      options?: { label: string; value: unknown }[];
    }>;
    title?: string;
    description?: string;
  };
}

export class UserInputNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.USER_INPUT;

  private prompt: string;
  private inputType: 'form' | 'prompt' | 'confirm';
  private formSchema?: UserInputNodeConfig['formSchema'];

  constructor(config: UserInputNodeConfig) {
    const inputs: Port[] = [
      {
        id: 'content',
        name: 'Content',
        dataType: DataTypes.ANY,
        description: 'Content to display to the user (optional)',
      },
    ];
    const outputs: Port[] = [
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.ANY,
        description: 'The user-provided input value',
      },
    ];

    super({
      id: config.id,
      name: 'User Input',
      description: 'Requests user input during execution',
      inputs,
      outputs,
    });

    this.prompt = config.prompt || 'Please provide input:';
    this.inputType = config.inputType || 'prompt';
    this.formSchema = config.formSchema;
  }

  /**
   * Execute with interactive context
   */
  async executeInteractive(
    context: InteractiveExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get content from input if provided
      const content = context.inputs.get('content');
      
      // Build user input request
      const request: UserInputRequest = {
        type: this.inputType,
        prompt: this.prompt,
      };

      // If content is provided, use it to populate the form or display
      if (content !== undefined && content !== null) {
        // For confirm type, include content in the request
        if (this.inputType === 'confirm') {
          request.content = content;
        }
        // For form type, populate fields with content
        else if (this.inputType === 'form' && this.formSchema) {
          // If form has a single textarea field, use content for display
          if (this.formSchema.fields.length === 1 && 
              this.formSchema.fields[0].type === 'textarea') {
            request.content = content;
            request.formSchema = {
              fields: this.formSchema.fields.map((field) => ({
                id: field.id,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                defaultValue: field.defaultValue,
                options: field.options,
              })),
              title: this.formSchema.title,
              description: this.formSchema.description,
            };
          }
          // If content is an object, use it to populate form fields
          else if (typeof content === 'object' && !Array.isArray(content)) {
            request.formSchema = {
              fields: this.formSchema.fields.map((field) => ({
                id: field.id,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                defaultValue: (content as Record<string, unknown>)[field.id] ?? field.defaultValue,
                options: field.options,
              })),
              title: this.formSchema.title,
              description: this.formSchema.description,
            };
          } else {
            // If content is a string or simple value, populate first field
            request.formSchema = {
              fields: this.formSchema.fields.map((field, index) => ({
                id: field.id,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                defaultValue: index === 0 ? content : field.defaultValue,
                options: field.options,
              })),
              title: this.formSchema.title,
              description: this.formSchema.description,
            };
          }
        }
        // For prompt type, use content as default value
        else if (this.inputType === 'prompt') {
          request.defaultValue = content;
        }
      } else if (this.inputType === 'form' && this.formSchema) {
        request.formSchema = {
          fields: this.formSchema.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            defaultValue: field.defaultValue,
            options: field.options,
          })),
          title: this.formSchema.title,
          description: this.formSchema.description,
        };
      }

      // Request user input (execution will pause here)
      const userInput = await context.requestUserInput(request);

      // Set output
      const outputs = new Map<string, unknown>();
      outputs.set('value', userInput);

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        outputs,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: new NodeError(
          error instanceof Error ? error.message : String(error),
          this.id,
        ),
        executionTime,
      };
    }
  }

  /**
   * Required by BaseNode - delegates to executeInteractive
   */
  protected async executeInternal(context: ExecutionContext): Promise<Map<string, unknown>> {
    // For interactive nodes, this should not be called directly
    // The executor will call executeInteractive instead
    // But we provide a fallback that converts ExecutionContext to InteractiveExecutionContext
    const result = await this.executeInteractive(context as unknown as InteractiveExecutionContext);
    return result.outputs || new Map();
  }

  /**
   * Regular execute method (not used for interactive nodes)
   */
  async execute(context: any): Promise<ExecutionResult> {
    // This should not be called for interactive nodes
    // But we provide a fallback
    return this.executeInteractive(context as InteractiveExecutionContext);
  }
}

