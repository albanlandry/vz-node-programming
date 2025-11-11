/**
 * UI Data Service
 * 
 * Handles data flow from UI forms to node outputs
 * Phase 6: Advanced data mapping and transformation
 */

import type { FormData } from '../src/types/uiDefinition';
import type { OutputMapping, TransformationConfig, ConditionalMappingRule } from '../src/types/uiNodeConfig';
import { applyTransformationById, applyTransformations, type TransformationOptions } from './transformationService';

/**
 * Evaluate a simple condition (Phase 6)
 * WARNING: This is a simplified evaluator. For production, consider using a safer expression parser.
 */
function evaluateCondition(condition: string, value: unknown, formData: FormData): boolean {
  try {
    // Replace 'value' with actual value and allow access to other form fields
    let safeCondition = condition.replace(/value/g, JSON.stringify(value));
    
    // Allow access to other form fields (e.g., formData.fieldName)
    Object.entries(formData).forEach(([key, val]) => {
      safeCondition = safeCondition.replace(new RegExp(`formData\\.${key}`, 'g'), JSON.stringify(val));
    });
    
    return new Function(`return ${safeCondition}`)();
  } catch (e) {
    console.warn('Condition evaluation error:', e);
    return false;
  }
}

/**
 * Map form data to node outputs based on output mapping configuration (Phase 6: Enhanced)
 */
export function mapFormDataToOutputs(
  formData: FormData,
  outputMapping: OutputMapping
): Record<string, unknown> {
  let outputs: Record<string, unknown> = {};

  // Apply filters first (Phase 6)
  let filteredData = { ...formData };
  if (outputMapping.filters?.includeFields && outputMapping.filters.includeFields.length > 0) {
    // Include only specified fields
    filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => outputMapping.filters!.includeFields!.includes(key))
    );
  } else if (outputMapping.filters?.excludeFields && outputMapping.filters.excludeFields.length > 0) {
    // Exclude specified fields
    filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key]) => !outputMapping.filters!.excludeFields!.includes(key))
    );
  }

  // Map each field to its corresponding output port (Phase 6: Enhanced transformations)
  Object.entries(outputMapping.fieldToPort).forEach(([fieldName, portId]) => {
    if (!portId) return; // Skip unmapped fields
    if (!(fieldName in filteredData)) return; // Skip filtered fields

    const fieldValue = filteredData[fieldName];

    // Apply transformation if specified (Phase 6: Support TransformationConfig)
    const transformConfig = outputMapping.transformations?.[fieldName];
    let transformedValue = fieldValue;

    if (transformConfig) {
      try {
        // Apply main transformation
        transformedValue = applyTransformationById(
          transformConfig.id,
          fieldValue,
          transformConfig.options as TransformationOptions
        );

        // Apply chain transformations if any
        if (transformConfig.chain) {
          const chainIds = transformConfig.chain.map((t) => t.id);
          const chainOptions = Object.fromEntries(
            transformConfig.chain.map((t, i) => [chainIds[i], t.options as TransformationOptions])
          );
          transformedValue = applyTransformations(transformedValue, chainIds, chainOptions);
        }
      } catch (e) {
        console.error(`Transformation error for field ${fieldName}:`, e);
        transformedValue = fieldValue; // Fallback to original value
      }
    }

    outputs[portId] = transformedValue;
  });

  // Apply conditional mapping rules (Phase 6)
  if (outputMapping.conditionalRules && outputMapping.conditionalRules.length > 0) {
    const conditionalOutputs: Record<string, unknown> = {};

    outputMapping.conditionalRules.forEach((rule: ConditionalMappingRule) => {
      try {
        // Evaluate condition (using first mapped field value as default, or can be field-specific)
        // For simplicity, we'll evaluate against all form data
        const conditionResult = evaluateCondition(rule.condition, filteredData, filteredData);

        if (conditionResult && rule.truePort) {
          // Apply true transformation if specified
          let trueValue: unknown = filteredData;
          if (rule.trueTransform) {
            trueValue = applyTransformationById(
              rule.trueTransform.id,
              trueValue,
              rule.trueTransform.options as TransformationOptions
            );
          }
          conditionalOutputs[rule.truePort] = trueValue;
        } else if (!conditionResult && rule.falsePort) {
          // Apply false transformation if specified
          let falseValue: unknown = filteredData;
          if (rule.falseTransform) {
            falseValue = applyTransformationById(
              rule.falseTransform.id,
              falseValue,
              rule.falseTransform.options as TransformationOptions
            );
          }
          conditionalOutputs[rule.falsePort] = falseValue;
        }
      } catch (e) {
        console.error('Conditional rule evaluation error:', e);
      }
    });

    // Merge conditional outputs (conditional outputs take precedence)
    outputs = { ...outputs, ...conditionalOutputs };
  }

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

