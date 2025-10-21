import { BaseNode } from '../../core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from '../../types';

/**
 * Async Programming Paradigm Examples
 */

/**
 * Delay node - demonstrates async execution with delays
 */
export class DelayNode extends BaseNode {
  constructor() {
    super({
      name: 'Delay',
      description: 'Delays execution for a specified amount of time',
      inputs: [
        {
          id: 'value',
          name: 'Value',
          dataType: DataTypes.ANY,
          required: true,
          description: 'Value to pass through after delay'
        },
        {
          id: 'delay',
          name: 'Delay (ms)',
          dataType: DataTypes.NUMBER,
          required: true,
          description: 'Delay in milliseconds'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Value passed through after delay'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const value = this.getInput<any>(context, 'value');
    const delay = this.getInput<number>(context, 'delay');
    
    if (typeof delay !== 'number' || delay < 0) {
      throw new Error('Delay must be a non-negative number');
    }
    
    // Async delay using Promise
    await new Promise(resolve => setTimeout(resolve, delay));
    
    this.setOutput(outputs, 'result', value);
    return outputs;
  }
}

/**
 * HTTP Request node - demonstrates async HTTP operations
 */
export class HttpRequestNode extends BaseNode {
  constructor() {
    super({
      name: 'HTTP Request',
      description: 'Makes asynchronous HTTP requests',
      inputs: [
        {
          id: 'url',
          name: 'URL',
          dataType: DataTypes.STRING,
          required: true,
          description: 'URL to make request to'
        },
        {
          id: 'method',
          name: 'Method',
          dataType: DataTypes.STRING,
          required: false,
          description: 'HTTP method (GET, POST, PUT, DELETE)'
        },
        {
          id: 'headers',
          name: 'Headers',
          dataType: DataTypes.OBJECT,
          required: false,
          description: 'Request headers'
        },
        {
          id: 'body',
          name: 'Body',
          dataType: DataTypes.ANY,
          required: false,
          description: 'Request body'
        }
      ],
      outputs: [
        {
          id: 'response',
          name: 'Response',
          dataType: DataTypes.OBJECT,
          description: 'HTTP response'
        },
        {
          id: 'status',
          name: 'Status',
          dataType: DataTypes.NUMBER,
          description: 'HTTP status code'
        },
        {
          id: 'data',
          name: 'Data',
          dataType: DataTypes.ANY,
          description: 'Response data'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const url = this.getInput<string>(context, 'url');
    const method = this.getInput<string>(context, 'method') || 'GET';
    const headers = this.getInput<Record<string, string>>(context, 'headers') || {};
    const body = this.getInput<any>(context, 'body');
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    try {
      // Async HTTP request using fetch
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json();
      
      this.setOutput(outputs, 'response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      this.setOutput(outputs, 'status', response.status);
      this.setOutput(outputs, 'data', data);
      
    } catch (error) {
      throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return outputs;
  }
}

/**
 * Promise All node - demonstrates Promise.all for parallel async operations
 */
export class PromiseAllNode extends BaseNode {
  constructor() {
    super({
      name: 'Promise All',
      description: 'Executes multiple promises in parallel and waits for all to complete',
      inputs: [
        {
          id: 'promises',
          name: 'Promises',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Array of promises to execute'
        }
      ],
      outputs: [
        {
          id: 'results',
          name: 'Results',
          dataType: DataTypes.ARRAY,
          description: 'Results from all promises'
        },
        {
          id: 'success',
          name: 'Success',
          dataType: DataTypes.BOOLEAN,
          description: 'Whether all promises succeeded'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const promises = this.getInput<Promise<any>[]>(context, 'promises');
    
    if (!Array.isArray(promises)) {
      throw new Error('Input must be an array of promises');
    }
    
    try {
      // Execute all promises in parallel
      const results = await Promise.all(promises);
      this.setOutput(outputs, 'results', results);
      this.setOutput(outputs, 'success', true);
    } catch (error) {
      this.setOutput(outputs, 'results', []);
      this.setOutput(outputs, 'success', false);
    }
    
    return outputs;
  }
}

/**
 * Promise Race node - demonstrates Promise.race for async competition
 */
export class PromiseRaceNode extends BaseNode {
  constructor() {
    super({
      name: 'Promise Race',
      description: 'Executes multiple promises and returns the first one to complete',
      inputs: [
        {
          id: 'promises',
          name: 'Promises',
          dataType: DataTypes.ARRAY,
          required: true,
          description: 'Array of promises to race'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Result from the first completed promise'
        },
        {
          id: 'index',
          name: 'Index',
          dataType: DataTypes.NUMBER,
          description: 'Index of the winning promise'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const promises = this.getInput<Promise<any>[]>(context, 'promises');
    
    if (!Array.isArray(promises)) {
      throw new Error('Input must be an array of promises');
    }
    
    try {
      // Race promises and track which one wins
      const indexedPromises = promises.map((promise, index) => 
        promise.then(result => ({ result, index }))
      );
      
      const winner = await Promise.race(indexedPromises);
      
      this.setOutput(outputs, 'result', winner.result);
      this.setOutput(outputs, 'index', winner.index);
    } catch (error) {
      throw new Error(`Promise race failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return outputs;
  }
}

/**
 * Retry node - demonstrates async retry logic with exponential backoff
 */
export class RetryNode extends BaseNode {
  constructor() {
    super({
      name: 'Retry',
      description: 'Retries an operation with exponential backoff',
      inputs: [
        {
          id: 'operation',
          name: 'Operation',
          dataType: DataTypes.FUNCTION,
          required: true,
          description: 'Async operation to retry'
        },
        {
          id: 'maxRetries',
          name: 'Max Retries',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Maximum number of retries (default: 3)'
        },
        {
          id: 'baseDelay',
          name: 'Base Delay (ms)',
          dataType: DataTypes.NUMBER,
          required: false,
          description: 'Base delay in milliseconds (default: 1000)'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          dataType: DataTypes.ANY,
          description: 'Result from successful operation'
        },
        {
          id: 'attempts',
          name: 'Attempts',
          dataType: DataTypes.NUMBER,
          description: 'Number of attempts made'
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const operation = this.getInput<Function>(context, 'operation');
    const maxRetries = this.getInput<number>(context, 'maxRetries') || 3;
    const baseDelay = this.getInput<number>(context, 'baseDelay') || 1000;
    
    if (typeof operation !== 'function') {
      throw new Error('Operation must be a function');
    }
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.setOutput(outputs, 'result', result);
        this.setOutput(outputs, 'attempts', attempt + 1);
        return outputs;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
  }
}