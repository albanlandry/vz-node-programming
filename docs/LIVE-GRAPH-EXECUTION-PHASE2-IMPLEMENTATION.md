# Live Graph Execution Phase 2 - Implementation Guide

## Implementation Overview

This document provides detailed implementation steps for Phase 2 features.

## 1. Real-time Streaming (SSE)

### 1.1 Backend SSE Endpoint

**File**: `app/api/graphs/execute-stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { GraphExecutionEngine } from '../../../../src/graph-management';
import type { GraphDefinition, ExecutionRequest } from '../../../../src/graph-management/types';
import { logger } from '../../../../src/utils/Logger';
import { NodeExecutor } from '../../../../src/core/NodeExecutor';
import { NodeEventType } from '../../../../src/core/NodeExecutor';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { graph, inputs, options } = body as {
    graph: GraphDefinition;
    inputs?: Record<string, Record<string, unknown>>;
    options?: { parallel?: boolean; timeout?: number; breakpoints?: string[]; stepMode?: boolean };
  };

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        const engine = new GraphExecutionEngine();
        const executor = await engine['buildExecutor'](graph);
        
        // Set up event listeners
        executor.on(NodeEventType.EXECUTION_STARTED, (data) => {
          sendEvent('execution:started', {
            executionId: data.executionId,
            timestamp: Date.now(),
          });
        });

        executor.on(NodeEventType.NODE_QUEUED, (data) => {
          sendEvent('node:queued', {
            nodeId: data.nodeId,
            timestamp: Date.now(),
          });
        });

        executor.on(NodeEventType.EXECUTION_STARTED, (data) => {
          sendEvent('node:executing', {
            nodeId: data.nodeId,
            timestamp: Date.now(),
          });
        });

        executor.on(NodeEventType.EXECUTION_COMPLETED, (data) => {
          sendEvent('node:completed', {
            nodeId: data.nodeId,
            result: data.result,
            executionTime: data.result?.executionTime,
            timestamp: Date.now(),
          });
        });

        executor.on(NodeEventType.EXECUTION_FAILED, (data) => {
          sendEvent('node:failed', {
            nodeId: data.nodeId,
            error: data.error,
            timestamp: Date.now(),
          });
        });

        // Execute graph
        const initialInputs = new Map<string, Map<string, unknown>>();
        if (inputs) {
          for (const [nodeId, nodeInputs] of Object.entries(inputs)) {
            const inputMap = new Map<string, unknown>();
            for (const [portId, value] of Object.entries(nodeInputs)) {
              inputMap.set(portId, value);
            }
            initialInputs.set(nodeId, inputMap);
          }
        }

        const parallel = options?.parallel ?? false;
        const results = parallel
          ? await executor.executeParallel(initialInputs)
          : await executor.execute(initialInputs);

        // Send final results
        sendEvent('execution:completed', {
          results: Object.fromEntries(results),
          timestamp: Date.now(),
        });

        controller.close();
      } catch (error) {
        sendEvent('execution:error', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 1.2 Frontend SSE Client Service

**File**: `services/streamingExecutionService.ts`

```typescript
import type { GraphDefinition } from '../src/graph-management/types';

export type ExecutionEventType =
  | 'execution:started'
  | 'node:queued'
  | 'node:executing'
  | 'node:completed'
  | 'node:failed'
  | 'connection:data'
  | 'execution:completed'
  | 'execution:error';

export interface ExecutionEvent {
  type: ExecutionEventType;
  data: unknown;
  timestamp: number;
}

export interface ExecutionOptions {
  parallel?: boolean;
  timeout?: number;
  breakpoints?: string[];
  stepMode?: boolean;
}

