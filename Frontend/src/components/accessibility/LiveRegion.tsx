import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number; // milliseconds
  className?: string;
}

/**
 * ARIA live region for announcing dynamic content changes to screen readers
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  clearAfter,
  className,
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {currentMessage}
    </div>
  );
};
