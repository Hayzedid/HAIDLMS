import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
export const Spinner = ({ size = 'md', className, label }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center gap-3", children: [_jsx(Loader2, { className: cn('animate-spin text-primary-600', sizes[size], className) }), label && _jsx("p", { className: "text-sm text-gray-600 animate-pulse", children: label })] }));
};
export const FullPageSpinner = ({ label = 'Loading...' }) => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsx(Spinner, { size: "xl", label: label }) }));
};
