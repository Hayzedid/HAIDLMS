import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Select = React.forwardRef(({ label, error, hint, options, placeholder, className, fullWidth = false, disabled, ...props }, ref) => {
    const selectId = React.useId();
    const baseStyles = 'block appearance-none px-3 py-2.5 pr-10 text-base border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 bg-white cursor-pointer';
    const stateStyles = error
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-200'
        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400';
    return (_jsxs("div", { className: cn('flex flex-col gap-1.5', fullWidth && 'w-full'), children: [label && (_jsxs("label", { htmlFor: selectId, className: "text-sm font-medium text-gray-700", children: [label, props.required && _jsx("span", { className: "text-danger-500 ml-1", children: "*" })] })), _jsxs("div", { className: "relative", children: [_jsxs("select", { ref: ref, id: selectId, disabled: disabled, className: cn(baseStyles, stateStyles, fullWidth && 'w-full', className), ...props, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), options.map((option) => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }), _jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none", children: error ? (_jsx(AlertCircle, { className: "w-5 h-5 text-danger-500" })) : (_jsx(ChevronDown, { className: "w-5 h-5 text-gray-400" })) })] }), error && (_jsx("p", { className: "text-sm text-danger-600 flex items-center gap-1", children: error })), hint && !error && (_jsx("p", { className: "text-sm text-gray-500", children: hint }))] }));
});
Select.displayName = 'Select';
