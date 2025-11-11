/**
 * UI Node Configuration Types
 * 
 * Types for configuring UI definitions in interactive nodes
 * Phase 3: Interactive Node Integration
 */

import type { UIDefinition, FormData } from './uiDefinition';

/**
 * Output mapping configuration
 * Maps UI form fields to node output ports
 */
export interface OutputMapping {
  /**
   * Map of UI field name to output port ID
   */
  fieldToPort: Record<string, string>;
  
  /**
   * Optional transformation function name
   * e.g., 'lowercase', 'uppercase', 'parseInt', etc.
   */
  transformations?: Record<string, string>;
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

