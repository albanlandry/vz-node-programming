'use client';

/**
 * Navigation Component
 * Left sidebar navigation menu for the application with collapse functionality
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../store/uiStore';

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Node Registry', icon: '📚' },
  { href: '/graph-editor', label: 'Graph Editor', icon: '🕸️' },
  { href: '/graphs', label: 'Graphs', icon: '📊' },
  { href: '/custom-nodes', label: 'Custom Nodes', icon: '🎨' },
  { href: '/custom-nodes/create', label: 'Create Node', icon: '➕' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <nav
      className={`bg-gray-900 text-white flex flex-col h-screen border-r border-gray-700 fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <Link
          href="/"
          className={`flex items-center space-x-2 hover:opacity-80 transition-opacity ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
          title={sidebarCollapsed ? 'VZ Programming' : undefined}
        >
          <span className="text-2xl flex-shrink-0">🔧</span>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold whitespace-nowrap">VZ Programming</span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-800 transition-colors text-gray-400 hover:text-white ml-2"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon && <span className="text-lg flex-shrink-0">{item.icon}</span>}
                {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
          <div className="font-medium">VZ Programming</div>
          <div className="mt-1">Node-based System</div>
        </div>
      )}
      {sidebarCollapsed && (
        <div className="p-4 border-t border-gray-700 flex justify-center">
          <span className="text-xs text-gray-500">VZ</span>
        </div>
      )}
    </nav>
  );
}

