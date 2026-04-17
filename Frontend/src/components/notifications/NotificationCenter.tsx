import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button, Badge, Spinner } from '../ui';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-danger-600" />;
      default:
        return <Info className="w-5 h-5 text-primary-600" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />

        {/* Connection Status Indicator */}
        {!isConnected && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-warning-500 rounded-full"></span>
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 bg-danger-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  icon={<CheckCheck className="w-4 h-4" />}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">No notifications</p>
                <p className="text-sm text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors relative',
                      !notification.read && 'bg-primary-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(new Date(notification.createdAt))}
                          </span>

                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        {/* Action Link */}
                        {notification.actionUrl && (
                          <Link
                            to={notification.actionUrl}
                            onClick={() => {
                              markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-block"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
