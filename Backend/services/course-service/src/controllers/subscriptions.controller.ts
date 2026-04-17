import { Request, Response } from 'express';
import { subscriptionsService } from '../services/subscriptions.service';

export class SubscriptionsController {
  // ========================================
  // SUBSCRIPTION PLANS
  // ========================================

  async createSubscriptionPlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.planName || !params.planCode || !params.price || !params.billingInterval) {
        res.status(400).json({ success: false, message: 'Plan name, code, price, and billing interval are required' });
        return;
      }

      const plan = await subscriptionsService.createSubscriptionPlan(params);
      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[createSubscriptionPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create subscription plan' });
    }
  }

  async getSubscriptionPlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await subscriptionsService.getSubscriptionPlan(id);

      if (!plan) {
        res.status(404).json({ success: false, message: 'Subscription plan not found' });
        return;
      }

      res.json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[getSubscriptionPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get subscription plan' });
    }
  }

  async listSubscriptionPlans(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        isActive: req.query.isActive === 'false' ? false : true,
        isVisible: req.query.isVisible === 'false' ? false : undefined,
        accessType: req.query.accessType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const plans = await subscriptionsService.listSubscriptionPlans(filters);
      res.json({ success: true, data: plans });
    } catch (error: any) {
      console.error('[listSubscriptionPlans] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list subscription plans' });
    }
  }

  // ========================================
  // USER SUBSCRIPTIONS
  // ========================================

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { planId, organizationId, paymentMethodId } = req.body;

      if (!planId) {
        res.status(400).json({ success: false, message: 'Plan ID is required' });
        return;
      }

      const subscription = await subscriptionsService.createSubscription({
        userId,
        planId,
        organizationId,
        paymentMethodId
      });

      res.status(201).json({ success: true, data: subscription });
    } catch (error: any) {
      console.error('[createSubscription] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create subscription' });
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const subscription = await subscriptionsService.getSubscription(id);

      if (!subscription) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      // Check ownership
      if (subscription.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: subscription });
    } catch (error: any) {
      console.error('[getSubscription] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get subscription' });
    }
  }

  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const subscription = await subscriptionsService.getUserSubscription(userId);
      res.json({ success: true, data: subscription });
    } catch (error: any) {
      console.error('[getUserSubscription] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get user subscription' });
    }
  }

  async listUserSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const subscriptions = await subscriptionsService.listUserSubscriptions(userId);
      res.json({ success: true, data: subscriptions });
    } catch (error: any) {
      console.error('[listUserSubscriptions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list user subscriptions' });
    }
  }

  // ========================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { reason, feedback, immediate = false } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, message: 'Cancellation reason is required' });
        return;
      }

      // Verify ownership
      const subscription = await subscriptionsService.getSubscription(id);
      if (!subscription || subscription.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      await subscriptionsService.cancelSubscription({
        subscriptionId: id,
        reason,
        feedback,
        canceledBy: userId,
        immediate
      });

      res.json({ success: true, message: 'Subscription canceled successfully' });
    } catch (error: any) {
      console.error('[cancelSubscription] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to cancel subscription' });
    }
  }

  async resumeSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify ownership
      const subscription = await subscriptionsService.getSubscription(id);
      if (!subscription || subscription.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      await subscriptionsService.resumeSubscription(id, userId);
      res.json({ success: true, message: 'Subscription resumed successfully' });
    } catch (error: any) {
      console.error('[resumeSubscription] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to resume subscription' });
    }
  }

  async changeSubscriptionPlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { newPlanId, changeTiming, reason } = req.body;

      if (!newPlanId) {
        res.status(400).json({ success: false, message: 'New plan ID is required' });
        return;
      }

      // Verify ownership
      const subscription = await subscriptionsService.getSubscription(id);
      if (!subscription || subscription.user_id !== userId) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      const change = await subscriptionsService.changeSubscriptionPlan({
        subscriptionId: id,
        newPlanId,
        requestedBy: userId,
        changeTiming,
        reason
      });

      res.json({ success: true, data: change });
    } catch (error: any) {
      console.error('[changeSubscriptionPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to change subscription plan' });
    }
  }

  // ========================================
  // BILLING & INVOICES
  // ========================================

  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const invoice = await subscriptionsService.getInvoice(id);

      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      // Check ownership
      if (invoice.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: invoice });
    } catch (error: any) {
      console.error('[getInvoice] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get invoice' });
    }
  }

  async listUserInvoices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await subscriptionsService.listUserInvoices(userId, limit, offset);
      res.json({ success: true, data: result.invoices, total: result.total });
    } catch (error: any) {
      console.error('[listUserInvoices] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list invoices' });
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
