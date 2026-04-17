import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SkipLink } from '../accessibility';
import { cn } from '../../lib/utils';
export const AppLayout = ({ children, showSidebar = true, showFooter = true, maxWidth = '7xl', className, }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const maxWidthClasses = {
        full: 'max-w-full',
        '7xl': 'max-w-7xl',
        '6xl': 'max-w-6xl',
        '5xl': 'max-w-5xl',
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gray-50", children: [_jsx(SkipLink, { targetId: "main-content" }), _jsx(Navbar, { onMenuClick: () => setIsSidebarOpen(!isSidebarOpen), isSidebarOpen: isSidebarOpen }), _jsxs("div", { className: "flex flex-1 pt-16", children: [showSidebar && (_jsx(Sidebar, { isOpen: isSidebarOpen, onClose: () => setIsSidebarOpen(false) })), _jsx("main", { id: "main-content", className: cn('flex-1 transition-all duration-300', showSidebar && 'lg:ml-64', className), children: _jsx("div", { className: cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth]), children: children }) })] }), showFooter && _jsx(Footer, {})] }));
};
