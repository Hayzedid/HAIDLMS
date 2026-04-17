import { Request, Response } from 'express';
import { adminDashboardService } from '../services/admin-dashboard.service';

export class AdminDashboardController {
  // DASHBOARD SUMMARY
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await adminDashboardService.getDashboardSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getDashboardSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SYSTEM METRICS
  async recordSystemMetric(req: Request, res: Response): Promise<void> {
    try {
      const metric = await adminDashboardService.recordSystemMetric(req.body);
      res.status(201).json({ success: true, data: metric });
    } catch (error: any) {
      console.error('[recordSystemMetric] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        metricName: req.query.metricName as string,
        serviceName: req.query.serviceName as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const metrics = await adminDashboardService.getSystemMetrics(filters);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getSystemMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRealtimeSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await adminDashboardService.getRealtimeSystemMetrics();
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getRealtimeSystemMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SYSTEM HEALTH
  async recordHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const check = await adminDashboardService.recordHealthCheck(req.body);
      res.status(201).json({ success: true, data: check });
    } catch (error: any) {
      console.error('[recordHealthCheck] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSystemHealthOverview(req: Request, res: Response): Promise<void> {
    try {
      const health = await adminDashboardService.getSystemHealthOverview();
      res.json({ success: true, data: health });
    } catch (error: any) {
      console.error('[getSystemHealthOverview] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSystemHealthScore(req: Request, res: Response): Promise<void> {
    try {
      const score = await adminDashboardService.getSystemHealthScore();
      res.json({ success: true, data: { score } });
    } catch (error: any) {
      console.error('[getSystemHealthScore] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHealthCheckHistory(req: Request, res: Response): Promise<void> {
    try {
      const { componentName } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : undefined;
      const history = await adminDashboardService.getHealthCheckHistory(componentName, hours);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getHealthCheckHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // RESOURCE USAGE
  async recordResourceUsage(req: Request, res: Response): Promise<void> {
    try {
      const usage = await adminDashboardService.recordResourceUsage(req.body);
      res.status(201).json({ success: true, data: usage });
    } catch (error: any) {
      console.error('[recordResourceUsage] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getResourceUsage(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        resourceType: req.query.resourceType as string,
        alertsOnly: req.query.alertsOnly === 'true'
      };
      const usage = await adminDashboardService.getResourceUsage(filters);
      res.json({ success: true, data: usage });
    } catch (error: any) {
      console.error('[getResourceUsage] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ERROR LOGS
  async logError(req: Request, res: Response): Promise<void> {
    try {
      const log = await adminDashboardService.logError(req.body);
      res.status(201).json({ success: true, data: log });
    } catch (error: any) {
      console.error('[logError] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getErrorLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        serviceName: req.query.serviceName as string,
        severity: req.query.severity as string,
        resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const logs = await adminDashboardService.getErrorLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[getErrorLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTopErrors(req: Request, res: Response): Promise<void> {
    try {
      const errors = await adminDashboardService.getTopErrors();
      res.json({ success: true, data: errors });
    } catch (error: any) {
      console.error('[getTopErrors] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resolveError(req: Request, res: Response): Promise<void> {
    try {
      const { errorId } = req.params;
      const resolvedBy = (req as any).user?.userId;
      const error = await adminDashboardService.resolveError(errorId, resolvedBy);
      res.json({ success: true, data: error });
    } catch (error: any) {
      console.error('[resolveError] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PERFORMANCE METRICS
  async recordPerformanceMetric(req: Request, res: Response): Promise<void> {
    try {
      const metric = await adminDashboardService.recordPerformanceMetric(req.body);
      res.status(201).json({ success: true, data: metric });
    } catch (error: any) {
      console.error('[recordPerformanceMetric] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        endpoint: req.query.endpoint as string,
        serviceName: req.query.serviceName as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const metrics = await adminDashboardService.getPerformanceMetrics(filters);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getPerformanceMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSlowestEndpoints(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const endpoints = await adminDashboardService.getSlowestEndpoints(limit);
      res.json({ success: true, data: endpoints });
    } catch (error: any) {
      console.error('[getSlowestEndpoints] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ADMIN ACTIONS
  async logAdminAction(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      const adminEmail = (req as any).user?.email;
      const action = await adminDashboardService.logAdminAction({ ...req.body, adminId, adminEmail });
      res.status(201).json({ success: true, data: action });
    } catch (error: any) {
      console.error('[logAdminAction] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAdminActions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        adminId: req.query.adminId as string,
        actionType: req.query.actionType as string,
        targetType: req.query.targetType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const actions = await adminDashboardService.getAdminActions(filters);
      res.json({ success: true, data: actions });
    } catch (error: any) {
      console.error('[getAdminActions] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SYSTEM ANNOUNCEMENTS
  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      const announcement = await adminDashboardService.createAnnouncement({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: announcement });
    } catch (error: any) {
      console.error('[createAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        activeOnly: req.query.activeOnly === 'true',
        priority: req.query.priority as string
      };
      const announcements = await adminDashboardService.listAnnouncements(filters);
      res.json({ success: true, data: announcements });
    } catch (error: any) {
      console.error('[listAnnouncements] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const announcement = await adminDashboardService.getAnnouncement(announcementId);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }
      res.json({ success: true, data: announcement });
    } catch (error: any) {
      console.error('[getAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const announcement = await adminDashboardService.updateAnnouncement(announcementId, req.body);
      res.json({ success: true, data: announcement });
    } catch (error: any) {
      console.error('[updateAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      await adminDashboardService.deleteAnnouncement(announcementId);
      res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error: any) {
      console.error('[deleteAnnouncement] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordAnnouncementInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { announcementId } = req.params;
      const { interaction } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await adminDashboardService.recordAnnouncementInteraction(announcementId, userId, interaction);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[recordAnnouncementInteraction] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // TENANT MANAGEMENT
  async createTenant(req: Request, res: Response): Promise<void> {
    try {
      const tenant = await adminDashboardService.createTenant(req.body);
      res.status(201).json({ success: true, data: tenant });
    } catch (error: any) {
      console.error('[createTenant] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listTenants(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        activeOnly: req.query.activeOnly === 'true',
        planType: req.query.planType as string
      };
      const tenants = await adminDashboardService.listTenants(filters);
      res.json({ success: true, data: tenants });
    } catch (error: any) {
      console.error('[listTenants] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTenant(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const tenant = await adminDashboardService.getTenant(tenantId);
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Tenant not found' });
        return;
      }
      res.json({ success: true, data: tenant });
    } catch (error: any) {
      console.error('[getTenant] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const tenant = await adminDashboardService.updateTenant(tenantId, req.body);
      res.json({ success: true, data: tenant });
    } catch (error: any) {
      console.error('[updateTenant] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTenantUsagePercentage(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const usage = await adminDashboardService.getTenantUsagePercentage(tenantId);
      res.json({ success: true, data: usage });
    } catch (error: any) {
      console.error('[getTenantUsagePercentage] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordTenantUsage(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { date, metrics } = req.body;
      const usage = await adminDashboardService.recordTenantUsage(tenantId, date, metrics);
      res.status(201).json({ success: true, data: usage });
    } catch (error: any) {
      console.error('[recordTenantUsage] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const adminDashboardController = new AdminDashboardController();
