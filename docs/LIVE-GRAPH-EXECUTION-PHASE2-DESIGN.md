# Live Graph Execution Phase 2 - Design & Architecture

## Overview

Phase 2 extends the basic live execution (Phase 1) with advanced features including real-time streaming, input configuration, data flow visualization, and debugging capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Graph Store  │  │ Execution    │  │ SSE Client   │     │
│  │ (Zustand)    │◄─┤ Service      │◄─┤ (EventSource)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              UI Components                          │    │
│  │  - ExecutionToolbar  - InputConfigPanel            │    │
│  │  - ExecutionResults  - DataFlowVisualization       │    │
│  │  - DebugPanel       - BreakpointManager           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Next.js API)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ /api/graphs/     │  │ /api/graphs/     │               │
│  │ execute-stream   │  │ execute-inline   │               │
│  │ (SSE Endpoint)   │  │ (HTTP Endpoint)  │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                      │                         │
│           └──────────┬───────────┘                         │
│                      ▼                                     │
│           ┌────────────────────┐                           │
│           │ GraphExecutionEngine│                          │
│           │  - execute()        │                           │
│           │  - executeStream() │                           │
│           └────────────────────┘                           │
│                      │                                     │
│                      ▼                                     │
│           ┌────────────────────┐                           │
│           │ NodeExecutor        │                          │
│           │  - EventEmitter     │                          │
│           └────────────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Real-time Streaming (SSE)

#### Backend: SSE Endpoint
```typescript
// app/api/graphs/execute-stream/route.ts
POST /api/graphs/execute-stream
- Accepts graph definition and execution options
- Returns SSE stream with incremental updates
- Events:
  - execution:started
  - node:queued
  - node:executing
  - node:completed
  - node:failed
  - execution:completed
  - execution:error
```

#### Frontend: SSE Client Service
```typescript
// services/streamingExecutionService.ts
- EventSource wrapper
- Automatic reconnection
- Event parsing and dispatch
- Error handling
```

### 2. Input Configuration Panel

#### Component Structure
```
InputConfigPanel
├── InputSection (per node)
│   ├── PortInputEditor
│   │   ├── StringInput
│   │   ├── NumberInput
│   │   ├── BooleanInput
│   │   ├── ObjectInput (JSON editor)
│   │   └── ArrayInput
│   └── InputTemplateSelector
├── QuickInputPresets
└── InputValidation
```

#### State Management
- Input values stored in `graphStore.inputConfig`
- Per-node input configuration
- Input templates (save/load)

### 3. Data Flow Visualization

#### Connection State Management
```typescript
interface ConnectionState {
  connectionId: string;
  status: 'idle' | 'active' | 'error';
  data?: unknown;
  animationProgress?: number;
}
```

#### Visualization Features
- Animated data flow along connections
- Value display on connection labels (toggleable)
- Color-coded connections by data type
- Connection state indicators

### 4. Debugging Features

#### Breakpoint System
```typescript
interface Breakpoint {
  nodeId: string;
  enabled: boolean;
  condition?: string; // Optional condition expression
}
```

#### Step Execution
- Execute one node at a time
- Step over/into controls
- Execution pause/resume

#### Variable Inspector
- Inspect node inputs/outputs at any point
- Watch expressions
- Call stack visualization

## Data Flow

### Execution Flow with Streaming

1. **User Initiates Execution**
   ```
   User clicks Play
   → ExecutionToolbar.handleExecute()
   → graphStore.startExecution()
   → streamingExecutionService.executeStream()
   → POST /api/graphs/execute-stream
   ```

2. **Backend Streams Updates**
   ```
   GraphExecutionEngine.executeStream()
   → NodeExecutor (EventEmitter)
   → Stream events via SSE
   → Frontend receives events
   → graphStore.updateNodeState()
   → UI updates reactively
   ```

3. **Real-time UI Updates**
   ```
   SSE Event Received
   → streamingExecutionService.handleEvent()
   → graphStore.updateNodeState()
   → React components re-render
   → Visual feedback updates
   ```

## State Management

### Extended Graph Store

```typescript
interface GraphState {
  // ... existing state
  
  // Input configuration
  inputConfig: Record<string, Record<string, unknown>>;
  inputTemplates: InputTemplate[];
  
  // Debugging
  breakpoints: Record<string, Breakpoint>;
  isPaused: boolean;
  stepMode: boolean;
  currentStepNodeId: string | null;
  
  // Data flow visualization
  connectionStates: Record<string, ConnectionState>;
  showDataFlow: boolean;
  showConnectionValues: boolean;
  
  // Actions
  setInputValue: (nodeId: string, portId: string, value: unknown) => void;
  addBreakpoint: (nodeId: string, condition?: string) => void;
  removeBreakpoint: (nodeId: string) => void;
  toggleBreakpoint: (nodeId: string) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stepExecution: () => void;
  setShowDataFlow: (show: boolean) => void;
  setShowConnectionValues: (show: boolean) => void;
  updateConnectionState: (connectionId: string, state: ConnectionState) => void;
}
```

