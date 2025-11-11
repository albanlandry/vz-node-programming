'use client';

/**
 * UI Node Configuration Panel
 * 
 * Allows configuring which UI to use for an interactive node
 * and how to map form data to output ports
 * Phase 3: Basic UI selection and output mapping
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { useGraphStore } from '../../store/graphStore';
import type { UINodeConfig, OutputMapping } from '../../src/types/uiNodeConfig';
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
  });
  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(true);

  // Load existing configuration
  useEffect(() => {
    if (node?.properties?.uiConfig) {
      const config = node.properties.uiConfig as UINodeConfig;
      setUIDefinitionId(config.uiDefinitionId || '');
      setOutputMapping(config.outputMapping || { fieldToPort: {}, transformations: {} });
      setValidateBeforeSubmit(config.validateBeforeSubmit ?? true);
    }
  }, [node]);

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
   * Handle transformation change
   */
  const handleTransformationChange = (fieldName: string, transformation: string) => {
    setOutputMapping((prev) => ({
      ...prev,
      transformations: {
        ...prev.transformations,
        [fieldName]: transformation || '',
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

          {/* Output Mapping */}
          {selectedUIDefinition && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Output Mapping</h3>
              <p className="text-xs text-gray-500 mb-4">
                Map UI form fields to node output ports. Unmapped fields will be ignored.
              </p>

              {uiFields.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  No mappable fields in this UI (only buttons and labels)
                </div>
              ) : (
                <div className="space-y-3">
                  {uiFields.map((field) => (
                    <div
                      key={field.name}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{field.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Field: <code className="bg-gray-200 px-1 rounded">{field.name}</code> • Type: {field.type}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Output Port
                          </label>
                          <select
                            value={outputMapping.fieldToPort[field.name] || ''}
                            onChange={(e) => handleMappingChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- No mapping --</option>
                            {outputPorts.map((port) => (
                              <option key={port.id} value={port.id}>
                                {port.name} ({port.dataType.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Transformation (Optional)
                          </label>
                          <select
                            value={outputMapping.transformations?.[field.name] || ''}
                            onChange={(e) => handleTransformationChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!outputMapping.fieldToPort[field.name]}
                          >
                            <option value="">None</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="trim">Trim</option>
                            <option value="parseInt">Parse Integer</option>
                            <option value="parseFloat">Parse Float</option>
                            <option value="toString">To String</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
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

