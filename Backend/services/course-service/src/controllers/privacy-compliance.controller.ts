import { Request, Response } from 'express';
import { PrivacyComplianceService } from '../services/privacy-compliance.service';
import { Pool } from 'pg';

export class PrivacyComplianceController {
  private privacyService: PrivacyComplianceService;

  constructor(pool: Pool) {
    this.privacyService = new PrivacyComplianceService(pool);
  }

  // Consent Management
  grantConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const consentId = await this.privacyService.grantConsent(req.body);
      res.status(201).json({ id: consentId, message: 'Consent granted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to grant consent' });
    }
  };

  withdrawConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, consent_type } = req.body;
      const count = await this.privacyService.withdrawConsent(user_id, consent_type);
      res.json({ message: 'Consent withdrawn', count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to withdraw consent' });
    }
  };

  getUserConsents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id } = req.params;
      const { status } = req.query;
      const consents = await this.privacyService.getUserConsents(user_id, status as string);
      res.json({ consents });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch consents' });
    }
  };

  // Privacy Requests
  createPrivacyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = await this.privacyService.createPrivacyRequest(req.body);
      res.status(201).json({ id: requestId, message: 'Privacy request created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create request' });
    }
  };

  getPrivacyRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const requests = await this.privacyService.getPrivacyRequests(req.query);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  };

  updatePrivacyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { request_id } = req.params;
      await this.privacyService.updatePrivacyRequest(request_id, req.body);
      res.json({ message: 'Request updated' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update request' });
    }
  };

  // Data Retention
  createRetentionPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policyId = await this.privacyService.createRetentionPolicy(req.body);
      res.status(201).json({ id: policyId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create policy' });
    }
  };

  executeRetentionPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { policy_id } = req.params;
      const count = await this.privacyService.executeRetentionPolicy(policy_id);
      res.json({ deleted_count: count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute policy' });
    }
  };

  // Data Breach
  createDataBreachIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const incidentId = await this.privacyService.createDataBreachIncident(req.body);
      res.status(201).json({ id: incidentId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create incident' });
    }
  };

  // Cookie Consent
  recordCookieConsent = async (req: Request, res: Response): Promise<void> => {
    try {
      const consentId = await this.privacyService.recordCookieConsent(req.body);
      res.status(201).json({ id: consentId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record consent' });
    }
  };
}
