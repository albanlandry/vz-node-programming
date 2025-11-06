'use client';

/**
 * Custom Nodes List Page
 * Displays all custom nodes created by users
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import ContentCard from '../../components/layout/ContentCard';
import EmptyState from '../../components/layout/EmptyState';
import ErrorAlert from '../../components/layout/ErrorAlert';
import LoadingState from '../../components/layout/LoadingState';

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
    <PageContainer>
      <PageHeader
        title="Custom Nodes"
        description="Manage your custom-created nodes"
        action={
          <Link href="/custom-nodes/create" className="btn btn-primary btn-lg">
            + Create New Node
          </Link>
        }
      />

      {error && <ErrorAlert message={error} onRetry={fetchNodes} />}

      {loading && <LoadingState message="Loading custom nodes..." />}

      {!loading && !error && (
        <div>
          {nodes.length === 0 ? (
            <EmptyState
              title="No custom nodes yet"
              description="Create your first custom node to get started"
              icon="🎨"
              action={
                <Link href="/custom-nodes/create" className="btn btn-primary">
                  Create Your First Node
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nodes.map((node) => (
                <ContentCard key={node.id} hover>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                        {node.metadata.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{node.metadata.type}</p>
                    </div>
                    <span className="badge badge-purple ml-2 flex-shrink-0">Custom</span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">{node.metadata.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {node.metadata.tags.map((tag) => (
                      <span key={tag} className="badge badge-gray">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Version:</span>
                      <span>{node.metadata.version}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Category:</span>
                      <span>{node.metadata.category}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      href={`/custom-nodes/${node.id}`}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </ContentCard>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

