import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Textarea = React.forwardRef(({ label, error, hint, className, fullWidth = false, disabled, showCharCount = false, maxLength, value, ...props }, ref) => {
    const textareaId = React.useId();
    const currentLength = typeof value === 'string' ? value.length : 0;
    const baseStyles = 'block px-3 py-2.5 text-base border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 resize-vertical';
    const stateStyles = error
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200'
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400';
    return (_jsxs("div", { className: cn('flex flex-col gap-1.5', fullWidth && 'w-full'), children: [label && (_jsxs("label", { htmlFor: textareaId, className: "text-sm font-medium text-gray-700", children: [label, props.required && _jsx("span", { className: "text-danger-500 ml-1", children: "*" })] })), _jsx("div", { className: "relative", children: _jsx("textarea", { ref: ref, id: textareaId, disabled: disabled, maxLength: maxLength, value: value, className: cn(baseStyles, stateStyles, fullWidth && 'w-full', className), ...props }) }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex-1", children: [error && (_jsxs("p", { className: "text-sm text-danger-600 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), error] })), hint && !error && (_jsx("p", { className: "text-sm text-gray-500", children: hint }))] }), showCharCount && maxLength && (_jsxs("p", { className: cn('text-xs font-medium', currentLength >= maxLength ? 'text-danger-600' : 'text-gray-500'), children: [currentLength, "/", maxLength] }))] })] }));
});
Textarea.displayName = 'Textarea';
