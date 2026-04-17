import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
export const Breadcrumb = ({ items, showHome = true, homeHref = '/', separator, className, }) => {
    const allItems = showHome
        ? [{ label: 'Home', href: homeHref, icon: _jsx(Home, { className: "w-4 h-4" }) }, ...items]
        : items;
    return (_jsx("nav", { "aria-label": "Breadcrumb", className: cn('flex items-center', className), children: _jsx("ol", { className: "flex items-center space-x-2 text-sm", children: allItems.map((item, index) => {
                const isLast = index === allItems.length - 1;
                const Separator = separator || _jsx(ChevronRight, { className: "w-4 h-4 text-gray-400" });
                return (_jsxs("li", { className: "flex items-center space-x-2", children: [item.href && !isLast ? (_jsxs(Link, { to: item.href, className: "flex items-center gap-1.5 text-gray-600 hover:text-primary-600 transition-colors font-medium", children: [item.icon && _jsx("span", { children: item.icon }), item.label] })) : (_jsxs("span", { className: cn('flex items-center gap-1.5', isLast ? 'text-gray-900 font-semibold' : 'text-gray-600'), children: [item.icon && _jsx("span", { children: item.icon }), item.label] })), !isLast && _jsx("span", { className: "flex-shrink-0", children: Separator })] }, index));
            }) }) }));
};
Breadcrumb.displayName = 'Breadcrumb';
