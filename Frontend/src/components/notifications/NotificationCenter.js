import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Check, CheckCheck, Trash2, Info, AlertCircle, CheckCircle, AlertTriangle, } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button, Spinner } from '../ui';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';
export const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { notifications, unreadCount, loading, isConnected, markAsRead, markAllAsRead, deleteNotification, } = useNotifications();
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return _jsx(CheckCircle, { className: "w-5 h-5 text-success-600" });
            case 'warning':
                return _jsx(AlertTriangle, { className: "w-5 h-5 text-warning-600" });
            case 'error':
                return _jsx(AlertCircle, { className: "w-5 h-5 text-danger-600" });
            default:
                return _jsx(Info, { className: "w-5 h-5 text-primary-600" });
        }
    };
    return (_jsxs("div", { ref: dropdownRef, className: "relative", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "relative p-2 rounded-lg hover:bg-gray-100 transition-colors", "aria-label": "Notifications", children: [_jsx(Bell, { className: "w-5 h-5 text-gray-700" }), !isConnected && (_jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-warning-500 rounded-full" })), unreadCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 bg-danger-500 text-white text-xs font-semibold rounded-full flex items-center justify-center", children: unreadCount > 99 ? '99+' : unreadCount }))] }), isOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Notifications" }), _jsx("button", { onClick: () => setIsOpen(false), className: "p-1 hover:bg-gray-100 rounded transition-colors", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] }), notifications.length > 0 && (_jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: markAllAsRead, disabled: unreadCount === 0, icon: _jsx(CheckCheck, { className: "w-4 h-4" }), children: "Mark all as read" }) }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx(Spinner, { size: "lg" }) })) : notifications.length === 0 ? (_jsxs("div", { className: "text-center p-8", children: [_jsx(Bell, { className: "w-12 h-12 text-gray-300 mx-auto mb-3" }), _jsx("p", { className: "text-gray-600 font-medium mb-1", children: "No notifications" }), _jsx("p", { className: "text-sm text-gray-500", children: "You're all caught up!" })] })) : (_jsx("div", { className: "divide-y divide-gray-100", children: notifications.map((notification) => (_jsx("div", { className: cn('p-4 hover:bg-gray-50 transition-colors relative', !notification.read && 'bg-primary-50/50'), children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon(notification.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2 mb-1", children: [_jsx("h4", { className: "font-semibold text-sm text-gray-900", children: notification.title }), !notification.read && (_jsx("div", { className: "w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1" }))] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: notification.message }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-gray-500", children: formatRelativeTime(new Date(notification.createdAt)) }), _jsxs("div", { className: "flex items-center gap-1", children: [!notification.read && (_jsx("button", { onClick: () => markAsRead(notification.id), className: "p-1 hover:bg-gray-200 rounded transition-colors", title: "Mark as read", children: _jsx(Check, { className: "w-4 h-4 text-gray-600" }) })), _jsx("button", { onClick: () => deleteNotification(notification.id), className: "p-1 hover:bg-gray-200 rounded transition-colors", title: "Delete", children: _jsx(Trash2, { className: "w-4 h-4 text-gray-600" }) })] })] }), notification.actionUrl && (_jsx(Link, { to: notification.actionUrl, onClick: () => {
                                                        markAsRead(notification.id);
                                                        setIsOpen(false);
                                                    }, className: "mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-block", children: "View Details \u2192" }))] })] }) }, notification.id))) })) }), notifications.length > 0 && (_jsx("div", { className: "p-3 border-t border-gray-200", children: _jsx(Link, { to: "/notifications", onClick: () => setIsOpen(false), className: "block text-center text-sm text-primary-600 hover:text-primary-700 font-medium", children: "View All Notifications" }) }))] }))] }));
};
