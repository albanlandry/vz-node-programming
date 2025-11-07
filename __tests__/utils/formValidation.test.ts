/**
 * Unit Tests for Form Validation Utilities
 */

import {
  validateField,
  validateForm,
  getFieldError,
  type ValidationResult,
} from '../../utils/formValidation';
import type { FormField, FormSchema } from '../../src/types';

describe('Form Validation Utilities', () => {
  describe('validateField', () => {
    it('should return null for valid field', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
      };
      expect(validateField(field, 'value')).toBeNull();
    });

    it('should return error for required field with empty value', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        required: true,
      };
      const error = validateField(field, '');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });

    it('should return error for required field with null value', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        required: true,
      };
      const error = validateField(field, null);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });

    it('should validate min length for string', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          { type: 'min', value: 5, message: 'Must be at least 5 characters' },
        ],
      };
      const error = validateField(field, 'abc');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('5');
    });

    it('should validate max length for string', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          { type: 'max', value: 5, message: 'Must be at most 5 characters' },
        ],
      };
      const error = validateField(field, 'abcdef');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('5');
    });

    it('should validate min value for number', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'number',
        validation: [
          { type: 'min', value: 10, message: 'Must be at least 10' },
        ],
      };
      const error = validateField(field, 5);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('10');
    });

    it('should validate max value for number', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'number',
        validation: [
          { type: 'max', value: 10, message: 'Must be at most 10' },
        ],
      };
      const error = validateField(field, 15);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('10');
    });

    it('should validate pattern', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          { type: 'pattern', value: '^[A-Z]+$', message: 'Must be uppercase' },
        ],
      };
      const error = validateField(field, 'abc');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Must be uppercase');
    });

    it('should pass pattern validation for matching value', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          { type: 'pattern', value: '^[A-Z]+$', message: 'Must be uppercase' },
        ],
      };
      const error = validateField(field, 'ABC');
      expect(error).toBeNull();
    });

    it('should validate custom validator returning false', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          {
            type: 'custom',
            validator: (value) => (value as string).length > 5,
            message: 'Must be longer than 5',
          },
        ],
      };
      const error = validateField(field, 'abc');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Must be longer than 5');
    });

    it('should validate custom validator returning string error', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          {
            type: 'custom',
            validator: (value) => {
              if ((value as string).length < 5) {
                return 'Too short';
              }
              return true;
            },
          },
        ],
      };
      const error = validateField(field, 'abc');
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Too short');
    });

    it('should pass custom validator returning true', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          {
            type: 'custom',
            validator: (value) => (value as string).length > 5,
            message: 'Must be longer than 5',
          },
        ],
      };
      const error = validateField(field, 'abcdef');
      expect(error).toBeNull();
    });

    it('should skip validation for empty non-required field', () => {
      const field: FormField = {
        id: 'test',
        label: 'Test',
        type: 'text',
        validation: [
          { type: 'min', value: 5, message: 'Must be at least 5' },
        ],
      };
      const error = validateField(field, '');
      expect(error).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('should return valid result for valid form', () => {
      const schema: FormSchema = {
        fields: [
          {
            id: 'field1',
            label: 'Field 1',
            type: 'text',
            required: true,
          },
          {
            id: 'field2',
            label: 'Field 2',
            type: 'number',
          },
        ],
      };
      const values = {
        field1: 'value1',
        field2: 123,
      };
      const result = validateForm(schema, values);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for form with errors', () => {
      const schema: FormSchema = {
        fields: [
          {
            id: 'field1',
            label: 'Field 1',
            type: 'text',
            required: true,
          },
          {
            id: 'field2',
            label: 'Field 2',
            type: 'number',
            validation: [{ type: 'min', value: 10 }],
          },
        ],
      };
      const values = {
        field1: '',
        field2: 5,
      };
      const result = validateForm(schema, values);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate all fields in schema', () => {
      const schema: FormSchema = {
        fields: [
          {
            id: 'field1',
            label: 'Field 1',
            type: 'text',
            required: true,
          },
          {
            id: 'field2',
            label: 'Field 2',
            type: 'text',
            required: true,
          },
          {
            id: 'field3',
            label: 'Field 3',
            type: 'text',
            required: true,
          },
        ],
      };
      const values = {
        field1: '',
        field2: '',
        field3: '',
      };
      const result = validateForm(schema, values);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('getFieldError', () => {
    it('should return error message for field with error', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { fieldId: 'field1', message: 'Field 1 is required' },
          { fieldId: 'field2', message: 'Field 2 is invalid' },
        ],
      };
      expect(getFieldError('field1', result)).toBe('Field 1 is required');
      expect(getFieldError('field2', result)).toBe('Field 2 is invalid');
    });

    it('should return undefined for field without error', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { fieldId: 'field1', message: 'Field 1 is required' },
        ],
      };
      expect(getFieldError('field2', result)).toBeUndefined();
    });

    it('should return undefined for valid form', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
      };
      expect(getFieldError('field1', result)).toBeUndefined();
    });
  });
});

