import { pool } from '../db/pool';
import { stripeService, paystackService, flutterwaveService } from './gateways';

interface CreateSubscriptionParams {
  userId: string;
  planId: string;
  paymentMethodId?: string;
  gateway?: 'stripe' | 'paystack' | 'flutterwave';
  trialDays?: number;
  couponCode?: string;
}

interface UpdateSubscriptionParams {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Subscription Management Service
 * Handles subscription lifecycle across all payment gateways
 */
class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<any> {
    const { userId, planId, paymentMethodId, gateway = 'stripe', trialDays, couponCode } = params;

    try {
      // Get plan details
      const planResult = await pool.query(
        'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Plan not found or inactive');
      }

      const plan = planResult.rows[0];

      // Calculate amount (apply coupon if provided)
      let amount = parseFloat(plan.price);
      let discountAmount = 0;

      if (couponCode) {
        const couponResult = await pool.query(
          'SELECT * FROM coupons WHERE code = $1 AND is_active = true',
          [couponCode]
        );

        if (couponResult.rows.length > 0) {
          const coupon = couponResult.rows[0];
          const isValid = await pool.query(
            'SELECT is_coupon_valid($1, $2, $3) as valid',
            [coupon.id, userId, amount]
          );

          if (isValid.rows[0].valid) {
            const discountResult = await pool.query(
              'SELECT calculate_discount($1, $2) as discount',
              [coupon.id, amount]
            );
            discountAmount = parseFloat(discountResult.rows[0].discount);
            amount -= discountAmount;
          }
        }
      }

      // Get or create gateway customer
      const gatewayCustomerId = await this.getOrCreateGatewayCustomer(userId, gateway);

      // Create subscription in gateway
      let gatewaySubscription: any;
      let gatewaySubscriptionId: string;

      switch (gateway) {
        case 'stripe':
          gatewaySubscription = await this.createStripeSubscription({
            customerId: gatewayCustomerId,
            planId: plan.id,
            amount: amount,
            currency: plan.currency,
            billingCycle: plan.billing_cycle,
            trialDays: trialDays || plan.trial_days,
            paymentMethodId,
          });
          gatewaySubscriptionId = gatewaySubscription.id;
          break;

        case 'paystack':
          gatewaySubscription = await this.createPaystackSubscription({
            customerId: gatewayCustomerId,
            amount,
            interval: this.mapBillingCycleToPaystack(plan.billing_cycle),
            planName: plan.name,
          });
          gatewaySubscriptionId = gatewaySubscription.subscription_code;
          break;

        case 'flutterwave':
          gatewaySubscription = await this.createFlutterwaveSubscription({
            customerId: gatewayCustomerId,
            amount,
            interval: this.mapBillingCycleToFlutterwave(plan.billing_cycle),
            planName: plan.name,
          });
          gatewaySubscriptionId = gatewaySubscription.id;
          break;

        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }

      // Calculate period dates
      const now = new Date();
      const periodStart = now;
      const periodEnd = this.calculatePeriodEnd(now, plan.billing_cycle);
      const trialEnd = trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

