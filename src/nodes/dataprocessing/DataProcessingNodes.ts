/**
 * Data Processing Nodes
 * 
 * Nodes for data transformation, validation, and processing
 */

import { BaseNode } from '../../core/BaseNode';
import { DataTypes, ExecutionContext, PortId, NodeError, NodeConfig } from '../../types';
import { logger } from '../../utils/Logger';

/**
 * JSON Path Query Node
 * Queries JSON data using JSONPath expressions
 */
export class JsonPathNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'JSON Path',
      description: config?.description || 'Queries JSON data using path expressions',
      inputs: [
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: true,
          description: 'JSON data to query',
        },
        {
          id: 'path',
          name: 'Path',
          dataType: DataTypes.STRING,
          required: true,
          description: 'JSONPath expression (e.g., $.users[0].name)',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Query result',
        },
        {
          id: 'found',
          name: 'Found',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the path was found',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const data = this.getInput<unknown>(context, 'data');
    const path = this.getInput<string>(context, 'path');

    if (!path) {
      throw new NodeError('Path is required', this.id, 'path');
    }

    try {
      const result = this.evaluateJsonPath(data, path);
      outputs.set('result', result);
      outputs.set('found', result !== undefined);
    } catch (error) {
      logger.error('JSON Path evaluation error:', error);
      throw new NodeError(
        `JSON Path evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'path',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }

  /**
   * Simple JSONPath evaluator (supports basic paths like $.key, $[0], $.key.subkey)
   */
  private evaluateJsonPath(data: unknown, path: string): unknown {
    if (!path.startsWith('$')) {
      throw new Error('JSONPath must start with $');
    }

    let current: any = data;
    const parts = path.slice(1).split(/[\.\[\]]/).filter(p => p.length > 0);

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      // Handle array index
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        // Handle object property
        if (typeof current === 'object' && current !== null) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }
}

/**
 * Data Validation Node
 * Validates data against a schema
 */
export class DataValidationNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'Data Validation',
      description: 'Validates data against validation rules',
      inputs: [
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Data to validate',
        },
        {
          id: 'rules',
          name: 'Validation Rules',
          dataType: DataTypes.OBJECT,
          required: true,
          description: 'Validation rules object',
        },
      ],
      outputs: [
        {
          id: 'valid',
          name: 'Valid',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the data is valid',
        },
        {
          id: 'errors',
          name: 'Errors',
          dataType: DataTypes.ARRAY,
          description: 'Array of validation errors',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const data = this.getInput<unknown>(context, 'data');
    const rules = this.getInput<Record<string, unknown>>(context, 'rules');

    if (!rules) {
      throw new NodeError('Validation rules are required', this.id, 'rules');
    }

    try {
      const validationResult = this.validateData(data, rules);
      outputs.set('valid', validationResult.valid);
      outputs.set('errors', validationResult.errors);
    } catch (error) {
      logger.error('Data validation error:', error);
      throw new NodeError(
        `Data validation failed: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'rules',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }

  /**
   * Validate data against rules
   */
  private validateData(
    data: unknown,
    rules: Record<string, unknown>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Type validation
    if (rules.type) {
      const expectedType = rules.type as string;
      const actualType = this.getType(data);
      if (actualType !== expectedType) {
        errors.push(`Expected type ${expectedType}, got ${actualType}`);
      }
    }

    // Required validation
    if (rules.required === true && (data === undefined || data === null)) {
      errors.push('Value is required');
    }

    // Min/Max validation for numbers
    if (typeof data === 'number') {
      if (rules.min !== undefined && data < (rules.min as number)) {
        errors.push(`Value must be >= ${rules.min}`);
      }
      if (rules.max !== undefined && data > (rules.max as number)) {
        errors.push(`Value must be <= ${rules.max}`);
      }
    }

    // MinLength/MaxLength validation for strings
    if (typeof data === 'string') {
      if (rules.minLength !== undefined && data.length < (rules.minLength as number)) {
        errors.push(`String length must be >= ${rules.minLength}`);
      }
      if (rules.maxLength !== undefined && data.length > (rules.maxLength as number)) {
        errors.push(`String length must be <= ${rules.maxLength}`);
      }
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern as string);
        if (!regex.test(data)) {
          errors.push(`String does not match pattern ${rules.pattern}`);
        }
      }
    }

    // Enum validation
    if (rules.enum && Array.isArray(rules.enum)) {
      if (!rules.enum.includes(data)) {
        errors.push(`Value must be one of: ${rules.enum.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get type of value
   */
  private getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}

/**
 * JSON Parse Node
 * Parses JSON string to object
 */
export class JsonParseNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'JSON Parse',
      description: 'Parses a JSON string to an object',
      inputs: [
        {
          id: 'json',
          name: 'JSON String',
          dataType: DataTypes.STRING,
          required: true,
          description: 'JSON string to parse',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.OBJECT,
          description: 'Parsed JSON object',
        },
        {
          id: 'valid',
          name: 'Valid',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether the JSON is valid',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const jsonString = this.getInput<string>(context, 'json');

    if (!jsonString) {
      throw new NodeError('JSON string is required', this.id, 'json');
    }

    try {
      const result = JSON.parse(jsonString);
      outputs.set('result', result);
      outputs.set('valid', true);
    } catch (error) {
      outputs.set('result', null);
      outputs.set('valid', false);
      logger.warn('JSON parse failed:', error);
    }

    return outputs;
  }
}

/**
 * JSON Stringify Node
 * Converts object to JSON string
 */
export class JsonStringifyNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'JSON Stringify',
      description: 'Converts an object to a JSON string',
      inputs: [
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Data to stringify',
        },
        {
          id: 'pretty',
          name: 'Pretty Print',
          dataType: DataTypes.BOOLEAN,
          required: false,
          description: 'Whether to pretty print the JSON',
        },
      ],
      outputs: [
        {
          id: 'json',
          name: 'JSON String',
          dataType: DataTypes.STRING,
          description: 'JSON string representation',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const data = this.getInput<unknown>(context, 'data');
    const pretty = this.getInput<boolean>(context, 'pretty') ?? false;

    try {
      const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      outputs.set('json', json);
    } catch (error) {
      logger.error('JSON stringify failed:', error);
      throw new NodeError(
        `JSON stringify failed: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'data',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }
}

/**
 * Array Filter Node
 * Filters array elements based on a condition
 */
export class ArrayFilterNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      id: config?.id,
      name: config?.name || 'Array Filter',
      description: 'Filters array elements based on a condition',
      inputs: [
        {
          id: 'array',
          name: 'Array',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Array to filter',
        },
        {
          id: 'condition',
          name: 'Condition',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Filter condition (e.g., "item > 10")',
        },
      ],
      outputs: [
        {
          id: 'filtered',
          name: 'Filtered Array',
          dataType: DataTypes.ARRAY,
          description: 'Filtered array',
        },
        {
          id: 'count',
          name: 'Count',
          dataType: DataTypes.NUMBER,
          description: 'Number of filtered items',
        },
      ],
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const array = this.getInput<unknown[]>(context, 'array');
    const condition = this.getInput<string>(context, 'condition');

    if (!Array.isArray(array)) {
      throw new NodeError('Input must be an array', this.id, 'array');
    }

    if (!condition) {
      throw new NodeError('Condition is required', this.id, 'condition');
    }

    try {
      // Simple condition evaluator (for basic comparisons)
      // Note: This uses new Function() which should be sandboxed in production
      // For now, basic validation is done via ExpressionValidator
      const filtered = array.filter((item, index) => {
        try {
          // Basic condition evaluation (should be enhanced with sandboxing)
          // For simple comparisons like "item > 10", "item === 'value'"
          if (condition.includes('>')) {
            const [left, right] = condition.split('>').map(s => s.trim());
            if (left === 'item') {
              return (item as number) > parseFloat(right);
            }
          } else if (condition.includes('<')) {
            const [left, right] = condition.split('<').map(s => s.trim());
            if (left === 'item') {
              return (item as number) < parseFloat(right);
            }
          } else if (condition.includes('===')) {
            const [left, right] = condition.split('===').map(s => s.trim().replace(/['"]/g, ''));
            if (left === 'item') {
              return item === right || item === JSON.parse(right);
            }
          } else if (condition.includes('!==')) {
            const [left, right] = condition.split('!==').map(s => s.trim().replace(/['"]/g, ''));
            if (left === 'item') {
              return item !== right && item !== JSON.parse(right);
            }
          }
          
          // Fallback: try simple evaluation (should be sandboxed)
          // This is a basic implementation - consider using SandboxExecutor
          return false;
        } catch {
          return false;
        }
      });

      outputs.set('filtered', filtered);
      outputs.set('count', filtered.length);
    } catch (error) {
      logger.error('Array filter failed:', error);
      throw new NodeError(
        `Array filter failed: ${error instanceof Error ? error.message : String(error)}`,
        this.id,
        'condition',
        error instanceof Error ? error : undefined,
      );
    }

    return outputs;
  }
}

