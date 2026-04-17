import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, Filter, Trash2, Settings, X, } from "lucide-react";
import apiClient from "../../api/client";
export const NotificationListPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;
    useEffect(() => {
        fetchNotifications();
    }, [filter, typeFilter, page]);
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = {
                limit,
                offset: (page - 1) * limit,
            };
            if (filter === "unread") {
                params.isRead = false;
            }
            if (typeFilter) {
                params.notificationType = typeFilter;
            }
            const response = await apiClient.get("/notifications", { params });
            if (response.data.success) {
                setNotifications(response.data.data);
                setTotal(response.data.total);
            }
        }
        catch (error) {
            console.error("Error fetching notifications:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const markAsRead = async (notificationId) => {
        try {
            await apiClient.put(`/notifications/${notificationId}/read`);
            setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n));
        }
        catch (error) {
            console.error("Error marking as read:", error);
        }
    };
    const markAllAsRead = async () => {
        try {
            await apiClient.put("/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        }
        catch (error) {
            console.error("Error marking all as read:", error);
        }
    };
    const deleteNotification = async (notificationId) => {
        try {
            await apiClient.delete(`/notifications/${notificationId}`);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            setTotal((prev) => prev - 1);
        }
        catch (error) {
            console.error("Error deleting notification:", error);
        }
    };
    const getNotificationIcon = (type) => {
        const iconMap = {
            forum_reply: "💬",
            badge_earned: "🏆",
            course_announcement: "📢",
            assignment_deadline: "⏰",
            grade_released: "📝",
            certificate_issued: "🎓",
            peer_review_received: "👥",
            progress_milestone: "🎯",
            system_test: "🧪",
        };
        return iconMap[type] || "🔔";
    };
    const getPriorityBadge = (priority) => {
        const badges = {
            urgent: "bg-red-100 text-red-800 border-red-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            normal: "bg-blue-100 text-blue-800 border-blue-200",
            low: "bg-gray-100 text-gray-800 border-gray-200",
        };
        return badges[priority] || badges.normal;
    };
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const totalPages = Math.ceil(total / limit);
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 flex items-center gap-3", children: [_jsx(Bell, { className: "text-indigo-600", size: 32 }), "Notifications"] }), _jsxs("p", { className: "mt-1 text-gray-600", children: [total, " total \u2022 ", unreadCount, " unread"] })] }), _jsxs(Link, { to: "/notifications/preferences", className: "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(Settings, { size: 18 }), "Preferences"] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200", children: [_jsx(Filter, { size: 18, className: "text-gray-500" }), _jsxs("select", { value: filter, onChange: (e) => {
                                                setFilter(e.target.value);
                                                setPage(1);
                                            }, className: "border-0 bg-transparent focus:ring-0 text-sm font-medium text-gray-700", children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "unread", children: "Unread" })] })] }), _jsxs("select", { value: typeFilter, onChange: (e) => {
                                        setTypeFilter(e.target.value);
                                        setPage(1);
                                    }, className: "px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500", children: [_jsx("option", { value: "", children: "All Types" }), _jsx("option", { value: "forum_reply", children: "Forum Replies" }), _jsx("option", { value: "badge_earned", children: "Badges Earned" }), _jsx("option", { value: "course_announcement", children: "Course Announcements" }), _jsx("option", { value: "assignment_deadline", children: "Assignment Deadlines" }), _jsx("option", { value: "grade_released", children: "Grades Released" }), _jsx("option", { value: "certificate_issued", children: "Certificates" }), _jsx("option", { value: "peer_review_received", children: "Peer Reviews" }), _jsx("option", { value: "progress_milestone", children: "Progress Milestones" })] }), unreadCount > 0 && (_jsxs("button", { onClick: markAllAsRead, className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm", children: [_jsx(CheckCheck, { size: 18 }), "Mark All Read"] })), typeFilter && (_jsxs("button", { onClick: () => setTypeFilter(""), className: "flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm", children: [_jsx(X, { size: 16 }), "Clear Filter"] }))] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) })) : notifications.length === 0 ? (_jsxs("div", { className: "bg-white rounded-lg shadow-sm p-12 text-center", children: [_jsx(Bell, { size: 64, className: "mx-auto mb-4 text-gray-300" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No notifications" }), _jsx("p", { className: "text-gray-600", children: filter === "unread"
                                ? "You're all caught up! No unread notifications."
                                : "You have no notifications yet." })] })) : (_jsx("div", { className: "space-y-3", children: notifications.map((notification) => (_jsx("div", { className: `bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${!notification.is_read
                            ? "border-indigo-200 bg-indigo-50/30"
                            : "border-gray-200"}`, children: _jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "text-4xl flex-shrink-0", children: getNotificationIcon(notification.notification_type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsx("h3", { className: `text-lg font-semibold text-gray-900 ${!notification.is_read ? "font-bold" : ""}`, children: notification.title }), !notification.is_read && (_jsx("span", { className: "w-2 h-2 bg-indigo-600 rounded-full" }))] }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: notification.message }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm text-gray-500", children: [_jsx("span", { children: formatTime(notification.created_at) }), notification.related_user_name && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["by ", notification.related_user_name] })] })), notification.related_course_title && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsx("span", { children: notification.related_course_title })] }))] })] }), _jsx("span", { className: `px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(notification.priority)}`, children: notification.priority })] }), _jsxs("div", { className: "flex items-center gap-3 mt-4", children: [notification.action_url && (_jsxs("a", { href: notification.action_url, onClick: () => !notification.is_read &&
                                                            markAsRead(notification.id), className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm", children: [notification.action_text || "View", " \u2192"] })), !notification.is_read && (_jsxs("button", { onClick: () => markAsRead(notification.id), className: "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm", children: [_jsx(Check, { size: 16 }), "Mark Read"] })), _jsxs("button", { onClick: () => deleteNotification(notification.id), className: "flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-sm", children: [_jsx(Trash2, { size: 16 }), "Delete"] })] })] })] }) }) }, notification.id))) })), totalPages > 1 && (_jsxs("div", { className: "mt-8 flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm", children: "Previous" }), _jsx("div", { className: "flex items-center gap-2", children: Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .map((p, idx, arr) => (_jsxs(React.Fragment, { children: [idx > 0 && arr[idx - 1] !== p - 1 && (_jsx("span", { className: "text-gray-400", children: "..." })), _jsx("button", { onClick: () => setPage(p), className: `px-4 py-2 rounded-lg font-medium text-sm ${page === p
                                            ? "bg-indigo-600 text-white"
                                            : "bg-white border border-gray-300 hover:bg-gray-50"}`, children: p })] }, p))) }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm", children: "Next" })] }))] }) }));
};
