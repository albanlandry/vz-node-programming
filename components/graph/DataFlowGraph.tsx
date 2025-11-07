'use client';

/**
 * Data Flow Graph Component
 * 
 * Visualizes the data flow through the graph showing inputs, outputs, and connections
 */

import { useMemo } from 'react';
import { X, Network } from 'lucide-react';
import { useGraphStore } from '../../store/graphStore';

interface DataFlowGraphProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

export default function DataFlowGraph({ isOpen, onClose, position }: DataFlowGraphProps) {
  const { nodes, connections, execution } = useGraphStore();

  const dataFlowData = useMemo(() => {
    const flowNodes = nodes.map((node) => {
      const nodeState = execution.nodeStates[node.id];
      const result = execution.results[node.id];

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        inputs: node.inputs.map((input) => {
          // Try to find input value from connections
          const connection = connections.find(
            (conn) => conn.toNode === node.id && conn.toPort === input.id,
          );
          let inputValue: unknown = null;
          if (connection && result) {
            // Would need to trace back to source node's output
            // Simplified for now
            inputValue = 'connected';
          }
          return {
            id: input.id,
            name: input.name,
            dataType: input.dataType.name,
            value: inputValue,
          };
        }),
        outputs: node.outputs.map((output) => {
          let outputValue: unknown = null;
          if (result?.outputs) {
            const outputs = result.outputs instanceof Map
              ? Object.fromEntries(result.outputs)
              : result.outputs;
            outputValue = outputs[output.id];
          }
          return {
            id: output.id,
            name: output.name,
            dataType: output.dataType.name,
            value: outputValue,
          };
        }),
        executionTime: nodeState?.executionTime || 0,
        status: nodeState?.status || 'idle',
      };
    });

    const flowEdges = connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromNode);
      const toNode = nodes.find((n) => n.id === conn.toNode);
      const fromResult = execution.results[conn.fromNode];
      let data: unknown = null;

      if (fromResult?.outputs) {
        const outputs = fromResult.outputs instanceof Map
          ? Object.fromEntries(fromResult.outputs)
          : fromResult.outputs;
        data = outputs[conn.fromPort];
      }

      return {
        id: conn.id,
        fromNode: conn.fromNode,
        fromNodeName: fromNode?.name || conn.fromNode,
        toNode: conn.toNode,
        toNodeName: toNode?.name || conn.toNode,
        fromPort: conn.fromPort,
        toPort: conn.toPort,
        data,
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [nodes, connections, execution]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bg-white shadow-2xl border-2 border-gray-300 z-50 w-[800px] max-h-[700px] flex flex-col"
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Data Flow Graph</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-teal-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {dataFlowData.nodes.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            No nodes in graph
          </div>
        ) : (
          <div className="space-y-4">
            {dataFlowData.nodes.map((node) => (
              <div key={node.id} className="border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-900">{node.name}</h4>
                  <span className="text-xs text-gray-500">
                    {node.executionTime > 0 ? `${node.executionTime}ms` : 'Not executed'}
                  </span>
                </div>

                {/* Inputs */}
                {node.inputs.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-600 mb-1">Inputs:</div>
                    <div className="space-y-1">
                      {node.inputs.map((input) => (
                        <div key={input.id} className="text-xs text-gray-700 pl-2">
                          <span className="font-medium">{input.name}</span>
                          <span className="text-gray-500 ml-1">({input.dataType})</span>
                          {input.value !== null && (
                            <span className="text-gray-600 ml-2">
                              = {typeof input.value === 'string' && input.value.length > 30
                                ? `${input.value.substring(0, 30)}...`
                                : String(input.value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outputs */}
                {node.outputs.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Outputs:</div>
                    <div className="space-y-1">
                      {node.outputs.map((output) => (
                        <div key={output.id} className="text-xs text-gray-700 pl-2">
                          <span className="font-medium">{output.name}</span>
                          <span className="text-gray-500 ml-1">({output.dataType})</span>
                          {output.value !== null && output.value !== undefined && (
                            <span className="text-gray-600 ml-2">
                              = {typeof output.value === 'string' && output.value.length > 30
                                ? `${output.value.substring(0, 30)}...`
                                : typeof output.value === 'object'
                                  ? JSON.stringify(output.value).substring(0, 30) + '...'
                                  : String(output.value)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


