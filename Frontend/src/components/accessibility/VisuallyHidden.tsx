import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  focusable?: boolean;
}

/**
 * Hides content visually but keeps it accessible to screen readers
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  focusable = false,
}) => {
  return (
    <span className={focusable ? 'sr-only-focusable' : 'sr-only'}>
      {children}
    </span>
  );
};
