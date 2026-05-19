import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { contentVersioningController } from '../controllers/content-versioning.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Content Versioning
 *   description: Content versioning and publishing workflow
 */

router.post('/versions', authenticate, contentVersioningController.createVersion.bind(contentVersioningController));
router.get('/versions/:contentType/:contentId', authenticate, contentVersioningController.getVersions.bind(contentVersioningController));
router.get('/versions/:versionId', authenticate, contentVersioningController.getVersion.bind(contentVersioningController));
router.get('/versions/:contentType/:contentId/current', authenticate, contentVersioningController.getCurrentVersion.bind(contentVersioningController));
router.post('/versions/:versionId/publish', authenticate, contentVersioningController.publishVersion.bind(contentVersioningController));
router.post('/versions/:contentType/:contentId/rollback/:versionId', authenticate, contentVersioningController.rollbackVersion.bind(contentVersioningController));
router.post('/approvals', authenticate, contentVersioningController.requestApproval.bind(contentVersioningController));
router.get('/approvals', authenticate, contentVersioningController.getApprovals.bind(contentVersioningController));
router.put('/approvals/:approvalId', authenticate, contentVersioningController.reviewApproval.bind(contentVersioningController));
router.post('/locks/:contentType/:contentId', authenticate, contentVersioningController.lockContent.bind(contentVersioningController));
router.delete('/locks/:contentType/:contentId', authenticate, contentVersioningController.unlockContent.bind(contentVersioningController));
router.post('/compare/:contentType/:contentId', authenticate, contentVersioningController.compareVersions.bind(contentVersioningController));

export default router;
