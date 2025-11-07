# Live Graph Execution Phase 3 - Design & Architecture

## Overview

Phase 3 focuses on performance optimization and advanced visualization features. It includes incremental execution (only re-executing changed nodes) and advanced visualization tools (execution timeline, performance metrics, data flow graphs).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Graph Store  │  │ Execution    │  │ Cache        │     │
│  │ (Zustand)    │◄─┤ Service      │◄─┤ Manager      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              UI Components                          │    │
│  │  - ExecutionTimeline  - PerformanceMetrics        │    │
│  │  - DataFlowGraph     - IncrementalExecutor       │    │
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
│  │ /api/graphs/     │  │ Incremental      │               │
│  │ execute-incremental│ │ Execution Engine │               │
│  └────────┬─────────┘  └────────┬─────────┘               │
│           │                      │                         │
│           └──────────┬───────────┘                         │
│                      ▼                                     │
│           ┌────────────────────┐                           │
│           │ GraphExecutionEngine│                          │
│           │  - executeIncremental│                         │
│           │  - detectChanges   │                           │
│           └────────────────────┘                           │
│                      │                                     │
│                      ▼                                     │
│           ┌────────────────────┐                           │
│           │ ResultCache        │                          │
│           │  - cache results    │                          │
│           │  - validate cache  │                           │
│           └────────────────────┘                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Incremental Execution

#### Change Detection
```typescript
interface NodeChange {
  nodeId: string;
  type: 'added' | 'removed' | 'modified' | 'connection-changed';
  affectedNodes: string[]; // Nodes that depend on this change
}

interface ChangeDetector {
  detectChanges(
    previousGraph: GraphDefinition,
    currentGraph: GraphDefinition
  ): NodeChange[];
  
  getAffectedSubgraph(
    changes: NodeChange[],
    graph: GraphDefinition
  ): GraphDefinition;
}
```

#### Result Caching
```typescript
interface CachedResult {
  nodeId: string;
  result: ExecutionResult;
  graphHash: string; // Hash of node + dependencies
  timestamp: number;
  ttl?: number; // Time to live in ms
}

interface ResultCache {
  get(nodeId: string, graphHash: string): CachedResult | null;
  set(nodeId: string, result: ExecutionResult, graphHash: string): void;
  invalidate(nodeId: string): void;
  clear(): void;
}
```

#### Incremental Executor
```typescript
interface IncrementalExecutionOptions {
  useCache: boolean;
  cacheTTL?: number;
  revalidateDependencies?: boolean;
}

class IncrementalExecutor {
  async executeIncremental(
    graph: GraphDefinition,
    previousGraph?: GraphDefinition,
    previousResults?: Record<string, ExecutionResult>,
    options?: IncrementalExecutionOptions
  ): Promise<ExecutionResponse>;
}
```

### 2. Advanced Visualization

#### Execution Timeline
```typescript
interface TimelineEvent {
  nodeId: string;
  nodeName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed';
  dependencies: string[];
}

interface ExecutionTimeline {
  events: TimelineEvent[];
  totalDuration: number;
  parallelExecution: boolean;
}
```

#### Performance Metrics
```typescript
interface NodePerformanceMetrics {
  nodeId: string;
  nodeName: string;
  executionCount: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
  lastExecutionTime?: number;
}

interface GraphPerformanceMetrics {
  nodes: Record<string, NodePerformanceMetrics>;
  totalExecutions: number;
  averageGraphExecutionTime: number;
}
```

#### Data Flow Graph
```typescript
interface DataFlowNode {
  nodeId: string;
  nodeName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  executionTime: number;
}

interface DataFlowEdge {
  fromNode: string;
  toNode: string;
  fromPort: string;
  toPort: string;
  data: unknown;
  transferTime: number;
}

interface DataFlowGraph {
  nodes: DataFlowNode[];
  edges: DataFlowEdge[];
  executionId: string;
  timestamp: number;
}
```

## Data Flow

### Incremental Execution Flow

1. **Change Detection**
   ```
   User modifies graph
   → ChangeDetector.detectChanges()
   → Returns list of changed nodes
   → Calculate affected subgraph
   ```

2. **Cache Lookup**
   ```
   For each unchanged node:
   → Check cache with graph hash
   → If valid cache exists, use it
   → Otherwise, mark for execution
   ```

3. **Partial Execution**
   ```
   Execute only changed/affected nodes
   → Update cache with new results
   → Merge with cached results
   → Return complete execution response
   ```

### Visualization Data Flow

1. **Timeline Generation**
   ```
   Execution completes
   → Collect all node execution events
   → Sort by start time
   → Calculate dependencies
   → Generate timeline visualization
   ```

2. **Performance Metrics Collection**
   ```
   After each execution:
   → Update node metrics
   → Calculate averages
   → Store in performance store
   → Update visualization
   ```

