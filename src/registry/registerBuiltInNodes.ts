
// Import all built-in nodes
import { DelayNode, HttpRequestNode, PromiseAllNode, PromiseRaceNode, RetryNode } from '../nodes/async/AsyncNodes';
import { MapNode, FilterNode, ReduceNode, ComposeNode } from '../nodes/functional/FunctionalNodes';
import { CalculatorNode, CounterNode, BankAccountNode } from '../nodes/oop/ObjectOrientedNodes';
import { ConditionalNode, MathNode, StringNode, TransformNode, LoggerNode, ConstantNode, ArrayNode, ObjectNode } from '../nodes/utility/UtilityNodes';
import { ReadFileNode, WriteFileNode, ListDirectoryNode, FileExistsNode } from '../nodes/filesystem/FileSystemNodes';
import { JsonPathNode, DataValidationNode, JsonParseNode, JsonStringifyNode, ArrayFilterNode } from '../nodes/dataprocessing/DataProcessingNodes';
import { SqlQueryNode, DatabaseConnectionTestNode } from '../nodes/database/DatabaseNodes';
import { UserInputNode } from '../nodes/interactive/UserInputNode';
import { ImageDisplayNode } from '../nodes/interactive/ImageDisplayNode';
import { DataTypes, NodeConfig } from '../types';

