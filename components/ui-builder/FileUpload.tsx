'use client';

/**
 * Modern File Upload Component
 * 
 * Supports drag-and-drop and click-to-browse file upload
 */

import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes
  className?: string;
}

export default function FileUpload({
  accept = '.json',
  onFileSelect,
  onError,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      onError?.(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`);
      return false;
    }

    if (accept && !accept.split(',').some((ext) => file.name.toLowerCase().endsWith(ext.trim()))) {
      onError?.(`File type not supported. Please upload a ${accept} file.`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!validateFile(file)) {
        return;
      }

      setSelectedFile(file);
      setIsUploading(true);

      try {
        await onFileSelect(file);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to process file');
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onFileSelect, onError, maxSize, accept]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all
            ${
              isDragging
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`
                p-3 rounded-full mb-3 transition-colors
                ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
              `}
            >
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload
                  className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}
                />
              )}
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-500">
              {accept.includes('.json') ? 'JSON file' : accept} (max {maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

