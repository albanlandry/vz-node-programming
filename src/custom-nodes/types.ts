/**
 * Type definitions for custom node system
 * Defines interfaces for custom node configuration, templates, and storage
 */

import { Port, NodeConfig } from '../types';

/**
 * Template types available for custom node creation
 */
export enum TemplateType {
  TRANSFORM = 'transform',
  FILTER = 'filter',
  CALCULATOR = 'calculator',
  CONDITIONAL = 'conditional',
  STRING_OP = 'string-op',
}

/**
 * Configuration for creating a custom node
 */
export interface CustomNodeConfig extends NodeConfig {
  /** Template type to use */
  template: TemplateType;
  /** Expression or code to execute */
  expression: string;
  /** Storage ID if persisted */
  storageId?: string;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
  /** User who created this node (for future auth) */
  createdBy?: string;
}

/**
 * Custom node metadata stored in the registry
 */
export interface CustomNodeMetadata {
  /** Unique identifier for the node type */
  type: string;
  /** Display name */
  displayName: string;
  /** Category */
  category: string;
  /** Description */
  description: string;
  /** Version */
  version: string;
  /** Author */
  author?: string;
  /** Tags */
  tags: string[];
  /** Template type */
  template: TemplateType;
  /** Expression */
  expression: string;
  /** Input ports */
  inputs: Port[];
  /** Output ports */
  outputs: Port[];
  /** Storage ID */
  storageId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Update timestamp */
  updatedAt: Date;
  /** Creator ID */
  createdBy?: string;
}

/**
 * Validation result for custom node configuration
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of error messages */
  errors: string[];
  /** List of warning messages */
  warnings?: string[];
}

/**
 * Stored custom node data (for persistence)
 */
export interface StoredCustomNode {
  /** Unique storage ID */
  id: string;
  /** Node type */
  type: string;
  /** Custom node configuration */
  config: CustomNodeConfig;
  /** Metadata */
  metadata: CustomNodeMetadata;
}

