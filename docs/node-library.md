# Node Library

## Overview

The Node library of VZ Programming provides the `BaseNode` abstract class that serves as the foundation for all nodes. This document provides a detailed explanation of how nodes work, available methods and properties, and how to create custom nodes.

## BaseNode Class

`BaseNode` is an abstract base class that all nodes must extend. This class provides common functionality for node execution and implements the `INode` interface.

### Class Definition

```typescript
export abstract class BaseNode implements INode {
  public readonly id: NodeId;
  public readonly name: string;
  public readonly description?: string;
  public readonly inputs: Port[];
  public readonly outputs: Port[];
  protected properties: Map<string, unknown> = new Map();
  private lifecycleHooks?: NodeLifecycleHooks;
  private initialized: boolean = false;
  private resources: Set<{ cleanup: () => Promise<void> | void }> = new Set();
}
```

## Properties

### Public Properties

#### `id: NodeId`
- **Type**: `string`
- **Description**: Unique identifier for the node
- **Characteristics**: Read-only, automatically generated or provided in constructor

#### `name: string`
- **Type**: `string`
- **Description**: Name of the node
- **Characteristics**: Read-only, set in constructor

#### `description?: string`
- **Type**: `string | undefined`
- **Description**: Description of the node
- **Characteristics**: Optional property

#### `inputs: Port[]`
- **Type**: `Port[]`
- **Description**: Array of input ports for the node
- **Characteristics**: Read-only, set in constructor

#### `outputs: Port[]`
- **Type**: `Port[]`
- **Description**: Array of output ports for the node
- **Characteristics**: Read-only, set in constructor

### Protected Properties

#### `properties: Map<string, unknown>`
- **Type**: `Map<string, unknown>`
- **Description**: Storage for node properties
- **Usage**: Accessed via `setProperty()` and `getProperty()` methods

### Private Properties

#### `lifecycleHooks?: NodeLifecycleHooks`
- **Type**: `NodeLifecycleHooks | undefined`
- **Description**: Node lifecycle hooks
- **Characteristics**: Optional property, set in constructor

#### `initialized: boolean`
- **Type**: `boolean`
- **Description**: Whether the node is initialized
- **Characteristics**: Internal state management

#### `resources: Set<{ cleanup: () => Promise<void> | void }>`
- **Type**: `Set<{ cleanup: () => Promise<void> | void }>`
- **Description**: Set of resources that need cleanup
- **Usage**: Managed via `registerResource()` and `unregisterResource()` methods

## Methods

### Public Methods

#### `execute(context: ExecutionContext): Promise<ExecutionResult>`

The main method for executing a node.

**Parameters:**
- `context: ExecutionContext` - Execution context

**Returns:**
- `Promise<ExecutionResult>` - Execution result

**Execution Flow:**
1. Node initialization (executed once)
2. Cancellation signal check
3. `onBeforeExecute` hook execution
4. Input validation
5. `executeInternal()` execution (with timeout support)
6. Output validation
7. `onAfterExecute` hook execution
8. Return result

**Error Handling:**
- On error, `onError` hook is executed
- Error is wrapped in `NodeError` and returned

**Example:**
```typescript
const context: ExecutionContext = {
  executionId: 'exec-123',
  inputs: new Map([['input1', 'value1']]),
  outputs: new Map(),
  metadata: new Map()
};

const result = await node.execute(context);
if (result.success) {
  console.log('Outputs:', result.outputs);
} else {
  console.error('Error:', result.error);
}
```

#### `validate(): boolean`

Validates that the node configuration is correct.

**Returns:**
- `boolean` - Validation success status

**Validation Items:**
- Check for duplicate port IDs
- Check required fields for each port (id, name, dataType)

**Example:**
```typescript
if (node.validate()) {
  console.log('Node is valid');
} else {
  console.error('Node validation failed');
}
```

#### `cleanup(): Promise<void>`

Cleans up all resources for the node.

**Returns:**
- `Promise<void>`

**Behavior:**
- Calls `cleanup()` method for all registered resources
- Executes `onCleanup` hook

**Example:**
```typescript
await node.cleanup();
```