## API Design

### SSE Endpoint

**POST /api/graphs/execute-stream**

Request:
```typescript
{
  graph: GraphDefinition;
  inputs?: Record<string, Record<string, unknown>>;
  options?: {
    parallel?: boolean;
    timeout?: number;
    breakpoints?: string[]; // Node IDs with breakpoints
    stepMode?: boolean;
  };
}
```

Response (SSE Stream):
```
event: execution:started
data: {"executionId": "exec-123", "timestamp": 1234567890}

event: node:queued
data: {"nodeId": "node-1", "timestamp": 1234567891}

event: node:executing
data: {"nodeId": "node-1", "timestamp": 1234567892}

event: node:completed
data: {
  "nodeId": "node-1",
  "result": {...},
  "executionTime": 5,
  "timestamp": 1234567897
}

event: node:failed
data: {
  "nodeId": "node-1",
  "error": {...},
  "timestamp": 1234567897
}

event: connection:data
data: {
  "connectionId": "conn-1",
  "fromNode": "node-1",
  "toNode": "node-2",
  "data": {...}
}

event: execution:completed
data: {
  "executionId": "exec-123",
  "executionTime": 100,
  "timestamp": 1234567990
}

event: execution:error
data: {
  "executionId": "exec-123",
  "error": {...},
  "timestamp": 1234567990
}
```

## Component Specifications

### 1. InputConfigPanel

**Location**: `components/graph/InputConfigPanel.tsx`

**Props**:
```typescript
interface InputConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}
```

**Features**:
- List all nodes requiring external inputs
- Input editor per port (type-aware)
- Input validation
- Save/load input templates
- Quick input presets

### 2. DataFlowVisualization

**Location**: `components/graph/DataFlowVisualization.tsx`

**Features**:
- Animate connections during execution
- Show values on connection labels
- Color-code by data type
- Toggle visibility

### 3. DebugPanel

**Location**: `components/graph/DebugPanel.tsx`

**Features**:
- Breakpoint management
- Step execution controls
- Variable inspector
- Call stack
- Watch expressions

### 4. StreamingExecutionService

**Location**: `services/streamingExecutionService.ts`

**Methods**:
```typescript
class StreamingExecutionService {
  executeStream(
    graph: GraphDefinition,
    inputs?: Record<string, Record<string, unknown>>,
    options?: ExecutionOptions
  ): Promise<EventSource>;
  
  cancelExecution(executionId: string): void;
  
  onEvent(callback: (event: ExecutionEvent) => void): void;
  offEvent(callback: (event: ExecutionEvent) => void): void;
}
```

## Error Handling

### Streaming Errors
- Connection failures → Auto-reconnect with exponential backoff
- Parse errors → Log and continue
- Execution errors → Stream error event, continue with other nodes

### Input Validation
- Type validation per port
- Required field validation
- JSON validation for object/array inputs
- Real-time validation feedback

### Debugging Errors
- Breakpoint condition evaluation errors
- Step execution errors
- Variable inspection errors

## Performance Considerations

### SSE Optimization
- Throttle high-frequency events
- Batch node state updates
- Connection pooling

### UI Performance
- Virtualize large node lists in InputConfigPanel
- Debounce input validation
- Lazy load debug panel
- Throttle data flow animations

### Memory Management
- Limit connection state history
- Clear old execution data
- Garbage collect unused breakpoints

## Security Considerations

### Input Validation
- Sanitize all user inputs
- Validate JSON inputs
- Prevent code injection in breakpoint conditions

### SSE Security
- Validate execution requests
- Rate limiting
- Timeout enforcement

## Testing Strategy

### Unit Tests
- StreamingExecutionService
- InputConfigPanel components
- DataFlowVisualization logic
- DebugPanel functionality
- Breakpoint evaluation

### Integration Tests
- End-to-end streaming execution
- Input configuration flow
- Data flow visualization
- Debugging workflow

### Performance Tests
- Large graph streaming (100+ nodes)
- Concurrent executions
- Memory usage with long-running streams

## Migration Path

1. Add streaming endpoint (non-breaking)
2. Add SSE client service
3. Update ExecutionToolbar to use streaming
4. Add InputConfigPanel (new component)
5. Add DataFlowVisualization (new component)
6. Add DebugPanel (new component)
7. Extend graph store with new state
8. Update UI to show new features

## Success Criteria

- ✅ Real-time updates visible within 100ms
- ✅ Input configuration supports all data types
- ✅ Data flow visualization smooth (60fps)
- ✅ Breakpoints pause execution correctly
- ✅ Step execution works reliably
- ✅ Variable inspector shows accurate data
- ✅ No memory leaks in long-running executions
- ✅ Error handling graceful and informative

