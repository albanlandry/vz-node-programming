'use client';

/**
 * UI Dialog Component
 * 
 * Displays a UI definition as a form dialog for interactive nodes
 * Phase 3: Renders UI definitions and maps data to outputs
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { useGraphStore } from '../../store/graphStore';
import UIRenderer from '../ui-runtime/UIRenderer';
import { mapFormDataToOutputs } from '../../services/uiDataService';
import { validateForm } from '../../services/validationService';
import type { UINodeConfig } from '../../src/types/uiNodeConfig';
import type { FormData } from '../../src/types/uiDefinition';

interface UIDialogProps {
  open: boolean;
  nodeId: string;
  executionId: string;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}

export default function UIDialog({
  open,
  nodeId,
  executionId,
  onSubmit,
  onCancel,
}: UIDialogProps) {
  const { nodes } = useGraphStore();
  const { getDefinition } = useUIBuilderStore();
  const [formData, setFormData] = useState<FormData>({});
  const rendererRef = React.useRef<{ submit: () => void }>(null);

  const node = nodes.find((n) => n.id === nodeId);
  const uiConfig = node?.properties?.uiConfig as UINodeConfig | undefined;
  const uiDefinition = uiConfig ? getDefinition(uiConfig.uiDefinitionId) : null;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({});
    }
  }, [open]);

  if (!open || !uiConfig || !uiDefinition) {
    return null;
  }

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleSubmit = (data: FormData) => {
    // Validate if required (Phase 5: Use new validation service)
    if (uiConfig.validateBeforeSubmit) {
      const validation = validateForm(uiDefinition.components, data);
      if (!validation.isValid) {
        // Validation errors are shown by UIRenderer
        return;
      }
    }

    // Map form data to outputs
    const outputs = mapFormDataToOutputs(data, uiConfig.outputMapping);

    // Submit the mapped outputs
    // If only one output, send it directly; otherwise send the object
    const outputKeys = Object.keys(outputs);
    if (outputKeys.length === 1) {
      onSubmit(outputs[outputKeys[0]]);
    } else if (outputKeys.length > 1) {
      onSubmit(outputs);
    } else {
      // No mapped outputs, submit form data as-is
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold">{uiDefinition.name}</h2>
            {uiDefinition.description && (
              <p className="text-sm text-blue-100 mt-1">{uiDefinition.description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* UI Renderer (Phase 5: Validation handled by UIRenderer) */}
          <UIRenderer
            ref={rendererRef}
            definition={uiDefinition}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            initialData={formData}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // Trigger form submit (validation will be handled by UIRenderer)
              if (rendererRef.current) {
                rendererRef.current.submit();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

