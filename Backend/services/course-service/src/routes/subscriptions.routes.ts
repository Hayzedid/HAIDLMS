import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { subscriptionsController } from '../controllers/subscriptions.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management, billing cycles, and recurring payments
 */

// ========================================
// SUBSCRIPTION PLANS
// ========================================

/**
 * @swagger
 * /api/subscriptions/plans:
 *   post:
 *     summary: Create a subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planName
 *               - planCode
 *               - price
 *               - billingInterval
 *             properties:
 *               planName:
 *                 type: string
 *               planCode:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               billingInterval:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               billingIntervalCount:
 *                 type: integer
 *               trialPeriodDays:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxCourses:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 */
router.post('/plans', authenticate, subscriptionsController.createSubscriptionPlan.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: List subscription plans
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: accessType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 */
router.get('/plans', subscriptionsController.listSubscriptionPlans.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/plans/{id}:
 *   get:
 *     summary: Get subscription plan details
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription plan retrieved successfully
 *       404:
 *         description: Subscription plan not found
 */
router.get('/plans/:id', subscriptionsController.getSubscriptionPlan.bind(subscriptionsController));

// ========================================
// USER SUBSCRIPTIONS
// ========================================

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create a subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *       400:
 *         description: User already has an active subscription
 */
router.post('/', authenticate, subscriptionsController.createSubscription.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/me:
 *   get:
 *     summary: Get my active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscription retrieved successfully
 */
router.get('/me', authenticate, subscriptionsController.getUserSubscription.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/mine:
 *   get:
 *     summary: List all my subscriptions (including canceled)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscriptions retrieved successfully
 */
router.get('/mine', authenticate, subscriptionsController.listUserSubscriptions.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription details
 *     tags: [Subscriptions]
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
 *         description: Subscription retrieved successfully
 *       404:
 *         description: Subscription not found
 */
router.get('/:id', authenticate, subscriptionsController.getSubscription.bind(subscriptionsController));

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

/**
 * @swagger
 * /api/subscriptions/{id}/cancel:
 *   post:
 *     summary: Cancel a subscription
 *     tags: [Subscriptions]
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
 *               feedback:
 *                 type: string
 *               immediate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 */
router.post('/:id/cancel', authenticate, subscriptionsController.cancelSubscription.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/{id}/resume:
 *   post:
 *     summary: Resume a canceled subscription
 *     tags: [Subscriptions]
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
 *         description: Subscription resumed successfully
 */
router.post('/:id/resume', authenticate, subscriptionsController.resumeSubscription.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/{id}/change-plan:
 *   post:
 *     summary: Change subscription plan (upgrade/downgrade)
 *     tags: [Subscriptions]
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
 *               - newPlanId
 *             properties:
 *               newPlanId:
 *                 type: string
 *               changeTiming:
 *                 type: string
 *                 enum: [immediate, end_of_period]
 *                 default: immediate
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription plan change initiated
 */
router.post('/:id/change-plan', authenticate, subscriptionsController.changeSubscriptionPlan.bind(subscriptionsController));

// ========================================
// BILLING & INVOICES
// ========================================

/**
 * @swagger
 * /api/subscriptions/invoices:
 *   get:
 *     summary: Get my invoices
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 */
router.get('/invoices', authenticate, subscriptionsController.listUserInvoices.bind(subscriptionsController));

/**
 * @swagger
 * /api/subscriptions/invoices/{id}:
 *   get:
 *     summary: Get invoice details
 *     tags: [Subscriptions]
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
 *         description: Invoice retrieved successfully
 *       404:
 *         description: Invoice not found
 */
router.get('/invoices/:id', authenticate, subscriptionsController.getInvoice.bind(subscriptionsController));

export default router;
