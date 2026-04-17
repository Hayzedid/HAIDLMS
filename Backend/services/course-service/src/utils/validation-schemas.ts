import { z } from 'zod';

// ========================================
// SCORM VALIDATION SCHEMAS
// ========================================

export const SCORMPackageSchema = z.object({
  package_identifier: z.string().min(1).max(255),
  package_title: z.string().min(1).max(500),
  package_description: z.string().max(2000).optional(),
  scorm_version: z.enum(['1.2', '2004_3rd', '2004_4th']),
  manifest_file_path: z.string().min(1).max(1000),
  package_file_path: z.string().min(1).max(1000),
  storage_path: z.string().min(1).max(1000),
  launch_url: z.string().url().max(1000),
  course_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
});

export const SCORMAttemptSchema = z.object({
  package_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export const SCORMCMIDataSchema = z.object({
  cmi_core_lesson_status: z.enum(['not_attempted', 'incomplete', 'completed', 'passed', 'failed', 'browsed']).optional(),
  cmi_core_score_raw: z.number().min(0).max(100).optional(),
  cmi_core_lesson_location: z.string().max(255).optional(),
  cmi_suspend_data: z.string().max(65535).optional(),
  cmi_core_session_time: z.number().min(0).optional(),
});

// ========================================
// LTI VALIDATION SCHEMAS
// ========================================

export const LTIConsumerSchema = z.object({
  consumer_key: z.string().min(1).max(255),
  consumer_name: z.string().min(1).max(255),
  consumer_description: z.string().max(2000).optional(),
  consumer_secret: z.string().min(16).max(500),
  lti_version: z.enum(['1.1', '1.3']),
  platform_id: z.string().max(500).optional(),
  client_id: z.string().max(500).optional(),
});

export const LTIResourceLinkSchema = z.object({
  tool_consumer_id: z.string().uuid(),
  resource_link_id: z.string().min(1).max(255),
  resource_link_title: z.string().max(500).optional(),
  course_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  context_id: z.string().max(255).optional(),
});

export const LTILaunchSchema = z.object({
  resource_link_id: z.string().uuid(),
  tool_consumer_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  lti_user_id: z.string().min(1).max(255),
  message_type: z.enum(['basic-lti-launch-request', 'ContentItemSelectionRequest', 'LtiDeepLinkingRequest']),
  roles: z.array(z.string()),
  context_id: z.string().max(255).optional(),
});

export const LTIGradeSchema = z.object({
  launch_id: z.string().uuid().optional(),
  resource_link_id: z.string().uuid(),
  user_id: z.string().uuid(),
  result_sourcedid: z.string().min(1).max(500),
  result_score: z.number().min(0).max(1),
});

// ========================================
// xAPI VALIDATION SCHEMAS
// ========================================

export const XAPIStatementSchema = z.object({
  statement_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  verb: z.enum(['attempted', 'completed', 'passed', 'failed', 'answered', 'experienced', 'interacted', 'attended', 'scored', 'progressed']),
  verb_id: z.string().url(),
  object_id: z.string().url().max(1000),
  object_type: z.string().max(50).optional(),
  result_success: z.boolean().optional(),
  result_score_scaled: z.number().min(0).max(1).optional(),
  course_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
  full_statement: z.record(z.any()),
});

export const XAPIStateSchema = z.object({
  activity_id: z.string().url().max(1000),
  agent_id: z.string().uuid(),
  state_id: z.string().min(1).max(255),
  registration: z.string().uuid().optional(),
  state_content: z.record(z.any()),
});

// ========================================
// CONTENT EXPORT VALIDATION SCHEMAS
// ========================================

export const ContentExportSchema = z.object({
  content_type: z.string().min(1).max(100),
  content_id: z.string().uuid(),
  export_format: z.enum(['scorm_1.2', 'scorm_2004', 'xapi', 'common_cartridge']),
  generated_by: z.string().uuid().optional(),
});

// ========================================
// PRIVACY COMPLIANCE VALIDATION SCHEMAS
// ========================================

export const ConsentSchema = z.object({
  user_id: z.string().uuid(),
  consent_type: z.string().min(1).max(100),
  consent_version: z.string().min(1).max(50),
  consent_purpose: z.enum(['service_provision', 'analytics', 'marketing', 'personalization', 'security', 'legal_obligation', 'legitimate_interest']),
  ip_address: z.string().ip().optional(),
});

export const PrivacyRequestSchema = z.object({
  user_id: z.string().uuid(),
  requester_email: z.string().email().max(255),
  request_type: z.enum(['data_access', 'data_portability', 'data_erasure', 'data_rectification', 'processing_restriction', 'objection']),
  request_description: z.string().max(2000).optional(),
  data_categories: z.array(z.enum(['personal_identity', 'contact_info', 'account_data', 'educational_data', 'financial_data', 'behavioral_data', 'technical_data', 'communication_data'])).optional(),
});

export const RetentionPolicySchema = z.object({
  policy_name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  data_category: z.enum(['personal_identity', 'contact_info', 'account_data', 'educational_data', 'financial_data', 'behavioral_data', 'technical_data', 'communication_data']),
  table_name: z.string().max(255).optional(),
  retention_period_days: z.number().int().min(1).max(3650),
  legal_basis: z.string().max(100).optional(),
  deletion_method: z.enum(['hard_delete', 'anonymize', 'archive']).optional(),
});

// ========================================
// BLOCKCHAIN VALIDATION SCHEMAS
// ========================================

export const BlockchainWalletSchema = z.object({
  user_id: z.string().uuid(),
  wallet_address: z.string().min(26).max(255),
  blockchain_network: z.enum(['ethereum', 'polygon', 'binance_smart_chain', 'solana', 'avalanche']),
});

export const VerifiableCredentialSchema = z.object({
  user_id: z.string().uuid(),
  credential_type: z.enum(['certificate', 'badge', 'diploma', 'transcript', 'skill_verification']),
  credential_name: z.string().min(1).max(255),
  course_id: z.string().uuid().optional(),
  blockchain_network: z.enum(['ethereum', 'polygon', 'binance_smart_chain', 'solana', 'avalanche']).optional(),
});

export const NFTCertificateSchema = z.object({
  certificate_id: z.string().uuid(),
  blockchain_network: z.enum(['ethereum', 'polygon', 'binance_smart_chain', 'solana', 'avalanche']),
  contract_address: z.string().min(26).max(255),
  token_id: z.string().min(1).max(255),
  nft_name: z.string().min(1).max(255),
});

// ========================================
// ADAPTIVE LEARNING VALIDATION SCHEMAS
// ========================================

export const KnowledgeConceptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  cognitive_level: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
});

