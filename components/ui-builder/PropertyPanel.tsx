'use client';

/**
 * Property Panel
 * 
 * Displays and allows editing of selected component properties
 * Phase 2: Basic property editing
 * Enhanced with Hierarchy tab
 */

import React, { useState } from 'react';
import type { UIComponent, UIDefinition } from '../../src/types/uiDefinition';
import ValidationPanel from './ValidationPanel';
import HierarchyPanel from './HierarchyPanel';

interface PropertyPanelProps {
  component: UIComponent | null;
  onUpdate: (updates: Partial<UIComponent>) => void;
  definition?: UIDefinition;
  selectedComponentId?: string | null;
  onComponentSelect?: (componentId: string | null) => void;
  onCopy?: (componentId: string) => void;
  onPaste?: (afterComponentId?: string, parentId?: string) => void;
  onDelete?: (componentId: string) => void;
  onDuplicate?: (componentId: string, parentId?: string) => void;
  hasCopiedComponent?: boolean;
}

export default function PropertyPanel({ 
  component, 
  onUpdate, 
  definition,
  selectedComponentId,
  onComponentSelect,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  hasCopiedComponent,
}: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'hierarchy'>('properties');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = (componentId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  };

  // Show hierarchy tab even when no component is selected
  if (definition && onComponentSelect) {
    // Allow showing hierarchy tab even without selected component
  } else if (!component) {
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
        {component && (
          <p className="text-xs text-gray-500 mt-1 capitalize">{component.type}</p>
        )}
        
        {/* Tabs */}
        <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden mt-3">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'properties'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Properties
          </button>
          {definition && onComponentSelect && (
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'hierarchy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Hierarchy
            </button>
          )}
        </div>
      </div>

      {activeTab === 'hierarchy' && definition && onComponentSelect ? (
        <HierarchyPanel
          definition={definition}
          selectedComponentId={selectedComponentId || null}
          onComponentSelect={onComponentSelect}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
          onCopy={onCopy}
          onPaste={onPaste}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          hasCopiedComponent={hasCopiedComponent}
        />
      ) : activeTab === 'properties' && component ? (
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

        {/* Container/Row/Column Settings (Phase 4) */}
        {(component.type === 'container' || component.type === 'row' || component.type === 'column') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Container Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={(component as UIComponent & { backgroundColor?: string }).backgroundColor || '#f9fafb'}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              {(component.type === 'container') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border
                    </label>
                    <input
                      type="text"
                      value={(component as UIComponent & { border?: string }).border || ''}
                      onChange={(e) => handleChange('border', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1px solid #e5e7eb"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Border Radius
                    </label>
                    <input
                      type="text"
                      value={(component as UIComponent & { borderRadius?: string }).borderRadius || ''}
                      onChange={(e) => handleChange('borderRadius', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8px"
                    />
                  </div>
                </>
              )}
              {(component.type === 'row' || component.type === 'column') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Gap (px)
                    </label>
                    <input
                      type="number"
                      value={(component as UIComponent & { gap?: number }).gap || 8}
                      onChange={(e) => handleChange('gap', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  {component.type === 'row' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Justify Content
                      </label>
                      <select
                        value={(component as UIComponent & { justifyContent?: string }).justifyContent || 'start'}
                        onChange={(e) => handleChange('justifyContent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="start">Start</option>
                        <option value="end">End</option>
                        <option value="center">Center</option>
                        <option value="space-between">Space Between</option>
                        <option value="space-around">Space Around</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Align Items
                    </label>
                    <select
                      value={(component as UIComponent & { alignItems?: string }).alignItems || 'stretch'}
                      onChange={(e) => handleChange('alignItems', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="start">Start</option>
                      <option value="end">End</option>
                      <option value="center">Center</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Padding
                    </label>
                    <input
                      type="text"
                      value={(component as UIComponent & { padding?: string }).padding || ''}
                      onChange={(e) => handleChange('padding', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8px"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Validation Panel (Phase 5) */}
        <ValidationPanel component={component} onUpdate={onUpdate} />

        {/* Layout Properties (Phase 4) */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Width
                </label>
                <input
                  type="text"
                  value={component.width ? String(component.width) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.endsWith('%') || value.endsWith('px')) {
                      handleChange('width', value);
                    } else if (value) {
                      handleChange('width', parseInt(value) || value);
                    } else {
                      handleChange('width', undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="auto"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Height
                </label>
                <input
                  type="text"
                  value={component.height ? String(component.height) : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.endsWith('%') || value.endsWith('px')) {
                      handleChange('height', value);
                    } else if (value) {
                      handleChange('height', parseInt(value) || value);
                    } else {
                      handleChange('height', undefined);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="auto"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Margin
              </label>
              <input
                type="text"
                value={component.margin || ''}
                onChange={(e) => handleChange('margin', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8px"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Padding
              </label>
              <input
                type="text"
                value={component.padding || ''}
                onChange={(e) => handleChange('padding', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8px"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Align Self
              </label>
              <select
                value={component.alignSelf || 'auto'}
                onChange={(e) => handleChange('alignSelf', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto</option>
                <option value="start">Start</option>
                <option value="end">End</option>
                <option value="center">Center</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </div>
        </div>
        </div>
      ) : activeTab === 'properties' ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 text-center">
            Select a component to edit its properties
          </p>
        </div>
      ) : null}
    </div>
  );
}

