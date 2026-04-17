import { Request, Response } from 'express';
import { systemConfigService } from '../services/system-config.service';

export class SystemConfigController {
  // ========================================
  // SYSTEM SETTINGS
  // ========================================

  async createSetting(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const setting = await systemConfigService.createSetting({
        ...req.body,
        createdBy
      });

      res.status(201).json({ success: true, data: setting });
    } catch (error: any) {
      console.error('[createSetting] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create setting' });
    }
  }

  async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const scope = req.query.scope as string;
      const scopeId = req.query.scopeId as string;

      const setting = await systemConfigService.getSetting(key, scope, scopeId);

      if (!setting) {
        res.status(404).json({ success: false, message: 'Setting not found' });
        return;
      }

      res.json({ success: true, data: setting });
    } catch (error: any) {
      console.error('[getSetting] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get setting' });
    }
  }

  async getSettingValue(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const scope = req.query.scope as string;
      const scopeId = req.query.scopeId as string;

      const value = await systemConfigService.getSettingValue(key, scope, scopeId);

      res.json({ success: true, data: { value } });
    } catch (error: any) {
      console.error('[getSettingValue] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get setting value' });
    }
  }

  async listSettings(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        scope: req.query.scope as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const settings = await systemConfigService.listSettings(filters);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error('[listSettings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list settings' });
    }
  }

  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const updatedBy = (req as any).user?.userId;
      if (!updatedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { settingId } = req.params;
      const { value } = req.body;

      if (!value) {
        res.status(400).json({ success: false, message: 'Value is required' });
        return;
      }

      const setting = await systemConfigService.updateSetting(settingId, value, updatedBy);
      res.json({ success: true, data: setting });
    } catch (error: any) {
      console.error('[updateSetting] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update setting' });
    }
  }

  async deleteSetting(req: Request, res: Response): Promise<void> {
    try {
      const { settingId } = req.params;
      await systemConfigService.deleteSetting(settingId);

      res.json({ success: true, message: 'Setting deleted successfully' });
    } catch (error: any) {
      console.error('[deleteSetting] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete setting' });
    }
  }

  async getSettingsOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await systemConfigService.getSettingsOverview();
      res.json({ success: true, data: overview });
    } catch (error: any) {
      console.error('[getSettingsOverview] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get overview' });
    }
  }

  // ========================================
  // FEATURE FLAGS
  // ========================================

  async createFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const flag = await systemConfigService.createFeatureFlag({
        ...req.body,
        createdBy
      });

      res.status(201).json({ success: true, data: flag });
    } catch (error: any) {
      console.error('[createFeatureFlag] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create feature flag' });
    }
  }

  async getFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const flag = await systemConfigService.getFeatureFlag(flagId);

      if (!flag) {
        res.status(404).json({ success: false, message: 'Feature flag not found' });
        return;
      }

      res.json({ success: true, data: flag });
    } catch (error: any) {
      console.error('[getFeatureFlag] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get feature flag' });
    }
  }

  async listFeatureFlags(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100
      };

      const flags = await systemConfigService.listFeatureFlags(filters);
      res.json({ success: true, data: flags });
    } catch (error: any) {
      console.error('[listFeatureFlags] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list feature flags' });
    }
  }

  async updateFeatureFlag(req: Request, res: Response): Promise<void> {
    try {
      const updatedBy = (req as any).user?.userId;
      if (!updatedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { flagId } = req.params;
      const flag = await systemConfigService.updateFeatureFlag(flagId, req.body, updatedBy);

      res.json({ success: true, data: flag });
    } catch (error: any) {
      console.error('[updateFeatureFlag] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update feature flag' });
    }
  }

  async checkFeature(req: Request, res: Response): Promise<void> {
    try {
      const { featureKey } = req.params;
      const userId = (req as any).user?.userId;
      const organizationId = req.query.organizationId as string;

      const isEnabled = await systemConfigService.isFeatureEnabled(
        featureKey,
        userId,
        organizationId
      );

      res.json({ success: true, data: { isEnabled } });
    } catch (error: any) {
      console.error('[checkFeature] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check feature' });
    }
  }

  async createFeatureFlagOverride(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { flagId, overrideType, targetId, isEnabled, reason } = req.body;

      if (!flagId || !overrideType || !targetId || isEnabled === undefined) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      const override = await systemConfigService.createFeatureFlagOverride(
        flagId,
        overrideType,
        targetId,
        isEnabled,
        createdBy,
        reason
      );

      res.status(201).json({ success: true, data: override });
    } catch (error: any) {
      console.error('[createFeatureFlagOverride] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create override' });
    }
  }

  async getActiveFeatureFlags(req: Request, res: Response): Promise<void> {
    try {
      const flags = await systemConfigService.getActiveFeatureFlags();
      res.json({ success: true, data: flags });
    } catch (error: any) {
      console.error('[getActiveFeatureFlags] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active flags' });
    }
  }

  // ========================================
  // TEMPLATES
  // ========================================

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const template = await systemConfigService.createTemplate({
        ...req.body,
        createdBy
      });

      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('[createTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create template' });
    }
  }

  async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const template = await systemConfigService.getTemplate(templateId);

      if (!template) {
        res.status(404).json({ success: false, message: 'Template not found' });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[getTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get template' });
    }
  }

  async getDefaultTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateType } = req.params;
      const locale = (req.query.locale as string) || 'en';

      const template = await systemConfigService.getDefaultTemplate(templateType, locale);

      if (!template) {
        res.status(404).json({ success: false, message: 'Default template not found' });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[getDefaultTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get default template' });
    }
  }

  async listTemplates(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        templateType: req.query.templateType as string,
        locale: req.query.locale as string,
        scope: req.query.scope as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

      const templates = await systemConfigService.listTemplates(filters);
      res.json({ success: true, data: templates });
    } catch (error: any) {
      console.error('[listTemplates] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list templates' });
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const updatedBy = (req as any).user?.userId;
      if (!updatedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { templateId } = req.params;
      const template = await systemConfigService.updateTemplate(templateId, req.body, updatedBy);

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[updateTemplate] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update template' });
    }
  }

  async getTemplateStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await systemConfigService.getTemplateStatistics();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getTemplateStatistics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get statistics' });
    }
  }

  // ========================================
  // MAINTENANCE WINDOWS
  // ========================================

  async createMaintenanceWindow(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const window = await systemConfigService.createMaintenanceWindow({
        ...req.body,
        createdBy
      });

      res.status(201).json({ success: true, data: window });
    } catch (error: any) {
      console.error('[createMaintenanceWindow] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create maintenance window' });
    }
  }

  async getMaintenanceWindow(req: Request, res: Response): Promise<void> {
    try {
      const { windowId } = req.params;
      const window = await systemConfigService.getMaintenanceWindow(windowId);

      if (!window) {
        res.status(404).json({ success: false, message: 'Maintenance window not found' });
        return;
      }

      res.json({ success: true, data: window });
    } catch (error: any) {
      console.error('[getMaintenanceWindow] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get maintenance window' });
    }
  }

  async listMaintenanceWindows(req: Request, res: Response): Promise<void> {
    try {
      const includeCompleted = req.query.includeCompleted === 'true';
      const windows = await systemConfigService.listMaintenanceWindows(includeCompleted);

      res.json({ success: true, data: windows });
    } catch (error: any) {
      console.error('[listMaintenanceWindows] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list maintenance windows' });
    }
  }

  async activateMaintenanceWindow(req: Request, res: Response): Promise<void> {
    try {
      const { windowId } = req.params;
      const window = await systemConfigService.activateMaintenanceWindow(windowId);

      res.json({ success: true, data: window });
    } catch (error: any) {
      console.error('[activateMaintenanceWindow] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to activate maintenance window' });
    }
  }

  async completeMaintenanceWindow(req: Request, res: Response): Promise<void> {
    try {
      const { windowId } = req.params;
      const window = await systemConfigService.completeMaintenanceWindow(windowId);

      res.json({ success: true, data: window });
    } catch (error: any) {
      console.error('[completeMaintenanceWindow] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to complete maintenance window' });
    }
  }

  async checkMaintenanceMode(req: Request, res: Response): Promise<void> {
    try {
      const isMaintenanceMode = await systemConfigService.isMaintenanceMode();
      res.json({ success: true, data: { isMaintenanceMode } });
    } catch (error: any) {
      console.error('[checkMaintenanceMode] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check maintenance mode' });
    }
  }

  // ========================================
  // RATE LIMITING
  // ========================================

  async createRateLimitConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await systemConfigService.createRateLimitConfig(req.body);
      res.status(201).json({ success: true, data: config });
    } catch (error: any) {
      console.error('[createRateLimitConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create rate limit config' });
    }
  }

  async getRateLimitConfig(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const config = await systemConfigService.getRateLimitConfig(configId);

      if (!config) {
        res.status(404).json({ success: false, message: 'Rate limit config not found' });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[getRateLimitConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get rate limit config' });
    }
  }

  async listRateLimitConfigs(req: Request, res: Response): Promise<void> {
    try {
      const configs = await systemConfigService.listRateLimitConfigs();
      res.json({ success: true, data: configs });
    } catch (error: any) {
      console.error('[listRateLimitConfigs] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list rate limit configs' });
    }
  }

  async updateRateLimitConfig(req: Request, res: Response): Promise<void> {
    try {
      const { configId } = req.params;
      const config = await systemConfigService.updateRateLimitConfig(configId, req.body);

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[updateRateLimitConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update rate limit config' });
    }
  }

  // ========================================
  // BRANDING
  // ========================================

  async createBrandingConfig(req: Request, res: Response): Promise<void> {
    try {
      const createdBy = (req as any).user?.userId;
      if (!createdBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const config = await systemConfigService.createBrandingConfig({
        ...req.body,
        createdBy
      });

      res.status(201).json({ success: true, data: config });
    } catch (error: any) {
      console.error('[createBrandingConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create branding config' });
    }
  }

  async getBrandingConfig(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const config = await systemConfigService.getBrandingConfig(organizationId);

      if (!config) {
        res.status(404).json({ success: false, message: 'Branding config not found' });
        return;
      }

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[getBrandingConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get branding config' });
    }
  }

  async updateBrandingConfig(req: Request, res: Response): Promise<void> {
    try {
      const updatedBy = (req as any).user?.userId;
      if (!updatedBy) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { configId } = req.params;
      const config = await systemConfigService.updateBrandingConfig(configId, req.body, updatedBy);

      res.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[updateBrandingConfig] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to update branding config' });
    }
  }

  // ========================================
  // CONFIGURATION HISTORY
  // ========================================

  async getConfigHistory(req: Request, res: Response): Promise<void> {
    try {
      const { configType, configId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const history = await systemConfigService.getConfigHistory(configType, configId, limit);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getConfigHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get config history' });
    }
  }
}

export const systemConfigController = new SystemConfigController();
