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
import type { GraphMetadata } from '../src/graph-management/types';

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
 * Input template for saving/loading input configurations
 */
export interface InputTemplate {
  id: string;
  name: string;
  inputs: Record<string, Record<string, unknown>>;
  createdAt: string;
}

/**
 * Breakpoint configuration
 */
export interface Breakpoint {
  nodeId: string;
  enabled: boolean;
  condition?: string;
}

/**
 * Connection state for data flow visualization
 */
export interface ConnectionState {
  connectionId: string;
  status: 'idle' | 'active' | 'error';
  data?: unknown;
  animationProgress?: number;
}

/**
 * Cached execution result
 */
export interface CachedResult {
  nodeId: string;
  result: ExecutionResult;
  graphHash: string;
  timestamp: number;
  ttl?: number;
}

/**
 * Timeline event for execution visualization
 */
export interface TimelineEvent {
  nodeId: string;
  nodeName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed';
  dependencies: string[];
}

/**
 * Execution timeline
 */
export interface ExecutionTimeline {
  events: TimelineEvent[];
  totalDuration: number;
  parallelExecution: boolean;
}

/**
 * Node performance metrics
 */
export interface NodePerformanceMetrics {
  nodeId: string;
  nodeName: string;
  executionCount: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalExecutionTime: number;
  successRate: number;
  lastExecutionTime?: number;
}

/**
 * Graph performance metrics
 */
export interface GraphPerformanceMetrics {
  nodes: Record<string, NodePerformanceMetrics>;
  totalExecutions: number;
  averageGraphExecutionTime: number;
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
  selectedNodeIds: Set<string>;
  selectedConnectionId: string | null;
  
  // Connection creation
  connectionStart: { nodeId: string; portId: string } | null;
  
