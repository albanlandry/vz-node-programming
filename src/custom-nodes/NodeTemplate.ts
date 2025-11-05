/**
 * Node Template System
 * Defines templates for different types of custom nodes
 * 
 * Templates provide a structured way to create nodes with specific behaviors:
 * - Transform: Input to output transformation
 * - Filter: Conditional filtering
 * - Calculator: Mathematical operations
 * - Conditional: Branching logic
 * - StringOp: String operations
 */

import { PortId } from '../types';
import { ExpressionValidator } from './ExpressionValidator';
import { TemplateType } from './types';
import { logger } from '../utils/Logger';

/**
 * Result of template execution
 */
export interface TemplateExecutionResult {
  /** Success status */
  success: boolean;
  /** Output values (indexed by output port order) */
  outputs: unknown[];
  /** Error message if execution failed */
  error?: string;
}

/**
 * Base interface for node templates
 */
export interface NodeTemplate {
  /** Template type identifier */
  type: TemplateType;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Icon/emoji */
  icon?: string;
  /** Color for UI */
  color?: string;
  /**
   * Execute the template with given expression and inputs
   * 
   * @param expression - The expression to execute
   * @param inputs - Input values mapped by port ID
   * @param compiledFn - Pre-compiled function (optional)
   * @returns Execution result
   */
  execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult>;
  /**
   * Validate expression for this template
   * 
   * @param expression - Expression to validate
   * @returns Validation result
   */
  validateExpression(expression: string): boolean;
}

/**
 * Transform Template
 * Transforms input values to output values using an expression
 */
export class TransformTemplate implements NodeTemplate {
  type = TemplateType.TRANSFORM as const;
  name = 'Transform';
  description = 'Transform input values to output values using an expression';
  icon = '🔄';
  color = '#3B82F6';

