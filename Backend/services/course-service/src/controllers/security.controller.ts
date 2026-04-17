import { Request, Response } from 'express';
import { securityService } from '../services/security.service';

export class SecurityController {
  // ========================================
  // PASSWORD MANAGEMENT
  // ========================================

  async getPasswordPolicy(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;
      const policy = await securityService.getPasswordPolicy(organizationId);

      res.json({ success: true, data: policy });
    } catch (error: any) {
      console.error('[getPasswordPolicy] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get password policy' });
    }
  }

  async validatePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { password, organizationId } = req.body;

      if (!password) {
        res.status(400).json({ success: false, message: 'Password is required' });
        return;
      }

      const result = await securityService.validatePassword(password, userId, organizationId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('[validatePassword] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to validate password' });
    }
  }

  async getPasswordHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const history = await securityService.getPasswordHistory(userId, limit);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error('[getPasswordHistory] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get password history' });
    }
  }

  async createPasswordResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const ipAddress = req.ip || '0.0.0.0';
      const userAgent = req.headers['user-agent'];

      if (!userId) {
        res.status(400).json({ success: false, message: 'User ID is required' });
        return;
      }

      const token = await securityService.createPasswordResetToken(userId, ipAddress, userAgent);
      res.json({ success: true, data: { token } });
    } catch (error: any) {
      console.error('[createPasswordResetToken] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create reset token' });
    }
  }

  async verifyPasswordResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ success: false, message: 'Token is required' });
        return;
      }

      const tokenData = await securityService.verifyPasswordResetToken(token);

      if (!tokenData) {
        res.status(400).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      res.json({ success: true, data: tokenData });
    } catch (error: any) {
      console.error('[verifyPasswordResetToken] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to verify token' });
    }
  }

  // ========================================
  // MULTI-FACTOR AUTHENTICATION
  // ========================================

  async setupMFA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { method } = req.body;

      if (!method) {
        res.status(400).json({ success: false, message: 'MFA method is required' });
        return;
      }

      const mfaSettings = await securityService.setupMFA(userId, method);
      res.json({ success: true, data: mfaSettings });
    } catch (error: any) {
      console.error('[setupMFA] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to setup MFA' });
    }
  }

  async enableMFA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const settings = await securityService.enableMFA(userId);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error('[enableMFA] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to enable MFA' });
    }
  }

  async disableMFA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await securityService.disableMFA(userId);
      res.json({ success: true, message: 'MFA disabled successfully' });
    } catch (error: any) {
      console.error('[disableMFA] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to disable MFA' });
    }
  }

  async getMFASettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const settings = await securityService.getMFASettings(userId);
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error('[getMFASettings] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get MFA settings' });
    }
  }

  async verifyMFA(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { method, code } = req.body;

      if (!method || !code) {
        res.status(400).json({ success: false, message: 'Method and code are required' });
        return;
      }

      const isValid = await securityService.verifyMFA(userId, method, code);
      res.json({ success: true, data: { isValid } });
    } catch (error: any) {
      console.error('[verifyMFA] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to verify MFA' });
    }
  }

  async generateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const count = req.body.count || 10;
      const codes = await securityService.generateBackupCodes(userId, count);

      res.json({ success: true, data: { codes } });
    } catch (error: any) {
      console.error('[generateBackupCodes] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate backup codes' });
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async getMySessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const activeOnly = req.query.activeOnly !== 'false';
      const sessions = await securityService.getUserSessions(userId, activeOnly);

      res.json({ success: true, data: sessions });
    } catch (error: any) {
      console.error('[getMySessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get sessions' });
    }
  }

  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;
      const { reason } = req.body;

      await securityService.revokeSession(sessionId, userId, reason);
      res.json({ success: true, message: 'Session revoked successfully' });
    } catch (error: any) {
      console.error('[revokeSession] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke session' });
    }
  }

  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const currentSessionId = req.query.exceptCurrent === 'true' ? (req as any).sessionId : undefined;
      const count = await securityService.revokeAllUserSessions(userId, currentSessionId);

      res.json({ success: true, data: { revokedCount: count } });
    } catch (error: any) {
      console.error('[revokeAllSessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke sessions' });
    }
  }

  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await securityService.getActiveSessions();
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      console.error('[getActiveSessions] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get active sessions' });
    }
  }

  // ========================================
  // IP RULES
  // ========================================

  async createIPRule(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.userId;
      if (!adminId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const rule = await securityService.createIPRule({
        ...req.body,
        createdBy: adminId
      });

      res.status(201).json({ success: true, data: rule });
    } catch (error: any) {
      console.error('[createIPRule] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create IP rule' });
    }
  }

  async checkIPRule(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress } = req.params;
      const userId = req.query.userId as string;
      const organizationId = req.query.organizationId as string;

      const action = await securityService.checkIPRule(ipAddress, userId, organizationId);
      res.json({ success: true, data: { action } });
    } catch (error: any) {
      console.error('[checkIPRule] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to check IP rule' });
    }
  }

  async listIPRules(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        userId: req.query.userId as string,
        action: req.query.action as string,
        isActive: req.query.isActive === 'true'
      };

      const rules = await securityService.listIPRules(filters);
      res.json({ success: true, data: rules });
    } catch (error: any) {
      console.error('[listIPRules] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to list IP rules' });
    }
  }

  async deleteIPRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      await securityService.deleteIPRule(ruleId);

      res.json({ success: true, message: 'IP rule deleted successfully' });
    } catch (error: any) {
      console.error('[deleteIPRule] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to delete IP rule' });
    }
  }

  // ========================================
  // TRUSTED DEVICES
  // ========================================

  async getTrustedDevices(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const devices = await securityService.getTrustedDevices(userId);
      res.json({ success: true, data: devices });
    } catch (error: any) {
      console.error('[getTrustedDevices] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get trusted devices' });
    }
  }

  async revokeTrustedDevice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { deviceId } = req.params;
      await securityService.revokeTrustedDevice(userId, deviceId);

      res.json({ success: true, message: 'Device trust revoked successfully' });
    } catch (error: any) {
      console.error('[revokeTrustedDevice] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to revoke device' });
    }
  }

  // ========================================
  // SECURITY ALERTS
  // ========================================

  async getMySecurityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const unreadOnly = req.query.unreadOnly === 'true';
      const alerts = await securityService.getUserSecurityAlerts(userId, unreadOnly);

      res.json({ success: true, data: alerts });
    } catch (error: any) {
      console.error('[getMySecurityAlerts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get security alerts' });
    }
  }

  async markAlertAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      await securityService.markAlertAsRead(alertId);

      res.json({ success: true, message: 'Alert marked as read' });
    } catch (error: any) {
      console.error('[markAlertAsRead] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to mark alert as read' });
    }
  }

  async dismissAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      await securityService.dismissAlert(alertId);

      res.json({ success: true, message: 'Alert dismissed' });
    } catch (error: any) {
      console.error('[dismissAlert] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to dismiss alert' });
    }
  }

  async getSecurityAlertsSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await securityService.getSecurityAlertsSummary();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      console.error('[getSecurityAlertsSummary] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get alerts summary' });
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getMFAAdoptionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await securityService.getMFAAdoptionStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('[getMFAAdoptionStats] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get MFA stats' });
    }
  }

  async getPasswordPolicyCompliance(req: Request, res: Response): Promise<void> {
    try {
      const compliance = await securityService.getPasswordPolicyCompliance();
      res.json({ success: true, data: compliance });
    } catch (error: any) {
      console.error('[getPasswordPolicyCompliance] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get compliance data' });
    }
  }
}

export const securityController = new SecurityController();
