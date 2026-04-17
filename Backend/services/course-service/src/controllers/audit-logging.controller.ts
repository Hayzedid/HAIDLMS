import { Request, Response } from 'express';
import { auditLoggingService } from '../services/audit-logging.service';

export class AuditLoggingController {
  // ========================================
  // AUDIT LOGS
  // ========================================

  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        actorId: req.query.actorId as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        eventType: req.query.eventType as string,
        severity: req.query.severity as string,
        category: req.query.category as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isSensitive: req.query.isSensitive === 'true',
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      };

      const result = await auditLoggingService.getAuditLogs(filters);
      res.json({ success: true, data: result.logs, total: result.total });
    } catch (error: any) {
      console.error('[getAuditLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get audit logs' });
    }
  }

  async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { logId } = req.params;
      const log = await auditLoggingService.getAuditLog(logId);

      if (!log) {
        res.status(404).json({ success: false, message: 'Audit log not found' });
        return;
      }

      res.json({ success: true, data: log });
    } catch (error: any) {
      console.error('[getAuditLog] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get audit log' });
    }
  }

  async getEntityAuditSummary(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const summary = await auditLoggingService.getEntityAuditSummary(entityType, entityId);

      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getEntityAuditSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get audit summary' });
    }
  }

  async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const trail = await auditLoggingService.getAuditTrail(entityType, entityId);

      if (!trail) {
        res.status(404).json({ success: false, message: 'Audit trail not found' });
        return;
      }

      res.json({ success: true, data: trail });
    } catch (error: any) {
      console.error('[getAuditTrail] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get audit trail' });
    }
  }

  // ========================================
  // SECURITY EVENTS
  // ========================================

  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        userId: req.query.userId as string,
        eventType: req.query.eventType as string,
        threatLevel: req.query.threatLevel as string,
        isBlocked: req.query.isBlocked === 'true',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const events = await auditLoggingService.getSecurityEvents(filters);
      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('[getSecurityEvents] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get security events' });
    }
  }

  async respondToSecurityEvent(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { eventId } = req.params;
      const { actionTaken, resolutionNotes } = req.body;

      if (!actionTaken || !resolutionNotes) {
        res.status(400).json({ success: false, message: 'Action taken and resolution notes are required' });
        return;
      }

      const event = await auditLoggingService.respondToSecurityEvent(
        eventId,
        adminId,
        actionTaken,
        resolutionNotes
      );

      res.json({ success: true, data: event });
    } catch (error: any) {
      console.error('[respondToSecurityEvent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to respond to event' });
    }
  }

  async getRecentSecurityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await auditLoggingService.getRecentSecurityAlerts();
      res.json({ success: true, data: alerts });
    } catch (error: any) {
      console.error('[getRecentSecurityAlerts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get security alerts' });
    }
  }

  // ========================================
  // DATA ACCESS LOGS
  // ========================================

  async getDataAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        userId: req.query.userId as string,
        resourceType: req.query.resourceType as string,
        resourceId: req.query.resourceId as string,
        action: req.query.action as string,
        containsPii: req.query.containsPii === 'true',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const logs = await auditLoggingService.getDataAccessLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[getDataAccessLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get data access logs' });
    }
  }

  async getSensitiveDataAccessSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await auditLoggingService.getSensitiveDataAccessSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getSensitiveDataAccessSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get summary' });
    }
  }

  // ========================================
  // COMPLIANCE LOGS
  // ========================================

  async getComplianceLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        regulation: req.query.regulation as string,
        userId: req.query.userId as string,
        isCompliant: req.query.isCompliant === 'true',
        reviewed: req.query.reviewed === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const logs = await auditLoggingService.getComplianceLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[getComplianceLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get compliance logs' });
    }
  }

  async reviewComplianceLog(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { logId } = req.params;
      const { reviewNotes } = req.body;

      if (!reviewNotes) {
        res.status(400).json({ success: false, message: 'Review notes are required' });
        return;
      }

      const log = await auditLoggingService.reviewComplianceLog(logId, adminId, reviewNotes);
      res.json({ success: true, data: log });
    } catch (error: any) {
      console.error('[reviewComplianceLog] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to review compliance log' });
    }
  }

  async getComplianceViolations(req: Request, res: Response): Promise<void> {
    try {
      const violations = await auditLoggingService.getComplianceViolations();
      res.json({ success: true, data: violations });
    } catch (error: any) {
      console.error('[getComplianceViolations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get violations' });
    }
  }

  // ========================================
  // SYSTEM EVENTS
  // ========================================

  async getSystemEvents(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        eventType: req.query.eventType as string,
        severity: req.query.severity as string,
        component: req.query.component as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const events = await auditLoggingService.getSystemEvents(filters);
      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('[getSystemEvents] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get system events' });
    }
  }

  async getCriticalSystemEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await auditLoggingService.getCriticalSystemEvents();
      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('[getCriticalSystemEvents] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get critical events' });
    }
  }

  // ========================================
  // STATISTICS & REPORTS
  // ========================================

  async getUserActivitySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const summary = await auditLoggingService.getUserActivitySummary(userId);

      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getUserActivitySummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get activity summary' });
    }
  }

  async getAuditStatistics(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const statistics = await auditLoggingService.getAuditStatistics(days);

      res.json({ success: true, data: statistics });
    } catch (error: any) {
      console.error('[getAuditStatistics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get statistics' });
    }
  }

  // ========================================
  // MAINTENANCE
  // ========================================

  async cleanupAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const count = await auditLoggingService.cleanupAuditLogs();
      res.json({ success: true, data: { deletedCount: count } });
    } catch (error: any) {
      console.error('[cleanupAuditLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to cleanup audit logs' });
    }
  }

  async exportAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        actorId: req.query.actorId as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      const logs = await auditLoggingService.exportAuditLogs(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[exportAuditLogs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to export audit logs' });
    }
  }
}

export const auditLoggingController = new AuditLoggingController();