#### `isInitialized(): boolean`

Checks if the node is initialized.

**Returns:**
- `boolean` - Initialization status

#### `setProperty(key: string, value: unknown): void`

Sets a node property.

**Parameters:**
- `key: string` - Property key
- `value: unknown` - Property value

**Example:**
```typescript
node.setProperty('config', { timeout: 5000 });
```

#### `getProperty<T = unknown>(key: string): T | undefined`

Gets a node property.

**Parameters:**
- `key: string` - Property key

**Returns:**
- `T | undefined` - Property value or undefined

**Example:**
```typescript
const config = node.getProperty<{ timeout: number }>('config');
```

#### `getProperties(): Record<string, unknown>`

Gets all node properties.

**Returns:**
- `Record<string, unknown>` - Object containing all properties

### Protected Methods

#### `executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>>`

**Abstract method** - Must be implemented by subclasses.

Executes the actual logic of the node.

**Parameters:**
- `context: ExecutionContext` - Execution context

**Returns:**
- `Promise<Map<PortId, unknown>>` - Map of output port IDs and values

**Example:**
```typescript
protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
  const outputs = new Map<PortId, unknown>();
  const inputValue = this.getInput<string>(context, 'input1');
  const result = inputValue.toUpperCase();
  outputs.set('output1', result);
  return outputs;
}
```

#### `validateInputs(inputs: Map<PortId, unknown>): void`

Validates input values against port definitions.

**Parameters:**
- `inputs: Map<PortId, unknown>` - Map of input values

**Validation Items:**
- Check for required input ports
- Validate data types (if validator is available)

**Errors:**
- Throws `NodeError` if required input is missing
- Throws `NodeError` if type doesn't match

#### `validateOutputs(outputs: Map<PortId, unknown>): void`

Validates output values against port definitions.

**Parameters:**
- `outputs: Map<PortId, unknown>` - Map of output values

**Validation Items:**
- Validate data types (if validator is available)

#### `getInput<T>(context: ExecutionContext, portId: PortId): T | undefined`

Gets an input value in a type-safe manner.

**Parameters:**
- `context: ExecutionContext` - Execution context
- `portId: PortId` - Port ID

**Returns:**
- `T | undefined` - Input value or undefined

**Example:**
```typescript
const value = this.getInput<string>(context, 'message');
if (value) {
  console.log(value.toUpperCase());
}
```

#### `setOutput(outputs: Map<PortId, unknown>, portId: PortId, value: unknown): void`

Sets an output value.

**Parameters:**
- `outputs: Map<PortId, unknown>` - Output map
- `portId: PortId` - Port ID
- `value: unknown` - Output value

**Example:**
```typescript
const outputs = new Map<PortId, unknown>();
this.setOutput(outputs, 'result', 42);
```

#### `createPort(id: PortId, name: string, dataType: DataType, required?: boolean, description?: string): Port`

Helper method to create a port.

**Parameters:**
- `id: PortId` - Port ID
- `name: string` - Port name
- `dataType: DataType` - Data type
- `required?: boolean` - Required flag (default: false)
- `description?: string` - Description

**Returns:**
- `Port` - Created port object

**Example:**
```typescript
const inputPort = this.createPort(
  'value',
  'Value',
  DataTypes.NUMBER,
  true,
  'Input value to process'
);
```

#### `registerResource(resource: { cleanup: () => Promise<void> | void }): void`

Registers a resource that needs cleanup.

**Parameters:**
- `resource: { cleanup: () => Promise<void> | void }` - Resource object

**Example:**
```typescript
const subscription = eventEmitter.subscribe(() => {});
this.registerResource({
  cleanup: async () => {
    subscription.unsubscribe();
  }
});
```

#### `unregisterResource(resource: { cleanup: () => Promise<void> | void }): void`

Unregisters a resource.

**Parameters:**
- `resource: { cleanup: () => Promise<void> | void }` - Resource object

## Lifecycle Hooks

Nodes support the following lifecycle hooks:

### `onInitialize?: () => Promise<void> | void`

Called once when the node is first executed. Used for resource initialization.

