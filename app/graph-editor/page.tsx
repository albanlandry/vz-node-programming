'use client';

/**
 * Graph Editor Page
 * Main page for the visual graph editor using React Flow
 * Layout: Left sidebar (Node Palette) + Right canvas (Graph Editor)
 * Uses full screen height
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactFlowCanvas from '../../components/graph/ReactFlowCanvas';
import GraphToolbar from '../../components/graph/GraphToolbar';
import ExecutionToolbar from '../../components/graph/ExecutionToolbar';
import NodePalette from '../../components/graph/NodePalette';
import NodeDetailsPanel from '../../components/graph/NodeDetailsPanel';
import ExecutionResultsPanel from '../../components/graph/ExecutionResultsPanel';
import { useGraphStore } from '../../store/graphStore';

/**
 * Graph Editor Content Component
 * Separated to allow Suspense boundary for useSearchParams
 */
function GraphEditorContent() {
  const searchParams = useSearchParams();
  const { selectedNodeId, loadGraph } = useGraphStore();
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsPanelNodeId, setDetailsPanelNodeId] = useState<string | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  /**
   * Load graph from backend by ID
   */
  const loadGraphFromId = useCallback(async (graphId: string) => {
    setIsLoadingGraph(true);
    try {
      const response = await fetch(`/api/graphs/${graphId}`);
      if (!response.ok) {
        throw new Error('Failed to load graph');
      }

      const result = await response.json();
      const graph = result.graph as { data: { nodes: unknown[]; connections: unknown[]; viewport: unknown } };

      // Load graph data, ignoring invalid values
      const safeLoadGraph = (data: {
        nodes?: unknown[];
        connections?: unknown[];
        viewport?: unknown;
      }) => {
        const validNodes =
          data.nodes && Array.isArray(data.nodes)
            ? data.nodes.filter((node) => {
                return (
                  typeof node === 'object' &&
                  node !== null &&
                  'id' in node &&
                  'name' in node &&
                  'type' in node &&
                  'position' in node
                );
              })
            : [];

        const validConnections =
          data.connections && Array.isArray(data.connections)
            ? data.connections.filter((conn) => {
                return (
                  typeof conn === 'object' &&
                  conn !== null &&
                  'id' in conn &&
                  'fromNode' in conn &&
                  'toNode' in conn
                );
              })
            : [];

        const validViewport =
          data.viewport &&
          typeof data.viewport === 'object' &&
          data.viewport !== null &&
          'x' in data.viewport &&
          'y' in data.viewport &&
          'zoom' in data.viewport
            ? data.viewport
            : { x: 0, y: 0, zoom: 1 };

        loadGraph({
          nodes: validNodes as Parameters<typeof loadGraph>[0]['nodes'],
          connections: validConnections as Parameters<typeof loadGraph>[0]['connections'],
          viewport: validViewport as Parameters<typeof loadGraph>[0]['viewport'],
        });
      };

      safeLoadGraph(graph.data);
    } catch (error) {
      console.error('Failed to load graph:', error);
      alert(`Failed to load graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingGraph(false);
    }
  }, [loadGraph]);

  /**
   * Load graph from query parameter on mount
   */
  useEffect(() => {
    const graphId = searchParams.get('load');
    if (graphId && !isLoadingGraph && !hasLoaded) {
      setHasLoaded(true);
      void loadGraphFromId(graphId);
    }
  }, [searchParams, isLoadingGraph, hasLoaded, loadGraphFromId]);

  /**
   * Handle node double click to show details panel
   */
  const handleNodeDoubleClick = (nodeId: string) => {
    // Only show panel if the node is currently selected
    if (selectedNodeId === nodeId) {
      setDetailsPanelNodeId(nodeId);
      setShowDetailsPanel(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ height: '100vh' }}>
      <GraphToolbar />
      <ExecutionToolbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette />
        {/* Right Canvas - Graph Editor */}
        <div className="flex-1 relative overflow-hidden">
          <ReactFlowCanvas onNodeDoubleClick={handleNodeDoubleClick} />
        </div>
      </div>
      {/* Node Details Panel */}
      {showDetailsPanel && (
        <NodeDetailsPanel
          nodeId={detailsPanelNodeId}
          onClose={() => {
            setShowDetailsPanel(false);
            setDetailsPanelNodeId(null);
          }}
        />
      )}
      {/* Execution Results Panel */}
      <ExecutionResultsPanel />
    </div>
  );
}

/**
 * Main Graph Editor Page Component
 * Wraps content in Suspense for useSearchParams
 */
export default function GraphEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading graph editor...</div>
      </div>
    }>
      <GraphEditorContent />
    </Suspense>
  );
}

