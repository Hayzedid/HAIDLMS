import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
import { Button } from './Button';
export const EmptyState = ({ icon: Icon, title, description, action, className, }) => {
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center py-12 px-4 text-center', className), children: [Icon && (_jsx("div", { className: "mb-4 p-4 bg-gray-100 rounded-full", children: _jsx(Icon, { className: "w-12 h-12 text-gray-400" }) })), _jsx("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: title }), description && (_jsx("p", { className: "text-gray-600 max-w-md mb-6", children: description })), action && (_jsx(Button, { onClick: action.onClick, children: action.label }))] }));
};
