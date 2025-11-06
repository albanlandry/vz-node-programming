# Live Graph Execution in Graph Editor - Proposal

## Overview

This document proposes improvements to enable live execution of graphs directly from the Graph Editor, providing real-time feedback, visual execution state, and interactive debugging capabilities.

## Current State

- **Graph Execution Engine**: Exists and can execute saved graphs via API (`/api/graphs/[id]/execute`)
- **Graph Editor**: Visual editor with node/connection management via Zustand store
- **Execution Flow**: Currently requires saving graph first, then executing via API
- **No Visual Feedback**: No real-time execution state or results display

## Proposed Features

### 1. Execution Controls & UI

#### 1.1 Execution Toolbar
- **Play Button**: Start execution of current graph
- **Stop Button**: Cancel ongoing execution
- **Pause/Resume**: Pause execution at current node (optional, Phase 2)
- **Execution Mode Toggle**: Sequential vs Parallel execution
- **Auto-execute Toggle**: Automatically re-execute on graph changes (debounced)

#### 1.2 Execution Status Panel
- **Status Indicator**: Shows current execution state (idle, running, paused, completed, error)
- **Progress Bar**: Visual progress indicator
- **Execution Time**: Real-time execution time display
- **Node Count**: Shows nodes executed / total nodes

### 2. Visual Execution Feedback

#### 2.1 Node State Visualization
- **Color Coding**:
  - Gray: Not executed / Idle
  - Blue: Queued / Ready to execute
  - Yellow: Currently executing
  - Green: Successfully executed
  - Red: Execution failed
  - Orange: Warning / Partial success

#### 2.2 Connection Data Flow
- **Animated Flow**: Show data flowing through connections during execution
- **Value Display**: Show values on connection labels (optional, toggleable)
- **Data Type Indicators**: Color-coded connection lines based on data types

#### 2.3 Execution Order Visualization
- **Numbered Badges**: Show execution order on nodes (for sequential mode)
- **Level Indicators**: Show execution level/group (for parallel mode)

### 3. Input/Output Management

#### 3.1 Input Configuration Panel
- **Floating Panel**: Similar to Node Details Panel, but for input configuration
- **Node Input Editor**: For each node that requires external inputs:
  - List all input ports
  - Provide input fields based on data type
  - Support for:
    - String inputs (text field)
    - Number inputs (number field with validation)
    - Boolean inputs (checkbox)
    - Object/Array inputs (JSON editor)
- **Input Templates**: Save/load input configurations
- **Quick Input**: Common input presets

#### 3.2 Output Display Panel
- **Results Panel**: Floating panel showing execution results
- **Node Results**: Expandable list showing results per node
- **Output Values**: Display output port values with proper formatting
- **Data Visualization**: 
  - Tables for arrays/objects
  - Charts for numeric data (optional)
  - JSON tree viewer for complex objects
- **Export Results**: Export results as JSON, CSV, etc.

### 4. Real-time Execution

#### 4.1 Live Execution API
- **New Endpoint**: `POST /api/graphs/execute-inline`
  - Accepts graph definition directly (not requiring save)
  - Returns execution results with real-time updates (via Server-Sent Events or WebSocket)
  - Supports cancellation via request cancellation

#### 4.2 Execution State Management
- **Zustand Store Extension**: Add execution state to `graphStore`
  ```typescript
  interface ExecutionState {
    isExecuting: boolean;
    executionId: string | null;
    nodeStates: Map<string, NodeExecutionState>;
    results: Map<string, ExecutionResult>;
    errors: Map<string, NodeError>;
    executionTime: number;
    executionMode: 'sequential' | 'parallel';
  }
  
  interface NodeExecutionState {
    status: 'idle' | 'queued' | 'executing' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    executionTime?: number;
  }
  ```

#### 4.3 Incremental Updates
- **Streaming Results**: Receive results as nodes complete (not just at end)
- **Optimistic Updates**: Update UI immediately when node starts executing
- **Error Propagation**: Show errors as they occur, not just at end