**Example:**
```typescript
const node = new MyNode({
  name: 'My Node',
  lifecycleHooks: {
    onInitialize: async () => {
      await initializeDatabase();
    }
  }
});
```

### `onBeforeExecute?: (context: ExecutionContext) => Promise<void> | void`

Called before each execution. Used for pre-execution validation or setup.

**Example:**
```typescript
onBeforeExecute: async (context) => {
  if (!context.inputs.has('requiredInput')) {
    throw new Error('Required input missing');
  }
}
```

### `onAfterExecute?: (context: ExecutionContext, result: ExecutionResult) => Promise<void> | void`

Called after successful execution. Used for logging or post-processing.

**Example:**
```typescript
onAfterExecute: async (context, result) => {
  logger.info(`Node executed in ${result.executionTime}ms`);
}
```

### `onError?: (context: ExecutionContext, error: NodeError) => Promise<void> | void`

Called when an error occurs. Used for error handling or recovery.

**Example:**
```typescript
onError: async (context, error) => {
  await sendErrorReport(error);
}
```

### `onCleanup?: () => Promise<void> | void`

Called when the node is being cleaned up. Used for resource release.

**Example:**
```typescript
onCleanup: async () => {
  await closeDatabaseConnection();
}
```

## Creating Custom Nodes

### 1. Basic Custom Node

The simplest way to create a custom node:

```typescript
import { BaseNode, DataTypes, ExecutionContext, PortId } from './src/index';

export class MyCustomNode extends BaseNode {
  constructor() {
    super({
      name: 'My Custom Node',
      description: 'A simple custom node',
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

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    
    // Get input value
    const input1 = this.getInput<string>(context, 'input1');
    
    // Execute logic
    const result = input1 ? input1.toUpperCase() : '';
    
    // Set output value
    outputs.set('output1', result);
    
    return outputs;
  }
}
```

### 2. Node with Properties

Using node properties to store and use configuration:

```typescript
export class ConfigurableNode extends BaseNode {
  constructor(config?: { multiplier?: number }) {
    super({
      name: 'Configurable Node',
      inputs: [
        { id: 'value', name: 'Value', dataType: DataTypes.NUMBER, required: true }
      ],
      outputs: [
        { id: 'result', name: 'Result', dataType: DataTypes.NUMBER }
      ]
    });
    
    // Set property
    this.setProperty('multiplier', config?.multiplier ?? 2);
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    const value = this.getInput<number>(context, 'value');
    const multiplier = this.getProperty<number>('multiplier') ?? 2;
    
    outputs.set('result', (value ?? 0) * multiplier);
    return outputs;
  }
}
```

### 3. Node with Lifecycle Hooks

Node requiring resource management:

```typescript
export class ResourceNode extends BaseNode {
  private connection?: DatabaseConnection;

  constructor() {
    super({
      name: 'Resource Node',
      inputs: [],
      outputs: [
        { id: 'status', name: 'Status', dataType: DataTypes.STRING }
      ],
      lifecycleHooks: {
        onInitialize: async () => {
          this.connection = await connectToDatabase();
        },
        onCleanup: async () => {
          if (this.connection) {
            await this.connection.close();
          }
        }
      }
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    const status = this.connection ? 'connected' : 'disconnected';
    outputs.set('status', status);
    return outputs;
  }
}
```

### 4. Node with Error Handling

Node including error handling:

```typescript
export class SafeNode extends BaseNode {
  constructor() {
    super({
      name: 'Safe Node',
      inputs: [
        { id: 'data', name: 'Data', dataType: DataTypes.ANY, required: true }
      ],
      outputs: [
        { id: 'result', name: 'Result', dataType: DataTypes.ANY },
        { id: 'error', name: 'Error', dataType: DataTypes.STRING }
      ],
      lifecycleHooks: {
        onError: async (context, error) => {
          // Pass error to output port
          const outputs = new Map<PortId, unknown>();
          outputs.set('error', error.message);
          context.outputs = outputs;
        }
      }
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    
    try {
      const data = this.getInput(context, 'data');
      // Perform risky operation
      const result = processData(data);
      outputs.set('result', result);
    } catch (error) {
      // Pass error to output
      outputs.set('error', error instanceof Error ? error.message : String(error));
    }
    
    return outputs;
  }
}
```

