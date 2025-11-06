'use client';

import { useState, useEffect } from 'react';

import NodeFilters from '../components/NodeFilters';
import NodeList from '../components/NodeList';
import NodeStats from '../components/NodeStats';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ErrorAlert from '../components/layout/ErrorAlert';
import LoadingState from '../components/layout/LoadingState';
import { NodeMetadata } from '../types/node';

interface NodeRegistryData {
  nodes: NodeMetadata[];
  categories: string[];
  stats: {
    totalNodes: number;
    categories: number;
    tags: number;
    deprecated: number;
  };
}

export default function Home() {
  const [data, setData] = useState<NodeRegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nodes');
      if (!response.ok) {
        throw new Error('Failed to fetch nodes');
      }
      const result = await response.json() as NodeRegistryData;
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = data?.nodes.filter(node => {
    if (selectedCategory && node.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        node.displayName.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query) ||
        node.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  }) ?? [];

  return (
    <PageContainer>
      <PageHeader
        title="Node Registry"
        description="Browse and discover available nodes in the VZ Programming system"
      />

      {/* Stats */}
      {data && (
        <div className="mb-6">
          <NodeStats stats={data.stats} />
        </div>
      )}

      {/* Filters */}
      {data && (
        <div className="mb-6">
          <NodeFilters
            categories={data.categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* Content */}
      {loading && <LoadingState message="Loading nodes..." />}

      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            void fetchNodes();
          }}
        />
      )}

      {!loading && !error && data && (
        <div>
          <div className="mb-4 text-sm text-gray-600 font-medium">
            Showing <span className="font-semibold text-gray-900">{filteredNodes.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{data.nodes.length}</span> nodes
          </div>
          <NodeList nodes={filteredNodes} />
        </div>
      )}
    </PageContainer>
  );
}