  async execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult> {
    try {
      // Convert Map to object for easier access
      const inputsObj: Record<string, unknown> = {};
      inputs.forEach((value, key) => {
        inputsObj[key] = value;
      });

      // Execute expression
      let result: unknown;
      if (compiledFn) {
        result = compiledFn(inputsObj);
      } else {
        const fn = ExpressionValidator.compileExpression(expression, Array.from(inputs.keys()));
        if (!fn) {
          return {
            success: false,
            outputs: [],
            error: 'Failed to compile expression',
          };
        }
        result = fn(inputsObj);
      }

      return {
        success: true,
        outputs: [result],
      };
    } catch (error) {
      logger.error('Transform template execution error:', error);
      return {
        success: false,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateExpression(expression: string): boolean {
    const validation = ExpressionValidator.validate(expression, this.type);
    return validation.valid;
  }
}

/**
 * Filter Template
 * Filters values based on a boolean expression
 */
export class FilterTemplate implements NodeTemplate {
  type = TemplateType.FILTER as const;
  name = 'Filter';
  description = 'Filter values based on a boolean condition';
  icon = '🔍';
  color = '#22C55E';

  async execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult> {
    try {
      const inputsObj: Record<string, unknown> = {};
      inputs.forEach((value, key) => {
        inputsObj[key] = value;
      });

      let condition: boolean;
      if (compiledFn) {
        const result = compiledFn(inputsObj);
        condition = Boolean(result);
      } else {
        const fn = ExpressionValidator.compileExpression(expression, Array.from(inputs.keys()));
        if (!fn) {
          return {
            success: false,
            outputs: [],
            error: 'Failed to compile expression',
          };
        }
        condition = Boolean(fn(inputsObj));
      }

      // Filter: if condition is true, pass input through; otherwise, return null
      const inputValue = inputs.values().next().value;
      const result = condition ? inputValue : null;

      return {
        success: true,
        outputs: [result, condition],
      };
    } catch (error) {
      logger.error('Filter template execution error:', error);
      return {
        success: false,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateExpression(expression: string): boolean {
    const validation = ExpressionValidator.validate(expression, this.type);
    return validation.valid;
  }
}

/**
 * Calculator Template
 * Performs mathematical operations
 */
export class CalculatorTemplate implements NodeTemplate {
  type = TemplateType.CALCULATOR as const;
  name = 'Calculator';
  description = 'Perform mathematical calculations';
  icon = '🔢';
  color = '#9333EA';

  async execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult> {
    try {
      const inputsObj: Record<string, unknown> = {};
      inputs.forEach((value, key) => {
        // Ensure numeric values
        inputsObj[key] = typeof value === 'number' ? value : Number(value);
      });

      let result: unknown;
      if (compiledFn) {
        result = compiledFn(inputsObj);
      } else {
        const fn = ExpressionValidator.compileExpression(expression, Array.from(inputs.keys()));
        if (!fn) {
          return {
            success: false,
            outputs: [],
            error: 'Failed to compile expression',
          };
        }
        result = fn(inputsObj);
      }

      // Ensure result is a number
      const numericResult = typeof result === 'number' ? result : Number(result);
      if (isNaN(numericResult)) {
        return {
          success: false,
          outputs: [],
          error: 'Calculation result is not a valid number',
        };
      }

      return {
        success: true,
        outputs: [numericResult],
      };
    } catch (error) {
      logger.error('Calculator template execution error:', error);
      return {
        success: false,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateExpression(expression: string): boolean {
    const validation = ExpressionValidator.validate(expression, this.type);
    return validation.valid;
  }
}

/**
 * Conditional Template
 * Returns different values based on a condition
 */
export class ConditionalTemplate implements NodeTemplate {
  type = TemplateType.CONDITIONAL as const;
  name = 'Conditional';
  description = 'Return different values based on a condition';
  icon = '❓';
  color = '#EAB308';

  async execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult> {
    try {
      const inputsObj: Record<string, unknown> = {};
      inputs.forEach((value, key) => {
        inputsObj[key] = value;
      });

      let result: unknown;
      if (compiledFn) {
        result = compiledFn(inputsObj);
      } else {
        const fn = ExpressionValidator.compileExpression(expression, Array.from(inputs.keys()));
        if (!fn) {
          return {
            success: false,
            outputs: [],
            error: 'Failed to compile expression',
          };
        }
        result = fn(inputsObj);
      }

      return {
        success: true,
        outputs: [result],
      };
    } catch (error) {
      logger.error('Conditional template execution error:', error);
      return {
        success: false,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateExpression(expression: string): boolean {
    const validation = ExpressionValidator.validate(expression, this.type);
    return validation.valid;
  }
}

/**
 * String Operation Template
 * Performs string manipulation operations
 */
export class StringOpTemplate implements NodeTemplate {
  type = TemplateType.STRING_OP as const;
  name = 'String Operation';
  description = 'Perform string manipulation operations';
  icon = '📝';
  color = '#EF4444';

  async execute(
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: (inputs: Record<string, unknown>) => unknown,
  ): Promise<TemplateExecutionResult> {
    try {
      const inputsObj: Record<string, unknown> = {};
      inputs.forEach((value, key) => {
        // Ensure string values
        inputsObj[key] = typeof value === 'string' ? value : String(value);
      });

      let result: unknown;
      if (compiledFn) {
        result = compiledFn(inputsObj);
      } else {
        const fn = ExpressionValidator.compileExpression(expression, Array.from(inputs.keys()));
        if (!fn) {
          return {
            success: false,
            outputs: [],
            error: 'Failed to compile expression',
          };
        }
        result = fn(inputsObj);
      }

      // Ensure result is a string
      const stringResult = typeof result === 'string' ? result : String(result);

      return {
        success: true,
        outputs: [stringResult],
      };
    } catch (error) {
      logger.error('String operation template execution error:', error);
      return {
        success: false,
        outputs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  validateExpression(expression: string): boolean {
    const validation = ExpressionValidator.validate(expression, this.type);
    return validation.valid;
  }
}

/**
 * Template Registry
 * Manages available templates
 */
export class TemplateRegistry {
  private static templates: Map<TemplateType, NodeTemplate> = new Map();

  /**
   * Initialize templates
   */
  static initialize(): void {
    this.templates.set(TemplateType.TRANSFORM, new TransformTemplate());
    this.templates.set(TemplateType.FILTER, new FilterTemplate());
    this.templates.set(TemplateType.CALCULATOR, new CalculatorTemplate());
    this.templates.set(TemplateType.CONDITIONAL, new ConditionalTemplate());
    this.templates.set(TemplateType.STRING_OP, new StringOpTemplate());
  }

  /**
   * Get a template by type
   * 
   * @param type - Template type
   * @returns Template instance or undefined
   */
  static getTemplate(type: TemplateType): NodeTemplate | undefined {
    if (this.templates.size === 0) {
      this.initialize();
    }
    return this.templates.get(type);
  }

  /**
   * Get all available templates
   * 
   * @returns Array of all templates
   */
  static getAllTemplates(): NodeTemplate[] {
    if (this.templates.size === 0) {
      this.initialize();
    }
    return Array.from(this.templates.values());
  }

  /**
   * Check if a template type exists
   * 
   * @param type - Template type to check
   * @returns True if template exists
   */
  static hasTemplate(type: TemplateType): boolean {
    if (this.templates.size === 0) {
      this.initialize();
    }
    return this.templates.has(type);
  }
}

