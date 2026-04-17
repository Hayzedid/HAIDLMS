import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  message = 'Something went wrong while loading this section.',
}) => {
  return (
    <div className="p-8 text-center">
      <Alert variant="danger" className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Error Loading Content</h3>
            <p className="text-sm mb-4">{message}</p>
            {error && process.env.NODE_ENV === 'development' && (
              <p className="text-xs font-mono bg-danger-100 p-2 rounded">
                {error.message}
              </p>
            )}
          </div>
          {resetError && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetError}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
};
