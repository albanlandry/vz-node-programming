'use client';

/**
 * Design Canvas
 * 
 * The main canvas where UI components are placed and arranged
 * Phase 2: Basic drag and drop, component selection, deletion
 */

import React, { useState, useCallback } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import type { UIComponent, UIDefinition } from '../../src/types/uiDefinition';

interface CanvasProps {
  definition: UIDefinition;
  selectedComponentId: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentAdd: (component: UIComponent) => void;
  onComponentReorder: (componentIds: string[]) => void;
}

export default function Canvas({
  definition,
  selectedComponentId,
  onComponentSelect,
  onComponentDelete,
  onComponentAdd,
  onComponentReorder,
}: CanvasProps) {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [draggedComponentIndex, setDraggedComponentIndex] = useState<number | null>(null);

  /**
   * Handle drop from palette
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedOverIndex(null);

      const data = e.dataTransfer.getData('application/ui-component');
      if (!data) return;

      try {
        const { type } = JSON.parse(data);
        if (!type) return;

        // Create new component based on type
        const newComponent = createComponentFromType(type, definition.components.length);
        onComponentAdd(newComponent);
      } catch (error) {
        console.error('Failed to parse dropped component:', error);
      }
    },
    [definition.components.length, onComponentAdd]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle component drag start (for reordering)
   */
  const handleComponentDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedComponentIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/ui-component-reorder', index.toString());
  }, []);

  /**
   * Handle component drop (for reordering)
   */
  const handleComponentDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      const dragIndex = draggedComponentIndex;
      if (dragIndex === null || dragIndex === dropIndex) {
        setDraggedComponentIndex(null);
        return;
      }

      const newOrder = [...definition.components];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);

      onComponentReorder(newOrder.map((comp) => comp.id));
      setDraggedComponentIndex(null);
    },
    [definition.components, draggedComponentIndex, onComponentReorder]
  );

  /**
   * Render a component preview
   */
  const renderComponentPreview = (component: UIComponent, index: number) => {
    const isSelected = selectedComponentId === component.id;
    const isDraggedOver = draggedOverIndex === index;

    return (
      <div
        key={component.id}
        draggable
        onDragStart={(e) => handleComponentDragStart(e, index)}
        onDragOver={(e) => {
          e.preventDefault();
          setDraggedOverIndex(index);
        }}
        onDragLeave={() => setDraggedOverIndex(null)}
        onDrop={(e) => handleComponentDrop(e, index)}
        onClick={() => onComponentSelect(component.id)}
        className={`
          relative group p-3 border-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${isDraggedOver ? 'border-green-400 bg-green-50' : ''}
        `}
      >
        {/* Drag handle */}
        <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Component preview */}
        <div className="ml-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{component.type}</span>
              {component.required && (
                <span className="text-xs text-red-500">*</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComponentDelete(component.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
              title="Delete component"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>

          {/* Component content preview */}
          <div className="text-sm text-gray-700">
            {component.label && (
              <div className="font-medium mb-1">{component.label}</div>
            )}
            {component.type === 'input' && (
              <div className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-500 text-xs">
                {component.placeholder || 'Enter text...'}
              </div>
            )}
            {component.type === 'textarea' && (
              <div className="px-2 py-2 bg-gray-100 rounded border border-gray-300 text-gray-500 text-xs min-h-[60px]">
                {component.placeholder || 'Enter text...'}
              </div>
            )}
            {component.type === 'button' && (
              <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs">
                {(component as UIComponent & { text?: string }).text || 'Button'}
              </div>
            )}
            {component.type === 'label' && (
              <div className="text-gray-700">
                {(component as UIComponent & { text?: string }).text || 'Label'}
              </div>
            )}
            {component.type === 'select' && (
              <div className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-500 text-xs">
                Select an option...
              </div>
            )}
            {component.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded"></div>
                <span>{component.label || 'Checkbox'}</span>
              </div>
            )}
            {component.type === 'radio' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                <span>{component.label || 'Radio'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const layout = definition.layout || { direction: 'column', gap: 16, padding: 16 };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Canvas</h2>
        <p className="text-xs text-gray-500 mt-1">
          {definition.components.length} component{definition.components.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={(e) => {
          // Deselect if clicking on empty space
          if (e.target === e.currentTarget) {
            onComponentSelect(null);
          }
        }}
        style={{
          minHeight: '400px',
        }}
      >
        {definition.components.length === 0 ? (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Drag components here to build your UI</p>
              <p className="text-xs text-gray-400">Start by dragging a component from the palette</p>
            </div>
          </div>
        ) : (
          <div
            className="space-y-3"
            style={{
              display: 'flex',
              flexDirection: layout.direction || 'column',
              gap: `${layout.gap || 16}px`,
              padding: `${layout.padding || 16}px`,
            }}
          >
            {definition.components.map((component, index) => renderComponentPreview(component, index))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new component from type
 */
function createComponentFromType(type: UIComponent['type'], index: number): UIComponent {
  const baseId = generateId();

  switch (type) {
    case 'input':
      return {
        id: baseId,
        type: 'input',
        name: `input_${index}`,
        label: `Input ${index + 1}`,
        inputType: 'text',
        placeholder: 'Enter text...',
        required: false,
      };
    case 'textarea':
      return {
        id: baseId,
        type: 'textarea',
        name: `textarea_${index}`,
        label: `Textarea ${index + 1}`,
        rows: 4,
        placeholder: 'Enter text...',
        required: false,
      };
    case 'button':
      return {
        id: baseId,
        type: 'button',
        name: `button_${index}`,
        text: 'Button',
        buttonType: 'button',
      };
    case 'label':
      return {
        id: baseId,
        type: 'label',
        name: `label_${index}`,
        text: 'Label',
      };
    case 'select':
      return {
        id: baseId,
        type: 'select',
        name: `select_${index}`,
        label: `Select ${index + 1}`,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
        required: false,
      };
    case 'checkbox':
      return {
        id: baseId,
        type: 'checkbox',
        name: `checkbox_${index}`,
        label: `Checkbox ${index + 1}`,
        checked: false,
        required: false,
      };
    case 'radio':
      return {
        id: baseId,
        type: 'radio',
        name: `radio_${index}`,
        label: `Radio ${index + 1}`,
        value: `value_${index}`,
        groupName: `radio_group_${index}`,
        checked: false,
        required: false,
      };
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}

