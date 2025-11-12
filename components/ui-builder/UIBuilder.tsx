'use client';

/**
 * UI Builder Component
 * 
 * Main WYSIWYG UI Builder interface
 * Phase 4: Enhanced with undo/redo, copy/paste, grid, resize, containers
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Undo2, Redo2, Grid3x3, Palette, Monitor } from 'lucide-react';
import ComponentPalette from './ComponentPalette';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import StylePanel from './StylePanel';
import ResponsivePreview from './ResponsivePreview';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import type { UIDefinition, UIComponent, ComponentStyle } from '../../src/types/uiDefinition';

interface UIBuilderProps {
  definitionId: string;
}

export default function UIBuilder({ definitionId }: UIBuilderProps) {
  const {
    getDefinition,
    addComponent,
    updateComponent,
    deleteComponent,
    reorderComponents,
    moveComponentToContainer,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    copyComponent,
    pasteComponent,
    updateDefinition,
  } = useUIBuilderStore();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showResponsivePreview, setShowResponsivePreview] = useState(false);

  const definition = getDefinition(definitionId);

  // Save to history when definition changes (debounced)
  useEffect(() => {
    if (!definition) return;
    const timeoutId = setTimeout(() => {
      saveToHistory(definitionId);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [definition, definitionId, saveToHistory]);

  if (!definition) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">UI Definition not found</p>
      </div>
    );
  }

  const selectedComponent = definition.components.find((comp) => comp.id === selectedComponentId) || null;

  const handleComponentAdd = useCallback(
    (component: UIComponent, parentId?: string) => {
      addComponent(definitionId, component, parentId);
      setSelectedComponentId(component.id);
      saveToHistory(definitionId);
    },
    [definitionId, addComponent, saveToHistory]
  );

  const handleComponentUpdate = useCallback(
    (componentId: string, updates: Partial<UIComponent>) => {
      updateComponent(definitionId, componentId, updates);
      saveToHistory(definitionId);
    },
    [definitionId, updateComponent, saveToHistory]
  );

  const handlePropertyUpdate = useCallback(
    (updates: Partial<UIComponent>) => {
      if (selectedComponentId) {
        updateComponent(definitionId, selectedComponentId, updates);
        saveToHistory(definitionId);
      }
    },
    [definitionId, selectedComponentId, updateComponent, saveToHistory]
  );

  const handleComponentDelete = useCallback(
    (componentId: string) => {
      deleteComponent(definitionId, componentId);
      if (selectedComponentId === componentId) {
        setSelectedComponentId(null);
      }
      saveToHistory(definitionId);
    },
    [definitionId, selectedComponentId, deleteComponent, saveToHistory]
  );

  const handleComponentReorder = useCallback(
    (componentIds: string[], parentId?: string) => {
      reorderComponents(definitionId, componentIds, parentId);
      saveToHistory(definitionId);
    },
    [definitionId, reorderComponents, saveToHistory]
  );

  const handleMoveToContainer = useCallback(
    (componentId: string, containerId: string) => {
      moveComponentToContainer(definitionId, componentId, containerId);
      saveToHistory(definitionId);
    },
    [definitionId, moveComponentToContainer, saveToHistory]
  );

  const handleUndo = useCallback(() => {
    if (undo(definitionId)) {
      setSelectedComponentId(null);
    }
  }, [definitionId, undo]);

  const handleRedo = useCallback(() => {
    if (redo(definitionId)) {
      setSelectedComponentId(null);
    }
  }, [definitionId, redo]);

  const handleCopy = useCallback(
    (componentId: string) => {
      copyComponent(definitionId, componentId);
    },
    [definitionId, copyComponent]
  );

  const handlePaste = useCallback(
    (afterComponentId?: string) => {
      pasteComponent(definitionId, afterComponentId);
      saveToHistory(definitionId);
    },
    [definitionId, pasteComponent, saveToHistory]
  );

  return (
    <div className="flex h-full bg-gray-100">
      {/* Component Palette */}
      <ComponentPalette />

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar (Phase 4) */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo(definitionId)}
              className={`p-2 rounded transition-colors ${
                canUndo(definitionId)
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo(definitionId)}
              className={`p-2 rounded transition-colors ${
                canRedo(definitionId)
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => setGridEnabled(!gridEnabled)}
              className={`p-2 rounded transition-colors ${
                gridEnabled
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => setShowStylePanel(!showStylePanel)}
              className={`p-2 rounded transition-colors ${
                showStylePanel
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle Style Panel"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowResponsivePreview(true)}
              className="p-2 rounded transition-colors text-gray-700 hover:bg-gray-100"
              title="Responsive Preview"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Canvas
          definition={definition}
          selectedComponentId={selectedComponentId}
          onComponentSelect={setSelectedComponentId}
          onComponentDelete={handleComponentDelete}
          onComponentAdd={handleComponentAdd}
          onComponentReorder={handleComponentReorder}
          onComponentUpdate={handleComponentUpdate}
          onComponentCopy={handleCopy}
          onComponentPaste={handlePaste}
          onMoveToContainer={handleMoveToContainer}
          gridEnabled={gridEnabled}
          gridSize={8}
        />
      </div>

      {/* Property Panel */}
      <PropertyPanel 
        component={selectedComponent} 
        onUpdate={handlePropertyUpdate}
        definition={definition}
        selectedComponentId={selectedComponentId}
        onComponentSelect={setSelectedComponentId}
      />
      
      {/* Style Panel (Phase 7) */}
      {showStylePanel && (
        <StylePanel
          component={selectedComponent}
          definitionTheme={definition.theme}
          globalStyles={definition.globalStyles}
          onComponentStyleUpdate={handleComponentStyleUpdate}
          onThemeChange={handleThemeChange}
          onGlobalStylesChange={handleGlobalStylesChange}
        />
      )}

      {/* Responsive Preview (Phase 7) */}
      {showResponsivePreview && (
        <ResponsivePreview
          definition={definition}
          onClose={() => setShowResponsivePreview(false)}
        />
      )}
    </div>
  );
}

