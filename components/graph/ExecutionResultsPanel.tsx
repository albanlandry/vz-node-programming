'use client';

/**
 * Execution Results Panel Component
 * 
 * Floating panel that displays execution results for all nodes in the graph.
 * Shows output values, execution times, and errors.
 */

import { useState, useEffect } from 'react';
import { X, GripVertical, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import type { ExecutionResult } from '../../src/types';

const STORAGE_KEY = 'executionResultsPanelPosition';

export default function ExecutionResultsPanel() {
  const { execution, nodes } = useGraphStore();
  const [position, setPosition] = useState({ x: 0, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load position from localStorage on mount and set initial position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set initial position based on window width if not saved
      const defaultX = window.innerWidth - 420;
      
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { x: number; y: number };
          if (parsed.x !== undefined && parsed.y !== undefined) {
            setPosition({ x: parsed.x, y: parsed.y });
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load panel position from localStorage:', error);
      }
      
      // If no saved position, use default
      setPosition({ x: defaultX, y: 100 });
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (!isDragging && typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch (error) {
          console.warn('Failed to save panel position to localStorage:', error);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [position, isDragging]);

  /**
   * Handle drag start
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, select, textarea, button, .expandable')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  /**
   * Handle drag
   */
  useEffect(() => {
    if (!isDragging || typeof window === 'undefined') return;

    let currentPosition = position;

    const handleMouseMove = (e: MouseEvent) => {
      currentPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(currentPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPosition));
        } catch (error) {
          console.warn('Failed to save panel position to localStorage:', error);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  /**
   * Toggle node expansion
   */
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

  /**
   * Format value for display
   */
  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return 'null';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  /**
   * Get entries from outputs (handles both Map and plain object)
   */
  const getOutputEntries = (outputs: Map<string, unknown> | Record<string, unknown> | undefined): Array<[string, unknown]> => {
    if (!outputs) {
      return [];
    }
    
    // Check if it's a Map
    if (outputs instanceof Map) {
      return Array.from(outputs.entries());
    }
    
    // Otherwise, treat as plain object
    return Object.entries(outputs);
  };

  /**
   * Render execution result for a node
   */
  const renderNodeResult = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const result = execution.results[nodeId];
    const error = execution.errors[nodeId];
    const nodeState = execution.nodeStates[nodeId];
    const isExpanded = expandedNodes.has(nodeId);
    const hasResult = result !== undefined || error !== undefined;

    if (!hasResult && (!nodeState || nodeState.status === 'idle')) {
      return null;
    }

    const status = nodeState?.status || 'idle';

    return (
      <div key={nodeId} className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleNode(nodeId)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors expandable"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <span className="font-medium text-sm text-gray-900 truncate">{node.name}</span>
            {status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            {status === 'failed' && (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            {status === 'executing' && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {nodeState?.executionTime && (
              <span className="text-xs text-gray-500 ml-auto">
                {nodeState.executionTime}ms
              </span>
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-2">
            {/* Execution Status */}
            <div className="text-xs text-gray-600">
              Status: <span className="font-semibold capitalize">{status}</span>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-red-900">Error</div>
                    <div className="text-xs text-red-700 mt-1">{error.message}</div>
                    {error.portId && (
                      <div className="text-xs text-red-600 mt-1">Port: {error.portId}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Output Values */}
            {result && result.success && result.outputs && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Outputs:</div>
                {getOutputEntries(result.outputs as Map<string, unknown> | Record<string, unknown>).map(([portId, value]) => {
                  const outputPort = node.outputs.find((p) => p.id === portId);
                  return (
                    <div key={portId} className="bg-gray-50 rounded p-2 border border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {outputPort?.name || portId}
                        {outputPort && (
                          <span className="text-gray-500 ml-1">
                            ({outputPort.dataType.name})
                          </span>
                        )}
                      </div>
                      <pre className="text-xs text-gray-800 font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-32 overflow-y-auto">
                        {formatValue(value)}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Execution Time */}
            {nodeState?.executionTime && (
              <div className="text-xs text-gray-500">
                Execution time: {nodeState.executionTime}ms
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Don't show panel if no execution has occurred
  if (execution.executionTime === 0 && !execution.isExecuting && Object.keys(execution.results).length === 0) {
    return null;
  }

  const hasErrors = Object.keys(execution.errors).length > 0;
  const successCount = Object.values(execution.results).filter((r) => r?.success).length;
  const totalCount = Object.keys(execution.results).length;

  return (
    <div
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-50 w-96 max-h-[600px] flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div
        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-75" />
          <h3 className="font-semibold text-sm">Execution Results</h3>
        </div>
        <button
          onClick={() => useGraphStore.getState().clearExecutionState()}
          className="p-1 rounded hover:bg-purple-700 transition-colors"
          title="Clear Results"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {execution.isExecuting ? (
              <span className="text-blue-600 font-semibold">Executing...</span>
            ) : (
              <>
                <span className="text-green-600">
                  ✓ {successCount} succeeded
                </span>
                {hasErrors && (
                  <span className="text-red-600">
                    ✗ {Object.keys(execution.errors).length} failed
                  </span>
                )}
              </>
            )}
          </div>
          {execution.executionTime > 0 && (
            <span className="text-gray-600">
              {execution.executionTime}ms
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {nodes.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No nodes in graph
          </div>
        ) : (
          <div className="space-y-1">
            {nodes.map((node) => renderNodeResult(node.id))}
          </div>
        )}
      </div>
    </div>
  );
}

