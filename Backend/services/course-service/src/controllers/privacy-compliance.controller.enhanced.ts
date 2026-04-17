import { Request, Response } from 'express';
import { PrivacyComplianceServiceEnhanced } from '../services/privacy-compliance.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('PrivacyComplianceController');

export class PrivacyComplianceControllerEnhanced {
  private privacyService: PrivacyComplianceServiceEnhanced;

  constructor(pool: Pool) {
    this.privacyService = new PrivacyComplianceServiceEnhanced(pool);
  }

  // ========================================
  // ERROR HANDLER
  // ========================================

  private handleControllerError = (res: Response, error: any, operation: string): void => {
    const appError = handleError(error);

    logger.error(`${operation} failed`, error, {
      statusCode: appError.statusCode,
      isOperational: appError.isOperational
    });

    res.status(appError.statusCode).json({
      error: appError.message,
      ...(appError instanceof AppError && 'errors' in appError ? { details: (appError as any).errors } : {})
    });
  };

  // ========================================
  // CONSENT MANAGEMENT - ENHANCED
  // ========================================

  grantConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/privacy/consents', req.body.user_id);

      const consentId = await this.privacyService.grantConsentWithValidation(req.body);

      res.status(201).json({
        id: consentId,
        message: 'Consent granted successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Grant consent');
    }
  };

  withdrawConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, consent_type } = req.body;

      if (!user_id || !consent_type) {
        res.status(400).json({ error: 'user_id and consent_type are required' });
        return;
      }

      logger.info('Withdrawing consent', { user_id, consent_type });

      const count = await this.privacyService.withdrawConsentWithValidation(user_id, consent_type);

      res.json({
        message: 'Consent withdrawn successfully',
        count
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Withdraw consent');
    }
  };

  getUserConsents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { status } = req.query;

      const consents = await this.privacyService.getUserConsentsWithDetails(
        user_id,
        status as string
      );

      res.json({
        user_id,
        consents,
        count: consents.length
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get user consents');
    }
  };

  checkConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, purpose } = req.query;

      if (!user_id || !purpose) {
        res.status(400).json({ error: 'user_id and purpose are required' });
        return;
      }

      const hasConsent = await this.privacyService.checkConsentRequired(
        user_id as string,
        purpose as string
      );

      res.json({
        user_id,
        purpose,
        has_consent: hasConsent,
        checked_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Check consent');
    }
  };

  // ========================================
  // PRIVACY REQUESTS - ENHANCED
  // ========================================

  createPrivacyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/privacy/requests', req.body.user_id);

      const requestId = await this.privacyService.createPrivacyRequestWithValidation(req.body);

      res.status(201).json({
        id: requestId,
        message: 'Privacy request created successfully',
        sla_days: 30 // GDPR default
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create privacy request');
    }
  };

  getPrivacyRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { request_id } = req.params;

      const request = await this.privacyService.getPrivacyRequestByIdWithValidation(request_id);

      res.json(request);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get privacy request');
    }
  };

  updatePrivacyRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { request_id } = req.params;
      const { status, assigned_to, rejection_reason, result_data } = req.body;

      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }

      await this.privacyService.updatePrivacyRequestStatus(request_id, status, {
        assigned_to,
        rejection_reason,
        result_data
      });

      res.json({
        message: 'Privacy request updated successfully',
        request_id,
        status
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update privacy request');
    }
  };

  getOverdueRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const overdueRequests = await this.privacyService.getOverduePrivacyRequestsWithAlert();

      res.json({
        overdue_requests: overdueRequests,
        count: overdueRequests.length,
        alert_level: overdueRequests.length > 0 ? 'high' : 'none'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get overdue requests');
    }
  };

  // ========================================
  // DATA RETENTION - ENHANCED
  // ========================================

  createRetentionPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/privacy/retention-policies');

      const policyId = await this.privacyService.createRetentionPolicyWithValidation(req.body);

      res.status(201).json({
        id: policyId,
        message: 'Data retention policy created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create retention policy');
    }
  };

  executeRetentionPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { policy_id } = req.params;
      const { executed_by } = req.body;

      logger.info('Executing retention policy', { policy_id, executed_by });

      const deletedCount = await this.privacyService.executeRetentionPolicyWithLogging(
        policy_id,
        executed_by
      );

      res.json({
        message: 'Retention policy executed successfully',
        policy_id,
        deleted_count: deletedCount,
        executed_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Execute retention policy');
    }
  };

  getRetentionSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.privacyService.getRetentionSummaryWithRecommendations();

      res.json(summary);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get retention summary');
    }
  };

  // ========================================
  // DATA DELETION - ENHANCED
  // ========================================

  logDataDeletion = async (req: Request, res: Response): Promise<void> => {
    try {
      const logId = await this.privacyService.logDataDeletionWithValidation(req.body);

      res.status(201).json({
        id: logId,
        message: 'Data deletion logged successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Log data deletion');
    }
  };

  // ========================================
  // DATA ANONYMIZATION - ENHANCED
  // ========================================

  anonymizeUserData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { initiated_by } = req.body;

      logger.warn('Anonymizing user data', { user_id, initiated_by });

      await this.privacyService.anonymizeUserDataWithValidation(user_id, initiated_by);

      res.json({
        message: 'User data anonymized successfully',
        user_id,
        anonymized_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Anonymize user data');
    }
  };

  // ========================================
  // HEALTH CHECK
  // ========================================

  complianceHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.privacyService.getComplianceHealthCheck();

      const httpStatus = health.status === 'critical' ? 503 : 200;

      res.status(httpStatus).json(health);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Compliance health check');
    }
  };
}