### 5. Error Handling & Debugging

#### 5.1 Error Visualization
- **Node Error Indicators**: Red border/icon on failed nodes
- **Error Tooltips**: Hover to see error message
- **Error Panel**: Dedicated panel listing all errors
- **Error Details**: Expandable error details with stack traces

#### 5.2 Debugging Features
- **Breakpoints**: Set breakpoints on nodes (pause execution before node)
- **Step Execution**: Execute one node at a time (manual step)
- **Variable Inspector**: Inspect values at any point in execution
- **Execution Log**: Detailed log of execution flow

### 6. Performance & Optimization

#### 6.1 Execution Optimization
- **Smart Re-execution**: Only re-execute changed nodes (incremental execution)
- **Caching**: Cache results for unchanged nodes
- **Debouncing**: Debounce auto-execution to avoid excessive executions
- **Cancellation**: Proper cancellation of ongoing executions

#### 6.2 UI Performance
- **Virtualization**: For large graphs, virtualize node rendering during execution
- **Throttled Updates**: Throttle UI updates to maintain smooth performance
- **Lazy Loading**: Lazy load execution results panel

## Technical Implementation

### Phase 1: Basic Live Execution (MVP)

#### 1.1 Backend API Enhancement
```typescript
// app/api/graphs/execute-inline/route.ts
export async function POST(request: Request) {
  const { graph, inputs, options } = await request.json();
  
  const engine = new GraphExecutionEngine();
  const result = await engine.execute(graph, { inputs, options });
  
  return NextResponse.json({ result });
}
```

#### 1.2 Frontend Execution Service
```typescript
// services/graphExecutionService.ts
export class GraphExecutionService {
  async executeGraph(
    graph: GraphData,
    inputs?: Record<string, Record<string, unknown>>,
    options?: { parallel?: boolean }
  ): Promise<ExecutionResponse> {
    const response = await fetch('/api/graphs/execute-inline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph, inputs, options }),
    });
    return response.json();
  }
}
```

#### 1.3 Graph Store Extension
```typescript
// store/graphStore.ts - Add execution state
interface GraphState {
  // ... existing state
  execution: {
    isExecuting: boolean;
    executionId: string | null;
    nodeStates: Record<string, NodeExecutionState>;
    results: Record<string, ExecutionResult>;
    errors: Record<string, NodeError>;
    executionTime: number;
    mode: 'sequential' | 'parallel';
  };
  
  // Actions
  startExecution: (mode: 'sequential' | 'parallel') => Promise<void>;
  stopExecution: () => void;
  updateNodeState: (nodeId: string, state: NodeExecutionState) => void;
  setExecutionResults: (results: Record<string, ExecutionResult>) => void;
  clearExecutionState: () => void;
}
```

#### 1.4 Execution Toolbar Component
```typescript
// components/graph/ExecutionToolbar.tsx
- Play/Stop buttons
- Execution mode toggle
- Status indicator
- Progress display
```

#### 1.5 Node Visual State Updates
```typescript
// components/graph/ReactFlowNode.tsx
- Add execution state prop
- Apply color coding based on state
- Show execution time badge
- Show error indicator
```

#### 1.6 Results Panel Component
```typescript
// components/graph/ExecutionResultsPanel.tsx
- Floating panel (similar to NodeDetailsPanel)
- Display results per node
- Expandable sections
- Error display
```

### Phase 2: Advanced Features

#### 2.1 Real-time Streaming
- Implement Server-Sent Events (SSE) or WebSocket
- Stream execution updates as they happen
- Update UI incrementally

#### 2.2 Input Configuration Panel
- Create InputConfigPanel component
- Integrate with graph store
- Support all data types

#### 2.3 Data Flow Visualization
- Animate connections during execution
- Show values on connections (optional)
- Connection state colors

#### 2.4 Debugging Features
- Breakpoints UI
- Step execution controls
- Variable inspector

