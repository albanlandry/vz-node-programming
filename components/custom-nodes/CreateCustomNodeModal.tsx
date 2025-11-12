'use client';

/**
 * Create Custom Node Modal
 * 
 * Modal for creating a new custom node
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import PortEditor, { Port } from './PortEditor';
import ExpressionEditor from './ExpressionEditor';

interface CreateCustomNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCustomNodeModal({ isOpen, onClose }: CreateCustomNodeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expression, setExpression] = useState('');
  const [inputs, setInputs] = useState<Port[]>([]);
  const [outputs, setOutputs] = useState<Port[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Generate type if not provided
      const nodeType = type || `custom.${displayName.toLowerCase().replace(/\s+/g, '-')}`;

      const response = await fetch('/api/custom-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: nodeType,
          displayName,
          category,
          description,
          version,
          author: author || undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          template: selectedTemplate,
          expression,
          inputs,
          outputs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create custom node');
      }

      // Close modal and refresh
      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setType('');
    setDisplayName('');
    setCategory('Custom');
    setDescription('');
    setVersion('1.0.0');
    setAuthor('');
    setTags('');
    setSelectedTemplate(null);
    setExpression('');
    setInputs([]);
    setOutputs([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-semibold">Create Custom Node</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Node Type (auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="custom.my-node"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author (optional)
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="custom, example"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template</h3>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateChange={setSelectedTemplate}
              />
            </div>

            {/* Ports */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ports</h3>
              <PortEditor
                ports={inputs}
                type="input"
                onChange={setInputs}
              />
              <PortEditor
                ports={outputs}
                type="output"
                onChange={setOutputs}
              />
            </div>

            {/* Expression */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expression</h3>
              <ExpressionEditor
                expression={expression}
                onChange={setExpression}
                template={selectedTemplate ?? undefined}
                inputs={inputs}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedTemplate || !expression}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Node'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

