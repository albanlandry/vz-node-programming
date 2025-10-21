import { BaseNode } from '../../core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from '../../types';

/**
 * Utility and Mixed Paradigm Examples
 */

/**
 * Conditional node - demonstrates control flow
 */
export class ConditionalNode extends BaseNode {
  constructor() {
    super({
      name: 'Conditional',
      description: 'Executes different logic based on a condition',
      inputs: [
        {
          id: 'condition',
          name: 'Condition',
          dataType: DataTypes.BOOLEAN,
          required: true,
          description: 'Boolean condition to evaluate'
        },
        {
          id: 'trueValue',
          name: 'True Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to return if condition is true'
        },
        {
          id: 'falseValue',
          name: 'False Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to return if condition is false'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Selected value based on condition'
        }
      ]
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
  constructor() {
    super({
      name: 'Math',
      description: 'Performs mathematical operations',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Math operation: add, subtract, multiply, divide, power, sqrt'
        },
        {
          id: 'a',
          name: 'A',
          dataType: DataTypes.NUMBER,
          required: true,
          description: 'First number'
        },
        {
          id: 'b',
          name: 'B',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Second number (not needed for sqrt)'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.NUMBER,
          description: 'Mathematical result'
        }
      ]
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
        if (typeof b !== 'number') throw new Error('B must be a number for addition');
        result = a + b;
        break;
      case 'subtract':
        if (typeof b !== 'number') throw new Error('B must be a number for subtraction');
        result = a - b;
        break;
      case 'multiply':
        if (typeof b !== 'number') throw new Error('B must be a number for multiplication');
        result = a * b;
        break;
      case 'divide':
        if (typeof b !== 'number') throw new Error('B must be a number for division');
        if (b === 0) throw new Error('Division by zero');
        result = a / b;
        break;
      case 'power':
        if (typeof b !== 'number') throw new Error('B must be a number for power');
        result = Math.pow(a, b);
        break;
      case 'sqrt':
        if (a < 0) throw new Error('Cannot take square root of negative number');
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
  constructor() {
    super({
      name: 'String',
      description: 'Performs string operations',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.STRING,
          required: true,
          description: 'String operation: concat, split, replace, toUpperCase, toLowerCase, length'
        },
        {
          id: 'input',
          name: 'Input',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Input string'
        },
        {
          id: 'parameter',
          name: 'Parameter',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Additional parameter for operation'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'String operation result'
        }
      ]
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
        if (typeof parameter !== 'string') throw new Error('Parameter must be a string for concat');
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
  constructor() {
    super({
      name: 'Transform',
      description: 'Transforms data using a transformation function',
      inputs: [
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Data to transform'
        },
        {
          id: 'transformer',
          name: 'Transformer',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Transformation function'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Transformed data'
        }
      ]
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
 * Logger node - demonstrates side effects and logging
 */
export class LoggerNode extends BaseNode {
  constructor() {
    super({
      name: 'Logger',
      description: 'Logs data to console with different levels',
      inputs: [
        {
          id: 'level',
          name: 'Level',
          dataType: DataTypes.STRING,
          required: true,
          description: 'Log level: info, warn, error, debug'
        },
        {
          id: 'message',
          name: 'Message',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Message to log'
        },
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Additional data to log'
        }
      ],
      outputs: [
        {
          id: 'logged',
          name: 'Logged',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether logging was successful'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const level = this.getInput<string>(context, 'level');
    const message = this.getInput<any>(context, 'message');
    const data = this.getInput<any>(context, 'data');
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    // Log to console based on level
    switch (level) {
      case 'info':
        console.info(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      case 'error':
        console.error(logEntry);
        break;
      case 'debug':
        console.debug(logEntry);
        break;
      default:
        console.log(logEntry);
    }
    
    this.setOutput(outputs, 'logged', true);
    return outputs;
  }
}