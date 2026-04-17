import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';

interface UseErrorHandlerOptions {
  defaultMessage?: string;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    defaultMessage = 'An error occurred. Please try again.',
    onError,
    showToast = true,
  } = options;

  const toast = useToast();
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);

  const handleError = useCallback(
    (err: Error | unknown, customMessage?: string) => {
      const error = err instanceof Error ? err : new Error(String(err));

      setError(error);
      setIsError(true);

      // Call custom error handler
      onError?.(error);

      // Show toast notification
      if (showToast) {
        const message = customMessage || error.message || defaultMessage;
        toast.error(message);
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error handled:', error);
      }

      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error tracking service
        // Sentry.captureException(error);
      }
    },
    [defaultMessage, onError, showToast, toast]
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const resetError = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    error,
    isError,
    handleError,
    clearError,
    resetError,
  };
}

// Helper to wrap async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  handleError: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }) as T;
}
