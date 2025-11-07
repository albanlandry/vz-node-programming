# Interactive Nodes - Phase 1 Implementation

## Overview

This document describes the implementation of Phase 1: Basic Infrastructure for Interactive Nodes support in the VZ Programming system. Phase 1 establishes the foundational architecture that enables nodes to request user input, display images, stream data, and render custom UI components.

## Implementation Date

**Completed:** 2025-01-07

## Phase 1 Goals

1. ✅ Add type definitions (`InteractiveNodeType`, `UserInputRequest`, `ImageData`, etc.)
2. ✅ Implement `InteractiveExecutionContext`
3. ✅ Extend execution engine (detect and handle interactive nodes)
4. ✅ Build basic event system

## Files Created/Modified

### 1. Type Definitions (`src/types/index.ts`)

Added comprehensive type definitions for interactive nodes:

#### Interactive Node Types
```typescript
export enum InteractiveNodeType {
  USER_INPUT = 'user-input',      // User input request
  IMAGE_DISPLAY = 'image-display', // Image display
  STREAMING = 'streaming',         // Streaming data
  CUSTOM_UI = 'custom-ui',         // Custom UI component
}
```

#### User Input Request Types
- `UserInputRequest`: Defines the structure for requesting user input (form, prompt, or confirm)
- `FormSchema`: Defines form structure with fields, title, and description
- `FormField`: Defines individual form fields with validation rules
- `ValidationRule`: Defines validation rules (required, min, max, pattern, custom)

#### Image Data Type
- `ImageData`: Supports multiple image formats (URL, base64, Blob) with metadata

#### Interactive Context Interface
- `InteractiveExecutionContext`: Extends `ExecutionContext` with interactive methods:
  - `requestUserInput()`: Request user input (pauses execution)
  - `displayImage()`: Display image in UI
  - `updateStreamingData()`: Update streaming data
  - `renderCustomUI()`: Render custom UI component

#### Interactive Node Interface
- `IInteractiveNode`: Extends `INode` with:
  - `isInteractive`: Boolean flag
  - `interactiveType`: Type of interactive node
  - `executeInteractive()`: Optional method for interactive execution

#### Event Types
- `InteractiveNodeEventType`: Enum defining all interactive node events:
  - `USER_INPUT_REQUESTED`
  - `USER_INPUT_RECEIVED`
  - `IMAGE_DISPLAY_REQUESTED`
  - `STREAMING_DATA_UPDATE`
  - `CUSTOM_UI_RENDER`
  - `NODE_PAUSED`
  - `NODE_RESUMED`

### 2. Interactive Execution Context (`src/core/InteractiveExecutionContext.ts`)

**New File Created**

Implements the `InteractiveExecutionContext` class that wraps a base `ExecutionContext` and adds interactive capabilities.

#### Key Features

1. **User Input Management**
   - `requestUserInput()`: Creates a Promise that resolves when user provides input
   - `provideUserInput()`: Internal method called by executor to provide input
   - `cancelUserInput()`: Internal method to cancel input request

2. **Event Emission**
   - Emits events via EventEmitter for all interactive actions
   - Events include node ID and execution ID for tracking

3. **Context Delegation**
   - Delegates all `ExecutionContext` properties (executionId, inputs, outputs, metadata, errorHandler)

#### Implementation Details

```typescript
export class InteractiveExecutionContext implements IInteractiveExecutionContext {
  private inputResolver?: (value: unknown) => void;
  private inputRejecter?: (error: Error) => void;
  private readonly nodeId: string;
  
  constructor(
    private readonly baseContext: ExecutionContext,
    private readonly eventEmitter: EventEmitter,
    nodeId: string,
  ) {
    this.nodeId = nodeId;
  }
  
  async requestUserInput(request: UserInputRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.inputResolver = resolve;
      this.inputRejecter = reject;
      
      // Emit events for UI and pause notification
      this.eventEmitter.emit(InteractiveNodeEventType.USER_INPUT_REQUESTED, {...});
      this.eventEmitter.emit(InteractiveNodeEventType.NODE_PAUSED, {...});
    });
  }
  
  // ... other methods
}
```

### 3. Node Executor Extension (`src/core/NodeExecutor.ts`)

**Modified File**

Extended `NodeExecutor` to detect and handle interactive nodes.

#### Changes Made

