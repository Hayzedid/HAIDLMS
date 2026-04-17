import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();

    const baseStyles = 'block px-3 py-2.5 text-base border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50';

    const stateStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400';

    const paddingStyles = cn(
      leftIcon && 'pl-10',
      rightIcon && !error && 'pr-10',
      error && 'pr-10'
    );

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              baseStyles,
              stateStyles,
              paddingStyles,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          {!error && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-danger-600 flex items-center gap-1">
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
