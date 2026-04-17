import pool from '../db/pool';
import { paymentsService } from './payments.service';
import Stripe from 'stripe';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateSubscriptionPlanParams {
  planName: string;
  planCode: string;
  description?: string;
  price: number;
  currency?: string;
  billingInterval: string;
  billingIntervalCount?: number;
  trialPeriodDays?: number;
  features?: string[];
  maxCourses?: number;
  createdBy: string;
}

interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  organizationId?: string;
  paymentMethodId?: string;
}

interface CancelSubscriptionParams {
  subscriptionId: string;
  reason: string;
  feedback?: string;
  canceledBy: string;
  immediate?: boolean;
}

interface ChangeSubscriptionPlanParams {
  subscriptionId: string;
  newPlanId: string;
  requestedBy: string;
  changeTiming?: string;
  reason?: string;
}

// ============================================================================
// SUBSCRIPTIONS SERVICE
// ============================================================================

export class SubscriptionsService {
  // ========================================
  // SUBSCRIPTION PLANS
  // ========================================

  async createSubscriptionPlan(params: CreateSubscriptionPlanParams): Promise<any> {
    const {
      planName,
      planCode,
      description,
      price,
      currency = 'USD',
      billingInterval,
      billingIntervalCount = 1,
      trialPeriodDays = 0,
      features = [],
      maxCourses,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO subscription_plans (
        plan_name, plan_code, description, price, currency,
        billing_interval, billing_interval_count, trial_period_days,
        has_trial, features, max_courses, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        planName, planCode, description, price, currency,
        billingInterval, billingIntervalCount, trialPeriodDays,
        trialPeriodDays > 0, JSON.stringify(features), maxCourses, createdBy
      ]
    );

    return result.rows[0];
  }

  async getSubscriptionPlan(planId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = $1`,
      [planId]
    );
    return result.rows[0];
  }

  async listSubscriptionPlans(filters: any = {}): Promise<any[]> {
    const { isActive = true, isVisible, accessType, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM subscription_plans WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (isVisible !== undefined) {
      query += ` AND is_visible = $${paramIndex}`;
      params.push(isVisible);
      paramIndex++;
    }

    if (accessType) {
      query += ` AND access_type = $${paramIndex}`;
      params.push(accessType);
      paramIndex++;
    }

    query += ` ORDER BY sort_order, price LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // USER SUBSCRIPTIONS
  // ========================================

  async createSubscription(params: CreateSubscriptionParams): Promise<any> {
    const { userId, planId, organizationId, paymentMethodId } = params;

    // Get subscription plan
    const plan = await this.getSubscriptionPlan(planId);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Check for existing active subscription
    const existingResult = await pool.query(
      `SELECT id FROM subscriptions
      WHERE user_id = $1 AND status IN ('active', 'trialing')
      LIMIT 1`,
      [userId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('User already has an active subscription');
    }

    // Get payment provider
    const provider = await paymentsService.getProviderByName('stripe');
    if (!provider) {
      throw new Error('Payment provider not configured');
    }

    const stripe = await paymentsService.getStripeClient(provider.id);

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const customerResult = await pool.query(
      `SELECT provider_customer_id FROM payment_methods WHERE user_id = $1 AND provider_id = $2 LIMIT 1`,
      [userId, provider.id]
    );

    if (customerResult.rows.length > 0 && customerResult.rows[0].provider_customer_id) {
      stripeCustomerId = customerResult.rows[0].provider_customer_id;
    } else {
      // Create Stripe customer
      const user = await pool.query(`SELECT email, first_name, last_name FROM users WHERE id = $1`, [userId]);
      const stripeCustomer = await stripe.customers.create({
        email: user.rows[0].email,
        name: `${user.rows[0].first_name} ${user.rows[0].last_name}`,
        metadata: {
          user_id: userId
        }
      });
      stripeCustomerId = stripeCustomer.id;
    }

    // Attach payment method to customer if provided
    if (paymentMethodId) {
      const paymentMethod = await paymentsService.getPaymentMethod(paymentMethodId);
      if (paymentMethod && paymentMethod.provider_payment_method_id) {
        await stripe.paymentMethods.attach(paymentMethod.provider_payment_method_id, {
          customer: stripeCustomerId
        });

        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.provider_payment_method_id
          }
        });
      }
    }

