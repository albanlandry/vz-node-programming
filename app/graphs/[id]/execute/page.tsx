'use client';

/**
 * Graph Execution Page
 * 
 * Page for executing a saved graph and viewing results.
 * Displays graph information, execution options, and results.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Square, Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

import PageContainer from '../../../../components/layout/PageContainer';
import PageHeader from '../../../../components/layout/PageHeader';
import ContentCard from '../../../../components/layout/ContentCard';
import LoadingState from '../../../../components/layout/LoadingState';
import ErrorAlert from '../../../../components/layout/ErrorAlert';
import type { GraphDefinition, ExecutionResponse } from '../../../../src/graph-management/types';
import type { ExecutionResult, NodeError } from '../../../../src/types';

export default function GraphExecutePage() {
  const params = useParams();
  const router = useRouter();
  const graphId = params.id as string;

  const [graph, setGraph] = useState<GraphDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [executionMode, setExecutionMode] = useState<'sequential' | 'parallel'>('sequential');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  /**
   * Load graph data
   */
  useEffect(() => {
    if (graphId) {
      void fetchGraph();
    }
  }, [graphId]);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/graphs/${graphId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Graph not found');
        }
        throw new Error('Failed to fetch graph');
      }
      const data = await response.json();
      setGraph(data.graph as GraphDefinition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute graph
   */
  const handleExecute = async () => {
    if (!graph) return;

    try {
      setExecuting(true);
      setExecutionResult(null);

      const response = await fetch(`/api/graphs/${graphId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          options: {
            parallel: executionMode === 'parallel',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Execution failed');
      }

      const data = await response.json();
      setExecutionResult(data.result as ExecutionResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
      const errorResult: ExecutionResponse = {
        success: false,
        errors: [{
          message: err instanceof Error ? err.message : 'Unknown error',
          nodeId: '',
        } as NodeError],
        executionTime: 0,
      };
      setExecutionResult(errorResult);
    } finally {
      setExecuting(false);
    }
  };

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
  const renderNodeResult = (nodeId: string, result: ExecutionResult) => {
    if (!graph) return null;

    const node = graph.data.nodes.find((n: { id: string }) => n.id === nodeId);
    if (!node) return null;

    const isExpanded = expandedNodes.has(nodeId);
    const hasError = !result.success && result.error;

    return (
      <div key={nodeId} className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleNode(nodeId)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-medium text-sm text-gray-900 truncate">{node.name}</span>
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            {result.executionTime && (
              <span className="text-xs text-gray-500 ml-auto">
                {result.executionTime}ms
              </span>
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-2">
            {/* Error Display */}
            {hasError && result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-red-900">Error</div>
                    <div className="text-xs text-red-700 mt-1">{result.error.message}</div>
                    {result.error.portId && (
                      <div className="text-xs text-red-600 mt-1">Port: {result.error.portId}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Output Values */}
            {result.success && result.outputs && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Outputs:</div>
                {getOutputEntries(result.outputs as Map<string, unknown> | Record<string, unknown>).map(([portId, value]: [string, unknown]) => {
                  const outputPort = node.outputs.find((p: { id: string }) => p.id === portId);
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
            {result.executionTime && (
              <div className="text-xs text-gray-500">
                Execution time: {result.executionTime}ms
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading graph..." />
      </PageContainer>
    );
  }

  if (error || !graph) {
    return (
      <PageContainer>
        <ErrorAlert
          message={error ?? 'Graph not found'}
          onRetry={error ? fetchGraph : undefined}
        />
      </PageContainer>
    );
  }

  const hasErrors = executionResult?.errors && executionResult.errors.length > 0;
  const successCount = executionResult?.results
    ? Object.values(executionResult.results).filter((r: ExecutionResult) => r?.success).length
    : 0;
  const totalCount = executionResult?.results
    ? Object.keys(executionResult.results).length
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title={`Execute: ${graph.metadata.name}`}
        description={graph.metadata.description || 'Execute this graph and view results'}
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/graphs"
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to Graphs"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
            </Link>
            <Link
              href={`/graph-editor?load=${graphId}`}
              className="btn btn-primary"
            >
              Edit Graph
            </Link>
          </div>
        }
      />

      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/graphs"
          className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:text-blue-800" />
          Back to Graphs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Information */}
        <ContentCard className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Graph Information</h2>
          <div className="space-y-3 text-gray-700">
            <div>
              <span className="font-semibold">Name:</span>{' '}
              <span>{graph.metadata.name}</span>
            </div>
            {graph.metadata.description && (
              <div>
                <span className="font-semibold">Description:</span>{' '}
                <span>{graph.metadata.description}</span>
              </div>
            )}
            <div>
              <span className="font-semibold">Version:</span>{' '}
              <span>{graph.metadata.version}</span>
            </div>
            {graph.metadata.author && (
              <div>
                <span className="font-semibold">Author:</span>{' '}
                <span>{graph.metadata.author}</span>
              </div>
            )}
            <div>
              <span className="font-semibold">Nodes:</span>{' '}
              <span className="font-mono">{graph.data.nodes.length}</span>
            </div>
            <div>
              <span className="font-semibold">Connections:</span>{' '}
              <span className="font-mono">{graph.data.connections.length}</span>
            </div>
            {graph.metadata.tags && graph.metadata.tags.length > 0 && (
              <div>
                <span className="font-semibold">Tags:</span>{' '}
                <div className="flex flex-wrap gap-1 mt-1">
                  {graph.metadata.tags.map((tag: string) => (
                    <span key={tag} className="badge badge-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="font-semibold">Created:</span>{' '}
              <span>{new Date(graph.metadata.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="font-semibold">Updated:</span>{' '}
              <span>{new Date(graph.metadata.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </ContentCard>

        {/* Execution Controls and Results */}
        <ContentCard className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execution</h2>

          {/* Execution Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Mode:</span>
                <button
                  onClick={() => setExecutionMode('sequential')}
                  disabled={executing}
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
                  disabled={executing}
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

            <div className="flex items-center gap-3">
              {executing ? (
                <button
                  onClick={() => setExecuting(false)}
                  disabled
                  className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Stop Execution"
                >
                  <Square className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              ) : (
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Execute Graph"
                >
                  {executing ? (
                    <Loader2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                  )}
                </button>
              )}
              {executing && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Execution Results */}
          {executionResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {executionResult.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          Execution Completed
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold text-red-700">
                          Execution Failed
                        </span>
                      </>
                    )}
                  </div>
                  {executionResult.executionTime > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{executionResult.executionTime}ms</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                  <span className="text-green-600">
                    ✓ {successCount} succeeded
                  </span>
                  {hasErrors && (
                    <span className="text-red-600">
                      ✗ {executionResult.errors?.length || 0} failed
                    </span>
                  )}
                </div>
              </div>

              {/* Node Results */}
              {executionResult.results && Object.keys(executionResult.results).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Node Results</h3>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {Object.entries(executionResult.results).map(([nodeId, result]) =>
                      renderNodeResult(nodeId, result),
                    )}
                  </div>
                </div>
              )}

              {/* Execution Logs */}
              {executionResult.logs && executionResult.logs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Execution Logs</h3>
                  <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
                    {executionResult.logs.map((log: string, index: number) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Global Errors */}
              {hasErrors && executionResult.errors && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Errors</h3>
                  <div className="space-y-2">
                    {executionResult.errors.map((err: NodeError, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-red-900">
                              {err.nodeId ? `Node ${err.nodeId}` : 'Global Error'}
                            </div>
                            <div className="text-sm text-red-700 mt-1">{err.message}</div>
                            {err.portId && (
                              <div className="text-xs text-red-600 mt-1">Port: {err.portId}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results Message */}
          {!executionResult && !executing && (
            <div className="text-center py-12 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm">Click the play button to execute this graph</p>
            </div>
          )}
        </ContentCard>
      </div>
    </PageContainer>
  );
}

