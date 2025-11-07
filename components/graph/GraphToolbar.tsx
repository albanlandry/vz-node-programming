'use client';

/**
 * Graph Toolbar Component
 * Provides controls for graph operations with save, load, and export functionality
 */

import { useState, useEffect } from 'react';

import { Save, FolderOpen, Download, RotateCcw, Trash2, Edit } from 'lucide-react';

import type { GraphMetadata } from '../../src/graph-management/types';
import { useGraphStore } from '../../store/graphStore';

interface GraphSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, tags: string[]) => Promise<void>;
  loading: boolean;
  initialName?: string;
  initialDescription?: string;
  initialTags?: string;
  title?: string;
}

function GraphSaveDialog({
  isOpen,
  onClose,
  onSave,
  loading,
  initialName = '',
  initialDescription = '',
  initialTags = '',
  title = 'Save Graph',
}: GraphSaveDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState(initialTags);

  // Reset form when dialog opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setTags(initialTags);
    }
  }, [isOpen, initialName, initialDescription, initialTags]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await onSave(name, description, tagArray);
    setName('');
    setDescription('');
    setTags('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Graph Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter graph name"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter graph description"
                rows={3}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tag1, tag2, tag3"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn btn-primary btn-sm"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GraphLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadFromBackend: (graphId: string) => Promise<void>;
  onLoadFromFile: () => void;
  graphs: GraphMetadata[];
  loading: boolean;
}

