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
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-600 font-medium">
          💡 Drag nodes from the left sidebar
        </div>
        <button
          onClick={clearGraph}
          className="btn btn-danger btn-sm"
        >
          Clear
        </button>
        <button
          onClick={resetViewport}
          className="btn btn-secondary btn-sm"
        >
          Reset View
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          className="btn btn-success btn-sm"
        >
          Save
        </button>
        <button
          onClick={handleLoad}
          className="btn btn-primary btn-sm"
        >
          Load
        </button>
        <div className="text-sm text-gray-600 font-medium px-3 py-1.5 bg-gray-100 rounded-lg">
          Nodes: {nodes.length}
        </div>
      </div>

    </div>
  );
}

