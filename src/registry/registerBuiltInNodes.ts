import { NodeRegistry } from './NodeRegistry';
import { DataTypes } from '../types';

// Import all built-in nodes
import { MapNode, FilterNode, ReduceNode, ComposeNode } from '../nodes/functional/FunctionalNodes';
import { CalculatorNode, CounterNode, BankAccountNode } from '../nodes/oop/ObjectOrientedNodes';
import { DelayNode, HttpRequestNode, PromiseAllNode, PromiseRaceNode, RetryNode } from '../nodes/async/AsyncNodes';
import { ConditionalNode, MathNode, StringNode, TransformNode, LoggerNode } from '../nodes/utility/UtilityNodes';

/**
 * Register all built-in nodes with the registry
 */
export function registerBuiltInNodes(): void {
  const registry = NodeRegistry.getInstance();

  // Functional Programming Nodes
  registry.register(MapNode, {
    type: 'functional.map',
    displayName: 'Map',
    category: 'Functional',
    description: 'Applies a function to each element in an array',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['functional', 'array', 'transform'],
    icon: '🔄',
    color: '#4A90E2',
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
    ],
    examples: [
      'Map numbers to their squares: [1,2,3] → [1,4,9]',
      'Transform objects in array'
    ]
  });

  registry.register(FilterNode, {
    type: 'functional.filter',
    displayName: 'Filter',
    category: 'Functional',
    description: 'Filters array elements based on a predicate function',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['functional', 'array', 'filter'],
    icon: '🔍',
    color: '#4A90E2',
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
    ],
    examples: [
      'Filter even numbers: [1,2,3,4] → [2,4]',
      'Filter by property value'
    ]
  });

  registry.register(ReduceNode, {
    type: 'functional.reduce',
    displayName: 'Reduce',
    category: 'Functional',
    description: 'Reduces array to a single value using a reducer function',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['functional', 'array', 'aggregate'],
    icon: '📊',
    color: '#4A90E2',
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
    ],
    examples: [
      'Sum array: [1,2,3,4] → 10',
      'Concatenate strings'
    ]
  });

  registry.register(ComposeNode, {
    type: 'functional.compose',
    displayName: 'Compose',
    category: 'Functional',
    description: 'Composes multiple functions into a single function',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['functional', 'composition'],
    icon: '⚡',
    color: '#4A90E2',
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

  // Object-Oriented Programming Nodes
  registry.register(CalculatorNode, {
    type: 'oop.calculator',
    displayName: 'Calculator',
    category: 'Object-Oriented',
    description: 'Stateful calculator with operations',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['oop', 'stateful', 'math'],
    icon: '🧮',
    color: '#E94B3C',
    inputs: [
      {
        id: 'operation',
        name: 'Operation',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Operation: add, subtract, multiply, divide, clear, store, retrieve'
      },
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Value to use in operation'
      },
      {
        id: 'variable',
        name: 'Variable',
        dataType: DataTypes.STRING,
        required: false,
        description: 'Variable name for storing/retrieving values'
      }
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.NUMBER,
        description: 'Calculation result'
      },
      {
        id: 'state',
        name: 'State',
        dataType: DataTypes.OBJECT,
        description: 'Current calculator state'
      }
    ],
    examples: [
      'Add 10: result += 10',
      'Multiply by 2: result *= 2'
    ]
  });

  registry.register(CounterNode, {
    type: 'oop.counter',
    displayName: 'Counter',
    category: 'Object-Oriented',
    description: 'Encapsulated counter with methods',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['oop', 'stateful', 'counter'],
    icon: '🔢',
    color: '#E94B3C',
    inputs: [
      {
        id: 'action',
        name: 'Action',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Action: increment, decrement, reset, setStep'
      },
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Value for setStep action'
      }
    ],
    outputs: [
      {
        id: 'count',
        name: 'Count',
        dataType: DataTypes.NUMBER,
        description: 'Current count value'
      },
      {
        id: 'step',
        name: 'Step',
        dataType: DataTypes.NUMBER,
        description: 'Current step value'
      }
    ]
  });

  registry.register(BankAccountNode, {
    type: 'oop.bank-account',
    displayName: 'Bank Account',
    category: 'Object-Oriented',
    description: 'Bank account with transaction history',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['oop', 'stateful', 'transactions'],
    icon: '🏦',
    color: '#E94B3C',
    inputs: [
      {
        id: 'action',
        name: 'Action',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Action: deposit, withdraw, balance, history'
      },
      {
        id: 'amount',
        name: 'Amount',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Amount for deposit/withdraw'
      }
    ],
    outputs: [
      {
        id: 'balance',
        name: 'Balance',
        dataType: DataTypes.NUMBER,
        description: 'Current account balance'
      },
      {
        id: 'transaction',
        name: 'Transaction',
        dataType: DataTypes.OBJECT,
        description: 'Last transaction details'
      },
      {
        id: 'history',
        name: 'History',
        dataType: DataTypes.ARRAY,
        description: 'Transaction history'
      }
    ]
  });

  // Async Programming Nodes
  registry.register(DelayNode, {
    type: 'async.delay',
    displayName: 'Delay',
    category: 'Async',
    description: 'Delays execution for a specified amount of time',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['async', 'timing', 'delay'],
    icon: '⏱️',
    color: '#6C5CE7',
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
    ],
    examples: [
      'Delay 1 second: delay=1000',
      'Rate limiting'
    ]
  });

  registry.register(HttpRequestNode, {
    type: 'async.http-request',
    displayName: 'HTTP Request',
    category: 'Async',
    description: 'Makes asynchronous HTTP requests',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['async', 'http', 'api', 'network'],
    icon: '🌐',
    color: '#6C5CE7',
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
    ],
    examples: [
      'GET request to API',
      'POST data to server'
    ]
  });

  registry.register(PromiseAllNode, {
    type: 'async.promise-all',
    displayName: 'Promise All',
    category: 'Async',
    description: 'Executes multiple promises in parallel',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['async', 'parallel', 'promise'],
    icon: '⚡',
    color: '#6C5CE7',
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

  registry.register(PromiseRaceNode, {
    type: 'async.promise-race',
    displayName: 'Promise Race',
    category: 'Async',
    description: 'Returns the first completed promise',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['async', 'race', 'promise'],
    icon: '🏁',
    color: '#6C5CE7',
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

  registry.register(RetryNode, {
    type: 'async.retry',
    displayName: 'Retry',
    category: 'Async',
    description: 'Retries an operation with exponential backoff',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['async', 'retry', 'resilience'],
    icon: '🔄',
    color: '#6C5CE7',
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

  // Utility Nodes
  registry.register(ConditionalNode, {
    type: 'utility.conditional',
    displayName: 'Conditional',
    category: 'Utility',
    description: 'Executes different logic based on a condition',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'control-flow', 'conditional'],
    icon: '🔀',
    color: '#00B894',
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
    ],
    examples: [
      'If-else logic',
      'Ternary operation'
    ]
  });

  registry.register(MathNode, {
    type: 'utility.math',
    displayName: 'Math',
    category: 'Utility',
    description: 'Performs mathematical operations',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'math', 'calculation'],
    icon: '➗',
    color: '#00B894',
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
    ],
    examples: [
      'Add: 5 + 3 = 8',
      'Multiply: 4 * 2 = 8'
    ]
  });

  registry.register(StringNode, {
    type: 'utility.string',
    displayName: 'String',
    category: 'Utility',
    description: 'Performs string operations',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'string', 'text'],
    icon: '📝',
    color: '#00B894',
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

  registry.register(TransformNode, {
    type: 'utility.transform',
    displayName: 'Transform',
    category: 'Utility',
    description: 'Transforms data using a transformation function',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'transform', 'data'],
    icon: '🔧',
    color: '#00B894',
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
    ],
    examples: [
      'Format JSON',
      'Convert data structure'
    ]
  });

  registry.register(LoggerNode, {
    type: 'utility.logger',
    displayName: 'Logger',
    category: 'Utility',
    description: 'Logs data to console with different levels',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'logging', 'debug'],
    icon: '📋',
    color: '#00B894',
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
