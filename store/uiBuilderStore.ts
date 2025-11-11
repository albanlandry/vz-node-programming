/**
 * UI Builder Store (Zustand)
 * 
 * Manages UI definitions for the WYSIWYG UI Builder
 * Phase 1: Basic CRUD operations with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIDefinition } from '../src/types/uiDefinition';

/**
 * Generate a unique ID
 * Browser-compatible UUID v4 generator
 */
function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UIBuilderState {
  // UI Definitions
  definitions: UIDefinition[];
  
  // Actions
  createDefinition: (name: string, description?: string) => UIDefinition;
  updateDefinition: (id: string, updates: Partial<UIDefinition>) => void;
  deleteDefinition: (id: string) => void;
  getDefinition: (id: string) => UIDefinition | undefined;
  getAllDefinitions: () => UIDefinition[];
  
  // Helper methods
  duplicateDefinition: (id: string) => UIDefinition | undefined;
}

const STORAGE_KEY = 'vz-ui-builder-definitions';

export const useUIBuilderStore = create<UIBuilderState>()(
  persist(
    (set, get) => ({
      definitions: [],

      /**
       * Create a new UI definition
       */
      createDefinition: (name: string, description?: string) => {
        const newDefinition: UIDefinition = {
          id: generateId(),
          name,
          description,
          version: '1.0.0',
          components: [],
          layout: {
            direction: 'column',
            gap: 16,
            padding: 16,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          definitions: [...state.definitions, newDefinition],
        }));

        return newDefinition;
      },

      /**
       * Update an existing UI definition
       */
      updateDefinition: (id: string, updates: Partial<UIDefinition>) => {
        set((state) => ({
          definitions: state.definitions.map((def) =>
            def.id === id
              ? {
                  ...def,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : def
          ),
        }));
      },

      /**
       * Delete a UI definition
       */
      deleteDefinition: (id: string) => {
        set((state) => ({
          definitions: state.definitions.filter((def) => def.id !== id),
        }));
      },

      /**
       * Get a specific UI definition by ID
       */
      getDefinition: (id: string) => {
        return get().definitions.find((def) => def.id === id);
      },

      /**
       * Get all UI definitions
       */
      getAllDefinitions: () => {
        return get().definitions;
      },

      /**
       * Duplicate a UI definition
       */
      duplicateDefinition: (id: string) => {
        const original = get().getDefinition(id);
        if (!original) return undefined;

        const duplicated: UIDefinition = {
          ...original,
          id: generateId(),
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          definitions: [...state.definitions, duplicated],
        }));

        return duplicated;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ definitions: state.definitions }),
    }
  )
);

