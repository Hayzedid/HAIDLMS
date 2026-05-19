import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { paymentsController } from '../controllers/payments.controller';
import express from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing, gateway integration, and transaction management
 */

// ========================================
// PAYMENT INTENTS
// ========================================

/**
 * @swagger
 * /api/payments/intents:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in dollars (e.g., 29.99)
 *               currency:
 *                 type: string
 *                 default: USD
 *               courseId:
 *                 type: string
 *               enrollmentId:
 *                 type: string
 *               subscriptionId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.post('/intents', authenticate, paymentsController.createPaymentIntent.bind(paymentsController));

// ========================================
// TRANSACTIONS
// ========================================

/**
 * @swagger
 * /api/payments/transactions:
 *   get:
 *     summary: Get my payment transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', authenticate, paymentsController.listUserTransactions.bind(paymentsController));

/**
 * @swagger
 * /api/payments/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Payments]
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
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/transactions/:id', authenticate, paymentsController.getTransaction.bind(paymentsController));

// ========================================
// PAYMENT METHODS
// ========================================

/**
 * @swagger
 * /api/payments/methods:
 *   post:
 *     summary: Add a payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerPaymentMethodId
 *             properties:
 *               providerId:
 *                 type: string
 *               methodType:
 *                 type: string
 *                 enum: [card, bank_account, paypal, apple_pay, google_pay]
 *               providerPaymentMethodId:
 *                 type: string
 *                 description: Payment method ID from payment provider (e.g., Stripe)
 *               providerCustomerId:
 *                 type: string
 *               cardLast4:
 *                 type: string
 *               cardBrand:
 *                 type: string
 *               cardExpMonth:
 *                 type: integer
 *               cardExpYear:
 *                 type: integer
 *               billingName:
 *                 type: string
 *               billingEmail:
 *                 type: string
 *               billingAddress:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Payment method added successfully
 */
router.post('/methods', authenticate, paymentsController.createPaymentMethod.bind(paymentsController));

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: List my payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */
router.get('/methods', authenticate, paymentsController.listPaymentMethods.bind(paymentsController));

/**
 * @swagger
 * /api/payments/methods/{id}/default:
 *   post:
 *     summary: Set default payment method
 *     tags: [Payments]
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
 *         description: Default payment method updated
 *       404:
 *         description: Payment method not found
 */
router.post('/methods/:id/default', authenticate, paymentsController.setDefaultPaymentMethod.bind(paymentsController));

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   delete:
 *     summary: Delete a payment method
 *     tags: [Payments]
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
 *         description: Payment method deleted successfully
 *       404:
 *         description: Payment method not found
 */
router.delete('/methods/:id', authenticate, paymentsController.deletePaymentMethod.bind(paymentsController));

// ========================================
// REFUNDS
// ========================================

/**
 * @swagger
 * /api/payments/refunds:
 *   post:
 *     summary: Request a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - refundAmount
 *               - refundReason
 *             properties:
 *               transactionId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               refundReason:
 *                 type: string
 *                 enum: [customer_request, duplicate, fraudulent, course_canceled]
 *               refundType:
 *                 type: string
 *                 enum: [full, partial]
 *                 default: full
 *               customerNote:
 *                 type: string
 *               adminNote:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund request created successfully
 *       400:
 *         description: Invalid refund request
 */
router.post('/refunds', authenticate, paymentsController.createRefund.bind(paymentsController));

/**
 * @swagger
 * /api/payments/refunds/{id}:
 *   get:
 *     summary: Get refund details
 *     tags: [Payments]
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
 *         description: Refund retrieved successfully
 *       404:
 *         description: Refund not found
 */
router.get('/refunds/:id', authenticate, paymentsController.getRefund.bind(paymentsController));

/**
 * @swagger
 * /api/payments/transactions/{transactionId}/refunds:
 *   get:
 *     summary: Get refunds for a transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refunds retrieved successfully
 */
router.get('/transactions/:transactionId/refunds', authenticate, paymentsController.listTransactionRefunds.bind(paymentsController));

// ========================================
// WEBHOOKS (No auth - verified by signature)
// ========================================

/**
 * @swagger
 * /api/payments/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     description: Receives webhook events from Stripe (verified by signature)
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *       400:
 *         description: Invalid signature
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), paymentsController.handleStripeWebhook.bind(paymentsController));

/**
 * @swagger
 * /api/payments/webhooks/paypal:
 *   post:
 *     summary: PayPal webhook endpoint
 *     tags: [Payments]
 *     description: Receives webhook events from PayPal
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post('/webhooks/paypal', paymentsController.handlePayPalWebhook.bind(paymentsController));

export default router;
