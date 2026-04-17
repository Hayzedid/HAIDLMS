import { Pool } from 'pg';

interface SCORMPackage {
  id: string;
  package_identifier: string;
  package_title: string;
  scorm_version: string;
  launch_url: string;
  course_id?: string;
  lesson_id?: string;
}

interface SCORMAttempt {
  id: string;
  package_id: string;
  user_id: string;
  attempt_number: number;
  cmi_core_lesson_status: string;
  cmi_core_score_raw?: number;
  progress_measure?: number;
}

interface LTIConsumer {
  id: string;
  consumer_key: string;
  consumer_name: string;
  lti_version: string;
  is_enabled: boolean;
}

interface XAPIStatement {
  statement_id: string;
  actor_id: string;
  verb: string;
  object_id: string;
  result_success?: boolean;
  result_score_scaled?: number;
}

export class LMSStandardsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ========================================
  // SCORM PACKAGES
  // ========================================

  async createSCORMPackage(data: {
    package_identifier: string;
    package_title: string;
    package_description?: string;
    scorm_version: string;
    manifest_file_path: string;
    package_file_path: string;
    storage_path: string;
    launch_url: string;
    course_id?: string;
    lesson_id?: string;
    created_by?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO scorm_packages (
        package_identifier, package_title, package_description,
        scorm_version, manifest_file_path, package_file_path,
        storage_path, launch_url, course_id, lesson_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.package_identifier,
      data.package_title,
      data.package_description || null,
      data.scorm_version,
      data.manifest_file_path,
      data.package_file_path,
      data.storage_path,
      data.launch_url,
      data.course_id || null,
      data.lesson_id || null,
      data.created_by || null
    ]);

    return result.rows[0].id;
  }

  async getSCORMPackages(filters?: {
    course_id?: string;
    lesson_id?: string;
    is_active?: boolean;
  }): Promise<SCORMPackage[]> {
    let query = `SELECT * FROM scorm_packages WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.course_id) {
      query += ` AND course_id = $${paramIndex++}`;
      values.push(filters.course_id);
    }

    if (filters?.lesson_id) {
      query += ` AND lesson_id = $${paramIndex++}`;
      values.push(filters.lesson_id);
    }

    if (filters?.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      values.push(filters.is_active);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getSCORMPackageById(package_id: string): Promise<SCORMPackage | null> {
    const result = await this.pool.query(
      `SELECT * FROM scorm_packages WHERE id = $1`,
      [package_id]
    );
    return result.rows[0] || null;
  }

  async updateSCORMPackage(package_id: string, data: Partial<SCORMPackage>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.package_title) {
      updates.push(`package_title = $${paramIndex++}`);
      values.push(data.package_title);
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(package_id);

    const query = `UPDATE scorm_packages SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  async deleteSCORMPackage(package_id: string): Promise<void> {
    await this.pool.query(`DELETE FROM scorm_packages WHERE id = $1`, [package_id]);
  }

  // ========================================
  // SCORM ATTEMPTS
  // ========================================

  async createSCORMAttempt(package_id: string, user_id: string): Promise<string> {
    const result = await this.pool.query(
      `SELECT create_scorm_attempt($1, $2) as attempt_id`,
      [package_id, user_id]
    );
    return result.rows[0].attempt_id;
  }

  async getSCORMAttempts(filters: {
    package_id?: string;
    user_id?: string;
    status?: string;
  }): Promise<SCORMAttempt[]> {
    let query = `SELECT * FROM scorm_attempts WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.package_id) {
      query += ` AND package_id = $${paramIndex++}`;
      values.push(filters.package_id);
    }

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(filters.user_id);
    }

    if (filters.status) {
      query += ` AND cmi_core_lesson_status = $${paramIndex++}`;
      values.push(filters.status);
    }

    query += ` ORDER BY started_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async updateSCORMAttempt(attempt_id: string, cmi_data: {
    cmi_core_lesson_status?: string;
    cmi_core_score_raw?: number;
    cmi_core_lesson_location?: string;
    cmi_suspend_data?: string;
    cmi_core_session_time?: number;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (cmi_data.cmi_core_lesson_status) {
      updates.push(`cmi_core_lesson_status = $${paramIndex++}`);
      values.push(cmi_data.cmi_core_lesson_status);
    }

    if (cmi_data.cmi_core_score_raw !== undefined) {
      updates.push(`cmi_core_score_raw = $${paramIndex++}`);
      values.push(cmi_data.cmi_core_score_raw);
    }

    if (cmi_data.cmi_core_lesson_location) {
      updates.push(`cmi_core_lesson_location = $${paramIndex++}`);
      values.push(cmi_data.cmi_core_lesson_location);
    }

    if (cmi_data.cmi_suspend_data) {
      updates.push(`cmi_suspend_data = $${paramIndex++}`);
      values.push(cmi_data.cmi_suspend_data);
    }

    if (cmi_data.cmi_core_session_time !== undefined) {
      updates.push(`cmi_core_session_time = $${paramIndex++}`);
      values.push(cmi_data.cmi_core_session_time);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`, `last_access_at = NOW()`);
    values.push(attempt_id);

    const query = `UPDATE scorm_attempts SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  async completeSCORMAttempt(
    attempt_id: string,
    status: string = 'completed',
    score?: number
  ): Promise<void> {
    await this.pool.query(
      `SELECT complete_scorm_attempt($1, $2, $3)`,
      [attempt_id, status, score || null]
    );
  }

  async getSCORMUserProgress(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM scorm_user_progress`);
    return result.rows;
  }

  // ========================================
  // LTI TOOL CONSUMERS
  // ========================================

  async createLTIConsumer(data: {
    consumer_key: string;
    consumer_name: string;
    consumer_description?: string;
    consumer_secret: string;
    lti_version: string;
    platform_id?: string;
    client_id?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO lti_tool_consumers (
        consumer_key, consumer_name, consumer_description,
        consumer_secret, lti_version, platform_id, client_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.consumer_key,
      data.consumer_name,
      data.consumer_description || null,
      data.consumer_secret,
      data.lti_version,
      data.platform_id || null,
      data.client_id || null
    ]);

    return result.rows[0].id;
  }

  async getLTIConsumers(is_enabled?: boolean): Promise<LTIConsumer[]> {
    const query = is_enabled !== undefined
      ? `SELECT * FROM lti_tool_consumers WHERE is_enabled = $1 ORDER BY created_at DESC`
      : `SELECT * FROM lti_tool_consumers ORDER BY created_at DESC`;

    const result = is_enabled !== undefined
      ? await this.pool.query(query, [is_enabled])
      : await this.pool.query(query);

    return result.rows;
  }

  async getLTIConsumerByKey(consumer_key: string): Promise<LTIConsumer | null> {
    const result = await this.pool.query(
      `SELECT * FROM lti_tool_consumers WHERE consumer_key = $1`,
      [consumer_key]
    );
    return result.rows[0] || null;
  }

  async updateLTIConsumer(consumer_id: string, data: Partial<LTIConsumer>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.consumer_name) {
      updates.push(`consumer_name = $${paramIndex++}`);
      values.push(data.consumer_name);
    }

    if (data.is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }

    if (updates.length === 0) return;

    updates.push(`updated_at = NOW()`);
    values.push(consumer_id);

    const query = `UPDATE lti_tool_consumers SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  async deleteLTIConsumer(consumer_id: string): Promise<void> {
    await this.pool.query(`DELETE FROM lti_tool_consumers WHERE id = $1`, [consumer_id]);
  }

  // ========================================
  // LTI RESOURCE LINKS
  // ========================================

  async createLTIResourceLink(data: {
    tool_consumer_id: string;
    resource_link_id: string;
    resource_link_title?: string;
    course_id?: string;
    lesson_id?: string;
    context_id?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO lti_resource_links (
        tool_consumer_id, resource_link_id, resource_link_title,
        course_id, lesson_id, context_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.tool_consumer_id,
      data.resource_link_id,
      data.resource_link_title || null,
      data.course_id || null,
      data.lesson_id || null,
      data.context_id || null
    ]);

    return result.rows[0].id;
  }

  async getLTIResourceLinks(filters?: {
    tool_consumer_id?: string;
    course_id?: string;
  }): Promise<any[]> {
    let query = `SELECT * FROM lti_resource_links WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.tool_consumer_id) {
      query += ` AND tool_consumer_id = $${paramIndex++}`;
      values.push(filters.tool_consumer_id);
    }

    if (filters?.course_id) {
      query += ` AND course_id = $${paramIndex++}`;
      values.push(filters.course_id);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // ========================================
  // LTI LAUNCHES
  // ========================================

  async recordLTILaunch(data: {
    resource_link_id: string;
    tool_consumer_id: string;
    user_id?: string;
    lti_user_id: string;
    message_type: string;
    roles: string[];
    context_id?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO lti_launches (
        resource_link_id, tool_consumer_id, user_id, lti_user_id,
        message_type, roles, context_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.resource_link_id,
      data.tool_consumer_id,
      data.user_id || null,
      data.lti_user_id,
      data.message_type,
      data.roles,
      data.context_id || null
    ]);

    return result.rows[0].id;
  }

  async getLTILaunches(filters?: {
    resource_link_id?: string;
    user_id?: string;
  }): Promise<any[]> {
    let query = `SELECT * FROM lti_launches WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.resource_link_id) {
      query += ` AND resource_link_id = $${paramIndex++}`;
      values.push(filters.resource_link_id);
    }

    if (filters?.user_id) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(filters.user_id);
    }

    query += ` ORDER BY launched_at DESC LIMIT 100`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getLTILaunchStatistics(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM lti_launch_statistics`);
    return result.rows;
  }

  // ========================================
  // LTI GRADES
  // ========================================

  async recordLTIGrade(data: {
    launch_id?: string;
    resource_link_id: string;
    user_id: string;
    result_sourcedid: string;
    result_score: number;
  }): Promise<string> {
    const query = `
      INSERT INTO lti_grades (
        launch_id, resource_link_id, user_id, result_sourcedid, result_score
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.launch_id || null,
      data.resource_link_id,
      data.user_id,
      data.result_sourcedid,
      data.result_score
    ]);

    return result.rows[0].id;
  }

  async syncLTIGrade(grade_id: string): Promise<void> {
    await this.pool.query(
      `UPDATE lti_grades SET is_synced = true, synced_at = NOW() WHERE id = $1`,
      [grade_id]
    );
  }

  // ========================================
  // xAPI STATEMENTS
  // ========================================

  async recordXAPIStatement(data: {
    statement_id: string;
    actor_id: string;
    verb: string;
    verb_id: string;
    object_id: string;
    object_type?: string;
    result_success?: boolean;
    result_score_scaled?: number;
    course_id?: string;
    lesson_id?: string;
    full_statement: any;
  }): Promise<string> {
    const result = await this.pool.query(
      `SELECT record_xapi_statement($1, $2, $3, $4, $5) as id`,
      [
        data.statement_id,
        data.actor_id,
        data.verb,
        data.object_id,
        JSON.stringify(data.full_statement)
      ]
    );

    return result.rows[0].id;
  }

  async getXAPIStatements(filters?: {
    actor_id?: string;
    verb?: string;
    course_id?: string;
    limit?: number;
  }): Promise<XAPIStatement[]> {
    let query = `SELECT * FROM xapi_statements WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.actor_id) {
      query += ` AND actor_id = $${paramIndex++}`;
      values.push(filters.actor_id);
    }

    if (filters?.verb) {
      query += ` AND verb = $${paramIndex++}`;
      values.push(filters.verb);
    }

    if (filters?.course_id) {
      query += ` AND course_id = $${paramIndex++}`;
      values.push(filters.course_id);
    }

    query += ` ORDER BY statement_timestamp DESC LIMIT $${paramIndex}`;
    values.push(filters?.limit || 100);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getXAPIActivitySummary(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM xapi_activity_summary`);
    return result.rows;
  }

  // ========================================
  // xAPI STATE
  // ========================================

  async saveXAPIState(data: {
    activity_id: string;
    agent_id: string;
    state_id: string;
    registration?: string;
    state_content: any;
  }): Promise<string> {
    const query = `
      INSERT INTO xapi_state (
        activity_id, agent_id, state_id, registration, state_content
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (activity_id, agent_id, state_id, registration)
      DO UPDATE SET state_content = $5, updated_at = NOW()
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.activity_id,
      data.agent_id,
      data.state_id,
      data.registration || null,
      JSON.stringify(data.state_content)
    ]);

    return result.rows[0].id;
  }

  async getXAPIState(
    activity_id: string,
    agent_id: string,
    state_id: string,
    registration?: string
  ): Promise<any> {
    const query = `
      SELECT * FROM xapi_state
      WHERE activity_id = $1 AND agent_id = $2 AND state_id = $3
        AND ($4::uuid IS NULL OR registration = $4)
    `;

    const result = await this.pool.query(query, [
      activity_id,
      agent_id,
      state_id,
      registration || null
    ]);

    return result.rows[0];
  }

  async deleteXAPIState(
    activity_id: string,
    agent_id: string,
    state_id: string
  ): Promise<void> {
    await this.pool.query(
      `DELETE FROM xapi_state WHERE activity_id = $1 AND agent_id = $2 AND state_id = $3`,
      [activity_id, agent_id, state_id]
    );
  }

  // ========================================
  // CONTENT EXPORTS
  // ========================================

  async createContentExport(data: {
    content_type: string;
    content_id: string;
    export_format: string;
    generated_by?: string;
  }): Promise<string> {
    const query = `
      INSERT INTO content_exports (
        content_type, content_id, export_format, generated_by
      ) VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const result = await this.pool.query(query, [
      data.content_type,
      data.content_id,
      data.export_format,
      data.generated_by || null
    ]);

    return result.rows[0].id;
  }

  async updateContentExport(export_id: string, data: {
    status: string;
    export_file_path?: string;
    progress_percent?: number;
    error_message?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);

    if (data.export_file_path) {
      updates.push(`export_file_path = $${paramIndex++}`);
      values.push(data.export_file_path);
    }

    if (data.progress_percent !== undefined) {
      updates.push(`progress_percent = $${paramIndex++}`);
      values.push(data.progress_percent);
    }

    if (data.error_message) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(data.error_message);
    }

    values.push(export_id);

    const query = `UPDATE content_exports SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await this.pool.query(query, values);
  }

  async getContentExports(filters?: {
    content_type?: string;
    status?: string;
    generated_by?: string;
  }): Promise<any[]> {
    let query = `SELECT * FROM content_exports WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.content_type) {
      query += ` AND content_type = $${paramIndex++}`;
      values.push(filters.content_type);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(filters.status);
    }

    if (filters?.generated_by) {
      query += ` AND generated_by = $${paramIndex++}`;
      values.push(filters.generated_by);
    }

    query += ` ORDER BY generated_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }
}
