/**
 * Streaming Data Panel Component
 * 
 * Displays real-time streaming data updates from interactive nodes
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Trash2, Download } from 'lucide-react';

interface StreamingDataPanelProps {
  open: boolean;
  nodeId: string;
  executionId: string;
  onClose: () => void;
  onDataUpdate?: (data: unknown) => void;
}

interface DataEntry {
  timestamp: number;
  data: unknown;
  index: number;
}

export default function StreamingDataPanel({
  open,
  nodeId,
  executionId,
  onClose,
  onDataUpdate,
}: StreamingDataPanelProps) {
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [maxEntries, setMaxEntries] = useState(100);
  const entryIndexRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Listen for streaming data updates
  useEffect(() => {
    if (!open) {
      setDataEntries([]);
      setIsPaused(false);
      entryIndexRef.current = 0;
      return;
    }

    const { streamingExecutionService } = require('../../services/streamingExecutionService');

    const handleStreamingUpdate = (event: any) => {
      const { nodeId: eventNodeId, data } = event.data;
      
      // Only process events for this node
      if (eventNodeId !== nodeId) {
        return;
      }

      setDataEntries((prev) => {
        if (isPaused) {
          return prev; // Don't add new entries when paused
        }

        const newEntry: DataEntry = {
          timestamp: Date.now(),
          data,
          index: entryIndexRef.current++,
        };

        const updated = [...prev, newEntry];
        // Limit to maxEntries
        if (updated.length > maxEntries) {
          return updated.slice(-maxEntries);
        }
        return updated;
      });

      // Notify parent component
      if (!isPaused && onDataUpdate) {
        onDataUpdate(data);
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        if (panelRef.current) {
          const scrollContainer = panelRef.current.querySelector('.streaming-data-content');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 0);
    };

    streamingExecutionService.on('interactive:streaming-data-update' as any, handleStreamingUpdate);

    return () => {
      streamingExecutionService.off('interactive:streaming-data-update' as any, handleStreamingUpdate);
    };
  }, [open, nodeId, isPaused, maxEntries, onDataUpdate]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleClear = () => {
    setDataEntries([]);
    entryIndexRef.current = 0;
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(dataEntries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streaming-data-${nodeId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatData = (data: unknown): string => {
    if (data === null || data === undefined) {
      return 'null';
    }
    if (typeof data === 'string') {
      return data;
    }
    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white shadow-lg border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-100 border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
          <h3 className="text-sm font-semibold text-gray-900">
            Streaming Data - {nodeId}
          </h3>
          <span className="text-xs text-gray-500">({dataEntries.length})</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePause}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            aria-label={isPaused ? 'Resume' : 'Pause'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            aria-label="Clear"
            title="Clear data"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            aria-label="Download"
            title="Download data"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Data Content */}
      <div
        ref={panelRef}
        className="streaming-data-content max-h-96 overflow-y-auto bg-gray-50"
      >
        {dataEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {isPaused ? 'Paused - Waiting for data...' : 'Waiting for streaming data...'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {dataEntries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 p-2 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-500 font-mono">
                    #{entry.index}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <pre className="text-gray-800 whitespace-pre-wrap break-words font-mono text-xs">
                  {formatData(entry.data)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-100 border-t border-gray-300 flex items-center justify-between text-xs text-gray-600">
        <div>
          Max entries: {maxEntries}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMaxEntries(50)}
            className={`px-2 py-1 ${maxEntries === 50 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            50
          </button>
          <button
            onClick={() => setMaxEntries(100)}
            className={`px-2 py-1 ${maxEntries === 100 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            100
          </button>
          <button
            onClick={() => setMaxEntries(500)}
            className={`px-2 py-1 ${maxEntries === 500 ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            500
          </button>
        </div>
      </div>
    </div>
  );
}

