import pool from '../db/pool';
import { paymentsService } from './payments.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateCoursePricingParams {
  courseId: string;
  pricingModel: string;
  basePrice: number;
  currency?: string;
  subscriptionPrice?: number;
  subscriptionInterval?: string;
  trialPeriodDays?: number;
  isFree?: boolean;
  isFreemium?: boolean;
  lifetimeAccess?: boolean;
  accessDurationDays?: number;
  createdBy: string;
}

interface CreateDiscountCodeParams {
  code: string;
  discountType: string;
  discountValue: number;
  appliesTo?: string;
  courseIds?: string[];
  maxUses?: number;
  maxUsesPerUser?: number;
  validFrom?: string;
  validUntil?: string;
  minimumPurchaseAmount?: number;
  description?: string;
  createdBy: string;
}

interface EnrollWithPaymentParams {
  userId: string;
  courseId: string;
  discountCode?: string;
  paymentMethodId?: string;
}

interface CreateBulkOrderParams {
  organizationId?: string;
  purchasedBy: string;
  courseId: string;
  quantity: number;
  discountCode?: string;
  paymentMethodId?: string;
}

// ============================================================================
// PRICING SERVICE
// ============================================================================

export class PricingService {
  // ========================================
  // COURSE PRICING
  // ========================================

  async createCoursePricing(params: CreateCoursePricingParams): Promise<any> {
    const {
      courseId,
      pricingModel,
      basePrice,
      currency = 'USD',
      subscriptionPrice,
      subscriptionInterval,
      trialPeriodDays = 0,
      isFree = false,
      isFreemium = false,
      lifetimeAccess = true,
      accessDurationDays,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO course_pricing (
        course_id, pricing_model, base_price, currency,
        subscription_price, subscription_interval, trial_period_days,
        is_free, is_freemium, lifetime_access, access_duration_days, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        courseId, pricingModel, basePrice, currency,
        subscriptionPrice, subscriptionInterval, trialPeriodDays,
        isFree, isFreemium, lifetimeAccess, accessDurationDays, createdBy
      ]
    );

    return result.rows[0];
  }

