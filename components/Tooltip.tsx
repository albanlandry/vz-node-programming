'use client';

/**
 * Tooltip Component
 * Custom tooltip that appears to the right of elements when sidebar is collapsed
 */

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  label: string;
  isVisible: boolean;
  targetRef: React.RefObject<HTMLElement>;
  sidebarCollapsed: boolean;
}

export default function Tooltip({ label, isVisible, targetRef, sidebarCollapsed }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible || !sidebarCollapsed || !targetRef.current || !mounted) {
      return;
    }

    const updatePosition = () => {
      if (!targetRef.current || !tooltipRef.current) return;

      const rect = targetRef.current.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current.offsetHeight || 40;
      const viewportHeight = window.innerHeight;
      const padding = 8; // Padding from viewport edges
      
      // Calculate desired vertical center position
      let top = rect.top + (rect.height / 2);
      
      // Ensure tooltip stays within viewport bounds
      const minTop = (tooltipHeight / 2) + padding;
      const maxTop = viewportHeight - (tooltipHeight / 2) - padding;
      
      // Clamp the top position to keep tooltip fully visible
      top = Math.max(minTop, Math.min(maxTop, top));
      
      setPosition({
        left: rect.right + 8,
        top: top,
      });
    };

    // Initial position update - use multiple attempts to ensure tooltip is rendered
    const timeoutId1 = setTimeout(updatePosition, 0);
    const rafId1 = requestAnimationFrame(updatePosition);
    const rafId2 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updatePosition();
        // Set up ResizeObserver after tooltip is rendered
        if (tooltipRef.current) {
          const resizeObserver = new ResizeObserver(updatePosition);
          resizeObserver.observe(tooltipRef.current);
          
          // Store observer for cleanup
          (tooltipRef.current as any).__resizeObserver = resizeObserver;
        }
      });
    });

    // Update position on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timeoutId1);
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      
      // Clean up ResizeObserver
      if (tooltipRef.current && (tooltipRef.current as any).__resizeObserver) {
        (tooltipRef.current as any).__resizeObserver.disconnect();
      }
    };
  }, [isVisible, sidebarCollapsed, targetRef, mounted]);

  if (!mounted || !isVisible || !sidebarCollapsed) {
    return null;
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-[9999] pointer-events-none flex items-center"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translateY(-50%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
    </div>
  );

  // Render tooltip in a portal to avoid overflow clipping
  return createPortal(tooltipContent, document.body);
}

