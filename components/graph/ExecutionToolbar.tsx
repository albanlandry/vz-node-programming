'use client';

/**
 * Execution Toolbar Component
 * 
 * Provides controls for executing graphs in the Graph Editor.
 * Includes play/stop buttons, execution mode toggle, and status display.
 */

import { useState } from 'react';
import { Play, Square, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import { graphExecutionService } from '../../services/graphExecutionService';
import type { NodeError } from '../../src/types';

export default function ExecutionToolbar() {
  const {
    nodes,
    connections,
    execution,
    startExecution,
    stopExecution,
    clearExecutionState,
    updateNodeExecutionState,
    setExecutionResults,
    setExecutionErrors,
    setExecutionTime,
  } = useGraphStore();

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'sequential' | 'parallel'>('sequential');

  /**
   * Handle execution start
   */
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('Cannot execute: Graph has no nodes');
      return;
    }

    try {
      setIsExecuting(true);
      
      // Initialize execution state
      startExecution(executionMode);
      
      // Convert graph to definition
      const graphData = useGraphStore.getState().saveGraph();
      const graphDefinition = graphExecutionService.convertToGraphDefinition(
        graphData,
        'Live Execution',
      );

      // Mark all nodes as queued
      nodes.forEach((node) => {
        updateNodeExecutionState(node.id, { status: 'queued' });
      });

      // Execute graph
      const result = await graphExecutionService.executeGraph(
        graphDefinition,
        undefined,
        { parallel: executionMode === 'parallel' },
      );

      // Update execution state with results
      if (result.results) {
        setExecutionResults(result.results);
        
        // Update node states based on results
        Object.entries(result.results).forEach(([nodeId, execResult]) => {
          if (execResult.success) {
            updateNodeExecutionState(nodeId, {
              status: 'completed',
              endTime: Date.now(),
              executionTime: execResult.executionTime,
            });
          } else {
            updateNodeExecutionState(nodeId, {
              status: 'failed',
              endTime: Date.now(),
              executionTime: execResult.executionTime,
              error: execResult.error,
            });
          }
        });
      }

      // Set errors if any
      if (result.errors && result.errors.length > 0) {
        const errorsMap: Record<string, NodeError> = {};
        result.errors.forEach((error) => {
          if (error.nodeId) {
            errorsMap[error.nodeId] = error;
          }
        });
        setExecutionErrors(errorsMap);
      }

      // Set execution time
      setExecutionTime(result.executionTime);

      // Stop execution
      stopExecution();
    } catch (error) {
      console.error('Execution error:', error);
      alert(`Execution failed: ${error instanceof Error ? error.message : String(error)}`);
      stopExecution();
      clearExecutionState();
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Handle execution stop
   */
  const handleStop = () => {
    stopExecution();
    clearExecutionState();
    setIsExecuting(false);
  };

  /**
   * Get execution status
   */
  const getExecutionStatus = () => {
    if (isExecuting || execution.isExecuting) {
      return 'executing';
    }
    
    if (execution.executionTime > 0) {
      const hasErrors = Object.keys(execution.errors).length > 0;
      return hasErrors ? 'error' : 'success';
    }
    
    return 'idle';
  };

  const status = getExecutionStatus();
  const canExecute = nodes.length > 0 && !isExecuting && !execution.isExecuting;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Play/Stop Button */}
        {status === 'executing' ? (
          <button
            onClick={handleStop}
            className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Stop Execution"
          >
            <Square className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
          </button>
        ) : (
          <button
            onClick={handleExecute}
            disabled={!canExecute}
            className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Execute Graph"
          >
            {isExecuting ? (
              <Loader2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 animate-spin" />
            ) : (
              <Play className="w-5 h-5 text-gray-600 group-hover:text-green-600 disabled:text-gray-300" />
            )}
          </button>
        )}

        {/* Execution Mode Toggle */}
        <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
          <span className="text-xs text-gray-600 font-medium">Mode:</span>
          <button
            onClick={() => setExecutionMode('sequential')}
            disabled={isExecuting || execution.isExecuting}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              executionMode === 'sequential'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Sequential
          </button>
          <button
            onClick={() => setExecutionMode('parallel')}
            disabled={isExecuting || execution.isExecuting}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              executionMode === 'parallel'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Parallel
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="flex items-center gap-4">
        {/* Execution Status */}
        {status !== 'idle' && (
          <div className="flex items-center gap-2">
            {status === 'executing' && (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs text-gray-600">Executing...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Completed</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-gray-600">Error</span>
              </>
            )}
          </div>
        )}

        {/* Execution Time */}
        {execution.executionTime > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{execution.executionTime}ms</span>
          </div>
        )}

        {/* Node Count */}
        <div className="text-xs text-gray-600">
          Nodes: {nodes.length} | Connections: {connections.length}
        </div>
      </div>
    </div>
  );
}

