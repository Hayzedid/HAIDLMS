import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
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
            return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsx(Card, { className: "max-w-2xl w-full", children: _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx("div", { className: "w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mb-6", children: _jsx(AlertTriangle, { className: "w-10 h-10 text-danger-600" }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-3", children: "Oops! Something went wrong" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md", children: "We're sorry for the inconvenience. An unexpected error has occurred. Our team has been notified and we're working to fix it." }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs("div", { className: "w-full mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-left overflow-auto", children: [_jsx("p", { className: "font-semibold text-danger-900 mb-2", children: "Error Details:" }), _jsx("pre", { className: "text-sm text-danger-800 whitespace-pre-wrap break-words", children: this.state.error.toString() }), this.state.errorInfo && (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-semibold text-danger-900 mt-4 mb-2", children: "Component Stack:" }), _jsx("pre", { className: "text-xs text-danger-700 whitespace-pre-wrap break-words max-h-40 overflow-y-auto", children: this.state.errorInfo.componentStack })] }))] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto", children: [_jsx(Button, { variant: "primary", size: "lg", onClick: this.handleReset, icon: _jsx(RefreshCw, { className: "w-5 h-5" }), fullWidth: true, children: "Try Again" }), _jsx(Button, { variant: "secondary", size: "lg", onClick: this.handleGoHome, icon: _jsx(Home, { className: "w-5 h-5" }), fullWidth: true, children: "Go Home" })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-6", children: ["If the problem persists, please", ' ', _jsx("a", { href: "/support", className: "text-primary-600 hover:underline", children: "contact support" })] })] }) }) }) }));
        }
        return this.props.children;
    }
}
// HOC to wrap components with error boundary
export function withErrorBoundary(Component, fallback) {
    return function WithErrorBoundaryComponent(props) {
        return (_jsx(ErrorBoundary, { fallback: fallback, children: _jsx(Component, { ...props }) }));
    };
}
