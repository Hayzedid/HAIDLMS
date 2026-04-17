import { useEffect, useRef } from 'react';
import { Notification } from '../../api/notification.api';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (notificationId: string) => void;
  onLoadMore: () => void;
}

export default function NotificationDropdown({
  notifications,
  loading,
  onClose,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const unreadNotifications = notifications.filter((n) => !n.readAt);

  return (
    <div
      ref={dropdownRef}
      style={{
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
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Notifications
          </h3>
          {unreadNotifications.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
              {unreadNotifications.length} unread
            </p>
          )}
        </div>

        {unreadNotifications.length > 0 && (
          <button
            onClick={onMarkAllAsRead}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#3b82f6',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '500px',
        }}
      >
        {loading && notifications.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: '48px 32px',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 16px', opacity: 0.3 }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
              No notifications
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => onNotificationClick(notification)}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
                onDelete={() => onDelete(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
        }}
      >
        <a
          href="/notifications"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#3b82f6',
            textDecoration: 'none',
          }}
          onClick={onClose}
        >
          View all notifications →
        </a>
      </div>
    </div>
  );
}
