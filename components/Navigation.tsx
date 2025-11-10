'use client';

/**
 * Navigation Component
 * Left sidebar navigation menu for the application with collapse functionality
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Network, 
  FileText, 
  Palette, 
  Plus, 
  List, 
  Workflow,
  Box,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import Tooltip from './Tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Node Registry menu items
const nodeRegistryItems: NavItem[] = [
  { href: '/', label: 'Browse Nodes', icon: BookOpen },
  { href: '/custom-nodes', label: 'Custom Nodes', icon: Palette },
  { href: '/custom-nodes/create', label: 'Create Node', icon: Plus },
];

// Graphs menu items
const graphItems: NavItem[] = [
  { href: '/graphs', label: 'Graph List', icon: List },
  { href: '/graph-editor', label: 'Graph Editor', icon: Workflow },
];

// Logo Section Component with Tooltip
function LogoSectionWithTooltip({ 
  sidebarCollapsed, 
  hoveredItem, 
  setHoveredItem
}: {
  sidebarCollapsed: boolean;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
}) {
  const logoRef = useRef<HTMLAnchorElement>(null);
  const isHovered = hoveredItem === 'logo';

  return (
    <div className={`pt-6 pb-4 px-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
      <Link
        ref={logoRef}
        href="/"
        onMouseEnter={() => setHoveredItem('logo')}
        onMouseLeave={() => setHoveredItem(null)}
        className={`flex items-center hover:opacity-80 transition-opacity relative ${
          sidebarCollapsed ? 'flex-col space-y-2' : 'space-x-3'
        }`}
      >
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          <Box className="w-6 h-6" style={{ color: '#2933FF' }} />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-medium whitespace-nowrap text-white">VZ Testing</span>
        )}
      </Link>
      <Tooltip 
        label="VZ Testing" 
        isVisible={isHovered} 
        targetRef={logoRef}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
}

// Toggle Button Component with Tooltip
function ToggleButtonWithTooltip({
  sidebarCollapsed,
  toggleSidebar,
  hoveredItem,
  setHoveredItem
}: {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  hoveredItem: string | null;
  setHoveredItem: (item: string | null) => void;
}) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isHovered = hoveredItem === 'toggle';

  return (
    <div className={`p-3 ${sidebarCollapsed ? 'flex justify-center border-t border-blue-400/30' : 'flex justify-end'}`}>
      <button
        ref={toggleRef}
        onClick={toggleSidebar}
        onMouseEnter={() => setHoveredItem('toggle')}
        onMouseLeave={() => setHoveredItem(null)}
        className={`
          rounded-xl hover:bg-blue-700/50 transition-colors flex items-center justify-center relative
          ${sidebarCollapsed 
            ? 'w-14 h-14' 
            : 'p-1.5'
          }
        `}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-5 h-5 text-white" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white" />
        )}
      </button>
      <Tooltip 
        label={sidebarCollapsed ? 'Expand' : 'Collapse'} 
        isVisible={isHovered} 
        targetRef={toggleRef}
        sidebarCollapsed={sidebarCollapsed}
      />
    </div>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  /**
   * Check if a menu item is active
   */
  const isItemActive = (item: NavItem): boolean => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(item.href);
  };

  /**
   * Navigation Item Component
   */
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = isItemActive(item);
    const isHovered = hoveredItem === item.href;
    const itemRef = useRef<HTMLAnchorElement>(null);

    return (
      <>
        <div key={item.href} className="relative">
          <Link
            ref={itemRef}
            href={item.href}
            onMouseEnter={() => setHoveredItem(item.href)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              flex items-center transition-all duration-200 relative
              ${sidebarCollapsed 
                ? 'justify-center w-14 h-14 rounded-xl' 
                : 'px-4 py-3 rounded-xl w-full'
              }
              ${isActive
                ? 'bg-blue-700/80 text-white'
                : 'text-white hover:bg-blue-700/50'
              }
            `}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        </div>
        <Tooltip 
          label={item.label} 
          isVisible={isHovered} 
          targetRef={itemRef}
          sidebarCollapsed={sidebarCollapsed}
        />
      </>
    );
  };

  return (
    <nav
      className={`text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20 rounded-r-3xl overflow-visible' : 'w-64 rounded-r-3xl'
      }`}
      style={{
        background: 'linear-gradient(180deg, #1a1fcc 0%, #0f1266 100%)',
      }}
    >
      {/* Logo Section */}
      <LogoSectionWithTooltip 
        sidebarCollapsed={sidebarCollapsed}
        hoveredItem={hoveredItem}
        setHoveredItem={setHoveredItem}
      />

      {/* Navigation Links */}
      <div className={`flex-1 py-2 px-3 ${sidebarCollapsed ? 'overflow-x-visible overflow-y-auto' : 'overflow-y-auto'}`}>
        <div className={`flex flex-col space-y-1 ${sidebarCollapsed ? 'items-center' : ''}`}>
          {/* Node Registry Items */}
          {nodeRegistryItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
          
          {/* Horizontal Separator */}
          <div className={`my-2 ${sidebarCollapsed ? 'w-10' : 'w-full'} border-t border-blue-400/30`}></div>
          
          {/* Graph Items */}
          {graphItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </div>

      {/* Toggle Button - Always visible */}
      <ToggleButtonWithTooltip
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        hoveredItem={hoveredItem}
        setHoveredItem={setHoveredItem}
      />
    </nav>
  );
}