1. **New Private Fields**
   ```typescript
   private interactiveContexts: Map<NodeId, InteractiveExecutionContext> = new Map();
   private pausedNodes: Set<NodeId> = new Set();
   ```

2. **Interactive Node Detection**
   - `isInteractiveNode()`: Checks if a node implements `IInteractiveNode` and has `isInteractive === true`

3. **Enhanced Node Execution**
   - Modified `executeNode()` to:
     - Detect interactive nodes
     - Create `InteractiveExecutionContext` for interactive nodes
     - Store context for user input handling
     - Call `executeInteractive()` if available, otherwise fallback to `execute()`
     - Clean up contexts after execution

4. **New Public Methods**
   - `provideUserInput(nodeId, value)`: Provide user input to a paused node
   - `cancelUserInput(nodeId, error?)`: Cancel user input request
   - `getPausedNodes()`: Get list of paused nodes
   - `isNodePaused(nodeId)`: Check if a node is paused

#### Execution Flow for Interactive Nodes

```
1. executeNode() called
2. Check if node is interactive (isInteractiveNode())
3. If interactive:
   a. Create InteractiveExecutionContext
   b. Store context in interactiveContexts Map
   c. Call executeInteractive() if available
   d. Node may call requestUserInput() → pauses execution
   e. When input provided → provideUserInput() → execution resumes
   f. Clean up context after execution
4. If not interactive:
   a. Execute normally with base ExecutionContext
```

## Architecture

### Component Relationships

```
NodeExecutor (EventEmitter)
  ├─> Detects Interactive Nodes
  ├─> Creates InteractiveExecutionContext
  ├─> Stores contexts in Map
  └─> Emits events for UI

InteractiveExecutionContext
  ├─> Wraps ExecutionContext
  ├─> Provides interactive methods
  └─> Emits events via EventEmitter

IInteractiveNode
  ├─> Extends INode
  ├─> Has isInteractive flag
  └─> Optional executeInteractive() method
```

### Event Flow

```
Node calls requestUserInput()
  ↓
InteractiveExecutionContext emits USER_INPUT_REQUESTED
  ↓
InteractiveExecutionContext emits NODE_PAUSED
  ↓
Execution pauses (Promise pending)
  ↓
[User provides input via UI]
  ↓
Executor calls provideUserInput()
  ↓
InteractiveExecutionContext resolves Promise
  ↓
InteractiveExecutionContext emits USER_INPUT_RECEIVED
  ↓
InteractiveExecutionContext emits NODE_RESUMED
  ↓
Execution continues
```

## Usage Example

### Creating an Interactive Node

```typescript
import { BaseNode } from '../core/BaseNode';
import type { InteractiveExecutionContext, ExecutionResult } from '../types';
import { InteractiveNodeType } from '../types';

export class UserInputNode extends BaseNode implements IInteractiveNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.USER_INPUT;

  protected async executeInternal(
    context: InteractiveExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();

    // Request user input - execution pauses here
    const userInput = await context.requestUserInput({
      type: 'form',
      formSchema: {
        title: 'Enter Information',
        fields: [
          {
            id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            validation: [
              { type: 'required', message: 'Name is required' },
            ],
          },
        ],
      },
    });

    // Execution resumes after input is provided
    outputs.set('value', userInput);
    return outputs;
  }
}
```

### Providing User Input from External Source

```typescript
// In API route or service
const executor = new NodeExecutor();
// ... add nodes and execute ...

// When user provides input
executor.provideUserInput('node-123', { name: 'John Doe' });

// Or cancel input
executor.cancelUserInput('node-123', new Error('User cancelled'));
```

## Testing

### Unit Tests Implemented

✅ **All Phase 1 unit tests have been implemented and are passing**

#### Test Files Created

1. **`__tests__/core/InteractiveExecutionContext.test.ts`** (18 tests)
   - ✅ Context delegation (executionId, inputs, outputs, metadata, errorHandler)
   - ✅ `requestUserInput()` creates Promise and emits events
   - ✅ `provideUserInput()` resolves Promise
   - ✅ `cancelUserInput()` rejects Promise
   - ✅ Event emission for all interactive methods
   - ✅ Image display event emission
   - ✅ Streaming data event emission
   - ✅ Custom UI render event emission
   - ✅ Input resolver/rejecter cleanup

