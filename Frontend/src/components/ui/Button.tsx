import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all-normal focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 active:scale-95 shadow-md hover:shadow-lg',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 active:scale-95',
      danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 active:scale-95 shadow-md hover:shadow-lg',
      success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 active:scale-95 shadow-md hover:shadow-lg',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
      link: 'bg-transparent hover:underline text-primary-600 hover:text-primary-700 focus:ring-primary-500 px-0',
    };

    const sizes = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';
