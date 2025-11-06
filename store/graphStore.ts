/**
 * Graph Store (Zustand)
 * 
 * Manages the state of the graph editor including:
 * - Nodes with positions and properties
 * - Ports on nodes
 * - Connections between ports
 * - Viewport (pan, zoom)
 * - Selection state
 */

import { create } from 'zustand';
import type { DataType, Port, ExecutionResult, NodeError } from '../src/types';

/**
 * Visual position of a node on the canvas
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Visual node in the graph editor
 */
export interface GraphNode {
  id: string;
  name: string;
  type: string;
  position: NodePosition;
  inputs: Port[];
  outputs: Port[];
  properties?: Record<string, unknown>;
}

/**
 * Visual connection in the graph editor
 */
export interface GraphConnection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

/**
 * Viewport state for pan and zoom
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Node execution state
 */
export type NodeExecutionStatus = 'idle' | 'queued' | 'executing' | 'completed' | 'failed';

/**
 * Execution state for a single node
 */
export interface NodeExecutionState {
  status: NodeExecutionStatus;
  startTime?: number;
  endTime?: number;
  executionTime?: number;
  error?: NodeError;
}

/**
 * Graph execution state
 */
export interface ExecutionState {
  isExecuting: boolean;
  executionId: string | null;
  nodeStates: Record<string, NodeExecutionState>;
  results: Record<string, ExecutionResult>;
  errors: Record<string, NodeError>;
  executionTime: number;
  mode: 'sequential' | 'parallel';
  startTime?: number;
  endTime?: number;
}

/**
 * Graph store state
 */
interface GraphState {
  // Graph data
  nodes: GraphNode[];
  connections: GraphConnection[];
  
  // Viewport
  viewport: Viewport;
  
  // Selection
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  
  // Connection creation
  connectionStart: { nodeId: string; portId: string } | null;
  
  // Actions - Nodes
  addNode: (node: Omit<GraphNode, 'id'>) => string;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: NodePosition) => void;
  
  // Actions - Ports
  addPort: (nodeId: string, port: Port, type: 'input' | 'output') => void;
  removePort: (nodeId: string, portId: string, type: 'input' | 'output') => void;
  
  // Actions - Connections
  addConnection: (connection: Omit<GraphConnection, 'id'>) => string | null;
  deleteConnection: (id: string) => void;
  canConnect: (fromPort: Port, toPort: Port) => boolean;
  
  // Actions - Viewport
  setViewport: (viewport: Partial<Viewport>) => void;
  resetViewport: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  zoom: (delta: number, centerX?: number, centerY?: number) => void;
  
  // Actions - Selection
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  
  // Actions - Connection creation
  startConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  
  // Actions - Persistence
  saveGraph: () => GraphData;
  loadGraph: (data: GraphData) => void;
  clearGraph: () => void;
  
  // Execution state
  execution: ExecutionState;
  
  // Actions - Execution
  startExecution: (mode: 'sequential' | 'parallel') => void;
  stopExecution: () => void;
  updateNodeExecutionState: (nodeId: string, state: Partial<NodeExecutionState>) => void;
  setExecutionResults: (results: Record<string, ExecutionResult>) => void;
  setExecutionErrors: (errors: Record<string, NodeError>) => void;
  setExecutionTime: (time: number) => void;
  clearExecutionState: () => void;
}

/**
 * Serialized graph data for persistence
 */
export interface GraphData {
  nodes: GraphNode[];
  connections: GraphConnection[];
  viewport: Viewport;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if two ports can be connected based on their types
 */
function canConnectPorts(fromPort: Port, toPort: Port): boolean {
  // Can't connect output to output or input to input
  // This is handled by the UI, but we check here too
  
  // Check type compatibility
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
  
  // Number can connect to number types (int, float, etc.)
  if (fromType === 'number' && toType === 'number') {
    return true;
  }
  
  return false;
}

/**
 * Create graph store
 */
export const useGraphStore = create<GraphState>((set, get) => ({
  // Initial state
  nodes: [],
  connections: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  selectedNodeId: null,
  selectedConnectionId: null,
  connectionStart: null,
  
  // Execution state
  execution: {
    isExecuting: false,
    executionId: null,
    nodeStates: {},
    results: {},
    errors: {},
    executionTime: 0,
    mode: 'sequential',
  },

  // Node actions
  addNode: (nodeData) => {
    const id = generateId();
    const newNode: GraphNode = {
      id,
      ...nodeData,
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    return id;
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node,
      ),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter(
        (conn) => conn.fromNode !== id && conn.toNode !== id,
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  moveNode: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node,
      ),
    }));
  },

