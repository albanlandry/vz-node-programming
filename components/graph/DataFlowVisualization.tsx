'use client';

/**
 * Data Flow Visualization Component
 * 
 * Visualizes data flow through connections during execution
 */

import { useEffect, useRef } from 'react';
import { useGraphStore, type ConnectionState } from '../../store/graphStore';
import type { Edge } from 'reactflow';

interface DataFlowVisualizationProps {
  edges: Edge[];
}

export default function DataFlowVisualization({ edges }: DataFlowVisualizationProps) {
  const {
    connections,
    connectionStates,
    showDataFlow,
    showConnectionValues,
    execution,
  } = useGraphStore();
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!showDataFlow || !execution.isExecuting) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      // Update animation progress for active connections
      // This would be integrated with React Flow's edge styling
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showDataFlow, execution.isExecuting]);

  // This component provides data flow visualization logic
  // The actual rendering is handled by ReactFlowCanvas
  return null;
}

/**
 * Get connection style based on state
 */
export function getConnectionStyle(
  connectionId: string,
  connectionStates: Record<string, ConnectionState>,
): React.CSSProperties {
  const state = connectionStates[connectionId];

  if (!state) {
    return {};
  }

  switch (state.status) {
    case 'active':
      return {
        stroke: '#3b82f6',
        strokeWidth: 3,
        strokeDasharray: state.animationProgress ? '5,5' : undefined,
      };
    case 'error':
      return {
        stroke: '#ef4444',
        strokeWidth: 2,
      };
    default:
      return {};
  }
}

/**
 * Get connection label based on state and value
 */
export function getConnectionLabel(
  connectionId: string,
  connectionStates: Record<string, ConnectionState>,
  showConnectionValues: boolean,
): string | undefined {
  const state = connectionStates[connectionId];

  if (!showConnectionValues || !state?.data) {
    return undefined;
  }

  // Format value for display
  if (typeof state.data === 'string') {
    return state.data.length > 20 ? `${state.data.substring(0, 20)}...` : state.data;
  }

  if (typeof state.data === 'number' || typeof state.data === 'boolean') {
    return String(state.data);
  }

  try {
    const json = JSON.stringify(state.data);
    return json.length > 30 ? `${json.substring(0, 30)}...` : json;
  } catch {
    return String(state.data);
  }
}

