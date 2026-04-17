import axios from 'axios';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

if (!FLUTTERWAVE_SECRET_KEY) {
  console.warn('⚠️  FLUTTERWAVE_SECRET_KEY not set');
}

const flutterwaveClient = axios.create({
  baseURL: FLUTTERWAVE_BASE_URL,
  headers: {
    Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Flutterwave Payment Gateway Service
 */
class FlutterwaveService {
  /**
   * Initialize payment
   */
  async initializePayment(params: {
    txRef: string;
    amount: number;
    currency: string;
    redirectUrl: string;
    customer: {
      email: string;
      phonenumber?: string;
      name?: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
    meta?: Record<string, any>;
    paymentOptions?: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/payments', {
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: params.customer,
      customizations: params.customizations,
      meta: params.meta,
      payment_options: params.paymentOptions || 'card,mobilemoney,ussd',
    });
    return response.data.data;
  }

  /**
   * Verify transaction
   */
  async verifyTransaction(transactionId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/transactions/${transactionId}/verify`);
    return response.data.data;
  }

  /**
   * Charge card
   */
  async chargeCard(params: {
    cardNumber: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    currency: string;
    amount: number;
    email: string;
    fullname: string;
    txRef: string;
    redirectUrl?: string;
    authorization?: {
      mode: string;
      pin?: string;
    };
  }): Promise<any> {
    const response = await flutterwaveClient.post('/charges?type=card', {
      card_number: params.cardNumber,
      cvv: params.cvv,
      expiry_month: params.expiryMonth,
      expiry_year: params.expiryYear,
      currency: params.currency,
      amount: params.amount,
      email: params.email,
      fullname: params.fullname,
      tx_ref: params.txRef,
      redirect_url: params.redirectUrl,
      authorization: params.authorization,
    });
    return response.data.data;
  }

  /**
   * Tokenize card
   */
  async tokenizeCard(params: {
    cardNumber: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    currency: string;
    amount: number;
    email: string;
    fullname: string;
    txRef: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/charges?type=card', {
      card_number: params.cardNumber,
      cvv: params.cvv,
      expiry_month: params.expiryMonth,
      expiry_year: params.expiryYear,
      currency: params.currency,
      amount: params.amount,
      email: params.email,
      fullname: params.fullname,
      tx_ref: params.txRef,
      enckey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    });
    return response.data.data;
  }

  /**
   * Charge saved card
   */
  async chargeSavedCard(params: {
    token: string;
    currency: string;
    country: string;
    amount: number;
    email: string;
    txRef: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/tokenized-charges', {
      token: params.token,
      currency: params.currency,
      country: params.country,
      amount: params.amount,
      email: params.email,
      tx_ref: params.txRef,
    });
    return response.data.data;
  }

  /**
   * Create customer
   */
  async createCustomer(params: {
    email: string;
    fullname: string;
    phonenumber?: string;
    meta?: Record<string, any>;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/customers', {
      email: params.email,
      fullname: params.fullname,
      phonenumber: params.phonenumber,
      meta: params.meta,
    });
    return response.data.data;
  }

  /**
   * Get customer
   */
  async getCustomer(customerId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/customers/${customerId}`);
    return response.data.data;
  }

  /**
   * Update customer
   */
  async updateCustomer(
    customerId: string,
    params: {
      fullname?: string;
      phonenumber?: string;
      meta?: Record<string, any>;
    }
  ): Promise<any> {
    const response = await flutterwaveClient.put(`/customers/${customerId}`, params);
    return response.data.data;
  }

  /**
   * Create payment plan
   */
  async createPaymentPlan(params: {
    amount: number;
    name: string;
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
    duration?: number;
    currency?: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/payment-plans', {
      amount: params.amount,
      name: params.name,
      interval: params.interval,
      duration: params.duration,
      currency: params.currency || 'NGN',
    });
    return response.data.data;
  }

  /**
   * Get payment plan
   */
  async getPaymentPlan(planId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/payment-plans/${planId}`);
    return response.data.data;
  }

  /**
   * Cancel payment plan
   */
  async cancelPaymentPlan(planId: string): Promise<any> {
    const response = await flutterwaveClient.put(`/payment-plans/${planId}/cancel`);
    return response.data.data;
  }

  /**
   * Create subscription
   */
  async createSubscription(params: {
    amount: number;
    customer: {
      email: string;
      fullname: string;
    };
    planId: string;
    txRef: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/subscriptions', {
      amount: params.amount,
      customer: params.customer,
      plan: params.planId,
      tx_ref: params.txRef,
    });
    return response.data.data;
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/subscriptions/${subscriptionId}`);
    return response.data.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    const response = await flutterwaveClient.put(`/subscriptions/${subscriptionId}/cancel`);
    return response.data.data;
  }

  /**
   * Create refund
   */
  async createRefund(params: {
    transactionId: string;
    amount?: number;
    comments?: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/refunds', {
      id: params.transactionId,
      amount: params.amount,
      comments: params.comments,
    });
    return response.data.data;
  }

  /**
   * Get refund
   */
  async getRefund(refundId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/refunds/${refundId}`);
    return response.data.data;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', FLUTTERWAVE_SECRET_KEY)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  /**
   * List transactions
   */
  async listTransactions(params?: {
    from?: string;
    to?: string;
    page?: number;
    customer_email?: string;
    status?: string;
    tx_ref?: string;
    currency?: string;
  }): Promise<any> {
    const response = await flutterwaveClient.get('/transactions', { params });
    return response.data.data;
  }

  /**
   * Get transaction
   */
  async getTransaction(transactionId: string): Promise<any> {
    const response = await flutterwaveClient.get(`/transactions/${transactionId}`);
    return response.data.data;
  }

  /**
   * Get balance
   */
  async getBalance(currency: string): Promise<any> {
    const response = await flutterwaveClient.get(`/balances/${currency}`);
    return response.data.data;
  }

  /**
   * Transfer funds
   */
  async transfer(params: {
    accountBank: string;
    accountNumber: string;
    amount: number;
    currency: string;
    reference: string;
    narration?: string;
    beneficiaryName?: string;
  }): Promise<any> {
    const response = await flutterwaveClient.post('/transfers', {
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount,
      currency: params.currency,
      reference: params.reference,
      narration: params.narration,
      beneficiary_name: params.beneficiaryName,
    });
    return response.data.data;
  }
}

export const flutterwaveService = new FlutterwaveService();
