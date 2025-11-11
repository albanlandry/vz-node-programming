'use client';

/**
 * Design Canvas
 * 
 * The main canvas where UI components are placed and arranged
 * Phase 4: Enhanced with resize, grid, undo/redo, copy/paste, containers
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Trash2, GripVertical, Copy, Maximize2, Grid3x3 } from 'lucide-react';
import type { UIComponent, UIDefinition } from '../../src/types/uiDefinition';

interface CanvasProps {
  definition: UIDefinition;
  selectedComponentId: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentAdd: (component: UIComponent) => void;
  onComponentReorder: (componentIds: string[]) => void;
  onComponentUpdate?: (componentId: string, updates: Partial<UIComponent>) => void;
  onComponentCopy?: (componentId: string) => void;
  onComponentPaste?: (afterComponentId?: string) => void;
  gridEnabled?: boolean;
  gridSize?: number;
}

export default function Canvas({
  definition,
  selectedComponentId,
  onComponentSelect,
  onComponentDelete,
  onComponentAdd,
  onComponentReorder,
  onComponentUpdate,
  onComponentCopy,
  onComponentPaste,
  gridEnabled = false,
  gridSize = 8,
}: CanvasProps) {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [draggedComponentIndex, setDraggedComponentIndex] = useState<number | null>(null);
  const [resizingComponentId, setResizingComponentId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Keyboard shortcuts (Phase 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedComponentId) {
        e.preventDefault();
        if (onComponentCopy) {
          onComponentCopy(selectedComponentId);
        }
      }
      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (onComponentPaste) {
          onComponentPaste(selectedComponentId || undefined);
        }
      }
      // Delete (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        e.preventDefault();
        onComponentDelete(selectedComponentId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, onComponentCopy, onComponentPaste, onComponentDelete]);

  /**
   * Snap to grid
   */
  const snapToGrid = useCallback((value: number): number => {
    if (!gridEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [gridEnabled, gridSize]);

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
   * Handle resize start
   */
  const handleResizeStart = useCallback((e: React.MouseEvent, component: UIComponent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingComponentId(component.id);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: typeof component.width === 'number' ? component.width : 0,
      height: typeof component.height === 'number' ? component.height : 0,
    });
  }, []);

  /**
   * Handle resize
   */
  useEffect(() => {
    if (!resizingComponentId || !resizeStart || !onComponentUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const newWidth = snapToGrid(resizeStart.width + deltaX);
      const newHeight = snapToGrid(resizeStart.height + (e.clientY - resizeStart.y));

      onComponentUpdate(resizingComponentId, {
        width: Math.max(50, newWidth),
        height: newHeight > 0 ? Math.max(20, newHeight) : undefined,
      });
    };

    const handleMouseUp = () => {
      setResizingComponentId(null);
      setResizeStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingComponentId, resizeStart, onComponentUpdate, snapToGrid]);

  /**
   * Render a component preview
   */
  const renderComponentPreview = (component: UIComponent, index: number) => {
    const isSelected = selectedComponentId === component.id;
    const isDraggedOver = draggedOverIndex === index;
    const isResizing = resizingComponentId === component.id;

    // Check if component is a container
    const isContainer = component.type === 'container' || component.type === 'row' || component.type === 'column';
    const containerComponent = isContainer ? component as UIComponent & { children?: string[] } : null;
    const childComponents = containerComponent?.children
      ? definition.components.filter((c) => containerComponent.children!.includes(c.id))
      : [];

    return (
      <div
        key={component.id}
        draggable={!isContainer}
        onDragStart={(e) => !isContainer && handleComponentDragStart(e, index)}
        onDragOver={(e) => {
          e.preventDefault();
          setDraggedOverIndex(index);
        }}
        onDragLeave={() => setDraggedOverIndex(null)}
        onDrop={(e) => handleComponentDrop(e, index)}
        onClick={(e) => {
          e.stopPropagation();
          onComponentSelect(component.id);
        }}
        className={`
          relative group p-3 border-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${isDraggedOver ? 'border-green-400 bg-green-50' : ''}
          ${isResizing ? 'border-purple-500' : ''}
        `}
        style={{
          width: component.width ? (typeof component.width === 'number' ? `${component.width}px` : component.width) : undefined,
          height: component.height ? (typeof component.height === 'number' ? `${component.height}px` : component.height) : undefined,
          margin: component.margin,
          padding: component.padding,
          alignSelf: component.alignSelf,
          backgroundColor: isContainer ? (component as any).backgroundColor : undefined,
          border: isContainer ? (component as any).border : undefined,
          borderRadius: isContainer ? (component as any).borderRadius : undefined,
        }}
      >
        {/* Drag handle */}
        {!isContainer && (
          <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Component preview */}
        <div className={isContainer ? '' : 'ml-6'}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{component.type}</span>
              {component.required && (
                <span className="text-xs text-red-500">*</span>
              )}
              {isContainer && (
                <span className="text-xs text-gray-400">
                  ({containerComponent?.children?.length || 0} children)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onComponentCopy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComponentCopy(component.id);
                  }}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3 h-3 text-blue-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComponentDelete(component.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete (Del)"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>

          {/* Container children preview */}
          {isContainer && childComponents.length > 0 && (
            <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-300">
              {childComponents.map((child) => (
                <div key={child.id} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {child.type}: {child.label || child.name}
                </div>
              ))}
            </div>
          )}

          {/* Component content preview */}
          {!isContainer && (
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
          )}

          {/* Empty container message */}
          {isContainer && childComponents.length === 0 && (
            <div className="text-xs text-gray-400 italic mt-2">
              Drop components here
            </div>
          )}
        </div>

        {/* Resize handle (Phase 4) */}
        {isSelected && onComponentUpdate && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nwse-resize opacity-75 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeStart(e, component);
            }}
            style={{
              clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
            }}
          />
        )}
      </div>
    );
  };

  const layout = definition.layout || { direction: 'column', gap: 16, padding: 16 };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative">
      {/* Canvas Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Canvas</h2>
            <p className="text-xs text-gray-500 mt-1">
              {definition.components.length} component{definition.components.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Toggle grid (would need to be passed as prop or managed in parent)
              }}
              className={`p-2 rounded transition-colors ${
                gridEnabled ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid background (Phase 4) */}
      {gridEnabled && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
      )}

      {/* Canvas Content */}
      <div
        className="flex-1 overflow-y-auto p-4 relative"
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
              padding: typeof layout.padding === 'number' ? `${layout.padding}px` : layout.padding || '16px',
              alignItems: layout.alignItems,
              justifyContent: layout.justifyContent,
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
    case 'container':
      return {
        id: baseId,
        type: 'container',
        name: `container_${index}`,
        label: `Container ${index + 1}`,
        children: [],
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      };
    case 'row':
      return {
        id: baseId,
        type: 'row',
        name: `row_${index}`,
        label: `Row ${index + 1}`,
        children: [],
        gap: 8,
        alignItems: 'start',
        justifyContent: 'start',
        padding: '8px',
      };
    case 'column':
      return {
        id: baseId,
        type: 'column',
        name: `column_${index}`,
        label: `Column ${index + 1}`,
        children: [],
        gap: 8,
        alignItems: 'stretch',
        padding: '8px',
      };
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}
