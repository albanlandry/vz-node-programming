# Interactive Nodes Support Strategy

## Overview

This document proposes a strategy for supporting interactive nodes in the VZ Programming system. Interactive nodes are nodes that can request user input during execution or display special types of data (images, streaming, etc.).

## Goals

1. **User Input Nodes**: Display forms to users during execution and receive and validate input
2. **Image Display Nodes**: Visually display image data
3. **Streaming Data Nodes**: Display data that updates in real-time
4. **Extensible Architecture**: Enable future addition of other interactive features

## Current Architecture Analysis

### Current Execution Flow

```
GraphExecutionEngine
  └─> NodeExecutor
       └─> INode.execute(context)
            └─> ExecutionResult (outputs, error, executionTime)
                 └─> ExecutionResultsPanel (text-based display)
```

### Limitations

1. **Synchronous Execution**: Nodes wait until the `execute()` method completes
2. **Simple Output**: Results are only displayed as text/JSON
3. **Non-Interactive**: Cannot receive user input
4. **Static Display**: Only shows results after execution completes

## Proposed Architecture

### 1. Interactive Node Interface Extension

```typescript
// src/types/index.ts

/**
 * Interactive node types
 */
export enum InteractiveNodeType {
  USER_INPUT = 'user-input',      // User input request
  IMAGE_DISPLAY = 'image-display', // Image display
  STREAMING = 'streaming',         // Streaming data
  CUSTOM_UI = 'custom-ui',         // Custom UI component
}

/**
 * User input request
 */
export interface UserInputRequest {
  type: 'form' | 'prompt' | 'confirm';
  formSchema?: FormSchema;
  prompt?: string;
  defaultValue?: unknown;
  validation?: ValidationRule[];
}

/**
 * Form schema
 */
export interface FormSchema {
  fields: FormField[];
  title?: string;
  description?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[]; // for select
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message?: string;
  validator?: (value: unknown) => boolean | string;
}

/**
 * Interactive node execution context extension
 */
export interface InteractiveExecutionContext extends ExecutionContext {
  /**
   * Request user input
   * When a node calls this method, execution is paused and UI is displayed
   */
  requestUserInput(request: UserInputRequest): Promise<unknown>;
  
  /**
   * Request image display
   */
  displayImage(imageData: ImageData): void;
  
  /**
   * Update streaming data
   */
  updateStreamingData(data: unknown): void;
  
  /**
   * Request custom UI component rendering
   */
  renderCustomUI(componentType: string, props: Record<string, unknown>): void;
}

/**
 * Image data
 */
export interface ImageData {
  url?: string;
  base64?: string;
  blob?: Blob;
  format: 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg';
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Interactive node interface
 */
export interface IInteractiveNode extends INode {
  /**
   * Whether this node is interactive
   */
  readonly isInteractive: boolean;
  
  /**
   * Interactive node type
   */
  readonly interactiveType?: InteractiveNodeType;
  
  /**
   * Interactive execution method
   */
  executeInteractive(context: InteractiveExecutionContext): Promise<ExecutionResult>;
}
```

### 2. Execution Engine Extension

