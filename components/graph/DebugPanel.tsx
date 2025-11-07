'use client';

/**
 * Debug Panel Component
 * 
 * Provides debugging features: breakpoints, step execution, variable inspection
 */

import { useState } from 'react';
import { Play, Pause, StepForward, X, Bug } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function DebugPanel({ isOpen, onClose, position }: DebugPanelProps) {
  const {
    nodes,
    breakpoints,
    isPaused,
    stepMode,
    execution,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    pauseExecution,
    resumeExecution,
    stepExecution,
  } = useGraphStore();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasBreakpoints = Object.keys(breakpoints).length > 0;
  const isExecuting = execution.isExecuting;

  return (
    <div
      className="fixed bg-white shadow-2xl border-2 border-gray-300 z-50 w-80 max-h-[500px] flex flex-col"
      style={{
        left: position?.x ?? 'auto',
        top: position?.y ?? 'auto',
        right: position ? 'auto' : '1rem',
        bottom: position ? 'auto' : '1rem',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Debug Panel</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      {isExecuting && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <button
            onClick={isPaused ? resumeExecution : pauseExecution}
            className="p-2 hover:bg-gray-100 transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={stepExecution}
            disabled={!isPaused}
            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Step Forward"
          >
            <StepForward className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 ml-auto">
            {isPaused ? 'Paused' : 'Running'}
          </span>
        </div>
      )}

      {/* Breakpoints */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-700">Breakpoints</h4>
          <span className="text-xs text-gray-500">
            {Object.keys(breakpoints).length} active
          </span>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-4">No nodes in graph</div>
        ) : (
          <div className="space-y-1">
            {nodes.map((node) => {
              const breakpoint = breakpoints[node.id];
              const nodeState = execution.nodeStates[node.id];
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  className={`flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                >
                  <input
                    type="checkbox"
                    checked={breakpoint?.enabled ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (breakpoint) {
                        toggleBreakpoint(node.id);
                      } else {
                        addBreakpoint(node.id);
                      }
                    }}
                    className="w-4 h-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-700 flex-1">{node.name}</span>
                  {breakpoint && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBreakpoint(node.id);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove Breakpoint"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {nodeState && (
                    <span
                      className={`text-xs px-1.5 py-0.5 ${
                        nodeState.status === 'executing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : nodeState.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : nodeState.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {nodeState.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasBreakpoints && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Breakpoints will pause execution before the node executes. Use step forward to
              continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

