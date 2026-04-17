import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
const ToastContext = createContext(undefined);
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((toast) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);
        // Auto remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);
    const success = useCallback((title, message) => {
        showToast({ type: 'success', title, message });
    }, [showToast]);
    const error = useCallback((title, message) => {
        showToast({ type: 'error', title, message });
    }, [showToast]);
    const warning = useCallback((title, message) => {
        showToast({ type: 'warning', title, message });
    }, [showToast]);
    const info = useCallback((title, message) => {
        showToast({ type: 'info', title, message });
    }, [showToast]);
    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    return (_jsxs(ToastContext.Provider, { value: { showToast, success, error, warning, info }, children: [children, _jsx(ToastContainer, { toasts: toasts, onRemove: removeToast })] }));
};
const ToastContainer = ({ toasts, onRemove }) => {
    return (_jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md", children: toasts.map((toast) => (_jsx(ToastItem, { toast: toast, onRemove: onRemove }, toast.id))) }));
};
const ToastItem = ({ toast, onRemove }) => {
    const icons = {
        success: _jsx(CheckCircle, { className: "w-5 h-5" }),
        error: _jsx(XCircle, { className: "w-5 h-5" }),
        warning: _jsx(AlertCircle, { className: "w-5 h-5" }),
        info: _jsx(Info, { className: "w-5 h-5" }),
    };
    const styles = {
        success: 'bg-success-50 border-success-500 text-success-900',
        error: 'bg-danger-50 border-danger-500 text-danger-900',
        warning: 'bg-warning-50 border-warning-500 text-warning-900',
        info: 'bg-blue-50 border-blue-500 text-blue-900',
    };
    const iconColors = {
        success: 'text-success-600',
        error: 'text-danger-600',
        warning: 'text-warning-600',
        info: 'text-blue-600',
    };
    return (_jsxs("div", { className: cn('flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg backdrop-blur-sm animate-slide-in-right', styles[toast.type]), children: [_jsx("div", { className: iconColors[toast.type], children: icons[toast.type] }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold", children: toast.title }), toast.message && _jsx("p", { className: "text-sm mt-1 opacity-90", children: toast.message })] }), _jsx("button", { onClick: () => onRemove(toast.id), className: "text-current opacity-50 hover:opacity-100 transition-opacity", "aria-label": "Dismiss", children: _jsx(X, { className: "w-4 h-4" }) })] }));
};