2. **`__tests__/core/NodeExecutor.interactive.test.ts`** (17 tests)
   - ✅ Interactive node detection
   - ✅ `executeInteractive()` is called for interactive nodes
   - ✅ Fallback to `execute()` if `executeInteractive()` not implemented
   - ✅ Regular nodes execute normally
   - ✅ Context storage and cleanup
   - ✅ `provideUserInput()` and `cancelUserInput()` methods
   - ✅ Paused node tracking (`getPausedNodes()`, `isNodePaused()`)
   - ✅ Event emission for interactive operations
   - ✅ Context cleanup after successful and failed execution
   - ✅ Mixed execution (interactive + regular nodes)

#### Test Coverage

- **InteractiveExecutionContext**: 100% method coverage
- **NodeExecutor Interactive Support**: All interactive features tested
- **Event System**: All event types verified
- **Error Handling**: Cancellation and error scenarios covered

#### Running Tests

```bash
# Run all interactive node tests
npm test -- __tests__/core/

# Run specific test file
npm test -- __tests__/core/InteractiveExecutionContext.test.ts
npm test -- __tests__/core/NodeExecutor.interactive.test.ts
```

#### Test Results

```
Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
Time:        ~2.5s
```

## Known Limitations

1. **No Timeout Handling**: User input requests don't have timeouts yet
2. **No Session Persistence**: Paused nodes are lost on server restart
3. **No Input Validation on Backend**: Validation is only on frontend (Phase 2)
4. **No UI Components**: Frontend components will be implemented in Phase 2-4

## Next Steps (Phase 2)

1. ✅ Implement `UserInputDialog` component
2. ✅ Implement form validation system
3. ✅ Create backend API endpoint (`/api/graphs/interactive/input/[nodeId]`)
4. ✅ Implement user input wait/resume logic in execution engine
5. ✅ Create example `UserInputNode` implementation

---

# Interactive Nodes - Phase 2 Implementation

## Overview

This document describes the implementation of Phase 2: User Input Support for Interactive Nodes. Phase 2 adds the frontend UI components, form validation, backend API endpoints, and example node implementation to enable user input during graph execution.

## Implementation Date

**Completed:** 2025-01-07

## Phase 2 Goals

1. ✅ Implement `UserInputDialog` component with form validation
2. ✅ Implement form validation system
3. ✅ Create backend API endpoint for user input submission
4. ✅ Update streaming execution to handle interactive events
5. ✅ Create `InteractiveNodeManager` component
6. ✅ Integrate interactive node support into Graph Editor
7. ✅ Create example `UserInputNode` implementation

## Files Created/Modified

### 1. Form Validation Utilities (`utils/formValidation.ts`)

**New File Created**

Provides validation functions for form fields based on `ValidationRule`.

#### Key Functions

- `validateField(field, value)`: Validates a single field against its validation rules
- `validateForm(schema, values)`: Validates an entire form schema
- `getFieldError(fieldId, validationResult)`: Gets error message for a specific field

#### Validation Rules Supported

- `required`: Field must have a value
- `min`: Minimum value/length
- `max`: Maximum value/length
- `pattern`: Regular expression pattern matching
- `custom`: Custom validator function

### 2. User Input Dialog Component (`components/graph/UserInputDialog.tsx`)

**New File Created**

Modal dialog component for collecting user input based on `FormSchema` or simple prompt/confirm requests.

#### Features

- Supports three input types:
  - `form`: Multi-field form with validation
  - `prompt`: Simple text input
  - `confirm`: Boolean confirmation
- Real-time field validation
- Error display for invalid fields
- Form submission with validation
- Cancel functionality

#### Props

```typescript
interface UserInputDialogProps {
  open: boolean;
  nodeId: string;
  executionId: string;
  request: UserInputRequest;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}
```

#### Supported Field Types

- `text`, `email`, `password`: Text inputs
- `number`: Numeric input
- `textarea`: Multi-line text
- `checkbox`: Boolean checkbox
- `select`: Dropdown selection
- `date`: Date picker

### 3. Interactive Node Manager Component (`components/graph/InteractiveNodeManager.tsx`)

**New File Created**

Manages interactive node states and handles user input dialogs. Listens for `interactive:user-input-requested` events from the streaming execution service and displays the appropriate dialog.

#### Features

- Listens to streaming execution events
- Manages pending input requests
- Handles user input submission via API
- Handles input cancellation
- Automatically displays/hides dialogs

### 4. Backend API Endpoints

#### User Input Submission (`app/api/graphs/interactive/input/[nodeId]/route.ts`)

**New File Created**

