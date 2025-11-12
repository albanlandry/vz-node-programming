/* eslint-disable max-lines-per-function */
'use client';

/**
 * Graph Editor Page
 * Main page for the visual graph editor using React Flow
 * Layout: Left sidebar (Node Palette) + Right canvas (Graph Editor)
 * Uses full screen height
 */

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactFlowCanvas from '../../components/graph/ReactFlowCanvas';
import GraphToolbar from '../../components/graph/GraphToolbar';
import ExecutionToolbar from '../../components/graph/ExecutionToolbar';
import NodePalette from '../../components/graph/NodePalette';
import NodeDetailsPanel from '../../components/graph/NodeDetailsPanel';
import ExecutionResultsPanel from '../../components/graph/ExecutionResultsPanel';
import InteractiveNodeManager from '../../components/graph/InteractiveNodeManager';
import { useGraphStore } from '../../store/graphStore';
import type { Port } from '../../src/types';

/**
 * Graph Editor Content Component
 * Separated to allow Suspense boundary for useSearchParams
 */
function GraphEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { 
    selectedNodeId, 
    loadGraph, 
    clearGraph, 
    clearExecutionState, 
    setCurrentGraph,
    addNode,
    selectNode,
    viewport,
    setViewport,
    nodes,
  } = useGraphStore();
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsPanelNodeId, setDetailsPanelNodeId] = useState<string | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const hasAddedNodeRef = useRef<string | null>(null);

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
      const graph = result.graph as { 
        id: string;
        metadata: import('../../src/graph-management/types').GraphMetadata;
        data: { nodes: unknown[]; connections: unknown[]; viewport: unknown } 
      };

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
      // Store current graph ID and metadata
      setCurrentGraph(graph.id, graph.metadata);
    } catch (error) {
      console.error('Failed to load graph:', error);
      alert(`Failed to load graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingGraph(false);
    }
  }, [loadGraph, setCurrentGraph]);

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
   * Add node from query parameter
   */
  // eslint-disable-next-line max-lines-per-function
  const addNodeFromQuery = useCallback(async (nodeType: string) => {
    try {
      // Try to fetch from regular nodes API first
      let nodeMetadata: {
        name: string;
        type: string;
        inputs: Port[];
        outputs: Port[];
      } | null = null;

      try {
        const response = await fetch(`/api/nodes/${encodeURIComponent(nodeType)}`);
        if (response.ok) {
          const data = await response.json();
          const node = data.node;
          if (node) {
            nodeMetadata = {
              name: node.displayName || node.name || nodeType,
              type: node.type,
              inputs: node.inputs || [],
              outputs: node.outputs || [],
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch from nodes API:', error);
      }

      // If not found, try custom nodes API
      if (!nodeMetadata) {
        try {
          const customResponse = await fetch('/api/custom-nodes');
          if (customResponse.ok) {
            const customData = await customResponse.json();
            const customNode = customData.nodes?.find(
              (n: { metadata: { type: string } }) => n.metadata.type === nodeType,
            );
            if (customNode) {
              nodeMetadata = {
                name: customNode.metadata.displayName || customNode.metadata.name || nodeType,
                type: customNode.metadata.type,
                inputs: customNode.config.inputs || [],
                outputs: customNode.config.outputs || [],
              };
            }
          }
        } catch (error) {
          console.warn('Failed to fetch from custom nodes API:', error);
        }
      }

      // If still not found, try interactive nodes API
      if (!nodeMetadata) {
        try {
          const interactiveResponse = await fetch('/api/interactive-nodes');
          if (interactiveResponse.ok) {
            const interactiveData = await interactiveResponse.json();
            const interactiveNode = interactiveData.nodes?.find(
              (n: { type: string }) => n.type === nodeType,
            );
            if (interactiveNode) {
              // Fetch full node details
              const nodeResponse = await fetch(`/api/interactive-nodes/${interactiveNode.id}`);
              if (nodeResponse.ok) {
                const nodeData = await nodeResponse.json();
                const storedNode = nodeData.node;
                if (storedNode) {
                  nodeMetadata = {
                    name: storedNode.metadata.displayName || nodeType,
                    type: storedNode.metadata.type,
                    inputs: storedNode.metadata.inputs || [],
                    outputs: storedNode.metadata.outputs || [],
                  };
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch from interactive nodes API:', error);
        }
      }

      if (!nodeMetadata) {
        console.error(`Node type ${nodeType} not found`);
        hasAddedNodeRef.current = null; // Reset on error so it can be retried
        return;
      }

      // Check if a node of this type was already added recently (within last 2 seconds)
      // This prevents duplicate additions from React strict mode or rapid re-renders
      const existingNode = nodes.find((n) => n.type === nodeType);
      if (existingNode && hasAddedNodeRef.current === nodeType) {
        // Node already exists and we've already processed this nodeType
        console.log(`Node ${nodeType} already exists, skipping duplicate addition`);
        // Still select and center on the existing node
        selectNode(existingNode.id);
        setViewport({
          x: existingNode.position.x - 200,
          y: existingNode.position.y - 150,
        });
        // Remove query parameter
        const params = new URLSearchParams(searchParams.toString());
        params.delete('addNode');
        const newSearch = params.toString();
        router.replace(newSearch ? `/graph-editor?${newSearch}` : '/graph-editor', { scroll: false });
        return;
      }

      // Calculate position at viewport center
      // Default position if viewport is at origin
      const centerX = viewport.x === 0 && viewport.y === 0 ? 400 : viewport.x;
      const centerY = viewport.y === 0 ? 300 : viewport.y;

      // Mark as processing before adding
      hasAddedNodeRef.current = nodeType;

      // For interactive nodes, try to get UI config from stored node metadata
      let initialProperties: Record<string, unknown> = {};
      if (nodeType.startsWith('interactive.')) {
        try {
          const interactiveResponse = await fetch('/api/interactive-nodes');
          if (interactiveResponse.ok) {
            const interactiveData = await interactiveResponse.json();
            const interactiveNode = interactiveData.nodes?.find(
              (n: { type: string }) => n.type === nodeType,
            );
            if (interactiveNode) {
              // Fetch full node details to get UI config
              const nodeResponse = await fetch(`/api/interactive-nodes/${interactiveNode.id}`);
              if (nodeResponse.ok) {
                const nodeData = await nodeResponse.json();
                const storedNode = nodeData.node;
                if (storedNode?.metadata?.uiConfig) {
                  initialProperties = {
                    uiConfig: storedNode.metadata.uiConfig,
                  };
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load UI config for interactive node:', error);
        }
      }

      // Add node to graph
      const nodeId = addNode({
        name: nodeMetadata.name,
        type: nodeMetadata.type,
        position: { x: centerX, y: centerY },
        inputs: nodeMetadata.inputs,
        outputs: nodeMetadata.outputs,
        properties: initialProperties,
      });

      // Select the newly added node
      selectNode(nodeId);

      // Center viewport on the new node
      setViewport({
        x: centerX - 200,
        y: centerY - 150,
      });

      // Remove query parameter from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('addNode');
      const newSearch = params.toString();
      router.replace(newSearch ? `/graph-editor?${newSearch}` : '/graph-editor', { scroll: false });
    } catch (error) {
      console.error('Failed to add node from query parameter:', error);
      hasAddedNodeRef.current = null; // Reset on error so it can be retried
    }
  }, [searchParams, router, addNode, selectNode, viewport, setViewport, nodes]);

  /**
   * Handle addNode query parameter
   */
  useEffect(() => {
    const nodeType = searchParams.get('addNode');
    if (nodeType && hasAddedNodeRef.current !== nodeType) {
      void addNodeFromQuery(nodeType);
    }
  }, [searchParams, addNodeFromQuery]);

  /**
   * Clear graph and execution state when leaving the editor
   */
  useEffect(() => {
    return () => {
      // Cleanup: Clear graph and execution state when component unmounts
      clearGraph();
      clearExecutionState();
    };
  }, [clearGraph, clearExecutionState]);

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
      {/* Interactive Node Manager */}
      <InteractiveNodeManager />
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

