import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { pricingController } from '../controllers/pricing.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Course pricing, discounts, bulk purchases, and enrollment payments
 */

// ========================================
// COURSE PRICING
// ========================================

/**
 * @swagger
 * /api/pricing/courses:
 *   post:
 *     summary: Create course pricing configuration
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - pricingModel
 *             properties:
 *               courseId:
 *                 type: string
 *               pricingModel:
 *                 type: string
 *                 enum: [one_time, subscription, tiered, free, freemium]
 *               basePrice:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               subscriptionPrice:
 *                 type: number
 *               subscriptionInterval:
 *                 type: string
 *                 enum: [monthly, quarterly, yearly]
 *               trialPeriodDays:
 *                 type: integer
 *               isFree:
 *                 type: boolean
 *               isFreemium:
 *                 type: boolean
 *               lifetimeAccess:
 *                 type: boolean
 *               accessDurationDays:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course pricing created successfully
 */
router.post('/courses', authenticate, pricingController.createCoursePricing.bind(pricingController));

/**
 * @swagger
 * /api/pricing/courses/{courseId}:
 *   get:
 *     summary: Get course pricing
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course pricing retrieved successfully
 *       404:
 *         description: Course pricing not found
 */
router.get('/courses/:courseId', pricingController.getCoursePricing.bind(pricingController));

/**
 * @swagger
 * /api/pricing/courses/{courseId}:
 *   put:
 *     summary: Update course pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               basePrice:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               isOnSale:
 *                 type: boolean
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Course pricing updated successfully
 */
router.put('/courses/:courseId', authenticate, pricingController.updateCoursePricing.bind(pricingController));

// ========================================
// PRICING TIERS
// ========================================

/**
 * @swagger
 * /api/pricing/{pricingId}/tiers:
 *   post:
 *     summary: Create a pricing tier
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pricingId
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
 *               - tierName
 *               - tierLevel
 *               - price
 *             properties:
 *               tierName:
 *                 type: string
 *               tierLevel:
 *                 type: integer
 *               price:
 *                 type: number
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               modulesIncluded:
 *                 type: integer
 *               supportLevel:
 *                 type: string
 *               isMostPopular:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Pricing tier created successfully
 */
router.post('/:pricingId/tiers', authenticate, pricingController.createPricingTier.bind(pricingController));

/**
 * @swagger
 * /api/pricing/{pricingId}/tiers:
 *   get:
 *     summary: List pricing tiers
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: pricingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing tiers retrieved successfully
 */
router.get('/:pricingId/tiers', pricingController.listPricingTiers.bind(pricingController));

// ========================================
// DISCOUNT CODES
// ========================================

/**
 * @swagger
 * /api/pricing/discounts:
 *   post:
 *     summary: Create a discount code
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed_amount]
 *               discountValue:
 *                 type: number
 *               appliesTo:
 *                 type: string
 *                 enum: [all, specific_courses, specific_categories]
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxUses:
 *                 type: integer
 *               maxUsesPerUser:
 *                 type: integer
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               minimumPurchaseAmount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Discount code created successfully
 */
router.post('/discounts', authenticate, pricingController.createDiscountCode.bind(pricingController));

/**
 * @swagger
 * /api/pricing/discounts:
 *   get:
 *     summary: List active discount codes
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: appliesTo
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
 *         description: Discount codes retrieved successfully
 */
router.get('/discounts', authenticate, pricingController.listDiscountCodes.bind(pricingController));

/**
 * @swagger
 * /api/pricing/discounts/{code}/validate:
 *   get:
 *     summary: Validate a discount code
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: purchaseAmount
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Discount code validation result
 */
router.get('/discounts/:code/validate', authenticate, pricingController.validateDiscountCode.bind(pricingController));

// ========================================
// ENROLLMENT WITH PAYMENT
// ========================================

/**
 * @swagger
 * /api/pricing/enroll:
 *   post:
 *     summary: Enroll in a course with payment
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *               discountCode:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enrollment created successfully with payment intent
 *       400:
 *         description: Invalid request or user already enrolled
 */
router.post('/enroll', authenticate, pricingController.enrollWithPayment.bind(pricingController));

/**
 * @swagger
 * /api/pricing/enrollments/{enrollmentId}/grant-access:
 *   post:
 *     summary: Grant access to an enrollment (after payment success)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment access granted successfully
 */
router.post('/enrollments/:enrollmentId/grant-access', authenticate, pricingController.grantEnrollmentAccess.bind(pricingController));

// ========================================
// BULK ENROLLMENTS
// ========================================

/**
 * @swagger
 * /api/pricing/bulk-orders:
 *   post:
 *     summary: Create a bulk enrollment order
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - quantity
 *             properties:
 *               organizationId:
 *                 type: string
 *               courseId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 2
 *               discountCode:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bulk order created successfully
 */
router.post('/bulk-orders', authenticate, pricingController.createBulkOrder.bind(pricingController));

/**
 * @swagger
 * /api/pricing/bulk-orders/{bulkOrderId}/assign:
 *   post:
 *     summary: Assign a bulk enrollment seat
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bulkOrderId
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seat assigned successfully
 */
router.post('/bulk-orders/:bulkOrderId/assign', authenticate, pricingController.assignBulkSeat.bind(pricingController));

/**
 * @swagger
 * /api/pricing/bulk-seats/{seatId}/accept:
 *   post:
 *     summary: Accept a bulk enrollment seat invitation
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seat accepted and enrollment created
 */
router.post('/bulk-seats/:seatId/accept', authenticate, pricingController.acceptBulkSeat.bind(pricingController));

// ========================================
// GIFT ENROLLMENTS
// ========================================

/**
 * @swagger
 * /api/pricing/gifts:
 *   post:
 *     summary: Purchase a gift enrollment
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - recipientEmail
 *             properties:
 *               courseId:
 *                 type: string
 *               recipientEmail:
 *                 type: string
 *               recipientName:
 *                 type: string
 *               personalMessage:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Gift enrollment created successfully
 */
router.post('/gifts', authenticate, pricingController.createGiftEnrollment.bind(pricingController));

/**
 * @swagger
 * /api/pricing/gifts/{giftCode}/redeem:
 *   post:
 *     summary: Redeem a gift enrollment
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: giftCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gift redeemed and enrollment created
 *       400:
 *         description: Invalid or already redeemed gift code
 */
router.post('/gifts/:giftCode/redeem', authenticate, pricingController.redeemGift.bind(pricingController));

export default router;
