import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
export const Progress = ({ value, max = 100, size = 'md', variant = 'default', showLabel = false, label, className, }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const sizes = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };
    const variants = {
        default: 'bg-primary-600',
        success: 'bg-success-600',
        warning: 'bg-warning-600',
        danger: 'bg-danger-600',
    };
    return (_jsxs("div", { className: cn('w-full', className), children: [(showLabel || label) && (_jsxs("div", { className: "flex items-center justify-between mb-1", children: [label && _jsx("span", { className: "text-sm font-medium text-gray-700", children: label }), showLabel && _jsxs("span", { className: "text-sm font-semibold text-gray-900", children: [percentage.toFixed(0), "%"] })] })), _jsx("div", { className: cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size]), children: _jsx("div", { className: cn('h-full rounded-full transition-all-normal', variants[variant]), style: { width: `${percentage}%` } }) })] }));
};
export const CircularProgress = ({ value, max = 100, size = 120, strokeWidth = 8, variant = 'default', showLabel = true, className, }) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const variants = {
        default: 'text-primary-600',
        success: 'text-success-600',
        warning: 'text-warning-600',
        danger: 'text-danger-600',
    };
    return (_jsxs("div", { className: cn('relative inline-flex items-center justify-center', className), children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: radius, stroke: "currentColor", strokeWidth: strokeWidth, fill: "none", className: "text-gray-200" }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, stroke: "currentColor", strokeWidth: strokeWidth, fill: "none", strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", className: cn('transition-all-slow', variants[variant]) })] }), showLabel && (_jsxs("div", { className: "absolute flex flex-col items-center", children: [_jsx("span", { className: cn('text-3xl font-bold', variants[variant]), children: percentage.toFixed(0) }), _jsx("span", { className: "text-xs text-gray-500 font-medium", children: "Score" })] }))] }));
};
