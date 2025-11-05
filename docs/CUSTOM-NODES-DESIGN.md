# Custom Node System - Design Documentation

## Architecture Overview

The Custom Node System is designed to allow users to create nodes dynamically through a web interface, without requiring TypeScript knowledge or direct code access.

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Template     │  │ Port Editor  │  │ Expression   │      │
│  │ Selector     │  │              │  │ Editor       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                      │
│  ┌────────────────────────────────────────────────────┐   │
│  │  /api/custom-nodes                                 │   │
│  │  - GET    (list)                                   │   │
│  │  - POST   (create)                                 │   │
│  │  - PUT    (update)                                 │   │
│  │  - DELETE (delete)                                 │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Custom Node  │  │ Template     │  │ Expression   │     │
│  │ Manager      │  │ Registry     │  │ Validator    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node Registry                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Registered Nodes (Built-in + Custom)              │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  JSON File Storage (storage/custom-nodes/)         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Template Pattern

The template system uses the Template Method pattern to provide structure while allowing flexibility:

```typescript
interface NodeTemplate {
  execute(expression, inputs, compiledFn): Promise<Result>
  validateExpression(expression): boolean
}
```

Each template implements the execution logic specific to its type, while sharing common validation and compilation logic.

### 2. Factory Pattern

Custom nodes are created using a factory pattern:

```typescript
CustomNodeManager.registerCustomNode(config, metadata)
  → Creates CustomNode instance
  → Registers with NodeRegistry
  → Stores configuration for factory creation
```

The registry uses a factory function to create node instances on demand.

### 3. Strategy Pattern

Expression validation uses the Strategy pattern:

- Different validation strategies for different templates
- Template-specific validation rules
- Extensible for new templates

### 4. Repository Pattern

Storage layer uses Repository pattern:

```typescript
CustomNodeStorage
  - save(node)
  - load(id)
  - loadAll()
  - delete(id)
  - findByType(type)
```

This abstraction allows easy migration from file-based to database storage.

## Data Flow

### Creating a Custom Node

```
User Input (UI)
    │
    ▼
Form Validation (Frontend)
    │
    ▼
POST /api/custom-nodes
    │
    ▼
Backend Validation
    ├── ExpressionValidator.validate()
    ├── CustomNode.validateConfig()
    └── Template validation
    │
    ▼
CustomNodeManager.registerCustomNode()
    ├── Create CustomNode instance
    ├── Register with NodeRegistry
    └── Store config for factory
    │
    ▼
CustomNodeStorage.save()
    ├── Save to JSON file
    └── Update index
    │
    ▼
Response (Node created)
```

### Executing a Custom Node

```
NodeExecutor.execute()
    │
    ▼
CustomNode.execute()
    │
    ▼
CustomNode.executeInternal()
    │
    ▼
Template.execute()
    ├── Compile expression (if needed)
    ├── Convert inputs to object
    ├── Execute compiled function
    └── Return results
    │
    ▼
Map results to output ports
    │
    ▼
Return ExecutionResult
```

## Security Architecture

### Defense in Depth

Multiple layers of security:

1. **Input Validation** (Frontend)
   - Form validation
   - Type checking
   - Required field validation

2. **Expression Validation** (Backend)
   - Pattern blocking
   - Syntax validation
   - Template-specific rules

3. **Scope Restriction** (Execution)
   - Restricted global access
   - No Node.js APIs
   - No file system access
   - No network access

4. **Template Isolation**
   - Each template has isolated execution
   - Template-specific validation
   - Type checking by template

### Security Model

```
┌─────────────────────────────────────┐
│     User Expression                 │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Expression Validator               │
│  - Pattern blocking                 │
│  - Syntax validation                │
│  - Template validation              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Compiled Function                  │
│  - Restricted scope                 │
│  - Safe globals only                │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Template Execution                 │
│  - Template-specific logic          │
│  - Type conversion                   │
└─────────────────────────────────────┘
```

## Template System Design

### Template Hierarchy

```
NodeTemplate (interface)
    │
    ├── TransformTemplate
    │   └── Executes: inputs → transformation → output
    │
    ├── FilterTemplate
    │   └── Executes: inputs → condition check → filtered output
    │
    ├── CalculatorTemplate
    │   └── Executes: numeric inputs → calculation → numeric output
    │
    ├── ConditionalTemplate
    │   └── Executes: inputs → condition → branch → output
    │
    └── StringOpTemplate
        └── Executes: string inputs → string operation → string output
```

