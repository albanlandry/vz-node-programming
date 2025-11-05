'use client';

/**
 * Template Selector Component
 * Allows users to select a template type for their custom node
 */

import { useState, useEffect } from 'react';

export interface Template {
  type: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onTemplateChange: (template: string) => void;
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/custom-nodes/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading templates...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Template Type *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.type}
            type="button"
            onClick={() => onTemplateChange(template.type)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedTemplate === template.type
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-2">
              {template.icon && <span className="text-2xl mr-2">{template.icon}</span>}
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

