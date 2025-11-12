'use client';

/**
 * Edit Interactive Node Page
 * 
 * Allows users to edit existing interactive nodes
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, X, ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { useUIBuilderStore } from '../../../../store/uiBuilderStore';
import type { UINodeConfig } from '../../../../src/types/uiNodeConfig';

export default function EditInteractiveNodePage() {
  const router = useRouter();
  const params = useParams();
  const nodeId = params?.id as string;
  const { getAllDefinitions, createDefinition } = useUIBuilderStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Interactive');
  const [version, setVersion] = useState('1.0.0');
  const [tags, setTags] = useState('');
  const [uiDefinitionId, setUIDefinitionId] = useState<string>('');
  const [outputMapping, setOutputMapping] = useState<UINodeConfig['outputMapping']>({
    fieldToPort: {},
    transformations: {},
    conditionalRules: [],
    filters: {},
  });
  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(true);
  const [showUIBuilder, setShowUIBuilder] = useState(false);
  const [newUIDefinitionName, setNewUIDefinitionName] = useState('');

  const uiDefinitions = getAllDefinitions();

  // Load existing node data
  useEffect(() => {
    if (nodeId) {
      void loadNode();
    }
  }, [nodeId]);

  const loadNode = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/interactive-nodes/${nodeId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load interactive node');
      }

      const node = data.node;
      if (!node) {
        throw new Error('Node not found');
      }

      // Populate form with existing data
      setDisplayName(node.metadata.displayName || '');
      setDescription(node.metadata.description || '');
      setCategory(node.metadata.category || 'Interactive');
      setVersion(node.metadata.version || '1.0.0');
      setTags(node.metadata.tags?.filter((t: string) => t !== 'interactive' && t !== 'user-input').join(', ') || '');

      // Load UI config
      const uiConfig = node.metadata.uiConfig;
      if (uiConfig) {
        setUIDefinitionId(uiConfig.uiDefinitionId || '');
        setOutputMapping(uiConfig.outputMapping || {
          fieldToPort: {},
          transformations: {},
          conditionalRules: [],
          filters: {},
        });
        setValidateBeforeSubmit(uiConfig.validateBeforeSubmit ?? true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node');
    } finally {
      setLoading(false);
    }
  };

  // Get selected UI definition
  const selectedUIDefinition = uiDefinitions.find((def) => def.id === uiDefinitionId);

  // Generate output ports from UI definition
  const generateOutputPorts = () => {
    if (!selectedUIDefinition) return [];

    const ports: Array<{ id: string; name: string; dataType: { name: string }; description?: string }> = [];
    
    // Create ports from mapped fields
    Object.entries(outputMapping.fieldToPort || {}).forEach(([fieldName, portId]) => {
      const component = selectedUIDefinition.components.find((c) => c.name === fieldName);
      if (component && !ports.find((p) => p.id === portId)) {
        ports.push({
          id: portId,
          name: component.label || component.name || fieldName,
          dataType: { name: 'ANY' },
          description: `Mapped from ${component.label || component.name}`,
        });
      }
    });

    // If no mappings, create a default output port
    if (ports.length === 0) {
      ports.push({
        id: 'value',
        name: 'Value',
        dataType: { name: 'ANY' },
        description: 'User input value',
      });
    }

    return ports;
  };

  const handleCreateUIDefinition = () => {
    if (!newUIDefinitionName.trim()) {
      setError('UI Definition name is required');
      return;
    }

    const newDef = createDefinition(newUIDefinitionName, `UI for ${displayName || 'interactive node'}`);
    setUIDefinitionId(newDef.id);
    setNewUIDefinitionName('');
    setShowUIBuilder(false);
    // Open UI builder in new tab
    window.open(`/ui-builder?definition=${newDef.id}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName) {
      setError('Display name is required');
      return;
    }

    if (!uiDefinitionId) {
      setError('UI Definition is required');
      return;
    }

    if (!selectedUIDefinition) {
      setError('Selected UI Definition not found');
      return;
    }

    setSaving(true);

    try {
      const outputPorts = generateOutputPorts();

      const response = await fetch(`/api/interactive-nodes/${nodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          description,
          category,
          version,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          uiDefinitionId,
          outputMapping,
          validateBeforeSubmit,
          outputs: outputPorts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update interactive node');
      }

      // Redirect to interactive nodes list
      router.push('/interactive-nodes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update node');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interactive node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Interactive Node</h1>
          <p className="text-xl text-gray-600">
            Update the interactive node configuration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="User Input Form"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="This node requests user input during execution..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="interactive, user-input, form"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* UI Definition Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">UI Definition</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select UI Definition *
                </label>
                <div className="flex gap-2">
                  <select
                    value={uiDefinitionId}
                    onChange={(e) => setUIDefinitionId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select a UI Definition --</option>
                    {uiDefinitions.map((def) => (
                      <option key={def.id} value={def.id}>
                        {def.name} {def.description ? `- ${def.description}` : ''}
                      </option>
                    ))}
                  </select>
                  {uiDefinitionId && (
                    <a
                      href={`/ui-builder?definition=${uiDefinitionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
                      title="Edit in UI Builder"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Edit
                    </a>
                  )}
                </div>
              </div>

              {selectedUIDefinition && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Selected:</strong> {selectedUIDefinition.name}
                  </p>
                  {selectedUIDefinition.description && (
                    <p className="text-xs text-blue-700 mt-1">{selectedUIDefinition.description}</p>
                  )}
                  <p className="text-xs text-blue-600 mt-2">
                    {selectedUIDefinition.components.length} component(s)
                  </p>
                </div>
              )}

              {/* Create New UI Definition */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowUIBuilder(!showUIBuilder)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {showUIBuilder ? 'Cancel' : 'Create New UI Definition'}
                </button>

                {showUIBuilder && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UI Definition Name *
                      </label>
                      <input
                        type="text"
                        value={newUIDefinitionName}
                        onChange={(e) => setNewUIDefinitionName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Form"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateUIDefinition}
                      disabled={!newUIDefinitionName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create & Open in UI Builder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Output Mapping Configuration */}
          {selectedUIDefinition && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Output Mapping</h2>
              <div className="border border-gray-200 rounded-md">
                <OutputMappingConfig
                  uiDefinition={selectedUIDefinition}
                  outputMapping={outputMapping}
                  onOutputMappingChange={setOutputMapping}
                  validateBeforeSubmit={validateBeforeSubmit}
                  onValidateBeforeSubmitChange={setValidateBeforeSubmit}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving || !uiDefinitionId || !displayName}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Output Mapping Configuration Component
 * Simplified version for interactive node creation
 */
function OutputMappingConfig({
  uiDefinition,
  outputMapping,
  onOutputMappingChange,
  validateBeforeSubmit,
  onValidateBeforeSubmitChange,
}: {
  uiDefinition: any;
  outputMapping: UINodeConfig['outputMapping'];
  onOutputMappingChange: (mapping: UINodeConfig['outputMapping']) => void;
  validateBeforeSubmit: boolean;
  onValidateBeforeSubmitChange: (value: boolean) => void;
}) {
  const uiFields = uiDefinition.components.filter(
    (comp: any) => comp.type !== 'button' && comp.type !== 'label' && comp.name
  );

  const handleFieldMapping = (fieldName: string, portId: string) => {
    const newMapping = {
      ...outputMapping,
      fieldToPort: {
        ...outputMapping.fieldToPort,
        [fieldName]: portId,
      },
    };
    onOutputMappingChange(newMapping);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="validateBeforeSubmit"
          checked={validateBeforeSubmit}
          onChange={(e) => onValidateBeforeSubmitChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="validateBeforeSubmit" className="text-sm font-medium text-gray-700">
          Validate form before submission
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Map Form Fields to Output Ports</h3>
        {uiFields.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No form fields available in this UI definition</p>
        ) : (
          <div className="space-y-3">
            {uiFields.map((field: any) => {
              const currentPortId = outputMapping.fieldToPort?.[field.name] || '';
              return (
                <div key={field.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field.label || field.name}
                    </label>
                    <span className="text-xs text-gray-400 uppercase">{field.type}</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentPortId}
                      onChange={(e) => handleFieldMapping(field.name, e.target.value)}
                      placeholder="output_port_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Object.keys(outputMapping.fieldToPort || {}).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">
            <strong>Note:</strong> Output ports will be automatically generated from mapped fields.
          </p>
        </div>
      )}
    </div>
  );
}

