import pool from '../db/pool';

export class BackupService {
  // BACKUP CONFIGURATIONS
  async createBackupConfiguration(data: any): Promise<any> {
    const {
      name, description, backupType, frequency, scheduleCron, includeTables,
      excludeTables, includeData, includeSchema, storageProvider, storageLocation,
      storageCredentials, compressionEnabled, compressionAlgorithm, encryptionEnabled,
      encryptionAlgorithm, retentionDays, maxBackups, deleteOldBackups, autoVerify,
      verifyChecksum, notifyOnSuccess, notifyOnFailure, notificationEmails,
      isEnabled, createdBy
    } = data;

    const result = await pool.query(
      `INSERT INTO backup_configurations (
        name, description, backup_type, frequency, schedule_cron, include_tables,
        exclude_tables, include_data, include_schema, storage_provider, storage_location,
        storage_credentials, compression_enabled, compression_algorithm, encryption_enabled,
        encryption_algorithm, retention_days, max_backups, delete_old_backups, auto_verify,
        verify_checksum, notify_on_success, notify_on_failure, notification_emails,
        is_enabled, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *`,
      [
        name, description, backupType, frequency, scheduleCron, includeTables,
        excludeTables, includeData, includeSchema, storageProvider, storageLocation,
        storageCredentials, compressionEnabled, compressionAlgorithm, encryptionEnabled,
        encryptionAlgorithm, retentionDays, maxBackups, deleteOldBackups, autoVerify,
        verifyChecksum, notifyOnSuccess, notifyOnFailure, notificationEmails,
        isEnabled, createdBy
      ]
    );
    return result.rows[0];
  }

  async listBackupConfigurations(activeOnly: boolean = false): Promise<any[]> {
    let query = `SELECT * FROM backup_configurations WHERE 1=1`;
    if (activeOnly) query += ` AND is_enabled = true`;
    query += ` ORDER BY name`;

    const result = await pool.query(query);
    return result.rows;
  }

  async getBackupConfiguration(configId: string): Promise<any> {
    const result = await pool.query(
      `SELECT * FROM backup_configurations WHERE id = $1`,
      [configId]
    );
    return result.rows[0];
  }

