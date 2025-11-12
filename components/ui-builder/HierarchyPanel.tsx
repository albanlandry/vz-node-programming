'use client';

/**
 * Hierarchy Panel Component
 * 
 * Displays the tree hierarchy of UI components and allows selection
 */

import React, { useMemo, useCallback, useState } from 'react';
import { ChevronRight, ChevronDown, Box, Rows, Columns, Copy, Trash2, Files, Clipboard } from 'lucide-react';
import type { UIComponent, UIDefinition } from '../../src/types/uiDefinition';

interface HierarchyPanelProps {
  definition: UIDefinition;
  selectedComponentId: string | null;
  onComponentSelect: (componentId: string | null) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (componentId: string) => void;
  onCopy?: (componentId: string) => void;
  onPaste?: (afterComponentId?: string, parentId?: string) => void;
  onDelete?: (componentId: string) => void;
  onDuplicate?: (componentId: string, parentId?: string) => void;
  hasCopiedComponent?: boolean;
  onReorder?: (componentIds: string[], parentId?: string) => void;
  onMoveToContainer?: (componentId: string, containerId: string) => void;
}

interface TreeNodeProps {
  component: UIComponent;
  allComponents: UIComponent[];
  selectedComponentId: string | null;
  onSelect: (componentId: string) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (componentId: string) => void;
  level: number;
  parentId?: string;
  onCopy?: (componentId: string) => void;
  onPaste?: (afterComponentId?: string, parentId?: string) => void;
  onDelete?: (componentId: string) => void;
  onDuplicate?: (componentId: string, parentId?: string) => void;
  hasCopiedComponent?: boolean;
  onReorder?: (componentIds: string[], parentId?: string) => void;
  onMoveToContainer?: (componentId: string, containerId: string) => void;
  dragOverComponentId?: string | null;
  dragOverParentId?: string | null;
  onDragOver?: (componentId: string | null, parentId?: string | null) => void;
  draggingComponentId?: string | null;
}

/**
 * Get icon for component type
 */
function getComponentIcon(type: UIComponent['type']) {
  switch (type) {
    case 'container':
      return Box;
    case 'row':
      return Rows;
    case 'column':
      return Columns;
    default:
      return null;
  }
}

/**
 * Get child components of a container
 */
function getChildComponents(container: UIComponent, allComponents: UIComponent[]): UIComponent[] {
  if (container.type !== 'container' && container.type !== 'row' && container.type !== 'column') {
    return [];
  }
  const containerWithChildren = container as UIComponent & { children?: string[] };
  if (!containerWithChildren.children) return [];
  
  const childMap = new Map(allComponents.map((c) => [c.id, c]));
  return containerWithChildren.children
    .map((id) => childMap.get(id))
    .filter((c): c is UIComponent => c !== undefined);
}

/**
 * Check if component is a container type
 */
function isContainer(component: UIComponent): boolean {
  return component.type === 'container' || component.type === 'row' || component.type === 'column';
}

/**
 * TreeNode component for rendering tree structure
 */
