'use client';

/**
 * Graph Editor Page
 * Main page for the visual graph editor using React Flow
 * Layout: Left sidebar (Node Palette) + Right canvas (Graph Editor)
 * Uses full screen height
 */

import ReactFlowCanvas from '../../components/graph/ReactFlowCanvas';
import GraphToolbar from '../../components/graph/GraphToolbar';
import NodePalette from '../../components/graph/NodePalette';

export default function GraphEditorPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ height: '100vh' }}>
      <GraphToolbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <NodePalette />
        {/* Right Canvas - Graph Editor */}
        <div className="flex-1 relative overflow-hidden">
          <ReactFlowCanvas />
        </div>
      </div>
    </div>
  );
}