Handles user input submission for interactive nodes during execution.

**POST `/api/graphs/interactive/input/[nodeId]`**

- Accepts `executionId` and `value` in request body
- Retrieves executor from active executors map
- Calls `executor.provideUserInput(nodeId, value)`
- Returns success/error response

#### User Input Cancellation (`app/api/graphs/interactive/input/[nodeId]/cancel/route.ts`)

**New File Created**

Handles cancellation of user input requests.

**POST `/api/graphs/interactive/input/[nodeId]/cancel`**

- Accepts `executionId` in request body
- Retrieves executor from active executors map
- Calls `executor.cancelUserInput(nodeId, error)`
- Returns success/error response

#### Executor Registration

The input route exports functions to register/unregister executors:

- `registerExecutor(executionId, executor)`: Register an executor for an execution
- `unregisterExecutor(executionId)`: Unregister an executor
- `getActiveExecutors()`: Get the active executors map

**Note:** In production, this should be stored in Redis or a similar service for scalability.

### 5. Streaming Execution Updates (`app/api/graphs/execute-stream/route.ts`)

**Modified File**

Updated to handle interactive node events and register executors for user input API.

#### Changes Made

1. **Import Interactive Event Types**
   ```typescript
   import { NodeEventType, InteractiveNodeEventType } from '../../../../src/types';
   import { registerExecutor, unregisterExecutor } from '../interactive/input/[nodeId]/route';
   ```

2. **Interactive Event Listeners**
   - `USER_INPUT_REQUESTED`: Sent when a node requests user input
   - `USER_INPUT_RECEIVED`: Sent when user input is received
   - `NODE_PAUSED`: Sent when a node is paused waiting for input
   - `NODE_RESUMED`: Sent when a node resumes after receiving input

3. **Executor Registration**
   - Register executor when execution starts
   - Unregister executor when execution completes or errors

### 6. Streaming Execution Service Updates (`services/streamingExecutionService.ts`)

**Modified File**

Added interactive event types to `ExecutionEventType`:

```typescript
export type ExecutionEventType =
  | 'execution:started'
  | 'node:queued'
  | 'node:executing'
  | 'node:completed'
  | 'node:failed'
  | 'connection:data'
  | 'execution:completed'
  | 'execution:error'
  | 'interactive:user-input-requested'  // NEW
  | 'interactive:user-input-received'   // NEW
  | 'interactive:node-paused'           // NEW
  | 'interactive:node-resumed';         // NEW
```

### 7. Example User Input Node (`src/nodes/interactive/UserInputNode.ts`)

**New File Created**

Example implementation of an interactive node that requests user input.

#### Features

- Extends `BaseNode` and implements `IInteractiveNode`
- Configurable input type (form, prompt, confirm)
- Configurable form schema
- Returns user input as output

#### Configuration

```typescript
interface UserInputNodeConfig {
  id?: string;
  prompt?: string;
  inputType?: 'form' | 'prompt' | 'confirm';
  formSchema?: {
    fields: FormField[];
    title?: string;
    description?: string;
  };
}
```

#### Usage Example

```typescript
const userInputNode = new UserInputNode({
  id: 'input-1',
  prompt: 'Enter your name:',
  inputType: 'form',
  formSchema: {
    title: 'User Information',
    fields: [
      {
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
      },
    ],
  },
});
```

### 8. Graph Editor Integration (`app/graph-editor/page.tsx`)

**Modified File**

Added `InteractiveNodeManager` component to the Graph Editor page to handle interactive node dialogs.

```typescript
import InteractiveNodeManager from '../../components/graph/InteractiveNodeManager';

// In component render:
<InteractiveNodeManager />
```

## Architecture

### Component Flow

```
Graph Execution (SSE Stream)
  ↓
Interactive Node calls requestUserInput()
  ↓
NodeExecutor emits USER_INPUT_REQUESTED event
  ↓
execute-stream route sends SSE event
  ↓
StreamingExecutionService emits 'interactive:user-input-requested'
  ↓
InteractiveNodeManager receives event
  ↓
UserInputDialog displays
  ↓
User submits input
  ↓
InteractiveNodeManager calls API endpoint
  ↓
API endpoint calls executor.provideUserInput()
  ↓
NodeExecutor resolves Promise
  ↓
Execution continues
```

### Data Flow

