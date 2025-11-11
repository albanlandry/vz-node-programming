/**
 * Validation Types
 * 
 * Types for form validation in UI Builder
 * Phase 5: Validation System
 */

/**
 * Validation rule types
 */
export type ValidationRuleType = 
  | 'required'
  | 'email'
  | 'number'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'custom';

/**
 * Validation rule
 */
export interface ValidationRule {
  /**
   * Type of validation rule
   */
  type: ValidationRuleType;
  
  /**
   * Value for the rule (e.g., min: 5, max: 100, pattern: /regex/)
   */
  value?: number | string | RegExp;
  
  /**
   * Custom error message for this rule
   */
  message?: string;
  
  /**
   * Custom validator function (for 'custom' type)
   * Returns true if valid, false or error message string if invalid
   */
  validator?: (value: unknown) => boolean | string;
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  /**
   * Field name
   */
  fieldName: string;
  
  /**
   * Error message (if invalid)
   */
  error?: string;
  
  /**
   * Whether the field is valid
   */
  isValid: boolean;
}

/**
 * Validation result for entire form
 */
export interface FormValidationResult {
  /**
   * Whether the entire form is valid
   */
  isValid: boolean;
  
  /**
   * Field-level validation results
   */
  fields: Record<string, FieldValidationResult>;
  
  /**
   * All error messages
   */
  errors: Record<string, string>;
}

