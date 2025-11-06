import { BaseNode } from '../../core/BaseNode';
import { ExecutionContext, PortId, DataTypes, NodeConfig } from '../../types';
import { logger } from '../../utils/Logger';

/**
 * Utility and Mixed Paradigm Examples
 */

/**
 * Conditional node - demonstrates control flow
 */
export class ConditionalNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Conditional',
      description: 'Executes different logic based on a condition',
      inputs: [
        {
          id: 'condition',
          name: 'Condition',
          dataType: DataTypes.BOOLEAN,
          required: true,
          description: 'Boolean condition to evaluate',
        },
        {
          id: 'trueValue',
          name: 'True Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to return if condition is true',
        },
        {
          id: 'falseValue',
          name: 'False Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to return if condition is false',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Selected value based on condition',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();

    const condition = this.getInput<boolean>(context, 'condition');
    const trueValue = this.getInput<any>(context, 'trueValue');
    const falseValue = this.getInput<any>(context, 'falseValue');

    const result = condition ? trueValue : falseValue;
    this.setOutput(outputs, 'result', result);

    return outputs;
  }
}

/**
 * Math operations node - demonstrates functional operations
 */
export class MathNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Math',
      description: 'Performs mathematical operations',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Math operation: add, subtract, multiply, divide, power, sqrt',
        },
        {
          id: 'a',
          name: 'A',
          dataType: DataTypes.NUMBER,
          required: true,
          description: 'First number',
        },
        {
          id: 'b',
          name: 'B',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Second number (not needed for sqrt)',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.NUMBER,
          description: 'Mathematical result',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();

    const operation = this.getInput<string>(context, 'operation');
    const a = this.getInput<number>(context, 'a');
    const b = this.getInput<number>(context, 'b');

    if (typeof a !== 'number') {
      throw new Error('A must be a number');
    }

    let result: number;

    switch (operation) {
      case 'add':
        if (typeof b !== 'number') {
          throw new Error('B must be a number for addition');
        }
        result = a + b;
        break;
      case 'subtract':
        if (typeof b !== 'number') {
          throw new Error('B must be a number for subtraction');
        }
        result = a - b;
        break;
      case 'multiply':
        if (typeof b !== 'number') {
          throw new Error('B must be a number for multiplication');
        }
        result = a * b;
        break;
      case 'divide':
        if (typeof b !== 'number') {
          throw new Error('B must be a number for division');
        }
        if (b === 0) {
          throw new Error('Division by zero');
        }
        result = a / b;
        break;
      case 'power':
        if (typeof b !== 'number') {
          throw new Error('B must be a number for power');
        }
        result = Math.pow(a, b);
        break;
      case 'sqrt':
        if (a < 0) {
          throw new Error('Cannot take square root of negative number');
        }
        result = Math.sqrt(a);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    this.setOutput(outputs, 'result', result);
    return outputs;
  }
}

/**
 * String operations node - demonstrates string manipulation
 */
export class StringNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'String',
      description: 'Performs string operations',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.STRING,
          required: true,
          description: 'String operation: concat, split, replace, toUpperCase, toLowerCase, length',
        },
        {
          id: 'input',
          name: 'Input',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Input string',
        },
        {
          id: 'parameter',
          name: 'Parameter',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Additional parameter for operation',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'String operation result',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();

    const operation = this.getInput<string>(context, 'operation');
    const input = this.getInput<string>(context, 'input');
    const parameter = this.getInput<any>(context, 'parameter');

    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    let result: any;

    switch (operation) {
      case 'concat':
        if (typeof parameter !== 'string') {
          throw new Error('Parameter must be a string for concat');
        }
        result = input + parameter;
        break;
      case 'split':
        const separator = parameter || ' ';
        result = input.split(separator);
        break;
      case 'replace':
        if (!parameter || typeof parameter !== 'object') {
          throw new Error('Parameter must be an object with from and to properties');
        }
        result = input.replace(parameter.from, parameter.to);
        break;
      case 'toUpperCase':
        result = input.toUpperCase();
        break;
      case 'toLowerCase':
        result = input.toLowerCase();
        break;
      case 'length':
        result = input.length;
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    this.setOutput(outputs, 'result', result);
    return outputs;
  }
}

/**
 * Data transformation node - demonstrates functional data processing
 */
