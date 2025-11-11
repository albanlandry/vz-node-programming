/**
 * Versioning Service
 * 
 * Manages version history for UI definitions
 * Phase 8: UI Versioning
 */

import type { UIDefinition } from '../src/types/uiDefinition';

/**
 * Version metadata
 */
export interface VersionMetadata {
  /**
   * Version number (semantic versioning: major.minor.patch)
   */
  version: string;
  
  /**
   * Timestamp when this version was created
   */
  timestamp: string;
  
  /**
   * Description of changes in this version
   */
  description?: string;
  
  /**
   * Author/user who created this version
   */
  author?: string;
  
  /**
   * Tags for this version (e.g., 'stable', 'beta', 'deprecated')
   */
  tags?: string[];
}

/**
 * Versioned UI Definition
 */
export interface VersionedUIDefinition extends UIDefinition {
  /**
   * Version metadata
   */
  versionMetadata: VersionMetadata;
  
  /**
   * Parent version (if this is a branch/derived version)
   */
  parentVersion?: string;
}

/**
 * Version history for a UI definition
 */
export interface VersionHistory {
  /**
   * Definition ID
   */
  definitionId: string;
  
  /**
   * All versions of this definition
   */
  versions: VersionedUIDefinition[];
  
  /**
   * Current active version
   */
  currentVersion: string;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  /**
   * Added components
   */
  added: string[];
  
  /**
   * Removed components
   */
  removed: string[];
  
  /**
   * Modified components
   */
  modified: Array<{
    componentId: string;
    changes: string[];
  }>;
  
  /**
   * Layout changes
   */
  layoutChanges: string[];
  
  /**
   * Theme changes
   */
  themeChanges: string[];
}

/**
 * Increment version number
 */
export function incrementVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return '1.0.0';
  }

  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return currentVersion;
  }
}

/**
 * Create a new version from a definition
 */
export function createVersion(
  definition: UIDefinition,
  type: 'major' | 'minor' | 'patch' = 'patch',
  description?: string,
  author?: string
): VersionedUIDefinition {
  const newVersion = incrementVersion(definition.version, type);
  
  return {
    ...definition,
    version: newVersion,
    versionMetadata: {
      version: newVersion,
      timestamp: new Date().toISOString(),
      description,
      author,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Compare two versions of a UI definition
 */
export function compareVersions(
  version1: UIDefinition,
  version2: UIDefinition
): VersionComparison {
  const comparison: VersionComparison = {
    added: [],
    removed: [],
    modified: [],
    layoutChanges: [],
    themeChanges: [],
  };

  // Compare components
  const comp1Map = new Map(version1.components.map((c) => [c.id, c]));
  const comp2Map = new Map(version2.components.map((c) => [c.id, c]));

  // Find added and removed components
  version2.components.forEach((comp) => {
    if (!comp1Map.has(comp.id)) {
      comparison.added.push(comp.id);
    }
  });

  version1.components.forEach((comp) => {
    if (!comp2Map.has(comp.id)) {
      comparison.removed.push(comp.id);
    }
  });

  // Find modified components
  version1.components.forEach((comp1) => {
    const comp2 = comp2Map.get(comp1.id);
    if (comp2) {
      const changes: string[] = [];
      
      // Compare properties
      if (comp1.type !== comp2.type) changes.push(`Type: ${comp1.type} → ${comp2.type}`);
      if (comp1.name !== comp2.name) changes.push(`Name: ${comp1.name} → ${comp2.name}`);
      if (comp1.label !== comp2.label) changes.push(`Label: ${comp1.label} → ${comp2.label}`);
      if (JSON.stringify(comp1.style) !== JSON.stringify(comp2.style)) {
        changes.push('Style changed');
      }
      if (JSON.stringify(comp1.validation) !== JSON.stringify(comp2.validation)) {
        changes.push('Validation changed');
      }
      
      if (changes.length > 0) {
        comparison.modified.push({
          componentId: comp1.id,
          changes,
        });
      }
    }
  });

  // Compare layout
  const layout1 = JSON.stringify(version1.layout || {});
  const layout2 = JSON.stringify(version2.layout || {});
  if (layout1 !== layout2) {
    comparison.layoutChanges.push('Layout configuration changed');
  }

  // Compare theme
  const theme1 = JSON.stringify(version1.theme || {});
  const theme2 = JSON.stringify(version2.theme || {});
  if (theme1 !== theme2) {
    comparison.themeChanges.push('Theme changed');
  }

  return comparison;
}

/**
 * Get version history from definitions
 */
export function getVersionHistory(
  definitionId: string,
  allVersions: VersionedUIDefinition[]
): VersionHistory | null {
  const versions = allVersions.filter((v) => v.id === definitionId);
  if (versions.length === 0) {
    return null;
  }

  // Sort by version (newest first)
  const sortedVersions = versions.sort((a, b) => {
    const aParts = a.versionMetadata.version.split('.').map(Number);
    const bParts = b.versionMetadata.version.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (aParts[i] > bParts[i]) return -1;
      if (aParts[i] < bParts[i]) return 1;
    }
    return 0;
  });

  return {
    definitionId,
    versions: sortedVersions,
    currentVersion: sortedVersions[0]?.versionMetadata.version || '',
  };
}

