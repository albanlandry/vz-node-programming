'use client';

/**
 * Graph Node Component
 * Draggable node with input/output ports
 */

import { useState, useRef, MouseEvent } from 'react';
import Draggable from 'react-draggable';
import { useGraphStore, GraphNode as GraphNodeType } from '../../store/graphStore';
import GraphPort from './GraphPort';

interface GraphNodeProps {
  node: GraphNodeType;
}

export default function GraphNode({ node }: GraphNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const {
    selectedNodeId,
    selectNode,
    moveNode,
    deleteNode,
    connectionStart,
    startConnection,
    addConnection,
  } = useGraphStore();

  const isSelected = selectedNodeId === node.id;

  /**
   * Handle node click
   */
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  /**
   * Handle node drag
   */
  const handleDrag = (_e: unknown, data: { x: number; y: number }) => {
    moveNode(node.id, { x: data.x, y: data.y });
  };

  /**
   * Handle delete key
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
      deleteNode(node.id);
    }
  };

  /**
   * Handle port connection start
   */
  const handlePortMouseDown = (
    portId: string,
    type: 'input' | 'output',
    e: MouseEvent,
  ) => {
    e.stopPropagation();
    
    if (type === 'output') {
      startConnection(node.id, portId);
    } else if (connectionStart) {
      // Complete connection
      addConnection({
        fromNode: connectionStart.nodeId,
        fromPort: connectionStart.portId,
        toNode: node.id,
        toPort: portId,
      });
    }
  };


  return (
    <Draggable
      nodeRef={nodeRef}
      position={node.position}
      onStart={() => setIsDragging(true)}
      onDrag={handleDrag}
      onStop={() => setIsDragging(false)}
      handle=".node-handle"
    >
      <div
        ref={nodeRef}
        data-node-id={node.id}
        tabIndex={0}
        className={`absolute bg-white rounded-lg shadow-lg border-2 min-w-[200px] ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-300'
        } ${isDragging ? 'opacity-80' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Node Header */}
        <div className="node-handle bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg cursor-grab active:cursor-grabbing">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold">{node.name}</span>
              <span className="text-xs opacity-75">({node.type})</span>
            </div>
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="text-white hover:text-red-200 text-xs"
                title="Delete node"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Node Body */}
        <div className="p-3">
          {/* Input Ports */}
          {node.inputs.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Inputs</div>
              <div className="space-y-1">
                {node.inputs.map((port) => (
                  <GraphPort
                    key={port.id}
                    port={port}
                    type="input"
                    nodeId={node.id}
                    onMouseDown={(e) => handlePortMouseDown(port.id, 'input', e)}
                    canConnect={!!connectionStart}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Output Ports */}
          {node.outputs.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Outputs</div>
              <div className="space-y-1">
                {node.outputs.map((port) => (
                  <GraphPort
                    key={port.id}
                    port={port}
                    type="output"
                    nodeId={node.id}
                    onMouseDown={(e) => handlePortMouseDown(port.id, 'output', e)}
                    canConnect={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Properties */}
          {node.properties && Object.keys(node.properties).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                {Object.entries(node.properties).map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
}

