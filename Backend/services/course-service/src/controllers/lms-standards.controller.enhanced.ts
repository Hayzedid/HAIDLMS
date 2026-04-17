import { Request, Response, NextFunction } from 'express';
import { LMSStandardsServiceEnhanced } from '../services/lms-standards.service.enhanced';
import { Pool } from 'pg';
import { handleError, AppError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('LMSStandardsController');

export class LMSStandardsControllerEnhanced {
  private lmsService: LMSStandardsServiceEnhanced;

  constructor(pool: Pool) {
    this.lmsService = new LMSStandardsServiceEnhanced(pool);
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
  // SCORM PACKAGES - ENHANCED
  // ========================================

  createSCORMPackage = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      logger.logAPIRequest('POST', '/lms/scorm/packages', req.body.created_by);

      const packageId = await this.lmsService.createSCORMPackage(req.body);

      const duration = Date.now() - startTime;
      logger.logAPIResponse('POST', '/lms/scorm/packages', 201, duration);

      res.status(201).json({
        id: packageId,
        message: 'SCORM package created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create SCORM package');
    }
  };

  getSCORMPackageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id } = req.params;
      logger.debug('Fetching SCORM package', { package_id });

      const package_ = await this.lmsService.getSCORMPackageById(package_id);

      res.json(package_);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get SCORM package');
    }
  };

  validateSCORMPackage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { package_id } = req.params;
      logger.info('Validating SCORM package', { package_id });

      const validationResult = await this.lmsService.validateSCORMPackage(package_id);

      res.json({
        package_id,
        is_valid: validationResult.is_valid,
        errors: validationResult.errors,
        validated_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Validate SCORM package');
    }
  };

  // ========================================
  // SCORM ATTEMPTS - ENHANCED
  // ========================================

  createSCORMAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/lms/scorm/attempts', req.body.user_id);

      const attemptId = await this.lmsService.createSCORMAttempt(req.body);

      res.status(201).json({
        id: attemptId,
        message: 'SCORM attempt created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create SCORM attempt');
    }
  };

  updateSCORMAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { attempt_id } = req.params;
      logger.debug('Updating SCORM attempt', { attempt_id, cmi_fields: Object.keys(req.body) });

      await this.lmsService.updateSCORMAttemptWithValidation(attempt_id, req.body);

      res.json({
        message: 'SCORM attempt updated successfully',
        attempt_id
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update SCORM attempt');
    }
  };

  getSCORMAttemptProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, package_id } = req.query;

      if (!user_id || !package_id) {
        res.status(400).json({ error: 'user_id and package_id are required' });
        return;
      }

      const progress = await this.lmsService.getSCORMAttemptProgress(
        user_id as string,
        package_id as string
      );

      res.json(progress);
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get SCORM attempt progress');
    }
  };

  // ========================================
  // LTI CONSUMERS - ENHANCED
  // ========================================

  createLTIConsumer = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/lms/lti/consumers');

      const consumerId = await this.lmsService.createLTIConsumer(req.body);

      res.status(201).json({
        id: consumerId,
        message: 'LTI consumer created successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create LTI consumer');
    }
  };

  validateLTIRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { consumer_key, oauth_signature } = req.body;

      if (!consumer_key || !oauth_signature) {
        res.status(400).json({ error: 'consumer_key and oauth_signature are required' });
        return;
      }

      const isValid = await this.lmsService.validateLTIRequest(consumer_key, oauth_signature);

      res.json({
        valid: isValid,
        consumer_key,
        validated_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Validate LTI request');
    }
  };

  // ========================================
  // LTI GRADES - ENHANCED
  // ========================================

  recordLTIGrade = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/lms/lti/grades', req.body.user_id);

      const gradeId = await this.lmsService.recordLTIGradeWithPassback(req.body);

      res.status(201).json({
        id: gradeId,
        message: 'LTI grade recorded and passback queued'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record LTI grade');
    }
  };

  // ========================================
  // xAPI STATEMENTS - ENHANCED
  // ========================================

  recordXAPIStatement = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/lms/xapi/statements', req.body.actor_id);

      const statementId = await this.lmsService.recordXAPIStatementWithValidation(req.body);

      res.status(201).json({
        id: statementId,
        message: 'xAPI statement recorded successfully'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Record xAPI statement');
    }
  };

  getXAPILearnerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { actor_id } = req.params;
      logger.debug('Fetching xAPI learner profile', { actor_id });

      const profile = await this.lmsService.getXAPILearnerProfile(actor_id);

      res.json({
        actor_id,
        profile,
        generated_at: new Date().toISOString()
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Get xAPI learner profile');
    }
  };

  // ========================================
  // CONTENT EXPORT - ENHANCED
  // ========================================

  createContentExport = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.logAPIRequest('POST', '/lms/content-exports', req.body.generated_by);

      const exportId = await this.lmsService.createContentExportJob(req.body);

      res.status(201).json({
        id: exportId,
        status: 'pending',
        message: 'Content export job created'
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Create content export');
    }
  };

  updateContentExportProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { export_id } = req.params;
      const { progress_percent, status } = req.body;

      if (progress_percent === undefined || progress_percent < 0 || progress_percent > 100) {
        res.status(400).json({ error: 'progress_percent must be between 0 and 100' });
        return;
      }

      await this.lmsService.updateExportProgress(export_id, progress_percent, status);

      res.json({
        message: 'Export progress updated',
        export_id,
        progress_percent,
        status
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Update content export progress');
    }
  };

  // ========================================
  // HEALTH CHECK
  // ========================================

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        status: 'healthy',
        service: 'LMS Standards',
        timestamp: new Date().toISOString(),
        features: {
          scorm: ['1.2', '2004_3rd', '2004_4th'],
          lti: ['1.1', '1.3'],
          xapi: true,
          content_export: ['scorm_1.2', 'scorm_2004', 'xapi', 'common_cartridge']
        }
      });
    } catch (error: any) {
      this.handleControllerError(res, error, 'Health check');
    }
  };
}
