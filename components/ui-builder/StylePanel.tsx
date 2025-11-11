'use client';

/**
 * Style Panel Component
 * 
 * Allows editing component styles and theme
 * Phase 7: CSS property editor, color picker, font controls, spacing controls
 */

import React, { useState } from 'react';
import { Palette, Type, Move, Layers, Eye, EyeOff } from 'lucide-react';
import type { UIComponent } from '../../src/types/uiDefinition';
import type { ComponentStyle } from '../../src/types/uiDefinition';
import { getPredefinedThemes, type Theme } from '../../services/themeService';

interface StylePanelProps {
  component: UIComponent | null;
  definitionTheme?: { themeId?: string; customTheme?: Theme };
  globalStyles?: ComponentStyle;
  onComponentStyleUpdate: (style: ComponentStyle) => void;
  onThemeChange?: (themeId: string | undefined) => void;
  onGlobalStylesChange?: (styles: ComponentStyle) => void;
}

export default function StylePanel({
  component,
  definitionTheme,
  globalStyles,
  onComponentStyleUpdate,
  onThemeChange,
  onGlobalStylesChange,
}: StylePanelProps) {
  const [activeTab, setActiveTab] = useState<'component' | 'theme' | 'global'>('component');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const predefinedThemes = getPredefinedThemes();

  /**
   * Handle style property change
   */
  const handleStyleChange = (property: keyof ComponentStyle, value: string | number | undefined) => {
    if (activeTab === 'component' && component) {
      onComponentStyleUpdate({
        ...component.style,
        [property]: value,
      });
    } else if (activeTab === 'global' && onGlobalStylesChange) {
      onGlobalStylesChange({
        ...globalStyles,
        [property]: value,
      });
    }
  };

  /**
   * Render color picker
   */
  const renderColorPicker = (label: string, property: 'color' | 'backgroundColor' | 'border', value?: string) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleStyleChange(property, e.target.value)}
            className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleStyleChange(property, e.target.value || undefined)}
            placeholder="#000000"
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  /**
   * Render spacing control
   */
  const renderSpacingControl = (label: string, property: 'padding' | 'margin', value?: string) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleStyleChange(property, e.target.value || undefined)}
          placeholder="8px or 8px 16px"
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  /**
   * Render font size control
   */
  const renderFontSizeControl = (value?: string) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
        <select
          value={value || ''}
          onChange={(e) => handleStyleChange('fontSize', e.target.value || undefined)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Default</option>
          <option value="0.75rem">XS (0.75rem)</option>
          <option value="0.875rem">SM (0.875rem)</option>
          <option value="1rem">Base (1rem)</option>
          <option value="1.125rem">LG (1.125rem)</option>
          <option value="1.25rem">XL (1.25rem)</option>
          <option value="1.5rem">2XL (1.5rem)</option>
        </select>
      </div>
    );
  };

  /**
   * Render font weight control
   */
  const renderFontWeightControl = (value?: string | number) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
        <select
          value={String(value || '')}
          onChange={(e) => handleStyleChange('fontWeight', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Default</option>
          <option value="400">Normal (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">Semibold (600)</option>
          <option value="700">Bold (700)</option>
        </select>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Styling</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setActiveTab('component')}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === 'component'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            disabled={!component && activeTab === 'component'}
          >
            Component
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === 'theme'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Theme
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 px-2 py-1 text-xs font-medium transition-colors ${
              activeTab === 'global'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Component Styles */}
        {activeTab === 'component' && component && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </h4>
              <div className="space-y-3">
                {renderColorPicker('Text Color', 'color', component.style?.color)}
                {renderColorPicker('Background', 'backgroundColor', component.style?.backgroundColor)}
                {renderColorPicker('Border', 'border', component.style?.border)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </h4>
              <div className="space-y-3">
                {renderFontSizeControl(component.style?.fontSize)}
                {renderFontWeightControl(component.style?.fontWeight)}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                  <input
                    type="text"
                    value={component.style?.fontFamily || ''}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value || undefined)}
                    placeholder="Inter, sans-serif"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                  <select
                    value={component.style?.textAlign || ''}
                    onChange={(e) => handleStyleChange('textAlign', e.target.value || undefined)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Default</option>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Move className="w-4 h-4" />
                Spacing
              </h4>
              <div className="space-y-3">
                {renderSpacingControl('Padding', 'padding', component.style?.padding)}
                {renderSpacingControl('Margin', 'margin', component.style?.margin)}
              </div>
            </div>

            {showAdvanced && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Advanced
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
                    <input
                      type="text"
                      value={component.style?.borderRadius || ''}
                      onChange={(e) => handleStyleChange('borderRadius', e.target.value || undefined)}
                      placeholder="8px"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Box Shadow</label>
                    <input
                      type="text"
                      value={component.style?.boxShadow || ''}
                      onChange={(e) => handleStyleChange('boxShadow', e.target.value || undefined)}
                      placeholder="0 2px 4px rgba(0,0,0,0.1)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={component.style?.opacity ?? ''}
                      onChange={(e) => handleStyleChange('opacity', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Custom CSS</label>
                    <textarea
                      value={component.style?.customCSS || ''}
                      onChange={(e) => handleStyleChange('customCSS', e.target.value || undefined)}
                      placeholder="Custom CSS properties..."
                      rows={4}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme Selection */}
        {activeTab === 'theme' && onThemeChange && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3">Select Theme</h4>
              <div className="space-y-2">
                {predefinedThemes.map((theme) => (
                  <label
                    key={theme.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      definitionTheme?.themeId === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={definitionTheme?.themeId === theme.id}
                      onChange={() => onThemeChange(theme.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{theme.name}</div>
                      {theme.description && (
                        <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: theme.colors.background }}
                      />
                    </div>
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    !definitionTheme?.themeId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value=""
                    checked={!definitionTheme?.themeId}
                    onChange={() => onThemeChange(undefined)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="font-medium text-sm text-gray-900">No Theme (Default)</div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Global Styles */}
        {activeTab === 'global' && onGlobalStylesChange && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Global Colors
              </h4>
              <div className="space-y-3">
                {renderColorPicker('Background', 'backgroundColor', globalStyles?.backgroundColor)}
                {renderColorPicker('Text Color', 'color', globalStyles?.color)}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Global Typography
              </h4>
              <div className="space-y-3">
                {renderFontSizeControl(globalStyles?.fontSize)}
                {renderFontWeightControl(globalStyles?.fontWeight)}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                  <input
                    type="text"
                    value={globalStyles?.fontFamily || ''}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value || undefined)}
                    placeholder="Inter, sans-serif"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Move className="w-4 h-4" />
                Global Spacing
              </h4>
              <div className="space-y-3">
                {renderSpacingControl('Padding', 'padding', globalStyles?.padding)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'component' && !component && (
          <div className="text-center text-sm text-gray-500 py-8">
            Select a component to edit its styles
          </div>
        )}
      </div>
    </div>
  );
}

