/**
 * Export/Import Service
 * 
 * Handles exporting and importing UI definitions
 * Phase 8: Export/Import functionality
 */

import type { UIDefinition } from '../src/types/uiDefinition';

/**
 * Export UI definition to JSON
 */
export function exportUIDefinition(definition: UIDefinition): string {
  return JSON.stringify(definition, null, 2);
}

/**
 * Export multiple UI definitions to JSON
 */
export function exportUIDefinitions(definitions: UIDefinition[]): string {
  return JSON.stringify(definitions, null, 2);
}

/**
 * Import UI definition from JSON
 */
export function importUIDefinition(json: string): UIDefinition | null {
  try {
    const parsed = JSON.parse(json);
    
    // Validate structure
    if (!parsed.id || !parsed.name || !Array.isArray(parsed.components)) {
      throw new Error('Invalid UI definition format');
    }

    return parsed as UIDefinition;
  } catch (e) {
    console.error('Import error:', e);
    return null;
  }
}

/**
 * Import multiple UI definitions from JSON
 */
export function importUIDefinitions(json: string): UIDefinition[] {
  try {
    const parsed = JSON.parse(json);
    
    // Check if it's an array or single object
    const definitions = Array.isArray(parsed) ? parsed : [parsed];
    
    return definitions
      .filter((def) => def.id && def.name && Array.isArray(def.components))
      .map((def) => def as UIDefinition);
  } catch (e) {
    console.error('Import error:', e);
    return [];
  }
}

/**
 * Download UI definition as file
 */
export function downloadUIDefinition(definition: UIDefinition, filename?: string): void {
  const json = exportUIDefinition(definition);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${definition.name.replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read UI definition from file
 */
export function readUIDefinitionFromFile(file: File): Promise<UIDefinition | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const definition = importUIDefinition(content);
      resolve(definition);
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsText(file);
  });
}