## State Management

### Extended Graph Store

```typescript
interface GraphState {
  // ... existing state
  
  // Incremental execution
  previousGraphHash: string | null;
  cachedResults: Record<string, CachedResult>;
  changeHistory: NodeChange[];
  
  // Performance metrics
  performanceMetrics: GraphPerformanceMetrics;
  
  // Visualization
  executionTimeline: ExecutionTimeline | null;
  dataFlowGraph: DataFlowGraph | null;
  
  // Actions
  detectGraphChanges: () => NodeChange[];
  getCachedResult: (nodeId: string) => CachedResult | null;
  setCachedResult: (nodeId: string, result: ExecutionResult) => void;
  invalidateCache: (nodeId?: string) => void;
  updatePerformanceMetrics: (nodeId: string, metrics: Partial<NodePerformanceMetrics>) => void;
  setExecutionTimeline: (timeline: ExecutionTimeline) => void;
  setDataFlowGraph: (graph: DataFlowGraph) => void;
}
```

## API Design

### Incremental Execution Endpoint

**POST /api/graphs/execute-incremental**

Request:
```typescript
{
  graph: GraphDefinition;
  previousGraph?: GraphDefinition;
  previousResults?: Record<string, ExecutionResult>;
  inputs?: Record<string, Record<string, unknown>>;
  options?: {
    useCache?: boolean;
    cacheTTL?: number;
    parallel?: boolean;
  };
}
```

Response:
```typescript
{
  success: boolean;
  results: Record<string, ExecutionResult>;
  cachedNodes: string[]; // Nodes that used cached results
  executedNodes: string[]; // Nodes that were actually executed
  executionTime: number;
  cacheHitRate: number;
  logs: string[];
}
```

## Component Specifications

### 1. ExecutionTimeline Component

**Location**: `components/graph/ExecutionTimeline.tsx`

**Features**:
- Visual timeline of node execution
- Dependency visualization
- Parallel execution detection
- Interactive hover details
- Zoom/pan controls

### 2. PerformanceMetrics Component

**Location**: `components/graph/PerformanceMetrics.tsx`

**Features**:
- Node performance table
- Execution statistics
- Success rate visualization
- Performance charts
- Export metrics

### 3. DataFlowGraph Component

**Location**: `components/graph/DataFlowGraph.tsx`

**Features**:
- Visual data flow representation
- Node input/output visualization
- Connection data display
- Interactive exploration
- Export data flow

### 4. IncrementalExecutor Service

**Location**: `services/incrementalExecutionService.ts`

**Methods**:
```typescript
class IncrementalExecutionService {
  detectChanges(
    previous: GraphDefinition,
    current: GraphDefinition
  ): NodeChange[];
  
  executeIncremental(
    graph: GraphDefinition,
    previousGraph?: GraphDefinition,
    options?: IncrementalExecutionOptions
  ): Promise<ExecutionResponse>;
  
  getAffectedSubgraph(
    changes: NodeChange[],
    graph: GraphDefinition
  ): GraphDefinition;
}
```

## Performance Considerations

### Caching Strategy
- Hash-based cache keys (node + dependencies)
- TTL-based expiration
- LRU eviction for large caches
- Cache invalidation on graph changes

### Change Detection
- Deep comparison of node properties
- Connection change detection
- Dependency graph analysis
- Efficient diff algorithm

### Visualization Performance
- Virtualized timeline rendering
- Throttled metric updates
- Lazy loading of data flow graphs
- Memoized calculations

## Security Considerations

### Cache Validation
- Verify cache integrity
- Validate graph hash matches
- Prevent stale cache usage
- Sanitize cached data

## Testing Strategy

### Unit Tests
- Change detection logic
- Cache management
- Incremental execution
- Timeline generation
- Performance metrics calculation

### Integration Tests
- End-to-end incremental execution
- Cache hit/miss scenarios
- Visualization data accuracy
- Performance under load

### Performance Tests
- Large graph incremental execution
- Cache efficiency
- Visualization rendering performance
- Memory usage

## Migration Path

1. Add change detection to store (non-breaking)
2. Add cache management (non-breaking)
3. Add incremental execution API (new endpoint)
4. Add visualization components (new components)
5. Update ExecutionToolbar to use incremental execution
6. Add performance metrics collection

## Success Criteria

- ✅ Incremental execution reduces execution time by 50%+ for unchanged nodes
- ✅ Cache hit rate > 80% for repeated executions
- ✅ Timeline visualization renders smoothly (60fps)
- ✅ Performance metrics accurate and up-to-date
- ✅ Data flow graph interactive and responsive
- ✅ No memory leaks in long-running sessions
- ✅ Change detection accurate and fast (< 10ms for 100 nodes)


