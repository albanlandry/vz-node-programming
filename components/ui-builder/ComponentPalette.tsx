'use client';

/**
 * Component Palette
 * 
 * Displays available UI components that can be dragged onto the canvas
 * Phase 2: Basic component palette with drag support
 */

import React from 'react';
import { 
  Type, 
  Square, 
  FileText, 
  MousePointerClick, 
  Tag, 
  ChevronDown,
  List,
  CheckSquare,
  Circle,
  Box,
  Rows,
  Columns
} from 'lucide-react';
import type { UIComponentType } from '../../src/types/uiDefinition';

interface ComponentItem {
  type: UIComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const COMPONENTS: ComponentItem[] = [
  {
    type: 'input',
    label: 'Text Input',
    icon: Type,
    description: 'Single-line text input field',
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: FileText,
    description: 'Multi-line text input field',
  },
  {
    type: 'button',
    label: 'Button',
    icon: MousePointerClick,
    description: 'Clickable button',
  },
  {
    type: 'label',
    label: 'Label',
    icon: Tag,
    description: 'Text label',
  },
  {
    type: 'select',
    label: 'Select',
    icon: List,
    description: 'Dropdown selection',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Checkbox input',
  },
  {
    type: 'radio',
    label: 'Radio',
    icon: Circle,
    description: 'Radio button',
  },
  // Layout components (Phase 4)
  {
    type: 'container',
    label: 'Container',
    icon: Box,
    description: 'Generic container for grouping',
  },
  {
    type: 'row',
    label: 'Row',
    icon: Rows,
    description: 'Horizontal layout container',
  },
  {
    type: 'column',
    label: 'Column',
    icon: Columns,
    description: 'Vertical layout container',
  },
];

interface ComponentPaletteProps {
  onDragStart?: (componentType: UIComponentType) => void;
}

export default function ComponentPalette({ onDragStart }: ComponentPaletteProps) {
  const handleDragStart = (e: React.DragEvent, component: ComponentItem) => {
    e.dataTransfer.setData('application/ui-component', JSON.stringify({ type: component.type }));
    e.dataTransfer.effectAllowed = 'copy';
    if (onDragStart) {
      onDragStart(component.type);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Components</h2>
        <p className="text-xs text-gray-500 mt-1">Drag to add to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {COMPONENTS.map((component) => {
            const Icon = component.icon;
            return (
              <div
                key={component.type}
                draggable
                onDragStart={(e) => handleDragStart(e, component)}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg cursor-move transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded border border-gray-200 group-hover:border-blue-300">
                  <Icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{component.label}</div>
                  <div className="text-xs text-gray-500 truncate">{component.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

