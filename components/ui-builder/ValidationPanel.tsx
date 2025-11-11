'use client';

/**
 * Validation Panel Component
 * 
 * Allows configuring validation rules for UI components
 * Phase 5: Validation Builder
 */

import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { UIComponent } from '../../src/types/uiDefinition';
import type { ValidationRule, ValidationRuleType } from '../../src/types/validation';

interface ValidationPanelProps {
  component: UIComponent | null;
  onUpdate: (updates: Partial<UIComponent>) => void;
}

const VALIDATION_RULE_TYPES: Array<{ value: ValidationRuleType; label: string; description: string }> = [
  { value: 'required', label: 'Required', description: 'Field must have a value' },
  { value: 'email', label: 'Email', description: 'Must be a valid email address' },
  { value: 'number', label: 'Number', description: 'Must be a valid number' },
  { value: 'min', label: 'Minimum', description: 'Minimum value or length' },
  { value: 'max', label: 'Maximum', description: 'Maximum value or length' },
  { value: 'minLength', label: 'Min Length', description: 'Minimum string length' },
  { value: 'maxLength', label: 'Max Length', description: 'Maximum string length' },
  { value: 'pattern', label: 'Pattern', description: 'Must match regex pattern' },
  { value: 'custom', label: 'Custom', description: 'Custom validation function' },
];

export default function ValidationPanel({ component, onUpdate }: ValidationPanelProps) {
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [newRuleType, setNewRuleType] = useState<ValidationRuleType>('required');

  if (!component) {
    return null;
  }

  const validationRules = component.validation || [];

  /**
   * Add a new validation rule
   */
  const handleAddRule = () => {
    const newRule: ValidationRule = {
      type: newRuleType,
      value: newRuleType === 'min' || newRuleType === 'max' || newRuleType === 'minLength' || newRuleType === 'maxLength' ? 0 : undefined,
    };

    onUpdate({
      validation: [...validationRules, newRule],
    });
    setEditingRuleIndex(validationRules.length);
  };

  /**
   * Update a validation rule
   */
  const handleUpdateRule = (index: number, updates: Partial<ValidationRule>) => {
    const updatedRules = [...validationRules];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    onUpdate({ validation: updatedRules });
  };

  /**
   * Delete a validation rule
   */
  const handleDeleteRule = (index: number) => {
    const updatedRules = validationRules.filter((_, i) => i !== index);
    onUpdate({ validation: updatedRules.length > 0 ? updatedRules : undefined });
  };

  /**
   * Render rule value input based on type
   */
  const renderRuleValueInput = (rule: ValidationRule, index: number) => {
    switch (rule.type) {
      case 'min':
      case 'max':
      case 'minLength':
      case 'maxLength':
        return (
          <input
            type="number"
            value={typeof rule.value === 'number' ? rule.value : ''}
            onChange={(e) => handleUpdateRule(index, { value: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Value"
          />
        );
      case 'pattern':
        return (
          <input
            type="text"
            value={typeof rule.value === 'string' ? rule.value : ''}
            onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
            placeholder="/^pattern$/"
          />
        );
      case 'custom':
        return (
          <div className="text-xs text-gray-500 italic">
            Custom validator function (not editable in UI)
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Validation Rules</h3>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Rule
        </button>
      </div>

      {validationRules.length === 0 ? (
        <p className="text-xs text-gray-500 italic">No validation rules configured</p>
      ) : (
        <div className="space-y-2">
          {validationRules.map((rule, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <select
                    value={rule.type}
                    onChange={(e) => handleUpdateRule(index, { type: e.target.value as ValidationRuleType, value: undefined })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                  >
                    {VALIDATION_RULE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mb-2">
                    {VALIDATION_RULE_TYPES.find((t) => t.value === rule.type)?.description}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRule(index)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Rule value input */}
              {renderRuleValueInput(rule, index)}

              {/* Custom error message */}
              <div className="mt-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Error Message (optional)
                </label>
                <input
                  type="text"
                  value={rule.message || ''}
                  onChange={(e) => handleUpdateRule(index, { message: e.target.value || undefined })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Custom error message"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use default message
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new rule dropdown */}
      {validationRules.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as ValidationRuleType)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {VALIDATION_RULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddRule}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

