import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
export const ErrorFallback = ({ error, resetError, message = 'Something went wrong while loading this section.', }) => {
    return (_jsx("div", { className: "p-8 text-center", children: _jsx(Alert, { variant: "danger", className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx(AlertCircle, { className: "w-12 h-12" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-2", children: "Error Loading Content" }), _jsx("p", { className: "text-sm mb-4", children: message }), error && process.env.NODE_ENV === 'development' && (_jsx("p", { className: "text-xs font-mono bg-danger-100 p-2 rounded", children: error.message }))] }), resetError && (_jsx(Button, { variant: "secondary", size: "sm", onClick: resetError, icon: _jsx(RefreshCw, { className: "w-4 h-4" }), children: "Try Again" }))] }) }) }));
};
