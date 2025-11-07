'use client';

/**
 * Content Card Component
 * Consistent card design for content items
 */

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function ContentCard({
  children,
  className = '',
  hover = true,
  onClick,
}: ContentCardProps) {
  return (
    <div
      className={`
        bg-white shadow-sm border border-gray-200 p-6
        ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

