/**
 * Interactive Node Manager Component
 * 
 * Manages interactive node states and handles user input dialogs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import UserInputDialog from './UserInputDialog';
import type {
  UserInputRequest,
  InteractiveNodeEventType,
} from '../../../src/types';
import { streamingExecutionService } from '../../../services/streamingExecutionService';

interface PendingInputRequest {
  nodeId: string;
  executionId: string;
  request: UserInputRequest;
}

export default function InteractiveNodeManager() {
  const [pendingInput, setPendingInput] = useState<PendingInputRequest | null>(null);

  useEffect(() => {
    // Listen for user input requests from streaming execution
    const handleUserInputRequested = (event: any) => {
      const { nodeId, executionId, request } = event.data;
      setPendingInput({ nodeId, executionId, request });
    };

    // Register event listener
    streamingExecutionService.on('interactive:user-input-requested' as any, handleUserInputRequested);

    return () => {
      streamingExecutionService.off('interactive:user-input-requested' as any, handleUserInputRequested);
    };
  }, []);

  const handleSubmit = useCallback(async (value: unknown) => {
    if (!pendingInput) return;

    try {
      // Send user input to backend
      const response = await fetch(
        `/api/graphs/interactive/input/${pendingInput.nodeId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            executionId: pendingInput.executionId,
            value,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to submit user input');
      }

      // Clear pending input
      setPendingInput(null);
    } catch (error) {
      console.error('Error submitting user input:', error);
      // Keep dialog open on error
    }
  }, [pendingInput]);

  const handleCancel = useCallback(async () => {
    if (!pendingInput) return;

    try {
      // Cancel user input request
      const response = await fetch(
        `/api/graphs/interactive/input/${pendingInput.nodeId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            executionId: pendingInput.executionId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to cancel user input');
      }

      // Clear pending input
      setPendingInput(null);
    } catch (error) {
      console.error('Error cancelling user input:', error);
      // Clear anyway
      setPendingInput(null);
    }
  }, [pendingInput]);

  return (
    <>
      {pendingInput && (
        <UserInputDialog
          open={true}
          nodeId={pendingInput.nodeId}
          executionId={pendingInput.executionId}
          request={pendingInput.request}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

