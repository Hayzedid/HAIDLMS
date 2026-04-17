import pool from '../db/pool';
import Stripe from 'stripe';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreatePaymentIntentParams {
  userId: string;
  amount: number;
  currency?: string;
  courseId?: string;
  enrollmentId?: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: any;
}

interface ProcessPaymentParams {
  transactionId: string;
  providerTransactionId: string;
  providerChargeId?: string;
  status: string;
  failureCode?: string;
  failureMessage?: string;
}

interface CreateRefundParams {
  transactionId: string;
  refundAmount: number;
  refundReason: string;
  refundType?: string;
  requestedBy: string;
  customerNote?: string;
  adminNote?: string;
}

interface CreatePaymentMethodParams {
  userId: string;
  providerId: string;
  methodType: string;
  providerPaymentMethodId: string;
  providerCustomerId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: any;
  isDefault?: boolean;
}

interface WebhookEventParams {
  providerId: string;
  providerEventId: string;
  eventType: string;
  payload: any;
}

// ============================================================================
// PAYMENTS SERVICE
// ============================================================================

export class PaymentsService {
  private stripeClients: Map<string, Stripe> = new Map();

  // ========================================
  // PAYMENT PROVIDER MANAGEMENT
  // ========================================

  async getProvider(providerId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_providers WHERE id = $1 AND is_active = true`,
      [providerId]
    );
    return result.rows[0];
  }

  async getProviderByName(providerName: string, organizationId?: string): Promise<any> {
    let query = `SELECT * FROM payment_providers WHERE provider_name = $1 AND is_active = true`;
    const params: any[] = [providerName];

    if (organizationId) {
      query += ` AND organization_id = $2`;
      params.push(organizationId);
    } else {
      query += ` AND organization_id IS NULL`;
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getStripeClient(providerId: string): Promise<Stripe> {
    if (this.stripeClients.has(providerId)) {
      return this.stripeClients.get(providerId)!;
    }

    const provider = await this.getProvider(providerId);
    if (!provider || provider.provider_name !== 'stripe') {
      throw new Error('Invalid Stripe provider');
    }

    const stripe = new Stripe(provider.api_key_secret, {
      apiVersion: '2024-12-18.acacia',
    });

    this.stripeClients.set(providerId, stripe);
    return stripe;
  }

  // ========================================
  // PAYMENT METHODS
  // ========================================

  async createPaymentMethod(params: CreatePaymentMethodParams): Promise<any> {
    const {
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
      isDefault = false
    } = params;

    const result = await pool.query(
      `INSERT INTO payment_methods (
        user_id, provider_id, method_type, provider_payment_method_id,
        provider_customer_id, card_last4, card_brand, card_exp_month,
        card_exp_year, billing_name, billing_email, billing_address, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId, providerId, methodType, providerPaymentMethodId,
        providerCustomerId, cardLast4, cardBrand, cardExpMonth,
        cardExpYear, billingName, billingEmail,
        billingAddress ? JSON.stringify(billingAddress) : null,
        isDefault
      ]
    );

