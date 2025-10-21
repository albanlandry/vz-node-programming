# Node Registry & Discovery System

## Overview

The Node Registry is a central system for discovering, organizing, and instantiating nodes in the VZ Programming system. It provides a catalog of all available node types with rich metadata, search capabilities, and type-safe node creation.

## Features

- ✅ Central registry for all node types
- ✅ Rich metadata (categories, tags, icons, colors)
- ✅ Search and filter capabilities
- ✅ Auto-discovery and registration
- ✅ Type-safe node creation
- ✅ Version management
- ✅ Documentation export

## Quick Start

```typescript
import { NodeRegistry, registerBuiltInNodes, createNode } from './src/index';

// Register all built-in nodes
registerBuiltInNodes();

// Create a node by type
const httpNode = createNode('async.http-request');

// Get node metadata
const registry = NodeRegistry.getInstance();
const metadata = registry.getMetadata('async.http-request');
console.log(metadata);
```

## Core Concepts

### Node Metadata

Each registered node has comprehensive metadata:

```typescript
interface NodeMetadata {
  type: string;              // Unique identifier (e.g., 'async.http-request')
  displayName: string;       // Human-readable name
  category: string;          // Organization category
  description: string;       // Detailed description
  version: string;           // Semantic version
  author?: string;           // Creator information
  tags: string[];           // Search/filter tags
  icon?: string;            // Visual representation (emoji/icon)
  color?: string;           // UI color (hex)
  deprecated?: boolean;     // Deprecation status
  inputs: Port[];          // Input port definitions
  outputs: Port[];         // Output port definitions
  examples?: string[];     // Usage examples
  docsUrl?: string;        // Documentation link
}
```

### Categories

Built-in categories:
- **Functional** - Map, Filter, Reduce, Compose
- **Object-Oriented** - Calculator, Counter, BankAccount
- **Async** - Delay, HTTP, PromiseAll, PromiseRace, Retry
- **Utility** - Conditional, Math, String, Transform, Logger

## API Reference

### NodeRegistry

Singleton class managing all node registrations.

#### Get Instance

```typescript
const registry = NodeRegistry.getInstance();
```

#### Register a Node

```typescript
import { registerNode } from './src/index';
import { MyCustomNode } from './nodes/MyCustomNode';

registerNode(MyCustomNode, {
  type: 'custom.my-node',
  displayName: 'My Custom Node',
  category: 'Custom',
  description: 'Does something custom',
  version: '1.0.0',
  tags: ['custom', 'example'],
  icon: '🎯',
  color: '#FF6B6B',
  inputs: [...],
  outputs: [...]
});
```

#### Using the Decorator

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
  protected async executeInternal(context: ExecutionContext) {
    // Implementation
    return new Map();
  }
}
```

#### Create a Node

```typescript
// Create with default config
const node = createNode('async.http-request');

// Create with custom config
const node = createNode('utility.math', {
  id: 'custom-id',
  name: 'My Math Node',
  description: 'Custom instance'
});
```

#### Discovery & Search

```typescript
const registry = NodeRegistry.getInstance();

// Get all node types
const types = registry.getAllTypes();
// ['functional.map', 'async.http-request', ...]

// Get all nodes with metadata
const allNodes = registry.getAllNodes();

// Get by category
const asyncNodes = registry.getByCategory('Async');

// Get by tag
const mathNodes = registry.getByTag('math');

// Search
const results = registry.search('http');
// Returns nodes matching 'http' in name, description, or tags

// Get categories and tags
const categories = registry.getCategories();
const tags = registry.getTags();
```

#### Statistics

```typescript
const stats = registry.getStats();
// {
//   totalNodes: 17,
//   categories: 4,
//   tags: 31,
//   deprecated: 0
// }
```

#### Export Catalog

```typescript
// Export all metadata as JSON
const catalog = registry.exportMetadata();
// Save to file for documentation or API reference
```

## Graph Serialization

Export and import complete node graphs as JSON or YAML.

### GraphSerializer

```typescript
import { GraphSerializer, NodeExecutor } from './src/index';

const serializer = new GraphSerializer();
```

### Export Graph

```typescript
// From an executor
const definition = serializer.serializeExecutor(executor, {
  name: 'My Workflow',
  description: 'Does something cool',
  author: 'Your Name'
});

// To JSON
const json = serializer.toJSON(definition, true); // pretty print

// To YAML
const yaml = serializer.toYAML(definition);

// Save to file
import fs from 'fs';
fs.writeFileSync('workflow.json', json);
```

### Import Graph

```typescript
// From JSON string
const definition = serializer.fromJSON(jsonString);

// Recreate executor
const executor = serializer.deserializeToExecutor(definition);

// Now you can execute the imported workflow
const results = await executor.executeParallel(initialInputs);
```

### Graph Definition Format

```json
{
  "version": "1.0.0",
  "name": "My Workflow",
  "description": "Workflow description",
  "author": "Author Name",
  "created": "2025-10-21T10:00:00.000Z",
  "modified": "2025-10-21T10:00:00.000Z",
  "nodes": [
    {
      "id": "node-1",
      "type": "async.http-request",
      "name": "HTTP Request",
      "config": {},
      "position": { "x": 100, "y": 100 },
      "metadata": {
        "category": "Async",
        "icon": "🌐",
        "color": "#6C5CE7"
      }
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": { "nodeId": "node-1", "portId": "data" },
      "to": { "nodeId": "node-2", "portId": "input" }
    }
  ],
  "metadata": {}
}
```

## Examples

### Example 1: Browse Available Nodes

```typescript
registerBuiltInNodes();
const registry = NodeRegistry.getInstance();

// List all categories
console.log('Categories:', registry.getCategories());

