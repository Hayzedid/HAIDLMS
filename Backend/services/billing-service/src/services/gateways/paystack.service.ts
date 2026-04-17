import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY not set');
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Paystack Payment Gateway Service
 */
class PaystackService {
  /**
   * Initialize transaction
   */
  async initializeTransaction(params: {
    email: string;
    amount: number; // in kobo (smallest currency unit)
    reference?: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
    channels?: string[];
  }): Promise<any> {
    const response = await paystackClient.post('/transaction/initialize', {
      email: params.email,
      amount: Math.round(params.amount * 100), // Convert to kobo
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: params.channels,
    });
    return response.data.data;
  }

  /**
   * Verify transaction
   */
  async verifyTransaction(reference: string): Promise<any> {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    return response.data.data;
  }

  /**
   * Charge authorization
   */
  async chargeAuthorization(params: {
    email: string;
    amount: number;
    authorizationCode: string;
    reference?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await paystackClient.post('/transaction/charge_authorization', {
      email: params.email,
      amount: Math.round(params.amount * 100),
      authorization_code: params.authorizationCode,
      reference: params.reference,
      metadata: params.metadata,
    });
    return response.data.data;
  }

  /**
   * Create customer
   */
  async createCustomer(params: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await paystackClient.post('/customer', {
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      metadata: params.metadata,
    });
    return response.data.data;
  }

  /**
   * Get customer
   */
  async getCustomer(emailOrCode: string): Promise<any> {
    const response = await paystackClient.get(`/customer/${emailOrCode}`);
    return response.data.data;
  }

  /**
   * Update customer
   */
  async updateCustomer(
    code: string,
    params: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    const response = await paystackClient.put(`/customer/${code}`, {
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      metadata: params.metadata,
    });
    return response.data.data;
  }

  /**
   * Create subscription
   */
  async createSubscription(params: {
    customer: string; // customer email or code
    plan: string; // plan code
    authorization?: string; // authorization code
    startDate?: string;
  }): Promise<any> {
    const response = await paystackClient.post('/subscription', {
      customer: params.customer,
      plan: params.plan,
      authorization: params.authorization,
      start_date: params.startDate,
    });
    return response.data.data;
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionCode: string): Promise<any> {
    const response = await paystackClient.get(`/subscription/${subscriptionCode}`);
    return response.data.data;
  }

  /**
   * Enable subscription
   */
  async enableSubscription(params: {
    code: string;
    token: string;
  }): Promise<any> {
    const response = await paystackClient.post('/subscription/enable', {
      code: params.code,
      token: params.token,
    });
    return response.data.data;
  }

  /**
   * Disable subscription
   */
  async disableSubscription(params: {
    code: string;
    token: string;
  }): Promise<any> {
    const response = await paystackClient.post('/subscription/disable', {
      code: params.code,
      token: params.token,
    });
    return response.data.data;
  }

  /**
   * Create plan
   */
  async createPlan(params: {
    name: string;
    amount: number;
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'annually';
    description?: string;
    currency?: string;
    invoiceLimit?: number;
  }): Promise<any> {
    const response = await paystackClient.post('/plan', {
      name: params.name,
      amount: Math.round(params.amount * 100),
      interval: params.interval,
      description: params.description,
      currency: params.currency || 'NGN',
      invoice_limit: params.invoiceLimit,
    });
    return response.data.data;
  }

  /**
   * Get plan
   */
  async getPlan(planCode: string): Promise<any> {
    const response = await paystackClient.get(`/plan/${planCode}`);
    return response.data.data;
  }

  /**
   * Create refund
   */
  async createRefund(params: {
    transaction: string; // transaction reference or id
    amount?: number;
    currency?: string;
    customerNote?: string;
    merchantNote?: string;
  }): Promise<any> {
    const response = await paystackClient.post('/refund', {
      transaction: params.transaction,
      amount: params.amount ? Math.round(params.amount * 100) : undefined,
      currency: params.currency,
      customer_note: params.customerNote,
      merchant_note: params.merchantNote,
    });
    return response.data.data;
  }

  /**
   * Get refund
   */
  async getRefund(reference: string): Promise<any> {
    const response = await paystackClient.get(`/refund/${reference}`);
    return response.data.data;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * List transactions
   */
  async listTransactions(params?: {
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
    amount?: number;
    perPage?: number;
    page?: number;
  }): Promise<any> {
    const response = await paystackClient.get('/transaction', { params });
    return response.data.data;
  }

  /**
   * Get transaction
   */
  async getTransaction(id: number): Promise<any> {
    const response = await paystackClient.get(`/transaction/${id}`);
    return response.data.data;
  }
}

export const paystackService = new PaystackService();
