'use client';

/**
 * Graph Toolbar Component
 * Provides controls for graph operations
 */

import { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { DataTypes } from '../../src/types';

export default function GraphToolbar() {
  const {
    addNode,
    clearGraph,
    resetViewport,
    saveGraph,
    loadGraph,
    nodes,
  } = useGraphStore();

  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('custom');

  /**
   * Handle add node
   */
  const handleAddNode = () => {
    if (!nodeName.trim()) return;

    // Create default ports
    const defaultInput = {
      id: `input-${Date.now()}`,
      name: 'input',
      dataType: DataTypes.STRING,
      required: false,
    };
    const defaultOutput = {
      id: `output-${Date.now()}`,
      name: 'output',
      dataType: DataTypes.STRING,
    };

    addNode({
      name: nodeName,
      type: nodeType,
      position: { x: 100, y: 100 },
      inputs: [defaultInput],
      outputs: [defaultOutput],
    });

    setNodeName('');
    setShowNodeDialog(false);
  };

  /**
   * Handle save graph
   */
  const handleSave = () => {
    const data = saveGraph();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Handle load graph
   */
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            loadGraph(data);
          } catch (error) {
            alert('Failed to load graph: ' + (error instanceof Error ? error.message : String(error)));
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowNodeDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          + Add Node
        </button>
        <button
          onClick={clearGraph}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
        >
          Clear
        </button>
        <button
          onClick={resetViewport}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
        >
          Reset View
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          Save
        </button>
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
        >
          Load
        </button>
        <div className="text-sm text-gray-600">
          Nodes: {nodes.length}
        </div>
      </div>

      {/* Add Node Dialog */}
      {showNodeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Node</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Name *
                </label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter node name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNode();
                    } else if (e.key === 'Escape') {
                      setShowNodeDialog(false);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Type
                </label>
                <input
                  type="text"
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter node type"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNodeDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!nodeName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

