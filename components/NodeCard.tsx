import { NodeMetadata } from '../types/node';

interface NodeCardProps {
  node: NodeMetadata;
}

export default function NodeCard({ node }: NodeCardProps) {
  const categoryColors: Record<string, string> = {
    Functional: 'bg-blue-100 text-blue-800',
    'Object-Oriented': 'bg-purple-100 text-purple-800',
    Async: 'bg-green-100 text-green-800',
    Utility: 'bg-yellow-100 text-yellow-800',
  };

  const categoryColor = categoryColors[node.category] || 'bg-gray-100 text-gray-800';

  return (
    <div className="card card-hover overflow-hidden border-0">
      {/* Header */}
      <div className={`p-4 -m-6 mb-4 ${categoryColor} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {node.icon && <span className="text-2xl">{node.icon}</span>}
            <h3 className="text-lg font-bold">{node.displayName}</h3>
          </div>
          {node.deprecated && (
            <span className="badge badge-danger">Deprecated</span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-semibold">{node.category}</span>
          {node.version && (
            <span className="text-xs opacity-75">v{node.version}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">{node.description}</p>

        {/* Type */}
        <div className="mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase">Type</span>
          <p className="text-xs font-mono text-gray-700 mt-1">{node.type}</p>
        </div>

        {/* Ports */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Inputs
            </span>
            <p className="text-lg font-bold text-blue-600">
              {node.inputs.length}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Outputs
            </span>
            <p className="text-lg font-bold text-green-600">
              {node.outputs.length}
            </p>
          </div>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
              Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {node.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="badge badge-gray">
                  {tag}
                </span>
              ))}
              {node.tags.length > 5 && (
                <span className="badge badge-gray opacity-60">
                  +{node.tags.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Examples */}
        {node.examples && node.examples.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Examples
            </span>
            <ul className="text-xs text-gray-600 mt-1 space-y-1">
              {node.examples.slice(0, 2).map((example, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Author */}
        {node.author && (
          <div className="text-xs text-gray-500">
            by {node.author}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 -m-6 mt-4 rounded-b-xl border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">Click to view details</span>
          {node.docsUrl && (
            <a
              href={node.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Docs →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