export const MasteryUpdateSchema = z.object({
  user_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  performance_score: z.number().min(0).max(1),
});

export const LearningPathSchema = z.object({
  user_id: z.string().uuid(),
  target_concept_id: z.string().uuid(),
});

// ========================================
// VIDEO PROCESSING VALIDATION SCHEMAS
// ========================================

export const VideoUploadSchema = z.object({
  video_title: z.string().min(1).max(500),
  original_filename: z.string().min(1).max(500),
  file_size: z.number().int().min(1).max(10737418240), // 10GB max
  storage_path: z.string().min(1).max(1000),
  course_id: z.string().uuid().optional(),
  lesson_id: z.string().uuid().optional(),
});

export const TranscodingJobSchema = z.object({
  video_id: z.string().uuid(),
  quality: z.enum(['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'audio_only']),
  target_bitrate: z.number().int().min(128).max(50000),
});

export const SubtitleSchema = z.object({
  video_id: z.string().uuid(),
  language_code: z.string().length(2),
  file_path: z.string().min(1).max(1000),
  subtitle_content: z.string().min(1),
  source: z.enum(['manual', 'auto_generated', 'imported', 'ai_translated']).optional(),
});

// ========================================
// MOBILE SYNC VALIDATION SCHEMAS
// ========================================

export const MobileDeviceSchema = z.object({
  user_id: z.string().uuid(),
  device_id: z.string().min(1).max(255),
  device_name: z.string().max(255).optional(),
  device_platform: z.enum(['ios', 'android', 'web', 'desktop']),
  push_token: z.string().max(500).optional(),
});

export const SyncItemSchema = z.object({
  device_id: z.string().uuid(),
  user_id: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete', 'bulk']),
  entity_type: z.string().min(1).max(100),
  entity_id: z.string().uuid(),
  data_payload: z.record(z.any()),
  client_version: z.number().int().min(0),
});

export const PushNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1000),
  action_type: z.string().max(50).optional(),
});

// ========================================
// PROCTORING VALIDATION SCHEMAS
// ========================================

export const ProctoringSessionSchema = z.object({
  assessment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_token: z.string().min(16).max(255),
  proctoring_mode: z.enum(['live', 'recorded', 'ai_automated', 'hybrid', 'no_proctoring']),
  scheduled_start_time: z.string().datetime(),
  scheduled_end_time: z.string().datetime(),
});

export const ViolationSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  violation_type: z.enum(['multiple_faces', 'no_face', 'face_not_recognized', 'looking_away', 'suspicious_audio', 'tab_switch', 'window_switch', 'prohibited_app', 'external_monitor', 'mobile_device_detected', 'unauthorized_person', 'screen_sharing_stopped', 'browser_exit', 'copy_paste', 'suspicious_behavior']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  snapshot_url: z.string().url().max(1000).optional(),
  violation_description: z.string().max(2000).optional(),
});

export const PlagiarismCheckSchema = z.object({
  submission_id: z.string().uuid(),
  user_id: z.string().uuid(),
  assessment_id: z.string().uuid(),
  content_text: z.string().min(1),
});

export const IdentityVerificationSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  verification_method: z.enum(['face_match', 'id_document', 'knowledge_based', 'biometric', 'multi_factor']),
  face_photo_url: z.string().url().max(1000).optional(),
});
