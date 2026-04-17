import { Router } from 'express';
import { certificatesController } from '../controllers/certificates.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Certificate and digital badge management endpoints
 */

// All certificate routes require authentication (except verification)
router.use(authenticate);

// ========================================
// CERTIFICATE TEMPLATES
// ========================================

/**
 * @swagger
 * /api/certificates/templates:
 *   post:
 *     summary: Create a certificate template
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - layout
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               templateType:
 *                 type: string
 *                 enum: [completion, achievement, participation, excellence, custom]
 *               layout:
 *                 type: object
 *               backgroundImageUrl:
 *                 type: string
 *               titleText:
 *                 type: string
 *               bodyTemplate:
 *                 type: string
 *               organizationLogoUrl:
 *                 type: string
 *               signatureImages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Certificate template created successfully
 */
router.post('/templates', certificatesController.createCertificateTemplate.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/templates:
 *   get:
 *     summary: List certificate templates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Certificate templates retrieved successfully
 */
router.get('/templates', certificatesController.listCertificateTemplates.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/templates/{id}:
 *   get:
 *     summary: Get certificate template details
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate template retrieved successfully
 */
router.get('/templates/:id', certificatesController.getCertificateTemplate.bind(certificatesController));

router.put('/templates/:id', certificatesController.updateCertificateTemplate.bind(certificatesController));
router.delete('/templates/:id', certificatesController.deleteCertificateTemplate.bind(certificatesController));

// ========================================
// ISSUE CERTIFICATES
// ========================================

/**
 * @swagger
 * /api/certificates/issue:
 *   post:
 *     summary: Issue a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - userId
 *               - recipientName
 *             properties:
 *               templateId:
 *                 type: string
 *               userId:
 *                 type: string
 *               recipientName:
 *                 type: string
 *               recipientEmail:
 *                 type: string
 *               courseId:
 *                 type: string
 *               courseName:
 *                 type: string
 *               completionDate:
 *                 type: string
 *                 format: date
 *               finalGrade:
 *                 type: number
 *               hoursCompleted:
 *                 type: number
 *               skillsEarned:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 */
router.post('/issue', certificatesController.issueCertificate.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/mine:
 *   get:
 *     summary: Get my certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User certificates retrieved successfully
 */
router.get('/mine', certificatesController.listUserCertificates.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/{id}:
 *   get:
 *     summary: Get certificate details
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate retrieved successfully
 */
router.get('/:id', certificatesController.getCertificate.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/{id}/revoke:
 *   post:
 *     summary: Revoke a certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 */
router.post('/:id/revoke', certificatesController.revokeCertificate.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/{id}/share:
 *   post:
 *     summary: Share certificate on social media
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [linkedin, twitter, facebook, email, link]
 *               shareUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate shared successfully
 */
router.post('/:id/share', certificatesController.shareCertificate.bind(certificatesController));

// ========================================
// VERIFICATION (No auth required)
// ========================================

/**
 * @swagger
 * /api/certificates/verify/{credentialId}:
 *   get:
 *     summary: Verify a certificate
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate verification result
 */
router.get('/verify/:credentialId', certificatesController.verifyCertificate.bind(certificatesController));

// ========================================
// DIGITAL BADGES
// ========================================

/**
 * @swagger
 * /api/certificates/badges:
 *   post:
 *     summary: Create a digital badge
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - imageUrl
 *               - criteriaDescription
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               badgeType:
 *                 type: string
 *                 enum: [achievement, skill, milestone, participation, custom]
 *               imageUrl:
 *                 type: string
 *               criteriaDescription:
 *                 type: string
 *               courseId:
 *                 type: string
 *               rarity:
 *                 type: string
 *                 enum: [common, uncommon, rare, epic, legendary]
 *               pointsValue:
 *                 type: integer
 *               isStackable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Badge created successfully
 */
router.post('/badges', certificatesController.createBadge.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/badges:
 *   get:
 *     summary: List digital badges
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: badgeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 */
router.get('/badges', certificatesController.listBadges.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/badges/mine:
 *   get:
 *     summary: Get my badges
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User badges retrieved successfully
 */
router.get('/badges/mine', certificatesController.listUserBadges.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/badges/leaderboard:
 *   get:
 *     summary: Get badge leaderboard
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
router.get('/badges/leaderboard', certificatesController.getBadgeLeaderboard.bind(certificatesController));

router.get('/badges/:id', certificatesController.getBadge.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/badges/{badgeId}/award:
 *   post:
 *     summary: Award a badge to a user
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               reason:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       201:
 *         description: Badge awarded successfully
 */
router.post('/badges/:badgeId/award', certificatesController.awardBadge.bind(certificatesController));

router.post('/badges/awards/:awardId/revoke', certificatesController.revokeBadgeAward.bind(certificatesController));

// ========================================
// CREDENTIAL WALLET
// ========================================

/**
 * @swagger
 * /api/certificates/wallet:
 *   get:
 *     summary: Get my credential wallet
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 */
router.get('/wallet', certificatesController.getWallet.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/wallet:
 *   put:
 *     summary: Update my credential wallet
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *               publicUrlSlug:
 *                 type: string
 *               bio:
 *                 type: string
 *               headline:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               linkedinUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 */
router.put('/wallet', certificatesController.updateWallet.bind(certificatesController));

/**
 * @swagger
 * /api/certificates/wallet/{slug}:
 *   get:
 *     summary: Get public credential wallet
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public wallet retrieved successfully
 */
router.get('/wallet/:slug', certificatesController.getPublicWallet.bind(certificatesController));

export default router;
