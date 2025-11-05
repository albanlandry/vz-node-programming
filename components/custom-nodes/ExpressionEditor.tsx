'use client';

/**
 * Expression Editor Component
 * Allows users to write expressions for their custom node
 */

import { useState } from 'react';

interface ExpressionEditorProps {
  expression: string;
  onChange: (expression: string) => void;
  template?: string;
  inputs?: Array<{ id: string; name: string }>;
}

export default function ExpressionEditor({
  expression,
  onChange,
  template,
  inputs = [],
}: ExpressionEditorProps) {
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings?: string[];
  } | null>(null);

  const validateExpression = async () => {
    if (!expression.trim()) {
      setValidation({ valid: false, errors: ['Expression cannot be empty'] });
      return;
    }

    try {
      const response = await fetch('/api/custom-nodes/validate-expression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, template }),
      });

      const data = await response.json();
      setValidation(data);
    } catch (error) {
      setValidation({
        valid: false,
        errors: ['Failed to validate expression'],
      });
    }
  };

  const getExampleExpression = () => {
    if (!template || inputs.length === 0) {
      return '// Enter your expression here';
    }

    switch (template) {
      case 'transform':
        return `inputs.${inputs[0]?.id ?? 'value'} * 2`;
      case 'filter':
        return `inputs.${inputs[0]?.id ?? 'value'} > 0`;
      case 'calculator':
        return `inputs.${inputs[0]?.id ?? 'a'} + inputs.${inputs[1]?.id ?? 'b'}`;
      case 'conditional':
        return `inputs.${inputs[0]?.id ?? 'condition'} ? inputs.${inputs[1]?.id ?? 'trueValue'} : inputs.${inputs[2]?.id ?? 'falseValue'}`;
      case 'string-op':
        return `inputs.${inputs[0]?.id ?? 'text'}.toUpperCase()`;
      default:
        return '// Enter your expression here';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Expression *
        </label>
        <button
          type="button"
          onClick={validateExpression}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Validate
        </button>
      </div>

      <textarea
        value={expression}
        onChange={(e) => {
          onChange(e.target.value);
          setValidation(null);
        }}
        placeholder={getExampleExpression()}
        className="w-full px-4 py-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={6}
        required
      />

      {validation && (
        <div className="mt-2">
          {validation.valid ? (
            <div className="text-green-600 text-sm">
              ✓ Expression is valid
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="mt-1 text-yellow-600">
                  {validation.warnings.map((w, i) => (
                    <div key={i}>⚠ {w}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 text-sm">
              {validation.errors.map((error, i) => (
                <div key={i}>✗ {error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        <p>Available inputs: {inputs.map(i => `inputs.${i.id}`).join(', ') || 'none'}</p>
        <p className="mt-1">
          Allowed functions: Math.*, Number, String, Boolean, Array, Object, Date, JSON
        </p>
      </div>
    </div>
  );
}