export class StreamingExecutionService {
  private eventSource: EventSource | null = null;
  private eventListeners: Map<ExecutionEventType, Set<(event: ExecutionEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async executeStream(
    graph: GraphDefinition,
    inputs?: Record<string, Record<string, unknown>>,
    options?: ExecutionOptions,
  ): Promise<EventSource> {
    // Close existing connection
    this.close();

    // Create new EventSource
    const url = new URL('/api/graphs/execute-stream', window.location.origin);
    const eventSource = new EventSource(url.toString(), {
      withCredentials: false,
    });

    // Send POST request with graph data
    // Note: EventSource doesn't support POST, so we need to use fetch + ReadableStream
    const response = await fetch('/api/graphs/execute-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ graph, inputs, options }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start execution: ${response.statusText}`);
    }

    // Read SSE stream from response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          let eventType: ExecutionEventType | null = null;
          let eventData: string | null = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.substring(7).trim() as ExecutionEventType;
            } else if (line.startsWith('data: ')) {
              eventData = line.substring(6).trim();
            } else if (line === '' && eventType && eventData) {
              // Complete event
              try {
                const data = JSON.parse(eventData);
                this.emit(eventType, {
                  type: eventType,
                  data,
                  timestamp: Date.now(),
                });
              } catch (error) {
                console.error('Failed to parse event data:', error);
              }
              eventType = null;
              eventData = null;
            }
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
        this.emit('execution:error', {
          type: 'execution:error',
          data: { error: error instanceof Error ? error.message : String(error) },
          timestamp: Date.now(),
        });
      }
    };

    processStream();

    this.eventSource = eventSource as unknown as EventSource;
    return eventSource as unknown as EventSource;
  }

  on(eventType: ExecutionEventType, callback: (event: ExecutionEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  off(eventType: ExecutionEventType, callback: (event: ExecutionEvent) => void): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }

  private emit(eventType: ExecutionEventType, event: ExecutionEvent): void {
    this.eventListeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempts = 0;
  }

  cancel(): void {
    this.close();
  }
}

export const streamingExecutionService = new StreamingExecutionService();
```

## 2. Input Configuration Panel

### 2.1 Store Extension

**File**: `store/graphStore.ts` (extend existing)

```typescript
// Add to GraphState interface
interface GraphState {
  // ... existing state
  
  // Input configuration
  inputConfig: Record<string, Record<string, unknown>>;
  inputTemplates: InputTemplate[];
  
  // Actions
  setInputValue: (nodeId: string, portId: string, value: unknown) => void;
  clearInputConfig: () => void;
  saveInputTemplate: (name: string) => void;
  loadInputTemplate: (name: string) => void;
}

// Add to store implementation
setInputValue: (nodeId, portId, value) => {
  set((state) => ({
    inputConfig: {
      ...state.inputConfig,
      [nodeId]: {
        ...(state.inputConfig[nodeId] || {}),
        [portId]: value,
      },
    },
  }));
},

clearInputConfig: () => {
  set({ inputConfig: {} });
},
```

### 2.2 InputConfigPanel Component

**File**: `components/graph/InputConfigPanel.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import type { Port, DataType } from '../../src/types';

