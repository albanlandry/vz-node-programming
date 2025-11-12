'use client';

/**
 * Hierarchy Panel Component
 * 
 * Displays the tree hierarchy of UI components and allows selection
 */

import React, { useMemo, useCallback } from 'react';
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
}: TreeNodeProps) {
  const isSelected = selectedComponentId === component.id;
  const hasChildren = isContainer(component);
  const childComponents = hasChildren ? getChildComponents(component, allComponents) : [];
  const isExpanded = expandedNodes.has(component.id);
  const Icon = getComponentIcon(component.type);

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

  return (
    <div>
      <div
        className={`
          group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
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
              />
            ))
          ) : (
            <div
              className="text-xs text-gray-400 italic px-2 py-1"
              style={{ paddingLeft: `${8 + (level + 1) * 16}px` }}
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
}: HierarchyPanelProps) {
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

