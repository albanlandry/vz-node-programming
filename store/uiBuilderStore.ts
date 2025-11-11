/**
 * UI Builder Store (Zustand)
 * 
 * Manages UI definitions for the WYSIWYG UI Builder
 * Phase 1: Basic CRUD operations with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIDefinition, UIComponent } from '../src/types/uiDefinition';

/**
 * Generate a unique ID
 * Browser-compatible UUID v4 generator
 */
export function generateId(): string {
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
  
  // Version history (Phase 8)
  versionHistory: Record<string, UIDefinition[]>; // definitionId -> all versions
  
  // Actions
  createDefinition: (name: string, description?: string) => UIDefinition;
  updateDefinition: (id: string, updates: Partial<UIDefinition>) => void;
  deleteDefinition: (id: string) => void;
  getDefinition: (id: string) => UIDefinition | undefined;
  getAllDefinitions: () => UIDefinition[];
  
  // Helper methods
  duplicateDefinition: (id: string) => UIDefinition | undefined;
  
  // Versioning (Phase 8)
  createVersion: (id: string, type: 'major' | 'minor' | 'patch', description?: string) => void;
  getVersionHistory: (id: string) => UIDefinition[];
  rollbackToVersion: (id: string, version: string) => boolean;
  
  // Component management (Phase 2)
  addComponent: (definitionId: string, component: UIComponent, parentId?: string) => void;
  updateComponent: (definitionId: string, componentId: string, updates: Partial<UIComponent>) => void;
  deleteComponent: (definitionId: string, componentId: string) => void;
  reorderComponents: (definitionId: string, componentIds: string[], parentId?: string) => void;
  moveComponentToContainer: (definitionId: string, componentId: string, containerId: string) => void;
  removeComponentFromContainer: (definitionId: string, componentId: string) => void;
  
  // Enhanced features (Phase 4)
  // History management
  history: Record<string, UIDefinition[]>; // definitionId -> history array
  historyIndex: Record<string, number>; // definitionId -> current history index
  saveToHistory: (definitionId: string) => void;
  undo: (definitionId: string) => boolean;
  redo: (definitionId: string) => boolean;
  canUndo: (definitionId: string) => boolean;
  canRedo: (definitionId: string) => boolean;
  
  // Copy/paste
  copiedComponent: UIComponent | null;
  copyComponent: (definitionId: string, componentId: string) => void;
  pasteComponent: (definitionId: string, afterComponentId?: string) => void;
}

const STORAGE_KEY = 'vz-ui-builder-definitions';

