/**
 * Node Context Menu Component
 * 
 * Right-click context menu for nodes with copy, cut, paste, and delete options
 */

'use client';

import { useEffect, useRef } from 'react';
import { Copy, Scissors, Clipboard, Trash2 } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';

interface NodeContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function NodeContextMenu({
  nodeId,
  position,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selectedNodeIds,
    copyNodes,
    cutNodes,
    pasteNodes,
    deleteNode,
    canPaste,
  } = useGraphStore();

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

  const handleCopy = () => {
    const nodeIds = selectedNodeIds.has(nodeId)
      ? Array.from(selectedNodeIds)
      : [nodeId];
    copyNodes(nodeIds);
    onClose();
  };

  const handleCut = () => {
    const nodeIds = selectedNodeIds.has(nodeId)
      ? Array.from(selectedNodeIds)
      : [nodeId];
    cutNodes(nodeIds);
    onClose();
  };

  const handlePaste = () => {
    // Paste with default offset (position is in screen coordinates, not flow coordinates)
    pasteNodes();
    onClose();
  };

  const handleDelete = () => {
    if (selectedNodeIds.has(nodeId)) {
      // Delete all selected nodes
      Array.from(selectedNodeIds).forEach((id) => {
        deleteNode(id);
      });
    } else {
      deleteNode(nodeId);
    }
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <Copy className="w-4 h-4" />
        <span>Copy</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCut();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <Scissors className="w-4 h-4" />
        <span>Cut</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+X</span>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePaste();
        }}
        disabled={!canPaste()}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Clipboard className="w-4 h-4" />
        <span>Paste</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
      </button>
      
      <div className="h-px bg-gray-200 my-1" />
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
        <span className="ml-auto text-xs text-gray-400">Del</span>
      </button>
    </div>
  );
}

