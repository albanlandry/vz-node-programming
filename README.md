# VZ Programming - Node-based Programming System

A powerful TypeScript/Node.js framework for building programs using a visual node-based approach with support for multiple programming paradigms.

## Features

- **Async Execution**: Full support for asynchronous operations with Promise-based execution
- **Parallel Execution**: Automatic parallel execution of independent nodes for optimal performance
- **Error Propagation**: Comprehensive error handling and propagation system
- **Modular Design**: Highly modular architecture with pluggable nodes
- **Mixed Paradigms**: Support for Functional, Object-Oriented, and Async programming paradigms
- **Type Safety**: Full TypeScript support with strict typing
- **Event System**: Built-in event system for monitoring execution
- **Dependency Resolution**: Automatic dependency resolution and execution ordering

## Installation

```bash
npm install
npm run build
```

## Quick Start

```typescript
import { NodeExecutor, MapNode, CalculatorNode } from './src/index';

// Create an executor
const executor = new NodeExecutor();

// Create nodes
const mapNode = new MapNode();
const calculator = new CalculatorNode();

// Add nodes to executor
executor.addNode(mapNode);
executor.addNode(calculator);

// Create connections
executor.addConnection({
  id: 'conn1',
  fromNode: mapNode.id,
  fromPort: 'result',
  toNode: calculator.id,
  toPort: 'value'
});

// Execute with initial inputs
const initialInputs = new Map();
const inputs = new Map();
inputs.set('array', [1, 2, 3, 4, 5]);
inputs.set('function', (x: number) => x * x);
initialInputs.set(mapNode.id, inputs);

const results = await executor.execute(initialInputs);
```

## Architecture

### Core Components

1. **BaseNode**: Abstract base class for all nodes
2. **NodeExecutor**: Manages execution of connected nodes
3. **Types**: Comprehensive type definitions for the system

### Node Types

#### Functional Programming Nodes
- **MapNode**: Applies a function to each element in an array
- **FilterNode**: Filters array elements based on a predicate
- **ReduceNode**: Reduces array to a single value
- **ComposeNode**: Composes multiple functions

#### Object-Oriented Programming Nodes
- **CalculatorNode**: Stateful calculator with operations
- **CounterNode**: Encapsulated counter with methods
- **BankAccountNode**: Complex state management example

#### Async Programming Nodes
- **DelayNode**: Delays execution for specified time
- **HttpRequestNode**: Makes HTTP requests
- **PromiseAllNode**: Executes multiple promises in parallel
- **PromiseRaceNode**: Returns first completed promise
- **RetryNode**: Retries operations with exponential backoff

#### Utility Nodes
- **ConditionalNode**: Conditional execution
- **MathNode**: Mathematical operations
- **StringNode**: String manipulation
- **TransformNode**: Data transformation
- **LoggerNode**: Logging with different levels

## Examples

Run the comprehensive examples:

```bash
npm run example              # All basic examples
npm run example:http         # HTTP request examples
npm run example:simple-http  # Simple HTTP example
npm run example:parallel     # Parallel execution examples
```

Or individually:
```bash
npm run build          # Build the project
npm run example:run    # Run examples (after build)
```

### Simple HTTP Request Example

```typescript
import { NodeExecutor, HttpRequestNode, TransformNode, LoggerNode } from './src/index';

const executor = new NodeExecutor();
const httpNode = new HttpRequestNode();
const transformNode = new TransformNode();
const loggerNode = new LoggerNode();

executor.addNode(httpNode);
executor.addNode(transformNode);
executor.addNode(loggerNode);

// Connect nodes: HTTP → Transform → Logger
executor.addConnection({
  id: 'http-to-transform',
  fromNode: httpNode.id,
  fromPort: 'data',
  toNode: transformNode.id,
  toPort: 'data'
});

executor.addConnection({
  id: 'transform-to-logger',
  fromNode: transformNode.id,
  fromPort: 'result',
  toNode: loggerNode.id,
  toPort: 'message'
});

// Configure and execute
const results = await executor.execute(initialInputs);
```

See `examples/simple-http.ts` for a complete working example.

### Parallel Execution

The system automatically detects independent nodes and executes them in parallel for optimal performance:

```typescript
import { NodeExecutor, HttpRequestNode } from './src/index';

const executor = new NodeExecutor();

// Create 3 independent HTTP nodes
const http1 = new HttpRequestNode();
const http2 = new HttpRequestNode();
const http3 = new HttpRequestNode();

executor.addNode(http1);
executor.addNode(http2);
executor.addNode(http3);

// Sequential execution (one after another)
await executor.execute(initialInputs);  // Takes ~1200ms

// Parallel execution (all at once)
await executor.executeParallel(initialInputs);  // Takes ~400ms (3x faster!)
```

**How it works:**
- Nodes are grouped into execution levels based on dependencies
- All nodes in the same level execute simultaneously
- Each level waits for the previous level to complete
- Circular dependencies are automatically detected

See `examples/parallel-execution.ts` for detailed examples showing 3x speedup!

## Creating Custom Nodes

Extend the BaseNode class to create custom nodes:

```typescript
import { BaseNode } from './src/core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from './src/types';

export class CustomNode extends BaseNode {
  constructor() {
    super({
      name: 'Custom Node',
      description: 'A custom node example',
      inputs: [
        {
          id: 'input1',
          name: 'Input 1',
          dataType: DataTypes.STRING,
          required: true
        }
      ],
      outputs: [
        {
          id: 'output1',
          name: 'Output 1',
          dataType: DataTypes.STRING
        }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map<PortId, any>();
    
    const input1 = this.getInput<string>(context, 'input1');
    
    // Your custom logic here
    const result = `Processed: ${input1}`;
    
    this.setOutput(outputs, 'output1', result);
    return outputs;
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run examples
npm run start
```

## License

MIT