### Template Execution Flow

```
Template.execute()
    │
    ├── Convert inputs Map → object
    │
    ├── Check for pre-compiled function
    │   ├── Yes → Use compiled function
    │   └── No → Compile expression
    │
    ├── Execute function with inputs
    │
    ├── Template-specific processing
    │   ├── Transform: Return result as-is
    │   ├── Filter: Check boolean, filter value
    │   ├── Calculator: Ensure numeric result
    │   ├── Conditional: Return condition result
    │   └── StringOp: Ensure string result
    │
    └── Return execution result
```

## Storage Design

### File Structure

```
storage/custom-nodes/
├── index.json              # Node index
│   {
│     "nodes": ["node-1", "node-2", ...],
│     "updatedAt": "2024-01-01T00:00:00.000Z"
│   }
│
└── node-*.json            # Individual node files
    {
      "id": "node-1",
      "type": "custom.my-node",
      "config": {...},
      "metadata": {...}
    }
```

### Index Strategy

The index file provides:
- Quick lookup of all node IDs
- Efficient listing without reading all files
- Easy deletion tracking

### Future Migration Path

The repository pattern allows easy migration:

```typescript
// Current: FileRepository
class FileCustomNodeStorage implements CustomNodeStorage { ... }

// Future: DatabaseRepository
class DatabaseCustomNodeStorage implements CustomNodeStorage { ... }
```

## API Design

### RESTful Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/custom-nodes` | List all custom nodes |
| POST | `/api/custom-nodes` | Create new custom node |
| GET | `/api/custom-nodes/:id` | Get specific node |
| PUT | `/api/custom-nodes/:id` | Update node |
| DELETE | `/api/custom-nodes/:id` | Delete node |
| GET | `/api/custom-nodes/templates` | Get available templates |
| POST | `/api/custom-nodes/validate-expression` | Validate expression |

### Request/Response Formats

#### Create Node (POST)

**Request**:
```json
{
  "type": "custom.my-node",
  "displayName": "My Node",
  "category": "Custom",
  "description": "Does something",
  "version": "1.0.0",
  "tags": ["custom"],
  "template": "transform",
  "expression": "inputs.value * 2",
  "inputs": [...],
  "outputs": [...]
}
```

**Response**:
```json
{
  "success": true,
  "node": {
    "id": "node-1234567890",
    "type": "custom.my-node",
    "metadata": {...}
  }
}
```

## Error Handling

### Error Types

1. **Validation Errors**
   - Invalid expression
   - Missing required fields
   - Invalid port configuration
   - Status: 400

2. **Not Found Errors**
   - Node not found
   - Template not found
   - Status: 404

3. **Server Errors**
   - Storage failure
   - Registration failure
   - Status: 500

### Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "details": ["Error detail 1", "Error detail 2"]
}
```

## Performance Considerations

### Optimization Strategies

1. **Expression Compilation**
   - Pre-compile expressions on node creation
   - Cache compiled functions
   - Reuse compiled functions across executions

2. **Template Registry**
   - Lazy initialization
   - Singleton pattern
   - Template caching

3. **Storage**
   - Index file for quick lookup
   - Lazy loading of node files
   - Batch operations where possible

### Performance Metrics

- Node creation: < 100ms
- Expression validation: < 50ms
- Node execution: < 10ms (excluding expression execution time)
- Storage save: < 50ms

## Extensibility

### Adding New Templates

1. Create new template class extending `NodeTemplate`
2. Implement `execute()` and `validateExpression()` methods
3. Register in `TemplateRegistry.initialize()`
4. Add to API template list

### Adding New Validation Rules

1. Add pattern to `DANGEROUS_PATTERNS` in `ExpressionValidator`
2. Add template-specific rules in `validateForTemplate()`
3. Update validation logic as needed

### Migrating to Database

1. Create database repository implementing `CustomNodeStorage` interface
2. Update `CustomNodeStorage` to use database
3. Migrate existing JSON files to database
4. Update index to use database queries

## Conclusion

The Custom Node System is designed with:
- **Security**: Multiple layers of validation and restriction
- **Flexibility**: Template system allows various node types
- **Extensibility**: Easy to add new templates and features
- **Performance**: Optimized for common use cases
- **Maintainability**: Clear separation of concerns

The design supports Phase 1 requirements while providing a foundation for Phase 2 enhancements.

