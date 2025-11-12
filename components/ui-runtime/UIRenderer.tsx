'use client';

/**
 * UI Renderer Component
 * 
 * Renders a UI definition as a functional form
 * Phase 5: Enhanced with validation
 */

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import type { UIDefinition, UIComponent, FormData, UIRendererProps } from '../../src/types/uiDefinition';
import { validateForm, getFieldError } from '../../services/validationService';
import type { FormValidationResult } from '../../src/types/validation';
import ValidationDisplay from './ValidationDisplay';
import { applyTheme, getTheme } from '../../services/themeService';

const UIRenderer = forwardRef<{ submit: () => void }, UIRendererProps>(({
  definition,
  onSubmit,
  onChange,
  initialData = {},
  disabled = false,
}, ref) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [validation, setValidation] = useState<FormValidationResult>({
    isValid: true,
    fields: {},
    errors: {},
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const prevFormDataRef = useRef<FormData>(formData);
  const isInitialMountRef = useRef(true);
  const isUpdatingFromInitialDataRef = useRef(false);

  // Update form data when initialData changes (only if it's actually different)
  useEffect(() => {
    // Skip on initial mount to avoid unnecessary update
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevFormDataRef.current = initialData;
      return;
    }

    // Only update if initialData is different from current formData
    // Use JSON.stringify for deep comparison to avoid unnecessary updates
    const currentDataStr = JSON.stringify(formData);
    const initialDataStr = JSON.stringify(initialData);
    
    if (currentDataStr !== initialDataStr) {
      // Mark that we're updating from initialData to prevent onChange from firing
      isUpdatingFromInitialDataRef.current = true;
      setFormData(initialData);
      setTouched(new Set());
      setSubmitAttempted(false);
      prevFormDataRef.current = initialData;
    }
  }, [initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of changes (but avoid calling if formData hasn't actually changed)
  useEffect(() => {
    // Skip if we're updating from initialData
    if (isUpdatingFromInitialDataRef.current) {
      isUpdatingFromInitialDataRef.current = false;
      return;
    }

    // Only call onChange if formData actually changed
    const currentDataStr = JSON.stringify(formData);
    const prevDataStr = JSON.stringify(prevFormDataRef.current);
    
    if (currentDataStr !== prevDataStr && onChange) {
      prevFormDataRef.current = formData;
      onChange(formData);
    }
  }, [formData, onChange]);

  // Validate form when data changes (if field is touched or submit attempted)
  useEffect(() => {
    if (touched.size > 0 || submitAttempted) {
      const result = validateForm(definition.components, formData);
      setValidation(result);
    }
  }, [formData, definition.components, touched, submitAttempted]);

  /**
   * Handle input change (Phase 5: Mark field as touched)
   */
  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => new Set(prev).add(name));
  }, []);

  /**
   * Handle form submission (Phase 5: Validate before submit)
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitAttempted(true);
      
      // Validate form
      const result = validateForm(definition.components, formData);
      setValidation(result);
      
      // Mark all fields as touched
      const allFieldNames = definition.components
        .filter((comp) => comp.name && comp.type !== 'button' && comp.type !== 'label')
        .map((comp) => comp.name);
      setTouched(new Set(allFieldNames));
      
      // Only submit if valid
      if (result.isValid && onSubmit) {
        onSubmit(formData);
      }
    },
    [formData, onSubmit, definition.components]
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
   * Get component style (Phase 7) - moved before renderComponent
   */
  const getComponentStyle = useCallback((component: UIComponent): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    if (component.style) {
      const s = component.style;
      if (s.color) style.color = s.color;
      if (s.backgroundColor) style.backgroundColor = s.backgroundColor;
      if (s.border) style.border = s.border;
      if (s.borderRadius) style.borderRadius = s.borderRadius;
      if (s.padding) style.padding = s.padding;
      if (s.margin) style.margin = s.margin;
      if (s.fontSize) style.fontSize = s.fontSize;
      if (s.fontWeight) style.fontWeight = s.fontWeight;
      if (s.fontFamily) style.fontFamily = s.fontFamily;
      if (s.textAlign) style.textAlign = s.textAlign;
      if (s.width !== undefined) style.width = typeof s.width === 'number' ? `${s.width}px` : s.width;
      if (s.height !== undefined) style.height = typeof s.height === 'number' ? `${s.height}px` : s.height;
      if (s.minWidth !== undefined) style.minWidth = typeof s.minWidth === 'number' ? `${s.minWidth}px` : s.minWidth;
      if (s.maxWidth !== undefined) style.maxWidth = typeof s.maxWidth === 'number' ? `${s.maxWidth}px` : s.maxWidth;
      if (s.minHeight !== undefined) style.minHeight = typeof s.minHeight === 'number' ? `${s.minHeight}px` : s.minHeight;
      if (s.maxHeight !== undefined) style.maxHeight = typeof s.maxHeight === 'number' ? `${s.maxHeight}px` : s.maxHeight;
      if (s.boxShadow) style.boxShadow = s.boxShadow;
      if (s.opacity !== undefined) style.opacity = s.opacity;
    }
    
    return style;
  }, []);

  /**
   * Render a single component (Phase 7: Support styling)
   */
  const renderComponent = (component: UIComponent, componentMap?: Map<string, UIComponent>): React.ReactNode => {
    const fieldName = component.name;
    const isTouched = touched.has(fieldName || '');
    const showError = (isTouched || submitAttempted) && fieldName;
    const fieldError = showError ? getFieldError(fieldName, validation) : undefined;
    const hasError = !!fieldError;

    const componentStyle = getComponentStyle(component);
    const commonProps = {
      id: component.id,
      name: component.name,
      disabled,
      style: componentStyle,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
        hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:ring-blue-500'
      }`,
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
              onBlur={() => setTouched((prev) => new Set(prev).add(component.name))}
              required={component.required}
            />
            {showError && fieldError && (
              <ValidationDisplay validation={validation} fieldName={fieldName} />
            )}
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
              onBlur={() => setTouched((prev) => new Set(prev).add(component.name))}
              required={component.required}
            />
            {showError && fieldError && (
              <ValidationDisplay validation={validation} fieldName={fieldName} />
            )}
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
              onBlur={() => setTouched((prev) => new Set(prev).add(component.name))}
              required={component.required}
            >
              <option value="">Select an option...</option>
              {selectComponent.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {showError && fieldError && (
              <ValidationDisplay validation={validation} fieldName={fieldName} />
            )}
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
          <div key={component.id} className="mb-2">
            <div className="flex items-center">
              <input
                id={component.id}
                name={radioComponent.groupName}
                type="radio"
                value={radioComponent.value}
                checked={(formData[radioComponent.groupName] as string) === radioComponent.value}
                onChange={(e) => handleChange(radioComponent.groupName, e.target.value)}
                onBlur={() => setTouched((prev) => new Set(prev).add(radioComponent.groupName))}
                disabled={disabled}
                className={`w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                  hasError ? 'border-red-500' : ''
                }`}
                required={component.required}
              />
              {component.label && (
                <label htmlFor={component.id} className="ml-2 text-sm text-gray-700">
                  {component.label}
                  {component.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
            </div>
            {showError && fieldError && fieldName === radioComponent.groupName && (
              <ValidationDisplay validation={validation} fieldName={radioComponent.groupName} />
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

  // Apply theme (Phase 7)
  useEffect(() => {
    if (definition.theme?.themeId) {
      const theme = getTheme(definition.theme.themeId) || definition.theme.customTheme;
      if (theme && formRef.current) {
        applyTheme(formRef.current, theme);
      }
    }
  }, [definition.theme]);

  // Expose form submit method (Phase 5: For external submit buttons)
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    },
  }));

  // Get global styles (Phase 7)
  const globalStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: layout.direction || 'column',
    gap: `${layout.gap || 16}px`,
    padding: typeof layout.padding === 'number' ? `${layout.padding}px` : layout.padding || '16px',
    alignItems: layout.alignItems,
    justifyContent: layout.justifyContent,
    backgroundColor: layout.backgroundColor,
    maxWidth: layout.maxWidth ? (typeof layout.maxWidth === 'number' ? `${layout.maxWidth}px` : layout.maxWidth) : undefined,
    minWidth: layout.minWidth ? (typeof layout.minWidth === 'number' ? `${layout.minWidth}px` : layout.minWidth) : undefined,
  };

  // Apply global styles (Phase 7)
  if (definition.globalStyles) {
    const gs = definition.globalStyles;
    if (gs.backgroundColor) globalStyle.backgroundColor = gs.backgroundColor;
    if (gs.color) globalStyle.color = gs.color;
    if (gs.fontSize) globalStyle.fontSize = gs.fontSize;
    if (gs.fontWeight) globalStyle.fontWeight = gs.fontWeight;
    if (gs.fontFamily) globalStyle.fontFamily = gs.fontFamily;
    if (gs.padding) globalStyle.padding = gs.padding;
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={globalStyle}
      className="ui-renderer"
    >
      {/* Show all validation errors at top if submit attempted (Phase 5) */}
      {submitAttempted && !validation.isValid && (
        <ValidationDisplay validation={validation} showAll={true} className="mb-4" />
      )}
      
      {rootComponents.map((component) => renderComponent(component, componentMap))}
      
      {/* Submit button if not disabled and onSubmit is provided (Phase 5) */}
      {!disabled && onSubmit && (
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
      )}
    </form>
  );
});

UIRenderer.displayName = 'UIRenderer';

export default UIRenderer;

