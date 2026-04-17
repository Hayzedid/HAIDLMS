import pool from '../db/pool';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CreateIntegrationParams {
  organizationId: string;
  providerId: string;
  integrationName?: string;
  config?: any;
  enableSso?: boolean;
  enableSync?: boolean;
  enableWebhooks?: boolean;
  autoSyncEnabled?: boolean;
  syncIntervalMinutes?: number;
  connectedBy: string;
}

interface UpdateIntegrationParams {
  integrationName?: string;
  config?: any;
  enableSso?: boolean;
  enableSync?: boolean;
  enableWebhooks?: boolean;
  autoSyncEnabled?: boolean;
  syncIntervalMinutes?: number;
}

interface CreateSSOConfigParams {
  integrationId: string;
  organizationId: string;
  ssoType: string;
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlCertificate?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  attributeMapping?: any;
  autoProvisionUsers?: boolean;
  defaultRole?: string;
  allowedDomains?: string[];
}

interface CreateSyncJobParams {
  integrationId: string;
  jobType: string;
  direction?: string;
  syncConfig?: any;
  filters?: any;
  triggeredBy: string;
  triggeredByUserId?: string;
}

interface CreateWebhookParams {
  integrationId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  customHeaders?: any;
  filters?: any;
  verifySsl?: boolean;
  timeoutSeconds?: number;
  retryCount?: number;
}

interface OAuthCredentialParams {
  integrationId: string;
  providerType: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  grantedScopes?: string[];
}

// ============================================================================
// INTEGRATIONS SERVICE
// ============================================================================

export class IntegrationsService {
  // ========================================
  // INTEGRATION PROVIDERS
  // ========================================