### Phase 3: Performance & Polish

#### 3.1 Incremental Execution
- Detect changed nodes
- Only re-execute changed subgraph
- Cache results

#### 3.2 Advanced Visualization
- Execution timeline
- Performance metrics per node
- Data flow graphs

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ Graph Toolbar                    [Execution Toolbar]    │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Node     │         Graph Canvas                         │
│ Palette  │         (with execution states)              │
│          │                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│ [Node Details Panel]  [Input Config]  [Results Panel]   │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Idle**: `#94a3b8` (gray-400)
- **Queued**: `#3b82f6` (blue-500)
- **Executing**: `#fbbf24` (yellow-400)
- **Success**: `#10b981` (green-500)
- **Error**: `#ef4444` (red-500)
- **Warning**: `#f97316` (orange-500)

## API Design

### POST /api/graphs/execute-inline
```typescript
Request:
{
  graph: {
    nodes: GraphNode[];
    connections: GraphConnection[];
  };
  inputs?: Record<string, Record<string, unknown>>;
  options?: {
    parallel?: boolean;
    timeout?: number;
  };
}

Response:
{
  success: boolean;
  results: Record<string, ExecutionResult>;
  errors?: NodeError[];
  executionTime: number;
  logs: string[];
}
```

### Future: WebSocket / SSE Endpoint
```
WS /api/graphs/execute-stream
- Stream execution updates
- Real-time node state changes
- Incremental results
```

## State Management

### Execution State Flow
1. User clicks "Play" → `startExecution()` called
2. Graph validated → Validation errors shown if any
3. Execution started → `isExecuting = true`, node states initialized
4. Nodes execute → Node states update in real-time
5. Results received → Results stored, node states updated
6. Execution complete → `isExecuting = false`, results displayed

## Error Handling

### Validation Errors
- Show before execution starts
- Highlight problematic nodes
- Provide fix suggestions

### Runtime Errors
- Show immediately when node fails
- Don't stop entire execution (continue with other nodes)
- Aggregate all errors in error panel

### Network Errors
- Retry mechanism for failed API calls
- Offline mode indicator
- Error recovery suggestions

## Performance Considerations

### Large Graphs
- Virtualize node rendering
- Throttle state updates
- Lazy load results

### Frequent Executions
- Debounce auto-execution (500ms default)
- Cancel previous execution if new one starts
- Cache validation results

### Memory Management
- Clear old execution results
- Limit result history
- Garbage collect unused state

## Testing Strategy

### Unit Tests
- Execution service
- State management
- Validation logic

### Integration Tests
- End-to-end execution flow
- Error handling
- State synchronization

### Performance Tests
- Large graph execution (100+ nodes)
- Concurrent executions
- Memory usage

## Migration Path

### Step 1: Add execution state to store (non-breaking)
### Step 2: Add execution toolbar (new UI)
### Step 3: Add inline execution API (new endpoint)
### Step 4: Update node components (backward compatible)
### Step 5: Add results panel (new component)
### Step 6: Add input configuration (new component)

## Future Enhancements

1. **Execution History**: Save execution history with timestamps
2. **Execution Profiles**: Save/load execution configurations
3. **Performance Profiling**: Detailed performance metrics per node
4. **Execution Comparison**: Compare results from different executions
5. **Automated Testing**: Test graphs with different inputs
6. **Execution Scheduling**: Schedule graph executions
7. **Distributed Execution**: Execute graphs across multiple workers
8. **Visual Debugger**: Full debugging interface with breakpoints

## Success Metrics

- **Execution Time**: < 2s for graphs with < 50 nodes
- **UI Responsiveness**: < 100ms update latency
- **Error Detection**: 100% of errors shown to user
- **User Satisfaction**: Positive feedback on live execution feature

## Conclusion

This proposal provides a comprehensive plan for implementing live graph execution in the Graph Editor. The phased approach allows for incremental development while maintaining system stability. The focus on visual feedback, error handling, and performance ensures a good user experience.

