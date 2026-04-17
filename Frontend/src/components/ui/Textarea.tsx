import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      className,
      fullWidth = false,
      disabled,
      showCharCount = false,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = React.useId();
    const currentLength = typeof value === 'string' ? value.length : 0;

    const baseStyles = 'block px-3 py-2.5 text-base border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 resize-vertical';

    const stateStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400';

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            className={cn(
              baseStyles,
              stateStyles,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-danger-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            {hint && !error && (
              <p className="text-sm text-gray-500">{hint}</p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p className={cn(
              'text-xs font-medium',
              currentLength >= maxLength ? 'text-danger-600' : 'text-gray-500'
            )}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
