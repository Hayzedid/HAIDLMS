import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useToast } from "../components/ui/Toast";
import { notificationApi } from "../api/notification.api";
export function useNotifications() {
    const { subscribe, isConnected } = useWebSocket();
    const toast = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    // Load initial notifications
    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await notificationApi.getNotifications();
            // Handle both nested and direct response structures
            let notificationsList = [];
            const responseData = response.data;
            if (Array.isArray(responseData)) {
                notificationsList = responseData;
            }
            else if (responseData?.data && Array.isArray(responseData.data)) {
                notificationsList = responseData.data;
            }
            else if (responseData?.data?.notifications &&
                Array.isArray(responseData.data.notifications)) {
                notificationsList = responseData.data.notifications;
            }
            setNotifications(notificationsList);
            setUnreadCount(notificationsList.filter((n) => !n.read).length);
        }
        catch (error) {
            console.error("Failed to load notifications:", error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);
    // Subscribe to real-time notifications
    useEffect(() => {
        if (!isConnected)
            return;
        const unsubscribe = subscribe("notification", (notification) => {
            // Add notification to list
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            // Show toast notification
            const toastVariant = notification.type === "error"
                ? "error"
                : notification.type === "success"
                    ? "success"
                    : notification.type === "warning"
                        ? "warning"
                        : "info";
            toast[toastVariant](notification.title, notification.message);
        });
        return unsubscribe;
    }, [isConnected, subscribe, toast]);
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    }, []);
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        }
        catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    }, []);
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const notification = notifications.find((n) => n.id === notificationId);
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
            if (notification && !notification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }
        catch (error) {
            console.error("Failed to delete notification:", error);
        }
    }, [notifications]);
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);
    return {
        notifications,
        unreadCount,
        loading,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh: loadNotifications,
    };
}
