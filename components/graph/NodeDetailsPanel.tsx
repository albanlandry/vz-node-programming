'use client';

/**
 * Node Details Panel Component
 * Floating, movable, closable panel for displaying and editing node details
 */

import { useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';
import { useGraphStore, GraphNode } from '../../store/graphStore';

interface NodeDetailsPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

const STORAGE_KEY = 'nodeDetailsPanelPosition';

export default function NodeDetailsPanel({ nodeId, onClose }: NodeDetailsPanelProps) {
  const { nodes, updateNode, selectedNodeId } = useGraphStore();
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const node = nodes.find((n) => n.id === nodeId);

  // Load position from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { x: number; y: number };
          if (parsed.x !== undefined && parsed.y !== undefined) {
            setPosition({ x: parsed.x, y: parsed.y });
          }
        }
      } catch (error) {
        console.warn('Failed to load panel position from localStorage:', error);
      }
    }
  }, []);

  // Save position to localStorage when it changes (debounced)
  useEffect(() => {
    if (!isDragging) {
      // Only save when not dragging to avoid too many writes
      const timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
          } catch (error) {
            console.warn('Failed to save panel position to localStorage:', error);
          }
        }
      }, 300); // Debounce by 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [position, isDragging]);

  /**
   * Handle drag start
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, select, textarea, button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  /**
   * Handle drag
   */
  useEffect(() => {
    if (!isDragging) return;

    let currentPosition = position;

    const handleMouseMove = (e: MouseEvent) => {
      currentPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setPosition(currentPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save position immediately when drag ends
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPosition));
        } catch (error) {
          console.warn('Failed to save panel position to localStorage:', error);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  if (!node || !nodeId) {
    return null;
  }

  const isConstantNode = node.type === 'utility.constant';

  /**
   * Handle property update for Constant node
   */
  const handlePropertyChange = (key: string, value: string) => {
    updateNode(nodeId, {
      properties: {
        ...node.properties,
        [key]: value,
      },
    });
  };

  return (
    <div
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 z-50 min-w-[320px] max-w-[400px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-75" />
          <h3 className="font-semibold text-sm">Node Details</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-blue-700 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Node Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
          <div className="text-sm text-gray-900 font-medium">{node.name}</div>
        </div>

        {/* Node Type */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
          <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
            {node.type}
          </div>
        </div>

        {/* Constant Node Specific Fields */}
        {isConstantNode && (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Data Type
              </label>
              <select
                value={(node.properties?.type as string) ?? 'string'}
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={(node.properties?.value as string) ?? ''}
                onChange={(e) => handlePropertyChange('value', e.target.value)}
                placeholder="Enter value..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {node.properties?.type === 'number' && 'Enter a number (e.g., 42)'}
                {node.properties?.type === 'boolean' && 'Enter true or false'}
                {node.properties?.type === 'string' && 'Enter any text'}
              </p>
            </div>
          </div>
        )}

        {/* Input Ports */}
        {node.inputs.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Input Ports ({node.inputs.length})
            </label>
            <div className="space-y-2">
              {node.inputs.map((port) => (
                <div
                  key={port.id}
                  className="p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{port.name}</span>
                    {port.required && (
                      <span className="text-xs text-red-600 font-semibold">Required</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Type: <span className="font-mono">{port.dataType.name}</span>
                  </div>
                  {port.description && (
                    <div className="text-xs text-gray-500 mt-1">{port.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Ports */}
        {node.outputs.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Output Ports ({node.outputs.length})
            </label>
            <div className="space-y-2">
              {node.outputs.map((port) => (
                <div
                  key={port.id}
                  className="p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{port.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Type: <span className="font-mono">{port.dataType.name}</span>
                  </div>
                  {port.description && (
                    <div className="text-xs text-gray-500 mt-1">{port.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Properties */}
        {node.properties && Object.keys(node.properties).length > 0 && !isConstantNode && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Properties
            </label>
            <div className="space-y-1">
              {Object.entries(node.properties).map(([key, value]) => (
                <div key={key} className="text-xs text-gray-600">
                  <span className="font-medium">{key}:</span>{' '}
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

