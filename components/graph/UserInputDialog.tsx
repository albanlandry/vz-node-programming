/**
 * User Input Dialog Component
 * 
 * Displays a modal dialog for collecting user input based on FormSchema
 */

'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, Check } from 'lucide-react';
import type { FormSchema, FormField, UserInputRequest } from '../../src/types';
import { validateForm, getFieldError, validateField, type ValidationResult, type ValidationError } from '../../utils/formValidation';

interface UserInputDialogProps {
  open: boolean;
  nodeId: string;
  executionId: string;
  request: UserInputRequest;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}

export default function UserInputDialog({
  open,
  nodeId,
  executionId,
  request,
  onSubmit,
  onCancel,
}: UserInputDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Initialize form values from schema or default value
  useEffect(() => {
    if (open && request.formSchema) {
      const initialValues: Record<string, unknown> = {};
      for (const field of request.formSchema.fields) {
        initialValues[field.id] = field.defaultValue ?? '';
      }
      setFormValues(initialValues);
      setTouched(new Set());
      setValidationResult({ isValid: true, errors: [] });
    } else if (open && request.type === 'confirm') {
      // Initialize confirm type with false
      setFormValues({ confirmed: false });
      setTouched(new Set());
      setValidationResult({ isValid: true, errors: [] });
    } else if (open && request.defaultValue !== undefined) {
      setFormValues({ value: request.defaultValue });
      setTouched(new Set());
      setValidationResult({ isValid: true, errors: [] });
    } else if (open) {
      // Initialize empty for prompt type
      setFormValues({ value: '' });
      setTouched(new Set());
      setValidationResult({ isValid: true, errors: [] });
    }
  }, [open, request]);

  if (!open) {
    return null;
  }

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    setTouched((prev) => new Set(prev).add(fieldId));

    // Validate on change if field is touched
    if (request.formSchema) {
      const field = request.formSchema.fields.find((f) => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        if (error) {
          setValidationResult((prev) => ({
            isValid: false,
            errors: [...prev.errors.filter((e) => e.fieldId !== fieldId), error],
          }));
        } else {
          setValidationResult((prev) => ({
            isValid: prev.errors.filter((e) => e.fieldId !== fieldId).length === 0,
            errors: prev.errors.filter((e) => e.fieldId !== fieldId),
          }));
        }
      }
    }
  };

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (request.formSchema) {
      const result = validateForm(request.formSchema, formValues);
      setValidationResult(result);
      if (result.isValid) {
        onSubmit(formValues);
      }
    } else if (request.type === 'prompt') {
      // For prompt type, submit the single value
      onSubmit(formValues.value ?? request.defaultValue ?? '');
    } else if (request.type === 'confirm') {
      // For confirm type, submit boolean (always allow submission)
      onSubmit(formValues.confirmed ?? false);
    } else {
      onSubmit(formValues);
    }
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id];
    const error = touched.has(field.id) ? getFieldError(field.id, validationResult) : undefined;

    const baseInputClasses = 'w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const errorInputClasses = error ? 'border-red-500' : '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <input
            key={field.id}
            type={field.type}
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorInputClasses}`}
            onBlur={() => setTouched((prev) => new Set(prev).add(field.id))}
          />
        );

      case 'number':
        return (
          <input
            key={field.id}
            type="number"
            id={field.id}
            value={(value as number) ?? ''}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorInputClasses}`}
            onBlur={() => setTouched((prev) => new Set(prev).add(field.id))}
          />
        );

      case 'textarea':
        return (
          <textarea
            key={field.id}
            id={field.id}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} ${errorInputClasses}`}
            onBlur={() => setTouched((prev) => new Set(prev).add(field.id))}
          />
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              checked={(value as boolean) || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="ml-2 text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            key={field.id}
            id={field.id}
            value={String(value ?? '')}
            onChange={(e) => {
              const option = field.options?.find((opt) => String(opt.value) === e.target.value);
              handleFieldChange(field.id, option?.value);
            }}
            className={`${baseInputClasses} ${errorInputClasses}`}
            onBlur={() => setTouched((prev) => new Set(prev).add(field.id))}
          >
            <option value="">Select...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            key={field.id}
            type="date"
            id={field.id}
            value={value ? (value as Date).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value ? new Date(e.target.value) : null)}
            className={`${baseInputClasses} ${errorInputClasses}`}
            onBlur={() => setTouched((prev) => new Set(prev).add(field.id))}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 max-w-md w-full mx-4 shadow-lg rounded-lg">
        <form onSubmit={handleSubmit} className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {request.formSchema?.title || request.prompt || 'User Input Required'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        {(request.formSchema?.description || request.prompt) && (
          <p className="text-sm text-gray-600 mb-4">
            {request.formSchema?.description || request.prompt}
          </p>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {request.formSchema ? (
            <>
              {/* Display content if provided and form has a single textarea field for display */}
              {request.content !== undefined && request.content !== null && 
               request.formSchema.fields.length === 1 && 
               request.formSchema.fields[0].type === 'textarea' && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-y-auto mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {request.formSchema.fields[0].label || 'Content'}:
                  </div>
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words font-mono">
                    {typeof request.content === 'string' 
                      ? request.content 
                      : JSON.stringify(request.content, null, 2)}
                  </pre>
                </div>
              )}
              {request.formSchema.fields.map((field) => (
                <div key={field.id}>
                  {field.type !== 'checkbox' && (
                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  {renderField(field)}
                  {touched.has(field.id) && getFieldError(field.id, validationResult) && (
                    <p className="mt-1 text-sm text-red-600">
                      {getFieldError(field.id, validationResult)}
                    </p>
                  )}
                </div>
              ))}
            </>
          ) : request.type === 'prompt' ? (
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="text"
                id="value"
                value={(formValues.value as string) || ''}
                onChange={(e) => handleFieldChange('value', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value..."
              />
            </div>
          ) : request.type === 'confirm' ? (
            <div className="space-y-4">
              {/* Display content if provided */}
              {request.content !== undefined && request.content !== null && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm font-medium text-gray-700 mb-2">Content:</div>
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words font-mono">
                    {typeof request.content === 'string' 
                      ? request.content 
                      : JSON.stringify(request.content, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirmed"
                  checked={(formValues.confirmed as boolean) || false}
                  onChange={(e) => handleFieldChange('confirmed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="confirmed" className="ml-2 text-sm text-gray-700">
                  {request.content !== undefined && request.content !== null 
                    ? 'I have read and understood the content above' 
                    : 'Confirm'}
                </label>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={request.formSchema ? !validationResult.isValid : false}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Check size={16} />
            <span>Submit</span>
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

