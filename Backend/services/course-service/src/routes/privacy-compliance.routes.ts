import { Router } from 'express';
import { PrivacyComplianceController } from '../controllers/privacy-compliance.controller';
import { Pool } from 'pg';

export const createPrivacyComplianceRoutes = (pool: Pool): Router => {
  const router = Router();
  const controller = new PrivacyComplianceController(pool);

  // Consent Management
  router.post('/consent/grant', controller.grantConsent);
  router.post('/consent/withdraw', controller.withdrawConsent);
  router.get('/consent/user/:user_id', controller.getUserConsents);

  // Privacy Requests (GDPR/CCPA)
  router.post('/requests', controller.createPrivacyRequest);
  router.get('/requests', controller.getPrivacyRequests);
  router.put('/requests/:request_id', controller.updatePrivacyRequest);

  // Data Retention
  router.post('/retention/policies', controller.createRetentionPolicy);
  router.post('/retention/policies/:policy_id/execute', controller.executeRetentionPolicy);

  // Data Breach
  router.post('/breach/incidents', controller.createDataBreachIncident);

  // Cookie Consent
  router.post('/cookies/consent', controller.recordCookieConsent);

  return router;
};
