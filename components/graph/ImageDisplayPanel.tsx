/**
 * Image Display Panel Component
 * 
 * Displays images from URL, base64, or Blob data
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Maximize2 } from 'lucide-react';
import type { ImageData } from '../../src/types';

interface ImageDisplayPanelProps {
  open: boolean;
  nodeId: string;
  executionId: string;
  imageData: ImageData;
  onClose: () => void;
}

export default function ImageDisplayPanel({
  open,
  nodeId,
  executionId,
  imageData,
  onClose,
}: ImageDisplayPanelProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setIsLoading(true);
      setError(null);
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (imageData.url) {
          // Load from URL
          setImageSrc(imageData.url);
        } else if (imageData.base64) {
          // Load from base64
          const base64Data = imageData.base64.startsWith('data:')
            ? imageData.base64
            : `data:image/${imageData.format};base64,${imageData.base64}`;
          setImageSrc(base64Data);
        } else if (imageData.blob) {
          // Load from Blob
          const blobUrl = URL.createObjectURL(imageData.blob);
          setImageSrc(blobUrl);
          // Clean up blob URL on unmount
          return () => {
            URL.revokeObjectURL(blobUrl);
          };
        } else {
          throw new Error('No image data provided');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [open, imageData]);

  const handleDownload = () => {
    if (!imageSrc) return;

    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `image-${nodeId}-${Date.now()}.${imageData.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  if (!open) {
    return null;
  }

  const imageStyle: React.CSSProperties = {
    maxWidth: imageData.width ? `${imageData.width}px` : '100%',
    maxHeight: imageData.height ? `${imageData.height}px` : '100%',
    objectFit: 'contain',
  };

  return (
    <>
      {/* Main Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-4 max-w-4xl w-full mx-4 shadow-lg relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Image Display - {nodeId}
            </h2>
            <div className="flex items-center space-x-2">
              {imageSrc && (
                <>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Download"
                    title="Download image"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={handleFullscreen}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    aria-label="Fullscreen"
                    title="View fullscreen"
                  >
                    <Maximize2 size={20} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex items-center justify-center min-h-[200px] bg-gray-50">
            {isLoading && (
              <div className="text-gray-500">Loading image...</div>
            )}
            {error && (
              <div className="text-red-600">Error: {error}</div>
            )}
            {imageSrc && !error && (
              <img
                src={imageSrc}
                alt={imageData.alt || 'Displayed image'}
                style={imageStyle}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load image');
                  setIsLoading(false);
                }}
                className="max-w-full max-h-[70vh]"
              />
            )}
          </div>

          {/* Image Info */}
          {imageData && (
            <div className="mt-4 text-sm text-gray-600">
              <div>Format: {imageData.format.toUpperCase()}</div>
              {imageData.width && imageData.height && (
                <div>
                  Dimensions: {imageData.width} × {imageData.height}px
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && imageSrc && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
              aria-label="Close fullscreen"
            >
              <X size={24} />
            </button>
            <img
              src={imageSrc}
              alt={imageData.alt || 'Displayed image'}
              className="max-w-full max-h-[95vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

