import { Pool } from 'pg';

export class PrivacyComplianceService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // CONSENT MANAGEMENT
  // ========================================

  async grantConsent(data: {
    user_id: string;
    consent_type: string;
    consent_version: string;
    consent_purpose: string;
    ip_address?: string;
  }): Promise<string> {
    const result = await this.pool.query(
      `SELECT grant_user_consent($1, $2, $3, $4, $5) as consent_id`,
      [data.user_id, data.consent_type, data.consent_version, data.consent_purpose, data.ip_address || null]
    );
    return result.rows[0].consent_id;
  }

  async withdrawConsent(user_id: string, consent_type: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT withdraw_user_consent($1, $2) as count`,
      [user_id, consent_type]
    );
    return result.rows[0].count;
  }

  async getUserConsents(user_id: string, status?: string): Promise<any[]> {
    let query = `SELECT * FROM user_consents WHERE user_id = $1`;
    const values: any[] = [user_id];

    if (status) {
      query += ` AND status = $2`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getActiveConsents(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM user_active_consents`);
    return result.rows;
  }

  // ========================================
  // PRIVACY REQUESTS (GDPR/CCPA)
  // ========================================

  async createPrivacyRequest(data: {
    user_id: string;
    requester_email: string;
    request_type: string;
    request_description?: string;
    data_categories?: string[];
  }): Promise<string> {
    const result = await this.pool.query(
      `SELECT create_privacy_request($1, $2, $3) as request_id`,
      [data.user_id, data.request_type, data.requester_email]
    );

    const requestId = result.rows[0].request_id;

    // Update with additional details if provided
    if (data.request_description || data.data_categories) {
      await this.updatePrivacyRequest(requestId, {
        request_description: data.request_description,
        data_categories: data.data_categories
      });
    }

    return requestId;
  }

  async getPrivacyRequests(filters?: {
    user_id?: string;
    request_type?: string;
    status?: string;
  }): Promise<any[]> {
    let query = `SELECT * FROM privacy_requests WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(filters.user_id);
    }

    if (filters?.request_type) {
      query += ` AND request_type = $${paramIndex++}`;
      values.push(filters.request_type);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }

    query += ` ORDER BY requested_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getPrivacyRequestById(request_id: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT * FROM privacy_requests WHERE id = $1`,
      [request_id]
    );
    return result.rows[0];
  }

  async updatePrivacyRequest(request_id: string, data: {
    status?: string;
    assigned_to?: string;
    request_description?: string;
    data_categories?: string[];
    result_data?: any;
    rejection_reason?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (data.assigned_to) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(data.assigned_to);
    }

    if (data.request_description) {
      updates.push(`request_description = $${paramIndex++}`);
      values.push(data.request_description);
    }

    if (data.data_categories) {
      updates.push(`data_categories = $${paramIndex++}`);
      values.push(data.data_categories);
    }

    if (data.result_data) {
      updates.push(`result_data = $${paramIndex++}`);
      values.push(JSON.stringify(data.result_data));
    }

    if (data.rejection_reason) {
      updates.push(`rejection_reason = $${paramIndex++}`);
      values.push(data.rejection_reason);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(request_id);

    const query = `UPDATE privacy_requests SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  async getOverduePrivacyRequests(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM overdue_privacy_requests`);
    return result.rows;
  }

  // ========================================
  // DATA RETENTION
  // ========================================

  async createRetentionPolicy(data: {
    policy_name: string;
    description?: string;
    data_category: string;
    table_name?: string;
    retention_period_days: number;
    legal_basis?: string;
    deletion_method?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO data_retention_policies (
        policy_name, description, data_category, table_name,
        retention_period_days, legal_basis, deletion_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.policy_name,
      data.description || null,
      data.data_category,
      data.table_name || null,
      data.retention_period_days,
      data.legal_basis || null,
      data.deletion_method || 'hard_delete'
    ]);

    return result.rows[0].id;
  }

  async getRetentionPolicies(is_active?: boolean): Promise<any[]> {
    const query = is_active !== undefined
      ? `SELECT * FROM data_retention_policies WHERE is_active = $1 ORDER BY created_at DESC`
      : `SELECT * FROM data_retention_policies ORDER BY created_at DESC`;

    const result = is_active !== undefined
      ? await this.pool.query(query, [is_active])
      : await this.pool.query(query);

    return result.rows;
  }

  async executeRetentionPolicy(policy_id: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT execute_retention_policy($1) as deleted_count`,
      [policy_id]
    );
    return result.rows[0].deleted_count;
  }

  async getRetentionSummary(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM data_retention_summary`);
    return result.rows;
  }

  // ========================================
  // DATA DELETION LOGS
  // ========================================

  async logDataDeletion(data: {
    user_id?: string;
    user_email?: string;
    deletion_type: string;
    data_category?: string;
    table_name?: string;
    record_count?: number;
    deleted_by?: string;
  }): Promise<string> {
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

    return result.rows[0].id;
  }

  async getDeletionLogs(filters?: {
    user_id?: string;
    data_category?: string;
    start_date?: Date;
  }): Promise<any[]> {
    let query = `SELECT * FROM data_deletion_logs WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(filters.user_id);
    }

    if (filters?.data_category) {
      query += ` AND data_category = $${paramIndex++}`;
      values.push(filters.data_category);
    }

    if (filters?.start_date) {
      query += ` AND deleted_at >= $${paramIndex++}`;
      values.push(filters.start_date);
    }

    query += ` ORDER BY deleted_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // DATA ACCESS LOGS
  // ========================================

  async logDataAccess(data: {
    subject_user_id?: string;
    accessor_user_id?: string;
    accessor_role?: string;
    access_type: string;
    data_category?: string;
    table_name?: string;
    purpose?: string;
    ip_address?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO data_access_logs (
        subject_user_id, accessor_user_id, accessor_role,
        access_type, data_category, table_name, purpose, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.subject_user_id || null,
      data.accessor_user_id || null,
      data.accessor_role || null,
      data.access_type,
      data.data_category || null,
      data.table_name || null,
      data.purpose || null,
      data.ip_address || null
    ]);

    return result.rows[0].id;
  }

  async getAccessLogs(filters?: {
    subject_user_id?: string;
    accessor_user_id?: string;
    start_date?: Date;
  }): Promise<any[]> {
    let query = `SELECT * FROM data_access_logs WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.subject_user_id) {
      query += ` AND subject_user_id = $${paramIndex++}`;
      values.push(filters.subject_user_id);
    }

    if (filters?.accessor_user_id) {
      query += ` AND accessor_user_id = $${paramIndex++}`;
      values.push(filters.accessor_user_id);
    }

    if (filters?.start_date) {
      query += ` AND accessed_at >= $${paramIndex++}`;
      values.push(filters.start_date);
    }

    query += ` ORDER BY accessed_at DESC LIMIT 100`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // DATA PROCESSING AGREEMENTS
  // ========================================

  async createDataProcessingAgreement(data: {
    agreement_name: string;
    agreement_type: string;
    third_party_name: string;
    third_party_contact?: string;
    data_categories: string[];
    processing_purposes: string[];
    agreement_signed_date?: Date;
  }): Promise<string> {
    const query = `
      INSERT INTO data_processing_agreements (
        agreement_name, agreement_type, third_party_name,
        third_party_contact, data_categories, processing_purposes,
        agreement_signed_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.agreement_name,
      data.agreement_type,
      data.third_party_name,
      data.third_party_contact || null,
      data.data_categories,
      data.processing_purposes,
      data.agreement_signed_date || null
    ]);

    return result.rows[0].id;
  }

  async getDataProcessingAgreements(is_active?: boolean): Promise<any[]> {
    const query = is_active !== undefined
      ? `SELECT * FROM data_processing_agreements WHERE is_active = $1 ORDER BY created_at DESC`
      : `SELECT * FROM data_processing_agreements ORDER BY created_at DESC`;

    const result = is_active !== undefined
      ? await this.pool.query(query, [is_active])
      : await this.pool.query(query);

    return result.rows;
  }

  // ========================================
  // PRIVACY IMPACT ASSESSMENTS
  // ========================================

  async createPrivacyImpactAssessment(data: {
    assessment_name: string;
    processing_activity: string;
    data_categories: string[];
    risk_level?: string;
    created_by?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO privacy_impact_assessments (
        assessment_name, processing_activity, data_categories,
        risk_level, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.assessment_name,
      data.processing_activity,
      data.data_categories,
      data.risk_level || null,
      data.created_by || null
    ]);

    return result.rows[0].id;
  }

  async getPrivacyImpactAssessments(status?: string): Promise<any[]> {
    const query = status
      ? `SELECT * FROM privacy_impact_assessments WHERE status = $1 ORDER BY created_at DESC`
      : `SELECT * FROM privacy_impact_assessments ORDER BY created_at DESC`;

    const result = status
      ? await this.pool.query(query, [status])
      : await this.pool.query(query);

    return result.rows;
  }

  // ========================================
  // DATA BREACH INCIDENTS
  // ========================================

  async createDataBreachIncident(data: {
    incident_reference: string;
    incident_title: string;
    incident_description?: string;
    discovered_at: Date;
    discovered_by?: string;
    breach_type?: string;
    severity: string;
    affected_data_categories?: string[];
  }): Promise<string> {
    const query = `
      INSERT INTO data_breach_incidents (
        incident_reference, incident_title, incident_description,
        discovered_at, discovered_by, breach_type, severity,
        affected_data_categories
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.incident_reference,
      data.incident_title,
      data.incident_description || null,
      data.discovered_at,
      data.discovered_by || null,
      data.breach_type || null,
      data.severity,
      data.affected_data_categories || null
    ]);

    return result.rows[0].id;
  }

  async getDataBreachIncidents(status?: string): Promise<any[]> {
    const query = status
      ? `SELECT * FROM data_breach_incidents WHERE status = $1 ORDER BY discovered_at DESC`
      : `SELECT * FROM data_breach_incidents ORDER BY discovered_at DESC`;

    const result = status
      ? await this.pool.query(query, [status])
      : await this.pool.query(query);

    return result.rows;
  }

  async updateDataBreachIncident(incident_id: string, data: {
    status?: string;
    dpa_notified?: boolean;
    users_notified?: boolean;
    resolution_summary?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    if (data.dpa_notified !== undefined) {
      updates.push(`dpa_notified = $${paramIndex++}`, `dpa_notified_at = NOW()`);
      values.push(data.dpa_notified);
    }

    if (data.users_notified !== undefined) {
      updates.push(`users_notified = $${paramIndex++}`, `users_notified_at = NOW()`);
      values.push(data.users_notified);
    }

    if (data.resolution_summary) {
      updates.push(`resolution_summary = $${paramIndex++}`);
      values.push(data.resolution_summary);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(incident_id);

    const query = `UPDATE data_breach_incidents SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  // ========================================
  // COOKIE CONSENT
  // ========================================

  async recordCookieConsent(data: {
    user_id?: string;
    session_id?: string;
    necessary_cookies: boolean;
    functional_cookies: boolean;
    analytics_cookies: boolean;
    marketing_cookies: boolean;
    consent_version: string;
    ip_address?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO cookie_consents (
        user_id, session_id, necessary_cookies, functional_cookies,
        analytics_cookies, marketing_cookies, consent_version, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.user_id || null,
      data.session_id || null,
      data.necessary_cookies,
      data.functional_cookies,
      data.analytics_cookies,
      data.marketing_cookies,
      data.consent_version,
      data.ip_address || null
    ]);

    return result.rows[0].id;
  }

  async getCookieConsent(user_id?: string, session_id?: string): Promise<any> {
    let query = `SELECT * FROM cookie_consents WHERE `;
    const values: any[] = [];

    if (user_id) {
      query += `user_id = $1`;
      values.push(user_id);
    } else if (session_id) {
      query += `session_id = $1`;
      values.push(session_id);
    } else {
      return null;
    }

    query += ` ORDER BY created_at DESC LIMIT 1`;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // ========================================
  // ANONYMIZATION
  // ========================================

  async anonymizeUserData(user_id: string): Promise<void> {
    await this.pool.query(`SELECT anonymize_user_data($1)`, [user_id]);
  }
}
