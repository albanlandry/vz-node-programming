'use client';

/**
 * Graph Toolbar Component
 * Provides controls for graph operations
 */

import { useGraphStore } from '../../store/graphStore';

export default function GraphToolbar() {
  const {
    addNode,
    clearGraph,
    resetViewport,
    saveGraph,
    loadGraph,
    nodes,
  } = useGraphStore();

  // Note: Node creation is now done via drag-and-drop from NodePalette
  // The "+ Add Node" button is kept for backward compatibility but simplified

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
        <div className="text-xs text-gray-500 italic">
          💡 Drag nodes from the left sidebar
        </div>
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

    </div>
  );
}

