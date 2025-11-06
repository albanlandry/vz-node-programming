import StatsCard from './layout/StatsCard';

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
    { label: 'Total Nodes', value: stats.totalNodes, color: 'blue' as const, icon: '🔷' },
    { label: 'Categories', value: stats.categories, color: 'purple' as const, icon: '📂' },
    { label: 'Tags', value: stats.tags, color: 'green' as const, icon: '🏷️' },
    { label: 'Deprecated', value: stats.deprecated, color: 'red' as const, icon: '⚠️' },
  ];

  return (
    <StatsCard
      stats={statItems.map((item) => ({
        label: item.label,
        value: item.value,
        color: item.color as 'blue' | 'green' | 'purple' | 'red',
      }))}
      columns={4}
    />
  );
}

