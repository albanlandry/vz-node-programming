'use client';

/**
 * Graph Canvas Component
 * Main canvas for rendering the graph with pan and zoom support
 */

import { useRef, MouseEvent, useState, useEffect } from 'react';
import { useGraphStore } from '../../store/graphStore';
import GraphNode from './GraphNode';
import GraphConnection from './GraphConnection';

export default function GraphCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const { nodes, connections, viewport, pan, zoom, connectionStart, cancelConnection } = useGraphStore();

  /**
   * Cancel connection on mouse up outside
   */
  useEffect(() => {
    const handleMouseUp = () => {
      if (connectionStart) {
        // Small delay to allow connection completion
        setTimeout(() => {
          if (useGraphStore.getState().connectionStart) {
            cancelConnection();
          }
        }, 100);
      }
      setMousePosition(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [connectionStart, cancelConnection]);

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoom(delta, centerX, centerY);
    }
  };

  /**
   * Handle mouse down for panning
   */
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse button or Ctrl+Left click
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  /**
   * Handle mouse move for panning
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning.current) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      pan(deltaX, deltaY);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
    
    // Track mouse position for connection drawing
    if (connectionStart) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate mouse position in graph coordinates
        const graphX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
        const graphY = (e.clientY - rect.top - viewport.y) / viewport.zoom;
        setMousePosition({ x: graphX, y: graphY });
      }
    } else {
      setMousePosition(null);
    }
  };

  /**
   * Handle mouse up
   */
  const handleMouseUp = () => {
    isPanning.current = false;
  };

  /**
   * Handle canvas click to deselect
   */
  const handleCanvasClick = (e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      useGraphStore.getState().selectNode(null);
      useGraphStore.getState().selectConnection(null);
    }
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden bg-gray-100 cursor-move"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* SVG layer for connections */}
      <svg
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
          </marker>
        </defs>
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
          style={{ pointerEvents: 'auto' }}
        >
          {connections.map((connection) => (
            <GraphConnection key={connection.id} connection={connection} />
          ))}
          {connectionStart && mousePosition && (
            <GraphConnection connectionStart={connectionStart} mousePosition={mousePosition} />
          )}
        </g>
      </svg>

      {/* Nodes layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
        }}
      >
        {nodes.map((node) => (
          <div key={node.id} style={{ pointerEvents: 'auto' }}>
            <GraphNode node={node} />
          </div>
        ))}
      </div>

      {/* Viewport info */}
      <div className="absolute bottom-4 right-4 bg-white/80 px-3 py-2 rounded text-xs">
        Zoom: {(viewport.zoom * 100).toFixed(0)}% | Pan: ({viewport.x.toFixed(0)}, {viewport.y.toFixed(0)})
      </div>
    </div>
  );
}

