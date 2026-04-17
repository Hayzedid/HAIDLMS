import { Router } from 'express';
import { BadgeController } from '../controllers/badge.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const controller = new BadgeController();

// Public routes (no auth required)
router.get('/verify/:badgeHash', controller.verifyBadge);
router.get('/json/:badgeHash', controller.getOpenBadgeJson);
router.get('/keys/:keyId', controller.getPublicKey);

// User routes (authentication required)
router.get('/users/:userId', authenticate, controller.getUserBadges);
router.get('/:badgeHash/linkedin-share', authenticate, controller.generateLinkedInShareUrl);
router.post('/:badgeHash/linkedin-share', authenticate, controller.trackLinkedInShare);

// Instructor/Admin routes
router.post('/issue', authenticate, authorize(['instructor', 'admin']), controller.issueBadge);
router.post('/batch-issue', authenticate, authorize(['instructor', 'admin']), controller.batchIssueBadges);
router.post('/:badgeHash/revoke', authenticate, authorize(['admin']), controller.revokeBadge);
router.get('/statistics/:badgeClassId?', authenticate, authorize(['instructor', 'admin']), controller.getBadgeStatistics);

// Admin only routes
router.post('/keys/generate', authenticate, authorize(['admin']), controller.generateKeyPair);

export default router;
