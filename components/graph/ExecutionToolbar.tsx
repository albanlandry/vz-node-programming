'use client';

/**
 * Execution Toolbar Component
 * 
 * Provides controls for executing graphs in the Graph Editor.
 * Includes play/stop buttons, execution mode toggle, and status display.
 */

import { useState, useEffect } from 'react';
import { Play, Square, Loader2, CheckCircle2, XCircle, Clock, Settings, Bug, Eye, BarChart3, Network } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import { graphExecutionService } from '../../services/graphExecutionService';
import { streamingExecutionService } from '../../services/streamingExecutionService';
import { incrementalExecutionService } from '../../services/incrementalExecutionService';
import type { NodeError, ExecutionResult } from '../../src/types';
import type { SerializedExecutionResult } from '../../src/graph-management/types';
import InputConfigPanel from './InputConfigPanel';
import DebugPanel from './DebugPanel';
import ExecutionTimeline from './ExecutionTimeline';
import PerformanceMetrics from './PerformanceMetrics';
import DataFlowGraph from './DataFlowGraph';

/**
 * Convert SerializedExecutionResult to ExecutionResult
 */
function deserializeResult(serialized: SerializedExecutionResult): ExecutionResult {
  return {
    success: serialized.success,
    outputs: serialized.outputs ? new Map(Object.entries(serialized.outputs)) : undefined,
    error: serialized.error,
    executionTime: serialized.executionTime,
  };
}

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
  const [useStreaming, setUseStreaming] = useState(true);
  const [useIncremental, setUseIncremental] = useState(true);
  const [showInputPanel, setShowInputPanel] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showDataFlowGraph, setShowDataFlowGraph] = useState(false);
  const {
    inputConfig,
    showDataFlow,
    setShowDataFlow,
    setShowConnectionValues,
    showConnectionValues,
    previousGraphHash,
    setPreviousGraphHash,
    updatePerformanceMetrics,
    setExecutionTimeline,
    saveGraph,
  } = useGraphStore();

  /**
   * Generate graph hash for change detection
   */
  const generateGraphHash = (graph: any): string => {
    const graphString = JSON.stringify({
      nodes: graph.data.nodes.map((n: any) => ({
        id: n.id,
        type: n.type,
        properties: n.properties,
        inputs: n.inputs,
        outputs: n.outputs,
      })),
      connections: graph.data.connections,
    });
    let hash = 0;
    for (let i = 0; i < graphString.length; i++) {
      const char = graphString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  /**
   * Handle execution start with streaming and incremental support
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

      // Get previous graph for incremental execution
      const currentHash = generateGraphHash(graphDefinition);
      const previousGraphData = previousGraphHash ? saveGraph() : undefined;
      const previousGraphDefinition = previousGraphData
        ? graphExecutionService.convertToGraphDefinition(previousGraphData, 'Previous Execution')
        : undefined;

      if (useIncremental && previousGraphDefinition && previousGraphHash !== currentHash) {
        // Use incremental execution
        await handleIncrementalExecution(graphDefinition, previousGraphDefinition);
      } else if (useStreaming) {
        // Use streaming execution
        await handleStreamingExecution(graphDefinition);
      } else {
        // Use regular execution
        await handleRegularExecution(graphDefinition);
      }

      // Update graph hash
      setPreviousGraphHash(currentHash);

      // Generate timeline and update metrics
      generateTimeline();
      updatePerformanceMetricsFromExecution();
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
   * Handle incremental execution
   */
  const handleIncrementalExecution = async (
    currentGraph: any,
    previousGraph: any,
  ) => {
    const result = await incrementalExecutionService.executeIncremental(
      currentGraph,
      previousGraph,
      execution.results,
      inputConfig,
      {
        useCache: true,
        parallel: executionMode === 'parallel',
      },
    );

    // Update execution state with results
    if (result.results) {
      // Convert SerializedExecutionResult to ExecutionResult
      const executionResults: Record<string, ExecutionResult> = {};
      Object.entries(result.results).forEach(([nodeId, serializedResult]) => {
        executionResults[nodeId] = deserializeResult(serializedResult);
      });
      setExecutionResults(executionResults);
      
      // Update node states
      Object.entries(executionResults).forEach(([nodeId, execResult]) => {
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

    setExecutionTime(result.executionTime);
    stopExecution();
  };

  /**
   * Generate execution timeline
   */
  const generateTimeline = () => {
    const timelineEvents: import('../../store/graphStore').TimelineEvent[] = [];
    const parallelExecution = executionMode === 'parallel';

    nodes.forEach((node) => {
      const nodeState = execution.nodeStates[node.id];
      if (nodeState && nodeState.startTime && nodeState.endTime) {
        const dependencies = connections
          .filter((conn) => conn.toNode === node.id)
          .map((conn) => conn.fromNode);

        timelineEvents.push({
          nodeId: node.id,
          nodeName: node.name,
          startTime: nodeState.startTime!,
          endTime: nodeState.endTime!,
          duration: nodeState.endTime! - nodeState.startTime!,
          status: nodeState.status === 'completed' ? 'completed' : 'failed',
          dependencies,
        });
      }
    });

    if (timelineEvents.length > 0) {
      const minTime = Math.min(...timelineEvents.map((e) => e.startTime));
      const maxTime = Math.max(...timelineEvents.map((e) => e.endTime));
      setExecutionTimeline({
        events: timelineEvents.sort((a, b) => a.startTime - b.startTime),
        totalDuration: maxTime - minTime,
        parallelExecution,
      });
    }
  };

  /**
   * Update performance metrics from execution
   */
  const updatePerformanceMetricsFromExecution = () => {
    nodes.forEach((node) => {
      const nodeState = execution.nodeStates[node.id];
      if (nodeState?.executionTime !== undefined) {
        updatePerformanceMetrics(node.id, {
          lastExecutionTime: nodeState.executionTime,
          successRate: nodeState.status === 'completed' ? 1 : 0,
        });
      }
    });
  };

  /**
   * Handle streaming execution
   */
  const handleStreamingExecution = async (graphDefinition: any) => {
    // Set up event listeners
    const handleNodeExecuting = (event: any) => {
      const { nodeId } = event.data;
      updateNodeExecutionState(nodeId, { status: 'executing', startTime: Date.now() });
    };

    const handleNodeCompleted = (event: any) => {
      const { nodeId, result, executionTime } = event.data;
      if (result) {
        setExecutionResults({ [nodeId]: result });
        updateNodeExecutionState(nodeId, {
          status: 'completed',
          endTime: Date.now(),
          executionTime: executionTime || result.executionTime,
        });
      }
    };

    const handleNodeFailed = (event: any) => {
      const { nodeId, error } = event.data;
      if (error) {
        setExecutionErrors({ [nodeId]: error });
        updateNodeExecutionState(nodeId, {
          status: 'failed',
          endTime: Date.now(),
          error,
        });
      }
    };

    const handleExecutionCompleted = (event: any) => {
      const { executionTime, results } = event.data;
      if (results) {
        setExecutionResults(results);
      }
      setExecutionTime(executionTime);
      stopExecution();
    };

    const handleExecutionError = (event: any) => {
      console.error('Execution error:', event.data);
      stopExecution();
      clearExecutionState();
    };

    const handleExecutionStarted = (event: any) => {
      const { executionId } = event.data;
      if (executionId) {
        // Update executionId in store with the one from backend
        useGraphStore.getState().setExecutionId(executionId);
        console.log('Execution started with executionId from backend:', executionId);
      }
    };

    // Register event listeners
    streamingExecutionService.on('execution:started', handleExecutionStarted);
    streamingExecutionService.on('node:executing', handleNodeExecuting);
    streamingExecutionService.on('node:completed', handleNodeCompleted);
    streamingExecutionService.on('node:failed', handleNodeFailed);
    streamingExecutionService.on('execution:completed', handleExecutionCompleted);
    streamingExecutionService.on('execution:error', handleExecutionError);

    try {
      await streamingExecutionService.executeStream(
        graphDefinition,
        inputConfig,
        {
          parallel: executionMode === 'parallel',
          breakpoints: Object.keys(useGraphStore.getState().breakpoints).filter(
            (id) => useGraphStore.getState().breakpoints[id].enabled,
          ),
        },
      );
    } finally {
      // Clean up event listeners
      streamingExecutionService.off('execution:started', handleExecutionStarted);
      streamingExecutionService.off('node:executing', handleNodeExecuting);
      streamingExecutionService.off('node:completed', handleNodeCompleted);
      streamingExecutionService.off('node:failed', handleNodeFailed);
      streamingExecutionService.off('execution:completed', handleExecutionCompleted);
      streamingExecutionService.off('execution:error', handleExecutionError);
    }
  };

  /**
   * Handle regular (non-streaming) execution
   */
  const handleRegularExecution = async (graphDefinition: any) => {
    const result = await graphExecutionService.executeGraph(
      graphDefinition,
      inputConfig,
      { parallel: executionMode === 'parallel' },
    );

    // Update execution state with results
    if (result.results) {
      // Convert SerializedExecutionResult to ExecutionResult
      const executionResults: Record<string, ExecutionResult> = {};
      Object.entries(result.results).forEach(([nodeId, serializedResult]) => {
        executionResults[nodeId] = deserializeResult(serializedResult);
      });
      setExecutionResults(executionResults);
        
      // Update node states based on results
      Object.entries(executionResults).forEach(([nodeId, execResult]) => {
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
  };

  /**
   * Handle execution stop
   */
  const handleStop = () => {
    if (useStreaming) {
      streamingExecutionService.cancel();
    }
    stopExecution();
    clearExecutionState();
    setIsExecuting(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamingExecutionService.cancel();
    };
  }, []);

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
            className="group p-2 hover:bg-gray-100 transition-colors"
            title="Stop Execution"
          >
            <Square className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
          </button>
        ) : (
          <button
            onClick={handleExecute}
            disabled={!canExecute}
            className="group p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Execute Graph"
          >
            {isExecuting ? (
              <Loader2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 animate-spin" />
            ) : (
              <Play className="w-5 h-5 text-gray-600 group-hover:text-green-600 disabled:text-gray-300" />
            )}
          </button>
        )}

        {/* Feature Toggles */}
        <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
          <button
            onClick={() => setShowInputPanel(!showInputPanel)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showInputPanel ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
            }`}
            title="Input Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showDebugPanel ? 'bg-purple-50 text-purple-600' : 'text-gray-600'
            }`}
            title="Debug Panel"
          >
            <Bug className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDataFlow(!showDataFlow)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showDataFlow ? 'bg-green-50 text-green-600' : 'text-gray-600'
            }`}
            title="Data Flow Visualization"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showTimeline ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'
            }`}
            title="Execution Timeline"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showPerformanceMetrics ? 'bg-purple-50 text-purple-600' : 'text-gray-600'
            }`}
            title="Performance Metrics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDataFlowGraph(!showDataFlowGraph)}
            className={`p-2 hover:bg-gray-100 transition-colors ${
              showDataFlowGraph ? 'bg-teal-50 text-teal-600' : 'text-gray-600'
            }`}
            title="Data Flow Graph"
          >
            <Network className="w-4 h-4" />
          </button>
        </div>

        {/* Execution Mode Toggle */}
        <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
          <span className="text-xs text-gray-600 font-medium">Mode:</span>
          <button
            onClick={() => setExecutionMode('sequential')}
            disabled={isExecuting || execution.isExecuting}
            className={`px-3 py-1 text-xs transition-colors ${
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
            className={`px-3 py-1 text-xs transition-colors ${
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

      {/* Input Configuration Panel */}
      <InputConfigPanel
        isOpen={showInputPanel}
        onClose={() => setShowInputPanel(false)}
        position={{ x: 20, y: 100 }}
      />

      {/* Debug Panel */}
      <DebugPanel
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />

      {/* Execution Timeline */}
      <ExecutionTimeline
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
        position={{ x: 20, y: 150 }}
      />

      {/* Performance Metrics */}
      <PerformanceMetrics
        isOpen={showPerformanceMetrics}
        onClose={() => setShowPerformanceMetrics(false)}
        position={{ x: 20, y: 200 }}
      />

      {/* Data Flow Graph */}
      <DataFlowGraph
        isOpen={showDataFlowGraph}
        onClose={() => setShowDataFlowGraph(false)}
        position={{ x: 20, y: 250 }}
      />
    </div>
  );
}

