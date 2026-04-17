import { Request, Response } from 'express';
import { paymentsService } from '../services/payments.service';
import Stripe from 'stripe';

export class PaymentsController {
  // ========================================
  // PAYMENT INTENTS
  // ========================================

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        amount,
        currency,
        courseId,
        enrollmentId,
        subscriptionId,
        paymentMethodId,
        description,
        metadata
      } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ success: false, message: 'Invalid amount' });
        return;
      }

      const paymentIntent = await paymentsService.createPaymentIntent({
        userId,
        amount,
        currency,
        courseId,
        enrollmentId,
        subscriptionId,
        paymentMethodId,
        description,
        metadata
      });

      res.status(201).json({ success: true, data: paymentIntent });
    } catch (error: any) {
      console.error('[createPaymentIntent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
    }
  }

  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const transaction = await paymentsService.getTransaction(id);

      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      // Check ownership
      if (transaction.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: transaction });
    } catch (error: any) {
      console.error('[getTransaction] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get transaction' });
    }
  }

  async listUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await paymentsService.listUserTransactions(userId, limit, offset);
      res.json({ success: true, data: result.transactions, total: result.total });
    } catch (error: any) {
      console.error('[listUserTransactions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list transactions' });
    }
  }

  // ========================================
  // PAYMENT METHODS
  // ========================================

  async createPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        providerId,
        methodType,
        providerPaymentMethodId,
        providerCustomerId,
        cardLast4,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        billingName,
        billingEmail,
        billingAddress,
        isDefault
      } = req.body;

      if (!providerPaymentMethodId) {
        res.status(400).json({ success: false, message: 'Provider payment method ID is required' });
        return;
      }

      const paymentMethod = await paymentsService.createPaymentMethod({
        userId,
        providerId,
        methodType,
        providerPaymentMethodId,
        providerCustomerId,
        cardLast4,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        billingName,
        billingEmail,
        billingAddress,
        isDefault
      });

      res.status(201).json({ success: true, data: paymentMethod });
    } catch (error: any) {
      console.error('[createPaymentMethod] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create payment method' });
    }
  }

  async listPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const paymentMethods = await paymentsService.listUserPaymentMethods(userId);
      res.json({ success: true, data: paymentMethods });
    } catch (error: any) {
      console.error('[listPaymentMethods] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list payment methods' });
    }
  }

  async setDefaultPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify ownership
      const paymentMethod = await paymentsService.getPaymentMethod(id);
      if (!paymentMethod || paymentMethod.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Payment method not found' });
        return;
      }

      await paymentsService.setDefaultPaymentMethod(userId, id);
      res.json({ success: true, message: 'Default payment method updated' });
    } catch (error: any) {
      console.error('[setDefaultPaymentMethod] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to set default payment method' });
    }
  }

  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify ownership
      const paymentMethod = await paymentsService.getPaymentMethod(id);
      if (!paymentMethod || paymentMethod.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Payment method not found' });
        return;
      }

      await paymentsService.deletePaymentMethod(id, userId);
      res.json({ success: true, message: 'Payment method deleted' });
    } catch (error: any) {
      console.error('[deletePaymentMethod] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete payment method' });
    }
  }

  // ========================================
  // REFUNDS
  // ========================================

  async createRefund(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        transactionId,
        refundAmount,
        refundReason,
        refundType,
        customerNote,
        adminNote
      } = req.body;

      if (!transactionId || !refundAmount || !refundReason) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID, refund amount, and reason are required'
        });
        return;
      }

      // Verify transaction ownership
      const transaction = await paymentsService.getTransaction(transactionId);
      if (!transaction || transaction.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      const refund = await paymentsService.createRefund({
        transactionId,
        refundAmount,
        refundReason,
        refundType,
        requestedBy: userId,
        customerNote,
        adminNote
      });

      res.status(201).json({ success: true, data: refund });
    } catch (error: any) {
      console.error('[createRefund] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create refund' });
    }
  }

  async getRefund(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const refund = await paymentsService.getRefund(id);

      if (!refund) {
        res.status(404).json({ success: false, message: 'Refund not found' });
        return;
      }

      // Verify ownership through transaction
      const transaction = await paymentsService.getTransaction(refund.transaction_id);
      if (!transaction || transaction.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: refund });
    } catch (error: any) {
      console.error('[getRefund] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get refund' });
    }
  }

  async listTransactionRefunds(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { transactionId } = req.params;

      // Verify transaction ownership
      const transaction = await paymentsService.getTransaction(transactionId);
      if (!transaction || transaction.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }

      const refunds = await paymentsService.listTransactionRefunds(transactionId);
      res.json({ success: true, data: refunds });
    } catch (error: any) {
      console.error('[listTransactionRefunds] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list refunds' });
    }
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        res.status(400).json({ success: false, message: 'Missing signature' });
        return;
      }

      // Get Stripe provider
      const provider = await paymentsService.getProviderByName('stripe');
      if (!provider) {
        res.status(500).json({ success: false, message: 'Stripe provider not configured' });
        return;
      }

      // Verify webhook signature
      const stripe = await paymentsService.getStripeClient(provider.id);
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          provider.webhook_secret
        );
      } catch (err: any) {
        console.error('[handleStripeWebhook] Signature verification failed:', err.message);
        res.status(400).json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
        return;
      }

      // Store webhook
      await paymentsService.handleWebhook({
        providerId: provider.id,
        providerEventId: event.id,
        eventType: event.type,
        payload: event.data
      });

      res.json({ success: true, received: true });
    } catch (error: any) {
      console.error('[handleStripeWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Webhook processing failed' });
    }
  }

  async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      // PayPal webhook implementation
      const provider = await paymentsService.getProviderByName('paypal');
      if (!provider) {
        res.status(500).json({ success: false, message: 'PayPal provider not configured' });
        return;
      }

      const event = req.body;

      await paymentsService.handleWebhook({
        providerId: provider.id,
        providerEventId: event.id,
        eventType: event.event_type,
        payload: event
      });

      res.json({ success: true, received: true });
    } catch (error: any) {
      console.error('[handlePayPalWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Webhook processing failed' });
    }
  }
}

export const paymentsController = new PaymentsController();