  async listProviders(filters: any = {}): Promise<any[]> {
    const { integrationType, isActive = true, limit = 50 } = filters;

    let query = `SELECT * FROM integration_providers WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (integrationType) {
      query += ` AND integration_type = $${paramIndex}`;
      params.push(integrationType);
      paramIndex++;
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY name LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getProvider(providerId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM integration_providers WHERE id = $1`,
      [providerId]
    );
    return result.rows[0];
  }

  // ========================================
  // ORGANIZATION INTEGRATIONS
  // ========================================

  async createIntegration(params: CreateIntegrationParams): Promise<any> {
    const {
      organizationId,
      providerId,
      integrationName,
      config,
      enableSso,
      enableSync,
      enableWebhooks,
      autoSyncEnabled,
      syncIntervalMinutes,
      connectedBy
    } = params;

    const result = await pool.query(
      `INSERT INTO organization_integrations (
        organization_id, provider_id, integration_name, config,
        enable_sso, enable_sync, enable_webhooks, auto_sync_enabled,
        sync_interval_minutes, connected_by, connected_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'active')
      RETURNING *`,
      [
        organizationId,
        providerId,
        integrationName,
        config ? JSON.stringify(config) : null,
        enableSso,
        enableSync,
        enableWebhooks,
        autoSyncEnabled,
        syncIntervalMinutes,
        connectedBy
      ]
    );

    return result.rows[0];
  }

  async getIntegration(integrationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT oi.*, ip.name as provider_name, ip.integration_type, ip.provider_type
      FROM organization_integrations oi
      JOIN integration_providers ip ON ip.id = oi.provider_id
      WHERE oi.id = $1`,
      [integrationId]
    );
    return result.rows[0];
  }

  async listIntegrations(organizationId: string, filters: any = {}): Promise<any[]> {
    const { status, integrationType, limit = 50 } = filters;

    let query = `
      SELECT oi.*, ip.name as provider_name, ip.integration_type, ip.provider_type
      FROM organization_integrations oi
      JOIN integration_providers ip ON ip.id = oi.provider_id
      WHERE oi.organization_id = $1
    `;
    const params: any[] = [organizationId];
    let paramIndex = 2;

    if (status) {
      query += ` AND oi.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (integrationType) {
      query += ` AND ip.integration_type = $${paramIndex}`;
      params.push(integrationType);
      paramIndex++;
    }

    query += ` ORDER BY oi.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateIntegration(integrationId: string, params: UpdateIntegrationParams): Promise<any> {
    const {
      integrationName,
      config,
      enableSso,
      enableSync,
      enableWebhooks,
      autoSyncEnabled,
      syncIntervalMinutes
    } = params;

    const result = await pool.query(
      `UPDATE organization_integrations
      SET integration_name = COALESCE($2, integration_name),
          config = COALESCE($3, config),
          enable_sso = COALESCE($4, enable_sso),
          enable_sync = COALESCE($5, enable_sync),
          enable_webhooks = COALESCE($6, enable_webhooks),
          auto_sync_enabled = COALESCE($7, auto_sync_enabled),
          sync_interval_minutes = COALESCE($8, sync_interval_minutes),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        integrationId,
        integrationName,
        config ? JSON.stringify(config) : null,
        enableSso,
        enableSync,
        enableWebhooks,
        autoSyncEnabled,
        syncIntervalMinutes
      ]
    );

    return result.rows[0];
  }

  async disconnectIntegration(integrationId: string, disconnectedBy: string): Promise<void> {
    await pool.query(
      `UPDATE organization_integrations
      SET status = 'disconnected',
          disconnected_at = NOW(),
          disconnected_by = $2
      WHERE id = $1`,
      [integrationId, disconnectedBy]
    );
  }

  async getActiveIntegrations(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM active_integrations_overview`);
    return result.rows;
  }

  // ========================================
  // OAUTH CREDENTIALS
  // ========================================

  async saveOAuthCredentials(params: OAuthCredentialParams): Promise<any> {
    const {
      integrationId,
      providerType,
      accessToken,
      refreshToken,
      expiresAt,
      grantedScopes
    } = params;

    const result = await pool.query(
      `INSERT INTO oauth_credentials (
        integration_id, provider_type, access_token, refresh_token,
        expires_at, granted_scopes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (integration_id) DO UPDATE
      SET access_token = $3,
          refresh_token = $4,
          expires_at = $5,
          granted_scopes = $6,
          is_valid = true,
          last_refreshed_at = NOW()
      RETURNING *`,
      [integrationId, providerType, accessToken, refreshToken, expiresAt, grantedScopes]
    );

    return result.rows[0];
  }

  async getOAuthCredentials(integrationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM oauth_credentials WHERE integration_id = $1 AND is_valid = true`,
      [integrationId]
    );
    return result.rows[0];
  }

  async invalidateOAuthCredentials(integrationId: string): Promise<void> {
    await pool.query(
      `UPDATE oauth_credentials SET is_valid = false WHERE integration_id = $1`,
      [integrationId]
    );
  }

  // ========================================
  // SSO CONFIGURATIONS
  // ========================================

  async createSSOConfig(params: CreateSSOConfigParams): Promise<any> {
    const {
      integrationId,
      organizationId,
      ssoType,
      samlEntityId,
      samlSsoUrl,
      samlCertificate,
      clientId,
      clientSecret,
      authorizationEndpoint,
      tokenEndpoint,
      attributeMapping,
      autoProvisionUsers,
      defaultRole,
      allowedDomains
    } = params;

    const result = await pool.query(
      `INSERT INTO sso_configurations (
        integration_id, organization_id, sso_type, saml_entity_id, saml_sso_url,
        saml_certificate, client_id, client_secret, authorization_endpoint,
        token_endpoint, attribute_mapping, auto_provision_users, default_role,
        allowed_domains
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        integrationId,
        organizationId,
        ssoType,
        samlEntityId,
        samlSsoUrl,
        samlCertificate,
        clientId,
        clientSecret,
        authorizationEndpoint,
        tokenEndpoint,
        attributeMapping ? JSON.stringify(attributeMapping) : null,
        autoProvisionUsers,
        defaultRole,
        allowedDomains
      ]
    );

    return result.rows[0];
  }

  async getSSOConfig(organizationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM sso_configurations WHERE organization_id = $1 AND is_active = true`,
      [organizationId]
    );
    return result.rows[0];
  }

  async updateSSOConfig(configId: string, params: any): Promise<any> {
    const fields = Object.keys(params).filter(k => params[k] !== undefined);
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const setClauses = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
    const values = [configId, ...fields.map(f => params[f])];

    const result = await pool.query(
      `UPDATE sso_configurations SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // ========================================
  // SYNC JOBS
  // ========================================

  async createSyncJob(params: CreateSyncJobParams): Promise<any> {
    const {
      integrationId,
      jobType,
      direction,
      syncConfig,
      filters,
      triggeredBy,
      triggeredByUserId
    } = params;

    const result = await pool.query(
      `INSERT INTO sync_jobs (
        integration_id, job_type, direction, sync_config, filters,
        triggered_by, triggered_by_user_id, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        integrationId,
        jobType,
        direction,
        syncConfig ? JSON.stringify(syncConfig) : null,
        filters ? JSON.stringify(filters) : null,
        triggeredBy,
        triggeredByUserId
      ]
    );

    return result.rows[0];
  }

  async getSyncJob(jobId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM sync_jobs WHERE id = $1`,
      [jobId]
    );
    return result.rows[0];
  }

  async listSyncJobs(integrationId: string, limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM sync_jobs WHERE integration_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [integrationId, limit]
    );
    return result.rows;
  }

  async updateSyncJobStatus(
    jobId: string,
    status: string,
    progressData?: any
  ): Promise<any> {
    const result = await pool.query(
      `UPDATE sync_jobs
      SET status = $2,
          started_at = CASE WHEN $2 = 'running' THEN NOW() ELSE started_at END,
          completed_at = CASE WHEN $2 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
          processed_items = COALESCE($3, processed_items),
          success_count = COALESCE($4, success_count),
          error_count = COALESCE($5, error_count),
          result_summary = COALESCE($6, result_summary)
      WHERE id = $1
      RETURNING *`,
      [
        jobId,
        status,
        progressData?.processedItems,
        progressData?.successCount,
        progressData?.errorCount,
        progressData?.resultSummary ? JSON.stringify(progressData.resultSummary) : null
      ]
    );

    return result.rows[0];
  }

  async getSyncStatistics(integrationId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM sync_job_statistics WHERE integration_id = $1`,
      [integrationId]
    );
    return result.rows;
  }

  // ========================================
  // WEBHOOKS
  // ========================================

  async createWebhook(params: CreateWebhookParams): Promise<any> {
    const {
      integrationId,
      name,
      url,
      secret,
      events,
      customHeaders,
      filters,
      verifySsl,
      timeoutSeconds,
      retryCount
    } = params;

    const result = await pool.query(
      `INSERT INTO webhooks (
        integration_id, name, url, secret, events, custom_headers,
        filters, verify_ssl, timeout_seconds, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        integrationId,
        name,
        url,
        secret,
        events,
        customHeaders ? JSON.stringify(customHeaders) : null,
        filters ? JSON.stringify(filters) : null,
        verifySsl,
        timeoutSeconds,
        retryCount
      ]
    );

    return result.rows[0];
  }

  async getWebhook(webhookId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM webhooks WHERE id = $1`,
      [webhookId]
    );
    return result.rows[0];
  }

  async listWebhooks(integrationId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM webhooks WHERE integration_id = $1 ORDER BY created_at DESC`,
      [integrationId]
    );
    return result.rows;
  }

  async updateWebhook(webhookId: string, params: any): Promise<any> {
    const { name, url, events, customHeaders, filters, isActive } = params;

    const result = await pool.query(
      `UPDATE webhooks
      SET name = COALESCE($2, name),
          url = COALESCE($3, url),
          events = COALESCE($4, events),
          custom_headers = COALESCE($5, custom_headers),
          filters = COALESCE($6, filters),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        webhookId,
        name,
        url,
        events,
        customHeaders ? JSON.stringify(customHeaders) : null,
        filters ? JSON.stringify(filters) : null,
        isActive
      ]
    );

    return result.rows[0];
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await pool.query(`DELETE FROM webhooks WHERE id = $1`, [webhookId]);
  }

  async createWebhookDelivery(
    webhookId: string,
    eventType: string,
    eventId: string,
    requestBody: any
  ): Promise<any> {
    const webhook = await this.getWebhook(webhookId);

    const result = await pool.query(
      `INSERT INTO webhook_deliveries (
        webhook_id, event_type, event_id, request_url, request_body, status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *`,
      [webhookId, eventType, eventId, webhook.url, JSON.stringify(requestBody)]
    );

    return result.rows[0];
  }

  async recordWebhookDelivery(
    deliveryId: string,
    responseStatus: number,
    responseBody: string,
    responseTimeMs: number,
    error?: string
  ): Promise<void> {
    const status = responseStatus >= 200 && responseStatus < 300 ? 'sent' : 'failed';

    await pool.query(
      `UPDATE webhook_deliveries
      SET status = $2,
          response_status = $3,
          response_body = $4,
          response_time_ms = $5,
          error_message = $6,
          sent_at = NOW(),
          completed_at = NOW(),
          attempts = attempts + 1
      WHERE id = $1`,
      [deliveryId, status, responseStatus, responseBody, responseTimeMs, error]
    );
  }

  async getWebhookPerformance(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM webhook_performance`);
    return result.rows;
  }

  // ========================================
  // HEALTH CHECKS
  // ========================================

  async recordHealthCheck(
    integrationId: string,
    checkType: string,
    status: string,
    checkDetails: any
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO integration_health_checks (
        integration_id, check_type, status, response_time_ms,
        checks_passed, checks_failed, check_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        integrationId,
        checkType,
        status,
        checkDetails.responseTimeMs,
        checkDetails.checksPassed,
        checkDetails.checksFailed,
        JSON.stringify(checkDetails)
      ]
    );

    // Update integration health status
    await pool.query(
      `UPDATE organization_integrations
      SET health_status = $2,
          last_health_check_at = NOW()
      WHERE id = $1`,
      [integrationId, status]
    );

    return result.rows[0];
  }

  async getHealthSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM integration_health_summary`);
    return result.rows;
  }

  async getIntegrationHealth(integrationId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM integration_health_checks
      WHERE integration_id = $1
      ORDER BY checked_at DESC
      LIMIT 10`,
      [integrationId]
    );
    return result.rows;
  }

  // ========================================
  // INTEGRATION EVENTS
  // ========================================

  async logEvent(
    integrationId: string,
    eventType: string,
    eventCategory: string,
    severity: string,
    message: string,
    eventData?: any
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO integration_events (
        integration_id, event_type, event_category, severity, message, event_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        integrationId,
        eventType,
        eventCategory,
        severity,
        message,
        eventData ? JSON.stringify(eventData) : null
      ]
    );

    return result.rows[0];
  }

  async getEvents(integrationId: string, filters: any = {}): Promise<any[]> {
    const { category, severity, limit = 100 } = filters;

    let query = `SELECT * FROM integration_events WHERE integration_id = $1`;
    const params: any[] = [integrationId];
    let paramIndex = 2;

    if (category) {
      query += ` AND event_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  async isIntegrationHealthy(integrationId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT is_integration_healthy($1) as is_healthy`,
      [integrationId]
    );
    return result.rows[0]?.is_healthy || false;
  }

  async recordError(integrationId: string, errorMessage: string, errorDetails?: any): Promise<void> {
    await pool.query(
      `SELECT record_integration_error($1, $2, $3)`,
      [integrationId, errorMessage, errorDetails ? JSON.stringify(errorDetails) : null]
    );
  }

  async resetErrors(integrationId: string): Promise<void> {
    await pool.query(`SELECT reset_integration_errors($1)`, [integrationId]);
  }

  async scheduleNextSync(integrationId: string): Promise<Date> {
    const result = await pool.query(
      `SELECT schedule_next_sync($1) as next_sync`,
      [integrationId]
    );
    return result.rows[0].next_sync;
  }
}

export const integrationsService = new IntegrationsService();
