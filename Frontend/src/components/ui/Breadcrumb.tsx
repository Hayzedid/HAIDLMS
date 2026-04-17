import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
  homeHref = '/',
  separator,
  className,
}) => {
  const allItems = showHome
    ? [{ label: 'Home', href: homeHref, icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center space-x-2 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Separator = separator || <ChevronRight className="w-4 h-4 text-gray-400" />;

          return (
            <li key={index} className="flex items-center space-x-2">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 transition-colors font-medium"
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  'flex items-center gap-1.5',
                  isLast ? 'text-gray-900 font-semibold' : 'text-gray-600'
                )}>
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </span>
              )}
              {!isLast && <span className="flex-shrink-0">{Separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
