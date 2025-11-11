'use client';

/**
 * UI Builder Page
 * 
 * Main page for the WYSIWYG UI Builder
 * Phase 1: List and manage UI definitions
 */

import { useState } from 'react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { Plus, Trash2, Copy, Eye, FileText } from 'lucide-react';
import UIRenderer from '../../components/ui-runtime/UIRenderer';
import type { UIDefinition, FormData } from '../../src/types/uiDefinition';

export default function UIBuilderPage() {
  const { definitions, createDefinition, deleteDefinition, duplicateDefinition, getDefinition } =
    useUIBuilderStore();
  const [selectedDefinition, setSelectedDefinition] = useState<UIDefinition | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<FormData>({});

  const handleCreateNew = () => {
    const name = prompt('Enter UI name:');
    if (name) {
      const description = prompt('Enter description (optional):') || undefined;
      const newDef = createDefinition(name, description);
      setSelectedDefinition(newDef);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this UI definition?')) {
      deleteDefinition(id);
      if (selectedDefinition?.id === id) {
        setSelectedDefinition(null);
      }
    }
  };

  const handleDuplicate = (id: string) => {
    const duplicated = duplicateDefinition(id);
    if (duplicated) {
      setSelectedDefinition(duplicated);
    }
  };

  const handlePreview = (definition: UIDefinition) => {
    setSelectedDefinition(definition);
    setShowPreview(true);
    setPreviewData({});
  };

  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    alert('Form submitted! Check console for data.');
  };

  const handleFormChange = (data: FormData) => {
    setPreviewData(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Builder</h1>
        <p className="text-gray-600">
          Create and manage HTML-based UI forms for interactive nodes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - UI Definitions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">UI Definitions</h2>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>

            {definitions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No UI definitions yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "New" to create one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {definitions.map((def) => (
                  <div
                    key={def.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDefinition?.id === def.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDefinition(def)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{def.name}</h3>
                        {def.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {def.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{def.components.length} components</span>
                          <span>•</span>
                          <span>v{def.version}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(def);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(def.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(def.id);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Selected Definition Details / Preview */}
        <div className="lg:col-span-2">
          {selectedDefinition ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {showPreview ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Preview: {selectedDefinition.name}</h2>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Close Preview
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <UIRenderer
                      definition={selectedDefinition}
                      onSubmit={handleFormSubmit}
                      onChange={handleFormChange}
                      initialData={previewData}
                    />
                  </div>
                  {Object.keys(previewData).length > 0 && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Form Data:</h3>
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedDefinition.name}</h2>
                      {selectedDefinition.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedDefinition.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handlePreview(selectedDefinition)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Definition Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">ID:</span>
                            <span className="ml-2 text-gray-900 font-mono text-xs">{selectedDefinition.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Version:</span>
                            <span className="ml-2 text-gray-900">{selectedDefinition.version}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Components:</span>
                            <span className="ml-2 text-gray-900">{selectedDefinition.components.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(selectedDefinition.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Components</h3>
                      {selectedDefinition.components.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                          <p className="text-sm">No components yet</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Phase 2 will include the visual builder
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedDefinition.components.map((component) => (
                            <div
                              key={component.id}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase">
                                    {component.type}
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1">
                                    {component.label || component.name}
                                  </p>
                                  {component.name && (
                                    <p className="text-xs text-gray-500 mt-1">Name: {component.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">JSON Definition</h3>
                      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-96">
                        {JSON.stringify(selectedDefinition, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No UI Selected</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a UI definition from the list or create a new one
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New UI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

