'use client';

/**
 * Interactive Nodes List Page
 * 
 * Displays all created interactive nodes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Play } from 'lucide-react';

import CreateInteractiveNodeModal from '../../components/interactive-nodes/CreateInteractiveNodeModal';

interface InteractiveNode {
  id: string;
  type: string;
  displayName: string;
  category: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export default function InteractiveNodesPage() {
  const router = useRouter();
  const [nodes, setNodes] = useState<InteractiveNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    void loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interactive-nodes');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load interactive nodes');
      }

      setNodes(data.nodes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Are you sure you want to delete "${type}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/interactive-nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete node');
      }

      void loadNodes();
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err instanceof Error ? err.message : 'Failed to delete node');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Interactive Nodes</h1>
              <p className="text-xl text-gray-600">
                Manage interactive nodes that request user input during execution
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Interactive Node
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No interactive nodes created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Interactive Node
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {node.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{node.type}</p>
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {node.category}
                    </span>
                  </div>
                </div>

                {node.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{node.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>v{node.version}</span>
                  <span>
                    {new Date(node.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      void router.push(`/graph-editor?addNode=${node.type}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    title="Add to Graph"
                  >
                    <Play className="w-4 h-4" />
                    Use
                  </button>
                  <button
                    onClick={() => {
                      void router.push(`/interactive-nodes/${node.id}/edit`);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(node.id, node.type)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateInteractiveNodeModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            void loadNodes();
          }}
        />
      </div>
    </div>
  );
}

