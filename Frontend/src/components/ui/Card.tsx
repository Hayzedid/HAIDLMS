import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'bg-white rounded-xl transition-all-normal';

    const variants = {
      default: 'border border-gray-200',
      bordered: 'border-2 border-gray-300',
      elevated: 'shadow-lg',
      interactive: 'border border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-md',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-xl font-bold text-gray-900', className)} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600 mt-1', className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';
