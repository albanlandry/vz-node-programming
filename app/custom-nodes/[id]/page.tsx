'use client';

/**
 * Custom Node Detail Page
 * Displays detailed information about a specific custom node
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Code, Tag, Calendar, User, Package } from 'lucide-react';

import PageContainer from '../../../components/layout/PageContainer';
import PageHeader from '../../../components/layout/PageHeader';
import ContentCard from '../../../components/layout/ContentCard';
import ErrorAlert from '../../../components/layout/ErrorAlert';
import LoadingState from '../../../components/layout/LoadingState';

interface Port {
  id: string;
  name: string;
  dataType: {
    name: string;
  };
  required?: boolean;
  description?: string;
}

interface CustomNodeData {
  id: string;
  type: string;
  config: {
    name: string;
    description: string;
    template: string;
    expression: string;
    inputs: Port[];
    outputs: Port[];
  };
  metadata: {
    type: string;
    displayName: string;
    category: string;
    description: string;
    version: string;
    author?: string;
    tags: string[];
    template: string;
    expression: string;
    inputs: Port[];
    outputs: Port[];
    createdAt: string | Date;
    updatedAt: string | Date;
  };
}

export default function CustomNodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [node, setNode] = useState<CustomNodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNode();
    }
  }, [id]);

  const fetchNode = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/custom-nodes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Custom node not found');
        }
        throw new Error('Failed to fetch custom node');
      }

      const data = await response.json();
      setNode(data.node);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this custom node? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-nodes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete node');
      }

      // Redirect to custom nodes list
      router.push('/custom-nodes');
    } catch (err) {
      alert(`Failed to delete node: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (typeName: string): string => {
    switch (typeName.toLowerCase()) {
      case 'string':
        return 'bg-green-100 text-green-700';
      case 'number':
        return 'bg-blue-100 text-blue-700';
      case 'boolean':
        return 'bg-purple-100 text-purple-700';
      case 'object':
        return 'bg-orange-100 text-orange-700';
      case 'array':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading custom node..." />
      </PageContainer>
    );
  }

  if (error || !node) {
    return (
      <PageContainer>
        <ErrorAlert
          message={error ?? 'Custom node not found'}
          onRetry={error ? fetchNode : undefined}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={node.metadata.displayName}
        description={node.metadata.description}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/custom-nodes/create?edit=${id}`)}
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>
            <button
              onClick={handleDelete}
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
            </button>
          </div>
        }
      />

      <div className="mb-6">
        <Link
          href="/custom-nodes"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Custom Nodes</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <ContentCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Type</label>
                <p className="mt-1 text-gray-900 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
                  {node.metadata.type}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Category</label>
                <p className="mt-1">
                  <span className="badge badge-purple">{node.metadata.category}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Version</label>
                <p className="mt-1 text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  {node.metadata.version}
                </p>
              </div>

              {node.metadata.author && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Author</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    {node.metadata.author}
                  </p>
                </div>
              )}

              {node.metadata.tags.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {node.metadata.tags.map((tag) => (
                      <span key={tag} className="badge badge-gray">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ContentCard>

          {/* Expression */}
          <ContentCard>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Code className="w-6 h-6" />
              Expression
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Template</label>
                <p className="mt-1">
                  <span className="badge badge-primary capitalize">
                    {node.metadata.template}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Expression Code</label>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto text-sm font-mono">
                  {node.metadata.expression}
                </pre>
              </div>
            </div>
          </ContentCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ports */}
          <ContentCard>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Input Ports</h2>
            {node.metadata.inputs.length > 0 ? (
              <div className="space-y-3">
                {node.metadata.inputs.map((port) => (
                  <div
                    key={port.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-900">{port.name}</span>
                      {port.required && (
                        <span className="text-xs text-red-600 font-semibold">Required</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge ${getTypeColor(port.dataType.name)} text-xs`}>
                        {port.dataType.name}
                      </span>
                    </div>
                    {port.description && (
                      <p className="text-sm text-gray-600 mt-2">{port.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No input ports</p>
            )}
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Output Ports</h2>
            {node.metadata.outputs.length > 0 ? (
              <div className="space-y-3">
                {node.metadata.outputs.map((port) => (
                  <div
                    key={port.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-900">{port.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge ${getTypeColor(port.dataType.name)} text-xs`}>
                        {port.dataType.name}
                      </span>
                    </div>
                    {port.description && (
                      <p className="text-sm text-gray-600 mt-2">{port.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No output ports</p>
            )}
          </ContentCard>

          {/* Metadata */}
          <ContentCard>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">Created:</span>
                  <p className="text-gray-600">
                    {formatDate(node.metadata.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-gray-700">Updated:</span>
                  <p className="text-gray-600">
                    {formatDate(node.metadata.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageContainer>
  );
}

