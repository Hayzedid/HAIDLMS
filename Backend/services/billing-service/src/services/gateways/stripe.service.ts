import Stripe from "stripe";
import type {
  Subscription,
  SubscriptionUpdateParams,
  Price,
  Product,
  Refund,
  Invoice,
  Coupon,
  DeletedCoupon,
  Event,
  Balance,
  Charge,
  Customer,
  CustomerUpdateParams,
  PaymentIntent,
  SetupIntent,
  PaymentMethod,
} from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️  STRIPE_SECRET_KEY not set");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

/**
 * Stripe Payment Gateway Service
 */
class StripeService {
  /**
   * Create a customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Customer> {
    return await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  /**
   * Get customer
   */
  async getCustomer(customerId: string): Promise<Customer> {
    return (await stripe.customers.retrieve(customerId)) as Customer;
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: CustomerUpdateParams,
  ): Promise<Customer> {
    return await stripe.customers.update(customerId, params);
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<PaymentIntent> {
    return await stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      metadata: params.metadata,
      description: params.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<PaymentIntent> {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Create setup intent (for saving payment method)
   */
  async createSetupIntent(customerId: string): Promise<SetupIntent> {
    return await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<PaymentMethod> {
    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return await stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * Get payment method
   */
  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const response = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return response.data;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  /**
   * Create subscription
   */
  async createSubscription(params: {
    customerId: string;
    priceId?: string;
    items?: Array<{ price: string; quantity?: number }>;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
    defaultPaymentMethod?: string;
  }): Promise<Stripe.Subscription> {
    const items =
      params.items || (params.priceId ? [{ price: params.priceId }] : []);

    return await stripe.subscriptions.create({
      customer: params.customerId,
      items,
      trial_period_days: params.trialPeriodDays,
      metadata: params.metadata,
      default_payment_method: params.defaultPaymentMethod,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    params: SubscriptionUpdateParams,
  ): Promise<Subscription> {
    return await stripe.subscriptions.update(subscriptionId, params);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately = false,
  ): Promise<Subscription> {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Create price
   */
  async createPrice(params: {
    productId?: string;
    unitAmount: number;
    currency: string;
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      intervalCount?: number;
    };
    metadata?: Record<string, string>;
  }): Promise<Price> {
    return await stripe.prices.create({
      product: params.productId,
      unit_amount: Math.round(params.unitAmount * 100),
      currency: params.currency.toLowerCase(),
      recurring: params.recurring,
      metadata: params.metadata,
    });
  }

  /**
   * Create product
   */
  async createProduct(params: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Product> {
    return await stripe.products.create({
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    });
  }

  /**
   * Create refund
   */
  async createRefund(params: {
    paymentIntentId?: string;
    chargeId?: string;
    amount?: number;
    reason?: "duplicate" | "fraudulent" | "requested_by_customer";
    metadata?: Record<string, string>;
  }): Promise<Refund> {
    return await stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      charge: params.chargeId,
      amount: params.amount ? Math.round(params.amount * 100) : undefined,
      reason: params.reason,
      metadata: params.metadata,
    });
  }

  /**
   * Get refund
   */
  async getRefund(refundId: string): Promise<Refund> {
    return await stripe.refunds.retrieve(refundId);
  }

  /**
   * Create invoice
   */
  async createInvoice(params: {
    customerId: string;
    description?: string;
    metadata?: Record<string, string>;
    daysUntilDue?: number;
  }): Promise<Invoice> {
    return await stripe.invoices.create({
      customer: params.customerId,
      description: params.description,
      metadata: params.metadata,
      days_until_due: params.daysUntilDue,
    });
  }

  /**
   * Finalize invoice
   */
  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    return await stripe.invoices.finalizeInvoice(invoiceId);
  }

  /**
   * Pay invoice
   */
  async payInvoice(invoiceId: string): Promise<Invoice> {
    return await stripe.invoices.pay(invoiceId);
  }

  /**
   * Create coupon
   */
  async createCoupon(params: {
    id?: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: "forever" | "once" | "repeating";
    durationInMonths?: number;
    maxRedemptions?: number;
    redeemBy?: number;
  }): Promise<Stripe.Coupon> {
    return await stripe.coupons.create({
      id: params.id,
      percent_off: params.percentOff,
      amount_off: params.amountOff
        ? Math.round(params.amountOff * 100)
        : undefined,
      currency: params.currency?.toLowerCase(),
      duration: params.duration,
      duration_in_months: params.durationInMonths,
      max_redemptions: params.maxRedemptions,
      redeem_by: params.redeemBy,
    });
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(couponId: string): Promise<DeletedCoupon> {
    return await stripe.coupons.del(couponId);
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Event {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<Balance> {
    return await stripe.balance.retrieve();
  }

  /**
   * List charges
   */
  async listCharges(params?: {
    customer?: string;
    limit?: number;
  }): Promise<Charge[]> {
    const response = await stripe.charges.list({
      customer: params?.customer,
      limit: params?.limit || 10,
    });
    return response.data;
  }
}

export const stripeService = new StripeService();
