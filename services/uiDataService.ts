/**
 * UI Data Service
 * 
 * Handles data flow from UI forms to node outputs
 * Phase 3: Basic data mapping and transformation
 */

import type { FormData } from '../src/types/uiDefinition';
import type { OutputMapping } from '../src/types/uiNodeConfig';

/**
 * Apply transformation to a value
 */
function applyTransformation(value: unknown, transformation: string): unknown {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }

  switch (transformation) {
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'parseInt':
      return typeof value === 'string' ? parseInt(value, 10) : Number(value);
    case 'parseFloat':
      return typeof value === 'string' ? parseFloat(value) : Number(value);
    case 'toString':
      return String(value);
    default:
      return value;
  }
}

/**
 * Map form data to node outputs based on output mapping configuration
 */
export function mapFormDataToOutputs(
  formData: FormData,
  outputMapping: OutputMapping
): Record<string, unknown> {
  const outputs: Record<string, unknown> = {};

  // Map each field to its corresponding output port
  Object.entries(outputMapping.fieldToPort).forEach(([fieldName, portId]) => {
    if (!portId) return; // Skip unmapped fields

    const fieldValue = formData[fieldName];

    // Apply transformation if specified
    const transformation = outputMapping.transformations?.[fieldName];
    const transformedValue = transformation
      ? applyTransformation(fieldValue, transformation)
      : fieldValue;

    outputs[portId] = transformedValue;
  });

  return outputs;
}

/**
 * Validate form data based on UI definition
 */
export function validateFormData(
  formData: FormData,
  uiDefinition: { components: Array<{ name: string; label?: string; required?: boolean; type?: string }> }
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  uiDefinition.components.forEach((component) => {
    if (!component.name) return; // Skip components without names (labels, buttons)

    if (component.required) {
      const value = formData[component.name];
      const isEmpty = value === undefined || value === null || value === '';
      
      if (isEmpty) {
        const fieldLabel = component.label || component.name;
        errors[component.name] = `${fieldLabel} is required`;
      }
    }

    // Type-specific validation for input components
    if (component.type === 'input') {
      const inputComponent = component as { inputType?: string; name: string; label?: string };
      if (inputComponent.inputType === 'email' && formData[component.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const value = String(formData[component.name]);
        if (!emailRegex.test(value)) {
          errors[component.name] = `${component.label || component.name} must be a valid email address`;
        }
      }

      if (inputComponent.inputType === 'number' && formData[component.name] !== undefined && formData[component.name] !== null && formData[component.name] !== '') {
        const value = formData[component.name];
        if (isNaN(Number(value))) {
          errors[component.name] = `${component.label || component.name} must be a valid number`;
        }
      }
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