### 5. Node with Async Operations

Node performing asynchronous operations:

```typescript
export class AsyncNode extends BaseNode {
  constructor() {
    super({
      name: 'Async Node',
      inputs: [
        { id: 'url', name: 'URL', dataType: DataTypes.STRING, required: true }
      ],
      outputs: [
        { id: 'response', name: 'Response', dataType: DataTypes.OBJECT },
        { id: 'status', name: 'Status', dataType: DataTypes.NUMBER }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    const url = this.getInput<string>(context, 'url');
    
    if (!url) {
      throw new NodeError('URL is required', this.id);
    }
    
    // Async HTTP request
    const response = await fetch(url);
    const data = await response.json();
    
    outputs.set('response', data);
    outputs.set('status', response.status);
    
    return outputs;
  }
}
```

## Registering Nodes

Register custom nodes with NodeRegistry to enable dynamic creation:

```typescript
import { registerNode, NodeRegistry } from './src/index';

// Register node
registerNode(MyCustomNode, {
  type: 'custom.my-node',
  displayName: 'My Custom Node',
  category: 'Custom',
  description: 'A custom node example',
  version: '1.0.0',
  tags: ['custom', 'example'],
  icon: '🎯',
  color: '#FF6B6B',
  inputs: [
    { id: 'input1', name: 'Input 1', dataType: DataTypes.STRING, required: true }
  ],
  outputs: [
    { id: 'output1', name: 'Output 1', dataType: DataTypes.STRING }
  ]
});

// Use registered node
const node = createNode('custom.my-node');
```

## Auto-Registration with Decorator

Use the `@RegisterNode` decorator for automatic registration:

```typescript
import { RegisterNode, BaseNode } from './src/index';

@RegisterNode({
  type: 'custom.decorated-node',
  displayName: 'Decorated Node',
  category: 'Custom',
  description: 'Auto-registered node',
  version: '1.0.0',
  tags: ['custom'],
  inputs: [],
  outputs: []
})
export class DecoratedNode extends BaseNode {
  protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
    return new Map();
  }
}
```

## Creating Custom Nodes with Templates

You can create custom nodes via web UI using template-based system:

1. **Transform Template**: Transform input values to output values
2. **Filter Template**: Filter based on conditions
3. **Calculator Template**: Perform mathematical operations
4. **Conditional Template**: Conditional logic
5. **StringOp Template**: String operations

For more details, see the [Custom Nodes Implementation](./CUSTOM-NODES-IMPLEMENTATION.html) document.

## Best Practices

### 1. Input Validation

Always validate input values:

```typescript
protected async executeInternal(context: ExecutionContext): Promise<Map<PortId, unknown>> {
  const value = this.getInput<number>(context, 'value');
  if (value === undefined || value < 0) {
    throw new NodeError('Value must be a positive number', this.id, 'value');
  }
  // ...
}
```

### 2. Error Handling

Provide clear error messages:

```typescript
try {
  // Perform operation
} catch (error) {
  throw new NodeError(
    `Failed to process: ${error instanceof Error ? error.message : String(error)}`,
    this.id
  );
}
```

### 3. Resource Cleanup

Register resources for automatic cleanup:

```typescript
constructor() {
  // ...
  const resource = { cleanup: async () => { /* cleanup logic */ } };
  this.registerResource(resource);
}
```

### 4. Type Safety

Use generics for type safety:

```typescript
const value = this.getInput<string>(context, 'input1');
// value is of type string | undefined
```

### 5. Documentation

Provide clear descriptions for nodes:

```typescript
super({
  name: 'Clear Name',
  description: 'What this node does and when to use it',
  // ...
});
```

## Related Documentation

- [Node Registry](./NODE-REGISTRY.html) - Node registration and discovery system
- [Custom Nodes Implementation](./CUSTOM-NODES-IMPLEMENTATION.html) - Custom node implementation guide
- [Error Handling](./ERROR-HANDLING.html) - Error handling guide
- [Graph Editor](./GRAPH-EDITOR.html) - Graph editor usage guide
