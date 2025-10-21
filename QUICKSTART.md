# Quick Start Guide - VZ Programming

## Installation & Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run examples
npm run example
```

## Your First Node Program

### Step 1: Create a Simple Workflow

```typescript
import { NodeExecutor, MathNode, LoggerNode } from './src/index';

// Create executor
const executor = new NodeExecutor();

// Create nodes
const mathNode = new MathNode();
const loggerNode = new LoggerNode();

// Add nodes
executor.addNode(mathNode);
executor.addNode(loggerNode);

// Connect nodes: math result -> logger message
executor.addConnection({
  id: 'conn1',
  fromNode: mathNode.id,
  fromPort: 'result',
  toNode: loggerNode.id,
  toPort: 'message'
});

// Set up inputs
const initialInputs = new Map();
const mathInputs = new Map();
mathInputs.set('operation', 'add');
mathInputs.set('a', 10);
mathInputs.set('b', 20);
initialInputs.set(mathNode.id, mathInputs);

const loggerInputs = new Map();
loggerInputs.set('level', 'info');
initialInputs.set(loggerNode.id, loggerInputs);

// Execute
const results = await executor.execute(initialInputs);
console.log('Result:', results.get(mathNode.id)?.outputs?.get('result'));
```

## Available Node Types

### Functional Programming
- **MapNode**: Transform array elements
- **FilterNode**: Filter array by predicate
- **ReduceNode**: Reduce array to single value
- **ComposeNode**: Compose multiple functions

### Object-Oriented
- **CalculatorNode**: Stateful calculator
- **CounterNode**: Counter with encapsulation
- **BankAccountNode**: Transaction management

### Async Operations
- **DelayNode**: Delay execution
- **HttpRequestNode**: HTTP requests
- **PromiseAllNode**: Parallel promises
- **PromiseRaceNode**: Race promises
- **RetryNode**: Retry with backoff

### Utilities
- **ConditionalNode**: Conditional logic
- **MathNode**: Math operations
- **StringNode**: String manipulation
- **TransformNode**: Data transformation
- **LoggerNode**: Logging

## Key Concepts

### 1. Nodes
Nodes are the building blocks. Each node has:
- **Inputs**: Data ports that receive values
- **Outputs**: Data ports that produce values
- **Execute**: Async method that processes inputs → outputs

### 2. Connections
Connections link node outputs to node inputs:
```typescript
{
  id: 'unique-id',
  fromNode: sourceNode.id,
  fromPort: 'output-port-id',
  toNode: targetNode.id,
  toPort: 'input-port-id'
}
```

### 3. Execution
The NodeExecutor:
- Resolves dependencies automatically
- Executes nodes in the correct order
- Handles errors and propagates them
- Emits events for monitoring

### 4. Error Handling
```typescript
executor.on('execution_failed', (event) => {
  console.error('Node failed:', event.data);
});
```

## Creating Custom Nodes

```typescript
import { BaseNode } from './src/core/BaseNode';
import { ExecutionContext, PortId, DataTypes } from './src/types';

export class MyCustomNode extends BaseNode {
  constructor() {
    super({
      name: 'My Custom Node',
      inputs: [{
        id: 'input1',
        name: 'Input 1',
        dataType: DataTypes.STRING,
        required: true
      }],
      outputs: [{
        id: 'output1',
        name: 'Output 1',
        dataType: DataTypes.STRING
      }]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, any>> {
    const outputs = new Map();
    const input1 = this.getInput<string>(context, 'input1');
    
    // Your logic here
    const result = `Processed: ${input1}`;
    
    this.setOutput(outputs, 'output1', result);
    return outputs;
  }
}
```

## Next Steps

1. Explore the examples in `examples/usage-examples.ts`
2. Read the full documentation in `README.md`
3. Create your own custom nodes
4. Build complex workflows mixing paradigms

## Common Patterns

### Pipeline Pattern (Functional)
```typescript
// map → filter → reduce
const pipeline = [mapNode, filterNode, reduceNode];
// Connect them in sequence
```

### State Machine (OOP)
```typescript
// Use stateful nodes like CalculatorNode
// Operations maintain state across executions
```

### Async Workflow
```typescript
// Use DelayNode, HttpRequestNode
// Nodes execute asynchronously
// Dependencies resolved automatically
```

## Parallel Execution

Boost performance by running independent nodes in parallel:

```typescript
const executor = new NodeExecutor();

// Add multiple independent nodes
executor.addNode(httpNode1);
executor.addNode(httpNode2);
executor.addNode(httpNode3);

// Sequential: ~1200ms (one after another)
await executor.execute(initialInputs);

// Parallel: ~400ms (all at once - 3x faster!)
await executor.executeParallel(initialInputs);
```

### When to Use Parallel Execution

✅ **Use `executeParallel()` when:**
- You have multiple HTTP requests
- Nodes are independent (no data dependencies)
- You want maximum performance

✅ **Use `execute()` when:**
- You need predictable sequential execution
- Debugging complex workflows
- Resource constraints (limit concurrent operations)

### Performance Examples

```bash
# See real performance comparisons
npm run example:parallel
```

**Results:**
- HTTP Requests: 3x faster (1208ms → 411ms)
- Delay Operations: 3.15x faster (1573ms → 499ms)
- Math Operations: Instant parallelization

The system automatically:
- Groups nodes into execution levels
- Runs nodes at the same level in parallel
- Waits for dependencies before proceeding
- Detects circular dependencies

Happy coding! 🚀
