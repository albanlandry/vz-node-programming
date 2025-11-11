'use client';

/**
 * Performance Metrics Component
 * 
 * Displays performance metrics for each node in the graph
 */

import { X, BarChart3, TrendingUp } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';
import DraggableResizablePanel from './DraggableResizablePanel';

interface PerformanceMetricsProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function PerformanceMetrics({
  isOpen,
  onClose,
  position,
}: PerformanceMetricsProps) {
  const { performanceMetrics, resetPerformanceMetrics } = useGraphStore();

  if (!isOpen) return null;

  const metricsEntries = Object.entries(performanceMetrics.nodes);

  if (metricsEntries.length === 0) {
    return (
      <DraggableResizablePanel
        panelId="performance-metrics"
        defaultPosition={position}
        defaultSize={{ width: 700, height: 600 }}
        minWidth={500}
        minHeight={300}
        maxHeight={800}
        headerClassName="bg-gradient-to-r from-purple-500 to-purple-600"
        headerContent={
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Performance Metrics</h3>
          </div>
        }
        onClose={onClose}
      >
        <div className="p-4 text-sm text-gray-500">
          No performance metrics available. Execute graphs to collect metrics.
        </div>
      </DraggableResizablePanel>
    );
  }

  // Sort by average execution time (descending)
  const sortedMetrics = metricsEntries.sort(
    (a, b) => b[1].averageExecutionTime - a[1].averageExecutionTime,
  );

  return (
    <DraggableResizablePanel
      panelId="performance-metrics"
      defaultPosition={position}
      defaultSize={{ width: 700, height: 600 }}
      minWidth={500}
      minHeight={300}
      maxHeight={800}
      headerClassName="bg-gradient-to-r from-purple-500 to-purple-600"
      headerContent={
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Performance Metrics</h3>
          <button
            onClick={resetPerformanceMetrics}
            className="ml-auto px-2 py-1 text-xs bg-purple-700 hover:bg-purple-800 transition-colors"
            title="Reset Metrics"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Reset
          </button>
        </div>
      }
      onClose={onClose}
    >

      {/* Summary */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-600">Total Executions: </span>
            <span className="font-semibold">{performanceMetrics.totalExecutions}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Graph Time: </span>
            <span className="font-semibold">
              {performanceMetrics.averageGraphExecutionTime.toFixed(2)}ms
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700">Node</th>
              <th className="text-right p-3 font-semibold text-gray-700">Executions</th>
              <th className="text-right p-3 font-semibold text-gray-700">Avg Time</th>
              <th className="text-right p-3 font-semibold text-gray-700">Min Time</th>
              <th className="text-right p-3 font-semibold text-gray-700">Max Time</th>
              <th className="text-right p-3 font-semibold text-gray-700">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedMetrics.map(([nodeId, metrics]) => (
              <tr key={nodeId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">{metrics.nodeName}</td>
                <td className="p-3 text-right text-gray-700">{metrics.executionCount}</td>
                <td className="p-3 text-right text-gray-700">
                  {metrics.averageExecutionTime.toFixed(2)}ms
                </td>
                <td className="p-3 text-right text-gray-700">
                  {metrics.minExecutionTime === Infinity ? '-' : `${metrics.minExecutionTime}ms`}
                </td>
                <td className="p-3 text-right text-gray-700">{metrics.maxExecutionTime}ms</td>
                <td className="p-3 text-right">
                  <span
                    className={`font-medium ${
                      metrics.successRate >= 0.9
                        ? 'text-green-600'
                        : metrics.successRate >= 0.7
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {(metrics.successRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DraggableResizablePanel>
  );
}


