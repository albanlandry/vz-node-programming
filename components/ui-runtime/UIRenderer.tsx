'use client';

/**
 * UI Renderer Component
 * 
 * Renders a UI definition as a functional form
 * Phase 1: Basic rendering with form data collection
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { UIDefinition, UIComponent, FormData, UIRendererProps } from '../../src/types/uiDefinition';

export default function UIRenderer({
  definition,
  onSubmit,
  onChange,
  initialData = {},
  disabled = false,
}: UIRendererProps) {
  const [formData, setFormData] = useState<FormData>(initialData);

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(formData);
      }
    },
    [formData, onSubmit]
  );

  /**
   * Build component tree from flat list (Phase 4: Support containers)
   */
  const buildComponentTree = useCallback(() => {
    const rootComponents: UIComponent[] = [];
    const componentMap = new Map<string, UIComponent>();
    
    // Build map
    definition.components.forEach((comp) => {
      componentMap.set(comp.id, comp);
    });
    
    // Find root components (not children of any container)
    const childIds = new Set<string>();
    definition.components.forEach((comp) => {
      if (comp.type === 'container' || comp.type === 'row' || comp.type === 'column') {
        const containerComp = comp as UIComponent & { children?: string[] };
        containerComp.children?.forEach((childId) => childIds.add(childId));
      }
    });
    
    definition.components.forEach((comp) => {
      if (!childIds.has(comp.id)) {
        rootComponents.push(comp);
      }
    });
    
    return { rootComponents, componentMap };
  }, [definition]);

  /**
   * Render a single component (Phase 4: Support containers)
   */
  const renderComponent = (component: UIComponent, componentMap?: Map<string, UIComponent>): React.ReactNode => {
    const commonProps = {
      id: component.id,
      name: component.name,
      disabled,
      className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
    };

    switch (component.type) {
      case 'input': {
        const inputComponent = component as UIComponent & { inputType?: string; defaultValue?: string };
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <label htmlFor={component.id} className="block text-sm font-medium text-gray-700 mb-1">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <input
              {...commonProps}
              type={inputComponent.inputType || 'text'}
              placeholder={component.placeholder}
              value={(formData[component.name] as string) || inputComponent.defaultValue || ''}
              onChange={(e) => handleChange(component.name, e.target.value)}
              required={component.required}
            />
          </div>
        );
      }

      case 'textarea': {
        const textareaComponent = component as UIComponent & { rows?: number; defaultValue?: string };
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <label htmlFor={component.id} className="block text-sm font-medium text-gray-700 mb-1">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <textarea
              {...commonProps}
              rows={textareaComponent.rows || 4}
              placeholder={component.placeholder}
              value={(formData[component.name] as string) || textareaComponent.defaultValue || ''}
              onChange={(e) => handleChange(component.name, e.target.value)}
              required={component.required}
            />
          </div>
        );
      }

      case 'button': {
        const buttonComponent = component as UIComponent & { buttonType?: string; text: string };
        return (
          <button
            key={component.id}
            type={buttonComponent.buttonType || 'button'}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={buttonComponent.buttonType === 'submit' ? undefined : (e) => {
              e.preventDefault();
              if (onSubmit) {
                onSubmit(formData);
              }
            }}
          >
            {buttonComponent.text}
          </button>
        );
      }

      case 'label': {
        const labelComponent = component as UIComponent & { text: string; htmlFor?: string };
        return (
          <label
            key={component.id}
            htmlFor={labelComponent.htmlFor}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {labelComponent.text}
          </label>
        );
      }

      case 'select': {
        const selectComponent = component as UIComponent & {
          options: Array<{ value: string; label: string }>;
          defaultValue?: string;
        };
        return (
          <div key={component.id} className="mb-4">
            {component.label && (
              <label htmlFor={component.id} className="block text-sm font-medium text-gray-700 mb-1">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <select
              {...commonProps}
              value={(formData[component.name] as string) || selectComponent.defaultValue || ''}
              onChange={(e) => handleChange(component.name, e.target.value)}
              required={component.required}
            >
              <option value="">Select an option...</option>
              {selectComponent.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case 'checkbox': {
        const checkboxComponent = component as UIComponent & { checked?: boolean; value?: string };
        return (
          <div key={component.id} className="mb-4 flex items-center">
            <input
              id={component.id}
              name={component.name}
              type="checkbox"
              checked={(formData[component.name] as boolean) ?? checkboxComponent.checked ?? false}
              onChange={(e) => handleChange(component.name, e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required={component.required}
            />
            {component.label && (
              <label htmlFor={component.id} className="ml-2 text-sm text-gray-700">
                {component.label}
                {component.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
          </div>
        );
      }

      case 'radio': {
        const radioComponent = component as UIComponent & { value: string; checked?: boolean; groupName: string };
        return (
          <div key={component.id} className="mb-2 flex items-center">
            <input
              id={component.id}
              name={radioComponent.groupName}
              type="radio"
              value={radioComponent.value}
              checked={(formData[radioComponent.groupName] as string) === radioComponent.value}
              onChange={(e) => handleChange(radioComponent.groupName, e.target.value)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              required={component.required}
            />
            {component.label && (
              <label htmlFor={component.id} className="ml-2 text-sm text-gray-700">
                {component.label}
              </label>
            )}
          </div>
        );
      }

      // Container components (Phase 4)
      case 'container': {
        const containerComponent = component as UIComponent & { children?: string[]; backgroundColor?: string; border?: string; borderRadius?: string };
        const childComponents = containerComponent.children
          ? (componentMap ? containerComponent.children.map((id) => componentMap.get(id)).filter(Boolean) as UIComponent[] : [])
          : [];
        
        return (
          <div
            key={component.id}
            style={{
              backgroundColor: containerComponent.backgroundColor,
              border: containerComponent.border,
              borderRadius: containerComponent.borderRadius,
              width: component.width ? (typeof component.width === 'number' ? `${component.width}px` : component.width) : undefined,
              height: component.height ? (typeof component.height === 'number' ? `${component.height}px` : component.height) : undefined,
              margin: component.margin,
              padding: component.padding,
              alignSelf: component.alignSelf,
            }}
            className="mb-4"
          >
            {childComponents.map((child) => renderComponent(child, componentMap))}
          </div>
        );
      }

      case 'row': {
        const rowComponent = component as UIComponent & { children?: string[]; gap?: number; alignItems?: string; justifyContent?: string; backgroundColor?: string; padding?: string };
        const childComponents = rowComponent.children
          ? (componentMap ? rowComponent.children.map((id) => componentMap.get(id)).filter(Boolean) as UIComponent[] : [])
          : [];
        
        return (
          <div
            key={component.id}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: `${rowComponent.gap || 8}px`,
              alignItems: rowComponent.alignItems || 'start',
              justifyContent: rowComponent.justifyContent || 'start',
              backgroundColor: rowComponent.backgroundColor,
              padding: rowComponent.padding,
              width: component.width ? (typeof component.width === 'number' ? `${component.width}px` : component.width) : undefined,
              height: component.height ? (typeof component.height === 'number' ? `${component.height}px` : component.height) : undefined,
              margin: component.margin,
              alignSelf: component.alignSelf,
            }}
            className="mb-4"
          >
            {childComponents.map((child) => renderComponent(child, componentMap))}
          </div>
        );
      }

      case 'column': {
        const columnComponent = component as UIComponent & { children?: string[]; gap?: number; alignItems?: string; backgroundColor?: string; padding?: string };
        const childComponents = columnComponent.children
          ? (componentMap ? columnComponent.children.map((id) => componentMap.get(id)).filter(Boolean) as UIComponent[] : [])
          : [];
        
        return (
          <div
            key={component.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${columnComponent.gap || 8}px`,
              alignItems: columnComponent.alignItems || 'stretch',
              backgroundColor: columnComponent.backgroundColor,
              padding: columnComponent.padding,
              width: component.width ? (typeof component.width === 'number' ? `${component.width}px` : component.width) : undefined,
              height: component.height ? (typeof component.height === 'number' ? `${component.height}px` : component.height) : undefined,
              margin: component.margin,
              alignSelf: component.alignSelf,
            }}
            className="mb-4"
          >
            {childComponents.map((child) => renderComponent(child, componentMap))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const layout = definition.layout || { direction: 'column', gap: 16, padding: 16 };
  const { rootComponents, componentMap } = buildComponentTree();

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: layout.direction || 'column',
        gap: `${layout.gap || 16}px`,
        padding: typeof layout.padding === 'number' ? `${layout.padding}px` : layout.padding || '16px',
        alignItems: layout.alignItems,
        justifyContent: layout.justifyContent,
        backgroundColor: layout.backgroundColor,
        maxWidth: layout.maxWidth ? (typeof layout.maxWidth === 'number' ? `${layout.maxWidth}px` : layout.maxWidth) : undefined,
        minWidth: layout.minWidth ? (typeof layout.minWidth === 'number' ? `${layout.minWidth}px` : layout.minWidth) : undefined,
      }}
      className="ui-renderer"
    >
      {rootComponents.map((component) => renderComponent(component, componentMap))}
    </form>
  );
}

