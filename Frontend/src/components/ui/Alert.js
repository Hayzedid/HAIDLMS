import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Alert = ({ variant = 'info', title, children, icon, onClose, className, }) => {
    const variants = {
        info: {
            container: 'bg-primary-50 border-primary-200 text-primary-900',
            icon: 'text-primary-600',
            defaultIcon: _jsx(Info, { className: "w-5 h-5" }),
        },
        success: {
            container: 'bg-success-50 border-success-200 text-success-900',
            icon: 'text-success-600',
            defaultIcon: _jsx(CheckCircle, { className: "w-5 h-5" }),
        },
        warning: {
            container: 'bg-warning-50 border-warning-200 text-warning-900',
            icon: 'text-warning-600',
            defaultIcon: _jsx(AlertCircle, { className: "w-5 h-5" }),
        },
        danger: {
            container: 'bg-danger-50 border-danger-200 text-danger-900',
            icon: 'text-danger-600',
            defaultIcon: _jsx(XCircle, { className: "w-5 h-5" }),
        },
    };
    const variantStyles = variants[variant];
    const displayIcon = icon || variantStyles.defaultIcon;
    return (_jsxs("div", { role: "alert", className: cn('flex gap-3 p-4 border rounded-lg', variantStyles.container, className), children: [_jsx("div", { className: cn('flex-shrink-0 mt-0.5', variantStyles.icon), children: displayIcon }), _jsxs("div", { className: "flex-1 min-w-0", children: [title && (_jsx("h3", { className: "font-semibold mb-1", children: title })), _jsx("div", { className: "text-sm leading-relaxed", children: children })] }), onClose && (_jsx("button", { onClick: onClose, className: cn('flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors', variantStyles.icon), "aria-label": "Close alert", children: _jsx(X, { className: "w-4 h-4" }) }))] }));
};
Alert.displayName = 'Alert';
