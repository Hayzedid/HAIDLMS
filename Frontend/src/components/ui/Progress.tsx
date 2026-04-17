import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showLabel && <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all-normal', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showLabel = true,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variants = {
    default: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all-slow', variants[variant])}
        />
      </svg>
      {showLabel && (
        <div className="absolute flex flex-col items-center">
          <span className={cn('text-3xl font-bold', variants[variant])}>
            {percentage.toFixed(0)}
          </span>
          <span className="text-xs text-gray-500 font-medium">Score</span>
        </div>
      )}
    </div>
  );
};
