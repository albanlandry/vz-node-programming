'use client';

/**
 * Port Editor Component
 * Allows users to define input and output ports for their custom node
 */

import { useState } from 'react';

export interface Port {
  id: string;
  name: string;
  dataType: { name: string };
  required?: boolean;
  description?: string;
}

interface PortEditorProps {
  ports: Port[];
  type: 'input' | 'output';
  onChange: (ports: Port[]) => void;
}

const DATA_TYPES = [
  { name: 'any', label: 'Any' },
  { name: 'string', label: 'String' },
  { name: 'number', label: 'Number' },
  { name: 'boolean', label: 'Boolean' },
  { name: 'object', label: 'Object' },
  { name: 'array', label: 'Array' },
];

export default function PortEditor({ ports, type, onChange }: PortEditorProps) {
  const addPort = () => {
    const newPort: Port = {
      id: `port-${Date.now()}`,
      name: '',
      dataType: { name: 'any' },
      required: type === 'input',
      description: '',
    };
    onChange([...ports, newPort]);
  };

  const updatePort = (index: number, updates: Partial<Port>) => {
    const updated = [...ports];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removePort = (index: number) => {
    onChange(ports.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {type} Ports
        </h3>
        <button
          type="button"
          onClick={addPort}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add {type}
        </button>
      </div>

      {ports.length === 0 ? (
        <p className="text-gray-500 text-sm">No {type} ports defined</p>
      ) : (
        <div className="space-y-4">
          {ports.map((port, index) => (
            <div
              key={port.id}
              className="border border-gray-200 rounded p-3 bg-gray-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={port.name}
                    onChange={(e) => updatePort(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Port name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Data Type *
                  </label>
                  <select
                    value={port.dataType.name}
                    onChange={(e) =>
                      updatePort(index, { dataType: { name: e.target.value } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt.name} value={dt.name}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {type === 'input' && (
                  <div className="flex items-center">
                    <label className="flex items-center text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={port.required ?? false}
                        onChange={(e) =>
                          updatePort(index, { required: e.target.checked })
                        }
                        className="mr-2"
                      />
                      Required
                    </label>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePort(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={port.description ?? ''}
                  onChange={(e) => updatePort(index, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Port description"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

