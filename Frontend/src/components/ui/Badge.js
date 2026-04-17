import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
export const Badge = React.forwardRef(({ children, className, variant = "default", size = "md", dot = false, removable = false, onRemove, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-1.5 font-semibold rounded-full transition-all-fast";
    const variants = {
        neutral: "bg-gray-100 text-gray-700",
        default: "bg-gray-100 text-gray-800",
        primary: "bg-primary-100 text-primary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        danger: "bg-danger-100 text-danger-800",
        info: "bg-blue-100 text-blue-800",
    };
    const sizes = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
    };
    const dotColors = {
        default: "bg-gray-500",
        primary: "bg-primary-500",
        success: "bg-success-500",
        warning: "bg-warning-500",
        danger: "bg-danger-500",
        info: "bg-blue-500",
        neutral: "bg-gray-400",
    };
    return (_jsxs("span", { ref: ref, className: cn(baseStyles, variants[variant], sizes[size], className), ...props, children: [dot && (_jsx("span", { className: cn("w-2 h-2 rounded-full animate-pulse-slow", dotColors[variant]) })), children, removable && onRemove && (_jsx("button", { onClick: onRemove, className: "hover:bg-black/10 rounded-full p-0.5 transition-colors", "aria-label": "Remove", children: _jsx(X, { className: "w-3 h-3" }) }))] }));
});
Badge.displayName = "Badge";
