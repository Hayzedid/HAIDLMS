import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notification.api';
import NotificationItem from '../../components/notifications/NotificationItem';
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;
    useEffect(() => {
        loadNotifications();
    }, [filter, page]);
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationApi.getNotifications({
                limit: pageSize,
                offset: page * pageSize,
                includeRead: filter === 'all',
            });
            setNotifications(response.data.data.notifications);
            setTotal(response.data.data.total);
        }
        catch (error) {
            console.error('Failed to load notifications:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n));
        }
        catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };
    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
        }
        catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };
    const handleDelete = async (notificationId) => {
        try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            setTotal((prev) => prev - 1);
        }
        catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };
    const handleNotificationClick = (notification) => {
        if (!notification.readAt) {
            handleMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };
    const unreadCount = notifications.filter((n) => !n.readAt).length;
    const totalPages = Math.ceil(total / pageSize);
    return (_jsxs("div", { style: { maxWidth: '1200px', margin: '0 auto', padding: '24px' }, children: [_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h1", { style: { fontSize: '32px', fontWeight: 700, marginBottom: '8px' }, children: "Notifications" }), _jsx("p", { style: { fontSize: '16px', color: '#6b7280' }, children: "Stay updated with your learning progress and activity" })] }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                }, children: [_jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsxs("button", { onClick: () => {
                                    setFilter('all');
                                    setPage(0);
                                }, style: {
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: filter === 'all' ? 'white' : '#374151',
                                    backgroundColor: filter === 'all' ? '#3b82f6' : 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }, children: ["All (", total, ")"] }), _jsxs("button", { onClick: () => {
                                    setFilter('unread');
                                    setPage(0);
                                }, style: {
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: filter === 'unread' ? 'white' : '#374151',
                                    backgroundColor: filter === 'unread' ? '#3b82f6' : 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }, children: ["Unread (", unreadCount, ")"] })] }), _jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [unreadCount > 0 && (_jsx("button", { onClick: handleMarkAllAsRead, style: {
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#3b82f6',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }, children: "Mark all as read" })), _jsx("a", { href: "/notifications/preferences", style: {
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#374151',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                }, children: "\u2699\uFE0F Preferences" })] })] }), _jsx("div", { style: {
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }, children: loading ? (_jsx("div", { style: { padding: '48px', textAlign: 'center', color: '#6b7280' }, children: "Loading notifications..." })) : notifications.length === 0 ? (_jsxs("div", { style: { padding: '64px 32px', textAlign: 'center' }, children: [_jsxs("svg", { width: "80", height: "80", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", style: { margin: '0 auto 24px', opacity: 0.3, color: '#6b7280' }, children: [_jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), _jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })] }), _jsx("h3", { style: { fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }, children: "No notifications" }), _jsx("p", { style: { fontSize: '14px', color: '#6b7280' }, children: filter === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : "You haven't received any notifications yet." })] })) : (_jsx("div", { children: notifications.map((notification) => (_jsx(NotificationItem, { notification: notification, onClick: () => handleNotificationClick(notification), onMarkAsRead: () => handleMarkAsRead(notification.id), onDelete: () => handleDelete(notification.id) }, notification.id))) })) }), totalPages > 1 && (_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '24px',
                }, children: [_jsx("button", { onClick: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0, style: {
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: page === 0 ? '#9ca3af' : '#374151',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: page === 0 ? 'not-allowed' : 'pointer',
                        }, children: "\u2190 Previous" }), _jsxs("span", { style: { fontSize: '14px', color: '#6b7280' }, children: ["Page ", page + 1, " of ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages - 1, p + 1)), disabled: page >= totalPages - 1, style: {
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: page >= totalPages - 1 ? '#9ca3af' : '#374151',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                        }, children: "Next \u2192" })] }))] }));
}
