/**
 * Streaming Execution Service
 * 
 * Handles Server-Sent Events (SSE) for real-time graph execution updates
 */

import type { GraphDefinition } from '../src/graph-management/types';

export type ExecutionEventType =
  | 'execution:started'
  | 'node:queued'
  | 'node:executing'
  | 'node:completed'
  | 'node:failed'
  | 'connection:data'
  | 'execution:completed'
  | 'execution:error';

export interface ExecutionEvent {
  type: ExecutionEventType;
  data: unknown;
  timestamp: number;
}

export interface ExecutionOptions {
  parallel?: boolean;
  timeout?: number;
  breakpoints?: string[];
  stepMode?: boolean;
}

export class StreamingExecutionService {
  private abortController: AbortController | null = null;
  private eventListeners: Map<ExecutionEventType, Set<(event: ExecutionEvent) => void>> = new Map();
  private isStreaming = false;

  /**
   * Execute graph with streaming updates
   */
  async executeStream(
    graph: GraphDefinition,
    inputs?: Record<string, Record<string, unknown>>,
    options?: ExecutionOptions,
  ): Promise<void> {
    // Cancel any existing execution
    this.cancel();

    // Create new abort controller
    this.abortController = new AbortController();
    this.isStreaming = true;

    try {
      const response = await fetch('/api/graphs/execute-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ graph, inputs, options }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to start execution: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      // Read SSE stream from response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';

      while (this.isStreaming) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType: ExecutionEventType | null = null;
        let eventData: string | null = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim() as ExecutionEventType;
          } else if (line.startsWith('data: ')) {
            eventData = line.substring(6).trim();
          } else if (line === '' && eventType && eventData) {
            // Complete event received
            try {
              const data = JSON.parse(eventData);
              this.emit(eventType, {
                type: eventType,
                data,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.error('Failed to parse event data:', error, eventData);
            }
            eventType = null;
            eventData = null;
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Execution was cancelled
        this.emit('execution:error', {
          type: 'execution:error',
          data: { error: 'Execution cancelled' },
          timestamp: Date.now(),
        });
      } else {
        this.emit('execution:error', {
          type: 'execution:error',
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
          timestamp: Date.now(),
        });
      }
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * Register event listener
   */
  on(eventType: ExecutionEventType, callback: (event: ExecutionEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  off(eventType: ExecutionEventType, callback: (event: ExecutionEvent) => void): void {
    this.eventListeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit event to all listeners
   */
  private emit(eventType: ExecutionEventType, event: ExecutionEvent): void {
    this.eventListeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Cancel ongoing execution
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isStreaming = false;
  }

  /**
   * Check if currently streaming
   */
  getIsStreaming(): boolean {
    return this.isStreaming;
  }
}

export const streamingExecutionService = new StreamingExecutionService();

