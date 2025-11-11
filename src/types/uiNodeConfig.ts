/**
 * UI Node Configuration Types
 * 
 * Types for configuring UI definitions in interactive nodes
 * Phase 3: Interactive Node Integration
 */

import type { UIDefinition, FormData } from './uiDefinition';

/**
 * Transformation configuration (Phase 6)
 */
export interface TransformationConfig {
  /**
   * Transformation ID
   */
  id: string;
  
  /**
   * Transformation options/parameters
   */
  options?: Record<string, unknown>;
  
  /**
   * Chain multiple transformations (applied in order)
   */
  chain?: TransformationConfig[];
}

/**
 * Conditional mapping rule (Phase 6)
 */
export interface ConditionalMappingRule {
  /**
   * Condition to evaluate
   */
  condition: string;
  
  /**
   * Output port ID if condition is true
   */
  truePort?: string;
  
  /**
   * Output port ID if condition is false
   */
  falsePort?: string;
  
  /**
   * Transformation to apply if condition is true
   */
  trueTransform?: TransformationConfig;
  
  /**
   * Transformation to apply if condition is false
   */
  falseTransform?: TransformationConfig;
}

/**
 * Output mapping configuration (Phase 6: Enhanced)
 * Maps UI form fields to node output ports
 */
export interface OutputMapping {
  /**
   * Map of UI field name to output port ID
   */
  fieldToPort: Record<string, string>;
  
  /**
   * Transformation configuration for each field (Phase 6)
   */
  transformations?: Record<string, TransformationConfig>;
  
  /**
   * Conditional mapping rules (Phase 6)
   * Applied after field mapping
   */
  conditionalRules?: ConditionalMappingRule[];
  
  /**
   * Filter configuration (Phase 6)
   * Fields to exclude from output
   */
  filters?: {
    excludeFields?: string[];
    includeFields?: string[];
  };
}

/**
 * UI Node Configuration
 * Configuration for using a UI definition in an interactive node
 */
export interface UINodeConfig {
  /**
   * ID of the UI definition to use
   */
  uiDefinitionId: string;
  
  /**
   * Output mapping configuration
   */
  outputMapping: OutputMapping;
  
  /**
   * Whether to validate the form before submission
   */
  validateBeforeSubmit?: boolean;
  
  /**
   * Custom validation error messages
   */
  validationMessages?: Record<string, string>;
}

/**
 * Node UI Configuration stored in node properties
 */
export interface NodeUIProperties {
  /**
   * UI configuration for this node
   */
  uiConfig?: UINodeConfig;
}

