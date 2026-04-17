import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Modal = ({ isOpen, onClose, title, description, children, size = 'md', closeOnBackdrop = true, showCloseButton = true, footer, }) => {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4',
    };
    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in", onClick: handleBackdropClick, children: _jsxs("div", { className: cn('bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in', sizes[size]), children: [(title || showCloseButton) && (_jsxs("div", { className: "flex items-start justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex-1", children: [title && (_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: title })), description && (_jsx("p", { className: "text-sm text-gray-600 mt-1", children: description }))] }), showCloseButton && (_jsx("button", { onClick: onClose, className: "ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5" }) }))] })), _jsx("div", { className: "p-6 overflow-y-auto custom-scrollbar", style: { maxHeight: 'calc(90vh - 200px)' }, children: children }), footer && (_jsx("div", { className: "flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50", children: footer }))] }) }));
};
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', loading = false, }) => {
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: title, size: "sm", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: onClose, disabled: loading, className: "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors disabled:opacity-50", children: cancelText }), _jsx("button", { onClick: onConfirm, disabled: loading, className: cn('px-4 py-2 text-white rounded-lg font-semibold transition-all disabled:opacity-50', variant === 'danger'
                        ? 'bg-danger-600 hover:bg-danger-700'
                        : 'bg-primary-600 hover:bg-primary-700'), children: loading ? 'Processing...' : confirmText })] }), children: _jsx("p", { className: "text-gray-700", children: message }) }));
};
