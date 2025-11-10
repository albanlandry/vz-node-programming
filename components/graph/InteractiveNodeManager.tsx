/**
 * Interactive Node Manager Component
 * 
 * Manages interactive node states and handles user input dialogs
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import UserInputDialog from './UserInputDialog';
import ImageDisplayPanel from './ImageDisplayPanel';
import StreamingDataPanel from './StreamingDataPanel';
import type {
  UserInputRequest,
  ImageData,
  InteractiveNodeEventType,
} from '../../src/types';
import { streamingExecutionService } from '../../services/streamingExecutionService';

interface PendingInputRequest {
  nodeId: string;
  executionId: string;
  request: UserInputRequest;
}

interface PendingImageDisplay {
  nodeId: string;
  executionId: string;
  imageData: ImageData;
}

interface ActiveStreamingNode {
  nodeId: string;
  executionId: string;
}

export default function InteractiveNodeManager() {
  const [pendingInput, setPendingInput] = useState<PendingInputRequest | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImageDisplay | null>(null);
  const [streamingNodes, setStreamingNodes] = useState<Map<string, ActiveStreamingNode>>(new Map());

  useEffect(() => {
    // Listen for user input requests from streaming execution
    const handleUserInputRequested = (event: any) => {
      // Handle both event structures: event.data or event.data.data
      const eventData = event.data || event;
      const { nodeId, executionId, request } = eventData;
      
      if (nodeId && executionId && request) {
        console.log('User input requested:', { nodeId, executionId, request });
        setPendingInput({ nodeId, executionId, request });
      } else {
        console.error('Invalid user input request event:', event);
      }
    };

    // Listen for image display requests
    const handleImageDisplayRequested = (event: any) => {
      const { nodeId, executionId, imageData } = event.data;
      setPendingImage({ nodeId, executionId, imageData });
    };

    // Listen for streaming data updates
    const handleStreamingDataUpdate = (event: any) => {
      const { nodeId, executionId } = event.data;
      
      // Add or update streaming node
      setStreamingNodes((prev) => {
        const updated = new Map(prev);
        updated.set(nodeId, { nodeId, executionId });
        return updated;
      });
    };

    // Register event listeners
    streamingExecutionService.on('interactive:user-input-requested' as any, handleUserInputRequested);
    streamingExecutionService.on('interactive:image-display-requested' as any, handleImageDisplayRequested);
    streamingExecutionService.on('interactive:streaming-data-update' as any, handleStreamingDataUpdate);

    return () => {
      streamingExecutionService.off('interactive:user-input-requested' as any, handleUserInputRequested);
      streamingExecutionService.off('interactive:image-display-requested' as any, handleImageDisplayRequested);
      streamingExecutionService.off('interactive:streaming-data-update' as any, handleStreamingDataUpdate);
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

  const handleImageClose = useCallback(() => {
    setPendingImage(null);
  }, []);

  const handleStreamingClose = useCallback((nodeId: string) => {
    setStreamingNodes((prev) => {
      const updated = new Map(prev);
      updated.delete(nodeId);
      return updated;
    });
  }, []);

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
      {pendingImage && (
        <ImageDisplayPanel
          open={true}
          nodeId={pendingImage.nodeId}
          executionId={pendingImage.executionId}
          imageData={pendingImage.imageData}
          onClose={handleImageClose}
        />
      )}
      {Array.from(streamingNodes.values()).map((streamingNode) => (
        <StreamingDataPanel
          key={streamingNode.nodeId}
          open={true}
          nodeId={streamingNode.nodeId}
          executionId={streamingNode.executionId}
          onClose={() => handleStreamingClose(streamingNode.nodeId)}
        />
      ))}
    </>
  );
}

