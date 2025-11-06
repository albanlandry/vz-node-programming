'use client';

/**
 * Node Palette Component
 * Left sidebar menu listing all available nodes (registry + custom)
 * Supports drag-and-drop to add nodes to the canvas
 */

import { useEffect, useState, useMemo } from 'react';
import type { NodeMetadata } from '../../types/node';
import type { Port } from '../../src/types';

/**
 * Node data from API
 */
interface NodeData {
  nodes: NodeMetadata[];
  categories?: string[];
}

/**
 * Custom node data from API
 */
interface CustomNodeData {
  nodes: Array<{
    id: string;
    metadata: {
      name: string;
      type: string;
      description?: string;
      category?: string;
      tags?: string[];
    };
    config: {
      inputs?: Port[];
      outputs?: Port[];
    };
  }>;
}

/**
 * Combined node item for display
 */
interface PaletteNodeItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  category: string;
  tags: string[];
  inputs: Port[];
  outputs: Port[];
  isCustom: boolean;
}

export default function NodePalette() {
  const [nodes, setNodes] = useState<PaletteNodeItem[]>([]);
  const [customNodes, setCustomNodes] = useState<PaletteNodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['all']));

  /**
   * Fetch nodes from registry
   */
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch('/api/nodes');
        const data = (await response.json()) as NodeData;

        if (data.nodes) {
          const formattedNodes: PaletteNodeItem[] = data.nodes.map((node) => ({
            id: node.type,
            name: node.displayName,
            type: node.type,
            description: node.description,
            category: node.category ?? 'Other',
            tags: node.tags ?? [],
            inputs: node.inputs ?? [],
            outputs: node.outputs ?? [],
            isCustom: false,
          }));
          setNodes(formattedNodes);
        }
      } catch (error) {
        console.error('Error fetching nodes:', error);
      }
    };

    const fetchCustomNodes = async () => {
      try {
        const response = await fetch('/api/custom-nodes');
        const data = (await response.json()) as CustomNodeData;

        if (data.nodes) {
          const formattedNodes: PaletteNodeItem[] = data.nodes.map((node) => ({
            id: node.id,
            name: node.metadata.name ?? node.id,
            type: node.metadata.type,
            description: node.metadata.description,
            category: node.metadata.category ?? 'Custom',
            tags: node.metadata.tags ?? [],
            inputs: node.config.inputs ?? [],
            outputs: node.config.outputs ?? [],
            isCustom: true,
          }));
          setCustomNodes(formattedNodes);
        }
      } catch (error) {
        console.error('Error fetching custom nodes:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchNodes();
    void fetchCustomNodes();
  }, []);

  /**
   * Get all categories
   */
  const categories = useMemo(() => {
    const allNodes = [...nodes, ...customNodes];
    const cats = new Set<string>();
    allNodes.forEach((node) => {
      cats.add(node.category);
    });
    return Array.from(cats).sort();
  }, [nodes, customNodes]);

  /**
   * Filter nodes by search query
   */
  const filteredNodes = useMemo(() => {
    const allNodes = [...nodes, ...customNodes];
    if (!searchQuery.trim()) {
      return allNodes;
    }
    const query = searchQuery.toLowerCase();
    return allNodes.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [nodes, customNodes, searchQuery]);

  /**
   * Group nodes by category
   */
  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, PaletteNodeItem[]> = {};
    filteredNodes.forEach((node) => {
      if (!grouped[node.category]) {
        grouped[node.category] = [];
      }
      grouped[node.category].push(node);
    });
    return grouped;
  }, [filteredNodes]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (e: React.DragEvent, node: PaletteNodeItem) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'input':
        return '📥';
      case 'transform':
      case 'utility':
        return '⚙️';
      case 'output':
        return '📤';
      case 'custom':
        return '✨';
      case 'http':
      case 'network':
        return '🌐';
      case 'data':
        return '📊';
      default:
        return '🔷';
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-900 text-white p-4 flex items-center justify-center">
        <div className="text-sm">Loading nodes...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-2">Node Palette</h2>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No nodes available</div>
        ) : (
          categories.map((category) => {
            const categoryNodes = nodesByCategory[category] ?? [];
            if (categoryNodes.length === 0) return null;

            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="border-b border-gray-800">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getCategoryIcon(category)}</span>
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-xs text-gray-500">({categoryNodes.length})</span>
                  </div>
                  <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="bg-gray-850">
                    {categoryNodes.map((node) => (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node)}
                        className="px-4 py-2.5 hover:bg-gray-800 cursor-move border-l-2 border-transparent hover:border-blue-500 transition-all group"
                        title={node.description ?? `${node.name} (${node.type})`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {node.isCustom ? (
                              <span className="text-xs text-purple-400">★</span>
                            ) : (
                              <span className="text-xs text-gray-600">::</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-white group-hover:text-blue-300">
                              {node.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{node.type}</div>
                            {(node.inputs.length > 0 || node.outputs.length > 0) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {node.inputs.length} in • {node.outputs.length} out
                              </div>
                            )}
                            {node.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {node.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <div>Total: {nodes.length + customNodes.length} nodes</div>
        <div>Custom: {customNodes.length}</div>
      </div>
    </div>
  );
}

