import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Error Icon */}
                <div className="w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-danger-600" />
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-6 max-w-md">
                  We're sorry for the inconvenience. An unexpected error has occurred.
                  Our team has been notified and we're working to fix it.
                </p>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="w-full mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-left overflow-auto">
                    <p className="font-semibold text-danger-900 mb-2">Error Details:</p>
                    <pre className="text-sm text-danger-800 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <>
                        <p className="font-semibold text-danger-900 mt-4 mb-2">Component Stack:</p>
                        <pre className="text-xs text-danger-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={this.handleReset}
                    icon={<RefreshCw className="w-5 h-5" />}
                    fullWidth
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={this.handleGoHome}
                    icon={<Home className="w-5 h-5" />}
                    fullWidth
                  >
                    Go Home
                  </Button>
                </div>

                {/* Additional Help */}
                <p className="text-sm text-gray-500 mt-6">
                  If the problem persists, please{' '}
                  <a href="/support" className="text-primary-600 hover:underline">
                    contact support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