interface InputConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function InputConfigPanel({ isOpen, onClose, position }: InputConfigPanelProps) {
  const { nodes, inputConfig, setInputValue } = useGraphStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get nodes that require external inputs
  const nodesWithInputs = nodes.filter((node) => {
    // Nodes with input ports that don't have connections
    return node.inputs.some((input) => {
      const hasConnection = useGraphStore
        .getState()
        .connections.some((conn) => conn.toNode === node.id && conn.toPort === input.id);
      return !hasConnection && input.required;
    });
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderInputEditor = (nodeId: string, port: Port) => {
    const currentValue = inputConfig[nodeId]?.[port.id];
    const dataType = port.dataType.name;

    const handleChange = (value: unknown) => {
      setInputValue(nodeId, port.id, value);
    };

    switch (dataType) {
      case 'string':
        return (
          <input
            type="text"
            value={(currentValue as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(currentValue as number) ?? ''}
            onChange={(e) => handleChange(Number.parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(currentValue as boolean) ?? false}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{port.name}</span>
          </label>
        );
      case 'object':
      case 'array':
        return (
          <textarea
            value={JSON.stringify(currentValue || (dataType === 'array' ? [] : {}), null, 2)}
            onChange={(e) => {
              try {
                handleChange(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, keep as is
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 text-sm font-mono"
            rows={4}
            placeholder={`Enter ${port.name} as JSON...`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={String(currentValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bg-white shadow-2xl border-2 border-gray-300 z-50 w-96 max-h-[600px] flex flex-col"
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Input Configuration</h3>
        <button onClick={onClose} className="p-1 hover:bg-blue-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nodesWithInputs.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No nodes require external inputs
          </div>
        ) : (
          nodesWithInputs.map((node) => {
            const requiredInputs = node.inputs.filter((input) => {
              const hasConnection = useGraphStore
                .getState()
                .connections.some((conn) => conn.toNode === node.id && conn.toPort === input.id);
              return !hasConnection && input.required;
            });

            if (requiredInputs.length === 0) return null;

            const isExpanded = expandedNodes.has(node.id);

            return (
              <div key={node.id} className="border border-gray-200">
                <button
                  onClick={() => toggleNode(node.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-sm text-gray-900">{node.name}</span>
                  <span className="text-xs text-gray-500">
                    {isExpanded ? '▼' : '▶'} {requiredInputs.length} inputs
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-200">
                    {requiredInputs.map((input) => (
                      <div key={input.id}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {input.name}
                          <span className="text-gray-500 ml-1">({input.dataType.name})</span>
                        </label>
                        {renderInputEditor(node.id, input)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

## 3. Data Flow Visualization

### 3.1 Connection State Management

**File**: `store/graphStore.ts` (extend)

```typescript
interface ConnectionState {
  connectionId: string;
  status: 'idle' | 'active' | 'error';
  data?: unknown;
  animationProgress?: number;
}

interface GraphState {
  // ... existing
  connectionStates: Record<string, ConnectionState>;
  showDataFlow: boolean;
  showConnectionValues: boolean;
  
  updateConnectionState: (connectionId: string, state: Partial<ConnectionState>) => void;
  setShowDataFlow: (show: boolean) => void;
  setShowConnectionValues: (show: boolean) => void;
}
```

### 3.2 DataFlowVisualization Component

**File**: `components/graph/DataFlowVisualization.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useGraphStore } from '../../store/graphStore';

export default function DataFlowVisualization() {
  const { connections, connectionStates, showDataFlow, showConnectionValues } = useGraphStore();
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!showDataFlow) return;

    const animate = () => {
      // Update animation progress for active connections
      // This would be called during execution
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showDataFlow]);

  // This component would be integrated into ReactFlowCanvas
  // to overlay animated connections
  return null;
}
```

## 4. Debugging Features

### 4.1 Breakpoint System

**File**: `store/graphStore.ts` (extend)

```typescript
interface Breakpoint {
  nodeId: string;
  enabled: boolean;
  condition?: string;
}

interface GraphState {
  // ... existing
  breakpoints: Record<string, Breakpoint>;
  isPaused: boolean;
  stepMode: boolean;
  currentStepNodeId: string | null;
  
  addBreakpoint: (nodeId: string, condition?: string) => void;
  removeBreakpoint: (nodeId: string) => void;
  toggleBreakpoint: (nodeId: string) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stepExecution: () => void;
}
```

### 4.2 DebugPanel Component

**File**: `components/graph/DebugPanel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Play, Pause, StepForward, X } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';

export default function DebugPanel() {
  const {
    nodes,
    breakpoints,
    isPaused,
    stepMode,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    pauseExecution,
    resumeExecution,
    stepExecution,
  } = useGraphStore();

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl border-2 border-gray-300 z-50 w-80 max-h-[400px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Debug Panel</h3>
        <button className="p-1 hover:bg-purple-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={isPaused ? resumeExecution : pauseExecution}
          className="p-2 hover:bg-gray-100 transition-colors"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button
          onClick={stepExecution}
          disabled={!isPaused}
          className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <StepForward className="w-4 h-4" />
        </button>
      </div>

      {/* Breakpoints */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Breakpoints</h4>
        {nodes.map((node) => {
          const breakpoint = breakpoints[node.id];
          return (
            <div key={node.id} className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={breakpoint?.enabled ?? false}
                onChange={() => {
                  if (breakpoint) {
                    toggleBreakpoint(node.id);
                  } else {
                    addBreakpoint(node.id);
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-700 flex-1">{node.name}</span>
              {breakpoint && (
                <button
                  onClick={() => removeBreakpoint(node.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Integration Points

### Update ExecutionToolbar

**File**: `components/graph/ExecutionToolbar.tsx` (modify)

- Add streaming execution support
- Add input config panel toggle
- Add debug panel toggle
- Add data flow visualization toggle

### Update ReactFlowCanvas

**File**: `components/graph/ReactFlowCanvas.tsx` (modify)

- Integrate DataFlowVisualization
- Show connection states
- Display connection values when enabled

## Testing

See `LIVE-GRAPH-EXECUTION-PHASE2-TESTS.md` for detailed test specifications.