    // Create Stripe subscription
    let providerPlanId = plan.provider_plan_id;
    if (!providerPlanId) {
      // Create Stripe price if not exists
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(plan.price * 100),
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.billing_interval as any,
          interval_count: plan.billing_interval_count
        },
        product_data: {
          name: plan.plan_name,
          description: plan.description
        }
      });
      providerPlanId = stripePrice.id;

      // Update plan with provider ID
      await pool.query(
        `UPDATE subscription_plans SET provider_plan_id = $1 WHERE id = $2`,
        [providerPlanId, planId]
      );
    }

    const stripeSubscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: providerPlanId }],
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    };

    // Add trial if applicable
    if (plan.has_trial && plan.trial_period_days > 0) {
      stripeSubscriptionParams.trial_period_days = plan.trial_period_days;
    }

    const stripeSubscription = await stripe.subscriptions.create(stripeSubscriptionParams);

    // Create subscription record
    const now = new Date();
    const trialStart = plan.has_trial ? now : null;
    const trialEnd = plan.has_trial ? new Date(now.getTime() + plan.trial_period_days * 24 * 60 * 60 * 1000) : null;
    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    const result = await pool.query(
      `INSERT INTO subscriptions (
        user_id, organization_id, plan_id, provider, provider_subscription_id,
        provider_customer_id, status, start_date, trial_start, trial_end,
        current_period_start, current_period_end, next_billing_date,
        payment_method_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId, organizationId, planId, 'stripe', stripeSubscription.id,
        stripeCustomerId, stripeSubscription.status, now, trialStart, trialEnd,
        currentPeriodStart, currentPeriodEnd, currentPeriodEnd, paymentMethodId
      ]
    );

    const subscription = result.rows[0];

    // Log subscription creation
    await pool.query(
      `INSERT INTO subscription_history (subscription_id, event_type, event_description, new_plan_id, new_status)
      VALUES ($1, $2, $3, $4, $5)`,
      [subscription.id, 'created', 'Subscription created', planId, subscription.status]
    );

    return subscription;
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT s.*, sp.plan_name, sp.price as plan_price, sp.billing_interval
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = $1`,
      [subscriptionId]
    );
    return result.rows[0];
  }

  async getUserSubscription(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM active_subscriptions WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  async listUserSubscriptions(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT s.*, sp.plan_name, sp.price as plan_price, sp.billing_interval
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // ========================================
  // SUBSCRIPTION MANAGEMENT
  // ========================================

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    const { subscriptionId, reason, feedback, canceledBy, immediate = false } = params;

    if (immediate) {
      await pool.query(
        `SELECT cancel_subscription_immediately($1, $2, $3, $4)`,
        [subscriptionId, reason, feedback, canceledBy]
      );

      // Cancel in Stripe
      const subscription = await this.getSubscription(subscriptionId);
      if (subscription && subscription.provider_subscription_id) {
        const provider = await paymentsService.getProviderByName('stripe');
        const stripe = await paymentsService.getStripeClient(provider.id);
        await stripe.subscriptions.cancel(subscription.provider_subscription_id);
      }
    } else {
      await pool.query(
        `SELECT cancel_subscription_at_period_end($1, $2, $3, $4)`,
        [subscriptionId, reason, feedback, canceledBy]
      );

      // Update in Stripe
      const subscription = await this.getSubscription(subscriptionId);
      if (subscription && subscription.provider_subscription_id) {
        const provider = await paymentsService.getProviderByName('stripe');
        const stripe = await paymentsService.getStripeClient(provider.id);
        await stripe.subscriptions.update(subscription.provider_subscription_id, {
          cancel_at_period_end: true
        });
      }
    }
  }

  async resumeSubscription(subscriptionId: string, resumedBy: string): Promise<void> {
    const result = await pool.query(
      `SELECT resume_subscription($1, $2)`,
      [subscriptionId, resumedBy]
    );

    if (result.rows[0].resume_subscription) {
      // Update in Stripe
      const subscription = await this.getSubscription(subscriptionId);
      if (subscription && subscription.provider_subscription_id) {
        const provider = await paymentsService.getProviderByName('stripe');
        const stripe = await paymentsService.getStripeClient(provider.id);
        await stripe.subscriptions.update(subscription.provider_subscription_id, {
          cancel_at_period_end: false
        });
      }
    }
  }

  async changeSubscriptionPlan(params: ChangeSubscriptionPlanParams): Promise<any> {
    const {
      subscriptionId,
      newPlanId,
      requestedBy,
      changeTiming = 'immediate',
      reason
    } = params;

    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPlan = await this.getSubscriptionPlan(newPlanId);
    if (!newPlan) {
      throw new Error('New plan not found');
    }

    // Determine change type
    const changeType = newPlan.price > subscription.plan_price ? 'upgrade' : 'downgrade';

    // Create subscription change record
    const changeResult = await pool.query(
      `INSERT INTO subscription_changes (
        subscription_id, change_type, from_plan_id, to_plan_id,
        change_timing, requested_by, change_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [subscriptionId, changeType, subscription.plan_id, newPlanId, changeTiming, requestedBy, reason]
    );

    const change = changeResult.rows[0];

    if (changeTiming === 'immediate') {
      // Update subscription immediately
      await this.applySubscriptionChange(change.id);
    } else {
      // Schedule for end of period
      await pool.query(
        `UPDATE subscription_changes SET scheduled_for = $1 WHERE id = $2`,
        [subscription.current_period_end, change.id]
      );
    }

    return change;
  }

  async applySubscriptionChange(changeId: string): Promise<void> {
    const changeResult = await pool.query(
      `SELECT * FROM subscription_changes WHERE id = $1`,
      [changeId]
    );

    const change = changeResult.rows[0];
    if (!change) {
      throw new Error('Subscription change not found');
    }

    const subscription = await this.getSubscription(change.subscription_id);
    const newPlan = await this.getSubscriptionPlan(change.to_plan_id);

    // Update in Stripe
    if (subscription.provider_subscription_id) {
      const provider = await paymentsService.getProviderByName('stripe');
      const stripe = await paymentsService.getStripeClient(provider.id);

      // Get or create new price in Stripe
      let providerPlanId = newPlan.provider_plan_id;
      if (!providerPlanId) {
        const stripePrice = await stripe.prices.create({
          unit_amount: Math.round(newPlan.price * 100),
          currency: newPlan.currency.toLowerCase(),
          recurring: {
            interval: newPlan.billing_interval as any,
            interval_count: newPlan.billing_interval_count
          },
          product_data: {
            name: newPlan.plan_name,
            description: newPlan.description
          }
        });
        providerPlanId = stripePrice.id;

        await pool.query(
          `UPDATE subscription_plans SET provider_plan_id = $1 WHERE id = $2`,
          [providerPlanId, newPlan.id]
        );
      }

      // Update Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.provider_subscription_id);
      await stripe.subscriptions.update(subscription.provider_subscription_id, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: providerPlanId
        }],
        proration_behavior: 'create_prorations'
      });
    }

    // Update local subscription
    await pool.query(
      `UPDATE subscriptions SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [change.to_plan_id, change.subscription_id]
    );

    // Mark change as completed
    await pool.query(
      `UPDATE subscription_changes SET status = 'completed', applied_at = NOW() WHERE id = $1`,
      [changeId]
    );
  }

  // ========================================
  // BILLING & INVOICES
  // ========================================

  async createInvoice(subscriptionId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const plan = await this.getSubscriptionPlan(subscription.plan_id);

    // Generate invoice number
    const invoiceNumberResult = await pool.query(`SELECT generate_invoice_number() as invoice_number`);
    const invoiceNumber = invoiceNumberResult.rows[0].invoice_number;

    // Calculate amounts
    const subtotal = plan.price;
    const taxAmount = 0; // TODO: Implement tax calculation
    const totalAmount = subtotal + taxAmount;

    const result = await pool.query(
      `INSERT INTO subscription_invoices (
        invoice_number, subscription_id, user_id, subtotal, tax_amount,
        total_amount, amount_due, currency, status, invoice_date,
        period_start, period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11)
      RETURNING *`,
      [
        invoiceNumber, subscriptionId, subscription.user_id, subtotal, taxAmount,
        totalAmount, totalAmount, plan.currency, 'open', periodStart, periodEnd
      ]
    );

    return result.rows[0];
  }

  async getInvoice(invoiceId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM subscription_invoices WHERE id = $1`,
      [invoiceId]
    );
    return result.rows[0];
  }

  async listUserInvoices(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM subscription_invoices
      WHERE user_id = $1
      ORDER BY invoice_date DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM subscription_invoices WHERE user_id = $1`,
      [userId]
    );

    return {
      invoices: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  async handleStripeSubscriptionEvent(event: any): Promise<void> {
    const subscription = event.data.object;
    const providerSubscriptionId = subscription.id;

    // Find local subscription
    const localSub = await pool.query(
      `SELECT * FROM subscriptions WHERE provider_subscription_id = $1`,
      [providerSubscriptionId]
    );

    if (localSub.rows.length === 0) {
      console.warn(`Subscription not found for Stripe subscription: ${providerSubscriptionId}`);
      return;
    }

    const subscriptionId = localSub.rows[0].id;

    // Update based on event type
    if (event.type === 'customer.subscription.updated') {
      await pool.query(
        `UPDATE subscriptions
        SET status = $1,
            current_period_start = $2,
            current_period_end = $3,
            next_billing_date = $4,
            updated_at = NOW()
        WHERE id = $5`,
        [
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          new Date(subscription.current_period_end * 1000),
          subscriptionId
        ]
      );
    } else if (event.type === 'customer.subscription.deleted') {
      await pool.query(
        `UPDATE subscriptions
        SET status = 'canceled', ended_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
        [subscriptionId]
      );
    }
  }
}

export const subscriptionsService = new SubscriptionsService();
