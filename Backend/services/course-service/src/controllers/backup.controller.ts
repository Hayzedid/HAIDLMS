import { Request, Response } from 'express';
import { backupService } from '../services/backup.service';

export class BackupController {
  // BACKUP CONFIGURATIONS
  async createBackupConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId || 'system';
      const config = await backupService.createBackupConfiguration({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: config });
    } catch (error: any) {
      console.error('[createBackupConfiguration] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listBackupConfigurations(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const configs = await backupService.listBackupConfigurations(activeOnly);
      res.json({ success: true, data: configs });
    } catch (error: any) {
      console.error('[listBackupConfigurations] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBackupConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const config = await backupService.getBackupConfiguration(configId);
      if (!config) {
        res.status(404).json({ success: false, message: 'Configuration not found' });
        return;
      }
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[getBackupConfiguration] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateBackupConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const config = await backupService.updateBackupConfiguration(configId, req.body);
      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[updateBackupConfiguration] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteBackupConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      await backupService.deleteBackupConfiguration(configId);
      res.json({ success: true, message: 'Configuration deleted successfully' });
    } catch (error: any) {
      console.error('[deleteBackupConfiguration] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async calculateNextBackupRun(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const nextRun = await backupService.calculateNextBackupRun(configId);
      res.json({ success: true, data: { nextRun } });
    } catch (error: any) {
      console.error('[calculateNextBackupRun] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // BACKUP JOBS
  async createBackupJob(req: Request, res: Response): Promise<void> {
    try {
      const job = await backupService.createBackupJob(req.body);
      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createBackupJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listBackupJobs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        configId: req.query.configId as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const jobs = await backupService.listBackupJobs(filters);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listBackupJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBackupJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await backupService.getBackupJob(jobId);
      if (!job) {
        res.status(404).json({ success: false, message: 'Backup job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getBackupJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateBackupJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await backupService.updateBackupJob(jobId, req.body);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateBackupJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async retryBackupJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await backupService.retryBackupJob(jobId);
      if (!job) {
        res.status(400).json({ success: false, message: 'Cannot retry: max retries reached' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[retryBackupJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBackupSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await backupService.getBackupSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getBackupSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecentBackups(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const backups = await backupService.getRecentBackups(limit);
      res.json({ success: true, data: backups });
    } catch (error: any) {
      console.error('[getRecentBackups] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBackupHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await backupService.getBackupHealthStatus();
      res.json({ success: true, data: health });
    } catch (error: any) {
      console.error('[getBackupHealthStatus] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // RESTORE JOBS
  async createRestoreJob(req: Request, res: Response): Promise<void> {
    try {
      const initiatedBy = (req as any).user?.userId;
      const job = await backupService.createRestoreJob({ ...req.body, initiatedBy });
      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createRestoreJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listRestoreJobs(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        backupJobId: req.query.backupJobId as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const jobs = await backupService.listRestoreJobs(filters);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listRestoreJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRestoreJob(req: Request, res: Response): Promise<void> {
    try {
      const { restoreId } = req.params;
      const job = await backupService.getRestoreJob(restoreId);
      if (!job) {
        res.status(404).json({ success: false, message: 'Restore job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getRestoreJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateRestoreJob(req: Request, res: Response): Promise<void> {
    try {
      const { restoreId } = req.params;
      const job = await backupService.updateRestoreJob(restoreId, req.body);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateRestoreJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveRestoreJob(req: Request, res: Response): Promise<void> {
    try {
      const { restoreId } = req.params;
      const approvedBy = (req as any).user?.userId;
      const job = await backupService.approveRestoreJob(restoreId, approvedBy);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[approveRestoreJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // RECOVERY POINTS
  async createRecoveryPoint(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      const point = await backupService.createRecoveryPoint({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: point });
    } catch (error: any) {
      console.error('[createRecoveryPoint] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listRecoveryPoints(req: Request, res: Response): Promise<void> {
    try {
      const backupJobId = req.query.backupJobId as string;
      const points = await backupService.listRecoveryPoints(backupJobId);
      res.json({ success: true, data: points });
    } catch (error: any) {
      console.error('[listRecoveryPoints] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRecoveryPoint(req: Request, res: Response): Promise<void> {
    try {
      const { pointId } = req.params;
      const point = await backupService.getRecoveryPoint(pointId);
      if (!point) {
        res.status(404).json({ success: false, message: 'Recovery point not found' });
        return;
      }
      res.json({ success: true, data: point });
    } catch (error: any) {
      console.error('[getRecoveryPoint] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async testRecoveryPoint(req: Request, res: Response): Promise<void> {
    try {
      const { pointId } = req.params;
      const { testNotes } = req.body;
      const point = await backupService.testRecoveryPoint(pointId, testNotes);
      res.json({ success: true, data: point });
    } catch (error: any) {
      console.error('[testRecoveryPoint] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async invalidateRecoveryPoint(req: Request, res: Response): Promise<void> {
    try {
      const { pointId } = req.params;
      const { reason } = req.body;
      const point = await backupService.invalidateRecoveryPoint(pointId, reason);
      res.json({ success: true, data: point });
    } catch (error: any) {
      console.error('[invalidateRecoveryPoint] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DISASTER RECOVERY PLANS
  async createDRPlan(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      const plan = await backupService.createDRPlan({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[createDRPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listDRPlans(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const plans = await backupService.listDRPlans(activeOnly);
      res.json({ success: true, data: plans });
    } catch (error: any) {
      console.error('[listDRPlans] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDRPlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const plan = await backupService.getDRPlan(planId);
      if (!plan) {
        res.status(404).json({ success: false, message: 'DR plan not found' });
        return;
      }
      res.json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[getDRPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateDRPlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const plan = await backupService.updateDRPlan(planId, req.body);
      res.json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[updateDRPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveDRPlan(req: Request, res: Response): Promise<void> {
    try {
      const { planId } = req.params;
      const approvedBy = (req as any).user?.userId;
      const plan = await backupService.approveDRPlan(planId, approvedBy);
      res.json({ success: true, data: plan });
    } catch (error: any) {
      console.error('[approveDRPlan] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DR EXECUTIONS
  async createDRExecution(req: Request, res: Response): Promise<void> {
    try {
      const execution = await backupService.createDRExecution(req.body);
      res.status(201).json({ success: true, data: execution });
    } catch (error: any) {
      console.error('[createDRExecution] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateDRExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;
      const execution = await backupService.updateDRExecution(executionId, req.body);
      res.json({ success: true, data: execution });
    } catch (error: any) {
      console.error('[updateDRExecution] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listDRExecutions(req: Request, res: Response): Promise<void> {
    try {
      const planId = req.query.planId as string;
      const executions = await backupService.listDRExecutions(planId);
      res.json({ success: true, data: executions });
    } catch (error: any) {
      console.error('[listDRExecutions] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // EXPORT JOBS
  async createExportJob(req: Request, res: Response): Promise<void> {
    try {
      const requestedBy = (req as any).user?.userId;
      const job = await backupService.createExportJob({ ...req.body, requestedBy });
      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listExportJobs(req: Request, res: Response): Promise<void> {
    try {
      const requestedBy = req.query.requestedBy as string;
      const jobs = await backupService.listExportJobs(requestedBy);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listExportJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getExportJob(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const job = await backupService.getExportJob(exportId);
      if (!job) {
        res.status(404).json({ success: false, message: 'Export job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateExportJob(req: Request, res: Response): Promise<void> {
    try {
      const { exportId } = req.params;
      const job = await backupService.updateExportJob(exportId, req.body);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateExportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // IMPORT JOBS
  async createImportJob(req: Request, res: Response): Promise<void> {
    try {
      const requestedBy = (req as any).user?.userId;
      const job = await backupService.createImportJob({ ...req.body, requestedBy });
      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createImportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listImportJobs(req: Request, res: Response): Promise<void> {
    try {
      const requestedBy = req.query.requestedBy as string;
      const jobs = await backupService.listImportJobs(requestedBy);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listImportJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getImportJob(req: Request, res: Response): Promise<void> {
    try {
      const { importId } = req.params;
      const job = await backupService.getImportJob(importId);
      if (!job) {
        res.status(404).json({ success: false, message: 'Import job not found' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getImportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateImportJob(req: Request, res: Response): Promise<void> {
    try {
      const { importId } = req.params;
      const job = await backupService.updateImportJob(importId, req.body);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateImportJob] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // BACKUP VERIFICATION
  async createVerification(req: Request, res: Response): Promise<void> {
    try {
      const verifiedBy = (req as any).user?.userId;
      const verification = await backupService.createVerification({ ...req.body, verifiedBy });
      res.status(201).json({ success: true, data: verification });
    } catch (error: any) {
      console.error('[createVerification] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listVerifications(req: Request, res: Response): Promise<void> {
    try {
      const backupJobId = req.query.backupJobId as string;
      const verifications = await backupService.listVerifications(backupJobId);
      res.json({ success: true, data: verifications });
    } catch (error: any) {
      console.error('[listVerifications] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // STORAGE LOCATIONS
  async createStorageLocation(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      const location = await backupService.createStorageLocation({ ...req.body, createdBy });
      res.status(201).json({ success: true, data: location });
    } catch (error: any) {
      console.error('[createStorageLocation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listStorageLocations(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const locations = await backupService.listStorageLocations(activeOnly);
      res.json({ success: true, data: locations });
    } catch (error: any) {
      console.error('[listStorageLocations] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStorageLocation(req: Request, res: Response): Promise<void> {
    try {
      const { locationId } = req.params;
      const location = await backupService.getStorageLocation(locationId);
      if (!location) {
        res.status(404).json({ success: false, message: 'Storage location not found' });
        return;
      }
      res.json({ success: true, data: location });
    } catch (error: any) {
      console.error('[getStorageLocation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStorageLocation(req: Request, res: Response): Promise<void> {
    try {
      const { locationId } = req.params;
      const location = await backupService.updateStorageLocation(locationId, req.body);
      res.json({ success: true, data: location });
    } catch (error: any) {
      console.error('[updateStorageLocation] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // UTILITY METHODS
  async cleanupOldBackups(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const deletedCount = await backupService.cleanupOldBackups(configId);
      res.json({ success: true, data: { deletedCount } });
    } catch (error: any) {
      console.error('[cleanupOldBackups] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async isBackupRestorable(req: Request, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      const restorable = await backupService.isBackupRestorable(backupId);
      res.json({ success: true, data: { restorable } });
    } catch (error: any) {
      console.error('[isBackupRestorable] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBackupAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        entityId: req.query.entityId as string,
        eventType: req.query.eventType as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      const logs = await backupService.getBackupAuditLog(filters);
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[getBackupAuditLog] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const backupController = new BackupController();