```
1. Node requests input → InteractiveExecutionContext.requestUserInput()
2. Event emitted → SSE stream → Frontend
3. Dialog displayed → User fills form
4. Form validated → User submits
5. API call → Backend receives input
6. Executor provides input → Promise resolves
7. Node continues execution → Outputs result
```

## Usage Example

### Creating a Graph with User Input Node

```typescript
import { UserInputNode } from './nodes/interactive/UserInputNode';
import { GraphExecutionEngine } from './graph-management';

const userInputNode = new UserInputNode({
  id: 'user-input-1',
  inputType: 'form',
  formSchema: {
    title: 'Enter Configuration',
    fields: [
      {
        id: 'apiKey',
        label: 'API Key',
        type: 'text',
        required: true,
        validation: [
          { type: 'required', message: 'API Key is required' },
          { type: 'min', value: 10, message: 'API Key must be at least 10 characters' },
        ],
      },
      {
        id: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        options: [
          { label: 'Development', value: 'dev' },
          { label: 'Production', value: 'prod' },
        ],
      },
    ],
  },
});

// Add to graph and execute
// When execution reaches this node, a dialog will appear
// User fills the form and submits
// Execution continues with the user-provided values
```

### Frontend Integration

The `InteractiveNodeManager` is automatically included in the Graph Editor. When a graph with interactive nodes is executed:

1. Execution starts via `ExecutionToolbar`
2. When an interactive node requests input, `UserInputDialog` appears
3. User fills the form (with real-time validation)
4. User submits → Input sent to backend → Execution continues
5. User can cancel → Input request cancelled → Execution fails gracefully

## Testing

### Unit Tests

✅ **All Phase 2 unit tests have been implemented and are passing**

#### Test Files Created

1. **`__tests__/utils/formValidation.test.ts`** (19 tests)
   - ✅ Field validation (required, min, max, pattern, custom)
   - ✅ Form validation
   - ✅ Error message generation
   - ✅ Edge cases (empty values, null values, etc.)

2. **`__tests__/nodes/interactive/UserInputNode.test.ts`** (10 tests)
   - ✅ UserInputNode execution
   - ✅ Different input types (form, prompt, confirm)
   - ✅ Error handling
   - ✅ Execution time measurement
   - ✅ Node properties validation

#### Test Results

```
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Time:        ~1.0s
```

#### Running Tests

```bash
# Run all Phase 2 tests
npm test -- __tests__/utils/formValidation.test.ts __tests__/nodes/interactive/UserInputNode.test.ts

# Run specific test file
npm test -- __tests__/utils/formValidation.test.ts
npm test -- __tests__/nodes/interactive/UserInputNode.test.ts
```

### Integration Tests

Integration tests for the complete flow are planned for future phases:

1. **`__tests__/integration/interactive-flow.test.ts`** (Planned)
   - Test complete user input flow (node → dialog → API → execution)
   - Test cancellation flow
   - Test multiple interactive nodes in sequence

## Known Limitations

1. **Executor Storage**: Active executors are stored in memory. In production, use Redis or similar for scalability.
2. **No Timeout**: User input requests don't have timeouts yet (planned for Phase 3).
3. **Single Execution**: Only one execution can be active per server instance (can be improved with proper session management).
4. **No Input History**: Previous inputs are not stored or suggested.

## Next Steps (Phase 3)

1. Implement `ImageDisplayPanel` component
2. Add image display support to execution engine
3. Create example `ImageDisplayNode`
4. Add timeout handling for user input requests
5. Implement session persistence for paused nodes

## Dependencies

- `lucide-react`: Icons for UI components
- Existing Phase 1 infrastructure
- Form validation utilities

## Migration Notes

- No breaking changes to existing code
- Interactive nodes are opt-in (existing nodes continue to work)
- Frontend automatically handles interactive events when `InteractiveNodeManager` is included

## Conclusion

Phase 2 successfully implements user input support for interactive nodes. The implementation provides a complete end-to-end solution from node execution to UI dialog to input submission. The architecture is extensible and ready for Phase 3 (Image Display Support).

## Migration Notes

- Existing nodes continue to work without changes
- Interactive nodes must implement `IInteractiveNode` interface
- `isInteractive` flag must be set to `true`
- Optional `executeInteractive()` method can be implemented for better type safety

## Conclusion

Phase 1 successfully establishes the foundation for interactive nodes. The architecture is extensible and allows for incremental addition of features in subsequent phases. The implementation maintains backward compatibility with existing nodes while providing a clear path for interactive node development.

