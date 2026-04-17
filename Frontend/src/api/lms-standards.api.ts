import apiClient from './client';

export interface SCORMPackage {
  id: string;
  package_identifier: string;
  package_title: string;
  package_description?: string;
  scorm_version: '1.2' | '2004_3rd' | '2004_4th';
  manifest_file_path: string;
  package_file_path: string;
  storage_path: string;
  launch_url: string;
  course_id?: string;
  lesson_id?: string;
  created_by?: string;
  is_validated: boolean;
  created_at: string;
}

export interface SCORMAttempt {
  id: string;
  package_id: string;
  user_id: string;
  attempt_number: number;
  cmi_core_lesson_status?: string;
  cmi_core_score_raw?: number;
  cmi_core_lesson_location?: string;
  cmi_suspend_data?: string;
  cmi_core_session_time?: number;
  started_at: string;
  completed_at?: string;
}

export interface LTIConsumer {
  id: string;
  consumer_key: string;
  consumer_name: string;
  consumer_description?: string;
  lti_version: '1.1' | '1.3';
  platform_id?: string;
  client_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface LTIGrade {
  id: string;
  launch_id?: string;
  resource_link_id: string;
  user_id: string;
  result_sourcedid: string;
  result_score: number;
  passback_status?: string;
  created_at: string;
}

export interface XAPIStatement {
  id: string;
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
  stored_at: string;
}

export interface XAPILearnerProfile {
  actor_id: string;
  profile: {
    total_statements: number;
    unique_verbs: number;
    successful_attempts: number;
    failed_attempts: number;
    average_score: number;
    first_activity: string;
    last_activity: string;
    total_hours: number;
  };
  generated_at: string;
}

export interface ContentExport {
  id: string;
  content_type: string;
  content_id: string;
  export_format: 'scorm_1.2' | 'scorm_2004' | 'xapi' | 'common_cartridge';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  export_file_path?: string;
  generated_by?: string;
  created_at: string;
  completed_at?: string;
}

export const lmsStandardsApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{
      status: string;
      service: string;
      timestamp: string;
      features: any;
    }>('/lms-standards/health'),

  // SCORM Packages
  createSCORMPackage: (data: {
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
  }) =>
    apiClient.post<{ id: string; message: string }>('/lms-standards/scorm/packages', data),

  getSCORMPackageById: (packageId: string) =>
    apiClient.get<SCORMPackage>(`/lms-standards/scorm/packages/${packageId}`),

  validateSCORMPackage: (packageId: string) =>
    apiClient.post<{
      package_id: string;
      is_valid: boolean;
      errors: string[];
      validated_at: string;
    }>(`/lms-standards/scorm/packages/${packageId}/validate`),

  // SCORM Attempts
  createSCORMAttempt: (data: {
    package_id: string;
    user_id: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/lms-standards/scorm/attempts', data),

  updateSCORMAttempt: (attemptId: string, data: {
    cmi_core_lesson_status?: string;
    cmi_core_score_raw?: number;
    cmi_core_lesson_location?: string;
    cmi_suspend_data?: string;
    cmi_core_session_time?: number;
  }) =>
    apiClient.put<{ message: string; attempt_id: string }>(
      `/lms-standards/scorm/attempts/${attemptId}`,
      data
    ),

  getSCORMAttemptProgress: (userId: string, packageId: string) =>
    apiClient.get<{
      completion_percentage: number;
      cmi_core_lesson_status: string;
      attempt_number: number;
    }>('/lms-standards/scorm/attempts/progress', {
      params: { user_id: userId, package_id: packageId }
    }),

  // LTI Consumers
  createLTIConsumer: (data: {
    consumer_key: string;
    consumer_name: string;
    consumer_description?: string;
    consumer_secret: string;
    lti_version: string;
    platform_id?: string;
    client_id?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>('/lms-standards/lti/consumers', data),

  validateLTIRequest: (data: {
    consumer_key: string;
    oauth_signature: string;
  }) =>
    apiClient.post<{
      valid: boolean;
      consumer_key: string;
      validated_at: string;
    }>('/lms-standards/lti/validate', data),

  // LTI Grades
  recordLTIGrade: (data: {
    launch_id?: string;
    resource_link_id: string;
    user_id: string;
    result_sourcedid: string;
    result_score: number;
  }) =>
    apiClient.post<{ id: string; message: string }>('/lms-standards/lti/grades', data),

  // xAPI Statements
  recordXAPIStatement: (data: {
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
  }) =>
    apiClient.post<{ id: string; message: string }>('/lms-standards/xapi/statements', data),

  getXAPILearnerProfile: (actorId: string) =>
    apiClient.get<XAPILearnerProfile>(`/lms-standards/xapi/learner-profile/${actorId}`),

  // Content Export
  createContentExport: (data: {
    content_type: string;
    content_id: string;
    export_format: string;
    generated_by?: string;
  }) =>
    apiClient.post<{ id: string; status: string; message: string }>(
      '/lms-standards/exports',
      data
    ),

  updateContentExportProgress: (exportId: string, progressPercent: number, status?: string) =>
    apiClient.put<{ message: string; export_id: string }>(
      `/lms-standards/exports/${exportId}/progress`,
      { progress_percent: progressPercent, status }
    ),
};
