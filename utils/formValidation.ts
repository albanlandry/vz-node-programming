/**
 * Form Validation Utilities
 * 
 * Provides validation functions for form fields based on ValidationRule
 */

import type { ValidationRule, FormField } from '../src/types';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single field value against its validation rules
 */
export function validateField(
  field: FormField,
  value: unknown,
): ValidationError | null {
  // Check required
  if (field.required && (value === null || value === undefined || value === '')) {
    return {
      fieldId: field.id,
      message: field.validation?.find((r) => r.type === 'required')?.message || `${field.label} is required`,
    };
  }

  // Skip other validations if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Apply validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      const error = validateRule(rule, value, field);
      if (error) {
        return {
          fieldId: field.id,
          message: error,
        };
      }
    }
  }

  return null;
}

/**
 * Validate a single validation rule
 */
function validateRule(
  rule: ValidationRule,
  value: unknown,
  field: FormField,
): string | null {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return rule.message || `${field.label} is required`;
      }
      break;

    case 'min':
      if (typeof value === 'number' && typeof rule.value === 'number') {
        if (value < rule.value) {
          return rule.message || `${field.label} must be at least ${rule.value}`;
        }
      } else if (typeof value === 'string' && typeof rule.value === 'number') {
        if (value.length < rule.value) {
          return rule.message || `${field.label} must be at least ${rule.value} characters`;
        }
      }
      break;

    case 'max':
      if (typeof value === 'number' && typeof rule.value === 'number') {
        if (value > rule.value) {
          return rule.message || `${field.label} must be at most ${rule.value}`;
        }
      } else if (typeof value === 'string' && typeof rule.value === 'number') {
        if (value.length > rule.value) {
          return rule.message || `${field.label} must be at most ${rule.value} characters`;
        }
      }
      break;

    case 'pattern':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return rule.message || `${field.label} format is invalid`;
        }
      }
      break;

    case 'custom':
      if (rule.validator) {
        const result = rule.validator(value);
        if (result === false) {
          return rule.message || `${field.label} is invalid`;
        } else if (typeof result === 'string') {
          return result;
        }
      }
      break;
  }

  return null;
}

/**
 * Validate an entire form schema
 */
export function validateForm(
  schema: { fields: FormField[] },
  values: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of schema.fields) {
    const error = validateField(field, values[field.id]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get validation error message for a specific field
 */
export function getFieldError(
  fieldId: string,
  validationResult: ValidationResult,
): string | undefined {
  return validationResult.errors.find((e) => e.fieldId === fieldId)?.message;
}