export const useUIBuilderStore = create<UIBuilderState>()(
  persist(
    (set, get) => ({
      definitions: [],
      versionHistory: {},
      history: {},
      historyIndex: {},
      copiedComponent: null,

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

      /**
       * Add a component to a UI definition (Phase 2)
       * Supports nesting by adding to a container's children array
       */
      addComponent: (definitionId: string, component: UIComponent, parentId?: string) => {
        set((state) => {
          const definition = state.definitions.find((def) => def.id === definitionId);
          if (!definition) return state;

          // Add component to the components array
          const updatedComponents = [...definition.components, component];

          // If parentId is provided, add component to parent's children array
          if (parentId) {
            const parent = updatedComponents.find((c) => c.id === parentId);
            if (parent && (parent.type === 'container' || parent.type === 'row' || parent.type === 'column')) {
              const parentWithChildren = parent as UIComponent & { children?: string[] };
              if (!parentWithChildren.children) {
                parentWithChildren.children = [];
              }
              parentWithChildren.children.push(component.id);
            }
          }

          return {
            definitions: state.definitions.map((def) =>
              def.id === definitionId
                ? {
                    ...def,
                    components: updatedComponents,
                    updatedAt: new Date().toISOString(),
                  }
                : def
            ),
          };
        });
      },

      /**
       * Update a component in a UI definition (Phase 2)
       */
      updateComponent: (definitionId: string, componentId: string, updates: Partial<UIComponent>) => {
        set((state) => ({
          definitions: state.definitions.map((def) =>
            def.id === definitionId
              ? {
                  ...def,
                  components: def.components.map((comp) =>
                    comp.id === componentId ? { ...comp, ...updates } : comp
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : def
          ),
        }));
      },

      /**
       * Delete a component from a UI definition (Phase 2)
       */
      deleteComponent: (definitionId: string, componentId: string) => {
        set((state) => ({
          definitions: state.definitions.map((def) =>
            def.id === definitionId
              ? {
                  ...def,
                  components: def.components.filter((comp) => comp.id !== componentId),
                  updatedAt: new Date().toISOString(),
                }
              : def
          ),
        }));
      },

      /**
       * Reorder components in a UI definition (Phase 2)
       * Supports reordering within containers
       */
      reorderComponents: (definitionId: string, componentIds: string[], parentId?: string) => {
        set((state) => {
          const definition = state.definitions.find((def) => def.id === definitionId);
          if (!definition) return state;

          if (parentId) {
            // Reorder within a container
            const parent = definition.components.find((c) => c.id === parentId);
            if (parent && (parent.type === 'container' || parent.type === 'row' || parent.type === 'column')) {
              const parentWithChildren = parent as UIComponent & { children?: string[] };
              return {
                definitions: state.definitions.map((def) =>
                  def.id === definitionId
                    ? {
                        ...def,
                        components: def.components.map((comp) =>
                          comp.id === parentId
                            ? { ...comp, children: componentIds } as UIComponent
                            : comp
                        ),
                        updatedAt: new Date().toISOString(),
                      }
                    : def
                ),
              };
            }
          }

          // Reorder root-level components
          const componentMap = new Map(definition.components.map((comp) => [comp.id, comp]));
          const reorderedComponents = componentIds
            .map((id) => componentMap.get(id))
            .filter((comp): comp is UIComponent => comp !== undefined);

          return {
            definitions: state.definitions.map((def) =>
              def.id === definitionId
                ? {
                    ...def,
                    components: reorderedComponents,
                    updatedAt: new Date().toISOString(),
                  }
                : def
            ),
          };
        });
      },

      /**
       * Move a component into a container
       */
      moveComponentToContainer: (definitionId: string, componentId: string, containerId: string) => {
        set((state) => {
          const definition = state.definitions.find((def) => def.id === definitionId);
          if (!definition) return state;

          // Remove component from any existing parent
          const updatedComponents = definition.components.map((comp) => {
            if ((comp.type === 'container' || comp.type === 'row' || comp.type === 'column') && comp.id !== containerId) {
              const compWithChildren = comp as UIComponent & { children?: string[] };
              if (compWithChildren.children?.includes(componentId)) {
                return {
                  ...comp,
                  children: compWithChildren.children.filter((id) => id !== componentId),
                } as UIComponent;
              }
            }
            return comp;
          });

          // Add component to target container
          return {
            definitions: state.definitions.map((def) =>
              def.id === definitionId
                ? {
                    ...def,
                    components: updatedComponents.map((comp) => {
                      if (comp.id === containerId && (comp.type === 'container' || comp.type === 'row' || comp.type === 'column')) {
                        const containerWithChildren = comp as UIComponent & { children?: string[] };
                        const children = containerWithChildren.children || [];
                        if (!children.includes(componentId)) {
                          return { ...comp, children: [...children, componentId] } as UIComponent;
                        }
                      }
                      return comp;
                    }),
                    updatedAt: new Date().toISOString(),
                  }
                : def
            ),
          };
        });
      },

      /**
       * Remove a component from its container (move to root level)
       */
      removeComponentFromContainer: (definitionId: string, componentId: string) => {
        set((state) => {
          const definition = state.definitions.find((def) => def.id === definitionId);
          if (!definition) return state;

          return {
            definitions: state.definitions.map((def) =>
              def.id === definitionId
                ? {
                    ...def,
                    components: definition.components.map((comp) => {
                      if ((comp.type === 'container' || comp.type === 'row' || comp.type === 'column')) {
                        const compWithChildren = comp as UIComponent & { children?: string[] };
                        if (compWithChildren.children?.includes(componentId)) {
                          return {
                            ...comp,
                            children: compWithChildren.children.filter((id) => id !== componentId),
                          } as UIComponent;
                        }
                      }
                      return comp;
                    }),
                    updatedAt: new Date().toISOString(),
                  }
                : def
            ),
          };
        });
      },

      /**
       * Save current state to history (Phase 4)
       */
      saveToHistory: (definitionId: string) => {
        const definition = get().getDefinition(definitionId);
        if (!definition) return;

        set((state) => {
          const history = state.history[definitionId] || [];
          const currentIndex = state.historyIndex[definitionId] ?? -1;
          
          // Remove any future history if we're not at the end
          const newHistory = history.slice(0, currentIndex + 1);
          
          // Add current state (deep clone)
          newHistory.push(JSON.parse(JSON.stringify(definition)));
          
          // Limit history size (keep last 50 states)
          const limitedHistory = newHistory.slice(-50);

          return {
            history: {
              ...state.history,
              [definitionId]: limitedHistory,
            },
            historyIndex: {
              ...state.historyIndex,
              [definitionId]: limitedHistory.length - 1,
            },
          };
        });
      },

      /**
       * Undo last change (Phase 4)
       */
      undo: (definitionId: string) => {
        const state = get();
        const history = state.history[definitionId] || [];
        const currentIndex = state.historyIndex[definitionId] ?? -1;

        if (currentIndex <= 0) return false;

        const previousState = history[currentIndex - 1];
        if (!previousState) return false;

        // Restore previous state
        set((s) => ({
          definitions: s.definitions.map((def) =>
            def.id === definitionId ? previousState : def
          ),
          historyIndex: {
            ...s.historyIndex,
            [definitionId]: currentIndex - 1,
          },
        }));

        return true;
      },

      /**
       * Redo last undone change (Phase 4)
       */
      redo: (definitionId: string) => {
        const state = get();
        const history = state.history[definitionId] || [];
        const currentIndex = state.historyIndex[definitionId] ?? -1;

        if (currentIndex >= history.length - 1) return false;

        const nextState = history[currentIndex + 1];
        if (!nextState) return false;

        // Restore next state
        set((s) => ({
          definitions: s.definitions.map((def) =>
            def.id === definitionId ? nextState : def
          ),
          historyIndex: {
            ...s.historyIndex,
            [definitionId]: currentIndex + 1,
          },
        }));

        return true;
      },

      /**
       * Check if undo is possible (Phase 4)
       */
      canUndo: (definitionId: string) => {
        const state = get();
        const history = state.history[definitionId] || [];
        const currentIndex = state.historyIndex[definitionId] ?? -1;
        return currentIndex > 0;
      },

      /**
       * Check if redo is possible (Phase 4)
       */
      canRedo: (definitionId: string) => {
        const state = get();
        const history = state.history[definitionId] || [];
        const currentIndex = state.historyIndex[definitionId] ?? -1;
        return currentIndex < history.length - 1;
      },

      /**
       * Copy a component (Phase 4)
       */
      copyComponent: (definitionId: string, componentId: string) => {
        const definition = get().getDefinition(definitionId);
        if (!definition) return;

        const component = definition.components.find((c) => c.id === componentId);
        if (!component) return;

        // Deep clone component
        const copied = JSON.parse(JSON.stringify(component));
        set({ copiedComponent: copied });
      },

      /**
       * Paste a copied component (Phase 4)
       */
      pasteComponent: (definitionId: string, afterComponentId?: string) => {
        const state = get();
        const copied = state.copiedComponent;
        if (!copied) return;

        // Create new component with new ID
        const newComponent = {
          ...copied,
          id: generateId(),
          name: `${copied.name}_copy`,
        };

        // Remove children for container types (will be empty)
        if (newComponent.type === 'container' || newComponent.type === 'row' || newComponent.type === 'column') {
          (newComponent as any).children = [];
        }

        set((s) => {
          const definition = s.definitions.find((d) => d.id === definitionId);
          if (!definition) return s;

          let newComponents: UIComponent[];
          if (afterComponentId) {
            const index = definition.components.findIndex((c) => c.id === afterComponentId);
            if (index >= 0) {
              newComponents = [
                ...definition.components.slice(0, index + 1),
                newComponent,
                ...definition.components.slice(index + 1),
              ];
            } else {
              newComponents = [...definition.components, newComponent];
            }
          } else {
            newComponents = [...definition.components, newComponent];
          }

          return {
            definitions: s.definitions.map((def) =>
              def.id === definitionId
                ? {
                    ...def,
                    components: newComponents,
                    updatedAt: new Date().toISOString(),
                  }
                : def
            ),
          };
        });

        // Save to history
        get().saveToHistory(definitionId);
      },

      // Versioning (Phase 8)
      createVersion: (id: string, type: 'major' | 'minor' | 'patch', description?: string) => {
        const state = get();
        const definition = state.definitions.find((d) => d.id === id);
        if (!definition) return;

        // Import versioning service dynamically
        import('../services/versioningService').then(({ createVersion: createVersionFn }) => {
          const newVersion = createVersionFn(definition, type, description);

          // Save current version to history
          const history = state.versionHistory[id] || [];
          set({
            definitions: state.definitions.map((d) => (d.id === id ? newVersion : d)),
            versionHistory: {
              ...state.versionHistory,
              [id]: [...history, definition],
            },
          });
        });
      },

      getVersionHistory: (id: string) => {
        return get().versionHistory[id] || [];
      },

      rollbackToVersion: (id: string, version: string) => {
        const state = get();
        const history = state.versionHistory[id] || [];
        const targetVersion = history.find((v) => v.version === version);
        
        if (!targetVersion) {
          // Check current definition
          const current = state.definitions.find((d) => d.id === id);
          if (current && current.version === version) {
            return true; // Already at this version
          }
          return false;
        }

        // Create a new version from the rolled back version
        const rolledBack = {
          ...targetVersion,
          updatedAt: new Date().toISOString(),
        };

        set({
          definitions: state.definitions.map((d) => (d.id === id ? rolledBack : d)),
        });

        return true;
      },

      // Import/Export (Phase 8)
      importDefinition: (definition: UIDefinition) => {
        // Generate new IDs for definition and all components
        const newId = generateId();
        const componentIdMap = new Map<string, string>();
        
        const newDefinition: UIDefinition = {
          ...definition,
          id: newId,
          components: definition.components.map((comp) => {
            const newCompId = generateId();
            componentIdMap.set(comp.id, newCompId);
            return {
              ...comp,
              id: newCompId,
            };
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          definitions: [...state.definitions, newDefinition],
        }));

        return newDefinition;
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ 
        definitions: state.definitions,
        versionHistory: state.versionHistory,
        // Don't persist history and copied component
      }),
    }
  )
);

