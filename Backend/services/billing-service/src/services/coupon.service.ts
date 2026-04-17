import { pool } from '../db/pool';

interface CreateCouponParams {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  minimumAmount?: number;
  applicablePlans?: string[];
  applicableCourses?: string[];
  startsAt?: Date;
  expiresAt?: Date;
}

/**
 * Coupon and Promo Code Service
 */
class CouponService {
  /**
   * Create coupon
   */
  async createCoupon(params: CreateCouponParams): Promise<any> {
    const result = await pool.query(
      `INSERT INTO coupons (
        code, name, description, discount_type, discount_value, max_uses,
        max_uses_per_user, minimum_amount, applicable_plans, applicable_courses,
        starts_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        params.code.toUpperCase(),
        params.name,
        params.description,
        params.discountType,
        params.discountValue,
        params.maxUses,
        params.maxUsesPerUser || 1,
        params.minimumAmount,
        JSON.stringify(params.applicablePlans || []),
        JSON.stringify(params.applicableCourses || []),
        params.startsAt,
        params.expiresAt,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM coupons WHERE code = $1',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Coupon not found');
    }

    return result.rows[0];
  }

  /**
   * Validate coupon
   */
  async validateCoupon(
    code: string,
    userId: string,
    amount: number
  ): Promise<{ valid: boolean; discount: number; error?: string }> {
    try {
      const coupon = await this.getCouponByCode(code);

      // Check if valid
      const validResult = await pool.query(
        'SELECT is_coupon_valid($1, $2, $3) as valid',
        [coupon.id, userId, amount]
      );

      if (!validResult.rows[0].valid) {
        return {
          valid: false,
          discount: 0,
          error: 'Coupon is not valid or has been fully redeemed',
        };
      }

      // Calculate discount
      const discountResult = await pool.query(
        'SELECT calculate_discount($1, $2) as discount',
        [coupon.id, amount]
      );

      const discount = parseFloat(discountResult.rows[0].discount);

      return {
        valid: true,
        discount,
      };
    } catch (error) {
      return {
        valid: false,
        discount: 0,
        error: error instanceof Error ? error.message : 'Invalid coupon',
      };
    }
  }

  /**
   * Apply coupon (redeem)
   */
  async applyCoupon(
    code: string,
    userId: string,
    transactionId: string,
    discountAmount: number
  ): Promise<void> {
    const coupon = await this.getCouponByCode(code);

    // Record redemption
    await pool.query(
      'INSERT INTO coupon_redemptions (coupon_id, user_id, transaction_id, discount_amount) VALUES ($1, $2, $3, $4)',
      [coupon.id, userId, transactionId, discountAmount]
    );

    // Update usage count
    await pool.query(
      'UPDATE coupons SET times_used = times_used + 1 WHERE id = $1',
      [coupon.id]
    );
  }

  /**
   * List all coupons
   */
  async listCoupons(activeOnly = false): Promise<any[]> {
    let query = 'SELECT * FROM coupons';

    if (activeOnly) {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Update coupon
   */
  async updateCoupon(couponId: string, params: Partial<CreateCouponParams>): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      throw new Error('No updates provided');
    }

    values.push(couponId);

    const result = await pool.query(
      `UPDATE coupons SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Deactivate coupon
   */
  async deactivateCoupon(couponId: string): Promise<any> {
    const result = await pool.query(
      'UPDATE coupons SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [couponId]
    );

    return result.rows[0];
  }

  /**
   * Get coupon usage stats
   */
  async getCouponStats(couponId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         c.*,
         COUNT(cr.id) as redemption_count,
         SUM(cr.discount_amount) as total_discount_given,
         COUNT(DISTINCT cr.user_id) as unique_users
       FROM coupons c
       LEFT JOIN coupon_redemptions cr ON c.id = cr.coupon_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [couponId]
    );

    return result.rows[0];
  }
}

export const couponService = new CouponService();