  async getCoursePricing(courseId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM active_course_pricing WHERE course_id = $1`,
      [courseId]
    );
    return result.rows[0];
  }

  async updateCoursePricing(courseId: string, updates: any): Promise<any> {
    const allowedFields = [
      'base_price', 'sale_price', 'is_on_sale', 'sale_start_date', 'sale_end_date',
      'subscription_price', 'subscription_interval', 'trial_period_days',
      'is_free', 'is_freemium', 'lifetime_access', 'access_duration_days', 'is_active'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(courseId);
    const result = await pool.query(
      `UPDATE course_pricing
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE course_id = $${paramIndex}
      RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // PRICING TIERS
  // ========================================

  async createPricingTier(coursePricingId: string, tierData: any): Promise<any> {
    const {
      tierName,
      tierLevel,
      price,
      currency = 'USD',
      subscriptionPrice,
      subscriptionInterval,
      features,
      modulesIncluded,
      projectsIncluded,
      supportLevel,
      isMostPopular = false
    } = tierData;

    const result = await pool.query(
      `INSERT INTO pricing_tiers (
        course_pricing_id, tier_name, tier_level, price, currency,
        subscription_price, subscription_interval, features,
        modules_included, projects_included, support_level, is_most_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        coursePricingId, tierName, tierLevel, price, currency,
        subscriptionPrice, subscriptionInterval, JSON.stringify(features),
        modulesIncluded, projectsIncluded, supportLevel, isMostPopular
      ]
    );

    return result.rows[0];
  }

  async listPricingTiers(coursePricingId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM pricing_tiers WHERE course_pricing_id = $1 AND is_active = true ORDER BY tier_level`,
      [coursePricingId]
    );
    return result.rows;
  }

  // ========================================
  // DISCOUNT CODES
  // ========================================

  async createDiscountCode(params: CreateDiscountCodeParams): Promise<any> {
    const {
      code,
      discountType,
      discountValue,
      appliesTo = 'all',
      courseIds,
      maxUses,
      maxUsesPerUser = 1,
      validFrom,
      validUntil,
      minimumPurchaseAmount = 0,
      description,
      createdBy
    } = params;

    const result = await pool.query(
      `INSERT INTO discount_codes (
        code, discount_type, discount_value, applies_to, course_ids,
        max_uses, max_uses_per_user, valid_from, valid_until,
        minimum_purchase_amount, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        code.toUpperCase(), discountType, discountValue, appliesTo, courseIds || [],
        maxUses, maxUsesPerUser, validFrom, validUntil,
        minimumPurchaseAmount, description, createdBy
      ]
    );

    return result.rows[0];
  }

  async validateDiscountCode(code: string, userId: string, courseId: string, purchaseAmount: number): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM validate_discount_code($1, $2, $3, $4)`,
      [code.toUpperCase(), userId, courseId, purchaseAmount]
    );
    return result.rows[0];
  }

  async applyDiscountCode(discountCodeId: string, userId: string, courseId: string, originalPrice: number): Promise<any> {
    // Get discount code
    const discountResult = await pool.query(
      `SELECT * FROM discount_codes WHERE id = $1`,
      [discountCodeId]
    );

    const discount = discountResult.rows[0];
    if (!discount) {
      throw new Error('Discount code not found');
    }

    // Calculate final price
    const finalPriceResult = await pool.query(
      `SELECT calculate_final_price($1, $2, $3) as final_price`,
      [originalPrice, discount.discount_type, discount.discount_value]
    );

    const finalPrice = finalPriceResult.rows[0].final_price;
    const discountAmount = originalPrice - finalPrice;

    return {
      discountCodeId,
      originalPrice,
      discountAmount,
      finalPrice,
      discountType: discount.discount_type,
      discountValue: discount.discount_value
    };
  }

  async listActiveDiscountCodes(filters: any = {}): Promise<any[]> {
    const { appliesTo, courseId, limit = 50, offset = 0 } = filters;

    let query = `SELECT * FROM active_discount_codes WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (appliesTo) {
      query += ` AND applies_to = $${paramIndex}`;
      params.push(appliesTo);
      paramIndex++;
    }

    if (courseId) {
      query += ` AND (applies_to = 'all' OR $${paramIndex} = ANY(course_ids))`;
      params.push(courseId);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // ENROLLMENT WITH PAYMENT
  // ========================================

  async enrollWithPayment(params: EnrollWithPaymentParams): Promise<any> {
    const { userId, courseId, discountCode, paymentMethodId } = params;

    // Get course pricing
    const pricing = await this.getCoursePricing(courseId);
    if (!pricing) {
      throw new Error('Course pricing not configured');
    }

    // Handle free courses
    if (pricing.is_free || pricing.current_price === 0) {
      return await this.createFreeEnrollment(userId, courseId);
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      throw new Error('User is already enrolled in this course');
    }

    let finalPrice = pricing.current_price;
    let discountAmount = 0;
    let discountCodeId = null;

    // Apply discount code if provided
    if (discountCode) {
      const validation = await this.validateDiscountCode(discountCode, userId, courseId, finalPrice);

      if (!validation.is_valid) {
        throw new Error(validation.error_message || 'Invalid discount code');
      }

      const discountResult = await this.applyDiscountCode(validation.discount_code_id, userId, courseId, finalPrice);
      finalPrice = discountResult.finalPrice;
      discountAmount = discountResult.discountAmount;
      discountCodeId = validation.discount_code_id;
    }

    // Create enrollment
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, enrollment_date)
      VALUES ($1, $2, NOW())
      RETURNING *`,
      [userId, courseId]
    );

    const enrollment = enrollmentResult.rows[0];

    // Create payment intent
    const paymentIntent = await paymentsService.createPaymentIntent({
      userId,
      amount: finalPrice,
      currency: pricing.currency,
      courseId,
      enrollmentId: enrollment.id,
      paymentMethodId,
      description: `Enrollment in ${pricing.course_title}`,
      metadata: {
        enrollment_id: enrollment.id,
        discount_code_id: discountCodeId
      }
    });

    // Create enrollment payment record
    const enrollmentPayment = await pool.query(
      `INSERT INTO enrollment_payments (
        enrollment_id, transaction_id, pricing_model, base_price,
        discount_amount, final_price, currency, discount_code_id,
        payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        enrollment.id, paymentIntent.id, pricing.pricing_model,
        pricing.current_price, discountAmount, finalPrice,
        pricing.currency, discountCodeId, 'pending'
      ]
    );

    // Record discount code usage if applied
    if (discountCodeId) {
      await pool.query(
        `INSERT INTO discount_code_uses (
          discount_code_id, user_id, course_id, enrollment_id,
          original_price, discount_amount, final_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [discountCodeId, userId, courseId, enrollment.id, pricing.current_price, discountAmount, finalPrice]
      );
    }

    return {
      enrollment,
      enrollmentPayment: enrollmentPayment.rows[0],
      paymentIntent,
      pricing: {
        basePrice: pricing.current_price,
        discountAmount,
        finalPrice,
        currency: pricing.currency
      }
    };
  }