```typescript
// src/core/InteractiveNodeExecutor.ts

/**
 * Event types for interactive node execution
 */
export enum InteractiveNodeEventType {
  USER_INPUT_REQUESTED = 'interactive:user-input-requested',
  USER_INPUT_RECEIVED = 'interactive:user-input-received',
  IMAGE_DISPLAY_REQUESTED = 'interactive:image-display-requested',
  STREAMING_DATA_UPDATE = 'interactive:streaming-data-update',
  CUSTOM_UI_RENDER = 'interactive:custom-ui-render',
  NODE_PAUSED = 'interactive:node-paused',
  NODE_RESUMED = 'interactive:node-resumed',
}

/**
 * Interactive node execution context implementation
 */
export class InteractiveExecutionContext implements InteractiveExecutionContext {
  private inputResolver?: (value: unknown) => void;
  private inputRejecter?: (error: Error) => void;
  private eventEmitter: EventEmitter;
  
  constructor(
    private baseContext: ExecutionContext,
    eventEmitter: EventEmitter,
  ) {
    this.eventEmitter = eventEmitter;
  }
  
  async requestUserInput(request: UserInputRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.inputResolver = resolve;
      this.inputRejecter = reject;
      
      // Emit event: Display input request in UI
      this.eventEmitter.emit(InteractiveNodeEventType.USER_INPUT_REQUESTED, {
        nodeId: this.baseContext.executionId,
        request,
      });
      
      // Emit event: Pause node
      this.eventEmitter.emit(InteractiveNodeEventType.NODE_PAUSED, {
        nodeId: this.baseContext.executionId,
      });
    });
  }
  
  displayImage(imageData: ImageData): void {
    this.eventEmitter.emit(InteractiveNodeEventType.IMAGE_DISPLAY_REQUESTED, {
      nodeId: this.baseContext.executionId,
      imageData,
    });
  }
  
  updateStreamingData(data: unknown): void {
    this.eventEmitter.emit(InteractiveNodeEventType.STREAMING_DATA_UPDATE, {
      nodeId: this.baseContext.executionId,
      data,
    });
  }
  
  renderCustomUI(componentType: string, props: Record<string, unknown>): void {
    this.eventEmitter.emit(InteractiveNodeEventType.CUSTOM_UI_RENDER, {
      nodeId: this.baseContext.executionId,
      componentType,
      props,
    });
  }
  
  // Called when user input is provided
  provideUserInput(value: unknown): void {
    if (this.inputResolver) {
      this.inputResolver(value);
      this.inputResolver = undefined;
      this.inputRejecter = undefined;
      
      this.eventEmitter.emit(InteractiveNodeEventType.USER_INPUT_RECEIVED, {
        nodeId: this.baseContext.executionId,
      });
      
      this.eventEmitter.emit(InteractiveNodeEventType.NODE_RESUMED, {
        nodeId: this.baseContext.executionId,
      });
    }
  }
  
  // Cancel input
  cancelUserInput(error?: Error): void {
    if (this.inputRejecter) {
      this.inputRejecter(error || new Error('User input cancelled'));
      this.inputResolver = undefined;
      this.inputRejecter = undefined;
    }
  }
  
  // ExecutionContext delegation
  get executionId() { return this.baseContext.executionId; }
  get inputs() { return this.baseContext.inputs; }
  get outputs() { return this.baseContext.outputs; }
  get metadata() { return this.baseContext.metadata; }
  get errorHandler() { return this.baseContext.errorHandler; }
}
```

### 3. Frontend Components

#### 3.1 Interactive Node UI Manager

