'use client';

/**
 * UI Builder Component
 * 
 * Main WYSIWYG UI Builder interface
 * Phase 2: Visual editor with drag and drop, component palette, and property panel
 */

import React, { useState, useCallback } from 'react';
import ComponentPalette from './ComponentPalette';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import type { UIDefinition, UIComponent } from '../../src/types/uiDefinition';

interface UIBuilderProps {
  definitionId: string;
}

export default function UIBuilder({ definitionId }: UIBuilderProps) {
  const { getDefinition, addComponent, updateComponent, deleteComponent, reorderComponents } =
    useUIBuilderStore();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const definition = getDefinition(definitionId);

  if (!definition) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">UI Definition not found</p>
      </div>
    );
  }

  const selectedComponent = definition.components.find((comp) => comp.id === selectedComponentId) || null;

  const handleComponentAdd = useCallback(
    (component: UIComponent) => {
      addComponent(definitionId, component);
      setSelectedComponentId(component.id);
    },
    [definitionId, addComponent]
  );

  const handleComponentUpdate = useCallback(
    (updates: Partial<UIComponent>) => {
      if (selectedComponentId) {
        updateComponent(definitionId, selectedComponentId, updates);
      }
    },
    [definitionId, selectedComponentId, updateComponent]
  );

  const handleComponentDelete = useCallback(
    (componentId: string) => {
      deleteComponent(definitionId, componentId);
      if (selectedComponentId === componentId) {
        setSelectedComponentId(null);
      }
    },
    [definitionId, selectedComponentId, deleteComponent]
  );

  const handleComponentReorder = useCallback(
    (componentIds: string[]) => {
      reorderComponents(definitionId, componentIds);
    },
    [definitionId, reorderComponents]
  );

  return (
    <div className="flex h-full bg-gray-100">
      {/* Component Palette */}
      <ComponentPalette />

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Canvas
          definition={definition}
          selectedComponentId={selectedComponentId}
          onComponentSelect={setSelectedComponentId}
          onComponentDelete={handleComponentDelete}
          onComponentAdd={handleComponentAdd}
          onComponentReorder={handleComponentReorder}
        />
      </div>

      {/* Property Panel */}
      <PropertyPanel component={selectedComponent} onUpdate={handleComponentUpdate} />
    </div>
  );
}

