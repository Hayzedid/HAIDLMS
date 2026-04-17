import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateInvoiceParams {
  userId: string;
  invoiceType: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  courseId?: string;
  enrollmentId?: string;
  subscriptionId?: string;
  transactionId?: string;
  billingDetails?: any;
}

// ============================================================================
// FINANCIAL SERVICE
// ============================================================================

export class FinancialService {
  // ========================================
  // INVOICES
  // ========================================

  async createInvoice(params: CreateInvoiceParams): Promise<any> {
    const {
      userId,
      invoiceType,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      courseId,
      enrollmentId,
      subscriptionId,
      transactionId,
      billingDetails
    } = params;

    const totalAmount = subtotal - discountAmount + taxAmount;

    const invoiceNumberResult = await pool.query(`SELECT generate_invoice_number_v2() as invoice_number`);
    const invoiceNumber = invoiceNumberResult.rows[0].invoice_number;

    const result = await pool.query(
      `INSERT INTO invoices (
        invoice_number, user_id, invoice_type, course_id, enrollment_id,
        subscription_id, transaction_id, subtotal, discount_amount,
        tax_amount, total_amount, billing_name, billing_email, billing_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        invoiceNumber, userId, invoiceType, courseId, enrollmentId,
        subscriptionId, transactionId, subtotal, discountAmount,
        taxAmount, totalAmount, billingDetails?.name, billingDetails?.email,
        billingDetails?.address ? JSON.stringify(billingDetails.address) : null
      ]
    );

    return result.rows[0];
  }

  async getInvoice(invoiceId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [invoiceId]
    );
    return result.rows[0];
  }

  async listUserInvoices(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM invoices WHERE user_id = $1 ORDER BY invoice_date DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM invoices WHERE user_id = $1`,
      [userId]
    );

    return {
      invoices: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  async markInvoiceAsPaid(invoiceId: string, transactionId: string): Promise<void> {
    await pool.query(
      `UPDATE invoices
      SET payment_status = 'paid', paid_at = NOW(), transaction_id = $1, updated_at = NOW()
      WHERE id = $2`,
      [transactionId, invoiceId]
    );
  }

  // ========================================
  // RECEIPTS
  // ========================================

  async getReceipt(receiptId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM receipts WHERE id = $1`,
      [receiptId]
    );
    return result.rows[0];
  }

  async listUserReceipts(userId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM receipts WHERE user_id = $1 ORDER BY payment_date DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM receipts WHERE user_id = $1`,
      [userId]
    );

    return {
      receipts: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  // ========================================
  // TAX MANAGEMENT
  // ========================================

  async calculateTax(amount: number, countryCode: string, stateProvince?: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM calculate_tax($1, $2, $3)`,
      [amount, countryCode, stateProvince]
    );

    return result.rows[0];
  }

  async createTaxRate(params: any): Promise<any> {
    const {
      taxName,
      taxType,
      taxRate,
      countryCode,
      stateProvince,
      appliesTo = 'all'
    } = params;

    const result = await pool.query(
      `INSERT INTO tax_rates (
        tax_name, tax_type, tax_rate, country_code, state_province, applies_to
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [taxName, taxType, taxRate, countryCode, stateProvince, appliesTo]
    );

    return result.rows[0];
  }

  async listTaxRates(filters: any = {}): Promise<any[]> {
    const { countryCode, isActive = true, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM tax_rates WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (countryCode) {
      query += ` AND country_code = $${paramIndex}`;
      params.push(countryCode);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY country_code, state_province LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // INSTRUCTOR PAYOUTS
  // ========================================

  async createInstructorPayout(instructorId: string, periodStart: Date, periodEnd: Date): Promise<any> {
    // Calculate payout amounts
    const revenueResult = await pool.query(
      `SELECT
        SUM(pt.amount) as gross_revenue,
        SUM(pt.platform_fee) as platform_fee,
        SUM(pt.payment_processing_fee) as processing_fee,
        SUM(pt.instructor_payout) as instructor_payout
      FROM payment_transactions pt
      JOIN courses c ON pt.course_id = c.id
      WHERE c.instructor_id = $1
        AND pt.status = 'succeeded'
        AND pt.completed_at BETWEEN $2 AND $3`,
      [instructorId, periodStart, periodEnd]
    );

    const revenue = revenueResult.rows[0];

    if (!revenue.instructor_payout || revenue.instructor_payout <= 0) {
      throw new Error('No earnings for this period');
    }

    const payoutNumberResult = await pool.query(`SELECT generate_payout_number() as payout_number`);
    const payoutNumber = payoutNumberResult.rows[0].payout_number;

    const netPayout = revenue.instructor_payout || 0;

    const result = await pool.query(
      `INSERT INTO instructor_payouts (
        payout_number, instructor_id, period_start, period_end,
        gross_revenue, platform_fee, processing_fee, net_payout
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        payoutNumber, instructorId, periodStart, periodEnd,
        revenue.gross_revenue || 0, revenue.platform_fee || 0,
        revenue.processing_fee || 0, netPayout
      ]
    );

    const payout = result.rows[0];

    // Link transactions to payout
    await pool.query(
      `INSERT INTO payout_transactions (payout_id, transaction_id, course_id, student_id, transaction_amount, instructor_share, platform_share)
      SELECT $1, pt.id, pt.course_id, pt.user_id, pt.amount, pt.instructor_payout, pt.platform_fee
      FROM payment_transactions pt
      JOIN courses c ON pt.course_id = c.id
      WHERE c.instructor_id = $2
        AND pt.status = 'succeeded'
        AND pt.completed_at BETWEEN $3 AND $4`,
      [payout.id, instructorId, periodStart, periodEnd]
    );

    return payout;
  }

  async getInstructorPayout(payoutId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM instructor_payouts WHERE id = $1`,
      [payoutId]
    );
    return result.rows[0];
  }

  async listInstructorPayouts(instructorId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM instructor_payouts WHERE instructor_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [instructorId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM instructor_payouts WHERE instructor_id = $1`,
      [instructorId]
    );

    return {
      payouts: result.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  }

  async markPayoutAsPaid(payoutId: string, providerPayoutId?: string): Promise<void> {
    await pool.query(
      `UPDATE instructor_payouts
      SET status = 'paid', paid_at = NOW(), provider_payout_id = $1, updated_at = NOW()
      WHERE id = $2`,
      [providerPayoutId, payoutId]
    );
  }

  // ========================================
  // FINANCIAL REPORTS
  // ========================================

  async generateRevenueReport(startDate: Date, endDate: Date): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM revenue_summary WHERE date BETWEEN $1 AND $2 ORDER BY date DESC`,
      [startDate, endDate]
    );

    return result.rows;
  }

  async getCourseRevenueSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM course_revenue_summary ORDER BY total_revenue DESC`);
    return result.rows;
  }

  async getInstructorEarnings(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM instructor_earnings ORDER BY total_earnings DESC`);
    return result.rows;
  }

  async getOutstandingInvoices(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM outstanding_invoices ORDER BY days_overdue DESC`);
    return result.rows;
  }

  async getPendingPayouts(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM pending_instructor_payouts ORDER BY created_at`);
    return result.rows;
  }

  // ========================================
  // REVENUE SHARING
  // ========================================

  async createRevenueSharingRule(params: any): Promise<any> {
    const {
      ruleName,
      appliesTo = 'all',
      courseId,
      instructorId,
      instructorPercentage = 70.00,
      platformPercentage = 30.00
    } = params;

    const result = await pool.query(
      `INSERT INTO revenue_sharing_rules (
        rule_name, applies_to, course_id, instructor_id,
        instructor_percentage, platform_percentage
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [ruleName, appliesTo, courseId, instructorId, instructorPercentage, platformPercentage]
    );

    return result.rows[0];
  }

  async calculateInstructorShare(transactionAmount: number, courseId: string, instructorId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM calculate_instructor_share($1, $2, $3)`,
      [transactionAmount, courseId, instructorId]
    );

    return result.rows[0];
  }
}

export const financialService = new FinancialService();
