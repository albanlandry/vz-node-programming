# Custom Node Creation System - Proposal

## Overview

A system that allows users to dynamically create and register new nodes from the web frontend.

## Goals

1. **Node Creation via Web UI**: Create nodes with minimal or no code writing
2. **Safe Code Execution**: Security through sandboxing and validation
3. **Dynamic Registration**: Add nodes at runtime and use them immediately
4. **Persistent Storage**: Save created nodes to database/file system

## Architecture Options

### Option 1: Template-Based Node Creation (Recommended) ⭐

**Concept**: Create nodes using predefined node templates with configuration only

**Structure**:
```
CustomNode (extends BaseNode)
├── Template Type (Transform, Filter, Calculator, etc.)
├── Configuration (function/expression, input/output mapping)
└── Validation Rules
```

**Advantages**:
- ✅ High security (no code execution)
- ✅ Simple implementation
- ✅ User-friendly (easy creation via UI)
- ✅ Type safety

**Disadvantages**:
- ❌ Limited flexibility
- ❌ Difficult to implement complex logic

**Implementation Example**:
```typescript
// Configuration entered by user on web
{
  type: 'custom.math-power',
  template: 'transform',
  expression: 'Math.pow(input.value, input.exponent)',
  inputs: [
    { id: 'value', name: 'Value', type: 'number', required: true },
    { id: 'exponent', name: 'Exponent', type: 'number', required: true }
  ],
  outputs: [
    { id: 'result', name: 'Result', type: 'number' }
  ]
}
```

---

### Option 2: Limited Script Execution (VM2/isolate-vm)

**Concept**: Execute user-provided code in a sandboxed environment

**Structure**:
```
CustomNodeExecutor
├── Code Validator (AST analysis)
├── Sandbox (VM2/isolate-vm)
├── Security Policies
└── Runtime Validation
```

**Advantages**:
- ✅ High flexibility
- ✅ Full JavaScript/TypeScript support
- ✅ Can implement complex logic

**Disadvantages**:
- ❌ Security risks (difficult to fully sandbox)
- ❌ Complex implementation
- ❌ Performance overhead

**Security Considerations**:
- Block file system access
- Limit network access
- Prevent infinite loops
- Memory limits
- Execution time limits

---

### Option 3: Hybrid Approach (Template + Script) ⭐⭐

**Concept**: Simple nodes via templates, complex nodes via scripts

**Structure**:
```
Node Creation System
├── Template Engine (Option 1)
├── Script Engine (Option 2)
└── Router (decides which engine to use)
```

**Advantages**:
- ✅ Balance between flexibility and security
- ✅ Can choose based on user level
- ✅ Gradual complexity

**Disadvantages**:
- ❌ Need to implement both systems
- ❌ Increased complexity

---

## Proposed Implementation Strategy

### Phase 1: Template-Based System (MVP)

**Features**:
1. Predefined node templates
   - Transform (input → output transformation)
   - Filter (conditional filtering)
   - Calculator (mathematical operations)
   - Conditional (branching)
   - String Operation (string processing)

2. Web UI
   - Node type selection
   - Input/output port definition
   - Expression/function input (limited JavaScript)
   - Real-time validation and preview

3. API Endpoints
   - `POST /api/nodes/custom` - Create node
   - `GET /api/nodes/custom` - List custom nodes
   - `DELETE /api/nodes/custom/:id` - Delete node
   - `PUT /api/nodes/custom/:id` - Update node

4. Storage
   - JSON file-based (initial)
   - Can migrate to database later

### Phase 2: Script Execution System (Advanced)

**Features**:
1. VM2-based sandboxing
2. AST analysis and validation
3. Security policy application
4. Code editor integration (Monaco Editor)

---

## Implementation Details: Phase 1 (Template-Based)

### 1. Backend Structure

```
src/
├── custom-nodes/
│   ├── CustomNode.ts          # Custom node extending BaseNode
│   ├── NodeTemplate.ts        # Template definitions
│   ├── TemplateEngine.ts     # Template execution engine
│   ├── ExpressionValidator.ts # Expression validation
│   └── CustomNodeStorage.ts   # Node storage/loading
├── api/
│   └── custom-nodes/
│       ├── route.ts           # GET, POST
│       └── [id]/
│           └── route.ts       # GET, PUT, DELETE
```

### 2. CustomNode Class

```typescript
export class CustomNode extends BaseNode {
  private template: NodeTemplate;
  private expression: string;
  private compiledExpression?: Function;

  constructor(config: CustomNodeConfig) {
    super(config);
    this.template = config.template;
    this.expression = config.expression;
    this.compiledExpression = this.compileExpression();
  }

  protected async executeInternal(
    context: ExecutionContext
  ): Promise<Map<PortId, unknown>> {
    const outputs = new Map<PortId, unknown>();
    
    // Execute based on template
    const result = await this.template.execute(
      this.expression,
      context.inputs,
      this.compiledExpression
    );
    
    // Set outputs
    this.outputs.forEach((output, index) => {
      outputs.set(output.id, result[index] ?? null);
    });
    
    return outputs;
  }

  private compileExpression(): Function {
    // Safe expression compilation
    // Validate and restrict user input
    return new Function('inputs', `return ${this.expression};`);
  }
}
```

### 3. Template System

```typescript
export enum TemplateType {
  TRANSFORM = 'transform',
  FILTER = 'filter',
  CALCULATOR = 'calculator',
  CONDITIONAL = 'conditional',
  STRING_OP = 'string-op',
}

export interface NodeTemplate {
  type: TemplateType;
  name: string;
  description: string;
  execute: (
    expression: string,
    inputs: Map<PortId, unknown>,
    compiledFn?: Function
  ) => Promise<unknown[]>;
  validateExpression: (expression: string) => boolean;
}
```