function TreeNode({
  component,
  allComponents,
  selectedComponentId,
  onSelect,
  expandedNodes,
  onToggleExpand,
  level,
  parentId,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  hasCopiedComponent,
  onReorder,
  onMoveToContainer,
  dragOverComponentId,
  dragOverParentId,
  onDragOver,
  draggingComponentId,
}: TreeNodeProps) {
  const isSelected = selectedComponentId === component.id;
  const hasChildren = isContainer(component);
  const childComponents = hasChildren ? getChildComponents(component, allComponents) : [];
  const isExpanded = expandedNodes.has(component.id);
  const Icon = getComponentIcon(component.type);
  const isDragging = draggingComponentId === component.id;
  const isDragOver = dragOverComponentId === component.id;
  const isDragOverAsParent = dragOverParentId === component.id && hasChildren;

  const handleClick = useCallback(() => {
    onSelect(component.id);
  }, [component.id, onSelect]);

  const handleToggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand(component.id);
    },
    [component.id, onToggleExpand]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onCopy) {
        onCopy(component.id);
      }
    },
    [component.id, onCopy]
  );

  const handlePaste = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onPaste) {
        onPaste(component.id, hasChildren ? component.id : parentId);
      }
    },
    [component.id, parentId, hasChildren, onPaste]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete && confirm(`Are you sure you want to delete "${component.label || component.name || component.type}"?`)) {
        onDelete(component.id);
      }
    },
    [component.id, component.label, component.name, component.type, onDelete]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDuplicate) {
        onDuplicate(component.id, parentId);
      }
    },
    [component.id, parentId, onDuplicate]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/ui-component-id', component.id);
      e.dataTransfer.setData('application/ui-component-parent', parentId || '');
      if (onDragOver) {
        onDragOver(null, null);
      }
    },
    [component.id, parentId, onDragOver]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      
      if (onDragOver) {
        // If dragging over a container, allow nesting
        if (hasChildren) {
          onDragOver(null, component.id);
        } else {
          // Otherwise, allow reordering
          onDragOver(component.id, parentId);
        }
      }
    },
    [component.id, parentId, hasChildren, onDragOver]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only clear if leaving the component itself (not a child)
      if (e.currentTarget === e.target && onDragOver) {
        onDragOver(null, null);
      }
    },
    [onDragOver]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const draggedComponentId = e.dataTransfer.getData('application/ui-component-id');
      const draggedParentId = e.dataTransfer.getData('application/ui-component-parent');
      
      if (!draggedComponentId || draggedComponentId === component.id) {
        if (onDragOver) {
          onDragOver(null, null);
        }
        return;
      }

      // Prevent dropping into itself or its descendants
      const isDescendant = (compId: string, ancestorId: string, allComps: UIComponent[]): boolean => {
        const comp = allComps.find((c) => c.id === compId);
        if (!comp || comp.id === ancestorId) return false;
        if (isContainer(comp)) {
          const containerComp = comp as UIComponent & { children?: string[] };
          if (containerComp.children?.includes(ancestorId)) return true;
          return containerComp.children?.some((childId) => isDescendant(childId, ancestorId, allComps)) || false;
        }
        return false;
      };

      if (isDescendant(component.id, draggedComponentId, allComponents)) {
        if (onDragOver) {
          onDragOver(null, null);
        }
        return;
      }

      // If dropping on a container, move into it
      if (hasChildren && onMoveToContainer) {
        onMoveToContainer(draggedComponentId, component.id);
      } else if (onReorder && parentId !== undefined) {
        // Reorder within the same parent
        const siblings = parentId
          ? getChildComponents(
              allComponents.find((c) => c.id === parentId)!,
              allComponents
            )
          : allComponents.filter((c) => {
              const allChildIds = new Set<string>();
              allComponents.forEach((comp) => {
                if (isContainer(comp)) {
                  const containerComp = comp as UIComponent & { children?: string[] };
                  containerComp.children?.forEach((id) => allChildIds.add(id));
                }
              });
              return !allChildIds.has(c.id);
            });

        const draggedIndex = siblings.findIndex((c) => c.id === draggedComponentId);
        const targetIndex = siblings.findIndex((c) => c.id === component.id);

        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
          const newOrder = [...siblings];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, removed);
          onReorder(newOrder.map((c) => c.id), parentId);
        } else if (draggedParentId !== parentId && onMoveToContainer) {
          // Moving from one parent to another
          if (parentId) {
            onMoveToContainer(draggedComponentId, parentId);
          } else {
            // Moving to root level - need to remove from parent
            const oldParent = allComponents.find((c) => c.id === draggedParentId);
            if (oldParent && isContainer(oldParent)) {
              const oldParentWithChildren = oldParent as UIComponent & { children?: string[] };
              if (oldParentWithChildren.children) {
                const newChildren = oldParentWithChildren.children.filter((id) => id !== draggedComponentId);
                // This requires updating the parent, which should be handled by onMoveToContainer
                // For now, just move to root by calling reorder with root components
                const rootComponents = allComponents.filter((c) => {
                  const allChildIds = new Set<string>();
                  allComponents.forEach((comp) => {
                    if (isContainer(comp)) {
                      const containerComp = comp as UIComponent & { children?: string[] };
                      containerComp.children?.forEach((id) => allChildIds.add(id));
                    }
                  });
                  return !allChildIds.has(c.id);
                });
                const targetRootIndex = rootComponents.findIndex((c) => c.id === component.id);
                const newRootOrder = [...rootComponents];
                const draggedRootIndex = newRootOrder.findIndex((c) => c.id === draggedComponentId);
                if (draggedRootIndex === -1) {
                  // Component is not in root, need to add it
                  if (targetRootIndex >= 0) {
                    newRootOrder.splice(targetRootIndex, 0, allComponents.find((c) => c.id === draggedComponentId)!);
                  } else {
                    newRootOrder.push(allComponents.find((c) => c.id === draggedComponentId)!);
                  }
                } else {
                  const [removed] = newRootOrder.splice(draggedRootIndex, 1);
                  newRootOrder.splice(targetRootIndex >= 0 ? targetRootIndex : newRootOrder.length, 0, removed);
                }
                onReorder(newRootOrder.map((c) => c.id));
              }
            }
          }
        }
      }

      if (onDragOver) {
        onDragOver(null, null);
      }
    },
    [component.id, parentId, hasChildren, allComponents, onReorder, onMoveToContainer, onDragOver]
  );

  return (
    <div>
      <div
        draggable={!!onReorder || !!onMoveToContainer}
        data-component-id={component.id}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          group flex items-center gap-1 px-2 py-1.5 rounded cursor-move transition-colors
          ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
          ${isDragging ? 'opacity-50' : ''}
          ${isDragOver ? 'bg-green-100 border-2 border-green-400' : ''}
          ${isDragOverAsParent ? 'bg-green-50 border-2 border-dashed border-green-400' : ''}
        `}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}
        {Icon && (
          <Icon className="w-3 h-3 flex-shrink-0 text-gray-500" />
        )}
        <span className="text-xs font-medium truncate flex-1">
          {component.label || component.name || component.type}
        </span>
        <span className="text-xs text-gray-400 uppercase flex-shrink-0">
          {component.type}
        </span>
        
        {/* Action buttons - visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCopy && (
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Copy (Ctrl+C)"
            >
              <Copy className="w-3 h-3 text-blue-600" />
            </button>
          )}
          {onPaste && hasCopiedComponent && (
            <button
              onClick={handlePaste}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Paste (Ctrl+V)"
            >
              <Clipboard className="w-3 h-3 text-green-600" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={handleDuplicate}
              className="p-1 hover:bg-purple-100 rounded transition-colors"
              title="Duplicate"
            >
              <Files className="w-3 h-3 text-purple-600" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete (Del)"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {childComponents.length > 0 ? (
            childComponents.map((child) => (
              <TreeNode
                key={child.id}
                component={child}
                allComponents={allComponents}
                selectedComponentId={selectedComponentId}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                level={level + 1}
                parentId={component.id}
                onCopy={onCopy}
                onPaste={onPaste}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                hasCopiedComponent={hasCopiedComponent}
                onReorder={onReorder}
                onMoveToContainer={onMoveToContainer}
                dragOverComponentId={dragOverComponentId}
                dragOverParentId={dragOverParentId}
                onDragOver={onDragOver}
                draggingComponentId={draggingComponentId}
              />
            ))
          ) : (
            <div
              className={`text-xs text-gray-400 italic px-2 py-1 ${
                isDragOverAsParent ? 'bg-green-50 border border-dashed border-green-400 rounded' : ''
              }`}
              style={{ paddingLeft: `${8 + (level + 1) * 16}px` }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onDragOver) {
                  onDragOver(null, component.id);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const draggedComponentId = e.dataTransfer.getData('application/ui-component-id');
                if (draggedComponentId && onMoveToContainer) {
                  onMoveToContainer(draggedComponentId, component.id);
                }
                if (onDragOver) {
                  onDragOver(null, null);
                }
              }}
            >
              (empty)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HierarchyPanel({
  definition,
  selectedComponentId,
  onComponentSelect,
  expandedNodes,
  onToggleExpand,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  hasCopiedComponent,
  onReorder,
  onMoveToContainer,
}: HierarchyPanelProps) {
  const [dragOverComponentId, setDragOverComponentId] = useState<string | null>(null);
  const [dragOverParentId, setDragOverParentId] = useState<string | null>(null);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);

  const handleDragOver = useCallback((componentId: string | null, parentId: string | null) => {
    setDragOverComponentId(componentId);
    setDragOverParentId(parentId);
  }, []);

  // Track dragging component
  React.useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const componentId = (e.target as HTMLElement)?.closest('[draggable="true"]')?.getAttribute('data-component-id');
      if (componentId) {
        setDraggingComponentId(componentId);
      }
    };

    const handleDragEnd = () => {
      setDraggingComponentId(null);
      setDragOverComponentId(null);
      setDragOverParentId(null);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Get root components (not nested in containers)
  const rootComponents = useMemo(() => {
    const allChildIds = new Set<string>();
    definition.components.forEach((comp) => {
      if (isContainer(comp)) {
        const containerComp = comp as UIComponent & { children?: string[] };
        containerComp.children?.forEach((id) => allChildIds.add(id));
      }
    });
    return definition.components.filter((comp) => !allChildIds.has(comp.id));
  }, [definition.components]);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {rootComponents.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 text-center">
            No components in this UI definition
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {rootComponents.map((component) => (
            <TreeNode
              key={component.id}
              component={component}
              allComponents={definition.components}
              selectedComponentId={selectedComponentId}
              onSelect={onComponentSelect}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              level={0}
              onCopy={onCopy}
              onPaste={onPaste}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              hasCopiedComponent={hasCopiedComponent}
              onReorder={onReorder}
              onMoveToContainer={onMoveToContainer}
              dragOverComponentId={dragOverComponentId}
              dragOverParentId={dragOverParentId}
              onDragOver={handleDragOver}
              draggingComponentId={draggingComponentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