function GraphLoadDialog({
  isOpen,
  onClose,
  onLoadFromBackend,
  onLoadFromFile,
  graphs,
  loading,
}: GraphLoadDialogProps) {
  const [selectedGraphId, setSelectedGraphId] = useState('');

  if (!isOpen) return null;

  const handleLoadBackend = async () => {
    if (selectedGraphId) {
      await onLoadFromBackend(selectedGraphId);
      setSelectedGraphId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Load Graph</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Load from Backend
            </label>
            <select
              value={selectedGraphId}
              onChange={(e) => setSelectedGraphId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a graph...</option>
              {graphs.map((graph) => (
                <option key={graph.id} value={graph.id}>
                  {graph.name} ({graph.nodeCount} nodes)
                </option>
              ))}
            </select>
            <button
              onClick={handleLoadBackend}
              disabled={loading || !selectedGraphId}
              className="btn btn-primary btn-sm w-full mt-2"
            >
              {loading ? 'Loading...' : 'Load from Backend'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Load from Local File
            </label>
            <button
              onClick={onLoadFromFile}
              disabled={loading}
              className="btn btn-secondary btn-sm w-full"
            >
              {loading ? 'Loading...' : 'Choose File'}
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'xml' | 'yaml') => Promise<void>;
  loading: boolean;
}

function ExportMenu({ isOpen, onClose, onExport, loading }: ExportMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
        <button
          onClick={() => {
            void onExport('json');
          }}
          disabled={loading}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export as JSON
        </button>
        <button
          onClick={() => {
            void onExport('xml');
          }}
          disabled={loading}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export as XML
        </button>
        <button
          onClick={() => {
            void onExport('yaml');
          }}
          disabled={loading}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export as YAML
        </button>
      </div>
    </>
  );
}

export default function GraphToolbar() {
  const {
    saveGraph: getGraphData,
    loadGraph,
    nodes,
    currentGraphId,
    currentGraphMetadata,
    setCurrentGraph,
  } = useGraphStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [availableGraphs, setAvailableGraphs] = useState<GraphMetadata[]>([]);

  /**
   * Fetch available graphs from backend
   */
  const fetchAvailableGraphs = async () => {
    try {
      const response = await fetch('/api/graphs');
      if (response.ok) {
        const data = await response.json();
        setAvailableGraphs(data.graphs ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch graphs:', error);
    }
  };

  /**
   * Handle save graph to backend (new or existing)
   */
  const handleSaveToBackend = async (name: string, description: string, tags: string[]) => {
    setLoading(true);
    setLoadingMessage('Saving graph to backend...');

    try {
      const graphData = getGraphData();

      // If we have a current graph ID, update it; otherwise create new
      if (currentGraphId) {
        const response = await fetch(`/api/graphs/${currentGraphId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: graphData,
            metadata: {
              name,
              description: description || undefined,
              tags,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update graph');
        }

        const result = await response.json();
        setCurrentGraph(currentGraphId, result.graph.metadata);
        alert('Graph updated successfully!');
      } else {
        const response = await fetch('/api/graphs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: graphData,
            metadata: {
              name,
              description: description || undefined,
              tags,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save graph');
        }

        const result = await response.json();
        setCurrentGraph(result.graph.id, result.graph.metadata);
        alert('Graph saved successfully!');
      }

      setSaveDialogOpen(false);
      void fetchAvailableGraphs();
    } catch (error) {
      alert(`Failed to save graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Handle quick save (no dialog for existing graphs)
   */
  const handleQuickSave = async () => {
    if (!currentGraphId) {
      // New graph - show dialog
      setSaveDialogOpen(true);
      return;
    }

    // Existing graph - save directly
    setLoading(true);
    setLoadingMessage('Saving graph...');

    try {
      const graphData = getGraphData();

      const response = await fetch(`/api/graphs/${currentGraphId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: graphData,
          metadata: currentGraphMetadata ? {
            name: currentGraphMetadata.name,
            description: currentGraphMetadata.description,
            tags: currentGraphMetadata.tags,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save graph');
      }

      const result = await response.json();
      setCurrentGraph(currentGraphId, result.graph.metadata);
      alert('Graph saved successfully!');
      void fetchAvailableGraphs();
    } catch (error) {
      alert(`Failed to save graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Handle edit graph metadata
   */
  const handleEditMetadata = async (name: string, description: string, tags: string[]) => {
    if (!currentGraphId) {
      alert('No graph loaded to edit');
      return;
    }

    setLoading(true);
    setLoadingMessage('Updating graph metadata...');

    try {
      const response = await fetch(`/api/graphs/${currentGraphId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            name,
            description: description || undefined,
            tags,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update graph');
      }

      const result = await response.json();
      setCurrentGraph(currentGraphId, result.graph.metadata);
      alert('Graph metadata updated successfully!');
      setEditDialogOpen(false);
      void fetchAvailableGraphs();
    } catch (error) {
      alert(`Failed to update graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Handle export graph
   */
  const handleExport = async (format: 'json' | 'xml' | 'yaml') => {
    setLoading(true);
    setLoadingMessage(`Exporting graph as ${format.toUpperCase()}...`);
    setExportMenuOpen(false);

    try {
      const graphData = getGraphData();
      let content = '';
      let mimeType = '';
      let extension = '';

      switch (format) {
        case 'json':
          content = JSON.stringify(graphData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'yaml':
          // Simple YAML conversion
          content = convertToYAML(graphData);
          mimeType = 'text/yaml';
          extension = 'yaml';
          break;
        case 'xml':
          content = convertToXML(graphData);
          mimeType = 'application/xml';
          extension = 'xml';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `graph.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to export graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Convert graph data to YAML
   */
  const convertToYAML = (data: unknown, indent = 0): string => {
    const indentStr = '  '.repeat(indent);

    if (data === null || data === undefined) {
      return 'null';
    }

    if (typeof data === 'string') {
      return `"${data.replace(/"/g, '\\"')}"`;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '[]';
      }
      return data.map((item) => `${indentStr}- ${convertToYAML(item, indent + 1)}`).join('\n');
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        return '{}';
      }
      return entries
        .map(([key, value]) => {
          const valueStr = convertToYAML(value, indent + 1);
          return `${indentStr}${key}: ${valueStr}`;
        })
        .join('\n');
    }

    return String(data);
  };

  /**
   * Convert graph data to XML
   */
  const convertToXML = (data: unknown, rootName = 'graph'): string => {
    const escapeXML = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const convertValue = (value: unknown, name: string, indent = 0): string => {
      const indentStr = '  '.repeat(indent);

      if (value === null || value === undefined) {
        return `${indentStr}<${name} />`;
      }

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return `${indentStr}<${name}>${escapeXML(String(value))}</${name}>`;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return `${indentStr}<${name} />`;
        }
        return value
          .map((item, index) => convertValue(item, 'item', indent + 1).replace(/<item>/, `<${name} index="${index}">`).replace(/<\/item>/, `</${name}>`))
          .join('\n');
      }

      if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) {
          return `${indentStr}<${name} />`;
        }
        const children = entries.map(([key, val]) => convertValue(val, key, indent + 1)).join('\n');
        return `${indentStr}<${name}>\n${children}\n${indentStr}</${name}>`;
      }

      return `${indentStr}<${name}>${escapeXML(String(value))}</${name}>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n${convertValue(data, rootName)}`;
  };

  /**
   * Handle load graph from backend
   */
  const handleLoadFromBackend = async (graphId: string) => {
    setLoading(true);
    setLoadingMessage('Loading graph from backend...');

    try {
      const response = await fetch(`/api/graphs/${graphId}`);
      if (!response.ok) {
        throw new Error('Failed to load graph');
      }

      const result = await response.json();
      const graph = result.graph;

      // Load graph data, ignoring invalid values
      const safeLoadGraph = (data: {
        nodes?: unknown[];
        connections?: unknown[];
        viewport?: unknown;
      }) => {
        const validNodes =
          data.nodes && Array.isArray(data.nodes)
            ? data.nodes.filter((node) => {
                return (
                  typeof node === 'object' &&
                  node !== null &&
                  'id' in node &&
                  'name' in node &&
                  'type' in node &&
                  'position' in node
                );
              })
            : [];

        const validConnections =
          data.connections && Array.isArray(data.connections)
            ? data.connections.filter((conn) => {
                return (
                  typeof conn === 'object' &&
                  conn !== null &&
                  'id' in conn &&
                  'fromNode' in conn &&
                  'toNode' in conn
                );
              })
            : [];

        const validViewport =
          data.viewport &&
          typeof data.viewport === 'object' &&
          data.viewport !== null &&
          'x' in data.viewport &&
          'y' in data.viewport &&
          'zoom' in data.viewport
            ? data.viewport
            : { x: 0, y: 0, zoom: 1 };

        loadGraph({
          nodes: validNodes as Parameters<typeof loadGraph>[0]['nodes'],
          connections: validConnections as Parameters<typeof loadGraph>[0]['connections'],
          viewport: validViewport as Parameters<typeof loadGraph>[0]['viewport'],
        });
      };

      safeLoadGraph(graph.data);
      // Store current graph ID and metadata
      setCurrentGraph(graph.id, graph.metadata);
      setLoadDialogOpen(false);
      alert('Graph loaded successfully!');
    } catch (error) {
      alert(`Failed to load graph: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  /**
   * Handle load graph from local file
   */
  const handleLoadFromFile = () => {
    setLoading(true);
    setLoadingMessage('Loading graph from file...');
    setLoadDialogOpen(false);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,.xml,.yaml,.yml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            let data: unknown;

            // Parse based on file extension
            if (file.name.endsWith('.json')) {
              data = JSON.parse(content);
            } else if (file.name.endsWith('.xml')) {
              // Simple XML parsing (for production, use a library)
              data = parseSimpleXML(content);
            } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
              // Simple YAML parsing (for production, use a library like js-yaml)
              data = parseSimpleYAML(content);
            } else {
              // Try JSON first
              try {
                data = JSON.parse(content);
              } catch {
                throw new Error('Unsupported file format');
              }
            }

            // Load graph data, ignoring invalid values
            const safeLoadGraph = (graphData: unknown) => {
              if (typeof graphData !== 'object' || graphData === null) {
                throw new Error('Invalid graph data format');
              }

              const obj = graphData as Record<string, unknown>;
              const dataObj = obj.data as Record<string, unknown> | undefined;

              // Handle different graph formats
              const nodes = (obj.nodes ?? dataObj?.nodes ?? []) as unknown[];
              const connections = (obj.connections ?? dataObj?.connections ?? []) as unknown[];
              const viewport = (obj.viewport ?? dataObj?.viewport ?? { x: 0, y: 0, zoom: 1 }) as {
                x: number;
                y: number;
                zoom: number;
              };

              const validNodes = Array.isArray(nodes)
                ? nodes.filter((node) => {
                    return (
                      typeof node === 'object' &&
                      node !== null &&
                      'id' in node &&
                      'name' in node &&
                      'type' in node &&
                      'position' in node
                    );
                  })
                : [];

              const validConnections = Array.isArray(connections)
                ? connections.filter((conn) => {
                    return (
                      typeof conn === 'object' &&
                      conn !== null &&
                      'id' in conn &&
                      'fromNode' in conn &&
                      'toNode' in conn
                    );
                  })
                : [];

              const validViewport =
                typeof viewport === 'object' &&
                viewport !== null &&
                'x' in viewport &&
                'y' in viewport &&
                'zoom' in viewport
                  ? viewport
                  : { x: 0, y: 0, zoom: 1 };

              loadGraph({
                nodes: validNodes as Parameters<typeof loadGraph>[0]['nodes'],
                connections: validConnections as Parameters<typeof loadGraph>[0]['connections'],
                viewport: validViewport,
              });
            };

            safeLoadGraph(data);
            alert('Graph loaded successfully!');
          } catch (error) {
            alert(`Failed to load graph: ${error instanceof Error ? error.message : String(error)}`);
          } finally {
            setLoading(false);
            setLoadingMessage('');
          }
        };
        reader.readAsText(file);
      } else {
        setLoading(false);
        setLoadingMessage('');
      }
    };
    input.click();
  };

  /**
   * Simple XML parser (basic implementation)
   */
  const parseSimpleXML = (xml: string): unknown => {
    // Very basic XML to JSON conversion
    // For production, use a proper XML parser library
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const parseNode = (node: Node): unknown => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const result: Record<string, unknown> = {};

        // Process child nodes
        Array.from(element.childNodes).forEach((child) => {
          const childResult = parseNode(child);
          if (childResult) {
            const childName = (child as Element).tagName || 'value';
            if (result[childName]) {
              if (!Array.isArray(result[childName])) {
                result[childName] = [result[childName]];
              }
              (result[childName] as unknown[]).push(childResult);
            } else {
              result[childName] = childResult;
            }
          }
        });

        return Object.keys(result).length > 0 ? result : element.textContent?.trim() || '';
      }

      return null;
    };

    return parseNode(doc.documentElement);
  };

  /**
   * Simple YAML parser (basic implementation)
   */
  const parseSimpleYAML = (yaml: string): unknown => {
    // Very basic YAML to JSON conversion
    // For production, use a proper YAML parser library like js-yaml
    const lines = yaml.split('\n');
    const result: Record<string, unknown> = {};
    const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [];

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
      const content = line.trim();

      if (content.startsWith('-')) {
        // Array item
        const value = content.substring(1).trim();
        // Handle arrays (simplified)
        continue;
      } else {
        // Key-value pair
        const colonIndex = content.indexOf(':');
        if (colonIndex > 0) {
          const key = content.substring(0, colonIndex).trim();
          const value = content.substring(colonIndex + 1).trim();

          // Update stack based on indent
          while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
          }

          const currentObj = stack.length > 0 ? stack[stack.length - 1].obj : result;

          if (value === '' || value === '{}' || value === '[]') {
            currentObj[key] = {};
            stack.push({ obj: currentObj[key] as Record<string, unknown>, indent });
          } else {
            // Try to parse value
            let parsedValue: unknown = value;
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (value === 'null') parsedValue = null;
            else if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);
            else if (value.startsWith('"') && value.endsWith('"')) {
              parsedValue = value.slice(1, -1);
            }

            currentObj[key] = parsedValue;
          }
        }
      }
    }

    return result;
  };

  /**
   * Open load dialog and fetch graphs
   */
  const handleOpenLoadDialog = () => {
    setLoadDialogOpen(true);
    void fetchAvailableGraphs();
  };

  return (
    <>
      <div className={`bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm ${loading ? 'opacity-75 pointer-events-none' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600 font-medium">
            💡 Drag nodes from the left sidebar
          </div>
          <button
            onClick={() => {
              useGraphStore.getState().clearGraph();
            }}
            disabled={loading}
            className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear"
          >
            <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600 disabled:text-gray-300" />
          </button>
          <button
            onClick={() => {
              useGraphStore.getState().resetViewport();
            }}
            disabled={loading}
            className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5 text-gray-600 group-hover:text-blue-600 disabled:text-gray-300" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={handleQuickSave}
              disabled={loading || nodes.length === 0}
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={currentGraphId ? 'Save (Quick Save)' : 'Save'}
            >
              <Save className="w-5 h-5 text-gray-600 group-hover:text-green-600 disabled:text-gray-300" />
            </button>
          </div>

          {currentGraphId && (
            <div className="relative">
              <button
                onClick={() => setEditDialogOpen(true)}
                disabled={loading}
                className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit Graph Metadata"
              >
                <Edit className="w-5 h-5 text-gray-600 group-hover:text-blue-600 disabled:text-gray-300" />
              </button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={handleOpenLoadDialog}
              disabled={loading}
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Load"
            >
              <FolderOpen className="w-5 h-5 text-gray-600 group-hover:text-blue-600 disabled:text-gray-300" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={loading || nodes.length === 0}
              className="group p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export"
            >
              <Download className="w-5 h-5 text-gray-600 group-hover:text-blue-600 disabled:text-gray-300" />
            </button>
            <ExportMenu
              isOpen={exportMenuOpen}
              onClose={() => setExportMenuOpen(false)}
              onExport={handleExport}
              loading={loading}
            />
          </div>

          <div className="text-sm text-gray-600 font-medium px-3 py-1.5 bg-gray-100 rounded-lg">
            Nodes: {nodes.length}
          </div>
        </div>
      </div>

      {/* Progress Loader */}
      {loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-blue-700">{loadingMessage}</span>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <GraphSaveDialog
        isOpen={saveDialogOpen}
        onClose={() => {
          setSaveDialogOpen(false);
        }}
        onSave={handleSaveToBackend}
        loading={loading}
      />

      {/* Edit Dialog */}
      <GraphSaveDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
        }}
        onSave={handleEditMetadata}
        loading={loading}
        initialName={currentGraphMetadata?.name ?? ''}
        initialDescription={currentGraphMetadata?.description ?? ''}
        initialTags={currentGraphMetadata?.tags?.join(', ') ?? ''}
        title="Edit Graph Metadata"
      />

      {/* Load Dialog */}
      <GraphLoadDialog
        isOpen={loadDialogOpen}
        onClose={() => {
          setLoadDialogOpen(false);
        }}
        onLoadFromBackend={handleLoadFromBackend}
        onLoadFromFile={handleLoadFromFile}
        graphs={availableGraphs}
        loading={loading}
      />
    </>
  );
}
