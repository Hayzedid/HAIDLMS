import { Pool, PoolClient } from 'pg';
import {
  ConsentSchema,
  PrivacyRequestSchema,
  RetentionPolicySchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError, BusinessLogicError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('PrivacyComplianceService');

export class PrivacyComplianceServiceEnhanced {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // TRANSACTION HELPER
  // ========================================

  private async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========================================
  // CONSENT MANAGEMENT - ENHANCED
  // ========================================

  async grantConsentWithValidation(data: any): Promise<string> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedData = ConsentSchema.parse(data);
      logger.info('Granting user consent', {
        user_id: validatedData.user_id,
        consent_type: validatedData.consent_type,
        consent_purpose: validatedData.consent_purpose
      });

      // Check for existing active consent
      const existingConsent = await this.pool.query(
        `SELECT id FROM user_consents
         WHERE user_id = $1 AND consent_type = $2 AND status = 'granted'`,
        [validatedData.user_id, validatedData.consent_type]
      );

      if (existingConsent.rows.length > 0) {
        logger.warn('User already has active consent', {
          user_id: validatedData.user_id,
          consent_type: validatedData.consent_type
        });
        return existingConsent.rows[0].id;
      }

      const result = await this.pool.query(
        `SELECT grant_user_consent($1, $2, $3, $4, $5) as consent_id`,
        [
          validatedData.user_id,
          validatedData.consent_type,
          validatedData.consent_version,
          validatedData.consent_purpose,
          validatedData.ip_address || null
        ]
      );

      const duration = Date.now() - startTime;
      logger.info('User consent granted successfully', {
        consent_id: result.rows[0].consent_id,
        duration: `${duration}ms`
      });

      return result.rows[0].consent_id;
    } catch (error: any) {
      logger.error('Failed to grant user consent', error, { user_id: data.user_id });
      throw error;
    }
  }

  async withdrawConsentWithValidation(user_id: string, consent_type: string): Promise<number> {
    try {
      logger.info('Withdrawing user consent', { user_id, consent_type });

      // Check if consent exists
      const existingConsent = await this.pool.query(
        `SELECT id FROM user_consents
         WHERE user_id = $1 AND consent_type = $2 AND status = 'granted'`,
        [user_id, consent_type]
      );

      if (existingConsent.rows.length === 0) {
        throw new NotFoundError('Active consent', `${user_id}:${consent_type}`);
      }

      const result = await this.pool.query(
        `SELECT withdraw_user_consent($1, $2) as count`,
        [user_id, consent_type]
      );

      logger.info('User consent withdrawn', {
        user_id,
        consent_type,
        count: result.rows[0].count
      });

      return result.rows[0].count;
    } catch (error: any) {
      logger.error('Failed to withdraw user consent', error, { user_id, consent_type });
      throw error;
    }
  }

  async getUserConsentsWithDetails(user_id: string, status?: string): Promise<any[]> {
    try {
      logger.debug('Fetching user consents', { user_id, status });

      let query = `
        SELECT
          uc.*,
          CASE
            WHEN uc.status = 'granted' THEN 'Active'
            WHEN uc.status = 'withdrawn' THEN 'Withdrawn'
            ELSE 'Unknown'
          END as status_display
        FROM user_consents uc
        WHERE uc.user_id = $1
      `;
      const values: any[] = [user_id];

      if (status) {
        query += ` AND uc.status = $2`;
        values.push(status);
      }

      query += ` ORDER BY uc.created_at DESC`;

      const result = await this.pool.query(query, values);

      logger.debug('User consents retrieved', {
        user_id,
        count: result.rows.length
      });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch user consents', error, { user_id });
      throw error;
    }
  }

  async checkConsentRequired(user_id: string, purpose: string): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) > 0 as has_consent
        FROM user_consents
        WHERE user_id = $1
          AND consent_purpose = $2
          AND status = 'granted'
      `, [user_id, purpose]);

      return result.rows[0].has_consent;
    } catch (error: any) {
      logger.error('Failed to check consent', error, { user_id, purpose });
      throw error;
    }
  }

  // ========================================
  // PRIVACY REQUESTS (GDPR/CCPA) - ENHANCED
  // ========================================

  async createPrivacyRequestWithValidation(data: any): Promise<string> {
    const startTime = Date.now();

    try {
      const validatedData = PrivacyRequestSchema.parse(data);
      logger.info('Creating privacy request', {
        user_id: validatedData.user_id,
        request_type: validatedData.request_type
      });

      // Check for duplicate pending requests
      const existingRequest = await this.pool.query(
        `SELECT id FROM privacy_requests
         WHERE user_id = $1 AND request_type = $2 AND status IN ('pending', 'in_progress')`,
        [validatedData.user_id, validatedData.request_type]
      );

      if (existingRequest.rows.length > 0) {
        throw new ConflictError(`A ${validatedData.request_type} request is already in progress for this user`);
      }

      return await this.withTransaction(async (client) => {
        const result = await client.query(
          `SELECT create_privacy_request($1, $2, $3) as request_id`,
          [validatedData.user_id, validatedData.request_type, validatedData.requester_email]
        );

        const requestId = result.rows[0].request_id;

        // Update with additional details if provided
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (validatedData.request_description) {
          updates.push(`request_description = $${paramIndex++}`);
          values.push(validatedData.request_description);
        }

        if (validatedData.data_categories && validatedData.data_categories.length > 0) {
          updates.push(`data_categories = $${paramIndex++}`);
          values.push(validatedData.data_categories);
        }

        if (updates.length > 0) {
          updates.push(`updated_at = NOW()`);
          values.push(requestId);

          await client.query(
            `UPDATE privacy_requests SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
          );
        }

        const duration = Date.now() - startTime;
        logger.info('Privacy request created successfully', {
          request_id: requestId,
          duration: `${duration}ms`
        });

        return requestId;
      });
    } catch (error: any) {
      logger.error('Failed to create privacy request', error, { user_id: data.user_id });
      throw error;
    }
  }

  async getPrivacyRequestByIdWithValidation(request_id: string): Promise<any> {
    try {
      logger.debug('Fetching privacy request', { request_id });

      const result = await this.pool.query(
        `SELECT * FROM privacy_requests WHERE id = $1`,
        [request_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Privacy request', request_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch privacy request', error, { request_id });
      throw error;
    }
  }

  async updatePrivacyRequestStatus(
    request_id: string,
    status: string,
    additional_data?: { assigned_to?: string; rejection_reason?: string; result_data?: any }
  ): Promise<void> {
    try {
      logger.info('Updating privacy request status', { request_id, status });

      // Verify request exists
      await this.getPrivacyRequestByIdWithValidation(request_id);

      // Validate status transition
      const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }

      await this.withTransaction(async (client) => {
        const updates: string[] = [`status = $1`, `updated_at = NOW()`];
        const values: any[] = [status];
        let paramIndex = 2;

        if (status === 'completed' && !additional_data?.result_data) {
          logger.warn('Completing privacy request without result data', { request_id });
        }

        if (additional_data?.assigned_to) {
          updates.push(`assigned_to = $${paramIndex++}`);
          values.push(additional_data.assigned_to);
        }

        if (additional_data?.rejection_reason) {
          updates.push(`rejection_reason = $${paramIndex++}`);
          values.push(additional_data.rejection_reason);
        }

        if (additional_data?.result_data) {
          updates.push(`result_data = $${paramIndex++}`);
          values.push(JSON.stringify(additional_data.result_data));
        }

        if (status === 'completed') {
          updates.push(`completed_at = NOW()`);
        }

        values.push(request_id);

        await client.query(
          `UPDATE privacy_requests SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );

        logger.info('Privacy request status updated', { request_id, status });
      });
    } catch (error: any) {
      logger.error('Failed to update privacy request status', error, { request_id, status });
      throw error;
    }
  }

  async getOverduePrivacyRequestsWithAlert(): Promise<any[]> {
    try {
      logger.info('Fetching overdue privacy requests');

      const result = await this.pool.query(`
        SELECT
          pr.*,
          EXTRACT(DAY FROM NOW() - pr.requested_at) as days_overdue,
          CASE
            WHEN pr.request_type = 'data_erasure' THEN 30
            WHEN pr.request_type = 'data_access' THEN 30
            ELSE 30
          END as sla_days
        FROM overdue_privacy_requests pr
        ORDER BY days_overdue DESC
      `);

      logger.warn('Overdue privacy requests found', { count: result.rows.length });

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to fetch overdue privacy requests', error);
      throw error;
    }
  }

  // ========================================
  // DATA RETENTION - ENHANCED
  // ========================================

  async createRetentionPolicyWithValidation(data: any): Promise<string> {
    try {
      const validatedData = RetentionPolicySchema.parse(data);
      logger.info('Creating data retention policy', {
        policy_name: validatedData.policy_name,
        data_category: validatedData.data_category,
        retention_days: validatedData.retention_period_days
      });

      // Check for duplicate policy name
      const existingPolicy = await this.pool.query(
        `SELECT id FROM data_retention_policies WHERE policy_name = $1`,
        [validatedData.policy_name]
      );

      if (existingPolicy.rows.length > 0) {
        throw new ConflictError(`Retention policy with name '${validatedData.policy_name}' already exists`);
      }

      const query = `
        INSERT INTO data_retention_policies (
          policy_name, description, data_category, table_name,
          retention_period_days, legal_basis, deletion_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        validatedData.policy_name,
        validatedData.description || null,
        validatedData.data_category,
        validatedData.table_name || null,
        validatedData.retention_period_days,
        validatedData.legal_basis || null,
        validatedData.deletion_method || 'hard_delete'
      ]);

      logger.info('Retention policy created', { policy_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create retention policy', error);
      throw error;
    }
  }

  async executeRetentionPolicyWithLogging(policy_id: string, executed_by?: string): Promise<number> {
    try {
      logger.info('Executing retention policy', { policy_id, executed_by });

      // Verify policy exists
      const policy = await this.pool.query(
        `SELECT * FROM data_retention_policies WHERE id = $1`,
        [policy_id]
      );

      if (policy.rows.length === 0) {
        throw new NotFoundError('Retention policy', policy_id);
      }

      const policyData = policy.rows[0];

      if (!policyData.is_active) {
        throw new BusinessLogicError('Cannot execute inactive retention policy');
      }

      // Execute policy
      const result = await this.pool.query(
        `SELECT execute_retention_policy($1) as deleted_count`,
        [policy_id]
      );

      const deletedCount = result.rows[0].deleted_count;

      logger.info('Retention policy executed', {
        policy_id,
        deleted_count: deletedCount,
        policy_name: policyData.policy_name
      });

      return deletedCount;
    } catch (error: any) {
      logger.error('Failed to execute retention policy', error, { policy_id });
      throw error;
    }
  }

  async getRetentionSummaryWithRecommendations(): Promise<any> {
    try {
      const summary = await this.pool.query(`SELECT * FROM data_retention_summary`);

      const policies = await this.pool.query(`
        SELECT
          drp.*,
          COUNT(ddl.id) as execution_count,
          MAX(ddl.deleted_at) as last_execution
        FROM data_retention_policies drp
        LEFT JOIN data_deletion_logs ddl ON ddl.table_name = drp.table_name
        WHERE drp.is_active = true
        GROUP BY drp.id
        ORDER BY last_execution NULLS FIRST
      `);

      logger.debug('Retention summary retrieved', {
        summary_count: summary.rows.length,
        active_policies: policies.rows.length
      });

      return {
        summary: summary.rows,
        policies: policies.rows,
        recommendations: this.generateRetentionRecommendations(policies.rows)
      };
    } catch (error: any) {
      logger.error('Failed to fetch retention summary', error);
      throw error;
    }
  }

  private generateRetentionRecommendations(policies: any[]): string[] {
    const recommendations: string[] = [];
    const now = new Date();

    policies.forEach(policy => {
      if (!policy.last_execution) {
        recommendations.push(`Policy "${policy.policy_name}" has never been executed`);
      } else {
        const daysSinceExecution = Math.floor(
          (now.getTime() - new Date(policy.last_execution).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceExecution > policy.retention_period_days) {
          recommendations.push(`Policy "${policy.policy_name}" should be executed (last run: ${daysSinceExecution} days ago)`);
        }
      }
    });

    return recommendations;
  }

  // ========================================
  // DATA DELETION LOGS - ENHANCED
  // ========================================

  async logDataDeletionWithValidation(data: {
    user_id?: string;
    user_email?: string;
    deletion_type: string;
    data_category?: string;
    table_name?: string;
    record_count?: number;
    deleted_by?: string;
  }): Promise<string> {
    try {
      if (!data.user_id && !data.user_email) {
        throw new ValidationError('Either user_id or user_email must be provided');
      }

      logger.info('Logging data deletion', {
        user_id: data.user_id,
        deletion_type: data.deletion_type,
        record_count: data.record_count
      });

      const query = `
        INSERT INTO data_deletion_logs (
          user_id, user_email, deletion_type, data_category,
          table_name, record_count, deleted_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        data.user_id || null,
        data.user_email || null,
        data.deletion_type,
        data.data_category || null,
        data.table_name || null,
        data.record_count || null,
        data.deleted_by || null
      ]);

      logger.info('Data deletion logged', { log_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to log data deletion', error, data);
      throw error;
    }
  }

  // ========================================
  // DATA ANONYMIZATION - ENHANCED
  // ========================================

  async anonymizeUserDataWithValidation(user_id: string, initiated_by?: string): Promise<void> {
    try {
      logger.info('Anonymizing user data', { user_id, initiated_by });

      // Check if user exists (basic validation)
      const userCheck = await this.pool.query(
        `SELECT 1 FROM user_consents WHERE user_id = $1 LIMIT 1`,
        [user_id]
      );

      if (userCheck.rows.length === 0) {
        logger.warn('No data found for user anonymization', { user_id });
      }

      await this.withTransaction(async (client) => {
        // Execute anonymization
        await client.query(`SELECT anonymize_user_data($1)`, [user_id]);

        // Log the anonymization
        await client.query(`
          INSERT INTO data_deletion_logs (
            user_id, deletion_type, data_category, deleted_by
          ) VALUES ($1, 'anonymization', 'all', $2)
        `, [user_id, initiated_by || null]);
      });

      logger.info('User data anonymized successfully', { user_id });
    } catch (error: any) {
      logger.error('Failed to anonymize user data', error, { user_id });
      throw error;
    }
  }

  // ========================================
  // HEALTH CHECK
  // ========================================

  async getComplianceHealthCheck(): Promise<any> {
    try {
      const [overdueRequests, activeConsents, activePolicies, recentBreaches] = await Promise.all([
        this.pool.query(`SELECT COUNT(*) as count FROM overdue_privacy_requests`),
        this.pool.query(`SELECT COUNT(*) as count FROM user_active_consents`),
        this.pool.query(`SELECT COUNT(*) as count FROM data_retention_policies WHERE is_active = true`),
        this.pool.query(`SELECT COUNT(*) as count FROM data_breach_incidents WHERE status != 'resolved' AND discovered_at > NOW() - INTERVAL '30 days'`)
      ]);

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics: {
          overdue_privacy_requests: parseInt(overdueRequests.rows[0].count),
          active_consents: parseInt(activeConsents.rows[0].count),
          active_retention_policies: parseInt(activePolicies.rows[0].count),
          recent_unresolved_breaches: parseInt(recentBreaches.rows[0].count)
        },
        alerts: [] as string[]
      };

      if (health.metrics.overdue_privacy_requests > 0) {
        health.status = 'warning';
        health.alerts.push(`${health.metrics.overdue_privacy_requests} overdue privacy requests require attention`);
      }

      if (health.metrics.recent_unresolved_breaches > 0) {
        health.status = 'critical';
        health.alerts.push(`${health.metrics.recent_unresolved_breaches} unresolved data breaches in last 30 days`);
      }

      return health;
    } catch (error: any) {
      logger.error('Failed to get compliance health check', error);
      throw error;
    }
  }
}
