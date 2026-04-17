import { Request, Response } from 'express';
import { financialService } from '../services/financial.service';

export class FinancialController {
  // ========================================
  // INVOICES
  // ========================================

  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const invoice = await financialService.getInvoice(id);

      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      // Check ownership
      if (invoice.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: invoice });
    } catch (error: any) {
      console.error('[getInvoice] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get invoice' });
    }
  }

  async listMyInvoices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await financialService.listUserInvoices(userId, limit, offset);
      res.json({ success: true, data: result.invoices, total: result.total });
    } catch (error: any) {
      console.error('[listMyInvoices] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list invoices' });
    }
  }

  // ========================================
  // RECEIPTS
  // ========================================

  async getReceipt(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const receipt = await financialService.getReceipt(id);

      if (!receipt) {
        res.status(404).json({ success: false, message: 'Receipt not found' });
        return;
      }

      // Check ownership
      if (receipt.user_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: receipt });
    } catch (error: any) {
      console.error('[getReceipt] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get receipt' });
    }
  }

  async listMyReceipts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await financialService.listUserReceipts(userId, limit, offset);
      res.json({ success: true, data: result.receipts, total: result.total });
    } catch (error: any) {
      console.error('[listMyReceipts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list receipts' });
    }
  }

  // ========================================
  // INSTRUCTOR PAYOUTS
  // ========================================

  async getInstructorPayout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const payout = await financialService.getInstructorPayout(id);

      if (!payout) {
        res.status(404).json({ success: false, message: 'Payout not found' });
        return;
      }

      // Check ownership
      if (payout.instructor_id !== userId) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({ success: true, data: payout });
    } catch (error: any) {
      console.error('[getInstructorPayout] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get payout' });
    }
  }

  async listMyPayouts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await financialService.listInstructorPayouts(userId, limit, offset);
      res.json({ success: true, data: result.payouts, total: result.total });
    } catch (error: any) {
      console.error('[listMyPayouts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list payouts' });
    }
  }

  // ========================================
  // FINANCIAL REPORTS
  // ========================================

  async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ success: false, message: 'Start date and end date are required' });
        return;
      }

      const report = await financialService.generateRevenueReport(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      console.error('[getRevenueReport] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate revenue report' });
    }
  }

  async getCourseRevenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await financialService.getCourseRevenueSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getCourseRevenueSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course revenue summary' });
    }
  }

  async getInstructorEarnings(req: Request, res: Response): Promise<void> {
    try {
      const earnings = await financialService.getInstructorEarnings();
      res.json({ success: true, data: earnings });
    } catch (error: any) {
      console.error('[getInstructorEarnings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get instructor earnings' });
    }
  }

  async getOutstandingInvoices(req: Request, res: Response): Promise<void> {
    try {
      const invoices = await financialService.getOutstandingInvoices();
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      console.error('[getOutstandingInvoices] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get outstanding invoices' });
    }
  }
}

export const financialController = new FinancialController();
