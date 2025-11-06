'use client';

/**
 * Navigation Component
 * Left sidebar navigation menu for the application with collapse functionality and submenus
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

interface NavItem {
  href?: string;
  label: string;
  icon?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Node Registry',
    icon: '📚',
    children: [
      { href: '/', label: 'Browse Nodes', icon: '📚' },
      { href: '/custom-nodes', label: 'Custom Nodes', icon: '🎨' },
      { href: '/custom-nodes/create', label: 'Create Node', icon: '➕' },
    ],
  },
  {
    label: 'Graphs',
    icon: '📊',
    children: [
      { href: '/graphs', label: 'Graph List', icon: '📋' },
      { href: '/graph-editor', label: 'Graph Editor', icon: '🕸️' },
    ],
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  /**
   * Check if a menu item is active
   */
  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    }
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  /**
   * Toggle submenu expansion
   */
  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  /**
   * Render a navigation item
   */
  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const isActive = isItemActive(item);
    const isGraphEditor = pathname === '/graph-editor';
    const isGraphsPage = pathname === '/graphs';
    const isNodeRegistry = pathname === '/' || pathname === '/custom-nodes' || pathname === '/custom-nodes/create';
    const isGraphsActive = item.label === 'Graphs' && (isGraphEditor || isGraphsPage);
    const isNodeRegistryActive = item.label === 'Node Registry' && isNodeRegistry;

    if (sidebarCollapsed && level > 0) {
      return null; // Hide submenus when collapsed
    }

    if (hasChildren) {
      return (
        <div key={item.label} className="space-y-1">
          <button
            onClick={() => toggleSubmenu(item.label)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isGraphsActive || isNodeRegistryActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            {item.icon && <span className="text-lg flex-shrink-0">{item.icon}</span>}
            {!sidebarCollapsed && (
              <>
                <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          {isExpanded && !sidebarCollapsed && (
            <div className="ml-4 pl-4 border-l-2 border-gray-700 space-y-1">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!item.href) {
      return null;
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        } ${sidebarCollapsed ? 'justify-center' : ''} ${level > 0 ? 'pl-8' : ''}`}
        title={sidebarCollapsed ? item.label : undefined}
      >
        {item.icon && <span className="text-lg flex-shrink-0">{item.icon}</span>}
        {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
      </Link>
    );
  };

  // Auto-expand menus based on current path
  useEffect(() => {
    if (pathname === '/graph-editor' || pathname === '/graphs') {
      setExpandedMenus((prev) => {
        if (!prev.has('Graphs')) {
          return new Set(prev).add('Graphs');
        }
        return prev;
      });
    }
    if (pathname === '/' || pathname === '/custom-nodes' || pathname === '/custom-nodes/create') {
      setExpandedMenus((prev) => {
        if (!prev.has('Node Registry')) {
          return new Set(prev).add('Node Registry');
        }
        return prev;
      });
    }
  }, [pathname]);

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
          className="group p-1.5 rounded-md hover:bg-gray-800 transition-colors ml-2"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col space-y-1 px-2">
          {navItems.map((item) => renderNavItem(item))}
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