    return result.rows[0];
  }

  async listUserPaymentMethods(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM active_payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getPaymentMethod(paymentMethodId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_methods WHERE id = $1`,
      [paymentMethodId]
    );
    return result.rows[0];
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await pool.query(
      `UPDATE payment_methods SET is_default = true WHERE id = $1 AND user_id = $2`,
      [paymentMethodId, userId]
    );
  }

  async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE payment_methods SET status = 'removed', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [paymentMethodId, userId]
    );
  }

  // ========================================
  // PAYMENT TRANSACTIONS
  // ========================================

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<any> {
    const {
      userId,
      amount,
      currency = 'USD',
      courseId,
      enrollmentId,
      subscriptionId,
      paymentMethodId,
      description,
      metadata = {}
    } = params;

    // Get default provider (Stripe)
    const provider = await this.getProviderByName('stripe');
    if (!provider) {
      throw new Error('No payment provider configured');
    }

    // Generate transaction number
    const txnNumberResult = await pool.query(`SELECT generate_transaction_number() as txn_number`);
    const transactionNumber = txnNumberResult.rows[0].txn_number;

    // Generate idempotency key
    const idempotencyKey = `${transactionNumber}_${Date.now()}`;

    // Create transaction record
    const result = await pool.query(
      `INSERT INTO payment_transactions (
        transaction_number, user_id, provider_id, payment_method_id,
        transaction_type, course_id, enrollment_id, subscription_id,
        amount, currency, status, description, metadata, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        transactionNumber, userId, provider.id, paymentMethodId,
        subscriptionId ? 'subscription' : 'purchase',
        courseId, enrollmentId, subscriptionId,
        amount, currency, 'pending', description,
        JSON.stringify(metadata), idempotencyKey
      ]
    );

    const transaction = result.rows[0];

    // Create Stripe payment intent
    try {
      const stripe = await this.getStripeClient(provider.id);

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          transaction_id: transaction.id,
          user_id: userId,
          course_id: courseId || '',
          ...metadata
        },
        description: description || `Payment for ${courseId ? 'course' : 'subscription'}`
      };

      // Attach payment method if provided
      if (paymentMethodId) {
        const paymentMethod = await this.getPaymentMethod(paymentMethodId);
        if (paymentMethod && paymentMethod.provider_payment_method_id) {
          paymentIntentParams.payment_method = paymentMethod.provider_payment_method_id;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      // Update transaction with provider ID
      await pool.query(
        `UPDATE payment_transactions
        SET provider_transaction_id = $1, status = 'processing', updated_at = NOW()
        WHERE id = $2`,
        [paymentIntent.id, transaction.id]
      );

      // Log payment initiation
      await this.logPaymentEvent({
        transactionId: transaction.id,
        userId,
        eventType: 'payment_initiated',
        message: 'Payment intent created',
        providerName: provider.provider_name,
        providerTransactionId: paymentIntent.id,
        requestData: paymentIntentParams
      });

      return {
        ...transaction,
        provider_transaction_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: 'processing'
      };
    } catch (error: any) {
      // Update transaction as failed
      await pool.query(
        `UPDATE payment_transactions
        SET status = 'failed', failure_message = $1, failed_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
        [error.message, transaction.id]
      );

      await this.logPaymentEvent({
        transactionId: transaction.id,
        userId,
        eventType: 'payment_failed',
        message: `Failed to create payment intent: ${error.message}`,
        providerName: provider.provider_name,
        errorCode: error.code,
        errorMessage: error.message
      });

      throw error;
    }
  }

  async processPayment(params: ProcessPaymentParams): Promise<any> {
    const {
      transactionId,
      providerTransactionId,
      providerChargeId,
      status,
      failureCode,
      failureMessage
    } = params;

    const updates: any = {
      provider_transaction_id: providerTransactionId,
      status
    };

    if (providerChargeId) {
      updates.provider_charge_id = providerChargeId;
    }

    if (status === 'succeeded') {
      updates.completed_at = new Date().toISOString();
    } else if (status === 'failed') {
      updates.failed_at = new Date().toISOString();
      updates.failure_code = failureCode;
      updates.failure_message = failureMessage;
    }

    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`);
    const values = Object.values(updates);
    values.push(transactionId);

    const result = await pool.query(
      `UPDATE payment_transactions
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async getTransaction(transactionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_transactions WHERE id = $1`,
      [transactionId]
    );
    return result.rows[0];
  }

  async getTransactionByProviderTxnId(providerTransactionId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_transactions WHERE provider_transaction_id = $1`,
      [providerTransactionId]
    );
    return result.rows[0];
  }

  async listUserTransactions(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM payment_transactions WHERE user_id = $1`,
      [userId]
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  // ========================================
  // REFUNDS
  // ========================================

  async createRefund(params: CreateRefundParams): Promise<any> {
    const {
      transactionId,
      refundAmount,
      refundReason,
      refundType = 'full',
      requestedBy,
      customerNote,
      adminNote
    } = params;

    // Get original transaction
    const transaction = await this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'succeeded') {
      throw new Error('Can only refund successful transactions');
    }

    // Generate refund number
    const refundNumberResult = await pool.query(`SELECT generate_refund_number() as refund_number`);
    const refundNumber = refundNumberResult.rows[0].refund_number;

    // Create refund record
    const result = await pool.query(
      `INSERT INTO payment_refunds (
        refund_number, transaction_id, provider_id, refund_amount,
        refund_reason, refund_type, requested_by, customer_note, admin_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        refundNumber, transactionId, transaction.provider_id, refundAmount,
        refundReason, refundType, requestedBy, customerNote, adminNote
      ]
    );

    const refund = result.rows[0];

    // Process refund with provider
    try {
      const provider = await this.getProvider(transaction.provider_id);

      if (provider.provider_name === 'stripe') {
        const stripe = await this.getStripeClient(provider.id);

        const stripeRefund = await stripe.refunds.create({
          payment_intent: transaction.provider_transaction_id,
          amount: Math.round(refundAmount * 100),
          reason: this.mapRefundReason(refundReason),
          metadata: {
            refund_id: refund.id,
            transaction_id: transactionId
          }
        });

        // Update refund with provider ID
        await pool.query(
          `UPDATE payment_refunds
          SET provider_refund_id = $1, status = 'processing', updated_at = NOW()
          WHERE id = $2`,
          [stripeRefund.id, refund.id]
        );

        await this.logPaymentEvent({
          transactionId,
          refundId: refund.id,
          userId: transaction.user_id,
          eventType: 'refund_initiated',
          message: 'Refund initiated',
          providerName: provider.provider_name,
          providerTransactionId: stripeRefund.id
        });

        return { ...refund, provider_refund_id: stripeRefund.id, status: 'processing' };
      }

      throw new Error(`Refunds not implemented for provider: ${provider.provider_name}`);
    } catch (error: any) {
      await pool.query(
        `UPDATE payment_refunds
        SET status = 'failed', failure_reason = $1, updated_at = NOW()
        WHERE id = $2`,
        [error.message, refund.id]
      );

      await this.logPaymentEvent({
        transactionId,
        refundId: refund.id,
        userId: transaction.user_id,
        eventType: 'refund_failed',
        message: `Refund failed: ${error.message}`,
        errorMessage: error.message
      });

      throw error;
    }
  }

  async getRefund(refundId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM payment_refunds WHERE id = $1`,
      [refundId]
    );
    return result.rows[0];
  }

  async listTransactionRefunds(transactionId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM payment_refunds WHERE transaction_id = $1 ORDER BY created_at DESC`,
      [transactionId]
    );
    return result.rows;
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  async handleWebhook(params: WebhookEventParams): Promise<any> {
    const { providerId, providerEventId, eventType, payload } = params;

    // Check if webhook already processed
    const existing = await pool.query(
      `SELECT id FROM payment_webhooks WHERE provider_event_id = $1`,
      [providerEventId]
    );

    if (existing.rows.length > 0) {
      return { status: 'already_processed' };
    }

    // Create webhook record
    const result = await pool.query(
      `INSERT INTO payment_webhooks (
        provider_id, provider_event_id, event_type, payload
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [providerId, providerEventId, eventType, JSON.stringify(payload)]
    );

    const webhook = result.rows[0];

    // Process webhook asynchronously
    this.processWebhook(webhook.id).catch(console.error);

    return webhook;
  }

  async processWebhook(webhookId: string): Promise<void> {
    const result = await pool.query(
      `SELECT * FROM payment_webhooks WHERE id = $1`,
      [webhookId]
    );

    const webhook = result.rows[0];
    if (!webhook) return;

    try {
      await pool.query(
        `UPDATE payment_webhooks
        SET status = 'processing', processing_attempts = processing_attempts + 1,
            last_processing_attempt = NOW()
        WHERE id = $1`,
        [webhookId]
      );

      const provider = await this.getProvider(webhook.provider_id);
      const payload = webhook.payload;

      // Handle different event types
      if (webhook.event_type.startsWith('payment_intent.')) {
        await this.handlePaymentIntentWebhook(provider, webhook.event_type, payload);
      } else if (webhook.event_type.startsWith('charge.')) {
        await this.handleChargeWebhook(provider, webhook.event_type, payload);
      } else if (webhook.event_type.startsWith('refund.')) {
        await this.handleRefundWebhook(provider, webhook.event_type, payload);
      }

      await pool.query(
        `UPDATE payment_webhooks SET status = 'processed', processed_at = NOW() WHERE id = $1`,
        [webhookId]
      );
    } catch (error: any) {
      await pool.query(
        `UPDATE payment_webhooks
        SET status = 'failed', error_message = $1
        WHERE id = $2`,
        [error.message, webhookId]
      );
      throw error;
    }
  }

  private async handlePaymentIntentWebhook(provider: any, eventType: string, payload: any): Promise<void> {
    const paymentIntent = payload.object || payload;
    const providerTransactionId = paymentIntent.id;

    const transaction = await this.getTransactionByProviderTxnId(providerTransactionId);
    if (!transaction) {
      console.warn(`Transaction not found for payment intent: ${providerTransactionId}`);
      return;
    }

    if (eventType === 'payment_intent.succeeded') {
      await this.processPayment({
        transactionId: transaction.id,
        providerTransactionId,
        providerChargeId: paymentIntent.latest_charge,
        status: 'succeeded'
      });

      await this.logPaymentEvent({
        transactionId: transaction.id,
        userId: transaction.user_id,
        eventType: 'payment_succeeded',
        message: 'Payment completed successfully',
        providerName: provider.provider_name,
        providerTransactionId
      });
    } else if (eventType === 'payment_intent.payment_failed') {
      await this.processPayment({
        transactionId: transaction.id,
        providerTransactionId,
        status: 'failed',
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message
      });

      await this.logPaymentEvent({
        transactionId: transaction.id,
        userId: transaction.user_id,
        eventType: 'payment_failed',
        message: 'Payment failed',
        providerName: provider.provider_name,
        providerTransactionId,
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message
      });
    }
  }

  private async handleChargeWebhook(provider: any, eventType: string, payload: any): Promise<void> {
    // Handle charge-specific webhooks
    console.log(`Handling charge webhook: ${eventType}`);
  }

  private async handleRefundWebhook(provider: any, eventType: string, payload: any): Promise<void> {
    const refund = payload.object || payload;
    const providerTransactionId = refund.payment_intent;

    const transaction = await this.getTransactionByProviderTxnId(providerTransactionId);
    if (!transaction) return;

    const refundRecord = await pool.query(
      `SELECT * FROM payment_refunds WHERE provider_refund_id = $1`,
      [refund.id]
    );

    if (refundRecord.rows.length === 0) return;

    if (eventType === 'charge.refunded' || eventType === 'refund.updated') {
      const status = refund.status === 'succeeded' ? 'succeeded' : refund.status === 'failed' ? 'failed' : 'processing';

      await pool.query(
        `UPDATE payment_refunds
        SET status = $1, processed_at = NOW(), updated_at = NOW()
        WHERE id = $2`,
        [status, refundRecord.rows[0].id]
      );
    }
  }

  // ========================================
  // PAYMENT LOGS
  // ========================================

  async logPaymentEvent(params: any): Promise<void> {
    const {
      transactionId,
      refundId,
      webhookId,
      userId,
      logLevel = 'info',
      eventType,
      message,
      providerName,
      providerTransactionId,
      requestData,
      responseData,
      errorCode,
      errorMessage
    } = params;

    await pool.query(
      `INSERT INTO payment_logs (
        transaction_id, refund_id, webhook_id, user_id, log_level,
        event_type, message, provider_name, provider_transaction_id,
        request_data, response_data, error_code, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        transactionId || null, refundId || null, webhookId || null,
        userId || null, logLevel, eventType, message, providerName,
        providerTransactionId,
        requestData ? JSON.stringify(requestData) : null,
        responseData ? JSON.stringify(responseData) : null,
        errorCode, errorMessage
      ]
    );
  }

  // ========================================
  // HELPERS
  // ========================================

  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const mapping: { [key: string]: Stripe.RefundCreateParams.Reason } = {
      customer_request: 'requested_by_customer',
      duplicate: 'duplicate',
      fraudulent: 'fraudulent'
    };
    return mapping[reason] || 'requested_by_customer';
  }
}

export const paymentsService = new PaymentsService();
