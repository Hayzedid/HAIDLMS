import { Router } from 'express';
import { financialController } from '../controllers/financial.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Financial
 *   description: Invoicing, receipts, and financial reporting
 */

// ========================================
// INVOICES
// ========================================

/**
 * @swagger
 * /api/financial/invoices:
 *   get:
 *     summary: Get my invoices
 *     tags: [Financial]
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
router.get('/invoices', authenticate, financialController.listMyInvoices.bind(financialController));

/**
 * @swagger
 * /api/financial/invoices/{id}:
 *   get:
 *     summary: Get invoice details
 *     tags: [Financial]
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
router.get('/invoices/:id', authenticate, financialController.getInvoice.bind(financialController));

// ========================================
// RECEIPTS
// ========================================

/**
 * @swagger
 * /api/financial/receipts:
 *   get:
 *     summary: Get my receipts
 *     tags: [Financial]
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
 *         description: Receipts retrieved successfully
 */
router.get('/receipts', authenticate, financialController.listMyReceipts.bind(financialController));

/**
 * @swagger
 * /api/financial/receipts/{id}:
 *   get:
 *     summary: Get receipt details
 *     tags: [Financial]
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
 *         description: Receipt retrieved successfully
 *       404:
 *         description: Receipt not found
 */
router.get('/receipts/:id', authenticate, financialController.getReceipt.bind(financialController));

// ========================================
// INSTRUCTOR PAYOUTS
// ========================================

/**
 * @swagger
 * /api/financial/payouts:
 *   get:
 *     summary: Get my instructor payouts
 *     tags: [Financial]
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
 *         description: Payouts retrieved successfully
 */
router.get('/payouts', authenticate, financialController.listMyPayouts.bind(financialController));

/**
 * @swagger
 * /api/financial/payouts/{id}:
 *   get:
 *     summary: Get payout details
 *     tags: [Financial]
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
 *         description: Payout retrieved successfully
 *       404:
 *         description: Payout not found
 */
router.get('/payouts/:id', authenticate, financialController.getInstructorPayout.bind(financialController));

// ========================================
// FINANCIAL REPORTS
// ========================================

/**
 * @swagger
 * /api/financial/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report generated successfully
 */
router.get('/reports/revenue', authenticate, financialController.getRevenueReport.bind(financialController));

/**
 * @swagger
 * /api/financial/reports/course-revenue:
 *   get:
 *     summary: Get course revenue summary
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course revenue summary retrieved successfully
 */
router.get('/reports/course-revenue', authenticate, financialController.getCourseRevenueSummary.bind(financialController));

/**
 * @swagger
 * /api/financial/reports/instructor-earnings:
 *   get:
 *     summary: Get instructor earnings summary
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor earnings retrieved successfully
 */
router.get('/reports/instructor-earnings', authenticate, financialController.getInstructorEarnings.bind(financialController));

/**
 * @swagger
 * /api/financial/reports/outstanding-invoices:
 *   get:
 *     summary: Get outstanding invoices
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Outstanding invoices retrieved successfully
 */
router.get('/reports/outstanding-invoices', authenticate, financialController.getOutstandingInvoices.bind(financialController));

export default router;
