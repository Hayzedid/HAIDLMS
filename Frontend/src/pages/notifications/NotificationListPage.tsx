import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import apiClient from "../../api/client";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  related_user_name?: string;
  related_course_title?: string;
}

export const NotificationListPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
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
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
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

  const getPriorityBadge = (priority: string) => {
    const badges = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  const formatTime = (timestamp: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="text-indigo-600" size={32} />
                Notifications
              </h1>
              <p className="mt-1 text-gray-600">
                {total} total • {unreadCount} unread
              </p>
            </div>
            <Link
              to="/notifications/preferences"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings size={18} />
              Preferences
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as "all" | "unread");
                  setPage(1);
                }}
                className="border-0 bg-transparent focus:ring-0 text-sm font-medium text-gray-700"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="forum_reply">Forum Replies</option>
              <option value="badge_earned">Badges Earned</option>
              <option value="course_announcement">Course Announcements</option>
              <option value="assignment_deadline">Assignment Deadlines</option>
              <option value="grade_released">Grades Released</option>
              <option value="certificate_issued">Certificates</option>
              <option value="peer_review_received">Peer Reviews</option>
              <option value="progress_milestone">Progress Milestones</option>
            </select>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                <CheckCheck size={18} />
                Mark All Read
              </button>
            )}

            {typeFilter && (
              <button
                onClick={() => setTypeFilter("")}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <X size={16} />
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "You have no notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
                  !notification.is_read
                    ? "border-indigo-200 bg-indigo-50/30"
                    : "border-gray-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-4xl flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3
                              className={`text-lg font-semibold text-gray-900 ${
                                !notification.is_read ? "font-bold" : ""
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>{formatTime(notification.created_at)}</span>
                            {notification.related_user_name && (
                              <>
                                <span>•</span>
                                <span>by {notification.related_user_name}</span>
                              </>
                            )}
                            {notification.related_course_title && (
                              <>
                                <span>•</span>
                                <span>{notification.related_course_title}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Priority Badge */}
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(
                            notification.priority,
                          )}`}
                        >
                          {notification.priority}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            onClick={() =>
                              !notification.is_read &&
                              markAsRead(notification.id)
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                          >
                            {notification.action_text || "View"} →
                          </a>
                        )}

                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                          >
                            <Check size={16} />
                            Mark Read
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium text-sm"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm ${
                        page === p
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
