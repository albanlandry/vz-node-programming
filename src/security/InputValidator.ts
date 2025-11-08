/**
 * Enhanced Input Validator
 * 
 * Provides JSON Schema-based validation for node inputs with support for:
 * - Type validation
 * - Range/constraint validation
 * - Pattern matching
 * - Enum validation
 * - Custom validation functions
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { logger } from '../utils/Logger';
import type { Port, DataType } from '../types';

/**
 * JSON Schema for port validation
 */
export interface PortValidationSchema {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  items?: PortValidationSchema;
  properties?: Record<string, PortValidationSchema>;
  required?: string[];
  custom?: (value: unknown) => boolean | string;
  description?: string;
}

/**
 * Enhanced port definition with validation schema
 */
export interface ValidatedPort extends Port {
  validation?: PortValidationSchema;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  portId: string;
  portName: string;
  message: string;
  path?: string;
  value?: unknown;
}

/**
 * Enhanced input validator with JSON Schema support
 */
export class InputValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateSchema: true,
      removeAdditional: false,
    });
    
    // Add format validators (email, uri, date, etc.)
    addFormats(this.ajv);
  }

  /**
   * Validate a port value against its schema
   * 
   * @param port - Port definition with validation schema
   * @param value - Value to validate
   * @returns Validation result
   */
  public validatePort(
    port: ValidatedPort,
    value: unknown,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check required
    if (port.required && (value === undefined || value === null)) {
      errors.push({
        portId: port.id,
        portName: port.name,
        message: `Required port '${port.name}' is missing`,
      });
      return { valid: false, errors, warnings };
    }

    // If value is undefined/null and not required, it's valid
    if (value === undefined || value === null) {
      return { valid: true, errors, warnings };
    }

    // Use data type validator if no schema provided
    if (!port.validation && port.dataType.validator) {
      if (!port.dataType.validator(value)) {
        errors.push({
          portId: port.id,
          portName: port.name,
          message: `Value does not match expected type: ${port.dataType.name}`,
          value,
        });
        return { valid: false, errors, warnings };
      }
      return { valid: true, errors, warnings };
    }

    // Use JSON Schema validation if provided
    if (port.validation) {
      const schemaResult = this.validateWithSchema(port, value);
      if (!schemaResult.valid) {
        errors.push(...schemaResult.errors);
      }
      warnings.push(...schemaResult.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate value against JSON Schema
   */
  private validateWithSchema(
    port: ValidatedPort,
    value: unknown,
  ): { valid: boolean; errors: ValidationError[]; warnings: string[] } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!port.validation) {
      return { valid: true, errors, warnings };
    }

    const schema = port.validation;

    // Build JSON Schema
    const jsonSchema: any = {
      type: schema.type || 'any',
    };

    if (schema.enum) {
      jsonSchema.enum = schema.enum;
    }

    if (schema.minimum !== undefined) {
      jsonSchema.minimum = schema.minimum;
    }

    if (schema.maximum !== undefined) {
      jsonSchema.maximum = schema.maximum;
    }

    if (schema.minLength !== undefined) {
      jsonSchema.minLength = schema.minLength;
    }

    if (schema.maxLength !== undefined) {
      jsonSchema.maxLength = schema.maxLength;
    }

    if (schema.pattern) {
      jsonSchema.pattern = schema.pattern;
    }

    if (schema.format) {
      jsonSchema.format = schema.format;
    }

    if (schema.items) {
      jsonSchema.items = this.schemaToJsonSchema(schema.items);
    }

    if (schema.properties) {
      jsonSchema.properties = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        jsonSchema.properties[key] = this.schemaToJsonSchema(propSchema);
      }
    }

    if (schema.required) {
      jsonSchema.required = schema.required;
    }

    // Compile and validate
    try {
      const validate = this.ajv.compile(jsonSchema);
      const valid = validate(value);

      if (!valid) {
        const ajvErrors = validate.errors || [];
        for (const error of ajvErrors) {
          errors.push({
            portId: port.id,
            portName: port.name,
            message: this.formatAjvError(error),
            path: error.instancePath,
            value: error.data,
          });
        }
      }

      // Custom validation
      if (schema.custom) {
        const customResult = schema.custom(value);
        if (customResult !== true) {
          errors.push({
            portId: port.id,
            portName: port.name,
            message: typeof customResult === 'string' ? customResult : 'Custom validation failed',
            value,
          });
        }
      }
    } catch (error) {
      logger.error('Schema validation error:', error);
      errors.push({
        portId: port.id,
        portName: port.name,
        message: `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
        value,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Convert PortValidationSchema to JSON Schema
   */
  private schemaToJsonSchema(schema: PortValidationSchema): any {
    const jsonSchema: any = {};

    if (schema.type) {
      jsonSchema.type = schema.type;
    }

    if (schema.enum) {
      jsonSchema.enum = schema.enum;
    }

    if (schema.minimum !== undefined) {
      jsonSchema.minimum = schema.minimum;
    }

    if (schema.maximum !== undefined) {
      jsonSchema.maximum = schema.maximum;
    }

    if (schema.minLength !== undefined) {
      jsonSchema.minLength = schema.minLength;
    }

    if (schema.maxLength !== undefined) {
      jsonSchema.maxLength = schema.maxLength;
    }

    if (schema.pattern) {
      jsonSchema.pattern = schema.pattern;
    }

    if (schema.format) {
      jsonSchema.format = schema.format;
    }

    if (schema.items) {
      jsonSchema.items = this.schemaToJsonSchema(schema.items);
    }

    if (schema.properties) {
      jsonSchema.properties = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        jsonSchema.properties[key] = this.schemaToJsonSchema(propSchema);
      }
    }

    if (schema.required) {
      jsonSchema.required = schema.required;
    }

    return jsonSchema;
  }

  /**
   * Format AJV error message
   */
  private formatAjvError(error: ErrorObject): string {
    const message = error.message || 'Validation error';
    const params = error.params;

    if (params) {
      if ('minimum' in params) {
        return `${message} (minimum: ${params.minimum})`;
      }
      if ('maximum' in params) {
        return `${message} (maximum: ${params.maximum})`;
      }
      if ('minLength' in params) {
        return `${message} (minLength: ${params.minLength})`;
      }
      if ('maxLength' in params) {
        return `${message} (maxLength: ${params.maxLength})`;
      }
      if ('pattern' in params) {
        return `${message} (pattern: ${params.pattern})`;
      }
    }

    return message;
  }

  /**
   * Validate multiple ports
   */
  public validatePorts(
    ports: ValidatedPort[],
    values: Map<string, unknown>,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    for (const port of ports) {
      const value = values.get(port.id);
      const result = this.validatePort(port, value);

      if (!result.valid) {
        errors.push(...result.errors);
      }
      warnings.push(...result.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Singleton instance
 */
export const inputValidator = new InputValidator();