  // Actions - Nodes
  addNode: (node: Omit<GraphNode, 'id'>) => string;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: NodePosition) => void;
  moveNodes: (nodePositions: Record<string, NodePosition>) => void;
  
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
  selectNodes: (ids: string[]) => void;
  selectConnection: (id: string | null) => void;
  
  // Actions - Connection creation
  startConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
  
  // Current graph info
  currentGraphId: string | null;
  currentGraphMetadata: GraphMetadata | null;
  
  // Actions - Persistence
  saveGraph: () => GraphData;
  loadGraph: (data: GraphData) => void;
  clearGraph: () => void;
  setCurrentGraph: (id: string | null, metadata: GraphMetadata | null) => void;
  
  // Execution state
  execution: ExecutionState;
  
  // Input configuration
  inputConfig: Record<string, Record<string, unknown>>;
  inputTemplates: InputTemplate[];
  
  // Debugging
  breakpoints: Record<string, Breakpoint>;
  isPaused: boolean;
  stepMode: boolean;
  currentStepNodeId: string | null;
  
  // Data flow visualization
  connectionStates: Record<string, ConnectionState>;
  showDataFlow: boolean;
  showConnectionValues: boolean;
  
  // Incremental execution
  previousGraphHash: string | null;
  cachedResults: Record<string, CachedResult>;
  
  // Performance metrics
  performanceMetrics: GraphPerformanceMetrics;
  
  // Visualization
  executionTimeline: ExecutionTimeline | null;
  
  // Actions - Execution
  startExecution: (mode: 'sequential' | 'parallel') => void;
  stopExecution: () => void;
  updateNodeExecutionState: (nodeId: string, state: Partial<NodeExecutionState>) => void;
  setExecutionResults: (results: Record<string, ExecutionResult>) => void;
  setExecutionErrors: (errors: Record<string, NodeError>) => void;
  setExecutionTime: (time: number) => void;
  clearExecutionState: () => void;
  
  // Actions - Input Configuration
  setInputValue: (nodeId: string, portId: string, value: unknown) => void;
  clearInputConfig: () => void;
  saveInputTemplate: (name: string) => void;
  loadInputTemplate: (templateId: string) => void;
  deleteInputTemplate: (templateId: string) => void;
  
  // Actions - Debugging
  addBreakpoint: (nodeId: string, condition?: string) => void;
  removeBreakpoint: (nodeId: string) => void;
  toggleBreakpoint: (nodeId: string) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stepExecution: () => void;
  
  // Actions - Data Flow Visualization
  updateConnectionState: (connectionId: string, state: Partial<ConnectionState>) => void;
  setShowDataFlow: (show: boolean) => void;
  setShowConnectionValues: (show: boolean) => void;
  
  // Actions - Incremental Execution
  setCachedResult: (nodeId: string, result: ExecutionResult, hash: string) => void;
  getCachedResult: (nodeId: string, hash: string) => CachedResult | null;
  invalidateCache: (nodeId?: string) => void;
  setPreviousGraphHash: (hash: string | null) => void;
  
  // Actions - Performance Metrics
  updatePerformanceMetrics: (nodeId: string, metrics: Partial<NodePerformanceMetrics>) => void;
  resetPerformanceMetrics: () => void;
  
  // Actions - Visualization
  setExecutionTimeline: (timeline: ExecutionTimeline | null) => void;
  
  // Clipboard state
  clipboard: {
    nodes: GraphNode[];
    connections: GraphConnection[];
    isCut: boolean; // true if cut, false if copy
  } | null;
  
  // Actions - Clipboard
  copyNodes: (nodeIds: string[]) => void;
  cutNodes: (nodeIds: string[]) => void;
  pasteNodes: (position?: NodePosition) => void;
  canPaste: () => boolean;
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
  selectedNodeIds: new Set<string>(),
  selectedConnectionId: null,
  connectionStart: null,
  currentGraphId: null,
  currentGraphMetadata: null,
  
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
  
  // Input configuration
  inputConfig: {},
  inputTemplates: [],
  
  // Debugging
  breakpoints: {},
  isPaused: false,
  stepMode: false,
  currentStepNodeId: null,
  
  // Data flow visualization
  connectionStates: {},
  showDataFlow: false,
  showConnectionValues: false,
  
  // Incremental execution
  previousGraphHash: null,
  cachedResults: {},
  
  // Performance metrics
  performanceMetrics: {
    nodes: {},
    totalExecutions: 0,
    averageGraphExecutionTime: 0,
  },
  
  // Visualization
  executionTimeline: null,

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
      selectedNodeIds: new Set(
        Array.from(state.selectedNodeIds).filter((nodeId) => nodeId !== id),
      ),
    }));
  },

  moveNode: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node,
      ),
    }));
  },

  moveNodes: (nodePositions: Record<string, NodePosition>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        nodePositions[node.id]
          ? { ...node, position: nodePositions[node.id] }
          : node,
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
      selectedNodeIds: id ? new Set([id]) : new Set<string>(),
      selectedConnectionId: null,
    });
  },

  selectNodes: (ids) => {
    set({
      selectedNodeId: ids.length === 1 ? ids[0] : null,
      selectedNodeIds: new Set(ids),
      selectedConnectionId: null,
    });
  },

  selectConnection: (id) => {
    set({
      selectedConnectionId: id,
      selectedNodeId: null,
      selectedNodeIds: new Set<string>(),
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
      selectedNodeIds: new Set<string>(),
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
      selectedNodeIds: new Set<string>(),
      selectedConnectionId: null,
      connectionStart: null,
      currentGraphId: null,
      currentGraphMetadata: null,
    });
  },

  setCurrentGraph: (id, metadata) => {
    set({
      currentGraphId: id,
      currentGraphMetadata: metadata,
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
      isPaused: false,
      currentStepNodeId: null,
      connectionStates: {},
    });
  },

  // Input configuration actions
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

  saveInputTemplate: (name) => {
    const state = get();
    const template: InputTemplate = {
      id: generateId(),
      name,
      inputs: state.inputConfig,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      inputTemplates: [...s.inputTemplates, template],
    }));
  },

  loadInputTemplate: (templateId) => {
    const state = get();
    const template = state.inputTemplates.find((t) => t.id === templateId);
    if (template) {
      set({ inputConfig: template.inputs });
    }
  },

  deleteInputTemplate: (templateId) => {
    set((state) => ({
      inputTemplates: state.inputTemplates.filter((t) => t.id !== templateId),
    }));
  },

  // Debugging actions
  addBreakpoint: (nodeId, condition) => {
    set((state) => ({
      breakpoints: {
        ...state.breakpoints,
        [nodeId]: {
          nodeId,
          enabled: true,
          condition,
        },
      },
    }));
  },

  removeBreakpoint: (nodeId) => {
    set((state) => {
      const { [nodeId]: removed, ...rest } = state.breakpoints;
      return { breakpoints: rest };
    });
  },

  toggleBreakpoint: (nodeId) => {
    set((state) => {
      const breakpoint = state.breakpoints[nodeId];
      if (breakpoint) {
        return {
          breakpoints: {
            ...state.breakpoints,
            [nodeId]: {
              ...breakpoint,
              enabled: !breakpoint.enabled,
            },
          },
        };
      }
      return state;
    });
  },

  pauseExecution: () => {
    set({ isPaused: true });
  },

  resumeExecution: () => {
    set({ isPaused: false, currentStepNodeId: null });
  },

  stepExecution: () => {
    // Step execution logic would be handled by execution service
    // This just marks that step mode is active
    set({ stepMode: true, isPaused: false });
  },

  // Data flow visualization actions
  updateConnectionState: (connectionId, stateUpdate) => {
    set((state) => ({
      connectionStates: {
        ...state.connectionStates,
        [connectionId]: {
          ...(state.connectionStates[connectionId] || {
            connectionId,
            status: 'idle',
          }),
          ...stateUpdate,
        },
      },
    }));
  },

  setShowDataFlow: (show) => {
    set({ showDataFlow: show });
  },

  setShowConnectionValues: (show) => {
    set({ showConnectionValues: show });
  },

  // Incremental execution actions
  setCachedResult: (nodeId, result, hash) => {
    set((state) => ({
      cachedResults: {
        ...state.cachedResults,
        [nodeId]: {
          nodeId,
          result,
          graphHash: hash,
          timestamp: Date.now(),
        },
      },
    }));
  },

  getCachedResult: (nodeId, hash) => {
    const state = get();
    const cached = state.cachedResults[nodeId];
    if (cached && cached.graphHash === hash) {
      // Check TTL (default 5 minutes)
      const ttl = cached.ttl || 5 * 60 * 1000;
      if (Date.now() - cached.timestamp < ttl) {
        return cached;
      }
    }
    return null;
  },

  invalidateCache: (nodeId) => {
    if (nodeId) {
      set((state) => {
        const { [nodeId]: removed, ...rest } = state.cachedResults;
        return { cachedResults: rest };
      });
    } else {
      set({ cachedResults: {} });
    }
  },

  setPreviousGraphHash: (hash) => {
    set({ previousGraphHash: hash });
  },

  // Performance metrics actions
  updatePerformanceMetrics: (nodeId, metricsUpdate) => {
    set((state) => {
      const currentMetrics = state.performanceMetrics.nodes[nodeId] || {
        nodeId,
        nodeName: state.nodes.find((n) => n.id === nodeId)?.name || nodeId,
        executionCount: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
        totalExecutionTime: 0,
        successRate: 1,
      };

      const updatedMetrics: NodePerformanceMetrics = {
        ...currentMetrics,
        ...metricsUpdate,
      };

      // Recalculate average if executionTime is provided
      if (metricsUpdate.lastExecutionTime !== undefined) {
        updatedMetrics.executionCount = (updatedMetrics.executionCount || 0) + 1;
        updatedMetrics.totalExecutionTime =
          (updatedMetrics.totalExecutionTime || 0) + metricsUpdate.lastExecutionTime;
        updatedMetrics.averageExecutionTime =
          updatedMetrics.totalExecutionTime / updatedMetrics.executionCount;
        updatedMetrics.minExecutionTime = Math.min(
          updatedMetrics.minExecutionTime || Infinity,
          metricsUpdate.lastExecutionTime,
        );
        updatedMetrics.maxExecutionTime = Math.max(
          updatedMetrics.maxExecutionTime || 0,
          metricsUpdate.lastExecutionTime,
        );
      }

      return {
        performanceMetrics: {
          ...state.performanceMetrics,
          nodes: {
            ...state.performanceMetrics.nodes,
            [nodeId]: updatedMetrics,
          },
          totalExecutions: state.performanceMetrics.totalExecutions + 1,
        },
      };
    });
  },

  resetPerformanceMetrics: () => {
    set({
      performanceMetrics: {
        nodes: {},
        totalExecutions: 0,
        averageGraphExecutionTime: 0,
      },
    });
  },

  // Visualization actions
  setExecutionTimeline: (timeline) => {
    set({ executionTimeline: timeline });
  },
  
  // Clipboard state
  clipboard: null,
  
  // Clipboard actions
  copyNodes: (nodeIds) => {
    const state = get();
    const nodesToCopy = state.nodes.filter((node) => nodeIds.includes(node.id));
    
    if (nodesToCopy.length === 0) {
      return;
    }
    
    // Get connections between selected nodes
    const connectionsToCopy = state.connections.filter(
      (conn) =>
        nodeIds.includes(conn.fromNode) && nodeIds.includes(conn.toNode),
    );
    
    set({
      clipboard: {
        nodes: nodesToCopy.map((node) => ({ ...node })),
        connections: connectionsToCopy.map((conn) => ({ ...conn })),
        isCut: false,
      },
    });
  },
  
  cutNodes: (nodeIds) => {
    const state = get();
    const nodesToCut = state.nodes.filter((node) => nodeIds.includes(node.id));
    
    if (nodesToCut.length === 0) {
      return;
    }
    
    // Get connections between selected nodes
    const connectionsToCut = state.connections.filter(
      (conn) =>
        nodeIds.includes(conn.fromNode) && nodeIds.includes(conn.toNode),
    );
    
    set({
      clipboard: {
        nodes: nodesToCut.map((node) => ({ ...node })),
        connections: connectionsToCut.map((conn) => ({ ...conn })),
        isCut: true,
      },
    });
    
    // Delete nodes if cut
    nodeIds.forEach((id) => {
      get().deleteNode(id);
    });
  },
  
  pasteNodes: (position) => {
    const state = get();
    
    if (!state.clipboard || state.clipboard.nodes.length === 0) {
      return;
    }
    
    // Calculate offset if position is provided, otherwise offset by a small amount
    const offsetX = position ? position.x - state.clipboard.nodes[0].position.x : 50;
    const offsetY = position ? position.y - state.clipboard.nodes[0].position.y : 50;
    
    // Create new IDs for pasted nodes
    const idMap = new Map<string, string>();
    const newNodes: GraphNode[] = [];
    const newConnections: GraphConnection[] = [];
    
    // Create new nodes with new IDs
    state.clipboard.nodes.forEach((node) => {
      const newId = generateId();
      idMap.set(node.id, newId);
      
      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      });
    });
    
    // Create new connections with new IDs
    state.clipboard.connections.forEach((conn) => {
      const newFromNode = idMap.get(conn.fromNode);
      const newToNode = idMap.get(conn.toNode);
      
      if (newFromNode && newToNode) {
        const newConnId = generateId();
        newConnections.push({
          ...conn,
          id: newConnId,
          fromNode: newFromNode,
          toNode: newToNode,
        });
      }
    });
    
    // Add nodes to store
    set((s) => ({
      nodes: [...s.nodes, ...newNodes],
      connections: [...s.connections, ...newConnections],
      selectedNodeIds: new Set(newNodes.map((n) => n.id)),
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
    }));
    
    // Clear clipboard if it was a cut operation
    if (state.clipboard.isCut) {
      set({ clipboard: null });
    }
  },
  
  canPaste: () => {
    const state = get();
    return state.clipboard !== null && state.clipboard.nodes.length > 0;
  },
}));

