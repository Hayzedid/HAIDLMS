import React from 'react';
import { cn } from '../../lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };

  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent hover:border-gray-300 transition-colors',
      active: 'border-primary-600 text-primary-600 font-semibold',
      inactive: 'text-gray-600 hover:text-gray-800',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'rounded-md transition-all',
      active: 'bg-white text-primary-600 font-semibold shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    },
    underline: {
      container: 'space-x-8 border-b border-gray-200',
      tab: 'border-b-2 border-transparent relative pb-2 transition-colors',
      active: 'border-primary-600 text-primary-600 font-semibold',
      inactive: 'text-gray-500 hover:text-gray-700 hover:border-gray-300',
    },
  };

  const variantStyles = variants[variant];

  return (
    <div
      className={cn(
        'flex',
        variant === 'pills' ? 'gap-1' : 'gap-0',
        fullWidth && 'w-full',
        variantStyles.container,
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
              sizes[size],
              variantStyles.tab,
              isActive ? variantStyles.active : variantStyles.inactive,
              tab.disabled && 'opacity-50 cursor-not-allowed',
              fullWidth && 'flex-1'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-full',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-200 text-gray-700'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = 'Tabs';