  async createFreeEnrollment(userId: string, courseId: string): Promise<any> {
    // Check if already enrolled
    const existingEnrollment = await pool.query(
      `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (existingEnrollment.rows.length > 0) {
      throw new Error('User is already enrolled in this course');
    }

    // Create enrollment
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, enrollment_date)
      VALUES ($1, $2, NOW())
      RETURNING *`,
      [userId, courseId]
    );

    const enrollment = enrollmentResult.rows[0];

    // Create enrollment payment record (free)
    const enrollmentPayment = await pool.query(
      `INSERT INTO enrollment_payments (
        enrollment_id, pricing_model, base_price, discount_amount,
        final_price, currency, payment_status, access_granted, access_granted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [enrollment.id, 'free', 0, 0, 0, 'USD', 'completed', true]
    );

    return {
      enrollment,
      enrollmentPayment: enrollmentPayment.rows[0],
      pricing: {
        basePrice: 0,
        discountAmount: 0,
        finalPrice: 0,
        currency: 'USD'
      }
    };
  }

  async grantEnrollmentAccess(enrollmentId: string): Promise<void> {
    const enrollment = await pool.query(
      `SELECT * FROM enrollments WHERE id = $1`,
      [enrollmentId]
    );

    if (!enrollment.rows[0]) {
      throw new Error('Enrollment not found');
    }

    // Get pricing to determine access duration
    const pricing = await this.getCoursePricing(enrollment.rows[0].course_id);

    let accessExpiresAt = null;
    if (!pricing.lifetime_access && pricing.access_duration_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pricing.access_duration_days);
      accessExpiresAt = expiryDate.toISOString();
    }

    await pool.query(
      `UPDATE enrollment_payments
      SET payment_status = 'completed',
          access_granted = true,
          access_granted_at = NOW(),
          access_expires_at = $1,
          updated_at = NOW()
      WHERE enrollment_id = $2`,
      [accessExpiresAt, enrollmentId]
    );
  }

  // ========================================
  // BULK ENROLLMENTS
  // ========================================

  async createBulkOrder(params: CreateBulkOrderParams): Promise<any> {
    const { organizationId, purchasedBy, courseId, quantity, discountCode, paymentMethodId } = params;

    if (quantity < 2) {
      throw new Error('Bulk orders require at least 2 seats');
    }

    // Get course pricing
    const pricing = await this.getCoursePricing(courseId);
    if (!pricing) {
      throw new Error('Course pricing not configured');
    }

    // Check for applicable bulk pricing
    const bulkPricingResult = await pool.query(
      `SELECT * FROM bulk_pricing
      WHERE course_id = $1
        AND (organization_id IS NULL OR organization_id = $2)
        AND is_active = true
        AND $3 >= min_quantity
        AND (max_quantity IS NULL OR $3 <= max_quantity)
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
      ORDER BY discount_value DESC
      LIMIT 1`,
      [courseId, organizationId, quantity]
    );

    let pricePerSeat = pricing.current_price;
    let discountAmount = 0;
    let bulkPricingId = null;
    let discountCodeId = null;

    if (bulkPricingResult.rows.length > 0) {
      const bulkPricing = bulkPricingResult.rows[0];
      bulkPricingId = bulkPricing.id;

      if (bulkPricing.price_per_seat) {
        pricePerSeat = bulkPricing.price_per_seat;
      } else {
        const discountResult = await pool.query(
          `SELECT calculate_final_price($1, $2, $3) as final_price`,
          [pricePerSeat, bulkPricing.discount_type, bulkPricing.discount_value]
        );
        pricePerSeat = discountResult.rows[0].final_price;
      }
    }

    // Apply discount code if provided
    if (discountCode) {
      const totalAmount = pricePerSeat * quantity;
      const validation = await this.validateDiscountCode(discountCode, purchasedBy, courseId, totalAmount);

      if (validation.is_valid) {
        const discountResult = await this.applyDiscountCode(validation.discount_code_id, purchasedBy, courseId, totalAmount);
        const newTotal = discountResult.finalPrice;
        pricePerSeat = newTotal / quantity;
        discountAmount = discountResult.discountAmount;
        discountCodeId = validation.discount_code_id;
      }
    }

    const totalAmount = pricePerSeat * quantity;
    const finalAmount = totalAmount - discountAmount;

    // Generate order number
    const orderNumberResult = await pool.query(`SELECT generate_bulk_order_number() as order_number`);
    const orderNumber = orderNumberResult.rows[0].order_number;

    // Create bulk order
    const bulkOrderResult = await pool.query(
      `INSERT INTO bulk_enrollment_orders (
        order_number, organization_id, purchased_by, course_id, quantity,
        price_per_seat, total_amount, discount_amount, final_amount,
        currency, discount_code_id, bulk_pricing_id, seats_remaining
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        orderNumber, organizationId, purchasedBy, courseId, quantity,
        pricePerSeat, totalAmount, discountAmount, finalAmount,
        pricing.currency, discountCodeId, bulkPricingId, quantity
      ]
    );

    const bulkOrder = bulkOrderResult.rows[0];

    // Create payment intent
    const paymentIntent = await paymentsService.createPaymentIntent({
      userId: purchasedBy,
      amount: finalAmount,
      currency: pricing.currency,
      courseId,
      paymentMethodId,
      description: `Bulk enrollment: ${quantity} seats for ${pricing.course_title}`,
      metadata: {
        bulk_order_id: bulkOrder.id,
        quantity,
        discount_code_id: discountCodeId
      }
    });

    // Update bulk order with transaction ID
    await pool.query(
      `UPDATE bulk_enrollment_orders SET transaction_id = $1 WHERE id = $2`,
      [paymentIntent.id, bulkOrder.id]
    );

    return {
      bulkOrder: { ...bulkOrder, transaction_id: paymentIntent.id },
      paymentIntent,
      pricing: {
        pricePerSeat,
        quantity,
        totalAmount,
        discountAmount,
        finalAmount,
        currency: pricing.currency
      }
    };
  }

