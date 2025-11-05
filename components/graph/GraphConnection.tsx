'use client';

/**
 * Graph Connection Component
 * Renders a connection line between two ports
 */

import { useMemo } from 'react';
import { useGraphStore, GraphConnection as GraphConnectionType } from '../../store/graphStore';

interface GraphConnectionProps {
  connection?: GraphConnectionType;
  connectionStart?: { nodeId: string; portId: string };
  mousePosition?: { x: number; y: number };
}

export default function GraphConnection({
  connection,
  connectionStart,
  mousePosition,
}: GraphConnectionProps) {
  const { nodes, selectedConnectionId, deleteConnection } = useGraphStore();

  /**
   * Get port position on canvas
   * Uses DOM queries to find actual rendered port positions
   */
  const getPortPosition = (
    nodeId: string,
    portId: string,
    type: 'input' | 'output',
  ): { x: number; y: number } | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Find the port element in the DOM
    const portElement = document.querySelector(
      `[data-port-id="${portId}"][data-port-type="${type}"]`,
    ) as HTMLElement;

    if (!portElement) return null;

    const nodeElement = portElement.closest('[data-node-id]') as HTMLElement;
    if (!nodeElement) return null;

    const portRect = portElement.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();

    // Calculate port center relative to node
    const portX = portRect.left - nodeRect.left + portRect.width / 2;
    const portY = portRect.top - nodeRect.top + portRect.height / 2;

    // Add node position to get absolute position
    return {
      x: node.position.x + portX,
      y: node.position.y + portY,
    };
  };

  // Connection path will recalculate when nodes change (via useMemo dependency)

  /**
   * Calculate connection path
   */
  const path = useMemo(() => {
    if (connectionStart && mousePosition) {
      // Drawing connection from start to mouse
      const startPos = getPortPosition(
        connectionStart.nodeId,
        connectionStart.portId,
        'output',
      );
      if (!startPos) return null;

      const endX = mousePosition.x;
      const endY = mousePosition.y;

      // Bezier curve with better control points
      const dx = endX - startPos.x;
      const controlX1 = startPos.x + dx * 0.5;
      const controlX2 = startPos.x + dx * 0.5;

      return `M ${startPos.x} ${startPos.y} C ${controlX1} ${startPos.y}, ${controlX2} ${endY}, ${endX} ${endY}`;
    }

    if (connection) {
      const fromPos = getPortPosition(
        connection.fromNode,
        connection.fromPort,
        'output',
      );
      const toPos = getPortPosition(
        connection.toNode,
        connection.toPort,
        'input',
      );

      if (!fromPos || !toPos) return null;

      // Bezier curve with better control points
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const controlX1 = fromPos.x + dx * 0.5;
      const controlX2 = fromPos.x + dx * 0.5;
      const controlY1 = fromPos.y;
      const controlY2 = toPos.y;

      return `M ${fromPos.x} ${fromPos.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toPos.x} ${toPos.y}`;
    }

    return null;
  }, [connection, connectionStart, mousePosition, nodes]);

  if (!path) return null;

  const isSelected = connection && selectedConnectionId === connection.id;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#EF4444' : '#3B82F6'}
        strokeWidth={isSelected ? 3 : 2}
        markerEnd="url(#arrowhead)"
        style={{ pointerEvents: 'auto' }}
        className="cursor-pointer"
        onClick={() => {
          if (connection) {
            useGraphStore.getState().selectConnection(connection.id);
          }
        }}
        onDoubleClick={() => {
          if (connection) {
            deleteConnection(connection.id);
          }
        }}
      />
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="10"
        style={{ pointerEvents: 'auto' }}
        className="cursor-pointer"
        onClick={() => {
          if (connection) {
            useGraphStore.getState().selectConnection(connection.id);
          }
        }}
        onDoubleClick={() => {
          if (connection) {
            deleteConnection(connection.id);
          }
        }}
      />
    </g>
  );
}