import { NodeRegistry } from './NodeRegistry';

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
        description: 'Input array to map over',
      },
      {
        id: 'function',
        name: 'Function',
        dataType: DataTypes.FUNCTION,
        required: true,
        description: 'Function to apply to each element',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ARRAY,
        description: 'Mapped array result',
      },
    ],
    examples: [
      'Map numbers to their squares: [1,2,3] → [1,4,9]',
      'Transform objects in array',
    ],
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
        description: 'Input array to filter',
      },
      {
        id: 'predicate',
        name: 'Predicate',
        dataType: DataTypes.FUNCTION,
        required: true,
        description: 'Predicate function to test each element',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ARRAY,
        description: 'Filtered array result',
      },
    ],
    examples: [
      'Filter even numbers: [1,2,3,4] → [2,4]',
      'Filter by property value',
    ],
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
        description: 'Input array to reduce',
      },
      {
        id: 'reducer',
        name: 'Reducer',
        dataType: DataTypes.FUNCTION,
        required: true,
        description: 'Reducer function',
      },
      {
        id: 'initial',
        name: 'Initial Value',
        dataType: DataTypes.ANY,
        required: false,
        description: 'Initial value for reduction',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Reduced result',
      },
    ],
    examples: [
      'Sum array: [1,2,3,4] → 10',
      'Concatenate strings',
    ],
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
        description: 'Array of functions to compose',
      },
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.ANY,
        required: true,
        description: 'Value to apply composed functions to',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Result of composed function application',
      },
    ],
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
        description: 'Operation: add, subtract, multiply, divide, clear, store, retrieve',
      },
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Value to use in operation',
      },
      {
        id: 'variable',
        name: 'Variable',
        dataType: DataTypes.STRING,
        required: false,
        description: 'Variable name for storing/retrieving values',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.NUMBER,
        description: 'Calculation result',
      },
      {
        id: 'state',
        name: 'State',
        dataType: DataTypes.OBJECT,
        description: 'Current calculator state',
      },
    ],
    examples: [
      'Add 10: result += 10',
      'Multiply by 2: result *= 2',
    ],
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
        description: 'Action: increment, decrement, reset, setStep',
      },
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Value for setStep action',
      },
    ],
    outputs: [
      {
        id: 'count',
        name: 'Count',
        dataType: DataTypes.NUMBER,
        description: 'Current count value',
      },
      {
        id: 'step',
        name: 'Step',
        dataType: DataTypes.NUMBER,
        description: 'Current step value',
      },
    ],
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
        description: 'Action: deposit, withdraw, balance, history',
      },
      {
        id: 'amount',
        name: 'Amount',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Amount for deposit/withdraw',
      },
    ],
    outputs: [
      {
        id: 'balance',
        name: 'Balance',
        dataType: DataTypes.NUMBER,
        description: 'Current account balance',
      },
      {
        id: 'transaction',
        name: 'Transaction',
        dataType: DataTypes.OBJECT,
        description: 'Last transaction details',
      },
      {
        id: 'history',
        name: 'History',
        dataType: DataTypes.ARRAY,
        description: 'Transaction history',
      },
    ],
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
        description: 'Value to pass through after delay',
      },
      {
        id: 'delay',
        name: 'Delay (ms)',
        dataType: DataTypes.NUMBER,
        required: true,
        description: 'Delay in milliseconds',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Value passed through after delay',
      },
    ],
    examples: [
      'Delay 1 second: delay=1000',
      'Rate limiting',
    ],
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
        description: 'URL to make request to',
      },
      {
        id: 'method',
        name: 'Method',
        dataType: DataTypes.STRING,
        required: false,
        description: 'HTTP method (GET, POST, PUT, DELETE)',
      },
      {
        id: 'headers',
        name: 'Headers',
        dataType: DataTypes.OBJECT,
        required: false,
        description: 'Request headers',
      },
      {
        id: 'body',
        name: 'Body',
        dataType: DataTypes.ANY,
        required: false,
        description: 'Request body',
      },
    ],
    outputs: [
      {
        id: 'response',
        name: 'Response',
        dataType: DataTypes.OBJECT,
        description: 'HTTP response',
      },
      {
        id: 'status',
        name: 'Status',
        dataType: DataTypes.NUMBER,
        description: 'HTTP status code',
      },
      {
        id: 'data',
        name: 'Data',
        dataType: DataTypes.ANY,
        description: 'Response data',
      },
    ],
    examples: [
      'GET request to API',
      'POST data to server',
    ],
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
        description: 'Array of promises to execute',
      },
    ],
    outputs: [
      {
        id: 'results',
        name: 'Results',
        dataType: DataTypes.ARRAY,
        description: 'Results from all promises',
      },
      {
        id: 'success',
        name: 'Success',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether all promises succeeded',
      },
    ],
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
        description: 'Array of promises to race',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Result from the first completed promise',
      },
      {
        id: 'index',
        name: 'Index',
        dataType: DataTypes.NUMBER,
        description: 'Index of the winning promise',
      },
    ],
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
        description: 'Async operation to retry',
      },
      {
        id: 'maxRetries',
        name: 'Max Retries',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Maximum number of retries (default: 3)',
      },
      {
        id: 'baseDelay',
        name: 'Base Delay (ms)',
        dataType: DataTypes.NUMBER,
        required: false,
        description: 'Base delay in milliseconds (default: 1000)',
      },
    ],
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Result from successful operation',
      },
      {
        id: 'attempts',
        name: 'Attempts',
        dataType: DataTypes.NUMBER,
        description: 'Number of attempts made',
      },
    ],
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
    examples: [
      'If-else logic',
      'Ternary operation',
    ],
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
    examples: [
      'Add: 5 + 3 = 8',
      'Multiply: 4 * 2 = 8',
    ],
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
    examples: [
      'Format JSON',
      'Convert data structure',
    ],
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
      {
        id: 'formatted',
        name: 'Formatted',
        dataType: DataTypes.STRING,
        description: 'Formatted log text that was logged',
      },
    ],
  });

  registry.register(ConstantNode, {
    type: 'utility.constant',
    displayName: 'Constant',
    category: 'Utility',
    description: 'Defines a constant value from basic data types (string, number, boolean). Output-only node. Configure type and value in the node details panel.',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'constant', 'value', 'data'],
    icon: '📌',
    color: '#00B894',
    inputs: [], // Output-only node
    outputs: [
      {
        id: 'result',
        name: 'Result',
        dataType: DataTypes.ANY,
        description: 'Parsed constant value',
      },
    ],
    examples: [
      'String constant: type="string", value="Hello"',
      'Number constant: type="number", value="42"',
      'Boolean constant: type="boolean", value="true"',
    ],
  });

  registry.register(ArrayNode, {
    type: 'utility.array',
    displayName: 'Array',
    category: 'Utility',
    description: 'Defines an array of basic types from JSON string or individual elements',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'array', 'data', 'collection'],
    icon: '📦',
    color: '#00B894',
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
    examples: [
      'JSON array: \'[1,2,3,4,5]\'',
      'String array: \'["apple","banana","cherry"]\'',
      'Mixed array: \'[1,"two",true]\'',
    ],
  });

  registry.register(ObjectNode, {
    type: 'utility.object',
    displayName: 'Object',
    category: 'Utility',
    description: 'Defines a plain JSON object with properties and values',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['utility', 'object', 'json', 'data'],
    icon: '📋',
    color: '#00B894',
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
    examples: [
      'JSON object: \'{"name":"John","age":30}\'',
      'Add property: key="status", value="active"',
      'Nested object: \'{"user":{"name":"John"}}\'',
    ],
  });

  // File System Nodes
  registry.register(ReadFileNode, {
    type: 'filesystem.read-file',
    displayName: 'Read File',
    category: 'File System',
    description: 'Reads content from a file',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['filesystem', 'file', 'read', 'io'],
    icon: '📄',
    color: '#3498DB',
    inputs: [
      {
        id: 'path',
        name: 'File Path',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Path to the file to read',
      },
      {
        id: 'encoding',
        name: 'Encoding',
        dataType: DataTypes.STRING,
        required: false,
        description: 'File encoding (default: utf8)',
      },
    ],
    outputs: [
      {
        id: 'content',
        name: 'Content',
        dataType: DataTypes.STRING,
        description: 'File content',
      },
      {
        id: 'size',
        name: 'Size',
        dataType: DataTypes.NUMBER,
        description: 'File size in bytes',
      },
    ],
    examples: [
      'Read text file: path="data.txt"',
      'Read with encoding: path="data.txt", encoding="utf8"',
    ],
  });

  registry.register(WriteFileNode, {
    type: 'filesystem.write-file',
    displayName: 'Write File',
    category: 'File System',
    description: 'Writes content to a file',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['filesystem', 'file', 'write', 'io'],
    icon: '✍️',
    color: '#E74C3C',
    inputs: [
      {
        id: 'path',
        name: 'File Path',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Path to the file to write',
      },
      {
        id: 'content',
        name: 'Content',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Content to write',
      },
      {
        id: 'encoding',
        name: 'Encoding',
        dataType: DataTypes.STRING,
        required: false,
        description: 'File encoding (default: utf8)',
      },
      {
        id: 'createDir',
        name: 'Create Directory',
        dataType: DataTypes.BOOLEAN,
        required: false,
        description: 'Create parent directory if it does not exist',
      },
    ],
    outputs: [
      {
        id: 'success',
        name: 'Success',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the write was successful',
      },
      {
        id: 'bytesWritten',
        name: 'Bytes Written',
        dataType: DataTypes.NUMBER,
        description: 'Number of bytes written',
      },
    ],
  });

  registry.register(ListDirectoryNode, {
    type: 'filesystem.list-directory',
    displayName: 'List Directory',
    category: 'File System',
    description: 'Lists files and directories in a path',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['filesystem', 'directory', 'list', 'io'],
    icon: '📁',
    color: '#9B59B6',
    inputs: [
      {
        id: 'path',
        name: 'Directory Path',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Path to the directory',
      },
    ],
    outputs: [
      {
        id: 'files',
        name: 'Files',
        dataType: DataTypes.ARRAY,
        description: 'Array of file names',
      },
      {
        id: 'directories',
        name: 'Directories',
        dataType: DataTypes.ARRAY,
        description: 'Array of directory names',
      },
      {
        id: 'items',
        name: 'Items',
        dataType: DataTypes.ARRAY,
        description: 'Array of all items with metadata',
      },
    ],
  });

  registry.register(FileExistsNode, {
    type: 'filesystem.file-exists',
    displayName: 'File Exists',
    category: 'File System',
    description: 'Checks if a file or directory exists',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['filesystem', 'file', 'check', 'io'],
    icon: '🔍',
    color: '#F39C12',
    inputs: [
      {
        id: 'path',
        name: 'Path',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Path to check',
      },
    ],
    outputs: [
      {
        id: 'exists',
        name: 'Exists',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the path exists',
      },
      {
        id: 'isFile',
        name: 'Is File',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the path is a file',
      },
      {
        id: 'isDirectory',
        name: 'Is Directory',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the path is a directory',
      },
    ],
  });

  // Data Processing Nodes
  registry.register(JsonPathNode, {
    type: 'dataprocessing.json-path',
    displayName: 'JSON Path',
    category: 'Data Processing',
    description: 'Queries JSON data using path expressions',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['data', 'json', 'query', 'path'],
    icon: '🔎',
    color: '#1ABC9C',
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
    examples: [
      'Get user name: path="$.users[0].name"',
      'Get nested value: path="$.data.user.profile.email"',
    ],
  });

  registry.register(DataValidationNode, {
    type: 'dataprocessing.data-validation',
    displayName: 'Data Validation',
    category: 'Data Processing',
    description: 'Validates data against validation rules',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['data', 'validation', 'schema', 'check'],
    icon: '✅',
    color: '#27AE60',
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

  registry.register(JsonParseNode, {
    type: 'dataprocessing.json-parse',
    displayName: 'JSON Parse',
    category: 'Data Processing',
    description: 'Parses a JSON string to an object',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['data', 'json', 'parse', 'convert'],
    icon: '📦',
    color: '#E67E22',
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

  registry.register(JsonStringifyNode, {
    type: 'dataprocessing.json-stringify',
    displayName: 'JSON Stringify',
    category: 'Data Processing',
    description: 'Converts an object to a JSON string',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['data', 'json', 'stringify', 'convert'],
    icon: '📝',
    color: '#16A085',
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

  registry.register(ArrayFilterNode, {
    type: 'dataprocessing.array-filter',
    displayName: 'Array Filter',
    category: 'Data Processing',
    description: 'Filters array elements based on a condition',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['data', 'array', 'filter', 'process'],
    icon: '🔽',
    color: '#8E44AD',
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

  // Database Nodes
  registry.register(SqlQueryNode, {
    type: 'database.sql-query',
    displayName: 'SQL Query',
    category: 'Database',
    description: 'Executes a SQL query (requires database connection)',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['database', 'sql', 'query', 'db'],
    icon: '🗄️',
    color: '#34495E',
    inputs: [
      {
        id: 'connectionString',
        name: 'Connection String',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Database connection string',
      },
      {
        id: 'query',
        name: 'Query',
        dataType: DataTypes.STRING,
        required: true,
        description: 'SQL query to execute',
      },
      {
        id: 'parameters',
        name: 'Parameters',
        dataType: DataTypes.ARRAY,
        required: false,
        description: 'Query parameters',
      },
    ],
    outputs: [
      {
        id: 'results',
        name: 'Results',
        dataType: DataTypes.ARRAY,
        description: 'Query results',
      },
      {
        id: 'rowCount',
        name: 'Row Count',
        dataType: DataTypes.NUMBER,
        description: 'Number of rows affected/returned',
      },
      {
        id: 'success',
        name: 'Success',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the query succeeded',
      },
    ],
  });

  registry.register(DatabaseConnectionTestNode, {
    type: 'database.connection-test',
    displayName: 'Database Connection Test',
    category: 'Database',
    description: 'Tests a database connection',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['database', 'connection', 'test', 'db'],
    icon: '🔌',
    color: '#7F8C8D',
    inputs: [
      {
        id: 'connectionString',
        name: 'Connection String',
        dataType: DataTypes.STRING,
        required: true,
        description: 'Database connection string',
      },
    ],
    outputs: [
      {
        id: 'connected',
        name: 'Connected',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the connection succeeded',
      },
      {
        id: 'message',
        name: 'Message',
        dataType: DataTypes.STRING,
        description: 'Connection status message',
      },
    ],
  });

  // Interactive Nodes
  // Create wrapper classes that accept NodeConfig for registry compatibility
  const UserInputNodeWrapper = class extends UserInputNode {
    constructor(config?: Partial<NodeConfig> & { properties?: { prompt?: string; inputType?: string; formSchema?: any } }) {
      super({
        id: config?.id,
        prompt: config?.properties?.prompt || 'Please provide input:',
        inputType: (config?.properties?.inputType as 'form' | 'prompt' | 'confirm') || 'prompt',
        formSchema: config?.properties?.formSchema,
      });
    }
  };

  const ImageDisplayNodeWrapper = class extends ImageDisplayNode {
    constructor(config?: Partial<NodeConfig> & { properties?: { defaultFormat?: string; defaultAlt?: string } }) {
      super({
        id: config?.id,
        defaultFormat: (config?.properties?.defaultFormat as 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg') || 'png',
        defaultAlt: config?.properties?.defaultAlt || 'Image',
      });
    }
  };

  registry.register(UserInputNodeWrapper as any, {
    type: 'user-input',
    displayName: 'User Input',
    category: 'Interactive',
    description: 'Requests user input during execution',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['interactive', 'user-input', 'form', 'prompt'],
    icon: '📝',
    color: '#E67E22',
    inputs: [
      {
        id: 'content',
        name: 'Content',
        dataType: DataTypes.ANY,
        description: 'Content to display to the user (optional)',
      },
    ],
    outputs: [
      {
        id: 'value',
        name: 'Value',
        dataType: DataTypes.ANY,
        description: 'The user-provided input value',
      },
    ],
    examples: [
      'Simple prompt: prompt="Enter your name"',
      'Form input: inputType="form" with formSchema',
      'Confirmation: inputType="confirm"',
    ],
  });

  registry.register(ImageDisplayNodeWrapper as any, {
    type: 'image-display',
    displayName: 'Image Display',
    category: 'Interactive',
    description: 'Displays images during execution',
    version: '1.0.0',
    author: 'VZ Programming',
    tags: ['interactive', 'image', 'display', 'visualization'],
    icon: '🖼️',
    color: '#9B59B6',
    inputs: [
      {
        id: 'url',
        name: 'URL',
        dataType: DataTypes.STRING,
        description: 'Image URL',
      },
      {
        id: 'base64',
        name: 'Base64',
        dataType: DataTypes.STRING,
        description: 'Base64 encoded image data',
      },
      {
        id: 'format',
        name: 'Format',
        dataType: DataTypes.STRING,
        description: 'Image format (png, jpg, etc.)',
      },
      {
        id: 'alt',
        name: 'Alt Text',
        dataType: DataTypes.STRING,
        description: 'Alternative text for the image',
      },
      {
        id: 'width',
        name: 'Width',
        dataType: DataTypes.NUMBER,
        description: 'Image width in pixels',
      },
      {
        id: 'height',
        name: 'Height',
        dataType: DataTypes.NUMBER,
        description: 'Image height in pixels',
      },
    ],
    outputs: [
      {
        id: 'displayed',
        name: 'Displayed',
        dataType: DataTypes.BOOLEAN,
        description: 'Whether the image was displayed',
      },
    ],
    examples: [
      'Display image from URL: url="https://example.com/image.png"',
      'Display base64 image: base64="data:image/png;base64,..."',
    ],
  });
}