### 4. API Routes

```typescript
// POST /api/custom-nodes
export async function POST(request: Request) {
  const body = await request.json();
  
  // 1. Validate
  const validation = validateCustomNodeConfig(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors }, { status: 400 });
  }
  
  // 2. Create node
  const node = createCustomNode(body);
  
  // 3. Register in registry
  const registry = NodeRegistry.getInstance();
  registry.registerCustomNode(node);
  
  // 4. Save
  await CustomNodeStorage.save(node);
  
  return NextResponse.json({ success: true, node });
}
```

### 5. Frontend UI

```
app/
├── custom-nodes/
│   ├── page.tsx              # Node list
│   ├── create/
│   │   └── page.tsx          # Node creation form
│   └── [id]/
│       ├── page.tsx          # Node detail/edit
│       └── test/
│           └── page.tsx      # Node testing
└── components/
    ├── NodeCreator/
    │   ├── TemplateSelector.tsx
    │   ├── PortEditor.tsx
    │   ├── ExpressionEditor.tsx
    │   └── NodePreview.tsx
    └── CustomNodeCard.tsx
```

---

## Security Considerations

### Template-Based System
- ✅ Expression validation (AST analysis)
- ✅ Only allowed functions can be used
- ✅ Block dangerous code patterns
- ✅ Execution time limits

### Script-Based System (Phase 2)
- VM2 sandboxing
- Resource limits (CPU, memory)
- Block network access
- Block file system access

---

## Data Model

```typescript
interface CustomNodeConfig {
  id?: string;
  type: string;                    // 'custom.user-defined-name'
  displayName: string;
  category: string;                // 'Custom'
  description: string;
  version: string;
  author?: string;
  tags: string[];
  
  // Template information
  template: TemplateType;
  expression: string;               // Expression/code to execute
  
  // Port definitions
  inputs: Port[];
  outputs: Port[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;               // User ID (when auth is implemented)
  
  // Storage information
  storageId?: string;              // Unique ID in storage
}
```

---

## User Experience Flow

1. **Access Node Creation Page**
   - `/custom-nodes/create`

2. **Select Template**
   - Transform, Filter, Calculator, etc.

3. **Enter Node Information**
   - Name, description, category, tags

4. **Define Ports**
   - Add/edit input/output ports
   - Set type, name, required status

5. **Write Logic**
   - Write expression or function
   - Real-time validation and preview

6. **Test**
   - Test with sample inputs
   - Verify results

7. **Save and Register**
   - Available immediately after saving

---

## API Specification

### POST /api/custom-nodes
Create a new custom node

**Request**:
```json
{
  "type": "custom.my-node",
  "displayName": "My Custom Node",
  "category": "Custom",
  "description": "Does something custom",
  "version": "1.0.0",
  "tags": ["custom", "test"],
  "template": "transform",
  "expression": "inputs.value * 2",
  "inputs": [
    {
      "id": "value",
      "name": "Value",
      "dataType": { "name": "number" },
      "required": true
    }
  ],
  "outputs": [
    {
      "id": "result",
      "name": "Result",
      "dataType": { "name": "number" }
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "node": {
    "id": "custom-node-uuid",
    "type": "custom.my-node",
    ...
  }
}
```

### GET /api/custom-nodes
List all custom nodes

### GET /api/custom-nodes/:id
Get a specific custom node

### PUT /api/custom-nodes/:id
Update a custom node

### DELETE /api/custom-nodes/:id
Delete a custom node

---

## File Structure

```
src/
├── custom-nodes/
│   ├── CustomNode.ts
│   ├── NodeTemplate.ts
│   ├── templates/
│   │   ├── TransformTemplate.ts
│   │   ├── FilterTemplate.ts
│   │   ├── CalculatorTemplate.ts
│   │   └── ConditionalTemplate.ts
│   ├── TemplateEngine.ts
│   ├── ExpressionValidator.ts
│   ├── CustomNodeStorage.ts
│   └── index.ts
├── api/
│   └── custom-nodes/
│       ├── route.ts
│       └── [id]/
│           └── route.ts

app/
├── custom-nodes/
│   ├── page.tsx
│   ├── create/
│   │   └── page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── test/
│           └── page.tsx
└── components/
    └── NodeCreator/
        ├── index.tsx
        ├── TemplateSelector.tsx
        ├── PortEditor.tsx
        ├── ExpressionEditor.tsx
        └── NodePreview.tsx

storage/
└── custom-nodes/
    └── *.json (JSON file per node)
```

---

## Next Steps

1. **Phase 1 Implementation** (Template-Based)
   - [ ] Implement CustomNode class
   - [ ] Implement template system
   - [ ] Implement expression validator
   - [ ] Implement storage system
   - [ ] Implement API endpoints
   - [ ] Implement frontend UI

2. **Phase 2 Implementation** (Script-Based)
   - [ ] VM2 integration
   - [ ] Implement security policies
   - [ ] Code editor integration

3. **Enhancement Features**
   - [ ] Node version management
   - [ ] Node sharing/import
   - [ ] Node marketplace
   - [ ] User authentication and authorization
   - [ ] Node execution statistics

---

## Conclusion

**Recommended Approach**: **Option 3 (Hybrid)**, implemented in phases

1. **Phase 1**: Start with template-based system (safe and simple to implement)
2. **Phase 2**: Add script execution system if needed (gains flexibility)

This approach provides a fast MVP while maintaining future extensibility.