      // Create subscription record
      const subscriptionResult = await pool.query(
        `INSERT INTO subscriptions (
          user_id, plan_id, status, gateway, gateway_subscription_id, gateway_customer_id,
          amount, currency, billing_cycle, current_period_start, current_period_end,
          trial_start, trial_end, default_payment_method_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId, planId, trialEnd ? 'trialing' : 'active', gateway, gatewaySubscriptionId,
          gatewayCustomerId, amount, plan.currency, plan.billing_cycle, periodStart, periodEnd,
          trialEnd ? now : null, trialEnd, paymentMethodId,
        ]
      );

      const subscription = subscriptionResult.rows[0];

      // Record coupon redemption if used
      if (couponCode && discountAmount > 0) {
        const coupon = await pool.query('SELECT id FROM coupons WHERE code = $1', [couponCode]);
        if (coupon.rows.length > 0) {
          await pool.query(
            'INSERT INTO coupon_redemptions (coupon_id, user_id, discount_amount) VALUES ($1, $2, $3)',
            [coupon.rows[0].id, userId, discountAmount]
          );

          // Update coupon usage
          await pool.query(
            'UPDATE coupons SET times_used = times_used + 1 WHERE id = $1',
            [coupon.rows[0].id]
          );
        }
      }

      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT s.*, sp.name as plan_name, sp.features as plan_features
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.id = $1`,
      [subscriptionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    return result.rows[0];
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(userId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT s.*, sp.name as plan_name, sp.features as plan_features
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get user's subscription history
   */
  async getUserSubscriptions(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT s.*, sp.name as plan_name
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams
  ): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (params.planId) {
      updates.push(`plan_id = $${paramCount++}`);
      values.push(params.planId);

      // Update in gateway
      await this.updateGatewaySubscription(subscription, { planId: params.planId });
    }

    if (params.cancelAtPeriodEnd !== undefined) {
      updates.push(`cancel_at_period_end = $${paramCount++}`);
      values.push(params.cancelAtPeriodEnd);

      if (params.cancelAtPeriodEnd) {
        await this.cancelGatewaySubscription(subscription, false);
      } else {
        await this.resumeGatewaySubscription(subscription);
      }
    }

    if (updates.length === 0) {
      return subscription;
    }

    values.push(subscriptionId);
    const query = `UPDATE subscriptions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately = false
  ): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);

    // Cancel in gateway
    await this.cancelGatewaySubscription(subscription, immediately);

    // Update database
    if (immediately) {
      const result = await pool.query(
        `UPDATE subscriptions
         SET status = 'cancelled', cancelled_at = NOW(), ended_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [subscriptionId]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `UPDATE subscriptions
         SET cancel_at_period_end = true, cancelled_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [subscriptionId]
      );
      return result.rows[0];
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE subscriptions
       SET status = 'paused', paused_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    return result.rows[0];
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);

    await this.resumeGatewaySubscription(subscription);

    const result = await pool.query(
      `UPDATE subscriptions
       SET status = 'active', paused_at = NULL, cancel_at_period_end = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    return result.rows[0];
  }

  /**
   * Renew subscription (called by webhook)
   */
  async renewSubscription(subscriptionId: string): Promise<any> {
    const subscription = await this.getSubscription(subscriptionId);

    const newPeriodStart = subscription.current_period_end;
    const newPeriodEnd = this.calculatePeriodEnd(
      new Date(newPeriodStart),
      subscription.billing_cycle
    );

    const result = await pool.query(
      `UPDATE subscriptions
       SET current_period_start = $1, current_period_end = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newPeriodStart, newPeriodEnd, subscriptionId]
    );

    return result.rows[0];
  }

  /**
   * Get or create gateway customer
   */
  private async getOrCreateGatewayCustomer(
    userId: string,
    gateway: string
  ): Promise<string> {
    // Check if customer already exists
    const existing = await pool.query(
      'SELECT gateway_customer_id FROM payment_methods WHERE user_id = $1 AND gateway = $2 LIMIT 1',
      [userId, gateway]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].gateway_customer_id;
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Create customer in gateway
    let customerId: string;

    switch (gateway) {
      case 'stripe':
        const stripeCustomer = await stripeService.createCustomer({
          email: user.email,
          name: user.name,
          metadata: { userId },
        });
        customerId = stripeCustomer.id;
        break;

      case 'paystack':
        const paystackCustomer = await paystackService.createCustomer({
          email: user.email,
          firstName: user.name?.split(' ')[0],
          lastName: user.name?.split(' ').slice(1).join(' '),
        });
        customerId = paystackCustomer.customer_code;
        break;

      case 'flutterwave':
        const flutterwaveCustomer = await flutterwaveService.createCustomer({
          email: user.email,
          fullname: user.name,
        });
        customerId = flutterwaveCustomer.id;
        break;

      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }

    return customerId;
  }

  /**
   * Create Stripe subscription
   */
  private async createStripeSubscription(params: any): Promise<any> {
    // Note: In production, you'd create a Stripe Price first
    return await stripeService.createSubscription({
      customerId: params.customerId,
      items: [{ price: 'price_id' }], // Use actual price ID
      trialPeriodDays: params.trialDays,
      defaultPaymentMethod: params.paymentMethodId,
    });
  }

  /**
   * Create Paystack subscription
   */
  private async createPaystackSubscription(params: any): Promise<any> {
    // Create plan if not exists, then subscribe
    const plan = await paystackService.createPlan({
      name: params.planName,
      amount: params.amount,
      interval: params.interval,
    });

    return await paystackService.createSubscription({
      customer: params.customerId,
      plan: plan.plan_code,
    });
  }

  /**
   * Create Flutterwave subscription
   */
  private async createFlutterwaveSubscription(params: any): Promise<any> {
    const plan = await flutterwaveService.createPaymentPlan({
      name: params.planName,
      amount: params.amount,
      interval: params.interval,
    });

    return plan;
  }

  /**
   * Update gateway subscription
   */
  private async updateGatewaySubscription(subscription: any, params: any): Promise<void> {
    switch (subscription.gateway) {
      case 'stripe':
        await stripeService.updateSubscription(subscription.gateway_subscription_id, params);
        break;
      // Add Paystack and Flutterwave implementations
    }
  }

  /**
   * Cancel gateway subscription
   */
  private async cancelGatewaySubscription(
    subscription: any,
    immediately: boolean
  ): Promise<void> {
    switch (subscription.gateway) {
      case 'stripe':
        await stripeService.cancelSubscription(subscription.gateway_subscription_id, immediately);
        break;
      case 'paystack':
        await paystackService.disableSubscription({
          code: subscription.gateway_subscription_id,
          token: '', // Token from email link
        });
        break;
      case 'flutterwave':
        await flutterwaveService.cancelSubscription(subscription.gateway_subscription_id);
        break;
    }
  }

  /**
   * Resume gateway subscription
   */
  private async resumeGatewaySubscription(subscription: any): Promise<void> {
    switch (subscription.gateway) {
      case 'stripe':
        await stripeService.resumeSubscription(subscription.gateway_subscription_id);
        break;
      case 'paystack':
        await paystackService.enableSubscription({
          code: subscription.gateway_subscription_id,
          token: '',
        });
        break;
    }
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(start: Date, billingCycle: string): Date {
    const end = new Date(start);

    switch (billingCycle) {
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        break;
      case 'lifetime':
        end.setFullYear(end.getFullYear() + 100); // 100 years
        break;
    }

    return end;
  }

  /**
   * Map billing cycle to Paystack interval
   */
  private mapBillingCycleToPaystack(cycle: string): string {
    const map: Record<string, string> = {
      monthly: 'monthly',
      yearly: 'annually',
      lifetime: 'annually',
    };
    return map[cycle] || 'monthly';
  }

  /**
   * Map billing cycle to Flutterwave interval
   */
  private mapBillingCycleToFlutterwave(cycle: string): string {
    const map: Record<string, string> = {
      monthly: 'monthly',
      yearly: 'yearly',
      lifetime: 'yearly',
    };
    return map[cycle] || 'monthly';
  }
}

export const subscriptionService = new SubscriptionService();
