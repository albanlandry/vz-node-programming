'use client';

/**
 * UI Builder Page
 * 
 * Main page for the WYSIWYG UI Builder
 * Phase 2: List, manage, and edit UI definitions with visual builder
 */

import { useState, useRef } from 'react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { Plus, Trash2, Copy, Eye, FileText, Edit2, ArrowLeft, History, Download, Upload, Layers, X, Tag } from 'lucide-react';
import UIRenderer from '../../components/ui-runtime/UIRenderer';
import UIBuilder from '../../components/ui-builder/UIBuilder';
import VersionHistoryPanel from '../../components/ui-builder/VersionHistoryPanel';
import CreateUIDefinitionModal from '../../components/ui-builder/CreateUIDefinitionModal';
import { getAllTemplates, createFromTemplate } from '../../services/templateService';
import { exportUIDefinition, downloadUIDefinition, readUIDefinitionFromFile } from '../../services/exportImportService';
import type { UIDefinition, FormData } from '../../src/types/uiDefinition';

export default function UIBuilderPage() {
  const { definitions, createDefinition, deleteDefinition, duplicateDefinition, getDefinition, createVersion, importDefinition } =
    useUIBuilderStore();
  const [selectedDefinition, setSelectedDefinition] = useState<UIDefinition | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [previewData, setPreviewData] = useState<FormData>({});
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (name: string, description: string) => {
    const newDef = createDefinition(name, description);
    setSelectedDefinition(newDef);
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

  /**
   * Handle export (Phase 8)
   */
  const handleExport = (definition: UIDefinition) => {
    downloadUIDefinition(definition);
  };

  /**
   * Handle import (Phase 8)
   */
  const handleImport = async () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file selection (Phase 8)
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const definition = await readUIDefinitionFromFile(file);
    if (definition) {
      // Import using store method
      const importedDef = importDefinition(definition);
      setSelectedDefinition(importedDef);
      alert('UI imported successfully!');
    } else {
      alert('Failed to import UI definition. Please check the file format.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle create version (Phase 8)
   */
  const handleCreateVersion = (definition: UIDefinition) => {
    const type = prompt('Version type (major/minor/patch):', 'patch') as 'major' | 'minor' | 'patch' | null;
    if (!type || !['major', 'minor', 'patch'].includes(type)) return;
    
    const description = prompt('Version description (optional):') || undefined;
    createVersion(definition.id, type, description);
    alert(`Version created successfully!`);
    // Refresh selected definition
    const updated = getDefinition(definition.id);
    if (updated) {
      setSelectedDefinition(updated);
    }
  };

  /**
   * Handle create from template (Phase 8)
   */
  const handleCreateFromTemplate = async (templateId: string) => {
    const name = prompt('Enter UI name:');
    if (!name) return;
    
    const definition = await createFromTemplate(templateId, name);
    if (definition) {
      // Add to store
      const newDef = createDefinition(definition.name, definition.description);
      // Update with template data
      setSelectedDefinition(definition);
      setShowTemplates(false);
      setEditMode(true);
    }
  };

  // If in edit mode, show the builder
  if (editMode && selectedDefinition) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEditMode(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{selectedDefinition.name}</h1>
              {selectedDefinition.description && (
                <p className="text-sm text-gray-500">{selectedDefinition.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowPreview(true);
                setEditMode(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <UIBuilder definitionId={selectedDefinition.id} />
        </div>
      </div>
    );
  }

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs"
                  title="Templates"
                >
                  <Layers className="w-3 h-3" />
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
                  title="Import"
                >
                  <Upload className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

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
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDefinition(def);
                          setEditMode(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
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
                          setSelectedDefinition(def);
                          setShowVersionHistory(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Version History"
                      >
                        <History className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(def);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Export"
                      >
                        <Download className="w-3 h-3" />
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setEditMode(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handlePreview(selectedDefinition)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => setShowVersionHistory(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Versions
                      </button>
                      <button
                        onClick={() => handleCreateVersion(selectedDefinition)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        <Tag className="w-4 h-4" />
                        New Version
                      </button>
                      <button
                        onClick={() => handleExport(selectedDefinition)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
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
                            Click "Edit" to start building your UI
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

      {/* Version History Panel (Phase 8) */}
      {showVersionHistory && selectedDefinition && (
        <VersionHistoryPanel
          definitionId={selectedDefinition.id}
          onClose={() => setShowVersionHistory(false)}
          onRollback={(version) => {
            const updated = getDefinition(selectedDefinition.id);
            if (updated) {
              setSelectedDefinition(updated);
            }
          }}
        />
      )}

      {/* Create UI Definition Modal */}
      <CreateUIDefinitionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Templates Modal (Phase 8) */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5" />
                <h2 className="text-xl font-semibold">UI Templates</h2>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 hover:bg-purple-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAllTemplates().map((template) => (
                  <div
                    key={template.metadata.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleCreateFromTemplate(template.metadata.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{template.metadata.name}</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {template.metadata.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.metadata.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{template.definition.components.length} components</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