  async assignBulkSeat(bulkOrderId: string, email: string, assignedBy: string): Promise<any> {
    // Check if bulk order has available seats
    const bulkOrder = await pool.query(
      `SELECT * FROM bulk_enrollment_orders WHERE id = $1 AND payment_status = 'completed'`,
      [bulkOrderId]
    );

    if (bulkOrder.rows.length === 0) {
      throw new Error('Bulk order not found or payment not completed');
    }

    if (bulkOrder.rows[0].seats_remaining <= 0) {
      throw new Error('No seats remaining in this bulk order');
    }

    // Check if email already assigned
    const existing = await pool.query(
      `SELECT id FROM bulk_enrollment_seats WHERE bulk_order_id = $1 AND assigned_to_email = $2 AND status != 'revoked'`,
      [bulkOrderId, email]
    );

    if (existing.rows.length > 0) {
      throw new Error('This email has already been assigned a seat');
    }

    // Create seat assignment
    const result = await pool.query(
      `INSERT INTO bulk_enrollment_seats (bulk_order_id, assigned_to_email, status, invitation_sent_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *`,
      [bulkOrderId, email, 'invited']
    );

    // TODO: Send invitation email

    return result.rows[0];
  }

  async acceptBulkSeat(seatId: string, userId: string): Promise<any> {
    const seat = await pool.query(
      `SELECT * FROM bulk_enrollment_seats WHERE id = $1 AND status = 'invited'`,
      [seatId]
    );

    if (seat.rows.length === 0) {
      throw new Error('Seat invitation not found or already accepted');
    }

    const bulkOrder = await pool.query(
      `SELECT * FROM bulk_enrollment_orders WHERE id = $1`,
      [seat.rows[0].bulk_order_id]
    );

    // Create enrollment
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, enrollment_date)
      VALUES ($1, $2, NOW())
      RETURNING *`,
      [userId, bulkOrder.rows[0].course_id]
    );

    // Update seat assignment
    await pool.query(
      `UPDATE bulk_enrollment_seats
      SET assigned_to_user_id = $1, enrollment_id = $2, status = 'accepted', accepted_at = NOW()
      WHERE id = $3`,
      [userId, enrollmentResult.rows[0].id, seatId]
    );

    // Grant access
    await pool.query(
      `INSERT INTO enrollment_payments (
        enrollment_id, pricing_model, base_price, discount_amount,
        final_price, currency, payment_status, access_granted, access_granted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [enrollmentResult.rows[0].id, 'bulk', 0, 0, 0, 'USD', 'completed', true]
    );

