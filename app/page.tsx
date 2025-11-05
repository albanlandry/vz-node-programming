'use client';

import { useState, useEffect } from 'react';

import NodeFilters from '../components/NodeFilters';
import NodeList from '../components/NodeList';
import NodeStats from '../components/NodeStats';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            VZ Programming
          </h1>
          <p className="text-xl text-gray-600">
            Node Registry - Browse and discover available nodes
          </p>
        </div>

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
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading nodes...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button
              onClick={() => {
                void fetchNodes();
              }}
              className="ml-4 text-red-800 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <div>
            <div className="mb-4 text-gray-600">
              Showing {filteredNodes.length} of {data.nodes.length} nodes
            </div>
            <NodeList nodes={filteredNodes} />
          </div>
        )}
      </main>

      <footer className="container mx-auto px-4 py-6 border-t border-gray-200 mt-12">
        <p className="text-center text-gray-600">
          VZ Programming Node Registry - {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

