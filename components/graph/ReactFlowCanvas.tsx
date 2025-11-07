'use client';

/**
 * React Flow Canvas Component
 * Main canvas using React Flow library
 */

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ReactFlowNode from './ReactFlowNode';
import { useGraphStore, type NodePosition } from '../../store/graphStore';
import { Port } from '../../src/types';
import { getConnectionStyle, getConnectionLabel } from './DataFlowVisualization';

interface ReactFlowCanvasProps {
  onNodeDoubleClick?: (nodeId: string) => void;
}

/**
 * Node types for React Flow
 */
const nodeTypes = {
  custom: ReactFlowNode,
};

/**
 * Check if two ports can be connected based on their types
 */
function canConnectPorts(fromPort: Port, toPort: Port): boolean {
  const fromType = fromPort.dataType.name;
  const toType = toPort.dataType.name;

  // 'any' type can connect to anything
  if (fromType === 'any' || toType === 'any') {
    return true;
  }

  // Same types can connect
  if (fromType === toType) {
    return true;
  }

  // Number can connect to number types
  if (fromType === 'number' && toType === 'number') {
    return true;
  }

  return false;
}

/**
 * React Flow Canvas Component
 */
function ReactFlowCanvasInner({ onNodeDoubleClick }: ReactFlowCanvasProps) {
  const reactFlowInstance = useReactFlow();
  const {
    nodes: storeNodes,
    connections: storeConnections,
    viewport,
    setViewport,
    resetViewport,
    addConnection,
    canConnect,
    selectNode,
    selectNodes,
    selectedNodeId,
    selectedNodeIds,
    moveNodes,
    showDataFlow,
    showConnectionValues,
    connectionStates,
  } = useGraphStore();

  /**
   * Convert store nodes to React Flow nodes
   */
  const reactFlowNodes = useMemo<Node[]>(() => {
    return storeNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        id: node.id,
        name: node.name,
        type: node.type,
        inputs: node.inputs,
        outputs: node.outputs,
        properties: node.properties,
      },
      selected: selectedNodeIds.has(node.id),
    }));
  }, [storeNodes, selectedNodeIds]);

  /**
   * Convert store connections to React Flow edges
   */
  const reactFlowEdges = useMemo<Edge[]>(() => {
    return storeConnections.map((conn) => {
      const baseStyle = showDataFlow ? getConnectionStyle(conn.id, connectionStates) : {};
      const label = showConnectionValues ? getConnectionLabel(conn.id, connectionStates, showConnectionValues) : undefined;
      
      return {
      id: conn.id,
      source: conn.fromNode,
      sourceHandle: conn.fromPort,
      target: conn.toNode,
      targetHandle: conn.toPort,
      type: 'smoothstep',
        animated: showDataFlow && baseStyle.strokeDasharray !== undefined,
        style: {
          stroke: '#3B82F6',
          strokeWidth: 2,
          ...baseStyle,
        },
        label: label,
        labelStyle: {
          fill: '#1f2937',
          fontWeight: 500,
          fontSize: '11px',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.8,
        },
      };
    });
  }, [storeConnections, showDataFlow, showConnectionValues, connectionStates]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Sync React Flow state with store
  const updateNodesFromStore = useCallback(() => {
    setNodes(reactFlowNodes);
  }, [reactFlowNodes, setNodes]);

  const updateEdgesFromStore = useCallback(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Update when store changes
  useEffect(() => {
    updateNodesFromStore();
  }, [updateNodesFromStore]);

  useEffect(() => {
    updateEdgesFromStore();
  }, [updateEdgesFromStore]);

  /**
   * Handle node changes (drag, select, etc.)
   */
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Handle position changes for multiple nodes
      const positionUpdates: Record<string, NodePosition> = {};

      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          positionUpdates[change.id] = change.position;
        }
      });

      // Batch update positions for multiple nodes
      if (Object.keys(positionUpdates).length > 0) {
        if (Object.keys(positionUpdates).length === 1) {
          const [id, position] = Object.entries(positionUpdates)[0];
          useGraphStore.getState().moveNode(id, position);
        } else {
          moveNodes(positionUpdates);
            }
          }
    },
    [onNodesChange, moveNodes],
  );

  /**
   * Handle edge changes (delete, etc.)
   */
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);

      // Update store when edges are deleted
      changes.forEach((change) => {
        if (change.type === 'remove') {
          useGraphStore.getState().deleteConnection(change.id);
        }
      });
    },
    [onEdgesChange],
  );

  /**
   * Handle new connections
   */
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return;
      }

      // Find ports
      const sourceNode = storeNodes.find((n) => n.id === connection.source);
      const targetNode = storeNodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        return;
      }

      const sourcePort = sourceNode.outputs.find((p) => p.id === connection.sourceHandle);
      const targetPort = targetNode.inputs.find((p) => p.id === connection.targetHandle);

      if (!sourcePort || !targetPort) {
        return;
      }

      // Check type compatibility
      if (!canConnectPorts(sourcePort, targetPort)) {
        alert(`Cannot connect ${sourcePort.dataType.name} to ${targetPort.dataType.name}`);
        return;
      }

      // Check if connection already exists
      const exists = storeConnections.some(
        (conn) =>
          conn.fromNode === connection.source &&
          conn.fromPort === connection.sourceHandle &&
          conn.toNode === connection.target &&
          conn.toPort === connection.targetHandle,
      );

      if (exists) {
        return;
      }

      // Add to store
      const connectionId = addConnection({
        fromNode: connection.source,
        fromPort: connection.sourceHandle,
        toNode: connection.target,
        toPort: connection.targetHandle,
      });

      if (connectionId) {
        // Add to React Flow
        const newEdge = {
          id: connectionId,
          source: connection.source,
          sourceHandle: connection.sourceHandle,
          target: connection.target,
          targetHandle: connection.targetHandle,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [storeNodes, storeConnections, addConnection, setEdges],
  );

  /**
   * Handle viewport changes
   */
  const handleMove = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport({
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      });
    },
    [setViewport],
  );

  /**
   * Initialize viewport from store
   */
  useEffect(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({
        x: viewport.x,
        y: viewport.y,
        zoom: viewport.zoom,
      });
    }
  }, [reactFlowInstance, viewport.x, viewport.y, viewport.zoom]);

  /**
   * Handle drop from Node Palette
   */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataStr) {
        return;
      }

      try {
        const nodeData = JSON.parse(nodeDataStr) as {
          id: string;
          name: string;
          type: string;
          inputs: Port[];
          outputs: Port[];
        };

        if (!reactFlowInstance) {
          return;
        }

        // Get drop position relative to canvas
        const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Add node to store with default properties for Constant nodes
        const defaultProperties = nodeData.type === 'utility.constant' 
          ? { type: 'string', value: '' }
          : {};
        
        const nodeId = useGraphStore.getState().addNode({
          name: nodeData.name,
          type: nodeData.type,
          position,
          inputs: nodeData.inputs,
          outputs: nodeData.outputs,
          properties: defaultProperties,
        });

        // Update React Flow nodes
        const newNode: Node = {
          id: nodeId,
          type: 'custom',
          position,
          data: {
            id: nodeId,
            name: nodeData.name,
            type: nodeData.type,
            inputs: nodeData.inputs,
            outputs: nodeData.outputs,
            properties: defaultProperties,
          },
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (error) {
        console.error('Error handling drop:', error);
      }
    },
    [reactFlowInstance, setNodes],
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle selection change (for rect selection)
   */
  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const selectedIds = params.nodes.map((node) => node.id);
      selectNodes(selectedIds);
    },
    [selectNodes],
  );

  return (
    <div
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onMove={handleMove}
        onSelectionChange={handleSelectionChange}
        onNodeDoubleClick={(_, node) => {
          if (onNodeDoubleClick) {
            onNodeDoubleClick(node.id);
          }
        }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={3}
        defaultViewport={{
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        }}
        connectionLineStyle={{ stroke: '#3B82F6', strokeWidth: 2 }}
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable
        nodesConnectable
        selectNodesOnDrag={false}
      >
        <Background color="#f3f4f6" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.selected) return '#3B82F6';
            return '#94a3b8';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Viewport info */}
      <div className="absolute bottom-4 right-4 bg-white/80 px-3 py-2 rounded text-xs z-10">
        Zoom: {(viewport.zoom * 100).toFixed(0)}% | Pan: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})
      </div>
    </div>
  );
}

/**
 * React Flow Canvas with Provider
 */
export default function ReactFlowCanvas({ onNodeDoubleClick }: ReactFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner onNodeDoubleClick={onNodeDoubleClick} />
    </ReactFlowProvider>
  );
}

