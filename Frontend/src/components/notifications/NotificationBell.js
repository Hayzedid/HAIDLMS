import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { notificationApi } from "../../api/notification.api";
import NotificationDropdown from "./NotificationDropdown";
export default function NotificationBell({ token, onNotificationClick, }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wsRef = useRef(null);
    useEffect(() => {
        // Fetch initial unread count
        fetchUnreadCount();
        // Fetch initial notifications
        fetchNotifications();
        // Connect to WebSocket
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [token]);
    const fetchUnreadCount = async () => {
        try {
            const response = await notificationApi.getUnreadCount();
            setUnreadCount(response.data.data.count);
        }
        catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationApi.getNotifications({
                limit: 20,
                includeRead: false,
            });
            setNotifications(response.data.data.notifications);
        }
        catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const connectWebSocket = () => {
        const ws = notificationApi.connectNotificationWebSocket(token, (message) => {
            switch (message.type) {
                case "notification":
                    // Add new notification to the list
                    setNotifications((prev) => [message.data, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                    // Show browser notification if permission granted
                    if (Notification.permission === "granted") {
                        new Notification(message.data.subject || "New notification", {
                            body: message.data.body,
                            icon: "/logo.png",
                        });
                    }
                    break;
                case "unread_count":
                    setUnreadCount(message.data.count);
                    break;
                case "connected":
                    console.log("[NotificationBell] WebSocket connected");
                    break;
                case "error":
                    console.error("[NotificationBell] WebSocket error:", message.data);
                    break;
            }
        });
        wsRef.current = ws;
    };
    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications((prev) => prev.map((n) => n.id === notificationId
                ? { ...n, readAt: new Date().toISOString() }
                : n));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };
    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
            setUnreadCount(0);
        }
        catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };
    const handleDelete = async (notificationId) => {
        try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };
    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.readAt) {
            handleMarkAsRead(notification.id);
        }
        // Navigate to action URL if provided
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
        // Call parent handler
        if (onNotificationClick) {
            onNotificationClick(notification);
        }
        setIsOpen(false);
    };
    // Request browser notification permission
    const requestNotificationPermission = () => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    };
    useEffect(() => {
        requestNotificationPermission();
    }, []);
    return (_jsxs("div", { style: { position: "relative" }, children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), style: {
                    position: "relative",
                    padding: "8px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.2s",
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = "#f3f4f6"), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = "transparent"), children: [_jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), _jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })] }), unreadCount > 0 && (_jsx("span", { style: {
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "bold",
                            padding: "2px 5px",
                            borderRadius: "10px",
                            minWidth: "16px",
                            textAlign: "center",
                        }, children: unreadCount > 99 ? "99+" : unreadCount }))] }), isOpen && (_jsx(NotificationDropdown, { notifications: notifications, loading: loading, onClose: () => setIsOpen(false), onNotificationClick: handleNotificationClick, onMarkAsRead: handleMarkAsRead, onMarkAllAsRead: handleMarkAllAsRead, onDelete: handleDelete, onLoadMore: fetchNotifications }))] }));
}
