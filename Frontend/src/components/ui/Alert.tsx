import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className,
}) => {
  const variants = {
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-900',
      icon: 'text-primary-600',
      defaultIcon: <Info className="w-5 h-5" />,
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-900',
      icon: 'text-success-600',
      defaultIcon: <CheckCircle className="w-5 h-5" />,
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-900',
      icon: 'text-warning-600',
      defaultIcon: <AlertCircle className="w-5 h-5" />,
    },
    danger: {
      container: 'bg-danger-50 border-danger-200 text-danger-900',
      icon: 'text-danger-600',
      defaultIcon: <XCircle className="w-5 h-5" />,
    },
  };

  const variantStyles = variants[variant];
  const displayIcon = icon || variantStyles.defaultIcon;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 border rounded-lg',
        variantStyles.container,
        className
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', variantStyles.icon)}>
        {displayIcon}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-semibold mb-1">{title}</h3>
        )}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors',
            variantStyles.icon
          )}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
