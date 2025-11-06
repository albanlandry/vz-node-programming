'use client';

/**
 * Graph Editor Page
 * Main page for the visual graph editor using React Flow
 * Layout: Left sidebar (Node Palette) + Right canvas (Graph Editor)
 * Uses full screen height
 */

import { useState, useEffect } from 'react';
import ReactFlowCanvas from '../../components/graph/ReactFlowCanvas';
import GraphToolbar from '../../components/graph/GraphToolbar';
import NodePalette from '../../components/graph/NodePalette';
import NodeDetailsPanel from '../../components/graph/NodeDetailsPanel';
import { useGraphStore } from '../../store/graphStore';

export default function GraphEditorPage() {
  const { selectedNodeId } = useGraphStore();
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsPanelNodeId, setDetailsPanelNodeId] = useState<string | null>(null);

  /**
   * Handle node double click to show details panel
   */
  const handleNodeDoubleClick = (nodeId: string) => {
    // Only show panel if the node is currently selected
    if (selectedNodeId === nodeId) {
      setDetailsPanelNodeId(nodeId);
      setShowDetailsPanel(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ height: '100vh' }}>
      <GraphToolbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette />
        {/* Right Canvas - Graph Editor */}
        <div className="flex-1 relative overflow-hidden">
          <ReactFlowCanvas onNodeDoubleClick={handleNodeDoubleClick} />
        </div>
      </div>
      {/* Node Details Panel */}
      {showDetailsPanel && (
        <NodeDetailsPanel
          nodeId={detailsPanelNodeId}
          onClose={() => {
            setShowDetailsPanel(false);
            setDetailsPanelNodeId(null);
          }}
        />
      )}
    </div>
  );
}

