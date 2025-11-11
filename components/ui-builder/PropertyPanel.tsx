'use client';

/**
 * Property Panel
 * 
 * Displays and allows editing of selected component properties
 * Phase 2: Basic property editing
 */

import React from 'react';
import type { UIComponent } from '../../src/types/uiDefinition';

interface PropertyPanelProps {
  component: UIComponent | null;
  onUpdate: (updates: Partial<UIComponent>) => void;
}

export default function PropertyPanel({ component, onUpdate }: PropertyPanelProps) {
  if (!component) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 text-center">
            Select a component to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: unknown) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <p className="text-xs text-gray-500 mt-1 capitalize">{component.type}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Properties */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name (Field ID)
              </label>
              <input
                type="text"
                value={component.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="field_name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used to identify this field in form data
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={component.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Display label"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={component.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Placeholder text"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={component.required || false}
                onChange={(e) => handleChange('required', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                Required field
              </label>
            </div>
          </div>
        </div>

        {/* Type-specific Properties */}
        {component.type === 'input' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Input Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Input Type
                </label>
                <select
                  value={(component as UIComponent & { inputType?: string }).inputType || 'text'}
                  onChange={(e) => handleChange('inputType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="password">Password</option>
                  <option value="tel">Telephone</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { defaultValue?: string }).defaultValue || ''}
                  onChange={(e) => handleChange('defaultValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default value"
                />
              </div>
            </div>
          </div>
        )}

        {component.type === 'textarea' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Textarea Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={(component as UIComponent & { rows?: number }).rows || 4}
                  onChange={(e) => handleChange('rows', parseInt(e.target.value) || 4)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <textarea
                  value={(component as UIComponent & { defaultValue?: string }).defaultValue || ''}
                  onChange={(e) => handleChange('defaultValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Default value"
                />
              </div>
            </div>
          </div>
        )}

        {component.type === 'button' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Button Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { text?: string }).text || ''}
                  onChange={(e) => handleChange('text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Button text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Button Type
                </label>
                <select
                  value={(component as UIComponent & { buttonType?: string }).buttonType || 'button'}
                  onChange={(e) => handleChange('buttonType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="button">Button</option>
                  <option value="submit">Submit</option>
                  <option value="reset">Reset</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {component.type === 'label' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Label Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Label Text
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { text?: string }).text || ''}
                  onChange={(e) => handleChange('text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Label text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  For (Input ID)
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { htmlFor?: string }).htmlFor || ''}
                  onChange={(e) => handleChange('htmlFor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="input_id"
                />
              </div>
            </div>
          </div>
        )}

        {component.type === 'select' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Options
                </label>
                <textarea
                  value={
                    (component as UIComponent & { options?: Array<{ value: string; label: string }> })
                      .options?.map((opt) => `${opt.value}:${opt.label}`)
                      .join('\n') || ''
                  }
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter((line) => line.trim());
                    const options = lines.map((line) => {
                      const [value, ...labelParts] = line.split(':');
                      return {
                        value: value.trim(),
                        label: labelParts.join(':').trim() || value.trim(),
                      };
                    });
                    handleChange('options', options);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={5}
                  placeholder="value1:Label 1&#10;value2:Label 2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: value:Label (one per line)
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { defaultValue?: string }).defaultValue || ''}
                  onChange={(e) => handleChange('defaultValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default option value"
                />
              </div>
            </div>
          </div>
        )}

        {component.type === 'checkbox' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Checkbox Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="checked"
                  checked={(component as UIComponent & { checked?: boolean }).checked || false}
                  onChange={(e) => handleChange('checked', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="checked" className="ml-2 text-sm text-gray-700">
                  Checked by default
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { value?: string }).value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Checkbox value"
                />
              </div>
            </div>
          </div>
        )}

        {component.type === 'radio' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Radio Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { value?: string }).value || ''}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Radio value"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={(component as UIComponent & { groupName?: string }).groupName || ''}
                  onChange={(e) => handleChange('groupName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="radio_group_name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Radio buttons with the same group name are grouped together
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="radio-checked"
                  checked={(component as UIComponent & { checked?: boolean }).checked || false}
                  onChange={(e) => handleChange('checked', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="radio-checked" className="ml-2 text-sm text-gray-700">
                  Selected by default
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

