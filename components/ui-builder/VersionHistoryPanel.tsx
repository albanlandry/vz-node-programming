'use client';

/**
 * Version History Panel Component
 * 
 * Displays version history and allows rollback
 * Phase 8: Version history, rollback, comparison
 */

import React, { useState } from 'react';
import { History, RotateCcw, GitCompare, X, Tag } from 'lucide-react';
import { useUIBuilderStore } from '../../store/uiBuilderStore';
import { compareVersions, type VersionComparison } from '../../services/versioningService';
import type { UIDefinition } from '../../src/types/uiDefinition';

interface VersionHistoryPanelProps {
  definitionId: string;
  onClose: () => void;
  onRollback?: (version: string) => void;
}

export default function VersionHistoryPanel({
  definitionId,
  onClose,
  onRollback,
}: VersionHistoryPanelProps) {
  const { getDefinition, getVersionHistory, rollbackToVersion } = useUIBuilderStore();
  const [selectedVersion1, setSelectedVersion1] = useState<string | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<string | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const currentDefinition = getDefinition(definitionId);
  const history = getVersionHistory(definitionId);
  const allVersions = currentDefinition ? [currentDefinition, ...history] : history;

  /**
   * Handle rollback
   */
  const handleRollback = (version: string) => {
    if (confirm(`Are you sure you want to rollback to version ${version}? This will create a new version.`)) {
      const success = rollbackToVersion(definitionId, version);
      if (success) {
        if (onRollback) {
          onRollback(version);
        }
        onClose();
      } else {
        alert('Failed to rollback. Version not found.');
      }
    }
  };

  /**
   * Compare two versions
   */
  const handleCompare = () => {
    if (!selectedVersion1 || !selectedVersion2) {
      alert('Please select two versions to compare');
      return;
    }

    const v1 = allVersions.find((v) => v.version === selectedVersion1);
    const v2 = allVersions.find((v) => v.version === selectedVersion2);

    if (!v1 || !v2) {
      alert('One or both versions not found');
      return;
    }

    const comp = compareVersions(v1, v2);
    setComparison(comp);
    setShowComparison(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" />
            <div>
              <h2 className="text-xl font-semibold">Version History</h2>
              <p className="text-sm text-blue-100 mt-1">{currentDefinition?.name || 'UI Definition'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {allVersions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Version List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Versions</h3>
                <div className="space-y-2">
                  {allVersions.map((version) => {
                    const isCurrent = version.version === currentDefinition?.version;
                    return (
                      <div
                        key={version.version}
                        className={`p-4 border rounded-lg ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">v{version.version}</span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                                  Current
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(version.updatedAt).toLocaleString()}
                              </span>
                            </div>
                            {version.description && (
                              <p className="text-sm text-gray-600 mb-2">{version.description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              {version.components.length} components
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isCurrent && (
                              <button
                                onClick={() => handleRollback(version.version)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Rollback to this version"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            <input
                              type="checkbox"
                              checked={selectedVersion1 === version.version || selectedVersion2 === version.version}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (!selectedVersion1) {
                                    setSelectedVersion1(version.version);
                                  } else if (!selectedVersion2) {
                                    setSelectedVersion2(version.version);
                                  }
                                } else {
                                  if (selectedVersion1 === version.version) {
                                    setSelectedVersion1(null);
                                  }
                                  if (selectedVersion2 === version.version) {
                                    setSelectedVersion2(null);
                                  }
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison */}
              {selectedVersion1 && selectedVersion2 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Version Comparison</h3>
                    <button
                      onClick={handleCompare}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <GitCompare className="w-4 h-4" />
                      Compare
                    </button>
                  </div>
                  {showComparison && comparison && (
                    <div className="space-y-3">
                      {comparison.added.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="text-sm font-semibold text-green-800 mb-1">
                            Added Components ({comparison.added.length})
                          </div>
                          <div className="text-xs text-green-700">
                            {comparison.added.join(', ')}
                          </div>
                        </div>
                      )}
                      {comparison.removed.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                          <div className="text-sm font-semibold text-red-800 mb-1">
                            Removed Components ({comparison.removed.length})
                          </div>
                          <div className="text-xs text-red-700">
                            {comparison.removed.join(', ')}
                          </div>
                        </div>
                      )}
                      {comparison.modified.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="text-sm font-semibold text-yellow-800 mb-2">
                            Modified Components ({comparison.modified.length})
                          </div>
                          <div className="space-y-2">
                            {comparison.modified.map((mod) => (
                              <div key={mod.componentId} className="text-xs text-yellow-700">
                                <div className="font-medium">{mod.componentId}</div>
                                <ul className="list-disc list-inside ml-2">
                                  {mod.changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {comparison.layoutChanges.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm font-semibold text-blue-800 mb-1">Layout Changes</div>
                          <div className="text-xs text-blue-700">
                            {comparison.layoutChanges.join(', ')}
                          </div>
                        </div>
                      )}
                      {comparison.themeChanges.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <div className="text-sm font-semibold text-purple-800 mb-1">Theme Changes</div>
                          <div className="text-xs text-purple-700">
                            {comparison.themeChanges.join(', ')}
                          </div>
                        </div>
                      )}
                      {comparison.added.length === 0 &&
                        comparison.removed.length === 0 &&
                        comparison.modified.length === 0 &&
                        comparison.layoutChanges.length === 0 &&
                        comparison.themeChanges.length === 0 && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 text-center">
                            No differences found between versions
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

