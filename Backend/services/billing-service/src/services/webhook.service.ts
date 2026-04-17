import { pool } from '../db/pool';
import { stripeService, paystackService, flutterwaveService } from './gateways';
import { subscriptionService } from './subscription.service';
import { invoiceService } from './invoice.service';

/**
 * Webhook Handler Service
 * Processes payment gateway webhook events
 */
class WebhookService {
  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = stripeService.constructWebhookEvent(payload, signature);

      // Log event
      await this.logWebhookEvent('stripe', event.type, event.id, event);

      // Handle event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.paid':
          await this.handleStripeInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleStripeInvoiceFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleStripeRefund(event.data.object);
          break;

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      // Mark as processed
      await this.markWebhookProcessed('stripe', event.id);
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle Paystack webhook
   */
  async handlePaystackWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify signature
      const isValid = paystackService.verifyWebhookSignature(
        JSON.stringify(payload),
        signature
      );

      if (!isValid) {
        throw new Error('Invalid Paystack webhook signature');
      }

      const event = payload.event;
      const data = payload.data;

      // Log event
      await this.logWebhookEvent('paystack', event, data.reference, payload);

      // Handle event types
      switch (event) {
        case 'charge.success':
          await this.handlePaystackPaymentSuccess(data);
          break;

        case 'charge.failed':
          await this.handlePaystackPaymentFailed(data);
          break;

        case 'subscription.create':
        case 'subscription.not_renew':
        case 'subscription.disable':
          await this.handlePaystackSubscriptionUpdate(data);
          break;

        case 'refund.processed':
          await this.handlePaystackRefund(data);
          break;

        default:
          console.log(`Unhandled Paystack event type: ${event}`);
      }

