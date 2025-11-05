'use client';

/**
 * Graph Editor Page
 * Main page for the visual graph editor
 */

import GraphCanvas from '../../components/graph/GraphCanvas';
import GraphToolbar from '../../components/graph/GraphToolbar';

export default function GraphEditorPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <GraphToolbar />
      <div className="flex-1 relative overflow-hidden">
        <GraphCanvas />
      </div>
    </div>
  );
}

