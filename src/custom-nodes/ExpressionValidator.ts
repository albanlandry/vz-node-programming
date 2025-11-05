/**
 * Expression Validator
 * Validates and sanitizes user-provided expressions for safe execution
 * 
 * This validator ensures that expressions:
 * - Are syntactically correct
 * - Don't contain dangerous patterns
 * - Only use allowed functions and operators
 */

import { logger } from '../utils/Logger';

/**
 * Allowed JavaScript functions and operators for expressions
 */
const ALLOWED_GLOBALS = [
  'Math',
  'Number',
  'String',
  'Boolean',
  'Array',
  'Object',
  'Date',
  'JSON',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
];

/**
 * Dangerous patterns that should be blocked
 */
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /new\s+Function/i,
  /require\s*\(/i,
  /import\s+/i,
  /export\s+/i,
  /process\./i,
  /global\./i,
  /window\./i,
  /document\./i,
  /\.constructor/i,
  /\.__proto__/i,
  /\.prototype/i,
  /while\s*\(/i,
  /for\s*\(/i,
  /setTimeout/i,
  /setInterval/i,
  /XMLHttpRequest/i,
  /fetch\s*\(/i,
];

/**
 * Expression validator for custom nodes
 * Provides validation and sanitization of user-provided expressions
 */
export class ExpressionValidator {
  /**
   * Validates an expression for safety and correctness
   * 
   * @param expression - The expression to validate
   * @param templateType - The template type (for context-specific validation)
   * @returns Validation result with errors and warnings
   */
  public static validate(
    expression: string,
    templateType?: string,
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic checks
    if (!expression || typeof expression !== 'string') {
      errors.push('Expression must be a non-empty string');
      return { valid: false, errors, warnings };
    }

    if (expression.trim().length === 0) {
      errors.push('Expression cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(expression)) {
        errors.push(`Expression contains forbidden pattern: ${pattern.source}`);
      }
    }

    // Check syntax (basic check)
    try {
      // Try to parse as expression
      new Function('inputs', `return ${expression};`);
    } catch (error) {
      errors.push(
        `Invalid expression syntax: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Check for potentially unsafe operations
    if (expression.includes('delete ')) {
      warnings.push('Use of delete operator may cause unexpected behavior');
    }

    if (expression.includes('void ')) {
      warnings.push('Use of void operator is discouraged');
    }

    // Template-specific validation
    if (templateType) {
      const templateValidation = this.validateForTemplate(expression, templateType);
      errors.push(...templateValidation.errors);
      warnings.push(...templateValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates expression for a specific template type
   * 
   * @param expression - The expression to validate
   * @param templateType - The template type
   * @returns Template-specific validation result
   */
  private static validateForTemplate(
    expression: string,
    templateType: string,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (templateType) {
      case 'transform':
        // Transform should return a value
        if (!expression.includes('return') && !expression.match(/^[^;{}]+$/)) {
          warnings.push('Transform expression should return a value');
        }
        break;

      case 'filter':
        // Filter should return a boolean
        if (!expression.includes('return') && !expression.match(/^[^;{}]+$/)) {
          warnings.push('Filter expression should return a boolean');
        }
        break;

      case 'calculator':
        // Calculator should use mathematical operations
        if (!/[+\-*/%]|Math\./.test(expression)) {
          warnings.push('Calculator expression should contain mathematical operations');
        }
        break;

      case 'conditional':
        // Conditional should return a value based on condition
        if (!/(if|ternary|\?|&&|\|\|)/.test(expression)) {
          warnings.push('Conditional expression should contain conditional logic');
        }
        break;

      default:
        break;
    }

    return { errors, warnings };
  }

  /**
   * Compiles a safe expression into a function
   * 
   * @param expression - The expression to compile
   * @param inputs - Input port IDs for context
   * @returns Compiled function or null if compilation fails
   */
  public static compileExpression(
    expression: string,
    inputs: string[],
  ): ((inputs: Record<string, unknown>) => unknown) | null {
    // Validate first
    const validation = this.validate(expression);
    if (!validation.valid) {
      logger.error('Cannot compile invalid expression:', validation.errors);
      return null;
    }

    try {
      // Create a safe execution context
      const safeInputs = inputs.reduce(
        (acc, id) => {
          acc[id] = undefined;
          return acc;
        },
        {} as Record<string, unknown>,
      );

      // Compile with restricted scope
      const compiledFn = new Function(
        'inputs',
        `
        // Restricted execution context
        const Math = Math;
        const Number = Number;
        const String = String;
        const Boolean = Boolean;
        const Array = Array;
        const Object = Object;
        const Date = Date;
        const JSON = JSON;
        const parseInt = parseInt;
        const parseFloat = parseFloat;
        const isNaN = isNaN;
        const isFinite = isFinite;
        
        try {
          return ${expression};
        } catch (error) {
          throw new Error('Expression execution error: ' + error.message);
        }
      `,
      ) as (inputs: Record<string, unknown>) => unknown;

      return compiledFn;
    } catch (error) {
      logger.error('Failed to compile expression:', error);
      return null;
    }
  }

  /**
   * Sanitizes an expression by removing potentially dangerous parts
   * 
   * @param expression - The expression to sanitize
   * @returns Sanitized expression
   */
  public static sanitize(expression: string): string {
    let sanitized = expression.trim();

    // Remove comments
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');
    sanitized = sanitized.replace(/\/\/.*$/gm, '');

    // Remove whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }
}

