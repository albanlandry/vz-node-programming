'use client';

/**
 * Main Content Component
 * Wrapper for main content area that adjusts based on sidebar state
 */

import { useUIStore } from '../store/uiStore';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div
      className="transition-all duration-300 ease-in-out min-h-screen"
      style={{
        marginLeft: sidebarCollapsed ? '80px' : '256px',
      }}
    >
      {children}
    </div>
  );
}

