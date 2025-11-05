'use client';

/**
 * Custom Nodes List Page
 * Displays all custom nodes created by users
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CustomNode {
  id: string;
  metadata: {
    type: string;
    displayName: string;
    category: string;
    description: string;
    version: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export default function CustomNodesPage() {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/custom-nodes');
      if (!response.ok) {
        throw new Error('Failed to fetch custom nodes');
      }
      const data = await response.json();
      setNodes(data.nodes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom node?')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete node');
      }

      // Refresh list
      fetchNodes();
    } catch (err) {
      alert(`Failed to delete node: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Custom Nodes</h1>
              <p className="text-xl text-gray-600">
                Manage your custom-created nodes
              </p>
            </div>
            <Link
              href="/custom-nodes/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create New Node
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button
              onClick={fetchNodes}
              className="ml-4 text-red-800 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading custom nodes...</div>
          </div>
        )}

        {/* Nodes List */}
        {!loading && !error && (
          <div>
            {nodes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">No custom nodes yet</p>
                <Link
                  href="/custom-nodes/create"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Create your first custom node
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {node.metadata.displayName}
                        </h3>
                        <p className="text-sm text-gray-500">{node.metadata.type}</p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        Custom
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{node.metadata.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {node.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      <p>Version: {node.metadata.version}</p>
                      <p>Category: {node.metadata.category}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/custom-nodes/${node.id}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(node.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