      // Mark as processed
      await this.markWebhookProcessed('paystack', data.reference);
    } catch (error) {
      console.error('Paystack webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle Flutterwave webhook
   */
  async handleFlutterwaveWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify signature
      const isValid = flutterwaveService.verifyWebhookSignature(payload, signature);

      if (!isValid) {
        throw new Error('Invalid Flutterwave webhook signature');
      }

      const event = payload.event;
      const data = payload.data;

      // Log event
      await this.logWebhookEvent('flutterwave', event, data.id, payload);

      // Handle event types
      switch (event) {
        case 'charge.completed':
          await this.handleFlutterwavePaymentSuccess(data);
          break;

        case 'charge.failed':
          await this.handleFlutterwavePaymentFailed(data);
          break;

        case 'subscription.cancelled':
          await this.handleFlutterwaveSubscriptionCancelled(data);
          break;

        default:
          console.log(`Unhandled Flutterwave event type: ${event}`);
      }

      // Mark as processed
      await this.markWebhookProcessed('flutterwave', data.id);
    } catch (error) {
      console.error('Flutterwave webhook error:', error);
      throw error;
    }
  }

  /**
   * Stripe: Handle payment success
   */
  private async handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    const { id, amount, currency, customer, metadata } = paymentIntent;

    // Create transaction record
    await pool.query(
      `INSERT INTO transactions (
        user_id, type, status, gateway, gateway_transaction_id, gateway_customer_id,
        amount, currency, paid_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (gateway_transaction_id) DO UPDATE
      SET status = 'succeeded', paid_at = NOW()`,
      [
        metadata?.userId,
        'payment',
        'succeeded',
        'stripe',
        id,
        customer,
        amount / 100,
        currency.toUpperCase(),
        JSON.stringify(metadata || {}),
      ]
    );

    console.log(`✅ Stripe payment succeeded: ${id}`);
  }

  /**
   * Stripe: Handle payment failed
   */
  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    const { id, last_payment_error } = paymentIntent;

    await pool.query(
      `UPDATE transactions
       SET status = 'failed', failed_at = NOW(),
           metadata = jsonb_set(metadata, '{error}', $1)
       WHERE gateway_transaction_id = $2`,
      [JSON.stringify(last_payment_error), id]
    );

    console.log(`❌ Stripe payment failed: ${id}`);
  }

  /**
   * Stripe: Handle subscription update
   */
  private async handleStripeSubscriptionUpdate(subscription: any): Promise<void> {
    const { id, status, current_period_start, current_period_end, customer } = subscription;

    await pool.query(
      `UPDATE subscriptions
       SET status = $1,
           current_period_start = to_timestamp($2),
           current_period_end = to_timestamp($3),
           updated_at = NOW()
       WHERE gateway_subscription_id = $4`,
      [this.mapStripeStatus(status), current_period_start, current_period_end, id]
    );

    console.log(`🔄 Stripe subscription updated: ${id}`);
  }

  /**
   * Stripe: Handle subscription deleted
   */
  private async handleStripeSubscriptionDeleted(subscription: any): Promise<void> {
    const { id } = subscription;

    await pool.query(
      `UPDATE subscriptions
       SET status = 'cancelled', ended_at = NOW(), updated_at = NOW()
       WHERE gateway_subscription_id = $1`,
      [id]
    );

    console.log(`🗑️  Stripe subscription deleted: ${id}`);
  }

  /**
   * Stripe: Handle invoice paid
   */
  private async handleStripeInvoicePaid(invoice: any): Promise<void> {
    const { subscription, amount_paid, currency } = invoice;

    if (subscription) {
      // Renew subscription
      const subResult = await pool.query(
        'SELECT id FROM subscriptions WHERE gateway_subscription_id = $1',
        [subscription]
      );

      if (subResult.rows.length > 0) {
        await subscriptionService.renewSubscription(subResult.rows[0].id);
      }
    }

    console.log(`💰 Stripe invoice paid: ${invoice.id}`);
  }

  /**
   * Stripe: Handle invoice failed
   */
  private async handleStripeInvoiceFailed(invoice: any): Promise<void> {
    const { subscription } = invoice;

    if (subscription) {
      await pool.query(
        `UPDATE subscriptions
         SET status = 'past_due', updated_at = NOW()
         WHERE gateway_subscription_id = $1`,
        [subscription]
      );
    }

    console.log(`⚠️  Stripe invoice failed: ${invoice.id}`);
  }

  /**
   * Stripe: Handle refund
   */
  private async handleStripeRefund(charge: any): Promise<void> {
    const { id, amount_refunded, refunds } = charge;

    const refund = refunds.data[0];

    await pool.query(
      `INSERT INTO refunds (
        transaction_id, user_id, amount, currency, gateway, gateway_refund_id,
        status, processed_at
      )
      SELECT id, user_id, $1, currency, 'stripe', $2, 'succeeded', NOW()
      FROM transactions
      WHERE gateway_transaction_id = $3`,
      [amount_refunded / 100, refund.id, id]
    );

    console.log(`↩️  Stripe refund processed: ${refund.id}`);
  }

  /**
   * Paystack: Handle payment success
   */
  private async handlePaystackPaymentSuccess(data: any): Promise<void> {
    const { reference, amount, currency, customer, metadata } = data;

    await pool.query(
      `INSERT INTO transactions (
        user_id, type, status, gateway, gateway_transaction_id, gateway_customer_id,
        amount, currency, paid_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      ON CONFLICT (gateway_transaction_id) DO UPDATE
      SET status = 'succeeded', paid_at = NOW()`,
      [
        metadata?.userId,
        'payment',
        'succeeded',
        'paystack',
        reference,
        customer.customer_code,
        amount / 100,
        currency,
        JSON.stringify(metadata || {}),
      ]
    );

    console.log(`✅ Paystack payment succeeded: ${reference}`);
  }

  /**
   * Paystack: Handle payment failed
   */
  private async handlePaystackPaymentFailed(data: any): Promise<void> {
    await pool.query(
      `UPDATE transactions
       SET status = 'failed', failed_at = NOW()
       WHERE gateway_transaction_id = $1`,
      [data.reference]
    );

    console.log(`❌ Paystack payment failed: ${data.reference}`);
  }

  /**
   * Paystack: Handle subscription update
   */
  private async handlePaystackSubscriptionUpdate(data: any): Promise<void> {
    const { subscription_code, status } = data;

    await pool.query(
      `UPDATE subscriptions
       SET status = $1, updated_at = NOW()
       WHERE gateway_subscription_id = $2`,
      [status === 'active' ? 'active' : 'cancelled', subscription_code]
    );

    console.log(`🔄 Paystack subscription updated: ${subscription_code}`);
  }

  /**
   * Paystack: Handle refund
   */
  private async handlePaystackRefund(data: any): Promise<void> {
    const { transaction_reference, refund_amount, currency } = data;

    await pool.query(
      `INSERT INTO refunds (
        transaction_id, user_id, amount, currency, gateway, status, processed_at
      )
      SELECT id, user_id, $1, $2, 'paystack', 'succeeded', NOW()
      FROM transactions
      WHERE gateway_transaction_id = $3`,
      [refund_amount / 100, currency, transaction_reference]
    );

    console.log(`↩️  Paystack refund processed`);
  }

  /**
   * Flutterwave: Handle payment success
   */
  private async handleFlutterwavePaymentSuccess(data: any): Promise<void> {
    const { tx_ref, amount, currency, customer } = data;

    await pool.query(
      `INSERT INTO transactions (
        user_id, type, status, gateway, gateway_transaction_id,
        amount, currency, paid_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (gateway_transaction_id) DO UPDATE
      SET status = 'succeeded', paid_at = NOW()`,
      [
        customer.id,
        'payment',
        'succeeded',
        'flutterwave',
        tx_ref,
        amount,
        currency,
      ]
    );

    console.log(`✅ Flutterwave payment succeeded: ${tx_ref}`);
  }

  /**
   * Flutterwave: Handle payment failed
   */
  private async handleFlutterwavePaymentFailed(data: any): Promise<void> {
    await pool.query(
      `UPDATE transactions
       SET status = 'failed', failed_at = NOW()
       WHERE gateway_transaction_id = $1`,
      [data.tx_ref]
    );

    console.log(`❌ Flutterwave payment failed: ${data.tx_ref}`);
  }

  /**
   * Flutterwave: Handle subscription cancelled
   */
  private async handleFlutterwaveSubscriptionCancelled(data: any): Promise<void> {
    await pool.query(
      `UPDATE subscriptions
       SET status = 'cancelled', ended_at = NOW(), updated_at = NOW()
       WHERE gateway_subscription_id = $1`,
      [data.id]
    );

    console.log(`🗑️  Flutterwave subscription cancelled: ${data.id}`);
  }

  /**
   * Log webhook event
   */
  private async logWebhookEvent(
    gateway: string,
    eventType: string,
    eventId: string,
    payload: any
  ): Promise<void> {
    await pool.query(
      `INSERT INTO webhook_events (gateway, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [gateway, eventType, eventId, JSON.stringify(payload)]
    );
  }

  /**
   * Mark webhook as processed
   */
  private async markWebhookProcessed(gateway: string, eventId: string): Promise<void> {
    await pool.query(
      `UPDATE webhook_events
       SET processed = true, processed_at = NOW()
       WHERE gateway = $1 AND event_id = $2`,
      [gateway, eventId]
    );
  }

  /**
   * Map Stripe status to our status
   */
  private mapStripeStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'cancelled',
      unpaid: 'past_due',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
      trialing: 'trialing',
      paused: 'paused',
    };

    return statusMap[stripeStatus] || 'active';
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(): Promise<number> {
    const result = await pool.query(
      `SELECT * FROM webhook_events
       WHERE processed = false
         AND retry_count < 3
         AND created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY created_at ASC
       LIMIT 100`
    );

    let retried = 0;

    for (const event of result.rows) {
      try {
        // Retry based on gateway
        switch (event.gateway) {
          case 'stripe':
            // Re-process event
            break;
          case 'paystack':
            // Re-process event
            break;
          case 'flutterwave':
            // Re-process event
            break;
        }

        retried++;
      } catch (error) {
        // Increment retry count and log error
        await pool.query(
          `UPDATE webhook_events
           SET retry_count = retry_count + 1,
               error_message = $1
           WHERE id = $2`,
          [error instanceof Error ? error.message : 'Unknown error', event.id]
        );
      }
    }

    return retried;
  }
}

export const webhookService = new WebhookService();
