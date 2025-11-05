'use client';

/**
 * Breadcrumbs Component
 * Displays navigation breadcrumbs for the current page
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  /**
   * Generate breadcrumb items from pathname
   */
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
    ];

    // Skip root path
    if (pathname === '/') {
      return items;
    }

    // Route label mapping for better display
    const routeLabels: Record<string, string> = {
      'custom-nodes': 'Custom Nodes',
      'create': 'Create Node',
      'graph-editor': 'Graph Editor',
    };

    const segments = pathname.split('/').filter(Boolean);

    // Build breadcrumb path
    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      
      // Use mapped label or format from segment
      const label = routeLabels[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      items.push({
        label,
        href: currentPath,
      });
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gray-400 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {isLast ? (
                  <span className="text-gray-700 font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

