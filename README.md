# VZ Programming - Node-based Programming System

A powerful TypeScript/Node.js framework for building programs using a visual node-based approach with support for multiple programming paradigms.

## Features

- **Async Execution**: Full support for asynchronous operations with Promise-based execution
- **Parallel Execution**: Automatic parallel execution of independent nodes for optimal performance
- **Node Registry**: Central registry with discovery, search, and metadata management
- **Graph Serialization**: Export/import workflows as JSON or YAML
- **Error Handling**: Enterprise-grade error handling with retry, circuit breaker, fallback, and DLQ
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
npm run example:registry     # Node registry and serialization
npm run example:errors       # Error handling (retry, circuit breaker, fallback, DLQ)
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

### Node Registry & Discovery

Discover and create nodes dynamically using the registry:

```typescript
import { NodeRegistry, registerBuiltInNodes, createNode } from './src/index';

// Register all built-in nodes
registerBuiltInNodes();

const registry = NodeRegistry.getInstance();

// Browse by category
const asyncNodes = registry.getByCategory('Async');
asyncNodes.forEach(node => {
  console.log(`${node.icon} ${node.displayName} - ${node.description}`);
});

// Search for nodes
const results = registry.search('http');

// Create nodes by type
const httpNode = createNode('async.http-request');
const mathNode = createNode('utility.math');

// Get node metadata
const metadata = registry.getMetadata('async.http-request');
console.log(metadata.inputs, metadata.outputs);
```

**Features:**
- 17 built-in nodes organized in 4 categories
- Rich metadata (icons, colors, tags, examples)
- Search and filter capabilities
- Type-safe node creation
- Decorator-based registration (@RegisterNode)

See `docs/NODE-REGISTRY.md` for complete documentation!

### Graph Serialization

Export and import complete workflows:

```typescript
import { GraphSerializer } from './src/index';

const serializer = new GraphSerializer();

// Export workflow to JSON
const definition = serializer.serializeExecutor(executor, {
  name: 'My Workflow',
  description: 'Data processing pipeline',
  author: 'Your Name'
});

const json = serializer.toJSON(definition);
fs.writeFileSync('workflow.json', json);

// Import workflow
const loaded = serializer.fromJSON(
  fs.readFileSync('workflow.json', 'utf-8')
);

const newExecutor = serializer.deserializeToExecutor(loaded);
```

**Supports:**
- JSON and YAML formats
- Complete workflow preservation
- Metadata (name, author, timestamps)
- Node positions for visual editors
- Graph cloning and merging

See `examples/registry-example.ts` for detailed examples!

### Error Handling

Enterprise-grade error handling with multiple resilience patterns:

```typescript
import {
  ErrorHandlingNode,
  RetryPolicies,
  CircuitBreaker,
  DeadLetterQueue
} from './src/index';

// Create resilient node
const resilientNode = new ErrorHandlingNode(config, {
  // Retry with exponential backoff
  retryPolicy: RetryPolicies.Standard,
  
  // Circuit breaker protection
  circuitBreaker: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000
  }),
  
  // Fallback strategy
  fallbackFn: async (error, context) => {
    return await cache.get(context.executionId);
  },
  
  // Track failures
  enableDLQ: true
});

// Check dead letter queue
const dlq = DeadLetterQueue.getInstance();
const stats = dlq.getStats();
console.log(`Failures: ${stats.total}, Unprocessed: ${stats.unprocessed}`);
```

**Features:**
- **Retry Policies** - Exponential backoff with jitter (5 predefined policies)
- **Circuit Breaker** - Prevent cascading failures (CLOSED/OPEN/HALF_OPEN states)
- **Fallback Paths** - Alternative execution strategies
- **Error Boundaries** - Catch and contain errors from upstream nodes
- **Dead Letter Queue** - Track and analyze failures

**Predefined Retry Policies:**
```typescript
RetryPolicies.None        // No retry
RetryPolicies.Quick       // 3 attempts, short delays
RetryPolicies.Standard    // 3 attempts, balanced delays
RetryPolicies.Aggressive  // 5 attempts, longer delays
RetryPolicies.Network     // Optimized for network errors
```

**Circuit Breaker States:**
```
CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing) → CLOSED
```

**Error Boundary & Fallback Nodes:**
```typescript
import { ErrorBoundaryNode, FallbackNode } from './src/index';

// Catch errors and provide defaults
const boundary = new ErrorBoundaryNode();
const fallback = new FallbackNode();

// Chain: Unreliable → Boundary → Fallback → Safe Output
```

See `docs/ERROR-HANDLING.md` for complete documentation!

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
