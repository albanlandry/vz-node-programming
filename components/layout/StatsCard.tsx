'use client';

/**
 * Stats Card Component
 * Displays statistics in a card format
 */

interface StatItem {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  icon?: string;
}

interface StatsCardProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export default function StatsCard({ stats, columns = 3 }: StatsCardProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 ${gridCols[columns]}`}>
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {stats.map((stat, index) => (
          <div key={index} className="flex items-start gap-3">
            {stat.icon && (
              <div className="flex-shrink-0 mt-1">
                <span className="text-2xl">{stat.icon}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-600 mb-1">
                {stat.label}
              </div>
              <div className={`text-3xl font-bold ${stat.color ? colorClasses[stat.color] : colorClasses.gray}`}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

