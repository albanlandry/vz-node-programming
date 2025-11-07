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

1. Implement `UserInputDialog` component
2. Implement form validation system
3. Create backend API endpoint (`/api/graphs/interactive/input/[nodeId]`)
4. Implement user input wait/resume logic in execution engine
5. Create example `UserInputNode` implementation

## Dependencies

- `events` (Node.js EventEmitter)
- `uuid` (for execution IDs)
- Existing types from `src/types/index.ts`

## Migration Notes

- Existing nodes continue to work without changes
- Interactive nodes must implement `IInteractiveNode` interface
- `isInteractive` flag must be set to `true`
- Optional `executeInteractive()` method can be implemented for better type safety

## Conclusion

Phase 1 successfully establishes the foundation for interactive nodes. The architecture is extensible and allows for incremental addition of features in subsequent phases. The implementation maintains backward compatibility with existing nodes while providing a clear path for interactive node development.

