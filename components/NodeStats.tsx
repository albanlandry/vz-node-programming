interface NodeStatsProps {
  stats: {
    totalNodes: number;
    categories: number;
    tags: number;
    deprecated: number;
  };
}

export default function NodeStats({ stats }: NodeStatsProps) {
  const statItems = [
    { label: 'Total Nodes', value: stats.totalNodes, color: 'blue' },
    { label: 'Categories', value: stats.categories, color: 'purple' },
    { label: 'Tags', value: stats.tags, color: 'green' },
    { label: 'Deprecated', value: stats.deprecated, color: 'red' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg p-4 ${colorClasses[item.color as keyof typeof colorClasses]}`}
        >
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="text-sm font-medium opacity-75">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

