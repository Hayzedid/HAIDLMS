import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function NotificationItem({ notification, onClick, onMarkAsRead, onDelete, }) {
    const isUnread = !notification.readAt;
    const getIcon = (type) => {
        switch (type) {
            case 'course_enrollment':
                return '📚';
            case 'lesson_completed':
                return '✅';
            case 'certificate_issued':
                return '🎓';
            case 'assignment_due':
                return '⏰';
            case 'payment_success':
                return '💰';
            case 'payment_failed':
                return '❌';
            case 'comment_reply':
                return '💬';
            case 'course_update':
                return '📢';
            case 'spaced_repetition':
                return '🔄';
            case 'system_alert':
                return '🚨';
            default:
                return '🔔';
        }
    };
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60)
            return 'Just now';
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400)
            return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800)
            return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };
    return (_jsxs("div", { style: {
            padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: isUnread ? '#eff6ff' : 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            position: 'relative',
        }, onMouseEnter: (e) => {
            if (!isUnread)
                e.currentTarget.style.backgroundColor = '#f9fafb';
        }, onMouseLeave: (e) => {
            if (!isUnread)
                e.currentTarget.style.backgroundColor = 'white';
        }, onClick: onClick, children: [_jsxs("div", { style: { display: 'flex', gap: '12px' }, children: [_jsx("div", { style: {
                            fontSize: '24px',
                            lineHeight: 1,
                        }, children: getIcon(notification.type) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [notification.subject && (_jsx("div", { style: {
                                    fontSize: '14px',
                                    fontWeight: isUnread ? 600 : 500,
                                    color: '#111827',
                                    marginBottom: '4px',
                                }, children: notification.subject })), _jsx("div", { style: {
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    lineHeight: '1.4',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }, children: notification.body }), _jsx("div", { style: {
                                    fontSize: '11px',
                                    color: '#9ca3af',
                                    marginTop: '4px',
                                }, children: formatTimeAgo(notification.createdAt) })] }), isUnread && (_jsx("div", { style: {
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '6px',
                        } }))] }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '4px',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                }, className: "notification-actions", onMouseEnter: (e) => (e.currentTarget.style.opacity = '1'), children: [isUnread && (_jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            onMarkAsRead();
                        }, style: {
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#3b82f6',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, title: "Mark as read", children: "\u2713" })), _jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            onDelete();
                        }, style: {
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#ef4444',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }, title: "Delete", children: "\u00D7" })] }), _jsx("style", { children: `
          div:hover .notification-actions {
            opacity: 1;
          }
        ` })] }));
}
