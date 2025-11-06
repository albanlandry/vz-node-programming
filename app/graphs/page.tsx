'use client';

/**
 * Graphs Management Page
 * Lists all saved graphs with CRUD operations
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Play, Trash2, Grid3x3, List } from 'lucide-react';

import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import StatsCard from '../../components/layout/StatsCard';
import SearchBar from '../../components/layout/SearchBar';
import ContentCard from '../../components/layout/ContentCard';
import EmptyState from '../../components/layout/EmptyState';
import ErrorAlert from '../../components/layout/ErrorAlert';
import LoadingState from '../../components/layout/LoadingState';
import type { GraphMetadata } from '../../src/graph-management/types';

interface GraphListData {
  graphs: GraphMetadata[];
  stats: {
    total: number;
    totalNodes: number;
    totalConnections: number;
  };
}

type ViewMode = 'grid' | 'list';

export default function GraphsPage() {
  const [data, setData] = useState<GraphListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('graphsViewMode');
      return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    }
    return 'grid';
  });

  // Save view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('graphsViewMode', viewMode);
    }
  }, [viewMode]);

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
    <PageContainer>
      <PageHeader
        title="Graph Management"
        description="Manage and execute your saved graphs"
        action={
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <Link href="/graph-editor" className="btn btn-primary btn-lg">
              + Create New Graph
            </Link>
          </div>
        }
      />

      {/* Stats */}
      {data && (
        <StatsCard
          stats={[
            { label: 'Total Graphs', value: data.stats.total, color: 'blue', icon: '📊' },
            { label: 'Total Nodes', value: data.stats.totalNodes, color: 'green', icon: '🔷' },
            { label: 'Total Connections', value: data.stats.totalConnections, color: 'purple', icon: '🔗' },
          ]}
          columns={3}
        />
      )}

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search graphs by name, description, or tags..."
      />

      {/* Error Message */}
      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            void fetchGraphs();
          }}
        />
      )}

      {/* Loading State */}
      {loading && <LoadingState message="Loading graphs..." />}

      {/* Graphs List */}
      {!loading && !error && (
        <div>
          {filteredGraphs.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No graphs found' : 'No graphs saved yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first graph to get started'
              }
              icon="📊"
              action={
                <Link href="/graph-editor" className="btn btn-primary">
                  Create Your First Graph
                </Link>
              }
            />
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGraphs.map((graph) => (
                  <ContentCard key={graph.id} hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                          {graph.name}
                        </h3>
                        {graph.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{graph.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {graph.tags?.map((tag) => (
                        <span key={tag} className="badge badge-primary">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">{graph.nodeCount}</span>
                        <span>nodes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">{graph.connectionCount}</span>
                        <span>connections</span>
                      </div>
                      <div className="text-xs">
                        {new Date(graph.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Link
                        href={`/graph-editor?load=${graph.id}`}
                        className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      </Link>
                      <Link
                        href={`/graphs/${graph.id}/execute`}
                        className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Execute"
                      >
                        <Play className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(graph.id, graph.name)}
                        className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                      </button>
                    </div>
                  </ContentCard>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGraphs.map((graph) => (
                  <ContentCard key={graph.id} hover>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                              {graph.name}
                            </h3>
                            {graph.description && (
                              <p className="text-sm text-gray-600 line-clamp-1">{graph.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-700">{graph.nodeCount}</span>
                            <span>nodes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-700">{graph.connectionCount}</span>
                            <span>connections</span>
                          </div>
                          <div className="text-xs">
                            Updated: {new Date(graph.updatedAt).toLocaleDateString()}
                          </div>
                          {graph.tags && graph.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {graph.tags.map((tag) => (
                                <span key={tag} className="badge badge-primary text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/graph-editor?load=${graph.id}`}
                          className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        </Link>
                        <Link
                          href={`/graphs/${graph.id}/execute`}
                          className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Execute"
                        >
                          <Play className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(graph.id, graph.name)}
                          className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </ContentCard>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </PageContainer>
  );
}

