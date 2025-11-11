'use client';

/**
 * Validation Display Component
 * 
 * Displays validation errors for form fields
 * Phase 5: Inline error messages and validation feedback
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { FormValidationResult } from '../../src/types/validation';

interface ValidationDisplayProps {
  /**
   * Validation result
   */
  validation: FormValidationResult;
  
  /**
   * Field name to display error for (if showing single field)
   */
  fieldName?: string;
  
  /**
   * Whether to show all errors or just for specific field
   */
  showAll?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
}

export default function ValidationDisplay({
  validation,
  fieldName,
  showAll = false,
  className = '',
}: ValidationDisplayProps) {
  // If showing single field
  if (fieldName && !showAll) {
    const fieldResult = validation.fields[fieldName];
    if (!fieldResult || fieldResult.isValid) {
      return null;
    }

    return (
      <div className={`flex items-start gap-2 text-red-600 text-sm mt-1 ${className}`}>
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{fieldResult.error}</span>
      </div>
    );
  }

  // Show all errors
  if (showAll && !validation.isValid) {
    const errorEntries = Object.entries(validation.errors);
    if (errorEntries.length === 0) {
      return null;
    }

    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <h3 className="text-sm font-semibold text-red-800">
            Please fix the following errors:
          </h3>
        </div>
        <ul className="list-disc list-inside space-y-1">
          {errorEntries.map(([field, error]) => (
            <li key={field} className="text-sm text-red-700">
              {error}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

