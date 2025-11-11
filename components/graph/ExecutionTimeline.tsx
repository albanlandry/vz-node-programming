'use client';

/**
 * Execution Timeline Component
 * 
 * Visualizes the execution timeline of nodes showing when each node executed
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useGraphStore, type TimelineEvent } from '../../store/graphStore';
import DraggableResizablePanel from './DraggableResizablePanel';

interface ExecutionTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function ExecutionTimeline({ isOpen, onClose, position }: ExecutionTimelineProps) {
  const { execution, nodes, connections } = useGraphStore();

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    nodes.forEach((node) => {
      const nodeState = execution.nodeStates[node.id];
      if (nodeState && nodeState.startTime && nodeState.endTime) {
        // Calculate dependencies from connections
        const dependencies = connections
          .filter((conn) => conn.toNode === node.id)
          .map((conn) => conn.fromNode);

        events.push({
          nodeId: node.id,
          nodeName: node.name,
          startTime: nodeState.startTime,
          endTime: nodeState.endTime,
          duration: nodeState.endTime - nodeState.startTime,
          status: nodeState.status === 'completed' ? 'completed' : 'failed',
          dependencies,
        });
      }
    });

    return events.sort((a, b) => a.startTime - b.startTime);
  }, [execution.nodeStates, nodes, connections]);

  if (!isOpen) return null;

  if (timelineEvents.length === 0) {
    return (
      <DraggableResizablePanel
        panelId="execution-timeline"
        defaultPosition={position}
        defaultSize={{ width: 384, height: 500 }}
        minWidth={300}
        minHeight={200}
        maxHeight={800}
        headerClassName="bg-gradient-to-r from-indigo-500 to-indigo-600"
        headerContent={<h3 className="font-semibold text-sm">Execution Timeline</h3>}
        onClose={onClose}
      >
        <div className="p-4 text-sm text-gray-500">
          No execution timeline available. Execute a graph to see the timeline.
        </div>
      </DraggableResizablePanel>
    );
  }

  const minTime = Math.min(...timelineEvents.map((e) => e.startTime));
  const maxTime = Math.max(...timelineEvents.map((e) => e.endTime));
  const totalDuration = maxTime - minTime;

  return (
    <DraggableResizablePanel
      panelId="execution-timeline"
      defaultPosition={position}
      defaultSize={{ width: 600, height: 600 }}
      minWidth={400}
      minHeight={300}
      maxHeight={800}
      headerClassName="bg-gradient-to-r from-indigo-500 to-indigo-600"
      headerContent={<h3 className="font-semibold text-sm">Execution Timeline</h3>}
      onClose={onClose}
    >

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 text-xs text-gray-600">
          Total Duration: {totalDuration}ms | Nodes: {timelineEvents.length}
        </div>

        <div className="space-y-2">
          {timelineEvents.map((event) => {
            const left = totalDuration > 0 ? ((event.startTime - minTime) / totalDuration) * 100 : 0;
            const width = totalDuration > 0 ? (event.duration / totalDuration) * 100 : 0;

            return (
              <div key={event.nodeId} className="relative h-10 border-b border-gray-200">
                <div className="absolute left-0 top-0 bottom-0 flex items-center text-xs font-medium text-gray-700 w-32">
                  {event.nodeName}
                </div>
                <div className="ml-32 relative h-full">
                  <div
                    className={`absolute top-1 bottom-1 ${
                      event.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    } text-white text-xs flex items-center px-2 min-w-[60px]`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                    }}
                    title={`${event.nodeName}: ${event.duration}ms (${event.status})`}
                  >
                    <span className="truncate">{event.duration}ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span>Failed</span>
          </div>
        </div>
      </div>
    </DraggableResizablePanel>
  );
}

