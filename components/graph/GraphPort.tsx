'use client';

/**
 * Graph Port Component
 * Visual representation of an input/output port
 */

import { MouseEvent } from 'react';
import { Port } from '../../src/types';

interface GraphPortProps {
  port: Port;
  type: 'input' | 'output';
  nodeId: string;
  onMouseDown: (e: MouseEvent) => void;
  canConnect: boolean;
}

export default function GraphPort({
  port,
  type,
  onMouseDown,
  canConnect,
}: GraphPortProps) {
  /**
   * Get color based on data type
   */
  const getTypeColor = (typeName: string): string => {
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
  };

  return (
    <div
      data-port-id={port.id}
      data-port-type={type}
      className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
        canConnect ? 'cursor-crosshair' : 'cursor-pointer'
      }`}
      onMouseDown={onMouseDown}
      title={`${port.name} (${port.dataType.name})${port.required ? ' *' : ''}`}
    >
      {type === 'input' && (
        <div
          className={`w-3 h-3 rounded-full border-2 border-white ${getTypeColor(
            port.dataType.name,
          )} ${canConnect ? 'ring-2 ring-blue-400' : ''}`}
        />
      )}
      <div className="flex-1 text-xs">
        <span className="font-medium">{port.name}</span>
        {port.required && <span className="text-red-500 ml-1">*</span>}
        <span className="text-gray-500 ml-1">({port.dataType.name})</span>
      </div>
      {type === 'output' && (
        <div
          className={`w-3 h-3 rounded-full border-2 border-white ${getTypeColor(
            port.dataType.name,
          )}`}
        />
      )}
    </div>
  );
}

