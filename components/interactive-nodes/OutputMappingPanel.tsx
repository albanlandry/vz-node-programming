'use client';

/**
 * Output Mapping Panel Component
 * 
 * Advanced output mapping with transformations and conditional logic
 * Phase 6: Visual field mapping, transformation selection, preview
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye, Plus, Trash2, Settings } from 'lucide-react';
import type { OutputMapping, TransformationConfig, ConditionalMappingRule } from '../../src/types/uiNodeConfig';
import { getAllTransformations, getTransformationsByCategory, applyTransformationById, type TransformationDefinition } from '../../services/transformationService';
import type { FormData } from '../../src/types/uiDefinition';

interface OutputMappingPanelProps {
  outputMapping: OutputMapping;
  uiFields: Array<{ name: string; label: string; type: string }>;
  outputPorts: Array<{ id: string; name: string; dataType: { name: string } }>;
  onMappingChange: (mapping: OutputMapping) => void;
  previewData?: FormData;
}

export default function OutputMappingPanel({
  outputMapping,
  uiFields,
  outputPorts,
  onMappingChange,
  previewData = {},
}: OutputMappingPanelProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewField, setPreviewField] = useState<string | null>(null);

  const allTransformations = getAllTransformations();
  const transformationsByCategory = useMemo(() => {
    const categories: Record<string, TransformationDefinition[]> = {};
    allTransformations.forEach((t) => {
      if (!categories[t.category]) {
        categories[t.category] = [];
      }
      categories[t.category].push(t);
    });
    return categories;
  }, [allTransformations]);

  /**
   * Toggle field expansion
   */
  const toggleField = (fieldName: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  /**
   * Handle transformation change
   */
  const handleTransformationChange = (fieldName: string, transform: TransformationConfig | undefined) => {
    onMappingChange({
      ...outputMapping,
      transformations: {
        ...outputMapping.transformations,
        [fieldName]: transform,
      },
    });
  };

  /**
   * Handle transformation parameter change
   */
  const handleTransformParamChange = (fieldName: string, paramName: string, value: unknown) => {
    const currentTransform = outputMapping.transformations?.[fieldName];
    if (!currentTransform) return;

    onMappingChange({
      ...outputMapping,
      transformations: {
        ...outputMapping.transformations,
        [fieldName]: {
          ...currentTransform,
          options: {
            ...currentTransform.options,
            params: {
              ...(currentTransform.options?.params as Record<string, unknown> || {}),
              [paramName]: value,
            },
          },
        },
      },
    });
  };

  /**
   * Add transformation to chain
   */
  const handleAddChainTransform = (fieldName: string, transformId?: string) => {
    if (!transformId) {
      // If no transformId provided, this was called from select onChange
      // The transformId will be in the event
      return;
    }

    const currentTransform = outputMapping.transformations?.[fieldName];
    if (!currentTransform) {
      // Create new transformation with chain
      handleTransformationChange(fieldName, {
        id: transformId,
        chain: [],
      });
      return;
    }

    const newTransform: TransformationConfig = {
      id: transformId,
    };

    if (currentTransform.chain) {
      handleTransformationChange(fieldName, {
        ...currentTransform,
        chain: [...currentTransform.chain, newTransform],
      });
    } else {
      handleTransformationChange(fieldName, {
        ...currentTransform,
        chain: [newTransform],
      });
    }
  };

  /**
   * Remove transformation from chain
   */
  const handleRemoveChainTransform = (fieldName: string, index: number) => {
    const currentTransform = outputMapping.transformations?.[fieldName];
    if (!currentTransform?.chain) return;

    const newChain = currentTransform.chain.filter((_, i) => i !== index);
    if (newChain.length === 0) {
      handleTransformationChange(fieldName, {
        ...currentTransform,
        chain: undefined,
      });
    } else {
      handleTransformationChange(fieldName, {
        ...currentTransform,
        chain: newChain,
      });
    }
  };

  /**
   * Preview transformation result
   */
  const previewTransformation = (fieldName: string): unknown => {
    const value = previewData[fieldName];
    const transform = outputMapping.transformations?.[fieldName];
    
    if (!transform) return value;

    try {
      // Apply main transformation
      let result = applyTransformationById(transform.id, value, transform.options);
      
      // Apply chain transformations
      if (transform.chain) {
        for (const chainTransform of transform.chain) {
          result = applyTransformationById(chainTransform.id, result, chainTransform.options);
        }
      }
      
      return result;
    } catch (e) {
      console.error('Preview error:', e);
      return value;
    }
  };

  /**
   * Render transformation selector
   */
  const renderTransformationSelector = (fieldName: string, currentTransform?: TransformationConfig) => {
    return (
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Transformation</label>
          <select
            value={currentTransform?.id || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleTransformationChange(fieldName, { id: e.target.value });
              } else {
                handleTransformationChange(fieldName, undefined);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {Object.entries(transformationsByCategory).map(([category, transforms]) => (
              <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                {transforms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {t.description}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Transformation parameters */}
        {currentTransform && (() => {
          const transformDef = allTransformations.find((t) => t.id === currentTransform.id);
          if (transformDef?.requiresParams && transformDef.params) {
            return (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Parameters</label>
                {transformDef.params.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs text-gray-600 mb-1">{param.label}</label>
                    {param.type === 'number' ? (
                      <input
                        type="number"
                        value={
                          (currentTransform.options?.params as Record<string, unknown>)?.[param.name] as number || param.defaultValue as number || 0
                        }
                        onChange={(e) => handleTransformParamChange(fieldName, param.name, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder={param.description}
                      />
                    ) : (
                      <input
                        type="text"
                        value={
                          String((currentTransform.options?.params as Record<string, unknown>)?.[param.name] || param.defaultValue || '')
                        }
                        onChange={(e) => handleTransformParamChange(fieldName, param.name, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder={param.description}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          }
          return null;
        })()}

        {/* Chain transformations */}
        {currentTransform && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">Chain Transformations</label>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddChainTransform(fieldName, e.target.value);
                      e.target.value = ''; // Reset
                    }
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="">Add to chain...</option>
                  {Object.entries(transformationsByCategory).map(([category, transforms]) => (
                    <optgroup key={category} label={category}>
                      {transforms.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            {currentTransform.chain && currentTransform.chain.length > 0 && (
              <div className="space-y-1">
                {currentTransform.chain.map((chainTransform, index) => {
                  const chainDef = allTransformations.find((t) => t.id === chainTransform.id);
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-gray-700">{chainDef?.name || chainTransform.id}</span>
                        {chainDef && (
                          <span className="text-xs text-gray-500 ml-2">({chainDef.description})</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveChainTransform(fieldName, index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div className="mt-2">
            <button
              onClick={() => setPreviewField(previewField === fieldName ? null : fieldName)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-3 h-3" />
              {previewField === fieldName ? 'Hide' : 'Show'} Preview
            </button>
            {previewField === fieldName && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <div className="text-gray-600 mb-1">Original: <code className="bg-white px-1 rounded">{JSON.stringify(previewData[fieldName])}</code></div>
                <div className="text-gray-900">Transformed: <code className="bg-white px-1 rounded">{JSON.stringify(previewTransformation(fieldName))}</code></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {uiFields.map((field) => {
        const isExpanded = expandedFields.has(field.name);
        const currentTransform = outputMapping.transformations?.[field.name];
        const mappedPort = outputMapping.fieldToPort[field.name];

        return (
          <div key={field.name} className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
              onClick={() => toggleField(field.name)}
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{field.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Field: <code className="bg-gray-200 px-1 rounded">{field.name}</code> • Type: {field.type}
                  {mappedPort && (
                    <>
                      {' • '}→ Port: <code className="bg-gray-200 px-1 rounded">
                        {outputPorts.find((p) => p.id === mappedPort)?.name || mappedPort}
                      </code>
                    </>
                  )}
                  {currentTransform && (
                    <> • Transform: <code className="bg-gray-200 px-1 rounded">{currentTransform.id}</code></>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentTransform && (
                  <Settings className="w-4 h-4 text-blue-600" />
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                {/* Port Mapping */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Output Port</label>
                  <select
                    value={mappedPort || ''}
                    onChange={(e) => {
                      onMappingChange({
                        ...outputMapping,
                        fieldToPort: {
                          ...outputMapping.fieldToPort,
                          [field.name]: e.target.value || '',
                        },
                      });
                    }}
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

                {/* Transformation */}
                {mappedPort && renderTransformationSelector(field.name, currentTransform)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