export class TransformNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Transform',
      description: 'Transforms data using a transformation function',
      inputs: [
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Data to transform',
        },
        {
          id: 'transformer',
          name: 'Transformer',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Transformation function',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Transformed data',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();

    const data = this.getInput<any>(context, 'data');
    const transformer = this.getInput<Function>(context, 'transformer');

    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function');
    }

    try {
      const result = transformer(data);
      this.setOutput(outputs, 'result', result);
    } catch (error) {
      throw new Error(`Transformation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return outputs;
  }
}

/**
 * Constant node - defines a constant value from basic data types
 * This is an output-only node that uses properties for configuration
 */
export class ConstantNode extends BaseNode {
  constructor(config?: Partial<NodeConfig> & { properties?: { type?: string; value?: string } }) {
    super({
      name: 'Constant',
      description: 'Defines a constant value from basic data types (string, number, boolean)',
      inputs: [], // Output-only node
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Parsed constant value',
        },
      ],
      ...config,
    });

    // Set default properties if provided
    if (config?.properties) {
      this.setProperty('type', config.properties.type ?? 'string');
      this.setProperty('value', config.properties.value ?? '');
    } else {
      // Set default properties
      this.setProperty('type', 'string');
      this.setProperty('value', '');
    }
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    // Get type and value from properties
    const type = this.getProperty<string>('type') ?? 'string';
    const valueStr = this.getProperty<string>('value') ?? '';

    let result: unknown;

    switch (type?.toLowerCase()) {
      case 'string':
        result = valueStr;
        break;
      case 'number':
        result = Number.parseFloat(valueStr);
        if (Number.isNaN(result)) {
          throw new Error(`Invalid number: ${valueStr}`);
        }
        break;
      case 'boolean':
        const lowerValue = valueStr.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') {
          result = true;
        } else if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') {
          result = false;
        } else {
          throw new Error(`Invalid boolean: ${valueStr}. Use 'true' or 'false'`);
        }
        break;
      default:
        throw new Error(`Unsupported type: ${type}. Supported types: string, number, boolean`);
    }

    this.setOutput(outputs, 'result', result);
    return outputs;
  }
}

/**
 * Array node - defines an array of basic types
 */
export class ArrayNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Array',
      description: 'Defines an array of basic types from JSON string or individual elements',
      inputs: [
        {
          id: 'json',
          name: 'JSON Array',
          dataType: DataTypes.STRING,
          required: false,
          description: 'JSON string representing an array (e.g., "[1,2,3]" or \'["a","b"]\')',
        },
        {
          id: 'element',
          name: 'Element',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Single element to add to array (can be connected multiple times)',
        },
        {
          id: 'separator',
          name: 'Separator',
          dataType: DataTypes.STRING,
          required: false,
          description: 'Separator for string-based array creation (default: comma)',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ARRAY,
          description: 'Array of values',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const jsonInput = this.getInput<string>(context, 'json');
    const element = this.getInput<unknown>(context, 'element');
    const separator = this.getInput<string>(context, 'separator') ?? ',';

    let result: unknown[];

    // If JSON is provided, parse it
    if (jsonInput !== undefined && jsonInput !== null && jsonInput !== '') {
      try {
        const parsed = JSON.parse(jsonInput);
        if (!Array.isArray(parsed)) {
          throw new Error('JSON input must be a valid array');
        }
        result = parsed;
      } catch (error) {
        throw new Error(`Invalid JSON array: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (element !== undefined && element !== null) {
      // If element is provided, create array with that element
      // If element is a string and contains separator, split it
      if (typeof element === 'string' && element.includes(separator)) {
        result = element.split(separator).map(item => {
          const trimmed = item.trim();
          // Try to parse as number or boolean
          if (trimmed === 'true') return true;
          if (trimmed === 'false') return false;
          const num = Number.parseFloat(trimmed);
          if (!Number.isNaN(num) && trimmed === String(num)) return num;
          return trimmed;
        });
      } else {
        result = [element];
      }
    } else {
      // Default to empty array
      result = [];
    }

    this.setOutput(outputs, 'result', result);
    return outputs;
  }
}

/**
 * Object node - defines a plain JSON object with properties and values
 */
export class ObjectNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Object',
      description: 'Defines a plain JSON object with properties and values',
      inputs: [
        {
          id: 'json',
          name: 'JSON Object',
          dataType: DataTypes.STRING,
          required: false,
          description: 'JSON string representing an object (e.g., \'{"key":"value"}\')',
        },
        {
          id: 'key',
          name: 'Property Key',
          dataType: DataTypes.STRING,
          required: false,
          description: 'Property key name',
        },
        {
          id: 'value',
          name: 'Property Value',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Property value',
        },
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.OBJECT,
          description: 'JSON object with properties',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();

    const jsonInput = this.getInput<string>(context, 'json');
    const key = this.getInput<string>(context, 'key');
    const value = this.getInput<unknown>(context, 'value');

    let result: Record<string, unknown>;

    // If JSON is provided, parse it
    if (jsonInput !== undefined && jsonInput !== null && jsonInput !== '') {
      try {
        const parsed = JSON.parse(jsonInput);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('JSON input must be a valid object');
        }
        result = parsed as Record<string, unknown>;
      } catch (error) {
        throw new Error(`Invalid JSON object: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Start with empty object
      result = {};
    }

    // If key and value are provided, add/update the property
    if (key !== undefined && key !== null && key !== '') {
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }

    this.setOutput(outputs, 'result', result);
    return outputs;
  }
}

/**
 * Logger node - demonstrates side effects and logging
 */
export class LoggerNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      name: 'Logger',
      description: 'Logs data to console with different levels',
      inputs: [
        {
          id: 'level',
          name: 'Level',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Log level: info, warn, error, debug',
        },
        {
          id: 'message',
          name: 'Message',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Message to log',
        },
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Additional data to log',
        },
      ],
      outputs: [
        {
          id: 'logged',
          name: 'Logged',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether logging was successful',
        },
      ],
      ...config,
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();

    const level = this.getInput<string>(context, 'level');
    const message = this.getInput<any>(context, 'message');
    const data = this.getInput<any>(context, 'data');

    // Map string level to LogLevel enum and use logger
    const logLevel = level?.toLowerCase();
    const logMessage = typeof message === 'string' ? message : JSON.stringify(message);

    // Log using the logger abstraction
    switch (logLevel) {
      case 'info':
        logger.info(logMessage, data !== undefined ? { data } : {});
        break;
      case 'warn':
        logger.warn(logMessage, data !== undefined ? { data } : {});
        break;
      case 'error':
        logger.error(logMessage, data !== undefined ? { data } : {});
        break;
      case 'debug':
        logger.debug(logMessage, data !== undefined ? { data } : {});
        break;
      default:
        logger.info(logMessage, data !== undefined ? { data } : {});
    }

    this.setOutput(outputs, 'logged', true);
    return outputs;
  }
}
