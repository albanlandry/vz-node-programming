'use client';

/**
 * Page Container Component
 * Consistent container for all pages
 */

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 ${className}`}>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>
    </div>
  );
}

