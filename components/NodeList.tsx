import { NodeMetadata } from '../types/node';
import NodeCard from './NodeCard';

interface NodeListProps {
  nodes: NodeMetadata[];
}

export default function NodeList({ nodes }: NodeListProps) {
  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No nodes found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {nodes.map((node) => (
        <NodeCard key={node.type} node={node} />
      ))}
    </div>
  );
}

