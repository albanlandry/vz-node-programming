'use client';

/**
 * Input Configuration Panel Component
 * 
 * Allows users to configure input values for nodes that require external inputs
 */

import { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2 } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import type { Port } from '../../src/types';

interface InputConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function InputConfigPanel({ isOpen, onClose, position }: InputConfigPanelProps) {
  const {
    nodes,
    connections,
    inputConfig,
    inputTemplates,
    setInputValue,
    clearInputConfig,
    saveInputTemplate,
    loadInputTemplate,
    deleteInputTemplate,
  } = useGraphStore();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [templateName, setTemplateName] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Get nodes that require external inputs (have input ports without connections)
  const nodesWithInputs = nodes.filter((node) => {
    return node.inputs.some((input) => {
      const hasConnection = connections.some(
        (conn) => conn.toNode === node.id && conn.toPort === input.id,
      );
      return !hasConnection && input.required;
    });
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderInputEditor = (nodeId: string, port: Port) => {
    const currentValue = inputConfig[nodeId]?.[port.id];
    const dataType = port.dataType.name;

    const handleChange = (value: unknown) => {
      setInputValue(nodeId, port.id, value);
    };

    switch (dataType) {
      case 'string':
        return (
          <input
            type="text"
            value={(currentValue as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(currentValue as number) ?? ''}
            onChange={(e) => handleChange(Number.parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(currentValue as boolean) ?? false}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{port.name}</span>
          </label>
        );
      case 'object':
      case 'array':
        return (
          <textarea
            value={JSON.stringify(currentValue || (dataType === 'array' ? [] : {}), null, 2)}
            onChange={(e) => {
              try {
                handleChange(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, keep as is
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 text-sm font-mono"
            rows={4}
            placeholder={`Enter ${port.name} as JSON...`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={String(currentValue || '')}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 text-sm"
            placeholder={`Enter ${port.name}...`}
          />
        );
    }
  };

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveInputTemplate(templateName.trim());
      setTemplateName('');
      setShowTemplateDialog(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bg-white shadow-2xl border-2 border-gray-300 z-50 w-96 max-h-[600px] flex flex-col"
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Input Configuration</h3>
        <button onClick={onClose} className="p-1 hover:bg-blue-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Template Management */}
      {inputTemplates.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700">Templates</span>
          </div>
          <div className="space-y-1">
            {inputTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between text-xs">
                <button
                  onClick={() => loadInputTemplate(template.id)}
                  className="text-blue-600 hover:text-blue-800 flex-1 text-left"
                >
                  {template.name}
                </button>
                <button
                  onClick={() => deleteInputTemplate(template.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <button
          onClick={() => setShowTemplateDialog(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Save className="w-3 h-3" />
          Save Template
        </button>
        <button
          onClick={clearInputConfig}
          className="px-2 py-1 text-xs bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Save Template Dialog */}
      {showTemplateDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white p-4 w-64">
            <h4 className="font-semibold text-sm mb-2">Save Input Template</h4>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-full px-3 py-2 border border-gray-300 text-sm mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTemplate();
                } else if (e.key === 'Escape') {
                  setShowTemplateDialog(false);
                }
              }}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveTemplate}
                className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowTemplateDialog(false);
                  setTemplateName('');
                }}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {nodesWithInputs.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No nodes require external inputs
          </div>
        ) : (
          nodesWithInputs.map((node) => {
            const requiredInputs = node.inputs.filter((input) => {
              const hasConnection = connections.some(
                (conn) => conn.toNode === node.id && conn.toPort === input.id,
              );
              return !hasConnection && input.required;
            });

            if (requiredInputs.length === 0) return null;

            const isExpanded = expandedNodes.has(node.id);

            return (
              <div key={node.id} className="border border-gray-200">
                <button
                  onClick={() => toggleNode(node.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-sm text-gray-900">{node.name}</span>
                  <span className="text-xs text-gray-500">
                    {isExpanded ? '▼' : '▶'} {requiredInputs.length} inputs
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-200">
                    {requiredInputs.map((input) => (
                      <div key={input.id}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {input.name}
                          <span className="text-gray-500 ml-1">({input.dataType.name})</span>
                        </label>
                        {renderInputEditor(node.id, input)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

