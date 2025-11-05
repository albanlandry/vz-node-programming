/**
 * Type definitions for node metadata
 * Matches the NodeMetadata interface from the backend
 */

export interface Port {
  id: string;
  name: string;
  dataType: {
    name: string;
    validator?: (value: any) => boolean;
  };
  required?: boolean;
  description?: string;
}

export interface NodeMetadata {
  type: string;
  displayName: string;
  category: string;
  description: string;
  version: string;
  author?: string;
  tags: string[];
  icon?: string;
  color?: string;
  deprecated?: boolean;
  inputs: Port[];
  outputs: Port[];
  examples?: string[];
  docsUrl?: string;
}