  // Port actions
  addPort: (nodeId, port, type) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          if (type === 'input') {
            return { ...node, inputs: [...node.inputs, port] };
          } else {
            return { ...node, outputs: [...node.outputs, port] };
          }
        }
        return node;
      }),
    }));
  },

  removePort: (nodeId, portId, type) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          if (type === 'input') {
            return {
              ...node,
              inputs: node.inputs.filter((p) => p.id !== portId),
            };
          } else {
            return {
              ...node,
              outputs: node.outputs.filter((p) => p.id !== portId),
            };
          }
        }
        return node;
      }),
      connections: state.connections.filter(
        (conn) =>
          !(
            (conn.fromNode === nodeId && conn.fromPort === portId) ||
            (conn.toNode === nodeId && conn.toPort === portId)
          ),
      ),
    }));
  },

  // Connection actions
  addConnection: (connectionData) => {
    const state = get();
    
    // Find ports
    const fromNode = state.nodes.find((n) => n.id === connectionData.fromNode);
    const toNode = state.nodes.find((n) => n.id === connectionData.toNode);
    
    if (!fromNode || !toNode) {
      return null;
    }
    
    const fromPort = fromNode.outputs.find((p) => p.id === connectionData.fromPort);
    const toPort = toNode.inputs.find((p) => p.id === connectionData.toPort);
    
    if (!fromPort || !toPort) {
      return null;
    }
    
    // Check type compatibility
    if (!canConnectPorts(fromPort, toPort)) {
      return null;
    }
    
    // Check if connection already exists
    const exists = state.connections.some(
      (conn) =>
        conn.fromNode === connectionData.fromNode &&
        conn.fromPort === connectionData.fromPort &&
        conn.toNode === connectionData.toNode &&
        conn.toPort === connectionData.toPort,
    );
    
    if (exists) {
      return null;
    }
    
    const id = generateId();
    const newConnection: GraphConnection = {
      id,
      ...connectionData,
    };
    
    set((s) => ({
      connections: [...s.connections, newConnection],
      connectionStart: null,
    }));
    
    return id;
  },

  deleteConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
      selectedConnectionId:
        state.selectedConnectionId === id ? null : state.selectedConnectionId,
    }));
  },

  canConnect: canConnectPorts,

  // Viewport actions
  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  resetViewport: () => {
    set({
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    });
  },

  pan: (deltaX, deltaY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    }));
  },

  zoom: (delta, centerX, centerY) => {
    set((state) => {
      const newZoom = Math.max(0.1, Math.min(3, state.viewport.zoom + delta));
      const zoomFactor = newZoom / state.viewport.zoom;
      
      // Zoom towards center if provided
      if (centerX !== undefined && centerY !== undefined) {
        return {
          viewport: {
            x: centerX - (centerX - state.viewport.x) * zoomFactor,
            y: centerY - (centerY - state.viewport.y) * zoomFactor,
            zoom: newZoom,
          },
        };
      }
      
      return {
        viewport: {
          ...state.viewport,
          zoom: newZoom,
        },
      };
    });
  },

  // Selection actions
  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedConnectionId: null,
    });
  },

  selectConnection: (id) => {
    set({
      selectedConnectionId: id,
      selectedNodeId: null,
    });
  },

  // Connection creation actions
  startConnection: (nodeId, portId) => {
    set({
      connectionStart: { nodeId, portId },
    });
  },

  cancelConnection: () => {
    set({
      connectionStart: null,
    });
  },

  // Persistence actions
  saveGraph: () => {
    const state = get();
    return {
      nodes: state.nodes,
      connections: state.connections,
      viewport: state.viewport,
    };
  },

  loadGraph: (data) => {
    set({
      nodes: data.nodes,
      connections: data.connections,
      viewport: data.viewport,
      selectedNodeId: null,
      selectedConnectionId: null,
      connectionStart: null,
    });
  },

  clearGraph: () => {
    set({
      nodes: [],
      connections: [],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
      selectedNodeId: null,
      selectedConnectionId: null,
      connectionStart: null,
    });
  },
  
  // Execution actions
  startExecution: (mode) => {
    const executionId = generateId();
    const state = get();
    
    // Initialize node states
    const nodeStates: Record<string, NodeExecutionState> = {};
    state.nodes.forEach((node) => {
      nodeStates[node.id] = {
        status: 'idle',
      };
    });
    
    set({
      execution: {
        isExecuting: true,
        executionId,
        nodeStates,
        results: {},
        errors: {},
        executionTime: 0,
        mode,
        startTime: Date.now(),
      },
    });
  },
  
  stopExecution: () => {
    set((state) => ({
      execution: {
        ...state.execution,
        isExecuting: false,
        endTime: Date.now(),
      },
    }));
  },
  
  updateNodeExecutionState: (nodeId, stateUpdate) => {
    set((state) => {
      const currentState = state.execution.nodeStates[nodeId] || { status: 'idle' };
      const newState: NodeExecutionState = {
        ...currentState,
        ...stateUpdate,
      };
      
      return {
        execution: {
          ...state.execution,
          nodeStates: {
            ...state.execution.nodeStates,
            [nodeId]: newState,
          },
        },
      };
    });
  },
  
  setExecutionResults: (results) => {
    set((state) => ({
      execution: {
        ...state.execution,
        results: {
          ...state.execution.results,
          ...results,
        },
      },
    }));
  },
  
  setExecutionErrors: (errors) => {
    set((state) => ({
      execution: {
        ...state.execution,
        errors: {
          ...state.execution.errors,
          ...errors,
        },
      },
    }));
  },
  
  setExecutionTime: (time) => {
    set((state) => ({
      execution: {
        ...state.execution,
        executionTime: time,
        endTime: Date.now(),
      },
    }));
  },
  
  clearExecutionState: () => {
    set({
      execution: {
        isExecuting: false,
        executionId: null,
        nodeStates: {},
        results: {},
        errors: {},
        executionTime: 0,
        mode: 'sequential',
      },
    });
  },
}));

