'use client';

/**
 * React Flow Custom Node Component
 * Custom node with input/output ports for React Flow
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Port } from '../../src/types';

/**
 * Custom node data type
 */
export interface ReactFlowNodeData {
  name: string;
  type: string;
  inputs: Port[];
  outputs: Port[];
  properties?: Record<string, unknown>;
}

/**
 * Get color based on data type
 */
function getTypeColor(typeName: string): string {
  switch (typeName) {
    case 'string':
      return 'bg-green-500';
    case 'number':
      return 'bg-blue-500';
    case 'boolean':
      return 'bg-purple-500';
    case 'object':
      return 'bg-orange-500';
    case 'array':
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * React Flow Custom Node
 */
function ReactFlowNode({ data, selected }: NodeProps<ReactFlowNodeData>) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border-2 min-w-[200px] ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-300'
      }`}
    >
      {/* Node Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">{data.name}</span>
            <span className="text-xs opacity-75">({data.type})</span>
          </div>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3">
        {/* Input Ports */}
        {data.inputs.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-600 mb-1">Inputs</div>
            <div className="space-y-1">
              {data.inputs.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  title={`${port.name} (${port.dataType.name})${port.required ? ' *' : ''}`}
                >
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={port.id}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      backgroundColor: getTypeColor(port.dataType.name).includes('green') ? '#10b981' :
                        getTypeColor(port.dataType.name).includes('blue') ? '#3b82f6' :
                        getTypeColor(port.dataType.name).includes('purple') ? '#a855f7' :
                        getTypeColor(port.dataType.name).includes('orange') ? '#f97316' :
                        getTypeColor(port.dataType.name).includes('pink') ? '#ec4899' :
                        '#6b7280',
                    }}
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-medium">{port.name}</span>
                    {port.required && <span className="text-red-500 ml-1">*</span>}
                    <span className="text-gray-500 ml-1">({port.dataType.name})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Ports */}
        {data.outputs.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Outputs</div>
            <div className="space-y-1">
              {data.outputs.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                  title={`${port.name} (${port.dataType.name})`}
                >
                  <div className="flex-1 text-xs">
                    <span className="font-medium">{port.name}</span>
                    <span className="text-gray-500 ml-1">({port.dataType.name})</span>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={port.id}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      backgroundColor: getTypeColor(port.dataType.name).includes('green') ? '#10b981' :
                        getTypeColor(port.dataType.name).includes('blue') ? '#3b82f6' :
                        getTypeColor(port.dataType.name).includes('purple') ? '#a855f7' :
                        getTypeColor(port.dataType.name).includes('orange') ? '#f97316' :
                        getTypeColor(port.dataType.name).includes('pink') ? '#ec4899' :
                        '#6b7280',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Properties */}
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {Object.entries(data.properties).map(([key, value]) => (
                <div key={key}>
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ReactFlowNode);