    return enrollmentResult.rows[0];
  }

  // ========================================
  // GIFT ENROLLMENTS
  // ========================================

  async createGiftEnrollment(params: any): Promise<any> {
    const { purchasedBy, courseId, recipientEmail, recipientName, personalMessage, paymentMethodId } = params;

    const pricing = await this.getCoursePricing(courseId);
    if (!pricing || pricing.is_free) {
      throw new Error('Cannot gift free courses');
    }

    // Generate gift code
    const giftCode = this.generateGiftCode();

    // Create gift enrollment record
    const giftResult = await pool.query(
      `INSERT INTO gift_enrollments (
        gift_code, course_id, purchased_by, recipient_email, recipient_name,
        personal_message, gift_amount, currency, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [giftCode, courseId, purchasedBy, recipientEmail, recipientName, personalMessage, pricing.current_price, pricing.currency, 'pending']
    );

    const gift = giftResult.rows[0];

    // Create payment intent
    const paymentIntent = await paymentsService.createPaymentIntent({
      userId: purchasedBy,
      amount: pricing.current_price,
      currency: pricing.currency,
      courseId,
      paymentMethodId,
      description: `Gift enrollment: ${pricing.course_title} for ${recipientEmail}`,
      metadata: {
        gift_id: gift.id,
        recipient_email: recipientEmail
      }
    });

    await pool.query(
      `UPDATE gift_enrollments SET transaction_id = $1 WHERE id = $2`,
      [paymentIntent.id, gift.id]
    );

    return {
      gift: { ...gift, transaction_id: paymentIntent.id },
      paymentIntent
    };
  }

  async redeemGift(giftCode: string, userId: string): Promise<any> {
    const gift = await pool.query(
      `SELECT * FROM gift_enrollments WHERE gift_code = $1 AND status = 'sent'`,
      [giftCode]
    );

    if (gift.rows.length === 0) {
      throw new Error('Invalid or already redeemed gift code');
    }

    const giftData = gift.rows[0];

    // Create enrollment
    const enrollmentResult = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, enrollment_date)
      VALUES ($1, $2, NOW())
      RETURNING *`,
      [userId, giftData.course_id]
    );

    // Update gift status
    await pool.query(
      `UPDATE gift_enrollments
      SET recipient_user_id = $1, enrollment_id = $2, status = 'redeemed', redeemed_at = NOW()
      WHERE id = $3`,
      [userId, enrollmentResult.rows[0].id, giftData.id]
    );

    // Grant access
    await this.grantEnrollmentAccess(enrollmentResult.rows[0].id);

    return enrollmentResult.rows[0];
  }

  // ========================================
  // HELPERS
  // ========================================

  private generateGiftCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GIFT-';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const pricingService = new PricingService();
