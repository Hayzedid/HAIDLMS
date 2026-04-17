import { Request, Response } from 'express';
import { pricingService } from '../services/pricing.service';

export class PricingController {
  // ========================================
  // COURSE PRICING
  // ========================================

  async createCoursePricing(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.courseId || !params.pricingModel) {
        res.status(400).json({ success: false, message: 'Course ID and pricing model are required' });
        return;
      }

      const pricing = await pricingService.createCoursePricing(params);
      res.status(201).json({ success: true, data: pricing });
    } catch (error: any) {
      console.error('[createCoursePricing] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create course pricing' });
    }
  }

  async getCoursePricing(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const pricing = await pricingService.getCoursePricing(courseId);

      if (!pricing) {
        res.status(404).json({ success: false, message: 'Course pricing not found' });
        return;
      }

      res.json({ success: true, data: pricing });
    } catch (error: any) {
      console.error('[getCoursePricing] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course pricing' });
    }
  }

  async updateCoursePricing(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const updates = req.body;

      const pricing = await pricingService.updateCoursePricing(courseId, updates);
      res.json({ success: true, data: pricing });
    } catch (error: any) {
      console.error('[updateCoursePricing] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update course pricing' });
    }
  }

  // ========================================
  // PRICING TIERS
  // ========================================

  async createPricingTier(req: Request, res: Response): Promise<void> {
    try {
      const { pricingId } = req.params;
      const tierData = req.body;

      const tier = await pricingService.createPricingTier(pricingId, tierData);
      res.status(201).json({ success: true, data: tier });
    } catch (error: any) {
      console.error('[createPricingTier] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create pricing tier' });
    }
  }

  async listPricingTiers(req: Request, res: Response): Promise<void> {
    try {
      const { pricingId } = req.params;
      const tiers = await pricingService.listPricingTiers(pricingId);
      res.json({ success: true, data: tiers });
    } catch (error: any) {
      console.error('[listPricingTiers] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list pricing tiers' });
    }
  }

  // ========================================
  // DISCOUNT CODES
  // ========================================

  async createDiscountCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, createdBy: userId };

      if (!params.code || !params.discountType || !params.discountValue) {
        res.status(400).json({ success: false, message: 'Code, discount type, and discount value are required' });
        return;
      }

      const discountCode = await pricingService.createDiscountCode(params);
      res.status(201).json({ success: true, data: discountCode });
    } catch (error: any) {
      console.error('[createDiscountCode] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create discount code' });
    }
  }

  async validateDiscountCode(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { code } = req.params;
      const { courseId, purchaseAmount } = req.query;

      if (!code || !courseId || !purchaseAmount) {
        res.status(400).json({ success: false, message: 'Code, course ID, and purchase amount are required' });
        return;
      }

      const validation = await pricingService.validateDiscountCode(
        code,
        userId,
        courseId as string,
        parseFloat(purchaseAmount as string)
      );

      res.json({ success: true, data: validation });
    } catch (error: any) {
      console.error('[validateDiscountCode] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to validate discount code' });
    }
  }

  async listDiscountCodes(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        appliesTo: req.query.appliesTo as string,
        courseId: req.query.courseId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const discountCodes = await pricingService.listActiveDiscountCodes(filters);
      res.json({ success: true, data: discountCodes });
    } catch (error: any) {
      console.error('[listDiscountCodes] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list discount codes' });
    }
  }

  // ========================================
  // ENROLLMENT WITH PAYMENT
  // ========================================

  async enrollWithPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { courseId, discountCode, paymentMethodId } = req.body;

      if (!courseId) {
        res.status(400).json({ success: false, message: 'Course ID is required' });
        return;
      }

      const result = await pricingService.enrollWithPayment({
        userId,
        courseId,
        discountCode,
        paymentMethodId
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('[enrollWithPayment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to enroll with payment' });
    }
  }

  async grantEnrollmentAccess(req: Request, res: Response): Promise<void> {
    try {
      const { enrollmentId } = req.params;

      await pricingService.grantEnrollmentAccess(enrollmentId);
      res.json({ success: true, message: 'Enrollment access granted' });
    } catch (error: any) {
      console.error('[grantEnrollmentAccess] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to grant enrollment access' });
    }
  }

  // ========================================
  // BULK ENROLLMENTS
  // ========================================

  async createBulkOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { organizationId, courseId, quantity, discountCode, paymentMethodId } = req.body;

      if (!courseId || !quantity) {
        res.status(400).json({ success: false, message: 'Course ID and quantity are required' });
        return;
      }

      const result = await pricingService.createBulkOrder({
        organizationId,
        purchasedBy: userId,
        courseId,
        quantity,
        discountCode,
        paymentMethodId
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('[createBulkOrder] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create bulk order' });
    }
  }

  async assignBulkSeat(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { bulkOrderId } = req.params;
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      const seat = await pricingService.assignBulkSeat(bulkOrderId, email, userId);
      res.status(201).json({ success: true, data: seat });
    } catch (error: any) {
      console.error('[assignBulkSeat] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to assign bulk seat' });
    }
  }

  async acceptBulkSeat(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { seatId } = req.params;

      const enrollment = await pricingService.acceptBulkSeat(seatId, userId);
      res.json({ success: true, data: enrollment });
    } catch (error: any) {
      console.error('[acceptBulkSeat] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to accept bulk seat' });
    }
  }

  // ========================================
  // GIFT ENROLLMENTS
  // ========================================

  async createGiftEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const params = { ...req.body, purchasedBy: userId };

      if (!params.courseId || !params.recipientEmail) {
        res.status(400).json({ success: false, message: 'Course ID and recipient email are required' });
        return;
      }

      const result = await pricingService.createGiftEnrollment(params);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error('[createGiftEnrollment] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create gift enrollment' });
    }
  }

  async redeemGift(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { giftCode } = req.params;

      const enrollment = await pricingService.redeemGift(giftCode, userId);
      res.json({ success: true, data: enrollment });
    } catch (error: any) {
      console.error('[redeemGift] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to redeem gift' });
    }
  }
}

export const pricingController = new PricingController();
