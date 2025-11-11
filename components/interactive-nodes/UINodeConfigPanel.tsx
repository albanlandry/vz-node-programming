'use client';

/**
 * UI Node Configuration Panel
 * 
 * Allows configuring which UI to use for an interactive node
 * and how to map form data to output ports
 * Phase 3: Basic UI selection and output mapping
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { useGraphStore } from '../../store/graphStore';
import OutputMappingPanel from './OutputMappingPanel';
import { getAllTransformations } from '../../services/transformationService';
import type { UINodeConfig, OutputMapping, ConditionalMappingRule, TransformationConfig } from '../../src/types/uiNodeConfig';
import type { GraphNode } from '../../store/graphStore';

interface UINodeConfigPanelProps {
  nodeId: string;
  onClose: () => void;
}

export default function UINodeConfigPanel({ nodeId, onClose }: UINodeConfigPanelProps) {
  const { nodes, updateNode } = useGraphStore();
  const { getAllDefinitions } = useUIBuilderStore();
  
  const node = nodes.find((n) => n.id === nodeId);
  const uiDefinitions = getAllDefinitions();
  
  const [uiDefinitionId, setUIDefinitionId] = useState<string>('');
  const [outputMapping, setOutputMapping] = useState<OutputMapping>({
    fieldToPort: {},
    transformations: {},
    conditionalRules: [],
    filters: {},
  });
  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(true);
  const [activeTab, setActiveTab] = useState<'mapping' | 'conditional' | 'filters'>('mapping');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const allTransformations = getAllTransformations();

  // Load existing configuration
  useEffect(() => {
    if (node?.properties?.uiConfig) {
      const config = node.properties.uiConfig as UINodeConfig;
      setUIDefinitionId(config.uiDefinitionId || '');
      setOutputMapping(config.outputMapping || { 
        fieldToPort: {}, 
        transformations: {},
        conditionalRules: [],
        filters: {},
      });
      setValidateBeforeSubmit(config.validateBeforeSubmit ?? true);
    }
  }, [node]);

  // Generate preview data from UI definition
  useEffect(() => {
    if (selectedUIDefinition) {
      const preview: Record<string, unknown> = {};
      selectedUIDefinition.components.forEach((comp) => {
        if (comp.name && comp.type !== 'button' && comp.type !== 'label') {
          // Generate sample data based on component type
          if (comp.type === 'input') {
            const inputComp = comp as any;
            if (inputComp.inputType === 'number') {
              preview[comp.name] = 42;
            } else if (inputComp.inputType === 'email') {
              preview[comp.name] = 'example@email.com';
            } else {
              preview[comp.name] = 'Sample Text';
            }
          } else if (comp.type === 'textarea') {
            preview[comp.name] = 'Sample multi-line text';
          } else if (comp.type === 'select') {
            const selectComp = comp as any;
            preview[comp.name] = selectComp.options?.[0]?.value || '';
          } else if (comp.type === 'checkbox') {
            preview[comp.name] = true;
          } else if (comp.type === 'radio') {
            const radioComp = comp as any;
            preview[radioComp.groupName] = radioComp.value || '';
          }
        }
      });
      setPreviewData(preview);
    }
  }, [selectedUIDefinition]);

  // Get selected UI definition
  const selectedUIDefinition = uiDefinitions.find((def) => def.id === uiDefinitionId);

  // Get available output ports
  const outputPorts = node?.outputs || [];

  // Get UI fields from selected definition
  const uiFields = selectedUIDefinition?.components
    .filter((comp) => comp.type !== 'button' && comp.type !== 'label')
    .map((comp) => ({
      name: comp.name,
      label: comp.label || comp.name,
      type: comp.type,
    })) || [];

  /**
   * Handle save
   */
  const handleSave = () => {
    if (!node) return;

    if (!uiDefinitionId) {
      alert('Please select a UI definition');
      return;
    }

    const config: UINodeConfig = {
      uiDefinitionId,
      outputMapping,
      validateBeforeSubmit,
    };

    updateNode(nodeId, {
      properties: {
        ...node.properties,
        uiConfig: config,
      },
    });

    onClose();
  };

  /**
   * Handle field to port mapping change
   */
  const handleMappingChange = (fieldName: string, portId: string) => {
    setOutputMapping((prev) => ({
      ...prev,
      fieldToPort: {
        ...prev.fieldToPort,
        [fieldName]: portId || '',
      },
    }));
  };

  /**
   * Handle conditional rule change
   */
  const handleConditionalRuleChange = (index: number, rule: ConditionalMappingRule) => {
    const rules = [...(outputMapping.conditionalRules || [])];
    rules[index] = rule;
    setOutputMapping((prev) => ({
      ...prev,
      conditionalRules: rules,
    }));
  };

  /**
   * Add conditional rule
   */
  const handleAddConditionalRule = () => {
    const newRule: ConditionalMappingRule = {
      condition: 'value > 0',
    };
    setOutputMapping((prev) => ({
      ...prev,
      conditionalRules: [...(prev.conditionalRules || []), newRule],
    }));
  };

  /**
   * Remove conditional rule
   */
  const handleRemoveConditionalRule = (index: number) => {
    const rules = outputMapping.conditionalRules?.filter((_, i) => i !== index) || [];
    setOutputMapping((prev) => ({
      ...prev,
      conditionalRules: rules,
    }));
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (type: 'exclude' | 'include', fields: string[]) => {
    setOutputMapping((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type === 'exclude' ? 'excludeFields' : 'includeFields']: fields,
      },
    }));
  };

  if (!node) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold">Configure UI for Node</h2>
            <p className="text-sm text-blue-100 mt-1">{node.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* UI Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select UI Definition
            </label>
            {uiDefinitions.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No UI Definitions Available</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Create a UI definition in the UI Builder first.
                  </p>
                </div>
              </div>
            ) : (
              <select
                value={uiDefinitionId}
                onChange={(e) => setUIDefinitionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a UI --</option>
                {uiDefinitions.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name} ({def.components.length} components)
                  </option>
                ))}
              </select>
            )}
            {selectedUIDefinition && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedUIDefinition.description || 'No description'}
              </p>
            )}
          </div>

          {/* Output Mapping (Phase 6: Enhanced) */}
          {selectedUIDefinition && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Output Mapping & Transformations</h3>
                <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setActiveTab('mapping')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === 'mapping'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Mapping
                  </button>
                  <button
                    onClick={() => setActiveTab('conditional')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === 'conditional'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Conditional
                  </button>
                  <button
                    onClick={() => setActiveTab('filters')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      activeTab === 'filters'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Filters
                  </button>
                </div>
              </div>

              {/* Mapping Tab */}
              {activeTab === 'mapping' && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">
                    Map UI form fields to node output ports with transformations.
                  </p>
                  {uiFields.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                      No mappable fields in this UI (only buttons and labels)
                    </div>
                  ) : (
                    <OutputMappingPanel
                      outputMapping={outputMapping}
                      uiFields={uiFields}
                      outputPorts={outputPorts}
                      onMappingChange={setOutputMapping}
                      previewData={previewData}
                    />
                  )}
                </div>
              )}

              {/* Conditional Rules Tab */}
              {activeTab === 'conditional' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500">
                      Define conditional mapping rules based on field values.
                    </p>
                    <button
                      onClick={handleAddConditionalRule}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Rule
                    </button>
                  </div>
                  {outputMapping.conditionalRules && outputMapping.conditionalRules.length > 0 ? (
                    <div className="space-y-3">
                      {outputMapping.conditionalRules.map((rule, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Rule {index + 1}</h4>
                            <button
                              onClick={() => handleRemoveConditionalRule(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Condition (JavaScript expression)
                              </label>
                              <input
                                type="text"
                                value={rule.condition}
                                onChange={(e) => handleConditionalRuleChange(index, { ...rule, condition: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="value > 10"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Use 'value' to refer to the field value. Example: value > 10, value === 'yes'
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  If True → Port
                                </label>
                                <select
                                  value={rule.truePort || ''}
                                  onChange={(e) => handleConditionalRuleChange(index, { ...rule, truePort: e.target.value || undefined })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- No port --</option>
                                  {outputPorts.map((port) => (
                                    <option key={port.id} value={port.id}>
                                      {port.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  If False → Port
                                </label>
                                <select
                                  value={rule.falsePort || ''}
                                  onChange={(e) => handleConditionalRuleChange(index, { ...rule, falsePort: e.target.value || undefined })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- No port --</option>
                                  {outputPorts.map((port) => (
                                    <option key={port.id} value={port.id}>
                                      {port.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 text-center">
                      No conditional rules defined. Click "Add Rule" to create one.
                    </div>
                  )}
                </div>
              )}

              {/* Filters Tab */}
              {activeTab === 'filters' && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">
                    Configure which fields to include or exclude from the output.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Exclude Fields
                      </label>
                      <div className="space-y-2">
                        {uiFields.map((field) => (
                          <label key={field.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={outputMapping.filters?.excludeFields?.includes(field.name) || false}
                              onChange={(e) => {
                                const current = outputMapping.filters?.excludeFields || [];
                                const newExclude = e.target.checked
                                  ? [...current, field.name]
                                  : current.filter((f) => f !== field.name);
                                handleFilterChange('exclude', newExclude);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{field.label} ({field.name})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Include Only (if specified, only these fields will be included)
                      </label>
                      <div className="space-y-2">
                        {uiFields.map((field) => (
                          <label key={field.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={outputMapping.filters?.includeFields?.includes(field.name) || false}
                              onChange={(e) => {
                                const current = outputMapping.filters?.includeFields || [];
                                const newInclude = e.target.checked
                                  ? [...current, field.name]
                                  : current.filter((f) => f !== field.name);
                                handleFilterChange('include', newInclude);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{field.label} ({field.name})</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        If include fields are specified, only those fields will be in the output (exclude is ignored).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Options */}
          {selectedUIDefinition && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Validation</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="validateBeforeSubmit"
                  checked={validateBeforeSubmit}
                  onChange={(e) => setValidateBeforeSubmit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="validateBeforeSubmit" className="ml-2 text-sm text-gray-700">
                  Validate form before submission
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required fields will be validated before data is sent to the next node.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!uiDefinitionId}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

