'use client';

/**
 * Design Canvas
 * 
 * The main canvas where UI components are placed and arranged
 * Enhanced with mouse-based drag-and-drop reordering and nested layout support
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Trash2, GripVertical, Copy, Grid3x3 } from 'lucide-react';
import type { UIComponent, UIDefinition } from '../../src/types/uiDefinition';

interface CanvasProps {
  definition: UIDefinition;
  selectedComponentId: string | null;
  onComponentSelect: (componentId: string | null) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentAdd: (component: UIComponent, parentId?: string) => void;
  onComponentReorder: (componentIds: string[], parentId?: string) => void;
  onComponentUpdate?: (componentId: string, updates: Partial<UIComponent>) => void;
  onComponentCopy?: (componentId: string) => void;
  onComponentPaste?: (afterComponentId?: string) => void;
  onMoveToContainer?: (componentId: string, containerId: string) => void;
  gridEnabled?: boolean;
  gridSize?: number;
}

interface DragState {
  componentId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  element: HTMLElement | null;
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
  onMoveToContainer,
  gridEnabled = false,
  gridSize = 8,
}: CanvasProps) {
  const [draggingState, setDraggingState] = useState<DragState | null>(null);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [resizingComponentId, setResizingComponentId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedComponentId) {
        e.preventDefault();
        if (onComponentCopy) {
          onComponentCopy(selectedComponentId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (onComponentPaste) {
          onComponentPaste(selectedComponentId || undefined);
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        e.preventDefault();
        onComponentDelete(selectedComponentId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, onComponentCopy, onComponentPaste, onComponentDelete]);

  // Mouse-based drag handling
  useEffect(() => {
    if (!draggingState) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDraggingState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
        };
      });

      // Update drag preview position
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.left = `${e.clientX - draggingState.offsetX}px`;
        dragPreviewRef.current.style.top = `${e.clientY - draggingState.offsetY}px`;
      }

      // Find element under cursor
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (elementUnder) {
        const containerElement = elementUnder.closest('[data-container-id]');
        const componentElement = elementUnder.closest('[data-component-id]');
        
        if (containerElement) {
          const containerId = containerElement.getAttribute('data-container-id');
          setDragOverContainerId(containerId);
        } else {
          setDragOverContainerId(null);
        }

        if (componentElement && componentElement !== draggingState.element) {
          const componentId = componentElement.getAttribute('data-component-id');
          const index = parseInt(componentElement.getAttribute('data-index') || '0');
          setDragOverIndex(index);
        }
      }
    };

    const handleMouseUp = () => {
      if (draggingState && dragOverContainerId && onMoveToContainer) {
        // Move component to container
        onMoveToContainer(draggingState.componentId, dragOverContainerId);
      } else if (draggingState && dragOverIndex !== null) {
        // Reorder components
        const rootComponents = getRootComponents(definition.components);
        const dragIndex = rootComponents.findIndex((c) => c.id === draggingState.componentId);
        
        if (dragIndex !== -1 && dragIndex !== dragOverIndex) {
          const newOrder = [...rootComponents];
          const [removed] = newOrder.splice(dragIndex, 1);
          newOrder.splice(dragOverIndex, 0, removed);
          onComponentReorder(newOrder.map((c) => c.id));
        }
      }

      setDraggingState(null);
      setDragOverContainerId(null);
      setDragOverIndex(null);
      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.display = 'none';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, dragOverContainerId, dragOverIndex, definition, onComponentReorder, onMoveToContainer]);

  /**
   * Get root-level components (not nested in containers)
   */
  const getRootComponents = useCallback((components: UIComponent[]): UIComponent[] => {
    const allChildIds = new Set<string>();
    components.forEach((comp) => {
      if (comp.type === 'container' || comp.type === 'row' || comp.type === 'column') {
        const containerComp = comp as UIComponent & { children?: string[] };
        containerComp.children?.forEach((id) => allChildIds.add(id));
      }
    });
    return components.filter((comp) => !allChildIds.has(comp.id));
  }, []);

  /**
   * Get child components of a container
   */
  const getChildComponents = useCallback((container: UIComponent, allComponents: UIComponent[]): UIComponent[] => {
    if (container.type !== 'container' && container.type !== 'row' && container.type !== 'column') {
      return [];
    }
    const containerWithChildren = container as UIComponent & { children?: string[] };
    if (!containerWithChildren.children) return [];
    
    const childMap = new Map(allComponents.map((c) => [c.id, c]));
    return containerWithChildren.children
      .map((id) => childMap.get(id))
      .filter((c): c is UIComponent => c !== undefined);
  }, []);

  /**
   * Handle mouse down on drag handle
   */
  const handleDragStart = useCallback((e: React.MouseEvent, component: UIComponent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingState({
      componentId: component.id,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX,
      offsetY,
      element: e.currentTarget as HTMLElement,
    });

    if (dragPreviewRef.current) {
      dragPreviewRef.current.style.display = 'block';
      dragPreviewRef.current.style.left = `${e.clientX - offsetX}px`;
      dragPreviewRef.current.style.top = `${e.clientY - offsetY}px`;
    }
  }, []);

  /**
   * Handle drop from palette
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, parentId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverContainerId(null);

      const data = e.dataTransfer.getData('application/ui-component');
      if (!data) return;

      try {
        const { type } = JSON.parse(data);
        if (!type) return;

        const newComponent = createComponentFromType(type, definition.components.length);
        onComponentAdd(newComponent, parentId);
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
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

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
      const newWidth = gridEnabled ? Math.round((resizeStart.width + deltaX) / gridSize) * gridSize : resizeStart.width + deltaX;
      const newHeight = gridEnabled ? Math.round((resizeStart.height + (e.clientY - resizeStart.y)) / gridSize) * gridSize : resizeStart.height + (e.clientY - resizeStart.y);

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
  }, [resizingComponentId, resizeStart, onComponentUpdate, gridEnabled, gridSize]);

  /**
   * Render a component (recursive for nested components)
   */
  const renderComponent = useCallback((component: UIComponent, index: number, parentId?: string) => {
    const isSelected = selectedComponentId === component.id;
    const isDragging = draggingState?.componentId === component.id;
    const isResizing = resizingComponentId === component.id;
    const isContainer = component.type === 'container' || component.type === 'row' || component.type === 'column' || component.type === 'clickable-container';
    const isClickableContainer = component.type === 'clickable-container';
    const containerComponent = isContainer ? component as UIComponent & { children?: string[] } : null;
    const childComponents = isContainer ? getChildComponents(component, definition.components) : [];
    const isDragOverContainer = dragOverContainerId === component.id;
    const isDragOverIndex = dragOverIndex === index && !parentId;

    return (
      <div
        key={component.id}
        data-component-id={component.id}
        data-index={index}
        data-container-id={isContainer ? component.id : undefined}
        onClick={(e) => {
          e.stopPropagation();
          // For clickable containers, handle click event if configured
          if (isClickableContainer && (component as any).onClick) {
            console.log('Clickable container clicked:', (component as any).onClick);
            // Fire custom event or action
            // This can be extended to trigger actual events
          }
          onComponentSelect(component.id);
        }}
        className={`
          relative group p-3 border-2 rounded-lg cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
          ${isDragging ? 'opacity-50' : ''}
          ${isDragOverContainer ? 'border-green-400 bg-green-50 ring-2 ring-green-300' : ''}
          ${isDragOverIndex ? 'border-purple-400 bg-purple-50' : ''}
          ${isResizing ? 'border-purple-500' : ''}
        `}
        style={{
          width: component.width ? (typeof component.width === 'number' ? `${component.width}px` : component.width) : (parentId ? '100%' : undefined),
          height: component.height ? (typeof component.height === 'number' ? `${component.height}px` : component.height) : undefined,
          margin: component.margin,
          padding: component.padding,
          alignSelf: component.alignSelf,
          backgroundColor: isContainer ? (component as any).backgroundColor : undefined,
          border: isContainer ? (component as any).border : undefined,
          borderRadius: isContainer ? (component as any).borderRadius : undefined,
          display: isContainer ? (component.type === 'row' || component.type === 'column' || component.type === 'clickable-container' ? 'flex' : 'block') : undefined,
          flexDirection: component.type === 'row' ? 'row' : component.type === 'column' ? 'column' : (isClickableContainer ? ((component as any).flexDirection || 'row') : undefined),
          gap: containerComponent && (component.type === 'row' || component.type === 'column' || component.type === 'clickable-container') ? `${(component as any).gap || 8}px` : undefined,
          padding: containerComponent ? (component as any).padding || '8px' : undefined,
          alignItems: isContainer && (component.type === 'row' || component.type === 'column' || component.type === 'clickable-container') ? ((component as any).alignItems || (component.type === 'row' ? 'baseline' : 'stretch')) : undefined,
          justifyContent: isContainer && (component.type === 'row' || component.type === 'clickable-container') ? ((component as any).justifyContent || 'start') : undefined,
          alignContent: isContainer && (component.type === 'row' || component.type === 'column' || component.type === 'clickable-container') ? 'stretch' : undefined,
          cursor: isClickableContainer ? ((component as any).cursor || 'pointer') : undefined,
          flex: parentId && !component.width ? (component.type === 'row' ? '1 1 0' : '1 1 auto') : undefined,
          minWidth: parentId && component.type === 'row' ? 0 : undefined,
        }}
        onDrop={(e) => handleDrop(e, isContainer ? component.id : undefined)}
        onDragOver={handleDragOver}
      >
        {/* Drag handle - Allow dragging for all components including layout components */}
        <div
          className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10"
          onMouseDown={(e) => handleDragStart(e, component)}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Component header */}
        <div className={isContainer ? '' : 'ml-6'}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase">{component.type}</span>
              {component.required && <span className="text-xs text-red-500">*</span>}
              {isContainer && (
                <span className="text-xs text-gray-400">({childComponents.length} children)</span>
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

          {/* Container children */}
          {isContainer && (
            <div
              className={`min-h-[60px] ${
                childComponents.length === 0 ? 'border-2 border-dashed border-gray-300 rounded p-4' : ''
              }`}
              style={{
                display: 'flex',
                flexDirection: component.type === 'row' ? 'row' : component.type === 'clickable-container' ? ((component as any).flexDirection || 'row') : 'column',
                gap: `${(component as any).gap || 8}px`,
                alignItems: (component as any).alignItems || (component.type === 'row' ? 'baseline' : 'stretch'),
                justifyContent: (component as any).justifyContent || (component.type === 'row' || component.type === 'clickable-container' ? 'start' : undefined),
                alignContent: 'stretch',
                minHeight: '100%',
                width: '100%',
                flex: '1 1 auto',
              }}
            >
              {childComponents.map((child, childIndex) => renderComponent(child, childIndex, component.id))}
              {childComponents.length === 0 && (
                <div className="text-xs text-gray-400 italic text-center w-full">
                  Drop components here
                </div>
              )}
            </div>
          )}

          {/* Component content preview */}
          {!isContainer && (
            <div className="text-sm text-gray-700">
              {component.label && <div className="font-medium mb-1">{component.label}</div>}
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
              {component.type === 'image' && (
                <div className="w-full">
                  {component.label && <div className="font-medium mb-1">{component.label}</div>}
                  <div className="border border-gray-300 rounded overflow-hidden bg-gray-100 flex items-center justify-center" style={{
                    width: (component as any).width ? (typeof (component as any).width === 'number' ? `${(component as any).width}px` : (component as any).width) : '300px',
                    height: (component as any).height ? (typeof (component as any).height === 'number' ? `${(component as any).height}px` : (component as any).height) : '200px',
                  }}>
                    <img
                      src={(component as any).src || 'https://via.placeholder.com/300x200'}
                      alt={(component as any).alt || 'Image'}
                      className="max-w-full max-h-full"
                      style={{
                        objectFit: (component as any).objectFit || 'contain',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        {isSelected && onComponentUpdate && !isContainer && (
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
  }, [
    selectedComponentId,
    draggingState,
    dragOverContainerId,
    dragOverIndex,
    resizingComponentId,
    definition.components,
    getChildComponents,
    onComponentSelect,
    onComponentDelete,
    onComponentCopy,
    onComponentUpdate,
    handleDragStart,
    handleDrop,
    handleDragOver,
    handleResizeStart,
  ]);

  const layout = definition.layout || { direction: 'column', gap: 16, padding: 16 };
  const rootComponents = getRootComponents(definition.components);

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

      {/* Grid background */}
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

      {/* Drag preview */}
      {draggingState && (
        <div
          ref={dragPreviewRef}
          className="fixed pointer-events-none z-50 opacity-75"
          style={{ display: 'none' }}
        >
          <div className="px-3 py-2 bg-blue-500 text-white rounded shadow-lg text-sm">
            Dragging component
          </div>
        </div>
      )}

      {/* Canvas Content */}
      <div
        className="flex-1 overflow-y-auto p-4 relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onComponentSelect(null);
          }
        }}
        style={{ minHeight: '400px' }}
      >
        {rootComponents.length === 0 ? (
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
            {rootComponents.map((component, index) => renderComponent(component, index))}
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
    case 'image':
      return {
        id: baseId,
        type: 'image',
        name: `image_${index}`,
        label: `Image ${index + 1}`,
        src: 'https://via.placeholder.com/300x200',
        alt: 'Image',
        width: 300,
        height: 200,
        objectFit: 'contain',
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
    case 'clickable-container':
      return {
        id: baseId,
        type: 'clickable-container',
        name: `clickable_container_${index}`,
        label: `Clickable Container ${index + 1}`,
        children: [],
        onClick: '',
        gap: 8,
        flexDirection: 'row',
        alignItems: 'start',
        justifyContent: 'start',
        backgroundColor: '#f3f4f6',
        padding: '8px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        cursor: 'pointer',
      };
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}
