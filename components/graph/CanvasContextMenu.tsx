/**
 * Canvas Context Menu Component
 * 
 * Right-click context menu for empty canvas space
 */

'use client';

import { useEffect, useRef } from 'react';
import { Clipboard } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';

interface CanvasContextMenuProps {
  position: { x: number; y: number };
  flowPosition: { x: number; y: number };
  onClose: () => void;
}

export default function CanvasContextMenu({
  position,
  flowPosition,
  onClose,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { pasteNodes, canPaste } = useGraphStore();

  // Close menu when clicking outside
  useEffect(() => {
    // Use a small delay to allow menu button clicks to register first
    const handleClickOutside = (event: MouseEvent) => {
      setTimeout(() => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      }, 0);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Use click for better UX (fires after mousedown, allowing menu clicks to work)
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handlePaste = () => {
    pasteNodes(flowPosition);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {canPaste() ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePaste();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste Here</span>
          <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
        </button>
      ) : (
        <div className="px-4 py-2 text-sm text-gray-400">
          No items to paste
        </div>
      )}
    </div>
  );
}

