import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size], className)} />
      {label && <p className="text-sm text-gray-600 animate-pulse">{label}</p>}
    </div>
  );
};

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="xl" label={label} />
    </div>
  );
};
