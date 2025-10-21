import { BaseNode } from '../../core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from '../../types';

/**
 * Functional Programming Paradigm Examples
 */

/**
 * Map node - applies a function to each element in an array (functional)
 */
export class MapNode extends BaseNode {
  constructor() {
    super({
      name: 'Map',
      description: 'Applies a function to each element in an array',
      inputs: [
        {
          id: 'array',
          name: 'Array',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Input array to map over'
        },
        {
          id: 'function',
          name: 'Function',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Function to apply to each element'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ARRAY,
          description: 'Mapped array result'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const array = this.getInput<any[]>(context, 'array');
    const fn = this.getInput<(x: any) => any>(context, 'function');
    
    if (!Array.isArray(array)) {
      throw new Error('Input must be an array');
    }
    
    if (typeof fn !== 'function') {
      throw new Error('Input must be a function');
    }
    
    // Apply the function to each element (functional approach)
    const result = array.map(fn);
    this.setOutput(outputs, 'result', result);
    
    return outputs;
  }
}

/**
 * Filter node - filters array elements based on a predicate (functional)
 */
export class FilterNode extends BaseNode {
  constructor() {
    super({
      name: 'Filter',
      description: 'Filters array elements based on a predicate function',
      inputs: [
        {
          id: 'array',
          name: 'Array',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Input array to filter'
        },
        {
          id: 'predicate',
          name: 'Predicate',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Predicate function to test each element'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ARRAY,
          description: 'Filtered array result'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const array = this.getInput<any[]>(context, 'array');
    const predicate = this.getInput<(x: any) => boolean>(context, 'predicate');
    
    if (!Array.isArray(array)) {
      throw new Error('Input must be an array');
    }
    
    if (typeof predicate !== 'function') {
      throw new Error('Input must be a function');
    }
    
    // Filter the array using the predicate (functional approach)
    const result = array.filter(predicate);
    this.setOutput(outputs, 'result', result);
    
    return outputs;
  }
}

/**
 * Reduce node - reduces array to a single value (functional)
 */
export class ReduceNode extends BaseNode {
  constructor() {
    super({
      name: 'Reduce',
      description: 'Reduces array to a single value using a reducer function',
      inputs: [
        {
          id: 'array',
          name: 'Array',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Input array to reduce'
        },
        {
          id: 'reducer',
          name: 'Reducer',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Reducer function'
        },
        {
          id: 'initial',
          name: 'Initial Value',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Initial value for reduction'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Reduced result'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const array = this.getInput<any[]>(context, 'array');
    const reducer = this.getInput<(acc: any, val: any) => any>(context, 'reducer');
    const initial = this.getInput<any>(context, 'initial');
    
    if (!Array.isArray(array)) {
      throw new Error('Input must be an array');
    }
    
    if (typeof reducer !== 'function') {
      throw new Error('Input must be a function');
    }
    
    // Reduce the array (functional approach)
    const result = array.reduce(reducer, initial);
    this.setOutput(outputs, 'result', result);
    
    return outputs;
  }
}

/**
 * Compose node - composes multiple functions (functional)
 */
export class ComposeNode extends BaseNode {
  constructor() {
    super({
      name: 'Compose',
      description: 'Composes multiple functions into a single function',
      inputs: [
        {
          id: 'functions',
          name: 'Functions',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Array of functions to compose'
        },
        {
          id: 'value',
          name: 'Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to apply composed functions to'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Result of composed function application'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const functions = this.getInput<Function[]>(context, 'functions');
    const value = this.getInput<any>(context, 'value');
    
    if (!Array.isArray(functions)) {
      throw new Error('Functions input must be an array');
    }
    
    if (!functions.every(fn => typeof fn === 'function')) {
      throw new Error('All elements in functions array must be functions');
    }
    
    // Compose functions (functional approach)
    const composed = functions.reduceRight((acc, fn) => fn(acc), value);
    this.setOutput(outputs, 'result', composed);
    
    return outputs;
  }
}