// Browse each category
registry.getCategories().forEach(category => {
  const nodes = registry.getByCategory(category);
  console.log(`\n${category}:`);
  nodes.forEach(node => {
    console.log(`  ${node.icon} ${node.displayName} - ${node.description}`);
  });
});
```

### Example 2: Create Workflow Dynamically

```typescript
// Discover what nodes are available
const httpNode = createNode('async.http-request');
const transformNode = createNode('utility.transform');
const loggerNode = createNode('utility.logger');

// Build workflow
const executor = new NodeExecutor();
executor.addNode(httpNode);
executor.addNode(transformNode);
executor.addNode(loggerNode);

// Connect nodes
executor.addConnection({
  id: 'conn1',
  fromNode: httpNode.id,
  fromPort: 'data',
  toNode: transformNode.id,
  toPort: 'data'
});

// Execute
const results = await executor.executeParallel(inputs);
```

### Example 3: Save and Load Workflows

```typescript
// Create and save
const serializer = new GraphSerializer();
const definition = serializer.serializeExecutor(executor, {
  name: 'Data Processing Pipeline',
  author: 'Me'
});

fs.writeFileSync('workflow.json', serializer.toJSON(definition));

// Load later
const loaded = serializer.fromJSON(
  fs.readFileSync('workflow.json', 'utf-8')
);

const newExecutor = serializer.deserializeToExecutor(loaded);
```

### Example 4: Custom Node Registration

```typescript
import { BaseNode, registerNode } from './src/index';

class WeatherNode extends BaseNode {
  constructor(config?: Partial<NodeConfig>) {
    super({
      ...config,
      name: config?.name || 'Weather',
      inputs: [
        { id: 'city', name: 'City', dataType: DataTypes.STRING, required: true }
      ],
      outputs: [
        { id: 'temperature', name: 'Temperature', dataType: DataTypes.NUMBER },
        { id: 'conditions', name: 'Conditions', dataType: DataTypes.STRING }
      ]
    });
  }

  protected async executeInternal(context: ExecutionContext) {
    const city = this.getInput<string>(context, 'city');
    // Fetch weather data
    const outputs = new Map();
    outputs.set('temperature', 72);
    outputs.set('conditions', 'Sunny');
    return outputs;
  }
}

// Register it
registerNode(WeatherNode, {
  type: 'custom.weather',
  displayName: 'Weather API',
  category: 'Custom',
  description: 'Fetches weather data for a city',
  version: '1.0.0',
  author: 'Me',
  tags: ['weather', 'api', 'custom'],
  icon: '🌤️',
  color: '#87CEEB',
  inputs: [
    { id: 'city', name: 'City', dataType: DataTypes.STRING, required: true }
  ],
  outputs: [
    { id: 'temperature', name: 'Temperature', dataType: DataTypes.NUMBER },
    { id: 'conditions', name: 'Conditions', dataType: DataTypes.STRING }
  ],
  examples: [
    'Get weather for New York',
    'Check current conditions'
  ]
});

// Use it
const weatherNode = createNode('custom.weather');
```

## Best Practices

### 1. Consistent Naming

Use dot notation for type names:
- `category.specific-name`
- Examples: `async.http-request`, `utility.math`

### 2. Rich Metadata

Provide comprehensive metadata:
- Clear descriptions
- Relevant tags
- Useful examples
- Visual identifiers (icons, colors)

### 3. Versioning

Use semantic versioning:
- `1.0.0` - Initial release
- `1.1.0` - New features
- `2.0.0` - Breaking changes

### 4. Documentation

Include:
- Input/output descriptions
- Usage examples
- Links to detailed docs

### 5. Categories

Organize nodes logically:
- Group by functionality
- Keep categories focused
- Use standard names

## Advanced Topics

### Custom Node Discovery

Implement auto-discovery from file system:

```typescript
import fs from 'fs';
import path from 'path';

function discoverNodes(directory: string) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    if (file.endsWith('Node.ts')) {
      const nodePath = path.join(directory, file);
      const NodeClass = require(nodePath).default;
      
      // Auto-register if metadata is available
      if (NodeClass.metadata) {
        registerNode(NodeClass, NodeClass.metadata);
      }
    }
  });
}

discoverNodes('./custom-nodes');
```

### Plugin System

Load nodes from plugins:

```typescript
interface NodePlugin {
  name: string;
  version: string;
  nodes: {
    class: new () => INode;
    metadata: NodeMetadata;
  }[];
}

function loadPlugin(plugin: NodePlugin) {
  plugin.nodes.forEach(({ class: NodeClass, metadata }) => {
    registerNode(NodeClass, metadata);
  });
}
```

### Marketplace Integration

Export registry for marketplace:

```typescript
const catalog = registry.exportMetadata();

// Upload to marketplace API
await fetch('https://marketplace.api/nodes', {
  method: 'POST',
  body: catalog
});
```

## Troubleshooting

### Node Already Registered

```typescript
// Check before registering
if (!registry.isRegistered('custom.my-node')) {
  registerNode(MyNode, metadata);
}

// Or unregister first
registry.unregister('custom.my-node');
registerNode(MyNode, metadata);
```

### Node Type Not Found

```typescript
// Check if type exists
if (registry.isRegistered('async.http-request')) {
  const node = createNode('async.http-request');
}

// Or search for similar
const similar = registry.search('http');
```

### Serialization Errors

```typescript
// Validate before deserializing
try {
  const definition = serializer.fromJSON(json);
  const executor = serializer.deserializeToExecutor(definition);
} catch (error) {
  console.error('Invalid graph definition:', error);
}
```

## See Also

- [Quick Start Guide](../QUICKSTART.md)
- [Parallel Execution](../PARALLEL-EXECUTION.md)
- [API Reference](../README.md)
- [Examples](../examples/registry-example.ts)
