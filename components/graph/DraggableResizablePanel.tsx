'use client';

/**
 * Draggable and Resizable Panel Wrapper Component
 * 
 * Provides drag and resize functionality for panels with localStorage persistence
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { GripVertical, X } from 'lucide-react';

interface PanelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableResizablePanelProps {
  panelId: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  headerClassName?: string;
  onClose?: () => void;
}

export default function DraggableResizablePanel({
  panelId,
  defaultPosition,
  defaultSize = { width: 400, height: 500 },
  minWidth = 300,
  minHeight = 200,
  maxWidth,
  maxHeight,
  children,
  className = '',
  headerContent,
  headerClassName = 'bg-gradient-to-r from-blue-500 to-blue-600',
  onClose,
}: DraggableResizablePanelProps) {
  const storageKey = `panel-${panelId}-bounds`;
  
  // Calculate center position if not provided
  const getCenterPosition = (): { x: number; y: number } => {
    if (typeof window === 'undefined') {
      return { x: 100, y: 100 };
    }
    return {
      x: (window.innerWidth - defaultSize.width) / 2,
      y: (window.innerHeight - defaultSize.height) / 2,
    };
  };

  const centerPosition = defaultPosition ?? getCenterPosition();
  
  // Validate and constrain bounds to viewport
  const constrainBounds = useCallback((bounds: PanelBounds): PanelBounds => {
    if (typeof window === 'undefined') {
      return bounds;
    }
    
    const maxX = Math.max(0, window.innerWidth - bounds.width);
    const maxY = Math.max(0, window.innerHeight - bounds.height);
    
    return {
      ...bounds,
      x: Math.max(0, Math.min(bounds.x, maxX)),
      y: Math.max(0, Math.min(bounds.y, maxY)),
    };
  }, []);

  // Load from localStorage or use defaults
  const loadBounds = (): PanelBounds => {
    if (typeof window === 'undefined') {
      return {
        x: centerPosition.x,
        y: centerPosition.y,
        width: defaultSize.width,
        height: defaultSize.height,
      };
    }
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedBounds = {
          x: parsed.x ?? centerPosition.x,
          y: parsed.y ?? centerPosition.y,
          width: parsed.width ?? defaultSize.width,
          height: parsed.height ?? defaultSize.height,
        };
        // Constrain loaded bounds to viewport
        return constrainBounds(loadedBounds);
      } catch {
        // Invalid JSON, use defaults
      }
    }
    
    const defaultBounds = {
      x: centerPosition.x,
      y: centerPosition.y,
      width: defaultSize.width,
      height: defaultSize.height,
    };
    return constrainBounds(defaultBounds);
  };

  // Save to localStorage
  const saveBounds = useCallback((newBounds: PanelBounds) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newBounds));
    }
  }, [storageKey]);

  const [bounds, setBounds] = useState<PanelBounds>(() => loadBounds());
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Constrain bounds on mount to ensure they're within viewport
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBounds(prev => {
        const constrained = constrainBounds(prev);
        if (constrained.x !== prev.x || constrained.y !== prev.y || 
            constrained.width !== prev.width || constrained.height !== prev.height) {
          saveBounds(constrained);
          return constrained;
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setBounds(prev => {
        const constrained = constrainBounds(prev);
        if (constrained.x !== prev.x || constrained.y !== prev.y) {
          saveBounds(constrained);
          return constrained;
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainBounds, saveBounds]);

  // Handle drag end
  const handleDragStop = useCallback((e: DraggableEvent, data: DraggableData) => {
    setBounds(prev => {
      const newBounds = {
        ...prev,
        x: data.x,
        y: data.y,
      };
      saveBounds(newBounds);
      return newBounds;
    });
  }, [saveBounds]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: bounds.width,
      height: bounds.height,
    });
  }, [bounds]);

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width + deltaX;
      let newHeight = resizeStart.height + deltaY;

      // Apply constraints
      if (newWidth < minWidth) newWidth = minWidth;
      if (newHeight < minHeight) newHeight = minHeight;
      if (maxWidth && newWidth > maxWidth) newWidth = maxWidth;
      if (maxHeight && newHeight > maxHeight) newHeight = maxHeight;

      // Keep within viewport
      if (typeof window !== 'undefined') {
        const maxX = window.innerWidth - 50;
        const maxY = window.innerHeight - 50;
        if (bounds.x + newWidth > maxX) {
          newWidth = maxX - bounds.x;
        }
        if (bounds.y + newHeight > maxY) {
          newHeight = maxY - bounds.y;
        }
      }

      setBounds(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeStart(null);
      // Save the current bounds after resize completes
      setBounds(prev => {
        saveBounds(prev);
        return prev;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, bounds, minWidth, minHeight, maxWidth, maxHeight, saveBounds]);

  // Get viewport bounds for dragging
  const getDragBounds = useCallback(() => {
    if (typeof window === 'undefined') {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    return {
      left: 0,
      top: 0,
      right: window.innerWidth - bounds.width,
      bottom: window.innerHeight - bounds.height,
    };
  }, [bounds.width, bounds.height]);

  return (
    <Draggable
      handle=".drag-handle"
      position={{ x: bounds.x, y: bounds.y }}
      onStop={handleDragStop}
      bounds={getDragBounds()}
    >
      <div
        ref={panelRef}
        className={`fixed bg-white shadow-2xl border-2 border-gray-300 z-50 flex flex-col ${className}`}
        style={{
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
        }}
      >
        {/* Header with drag handle */}
        {headerContent && (
          <div className={`drag-handle cursor-move flex items-center justify-between text-white px-4 py-3 ${headerClassName}`}>
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 opacity-70" />
              {headerContent}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-black/20 transition-colors ml-2 rounded"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-gray-300 hover:bg-gray-400 transition-colors flex items-end justify-end p-1"
          onMouseDown={handleResizeStart}
        >
          <div className="w-3 h-3 border-r-2 border-b-2 border-gray-600"></div>
        </div>
      </div>
    </Draggable>
  );
}

