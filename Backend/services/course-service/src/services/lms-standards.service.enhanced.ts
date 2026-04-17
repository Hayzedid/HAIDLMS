import { Pool, PoolClient } from 'pg';
import {
  SCORMPackageSchema,
  SCORMAttemptSchema,
  SCORMCMIDataSchema,
  LTIConsumerSchema,
  LTIResourceLinkSchema,
  LTILaunchSchema,
  LTIGradeSchema,
  XAPIStatementSchema,
  XAPIStateSchema,
  ContentExportSchema
} from '../utils/validation-schemas';
import { NotFoundError, ValidationError, DatabaseError, ConflictError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('LMSStandardsService');

export class LMSStandardsServiceEnhanced {
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
  // SCORM PACKAGES - ENHANCED
  // ========================================

  async createSCORMPackage(data: any): Promise<string> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedData = SCORMPackageSchema.parse(data);
      logger.info('Creating SCORM package', { package_identifier: validatedData.package_identifier });

      // Check for duplicate package identifier
      const existingPackage = await this.pool.query(
        'SELECT id FROM scorm_packages WHERE package_identifier = $1',
        [validatedData.package_identifier]
      );

      if (existingPackage.rows.length > 0) {
        throw new ConflictError(`SCORM package with identifier '${validatedData.package_identifier}' already exists`);
      }

      const query = `
        INSERT INTO scorm_packages (
          package_identifier, package_title, package_description,
          scorm_version, manifest_file_path, package_file_path,
          storage_path, launch_url, course_id, lesson_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, package_identifier, package_title
      `;

      const result = await this.pool.query(query, [
        validatedData.package_identifier,
        validatedData.package_title,
        validatedData.package_description || null,
        validatedData.scorm_version,
        validatedData.manifest_file_path,
        validatedData.package_file_path,
        validatedData.storage_path,
        validatedData.launch_url,
        validatedData.course_id || null,
        validatedData.lesson_id || null,
        validatedData.created_by || null
      ]);

      const duration = Date.now() - startTime;
      logger.info('SCORM package created successfully', {
        package_id: result.rows[0].id,
        duration: `${duration}ms`
      });

      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create SCORM package', error, { package_identifier: data.package_identifier });
      throw error;
    }
  }

  async getSCORMPackageById(package_id: string): Promise<any> {
    try {
      logger.debug('Fetching SCORM package', { package_id });

      const result = await this.pool.query(
        'SELECT * FROM scorm_packages WHERE id = $1',
        [package_id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('SCORM package', package_id);
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch SCORM package', error, { package_id });
      throw error;
    }
  }

  async validateSCORMPackage(package_id: string): Promise<{ is_valid: boolean; errors: string[] }> {
    try {
      logger.info('Validating SCORM package', { package_id });

      const pkg = await this.getSCORMPackageById(package_id);
      const errors: string[] = [];

      // Check if manifest file exists (would integrate with storage service)
      if (!pkg.manifest_file_path) {
        errors.push('Manifest file path is missing');
      }

      // Check if launch URL is accessible
      if (!pkg.launch_url) {
        errors.push('Launch URL is missing');
      }

      // Validate SCORM version specific requirements
      if (pkg.scorm_version === '2004_4th' && !pkg.organizations) {
        errors.push('SCORM 2004 4th Edition requires organizations structure');
      }

      const is_valid = errors.length === 0;

      // Update validation status in database
      await this.pool.query(
        'UPDATE scorm_packages SET is_validated = $1, validation_errors = $2, updated_at = NOW() WHERE id = $3',
        [is_valid, JSON.stringify(errors), package_id]
      );

      logger.info('SCORM package validation complete', { package_id, is_valid, error_count: errors.length });

      return { is_valid, errors };
    } catch (error: any) {
      logger.error('Failed to validate SCORM package', error, { package_id });
      throw error;
    }
  }

  // ========================================
  // SCORM ATTEMPTS - ENHANCED
  // ========================================

  async createSCORMAttempt(data: any): Promise<string> {
    try {
      const validatedData = SCORMAttemptSchema.parse(data);
      logger.info('Creating SCORM attempt', validatedData);

      // Verify package exists
      await this.getSCORMPackageById(validatedData.package_id);

      const result = await this.pool.query(
        'SELECT create_scorm_attempt($1, $2) as attempt_id',
        [validatedData.package_id, validatedData.user_id]
      );

      logger.info('SCORM attempt created', { attempt_id: result.rows[0].attempt_id });
      return result.rows[0].attempt_id;
    } catch (error: any) {
      logger.error('Failed to create SCORM attempt', error, data);
      throw error;
    }
  }

  async updateSCORMAttemptWithValidation(attempt_id: string, cmi_data: any): Promise<void> {
    try {
      const validatedData = SCORMCMIDataSchema.parse(cmi_data);
      logger.debug('Updating SCORM attempt', { attempt_id, fields: Object.keys(validatedData) });

      // Use transaction for consistency
      await this.withTransaction(async (client) => {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (validatedData.cmi_core_lesson_status) {
          updates.push(`cmi_core_lesson_status = $${paramIndex++}`);
          values.push(validatedData.cmi_core_lesson_status);
        }

        if (validatedData.cmi_core_score_raw !== undefined) {
          updates.push(`cmi_core_score_raw = $${paramIndex++}`);
          values.push(validatedData.cmi_core_score_raw);

          // Auto-calculate progress based on score
          const progressMeasure = validatedData.cmi_core_score_raw / 100;
          updates.push(`progress_measure = $${paramIndex++}`);
          values.push(progressMeasure);
        }

        if (validatedData.cmi_core_lesson_location) {
          updates.push(`cmi_core_lesson_location = $${paramIndex++}`);
          values.push(validatedData.cmi_core_lesson_location);
        }

        if (validatedData.cmi_suspend_data) {
          updates.push(`cmi_suspend_data = $${paramIndex++}`);
          values.push(validatedData.cmi_suspend_data);
        }

        if (validatedData.cmi_core_session_time !== undefined) {
          updates.push(`cmi_core_session_time = $${paramIndex++}`);
          values.push(validatedData.cmi_core_session_time);

          // Update total time
          updates.push(`cmi_core_total_time = COALESCE(cmi_core_total_time, 0) + $${paramIndex - 1}`);
        }

        if (updates.length === 0) {
          logger.warn('No valid CMI data to update', { attempt_id });
          return;
        }

        updates.push(`updated_at = NOW()`, `last_access_at = NOW()`);
        values.push(attempt_id);

        const query = `UPDATE scorm_attempts SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
        await client.query(query, values);
      });

      logger.info('SCORM attempt updated successfully', { attempt_id });
    } catch (error: any) {
      logger.error('Failed to update SCORM attempt', error, { attempt_id });
      throw error;
    }
  }

  async getSCORMAttemptProgress(user_id: string, package_id: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT
          sa.*,
          sp.package_title,
          sp.duration_estimate,
          CASE
            WHEN sa.cmi_core_lesson_status IN ('completed', 'passed') THEN 100
            WHEN sa.progress_measure IS NOT NULL THEN sa.progress_measure * 100
            ELSE (sa.cmi_core_total_time::NUMERIC / NULLIF(sp.duration_estimate * 60, 0)) * 100
          END as completion_percentage
        FROM scorm_attempts sa
        JOIN scorm_packages sp ON sa.package_id = sp.id
        WHERE sa.user_id = $1 AND sa.package_id = $2
        ORDER BY sa.attempt_number DESC
        LIMIT 1
      `, [user_id, package_id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('SCORM attempt for user and package');
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch SCORM attempt progress', error, { user_id, package_id });
      throw error;
    }
  }

  // ========================================
  // LTI CONSUMERS - ENHANCED
  // ========================================

  async createLTIConsumer(data: any): Promise<string> {
    try {
      const validatedData = LTIConsumerSchema.parse(data);
      logger.info('Creating LTI consumer', { consumer_key: validatedData.consumer_key });

      // Check for duplicate consumer key
      const existing = await this.pool.query(
        'SELECT id FROM lti_tool_consumers WHERE consumer_key = $1',
        [validatedData.consumer_key]
      );

      if (existing.rows.length > 0) {
        throw new ConflictError(`LTI consumer with key '${validatedData.consumer_key}' already exists`);
      }

      // In production, encrypt the consumer_secret before storing
      const encryptedSecret = validatedData.consumer_secret; // TODO: Implement encryption

      const query = `
        INSERT INTO lti_tool_consumers (
          consumer_key, consumer_name, consumer_description,
          consumer_secret, lti_version, platform_id, client_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, consumer_key, consumer_name
      `;

      const result = await this.pool.query(query, [
        validatedData.consumer_key,
        validatedData.consumer_name,
        validatedData.consumer_description || null,
        encryptedSecret,
        validatedData.lti_version,
        validatedData.platform_id || null,
        validatedData.client_id || null
      ]);

      logger.info('LTI consumer created', { consumer_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create LTI consumer', error);
      throw error;
    }
  }

  async validateLTIRequest(consumer_key: string, oauth_signature: string): Promise<boolean> {
    try {
      logger.debug('Validating LTI request', { consumer_key });

      const consumer = await this.pool.query(
        'SELECT consumer_secret, is_enabled FROM lti_tool_consumers WHERE consumer_key = $1',
        [consumer_key]
      );

      if (consumer.rows.length === 0) {
        logger.warn('LTI consumer not found', { consumer_key });
        return false;
      }

      if (!consumer.rows[0].is_enabled) {
        logger.warn('LTI consumer is disabled', { consumer_key });
        return false;
      }

      // TODO: Implement actual OAuth 1.0 signature validation
      // This is a placeholder - in production, use a library like 'oauth-sign'
      const isValid = true; // oauth_signature validation logic here

      logger.info('LTI request validation complete', { consumer_key, isValid });
      return isValid;
    } catch (error: any) {
      logger.error('Failed to validate LTI request', error, { consumer_key });
      throw error;
    }
  }

  // ========================================
  // LTI GRADES - ENHANCED WITH PASSBACK
  // ========================================

  async recordLTIGradeWithPassback(data: any): Promise<string> {
    try {
      const validatedData = LTIGradeSchema.parse(data);
      logger.info('Recording LTI grade', { user_id: validatedData.user_id, score: validatedData.result_score });

      return await this.withTransaction(async (client) => {
        // Insert grade
        const result = await client.query(`
          INSERT INTO lti_grades (
            launch_id, resource_link_id, user_id, result_sourcedid, result_score
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [
          validatedData.launch_id || null,
          validatedData.resource_link_id,
          validatedData.user_id,
          validatedData.result_sourcedid,
          validatedData.result_score
        ]);

        const gradeId = result.rows[0].id;

        // Queue grade passback (in production, use actual queue system)
        logger.info('LTI grade passback queued', { grade_id: gradeId });

        return gradeId;
      });
    } catch (error: any) {
      logger.error('Failed to record LTI grade', error);
      throw error;
    }
  }

  // ========================================
  // xAPI STATEMENTS - ENHANCED
  // ========================================

  async recordXAPIStatementWithValidation(data: any): Promise<string> {
    try {
      const validatedData = XAPIStatementSchema.parse(data);
      logger.info('Recording xAPI statement', {
        statement_id: validatedData.statement_id,
        verb: validatedData.verb
      });

      // Check for duplicate statement_id
      const existing = await this.pool.query(
        'SELECT id FROM xapi_statements WHERE statement_id = $1',
        [validatedData.statement_id]
      );

      if (existing.rows.length > 0) {
        logger.warn('Duplicate xAPI statement ignored', { statement_id: validatedData.statement_id });
        return existing.rows[0].id;
      }

      const result = await this.pool.query(
        'SELECT record_xapi_statement($1, $2, $3, $4, $5) as id',
        [
          validatedData.statement_id,
          validatedData.actor_id,
          validatedData.verb,
          validatedData.object_id,
          JSON.stringify(validatedData.full_statement)
        ]
      );

      logger.info('xAPI statement recorded', { id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to record xAPI statement', error);
      throw error;
    }
  }

  async getXAPILearnerProfile(actor_id: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT
          actor_id,
          COUNT(*) as total_statements,
          COUNT(DISTINCT verb) as unique_verbs,
          COUNT(*) FILTER (WHERE result_success = true) as successful_attempts,
          COUNT(*) FILTER (WHERE result_success = false) as failed_attempts,
          AVG(result_score_scaled) as average_score,
          MIN(statement_timestamp) as first_activity,
          MAX(statement_timestamp) as last_activity,
          EXTRACT(EPOCH FROM (MAX(statement_timestamp) - MIN(statement_timestamp))) / 3600 as total_hours
        FROM xapi_statements
        WHERE actor_id = $1
        GROUP BY actor_id
      `, [actor_id]);

      if (result.rows.length === 0) {
        return {
          actor_id,
          total_statements: 0,
          unique_verbs: 0,
          successful_attempts: 0,
          failed_attempts: 0,
          average_score: null,
          first_activity: null,
          last_activity: null,
          total_hours: 0
        };
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to fetch xAPI learner profile', error, { actor_id });
      throw error;
    }
  }

  // ========================================
  // CONTENT EXPORT - ENHANCED
  // ========================================

  async createContentExportJob(data: any): Promise<string> {
    try {
      const validatedData = ContentExportSchema.parse(data);
      logger.info('Creating content export job', {
        content_type: validatedData.content_type,
        export_format: validatedData.export_format
      });

      const result = await this.pool.query(`
        INSERT INTO content_exports (
          content_type, content_id, export_format, generated_by, status
        ) VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id
      `, [
        validatedData.content_type,
        validatedData.content_id,
        validatedData.export_format,
        validatedData.generated_by || null
      ]);

      logger.info('Content export job created', { export_id: result.rows[0].id });
      return result.rows[0].id;
    } catch (error: any) {
      logger.error('Failed to create content export job', error);
      throw error;
    }
  }

  async updateExportProgress(export_id: string, progress_percent: number, status?: string): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE content_exports
        SET progress_percent = $1,
            status = COALESCE($2, status),
            updated_at = NOW()
        WHERE id = $3
      `, [progress_percent, status || null, export_id]);

      logger.debug('Export progress updated', { export_id, progress_percent });
    } catch (error: any) {
      logger.error('Failed to update export progress', error, { export_id });
      throw error;
    }
  }
}
