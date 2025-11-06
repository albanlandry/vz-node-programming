'use client';

/**
 * Graphs Management Page
 * Lists all saved graphs with CRUD operations
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { GraphMetadata } from '../../src/graph-management/types';

interface GraphListData {
  graphs: GraphMetadata[];
  stats: {
    total: number;
    totalNodes: number;
    totalConnections: number;
  };
}

export default function GraphsPage() {
  const [data, setData] = useState<GraphListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchGraphs();
  }, []);

  const fetchGraphs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphs');
      if (!response.ok) {
        throw new Error('Failed to fetch graphs');
      }
      const result = (await response.json()) as GraphListData;
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graphs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the graph "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/graphs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete graph');
      }

      // Refresh list
      void fetchGraphs();
    } catch (err) {
      alert(`Failed to delete graph: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredGraphs = data?.graphs.filter((graph) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      graph.name.toLowerCase().includes(query) ||
      graph.description?.toLowerCase().includes(query) ||
      graph.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Graph Management</h1>
              <p className="text-xl text-gray-600">
                Manage and execute your saved graphs
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/graph-editor"
                className="btn btn-primary"
              >
                + Create New Graph
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Graphs</div>
                <div className="text-3xl font-bold text-blue-600">{data.stats.total}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Nodes</div>
                <div className="text-3xl font-bold text-green-600">{data.stats.totalNodes}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Connections</div>
                <div className="text-3xl font-bold text-purple-600">{data.stats.totalConnections}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search graphs by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button
              onClick={() => {
                void fetchGraphs();
              }}
              className="ml-4 text-red-800 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading graphs...</div>
          </div>
        )}

        {/* Graphs List */}
        {!loading && !error && (
          <div>
            {filteredGraphs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">
                  {searchQuery ? 'No graphs found matching your search' : 'No graphs saved yet'}
                </p>
                <Link
                  href="/graph-editor"
                  className="btn btn-primary"
                >
                  Create Your First Graph
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGraphs.map((graph) => (
                  <div
                    key={graph.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{graph.name}</h3>
                        {graph.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{graph.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {graph.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div>
                        <span className="font-medium">{graph.nodeCount}</span> nodes
                      </div>
                      <div>
                        <span className="font-medium">{graph.connectionCount}</span> connections
                      </div>
                      <div>
                        {new Date(graph.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/graph-editor?load=${graph.id}`}
                        className="btn btn-primary btn-sm flex-1"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/graphs/${graph.id}/execute`}
                        className="btn btn-success btn-sm flex-1"
                      >
                        Execute
                      </Link>
                      <button
                        onClick={() => handleDelete(graph.id, graph.name)}
                        className="btn btn-danger btn-sm"
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

