import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = React.useId();

    const baseStyles = 'block appearance-none px-3 py-2.5 pr-10 text-base border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 bg-white cursor-pointer';

    const stateStyles = error
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400';

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              baseStyles,
              stateStyles,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error ? (
              <AlertCircle className="w-5 h-5 text-danger-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
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

Select.displayName = 'Select';
