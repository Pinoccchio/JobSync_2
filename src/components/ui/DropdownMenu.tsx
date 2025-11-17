'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
  hidden?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  triggerClassName?: string;
  menuClassName?: string;
}

interface Position {
  top: number;
  left: number;
  right?: number;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  align = 'right',
  triggerClassName,
  menuClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate menu position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px
      const menuHeight = visibleItems.length * 42 + 8; // Approximate height

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.bottom + 8; // 8px gap
      let left = rect.left;
      let calculatedAlign = align;

      // Check if menu would overflow right side of viewport
      if (align === 'right') {
        left = rect.right - menuWidth;
        // If still overflows left, switch to left align
        if (left < 0) {
          left = rect.left;
          calculatedAlign = 'left';
        }
      } else {
        // If left align would overflow right, switch to right align
        if (left + menuWidth > viewportWidth) {
          left = rect.right - menuWidth;
          calculatedAlign = 'right';
        }
      }

      // Ensure menu doesn't overflow left edge
      if (left < 8) {
        left = 8;
      }

      // Check if menu would overflow bottom of viewport
      if (top + menuHeight > viewportHeight - 8) {
        // Open upwards instead
        top = rect.top - menuHeight - 8;
      }

      // Ensure menu doesn't overflow top edge
      if (top < 8) {
        top = 8;
      }

      setPosition({ top, left });
      // Mark position as ready to render
      setPositionReady(true);
    } else {
      // Reset when closed
      setPositionReady(false);
    }
  }, [isOpen, align, items]);

  // Improved click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Don't close if clicking the trigger button (toggle handles this)
      if (triggerRef.current?.contains(target)) {
        return;
      }

      // Don't close if clicking inside the menu (including scrollbar)
      if (menuRef.current?.contains(target)) {
        return;
      }

      // Check if click is on scrollbar by checking if click is outside viewport
      const clickX = event.clientX;
      const clickY = event.clientY;

      if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        // If click is within menu bounds (including scrollbar area), don't close
        if (
          clickX >= menuRect.left &&
          clickX <= menuRect.right &&
          clickY >= menuRect.top &&
          clickY <= menuRect.bottom
        ) {
          return;
        }
      }

      setIsOpen(false);
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closing on the same click that opened it
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Close on scroll (standard UX pattern)
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use capture phase to catch scroll events from any scrollable container
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const getItemVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'hover:bg-green-50 text-green-700 hover:text-green-800';
      case 'danger':
        return 'hover:bg-red-50 text-red-700 hover:text-red-800';
      case 'warning':
        return 'hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800';
      default:
        return 'hover:bg-gray-100 text-gray-700 hover:text-gray-900';
    }
  };

  const visibleItems = items.filter(item => !item.hidden);

  if (visibleItems.length === 0) {
    return null;
  }

  const dropdownMenu = isOpen && positionReady ? (
    <div
      ref={menuRef}
      className={cn(
        'fixed w-48 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        'max-h-[80vh] overflow-y-auto',
        menuClassName
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
      onClick={(e) => {
        // Prevent clicks inside menu from propagating
        e.stopPropagation();
      }}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                getItemVariantClasses(item.variant)
              )}
              role="menuitem"
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#22A555] focus:ring-offset-1',
          'text-gray-600 hover:text-gray-900',
          triggerClassName
        )}
        aria-label="More actions"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Portal dropdown menu to document.body */}
      {mounted && dropdownMenu && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </>
  );
};