```typescript
// components/graph/InteractiveNodeManager.tsx

'use client';

import { useEffect, useState } from 'react';
import { streamingExecutionService } from '../../services/streamingExecutionService';
import UserInputDialog from './interactive/UserInputDialog';
import ImageDisplayPanel from './interactive/ImageDisplayPanel';
import StreamingDataPanel from './interactive/StreamingDataPanel';
import CustomUIPanel from './interactive/CustomUIPanel';

interface InteractiveNodeState {
  nodeId: string;
  type: InteractiveNodeType;
  data: unknown;
}

export default function InteractiveNodeManager() {
  const [userInputRequest, setUserInputRequest] = useState<UserInputRequest | null>(null);
  const [pendingNodeId, setPendingNodeId] = useState<string | null>(null);
  const [imageDisplays, setImageDisplays] = useState<Map<string, ImageData>>(new Map());
  const [streamingNodes, setStreamingNodes] = useState<Map<string, unknown>>(new Map());
  const [customUIs, setCustomUIs] = useState<Map<string, { componentType: string; props: unknown }>>(new Map());

  useEffect(() => {
    const handleUserInputRequested = (event: CustomEvent) => {
      const { nodeId, request } = event.detail;
      setUserInputRequest(request);
      setPendingNodeId(nodeId);
    };

    const handleImageDisplay = (event: CustomEvent) => {
      const { nodeId, imageData } = event.detail;
      setImageDisplays(prev => new Map(prev).set(nodeId, imageData));
    };

    const handleStreamingUpdate = (event: CustomEvent) => {
      const { nodeId, data } = event.detail;
      setStreamingNodes(prev => new Map(prev).set(nodeId, data));
    };

    const handleCustomUIRender = (event: CustomEvent) => {
      const { nodeId, componentType, props } = event.detail;
      setCustomUIs(prev => new Map(prev).set(nodeId, { componentType, props }));
    };

    // Register SSE event listeners
    window.addEventListener('interactive:user-input-requested', handleUserInputRequested);
    window.addEventListener('interactive:image-display-requested', handleImageDisplay);
    window.addEventListener('interactive:streaming-data-update', handleStreamingUpdate);
    window.addEventListener('interactive:custom-ui-render', handleCustomUIRender);

    return () => {
      window.removeEventListener('interactive:user-input-requested', handleUserInputRequested);
      window.removeEventListener('interactive:image-display-requested', handleImageDisplay);
      window.removeEventListener('interactive:streaming-data-update', handleStreamingUpdate);
      window.removeEventListener('interactive:custom-ui-render', handleCustomUIRender);
    };
  }, []);

  const handleUserInputSubmit = async (value: unknown) => {
    if (pendingNodeId) {
      // Send user input to backend
      await fetch(`/api/graphs/interactive/input/${pendingNodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      
      setUserInputRequest(null);
      setPendingNodeId(null);
    }
  };

  const handleUserInputCancel = async () => {
    if (pendingNodeId) {
      await fetch(`/api/graphs/interactive/input/${pendingNodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelled: true }),
      });
      
      setUserInputRequest(null);
      setPendingNodeId(null);
    }
  };

  return (
    <>
      {/* User Input Dialog */}
      {userInputRequest && pendingNodeId && (
        <UserInputDialog
          request={userInputRequest}
          onSubmit={handleUserInputSubmit}
          onCancel={handleUserInputCancel}
        />
      )}

      {/* Image Display Panels */}
      {Array.from(imageDisplays.entries()).map(([nodeId, imageData]) => (
        <ImageDisplayPanel
          key={nodeId}
          nodeId={nodeId}
          imageData={imageData}
          onClose={() => {
            setImageDisplays(prev => {
              const next = new Map(prev);
              next.delete(nodeId);
              return next;
            });
          }}
        />
      ))}

      {/* Streaming Data Panels */}
      {Array.from(streamingNodes.entries()).map(([nodeId, data]) => (
        <StreamingDataPanel
          key={nodeId}
          nodeId={nodeId}
          data={data}
          onClose={() => {
            setStreamingNodes(prev => {
              const next = new Map(prev);
              next.delete(nodeId);
              return next;
            });
          }}
        />
      ))}

      {/* Custom UI Panels */}
      {Array.from(customUIs.entries()).map(([nodeId, { componentType, props }]) => (
        <CustomUIPanel
          key={nodeId}
          nodeId={nodeId}
          componentType={componentType}
          props={props}
          onClose={() => {
            setCustomUIs(prev => {
              const next = new Map(prev);
              next.delete(nodeId);
              return next;
            });
          }}
        />
      ))}
    </>
  );
}
```

#### 3.2 User Input Dialog

```typescript
// components/graph/interactive/UserInputDialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UserInputRequest, FormField, ValidationRule } from '../../../src/types';

interface UserInputDialogProps {
  request: UserInputRequest;
  onSubmit: (value: unknown) => void;
  onCancel: () => void;
}

export default function UserInputDialog({ request, onSubmit, onCancel }: UserInputDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set initial values
    if (request.formSchema) {
      const initial: Record<string, unknown> = {};
      request.formSchema.fields.forEach(field => {
        initial[field.id] = field.defaultValue ?? '';
      });
      setFormData(initial);
    } else if (request.defaultValue !== undefined) {
      setFormData({ value: request.defaultValue });
    }
  }, [request]);

  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      for (const rule of field.validation) {
        const error = validateRule(rule, value);
        if (error) return error;
      }
    }

    return null;
  };

  const validateRule = (rule: ValidationRule, value: unknown): string | null => {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return rule.message || 'This field is required';
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message || `Minimum value is ${rule.value}`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message || `Maximum value is ${rule.value}`;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp) {
          if (!rule.value.test(value)) {
            return rule.message || 'Invalid format';
          }
        }
        break;
      case 'custom':
        if (rule.validator) {
          const result = rule.validator(value);
          if (result !== true) {
            return typeof result === 'string' ? result : (rule.message || 'Validation failed');
          }
        }
        break;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate entire form
    const newErrors: Record<string, string> = {};
    if (request.formSchema) {
      request.formSchema.fields.forEach(field => {
        const error = validateField(field, formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Send single value or form data
    const value = request.formSchema ? formData : formData.value;
    onSubmit(value);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];
    const error = errors[field.id];

    return (
      <div key={field.id} className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'textarea' ? (
          <textarea
            value={value as string || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={`w-full px-4 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={field.placeholder}
            rows={4}
          />
        ) : field.type === 'select' ? (
          <select
            value={value as string || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={`w-full px-4 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value as boolean || false}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        ) : (
          <input
            type={field.type}
            value={value as string || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={`w-full px-4 py-2 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={field.placeholder}
          />
        )}
        
        {error && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {request.formSchema?.title || request.prompt || 'Input Required'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {request.formSchema?.description && (
          <p className="text-sm text-gray-600 mb-4">{request.formSchema.description}</p>
        )}

        <form onSubmit={handleSubmit}>
          {request.formSchema ? (
            <div>
              {request.formSchema.fields.map(renderField)}
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">{request.prompt}</p>
              <input
                type="text"
                value={formData.value as string || ''}
                onChange={(e) => setFormData({ value: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### 3.3 Image Display Panel

```typescript
// components/graph/interactive/ImageDisplayPanel.tsx

'use client';

import { X } from 'lucide-react';
import type { ImageData } from '../../../src/types';

interface ImageDisplayPanelProps {
  nodeId: string;
  imageData: ImageData;
  onClose: () => void;
}

export default function ImageDisplayPanel({ nodeId, imageData, onClose }: ImageDisplayPanelProps) {
  const getImageSrc = () => {
    if (imageData.url) return imageData.url;
    if (imageData.base64) return `data:image/${imageData.format};base64,${imageData.base64}`;
    if (imageData.blob) return URL.createObjectURL(imageData.blob);
    return null;
  };

  const src = getImageSrc();
  if (!src) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative max-w-4xl max-h-[90vh] bg-white p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-white hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        <img
          src={src}
          alt={imageData.alt || `Image from node ${nodeId}`}
          className="max-w-full max-h-[85vh] object-contain"
          style={{
            width: imageData.width ? `${imageData.width}px` : 'auto',
            height: imageData.height ? `${imageData.height}px` : 'auto',
          }}
        />
      </div>
    </div>
  );
}
```

#### 3.4 Streaming Data Panel

```typescript
// components/graph/interactive/StreamingDataPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface StreamingDataPanelProps {
  nodeId: string;
  data: unknown;
  onClose: () => void;
}

export default function StreamingDataPanel({ nodeId, data, onClose }: StreamingDataPanelProps) {
  const [dataHistory, setDataHistory] = useState<unknown[]>([]);

  useEffect(() => {
    setDataHistory(prev => [...prev, data]);
  }, [data]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-2xl border-2 border-gray-300 z-50 w-96 max-h-[400px] flex flex-col">
      <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Streaming Data: {nodeId}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {dataHistory.map((item, index) => (
          <div key={index} className="bg-gray-50 p-2 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Update #{index + 1}</div>
            <pre className="text-xs text-gray-800 font-mono overflow-x-auto">
              {formatValue(item)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Backend API Extension

```typescript
// app/api/graphs/interactive/input/[nodeId]/route.ts

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/graphs/interactive/input/[nodeId]
 * Receive user input and pass it to the executing node
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  try {
    const { nodeId } = params;
    const body = await request.json();
    const { value, cancelled } = body;

    // Provide input to the InteractiveExecutionContext of the executing node
    // This requires internal state management in the execution engine
    
    // TODO: Manage InteractiveExecutionContext per node in execution engine
    // const context = getInteractiveContext(nodeId);
    // if (cancelled) {
    //   context.cancelUserInput();
    // } else {
    //   context.provideUserInput(value);
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to provide user input' },
      { status: 500 },
    );
  }
}
```

### 5. Example Node Implementations

#### 5.1 User Input Node

```typescript
// src/nodes/interactive/UserInputNode.ts

import { BaseNode } from '../../core/BaseNode';
import type { InteractiveExecutionContext, ExecutionResult } from '../../types';
import { InteractiveNodeType } from '../../types';

export class UserInputNode extends BaseNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.USER_INPUT;

  protected async executeInternal(
    context: InteractiveExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();

    // Request user input
    const userInput = await context.requestUserInput({
      type: 'form',
      formSchema: {
        title: 'Enter User Information',
        description: 'Please fill in the following information',
        fields: [
          {
            id: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            placeholder: 'Enter your name',
            validation: [
              { type: 'required', message: 'Name is required' },
              { type: 'pattern', value: /^[a-zA-Z\s]+$/, message: 'Name must contain only letters' },
            ],
          },
          {
            id: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'Enter your email',
            validation: [
              { type: 'required', message: 'Email is required' },
              { type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
            ],
          },
          {
            id: 'age',
            label: 'Age',
            type: 'number',
            required: false,
            validation: [
              { type: 'min', value: 0, message: 'Age must be positive' },
              { type: 'max', value: 150, message: 'Age must be less than 150' },
            ],
          },
        ],
      },
    });

    // Set input values as outputs
    if (typeof userInput === 'object' && userInput !== null) {
      const inputObj = userInput as Record<string, unknown>;
      outputs.set('name', inputObj.name || '');
      outputs.set('email', inputObj.email || '');
      outputs.set('age', inputObj.age || null);
      outputs.set('raw', userInput);
    } else {
      outputs.set('value', userInput);
    }

    return outputs;
  }
}
```

#### 5.2 Image Display Node

```typescript
// src/nodes/interactive/ImageDisplayNode.ts

import { BaseNode } from '../../core/BaseNode';
import type { InteractiveExecutionContext, ExecutionResult } from '../../types';
import { InteractiveNodeType } from '../../types';

export class ImageDisplayNode extends BaseNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.IMAGE_DISPLAY;

  protected async executeInternal(
    context: InteractiveExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();

    // Get image URL or data from inputs
    const imageUrl = context.inputs.get('url') as string | undefined;
    const imageData = context.inputs.get('data') as string | undefined; // base64

    if (imageUrl || imageData) {
      // Request image display
      context.displayImage({
        url: imageUrl,
        base64: imageData,
        format: 'png', // Or get from inputs
        alt: 'Displayed image',
      });
    }

    outputs.set('displayed', true);
    return outputs;
  }
}
```

#### 5.3 Streaming Data Node

```typescript
// src/nodes/interactive/StreamingDataNode.ts

import { BaseNode } from '../../core/BaseNode';
import type { InteractiveExecutionContext, ExecutionResult } from '../../types';
import { InteractiveNodeType } from '../../types';

export class StreamingDataNode extends BaseNode {
  readonly isInteractive = true;
  readonly interactiveType = InteractiveNodeType.STREAMING;

  protected async executeInternal(
    context: InteractiveExecutionContext,
  ): Promise<Map<string, unknown>> {
    const outputs = new Map<string, unknown>();

    // Simulate streaming (in reality, receive data from external source)
    const streamSource = context.inputs.get('source') as string | undefined;
    
    if (streamSource) {
      // Example: Receive data from WebSocket, SSE, etc. and update
      const interval = setInterval(() => {
        const data = {
          timestamp: Date.now(),
          value: Math.random() * 100,
          source: streamSource,
        };
        
        context.updateStreamingData(data);
      }, 1000);

      // Stop after a certain time (in reality, cleanup when node terminates)
      setTimeout(() => {
        clearInterval(interval);
      }, 30000);
    }

    outputs.set('streaming', true);
    return outputs;
  }
}
```

## Implementation Phases

### Phase 1: Basic Infrastructure (2-3 weeks)
1. Add type definitions (`InteractiveNodeType`, `UserInputRequest`, `ImageData`, etc.)
2. Implement `InteractiveExecutionContext`
3. Extend execution engine (detect and handle interactive nodes)
4. Build basic event system

### Phase 2: User Input Support (2 weeks)
1. Implement `UserInputDialog` component
2. Implement form validation system
3. Backend API endpoint (`/api/graphs/interactive/input/[nodeId]`)
4. User input wait/resume logic in execution engine
5. Example `UserInputNode` implementation

### Phase 3: Image Display Support (1 week)
1. Implement `ImageDisplayPanel` component
2. Image data processing (URL, base64, Blob)
3. Example `ImageDisplayNode` implementation

### Phase 4: Streaming Data Support (2 weeks)
1. Implement `StreamingDataPanel` component
2. Real-time data update mechanism
3. WebSocket/SSE integration (if needed)
4. Example `StreamingDataNode` implementation

### Phase 5: Integration and Testing (1 week)
1. Integrate `InteractiveNodeManager`
2. Full system integration testing
3. Documentation
4. Example graph creation

## Considerations

### 1. Execution Pause
- Execution must be paused while a node waits for user input
- Other nodes can continue executing (parallel mode)
- Timeout handling required

### 2. State Management
- Manage `InteractiveExecutionContext` instances for executing nodes
- Map user input to node IDs
- Session management (on browser refresh)

### 3. Security
- User input validation (XSS prevention)
- Image data size limits
- Streaming data rate limiting

### 4. Performance
- Image optimization (thumbnails, lazy loading)
- Streaming data buffering
- UI update optimization (debounce, throttling)

### 5. Extensibility
- Custom UI component plugin system
- Easy addition of new interactive types
- Third-party node developer support

## Conclusion

This strategy is designed to support interactive nodes with minimal changes to the existing architecture. Through phased implementation, features can be added incrementally, with testing and feedback at each stage.

