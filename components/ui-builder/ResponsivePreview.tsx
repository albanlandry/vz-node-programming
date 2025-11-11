'use client';

/**
 * Responsive Preview Component
 * 
 * Shows preview of UI in different screen sizes
 * Phase 7: Mobile/tablet/desktop views, responsive breakpoints
 */

import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, X } from 'lucide-react';
import type { UIDefinition } from '../../src/types/uiDefinition';
import UIRenderer from '../ui-runtime/UIRenderer';

interface ResponsivePreviewProps {
  definition: UIDefinition;
  onClose: () => void;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'fullscreen';

const VIEWPORT_SIZES: Record<ViewportSize, { width: number; height: number; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  mobile: {
    width: 375,
    height: 667,
    label: 'Mobile',
    icon: Smartphone,
  },
  tablet: {
    width: 768,
    height: 1024,
    label: 'Tablet',
    icon: Tablet,
  },
  desktop: {
    width: 1920,
    height: 1080,
    label: 'Desktop',
    icon: Monitor,
  },
  fullscreen: {
    width: 100,
    height: 100,
    label: 'Fullscreen',
    icon: Monitor,
  },
};

export default function ResponsivePreview({ definition, onClose }: ResponsivePreviewProps) {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});

  const viewport = VIEWPORT_SIZES[viewportSize];
  const ViewportIcon = viewport.icon;

  const isFullscreen = viewportSize === 'fullscreen';

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-[95vw] max-h-[95vh]'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Responsive Preview</h2>
            <div className="flex items-center gap-1 border border-blue-400 rounded-md overflow-hidden">
              {Object.entries(VIEWPORT_SIZES).map(([size, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={size}
                    onClick={() => setViewportSize(size as ViewportSize)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                      viewportSize === size
                        ? 'bg-blue-700 text-white'
                        : 'bg-transparent text-blue-100 hover:bg-blue-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100 flex items-center justify-center">
          <div
            className={`bg-white shadow-lg rounded-lg overflow-hidden transition-all ${
              isFullscreen ? 'w-full h-full' : 'border-8 border-gray-800'
            }`}
            style={
              !isFullscreen
                ? {
                    width: `${viewport.width}px`,
                    height: `${viewport.height}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }
                : {
                    width: '100%',
                    height: '100%',
                  }
            }
          >
            <div className="h-full overflow-auto">
              <UIRenderer
                definition={definition}
                onChange={setPreviewData}
                initialData={previewData}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!isFullscreen && (
              <>
                Viewport: {viewport.width} × {viewport.height}px
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Breakpoints: Mobile (375px), Tablet (768px), Desktop (1920px)
          </div>
        </div>
      </div>
    </div>
  );
}

