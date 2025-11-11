/**
 * Validation Service
 * 
 * Handles form validation for UI definitions
 * Phase 5: Comprehensive validation system
 */

import type { ValidationRule, FormValidationResult, FieldValidationResult } from '../src/types/validation';
import type { UIComponent, FormData } from '../src/types/uiDefinition';

/**
 * Validate a single field value against validation rules
 */
export function validateField(
  component: UIComponent,
  value: unknown,
  formData?: FormData
): FieldValidationResult {
  const fieldName = component.name;
  
  // Check required
  if (component.required) {
    if (value === null || value === undefined || value === '') {
      const requiredRule = component.validation?.find((r) => r.type === 'required');
      return {
        fieldName,
        isValid: false,
        error: requiredRule?.message || `${component.label || fieldName} is required`,
      };
    }
  }

  // Skip other validations if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return {
      fieldName,
      isValid: true,
    };
  }

  // Apply validation rules
  if (component.validation) {
    for (const rule of component.validation) {
      const error = validateRule(rule, value, component, formData);
      if (error) {
        return {
          fieldName,
          isValid: false,
          error,
        };
      }
    }
  }

  // Type-specific validation based on component type
  if (component.type === 'input') {
    const inputComponent = component as UIComponent & { inputType?: string };
    if (inputComponent.inputType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === 'string' && !emailRegex.test(value)) {
        return {
          fieldName,
          isValid: false,
          error: `${component.label || fieldName} must be a valid email address`,
        };
      }
    }
    if (inputComponent.inputType === 'number') {
      if (isNaN(Number(value))) {
        return {
          fieldName,
          isValid: false,
          error: `${component.label || fieldName} must be a valid number`,
        };
      }
    }
  }

  return {
    fieldName,
    isValid: true,
  };
}

/**
 * Validate a single validation rule
 */
function validateRule(
  rule: ValidationRule,
  value: unknown,
  component: UIComponent,
  formData?: FormData
): string | null {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return rule.message || `${component.label || component.name} is required`;
      }
      break;

    case 'email':
      if (typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return rule.message || `${component.label || component.name} must be a valid email address`;
        }
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return rule.message || `${component.label || component.name} must be a valid number`;
      }
      break;

    case 'min':
      if (typeof rule.value === 'number') {
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `${component.label || component.name} must be at least ${rule.value}`;
        }
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `${component.label || component.name} must be at least ${rule.value} characters`;
        }
      }
      break;

    case 'max':
      if (typeof rule.value === 'number') {
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `${component.label || component.name} must be at most ${rule.value}`;
        }
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `${component.label || component.name} must be at most ${rule.value} characters`;
        }
      }
      break;

    case 'minLength':
      if (typeof rule.value === 'number' && typeof value === 'string') {
        if (value.length < rule.value) {
          return rule.message || `${component.label || component.name} must be at least ${rule.value} characters`;
        }
      }
      break;

    case 'maxLength':
      if (typeof rule.value === 'number' && typeof value === 'string') {
        if (value.length > rule.value) {
          return rule.message || `${component.label || component.name} must be at most ${rule.value} characters`;
        }
      }
      break;

    case 'pattern':
      if (typeof rule.value === 'string') {
        try {
          const regex = new RegExp(rule.value);
          if (typeof value === 'string' && !regex.test(value)) {
            return rule.message || `${component.label || component.name} format is invalid`;
          }
        } catch (e) {
          // Invalid regex pattern
          console.warn('Invalid regex pattern:', rule.value);
        }
      } else if (rule.value instanceof RegExp) {
        if (typeof value === 'string' && !rule.value.test(value)) {
          return rule.message || `${component.label || component.name} format is invalid`;
        }
      }
      break;

    case 'custom':
      if (rule.validator) {
        const result = rule.validator(value);
        if (result === false) {
          return rule.message || `${component.label || component.name} is invalid`;
        } else if (typeof result === 'string') {
          return result;
        }
      }
      break;
  }

  return null;
}

/**
 * Validate entire form based on UI definition
 */
export function validateForm(
  components: UIComponent[],
  formData: FormData
): FormValidationResult {
  const fields: Record<string, FieldValidationResult> = {};
  const errors: Record<string, string> = {};

  // Only validate components with names (form fields)
  const formComponents = components.filter((comp) => comp.name && comp.type !== 'button' && comp.type !== 'label');

  for (const component of formComponents) {
    const fieldName = component.name;
    const value = formData[fieldName];
    const result = validateField(component, value, formData);

    fields[fieldName] = result;

    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    fields,
    errors,
  };
}

/**
 * Get error message for a specific field
 */
export function getFieldError(
  fieldName: string,
  validationResult: FormValidationResult
): string | undefined {
  return validationResult.errors[fieldName];
}

