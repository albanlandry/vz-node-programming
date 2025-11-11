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
   * Render a single component
   */
  const renderComponent = (component: UIComponent): React.ReactNode => {
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

      default:
        return null;
    }
  };

  const layout = definition.layout || { direction: 'column', gap: 16, padding: 16 };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: layout.direction || 'column',
        gap: `${layout.gap || 16}px`,
        padding: `${layout.padding || 16}px`,
      }}
      className="ui-renderer"
    >
      {definition.components.map((component) => renderComponent(component))}
    </form>
  );
}