  async updateBackupConfiguration(configId: string, updates: any): Promise<any> {
    const {
      name, description, frequency, scheduleCron, isEnabled, retentionDays,
      maxBackups, notificationEmails
    } = updates;

    const result = await pool.query(
      `UPDATE backup_configurations SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        frequency = COALESCE($4, frequency),
        schedule_cron = COALESCE($5, schedule_cron),
        is_enabled = COALESCE($6, is_enabled),
        retention_days = COALESCE($7, retention_days),
        max_backups = COALESCE($8, max_backups),
        notification_emails = COALESCE($9, notification_emails),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [configId, name, description, frequency, scheduleCron, isEnabled, retentionDays, maxBackups, notificationEmails]
    );
    return result.rows[0];
  }

  async deleteBackupConfiguration(configId: string): Promise<void> {
    await pool.query(`DELETE FROM backup_configurations WHERE id = $1`, [configId]);
  }

  async calculateNextBackupRun(configId: string): Promise<string> {
    const result = await pool.query(
      `SELECT calculate_next_backup_run($1) as next_run`,
      [configId]
    );
    return result.rows[0]?.next_run;
  }

  // BACKUP JOBS
  async createBackupJob(data: any): Promise<any> {
    const {
      configId, jobName, backupType, storageProvider, storageLocation, tablesIncluded
    } = data;

    const result = await pool.query(
      `INSERT INTO backup_jobs (
        config_id, job_name, backup_type, status, storage_provider, storage_location,
        tables_included, started_at
      ) VALUES ($1, $2, $3, 'in_progress', $4, $5, $6, NOW())
      RETURNING *`,
      [configId, jobName, backupType, storageProvider, storageLocation, tablesIncluded]
    );
    return result.rows[0];
  }

  async listBackupJobs(filters: any = {}): Promise<any[]> {
    const { configId, status, startDate, endDate, limit = 100 } = filters;
    let query = `SELECT * FROM backup_jobs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (configId) {
      query += ` AND config_id = $${paramIndex}`;
      params.push(configId);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getBackupJob(jobId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM backup_jobs WHERE id = $1`, [jobId]);
    return result.rows[0];
  }

  async updateBackupJob(jobId: string, updates: any): Promise<any> {
    const {
      status, completedAt, filePath, fileSizeBytes, checksum, compressionRatio,
      isEncrypted, progressPercentage, currentTable, rowsProcessed, totalRows,
      errorMessage, errorDetails
    } = updates;

    const result = await pool.query(
      `UPDATE backup_jobs SET
        status = COALESCE($2, status),
        completed_at = COALESCE($3, completed_at),
        file_path = COALESCE($4, file_path),
        file_size_bytes = COALESCE($5, file_size_bytes),
        checksum = COALESCE($6, checksum),
        compression_ratio = COALESCE($7, compression_ratio),
        is_encrypted = COALESCE($8, is_encrypted),
        progress_percentage = COALESCE($9, progress_percentage),
        current_table = COALESCE($10, current_table),
        rows_processed = COALESCE($11, rows_processed),
        total_rows = COALESCE($12, total_rows),
        error_message = COALESCE($13, error_message),
        error_details = COALESCE($14, error_details)
      WHERE id = $1
      RETURNING *`,
      [
        jobId, status, completedAt, filePath, fileSizeBytes, checksum, compressionRatio,
        isEncrypted, progressPercentage, currentTable, rowsProcessed, totalRows,
        errorMessage, errorDetails
      ]
    );
    return result.rows[0];
  }

  async retryBackupJob(jobId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE backup_jobs SET
        status = 'pending',
        retry_count = retry_count + 1,
        error_message = NULL,
        error_details = NULL
      WHERE id = $1 AND retry_count < max_retries
      RETURNING *`,
      [jobId]
    );
    return result.rows[0];
  }

  async getBackupSummary(): Promise<any[]> {
    const result = await pool.query(`SELECT * FROM backup_summary`);
    return result.rows;
  }

  async getRecentBackups(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT * FROM recent_backups LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getBackupHealthStatus(): Promise<any> {
    const result = await pool.query(`SELECT * FROM backup_health_status`);
    return result.rows[0];
  }

  // RESTORE JOBS
  async createRestoreJob(data: any): Promise<any> {
    const {
      backupJobId, recoveryPointId, restoreName, restoreType, targetDatabase,
      targetSchema, overwriteExisting, tablesToRestore, restoreData, restoreSchema,
      restoreIndexes, approvalRequired, initiatedBy
    } = data;

    const result = await pool.query(
      `INSERT INTO restore_jobs (
        backup_job_id, recovery_point_id, restore_name, restore_type, status,
        target_database, target_schema, overwrite_existing, tables_to_restore,
        restore_data, restore_schema, restore_indexes, approval_required, initiated_by
      ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        backupJobId, recoveryPointId, restoreName, restoreType, targetDatabase,
        targetSchema, overwriteExisting, tablesToRestore, restoreData, restoreSchema,
        restoreIndexes, approvalRequired, initiatedBy
      ]
    );
    return result.rows[0];
  }

  async listRestoreJobs(filters: any = {}): Promise<any[]> {
    const { backupJobId, status, limit = 100 } = filters;
    let query = `SELECT * FROM restore_jobs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (backupJobId) {
      query += ` AND backup_job_id = $${paramIndex}`;
      params.push(backupJobId);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getRestoreJob(restoreId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM restore_jobs WHERE id = $1`, [restoreId]);
    return result.rows[0];
  }

  async updateRestoreJob(restoreId: string, updates: any): Promise<any> {
    const {
      status, startedAt, completedAt, progressPercentage, currentTable,
      rowsRestored, totalRows, validationPassed, errorMessage
    } = updates;

    const result = await pool.query(
      `UPDATE restore_jobs SET
        status = COALESCE($2, status),
        started_at = COALESCE($3, started_at),
        completed_at = COALESCE($4, completed_at),
        progress_percentage = COALESCE($5, progress_percentage),
        current_table = COALESCE($6, current_table),
        rows_restored = COALESCE($7, rows_restored),
        total_rows = COALESCE($8, total_rows),
        validation_passed = COALESCE($9, validation_passed),
        error_message = COALESCE($10, error_message)
      WHERE id = $1
      RETURNING *`,
      [
        restoreId, status, startedAt, completedAt, progressPercentage, currentTable,
        rowsRestored, totalRows, validationPassed, errorMessage
      ]
    );
    return result.rows[0];
  }

  async approveRestoreJob(restoreId: string, approvedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE restore_jobs SET
        approved_by = $2,
        approved_at = NOW(),
        status = 'pending'
      WHERE id = $1 AND approval_required = true
      RETURNING *`,
      [restoreId, approvedBy]
    );
    return result.rows[0];
  }

  // RECOVERY POINTS
  async createRecoveryPoint(data: any): Promise<any> {
    const {
      backupJobId, pointName, description, pointTimestamp, databaseState,
      transactionLogPosition, canRecoverToPoint, requiresBaseBackup,
      baseBackupId, createdBy
    } = data;

    const result = await pool.query(
      `INSERT INTO recovery_points (
        backup_job_id, point_name, description, point_timestamp, database_state,
        transaction_log_position, can_recover_to_point, requires_base_backup,
        base_backup_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        backupJobId, pointName, description, pointTimestamp, databaseState,
        transactionLogPosition, canRecoverToPoint, requiresBaseBackup,
        baseBackupId, createdBy
      ]
    );
    return result.rows[0];
  }

  async listRecoveryPoints(backupJobId?: string): Promise<any[]> {
    let query = `SELECT * FROM recovery_points WHERE is_valid = true`;
    const params: any[] = [];

    if (backupJobId) {
      query += ` AND backup_job_id = $1`;
      params.push(backupJobId);
    }

    query += ` ORDER BY point_timestamp DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getRecoveryPoint(pointId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM recovery_points WHERE id = $1`, [pointId]);
    return result.rows[0];
  }

  async testRecoveryPoint(pointId: string, testNotes: string): Promise<any> {
    const result = await pool.query(
      `UPDATE recovery_points SET
        last_tested_at = NOW(),
        test_success = true,
        test_notes = $2
      WHERE id = $1
      RETURNING *`,
      [pointId, testNotes]
    );
    return result.rows[0];
  }

  async invalidateRecoveryPoint(pointId: string, reason: string): Promise<any> {
    const result = await pool.query(
      `UPDATE recovery_points SET
        is_valid = false,
        invalidated_at = NOW(),
        invalidation_reason = $2
      WHERE id = $1
      RETURNING *`,
      [pointId, reason]
    );
    return result.rows[0];
  }

  // DISASTER RECOVERY PLANS
  async createDRPlan(data: any): Promise<any> {
    const {
      planName, description, version, recoveryTimeObjectiveHours, recoveryPointObjectiveHours,
      preRecoverySteps, recoverySteps, postRecoverySteps, rollbackSteps, requiredPersonnel,
      requiredSystems, backupConfigIds, testFrequency, runbookUrl, contactList,
      escalationMatrix, createdBy
    } = data;

    const result = await pool.query(
      `INSERT INTO disaster_recovery_plans (
        plan_name, description, version, recovery_time_objective_hours,
        recovery_point_objective_hours, pre_recovery_steps, recovery_steps,
        post_recovery_steps, rollback_steps, required_personnel, required_systems,
        backup_config_ids, test_frequency, runbook_url, contact_list,
        escalation_matrix, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        planName, description, version, recoveryTimeObjectiveHours, recoveryPointObjectiveHours,
        preRecoverySteps, recoverySteps, postRecoverySteps, rollbackSteps, requiredPersonnel,
        requiredSystems, backupConfigIds, testFrequency, runbookUrl, contactList,
        escalationMatrix, createdBy
      ]
    );
    return result.rows[0];
  }

  async listDRPlans(activeOnly: boolean = false): Promise<any[]> {
    let query = `SELECT * FROM disaster_recovery_plans WHERE 1=1`;
    if (activeOnly) query += ` AND is_active = true`;
    query += ` ORDER BY plan_name`;

    const result = await pool.query(query);
    return result.rows;
  }

  async getDRPlan(planId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM disaster_recovery_plans WHERE id = $1`, [planId]);
    return result.rows[0];
  }

  async updateDRPlan(planId: string, updates: any): Promise<any> {
    const { description, recoverySteps, testFrequency, isActive } = updates;

    const result = await pool.query(
      `UPDATE disaster_recovery_plans SET
        description = COALESCE($2, description),
        recovery_steps = COALESCE($3, recovery_steps),
        test_frequency = COALESCE($4, test_frequency),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [planId, description, recoverySteps, testFrequency, isActive]
    );
    return result.rows[0];
  }

  async approveDRPlan(planId: string, approvedBy: string): Promise<any> {
    const result = await pool.query(
      `UPDATE disaster_recovery_plans SET
        is_approved = true,
        approved_by = $2,
        approved_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [planId, approvedBy]
    );
    return result.rows[0];
  }

  // DR EXECUTIONS
  async createDRExecution(data: any): Promise<any> {
    const {
      planId, executionName, executionType, incidentType, incidentDescription,
      incidentDetectedAt, totalSteps, incidentCommander
    } = data;

    const result = await pool.query(
      `INSERT INTO dr_executions (
        plan_id, execution_name, execution_type, status, incident_type,
        incident_description, incident_detected_at, started_at, total_steps,
        incident_commander
      ) VALUES ($1, $2, $3, 'in_progress', $4, $5, $6, NOW(), $7, $8)
      RETURNING *`,
      [
        planId, executionName, executionType, incidentType, incidentDescription,
        incidentDetectedAt, totalSteps, incidentCommander
      ]
    );
    return result.rows[0];
  }

  async updateDRExecution(executionId: string, updates: any): Promise<any> {
    const {
      status, completedAt, currentStep, stepDetails, success, dataRecovered,
      dataLossHours, lessonsLearned
    } = updates;

    const result = await pool.query(
      `UPDATE dr_executions SET
        status = COALESCE($2, status),
        completed_at = COALESCE($3, completed_at),
        current_step = COALESCE($4, current_step),
        step_details = COALESCE($5, step_details),
        success = COALESCE($6, success),
        data_recovered = COALESCE($7, data_recovered),
        data_loss_hours = COALESCE($8, data_loss_hours),
        lessons_learned = COALESCE($9, lessons_learned)
      WHERE id = $1
      RETURNING *`,
      [
        executionId, status, completedAt, currentStep, stepDetails, success,
        dataRecovered, dataLossHours, lessonsLearned
      ]
    );
    return result.rows[0];
  }

  async listDRExecutions(planId?: string): Promise<any[]> {
    let query = `SELECT * FROM dr_executions WHERE 1=1`;
    const params: any[] = [];

    if (planId) {
      query += ` AND plan_id = $1`;
      params.push(planId);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  // EXPORT JOBS
  async createExportJob(data: any): Promise<any> {
    const {
      exportName, exportFormat, tables, filters, includeRelationships,
      includeHeaders, delimiter, encoding, dateFormat, requestedBy
    } = data;

    const result = await pool.query(
      `INSERT INTO export_jobs (
        export_name, export_format, status, tables, filters, include_relationships,
        include_headers, delimiter, encoding, date_format, requested_by
      ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        exportName, exportFormat, tables, filters, includeRelationships,
        includeHeaders, delimiter, encoding, dateFormat, requestedBy
      ]
    );
    return result.rows[0];
  }

  async listExportJobs(requestedBy?: string): Promise<any[]> {
    let query = `SELECT * FROM export_jobs WHERE 1=1`;
    const params: any[] = [];

    if (requestedBy) {
      query += ` AND requested_by = $1`;
      params.push(requestedBy);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getExportJob(exportId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM export_jobs WHERE id = $1`, [exportId]);
    return result.rows[0];
  }

  async updateExportJob(exportId: string, updates: any): Promise<any> {
    const {
      status, startedAt, completedAt, filePath, fileSizeBytes, rowCount,
      downloadUrl, expiresAt, errorMessage
    } = updates;

    const result = await pool.query(
      `UPDATE export_jobs SET
        status = COALESCE($2, status),
        started_at = COALESCE($3, started_at),
        completed_at = COALESCE($4, completed_at),
        file_path = COALESCE($5, file_path),
        file_size_bytes = COALESCE($6, file_size_bytes),
        row_count = COALESCE($7, row_count),
        download_url = COALESCE($8, download_url),
        expires_at = COALESCE($9, expires_at),
        error_message = COALESCE($10, error_message)
      WHERE id = $1
      RETURNING *`,
      [
        exportId, status, startedAt, completedAt, filePath, fileSizeBytes,
        rowCount, downloadUrl, expiresAt, errorMessage
      ]
    );
    return result.rows[0];
  }

  // IMPORT JOBS
  async createImportJob(data: any): Promise<any> {
    const {
      importName, importFormat, sourceFilePath, sourceFileSizeBytes, targetTable,
      importMode, hasHeaders, delimiter, encoding, skipRows, columnMapping,
      validateBeforeImport, dryRun, continueOnError, requestedBy
    } = data;

    const result = await pool.query(
      `INSERT INTO import_jobs (
        import_name, import_format, status, source_file_path, source_file_size_bytes,
        target_table, import_mode, has_headers, delimiter, encoding, skip_rows,
        column_mapping, validate_before_import, dry_run, continue_on_error, requested_by
      ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        importName, importFormat, sourceFilePath, sourceFileSizeBytes, targetTable,
        importMode, hasHeaders, delimiter, encoding, skipRows, columnMapping,
        validateBeforeImport, dryRun, continueOnError, requestedBy
      ]
    );
    return result.rows[0];
  }

  async listImportJobs(requestedBy?: string): Promise<any[]> {
    let query = `SELECT * FROM import_jobs WHERE 1=1`;
    const params: any[] = [];

    if (requestedBy) {
      query += ` AND requested_by = $1`;
      params.push(requestedBy);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getImportJob(importId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM import_jobs WHERE id = $1`, [importId]);
    return result.rows[0];
  }

  async updateImportJob(importId: string, updates: any): Promise<any> {
    const {
      status, startedAt, completedAt, totalRows, processedRows, successfulRows,
      failedRows, skippedRows, validationErrors, errorMessage
    } = updates;

    const result = await pool.query(
      `UPDATE import_jobs SET
        status = COALESCE($2, status),
        started_at = COALESCE($3, started_at),
        completed_at = COALESCE($4, completed_at),
        total_rows = COALESCE($5, total_rows),
        processed_rows = COALESCE($6, processed_rows),
        successful_rows = COALESCE($7, successful_rows),
        failed_rows = COALESCE($8, failed_rows),
        skipped_rows = COALESCE($9, skipped_rows),
        validation_errors = COALESCE($10, validation_errors),
        error_message = COALESCE($11, error_message)
      WHERE id = $1
      RETURNING *`,
      [
        importId, status, startedAt, completedAt, totalRows, processedRows,
        successfulRows, failedRows, skippedRows, validationErrors, errorMessage
      ]
    );
    return result.rows[0];
  }

  // BACKUP VERIFICATION
  async createVerification(data: any): Promise<any> {
    const {
      backupJobId, verificationType, checksumValid, fileAccessible, metadataValid,
      canDecompress, canDecrypt, testRestorePerformed, testRestoreSuccess,
      testRestoreDurationSeconds, sampleTablesRestored, overallResult, issuesFound,
      recommendations, verifiedBy
    } = data;

    const result = await pool.query(
      `INSERT INTO backup_verifications (
        backup_job_id, verification_type, status, checksum_valid, file_accessible,
        metadata_valid, can_decompress, can_decrypt, test_restore_performed,
        test_restore_success, test_restore_duration_seconds, sample_tables_restored,
        overall_result, issues_found, recommendations, started_at, completed_at, verified_by
      ) VALUES ($1, $2, 'completed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), $15)
      RETURNING *`,
      [
        backupJobId, verificationType, checksumValid, fileAccessible, metadataValid,
        canDecompress, canDecrypt, testRestorePerformed, testRestoreSuccess,
        testRestoreDurationSeconds, sampleTablesRestored, overallResult, issuesFound,
        recommendations, verifiedBy
      ]
    );
    return result.rows[0];
  }

  async listVerifications(backupJobId?: string): Promise<any[]> {
    let query = `SELECT * FROM backup_verifications WHERE 1=1`;
    const params: any[] = [];

    if (backupJobId) {
      query += ` AND backup_job_id = $1`;
      params.push(backupJobId);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  // STORAGE LOCATIONS
  async createStorageLocation(data: any): Promise<any> {
    const {
      name, description, provider, endpointUrl, region, bucketName, pathPrefix,
      accessKey, secretKey, credentials, useSsl, port, timeoutSeconds,
      totalCapacityGb, createdBy
    } = data;

    const result = await pool.query(
      `INSERT INTO storage_locations (
        name, description, provider, endpoint_url, region, bucket_name, path_prefix,
        access_key, secret_key, credentials, use_ssl, port, timeout_seconds,
        total_capacity_gb, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        name, description, provider, endpointUrl, region, bucketName, pathPrefix,
        accessKey, secretKey, credentials, useSsl, port, timeoutSeconds,
        totalCapacityGb, createdBy
      ]
    );
    return result.rows[0];
  }

  async listStorageLocations(activeOnly: boolean = false): Promise<any[]> {
    let query = `SELECT * FROM storage_locations WHERE 1=1`;
    if (activeOnly) query += ` AND is_active = true`;
    query += ` ORDER BY name`;

    const result = await pool.query(query);
    return result.rows;
  }

  async getStorageLocation(locationId: string): Promise<any> {
    const result = await pool.query(`SELECT * FROM storage_locations WHERE id = $1`, [locationId]);
    return result.rows[0];
  }

  async updateStorageLocation(locationId: string, updates: any): Promise<any> {
    const { name, description, isActive, usedCapacityGb, healthStatus } = updates;

    const result = await pool.query(
      `UPDATE storage_locations SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active),
        used_capacity_gb = COALESCE($5, used_capacity_gb),
        health_status = COALESCE($6, health_status),
        last_health_check = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [locationId, name, description, isActive, usedCapacityGb, healthStatus]
    );
    return result.rows[0];
  }

  // UTILITY METHODS
  async cleanupOldBackups(configId: string): Promise<number> {
    const result = await pool.query(
      `WITH backups_to_delete AS (
        SELECT * FROM get_backups_for_cleanup($1)
      )
      DELETE FROM backup_jobs
      WHERE id IN (SELECT backup_job_id FROM backups_to_delete)
      RETURNING id`,
      [configId]
    );
    return result.rows.length;
  }

  async isBackupRestorable(backupId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT is_backup_restorable($1) as restorable`,
      [backupId]
    );
    return result.rows[0]?.restorable || false;
  }

  async getBackupAuditLog(filters: any = {}): Promise<any[]> {
    const { entityId, eventType, userId, startDate, endDate, limit = 100 } = filters;
    let query = `SELECT * FROM backup_audit_log WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (entityId) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }
    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }
    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export const backupService = new BackupService();
