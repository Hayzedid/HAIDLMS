import { useState, useEffect } from 'react';
import { notificationApi, Notification } from '../../api/notification.api';
import NotificationItem from '../../components/notifications/NotificationItem';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
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
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.readAt) {
      handleMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          Notifications
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Stay updated with your learning progress and activity
        </p>
      </div>

      {/* Filters and Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setFilter('all');
              setPage(0);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: filter === 'all' ? 'white' : '#374151',
              backgroundColor: filter === 'all' ? '#3b82f6' : 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            All ({total})
          </button>

          <button
            onClick={() => {
              setFilter('unread');
              setPage(0);
            }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: filter === 'unread' ? 'white' : '#374151',
              backgroundColor: filter === 'unread' ? '#3b82f6' : 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#3b82f6',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Mark all as read
            </button>
          )}

          <a
            href="/notifications/preferences"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ⚙️ Preferences
          </a>
        </div>
      </div>

      {/* Notifications List */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center' }}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 24px', opacity: 0.3, color: '#6b7280' }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
              No notifications
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You haven't received any notifications yet."}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
                onDelete={() => handleDelete(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: page === 0 ? '#9ca3af' : '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: page >= totalPages - 1 ? '#9ca3af' : '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
