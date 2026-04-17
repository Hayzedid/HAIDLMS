import { Router } from 'express';
import {
  sendNotification,
  broadcastNotification,
  getNotification,
  cancelNotification,
  getInAppNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  getStats,
} from '../controllers/notification.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints (for internal service-to-service communication)
router.post('/send', sendNotification);
router.post('/broadcast', broadcastNotification);

// Protected endpoints (require authentication)
router.use(authenticateToken);

router.get('/in-app', getInAppNotifications);
router.get('/in-app/unread-count', getUnreadCount);
router.post('/in-app/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

router.get('/:id', getNotification);
router.post('/:id/cancel', cancelNotification);

// Admin endpoints
router.get('/stats', requireAdmin, getStats);

export default router;
