import { Request, Response } from 'express';
import { integrationsService } from '../services/integrations.service';

export class IntegrationsController {
  // ========================================
  // INTEGRATION PROVIDERS
  // ========================================

  async listProviders(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        integrationType: req.query.integrationType as string,
        isActive: req.query.isActive !== 'false',
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const providers = await integrationsService.listProviders(filters);
      res.json({ success: true, data: providers });
    } catch (error: any) {
      console.error('[listProviders] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list providers' });
    }
  }

  async getProvider(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const provider = await integrationsService.getProvider(providerId);

      if (!provider) {
        res.status(404).json({ success: false, message: 'Provider not found' });
        return;
      }

      res.json({ success: true, data: provider });
    } catch (error: any) {
      console.error('[getProvider] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get provider' });
    }
  }

  // ========================================
  // ORGANIZATION INTEGRATIONS
  // ========================================

  async createIntegration(req: Request, res: Response): Promise<void> {
    try {
      const connectedBy = (req as any).user?.userId;
      if (!connectedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const integration = await integrationsService.createIntegration({
        ...req.body,
        connectedBy
      });

      res.status(201).json({ success: true, data: integration });
    } catch (error: any) {
      console.error('[createIntegration] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create integration' });
    }
  }

  async getIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const integration = await integrationsService.getIntegration(integrationId);

      if (!integration) {
        res.status(404).json({ success: false, message: 'Integration not found' });
        return;
      }

      res.json({ success: true, data: integration });
    } catch (error: any) {
      console.error('[getIntegration] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get integration' });
    }
  }

  async listIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const filters = {
        status: req.query.status as string,
        integrationType: req.query.integrationType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const integrations = await integrationsService.listIntegrations(organizationId, filters);
      res.json({ success: true, data: integrations });
    } catch (error: any) {
      console.error('[listIntegrations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list integrations' });
    }
  }

  async updateIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const integration = await integrationsService.updateIntegration(integrationId, req.body);

      res.json({ success: true, data: integration });
    } catch (error: any) {
      console.error('[updateIntegration] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update integration' });
    }
  }

  async disconnectIntegration(req: Request, res: Response): Promise<void> {
    try {
      const disconnectedBy = (req as any).user?.userId;
      if (!disconnectedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { integrationId } = req.params;
      await integrationsService.disconnectIntegration(integrationId, disconnectedBy);

      res.json({ success: true, message: 'Integration disconnected successfully' });
    } catch (error: any) {
      console.error('[disconnectIntegration] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to disconnect integration' });
    }
  }

  async getActiveIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const integrations = await integrationsService.getActiveIntegrations();
      res.json({ success: true, data: integrations });
    } catch (error: any) {
      console.error('[getActiveIntegrations] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active integrations' });
    }
  }

  // ========================================
  // OAUTH CREDENTIALS
  // ========================================

  async saveOAuthCredentials(req: Request, res: Response): Promise<void> {
    try {
      const credentials = await integrationsService.saveOAuthCredentials(req.body);
      res.json({ success: true, data: credentials });
    } catch (error: any) {
      console.error('[saveOAuthCredentials] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to save OAuth credentials' });
    }
  }

  async getOAuthCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const credentials = await integrationsService.getOAuthCredentials(integrationId);

      if (!credentials) {
        res.status(404).json({ success: false, message: 'Credentials not found' });
        return;
      }

      res.json({ success: true, data: credentials });
    } catch (error: any) {
      console.error('[getOAuthCredentials] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get OAuth credentials' });
    }
  }

  async invalidateOAuthCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      await integrationsService.invalidateOAuthCredentials(integrationId);

      res.json({ success: true, message: 'Credentials invalidated successfully' });
    } catch (error: any) {
      console.error('[invalidateOAuthCredentials] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to invalidate credentials' });
    }
  }

  // ========================================
  // SSO CONFIGURATIONS
  // ========================================

  async createSSOConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await integrationsService.createSSOConfig(req.body);
      res.status(201).json({ success: true, data: config });
    } catch (error: any) {
      console.error('[createSSOConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create SSO config' });
    }
  }

  async getSSOConfig(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const config = await integrationsService.getSSOConfig(organizationId);

      if (!config) {
        res.status(404).json({ success: false, message: 'SSO config not found' });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[getSSOConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get SSO config' });
    }
  }

  async updateSSOConfig(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const config = await integrationsService.updateSSOConfig(configId, req.body);

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[updateSSOConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update SSO config' });
    }
  }

  // ========================================
  // SYNC JOBS
  // ========================================

  async createSyncJob(req: Request, res: Response): Promise<void> {
    try {
      const triggeredByUserId = (req as any).user?.userId;
      const job = await integrationsService.createSyncJob({
        ...req.body,
        triggeredByUserId
      });

      res.status(201).json({ success: true, data: job });
    } catch (error: any) {
      console.error('[createSyncJob] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create sync job' });
    }
  }

  async getSyncJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await integrationsService.getSyncJob(jobId);

      if (!job) {
        res.status(404).json({ success: false, message: 'Sync job not found' });
        return;
      }

      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[getSyncJob] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get sync job' });
    }
  }

  async listSyncJobs(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const jobs = await integrationsService.listSyncJobs(integrationId, limit);
      res.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error('[listSyncJobs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list sync jobs' });
    }
  }

  async updateSyncJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const { status, progressData } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'Status is required' });
        return;
      }

      const job = await integrationsService.updateSyncJobStatus(jobId, status, progressData);
      res.json({ success: true, data: job });
    } catch (error: any) {
      console.error('[updateSyncJobStatus] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update sync job status' });
    }
  }

  async getSyncStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const statistics = await integrationsService.getSyncStatistics(integrationId);

      res.json({ success: true, data: statistics });
    } catch (error: any) {
      console.error('[getSyncStatistics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get sync statistics' });
    }
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  async createWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhook = await integrationsService.createWebhook(req.body);
      res.status(201).json({ success: true, data: webhook });
    } catch (error: any) {
      console.error('[createWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create webhook' });
    }
  }

  async getWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookId } = req.params;
      const webhook = await integrationsService.getWebhook(webhookId);

      if (!webhook) {
        res.status(404).json({ success: false, message: 'Webhook not found' });
        return;
      }

      res.json({ success: true, data: webhook });
    } catch (error: any) {
      console.error('[getWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get webhook' });
    }
  }

  async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const webhooks = await integrationsService.listWebhooks(integrationId);

      res.json({ success: true, data: webhooks });
    } catch (error: any) {
      console.error('[listWebhooks] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list webhooks' });
    }
  }

  async updateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookId } = req.params;
      const webhook = await integrationsService.updateWebhook(webhookId, req.body);

      res.json({ success: true, data: webhook });
    } catch (error: any) {
      console.error('[updateWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update webhook' });
    }
  }

  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookId } = req.params;
      await integrationsService.deleteWebhook(webhookId);

      res.json({ success: true, message: 'Webhook deleted successfully' });
    } catch (error: any) {
      console.error('[deleteWebhook] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete webhook' });
    }
  }

  async getWebhookPerformance(req: Request, res: Response): Promise<void> {
    try {
      const performance = await integrationsService.getWebhookPerformance();
      res.json({ success: true, data: performance });
    } catch (error: any) {
      console.error('[getWebhookPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get webhook performance' });
    }
  }

  // ========================================
  // HEALTH CHECKS
  // ========================================

  async recordHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId, checkType, status, checkDetails } = req.body;

      if (!integrationId || !checkType || !status || !checkDetails) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const healthCheck = await integrationsService.recordHealthCheck(
        integrationId,
        checkType,
        status,
        checkDetails
      );

      res.status(201).json({ success: true, data: healthCheck });
    } catch (error: any) {
      console.error('[recordHealthCheck] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record health check' });
    }
  }

  async getHealthSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await integrationsService.getHealthSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getHealthSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get health summary' });
    }
  }

  async getIntegrationHealth(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const health = await integrationsService.getIntegrationHealth(integrationId);

      res.json({ success: true, data: health });
    } catch (error: any) {
      console.error('[getIntegrationHealth] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get integration health' });
    }
  }

  // ========================================
  // INTEGRATION EVENTS
  // ========================================

  async logEvent(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId, eventType, eventCategory, severity, message, eventData } = req.body;

      if (!integrationId || !eventType || !eventCategory || !severity || !message) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const event = await integrationsService.logEvent(
        integrationId,
        eventType,
        eventCategory,
        severity,
        message,
        eventData
      );

      res.status(201).json({ success: true, data: event });
    } catch (error: any) {
      console.error('[logEvent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to log event' });
    }
  }

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const filters = {
        category: req.query.category as string,
        severity: req.query.severity as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const events = await integrationsService.getEvents(integrationId, filters);
      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('[getEvents] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get events' });
    }
  }

  // ========================================
  // HELPER ENDPOINTS
  // ========================================

  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const isHealthy = await integrationsService.isIntegrationHealthy(integrationId);

      res.json({ success: true, data: { isHealthy } });
    } catch (error: any) {
      console.error('[checkHealth] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check health' });
    }
  }

  async recordError(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const { errorMessage, errorDetails } = req.body;

      if (!errorMessage) {
        res.status(400).json({ success: false, message: 'Error message is required' });
        return;
      }

      await integrationsService.recordError(integrationId, errorMessage, errorDetails);
      res.json({ success: true, message: 'Error recorded successfully' });
    } catch (error: any) {
      console.error('[recordError] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record error' });
    }
  }

  async resetErrors(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      await integrationsService.resetErrors(integrationId);

      res.json({ success: true, message: 'Errors reset successfully' });
    } catch (error: any) {
      console.error('[resetErrors] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to reset errors' });
    }
  }

  async scheduleNextSync(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId } = req.params;
      const nextSync = await integrationsService.scheduleNextSync(integrationId);

      res.json({ success: true, data: { nextSync } });
    } catch (error: any) {
      console.error('[scheduleNextSync] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to schedule next sync' });
    }
  }
}

export const integrationsController = new IntegrationsController();
