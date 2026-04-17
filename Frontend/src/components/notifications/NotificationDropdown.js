import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import NotificationItem from './NotificationItem';
export default function NotificationDropdown({ notifications, loading, onClose, onNotificationClick, onMarkAsRead, onMarkAllAsRead, onDelete, onLoadMore, }) {
    const dropdownRef = useRef(null);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    const unreadNotifications = notifications.filter((n) => !n.readAt);
    return (_jsxs("div", { ref: dropdownRef, style: {
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
        }, children: [_jsxs("div", { style: {
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0, fontSize: '16px', fontWeight: 600 }, children: "Notifications" }), unreadNotifications.length > 0 && (_jsxs("p", { style: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }, children: [unreadNotifications.length, " unread"] }))] }), unreadNotifications.length > 0 && (_jsx("button", { onClick: onMarkAllAsRead, style: {
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#3b82f6',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = '#eff6ff'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: "Mark all as read" }))] }), _jsx("div", { style: {
                    flex: 1,
                    overflowY: 'auto',
                    maxHeight: '500px',
                }, children: loading && notifications.length === 0 ? (_jsx("div", { style: {
                        padding: '32px',
                        textAlign: 'center',
                        color: '#6b7280',
                    }, children: "Loading notifications..." })) : notifications.length === 0 ? (_jsxs("div", { style: {
                        padding: '48px 32px',
                        textAlign: 'center',
                        color: '#6b7280',
                    }, children: [_jsxs("svg", { width: "64", height: "64", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { margin: '0 auto 16px', opacity: 0.3 }, children: [_jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), _jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })] }), _jsx("p", { style: { margin: 0, fontSize: '14px', fontWeight: 500 }, children: "No notifications" }), _jsx("p", { style: { margin: '4px 0 0', fontSize: '12px' }, children: "You're all caught up!" })] })) : (_jsx("div", { children: notifications.map((notification) => (_jsx(NotificationItem, { notification: notification, onClick: () => onNotificationClick(notification), onMarkAsRead: () => onMarkAsRead(notification.id), onDelete: () => onDelete(notification.id) }, notification.id))) })) }), _jsx("div", { style: {
                    padding: '12px 16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                }, children: _jsx("a", { href: "/notifications", style: {
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#3b82f6',
                        textDecoration: 'none',
                    }, onClick: onClose, children: "View all notifications \u2192" }) })] }));
}
