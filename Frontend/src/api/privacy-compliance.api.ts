import apiClient from "./client";

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  consent_purpose:
    | "service_provision"
    | "analytics"
    | "marketing"
    | "personalization"
    | "security"
    | "legal_obligation"
    | "legitimate_interest";
  consent_status: "granted" | "withdrawn";
  granted_at: string;
  withdrawn_at?: string;
  ip_address?: string;
}

export interface PrivacyRequest {
  id: string;
  user_id: string;
  requester_email: string;
  request_type:
    | "data_access"
    | "data_portability"
    | "data_erasure"
    | "data_rectification"
    | "processing_restriction"
    | "objection";
  request_description?: string;
  data_categories?: string[];
  status: "pending" | "in_progress" | "completed" | "rejected";
  sla_days: number;
  assigned_to?: string;
  rejection_reason?: string;
  result_data?: any;
  created_at: string;
  resolved_at?: string;
}

export interface RetentionPolicy {
  id: string;
  policy_name: string;
  description?: string;
  data_category:
    | "personal_identity"
    | "contact_info"
    | "account_data"
    | "educational_data"
    | "financial_data"
    | "behavioral_data"
    | "technical_data"
    | "communication_data";
  table_name?: string;
  retention_period_days: number;
  legal_basis?: string;
  deletion_method: "hard_delete" | "anonymize" | "archive";
  is_active: boolean;
  created_at: string;
}

export interface DataDeletionLog {
  id: string;
  user_id?: string;
  user_email?: string;
  deletion_type: string;
  data_category?: string;
  table_name?: string;
  record_count?: number;
  deleted_by?: string;
  deleted_at: string;
}

export const privacyComplianceApi = {
  // Health check
  healthCheck: () =>
    apiClient.get<{
      status: "healthy" | "warning" | "critical";
      timestamp: string;
      metrics: {
        overdue_privacy_requests: number;
        active_consents: number;
        active_retention_policies: number;
        recent_unresolved_breaches: number;
      };
      alerts: string[];
    }>("/privacy/health"),

  // Consent Management
  grantConsent: (data: {
    user_id: string;
    consent_type: string;
    consent_version: string;
    consent_purpose: string;
    ip_address?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>(
      "/privacy/consent/grant",
      data,
    ),

  withdrawConsent: (userId: string, consentType: string) =>
    apiClient.post<{ message: string; count: number }>(
      "/privacy/consent/withdraw",
      {
        user_id: userId,
        consent_type: consentType,
      },
    ),

  getUserConsents: (userId: string, status?: string) =>
    apiClient.get<{ user_id: string; consents: UserConsent[]; count: number }>(
      `/privacy/consent/user/${userId}`,
      { params: { status } },
    ),

  checkConsent: (userId: string, purpose: string) =>
    apiClient.get<{
      user_id: string;
      purpose: string;
      has_consent: boolean;
      checked_at: string;
    }>("/privacy/consent/check", {
      params: { user_id: userId, purpose },
    }),

  // Privacy Requests (GDPR/CCPA)
  createPrivacyRequest: (data: {
    user_id: string;
    requester_email: string;
    request_type: string;
    request_description?: string;
    data_categories?: string[];
  }) =>
    apiClient.post<{ id: string; message: string; sla_days: number }>(
      "/privacy/requests",
      data,
    ),

  getPrivacyRequestById: (requestId: string) =>
    apiClient.get<PrivacyRequest>(`/privacy/requests/${requestId}`),

  updatePrivacyRequestStatus: (
    requestId: string,
    data: {
      status: string;
      assigned_to?: string;
      rejection_reason?: string;
      result_data?: any;
    },
  ) =>
    apiClient.put<{ message: string; request_id: string; status: string }>(
      `/privacy/requests/${requestId}/status`,
      data,
    ),

  getOverdueRequests: () =>
    apiClient.get<{
      overdue_requests: (PrivacyRequest & { days_overdue: number })[];
      count: number;
      alert_level: "none" | "high";
    }>("/privacy/requests/overdue"),

  // Data Retention
  createRetentionPolicy: (data: {
    policy_name: string;
    description?: string;
    data_category: string;
    table_name?: string;
    retention_period_days: number;
    legal_basis?: string;
    deletion_method?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>(
      "/privacy/retention/policies",
      data,
    ),

  executeRetentionPolicy: (policyId: string, executedBy?: string) =>
    apiClient.post<{
      message: string;
      policy_id: string;
      deleted_count: number;
      executed_at: string;
    }>(`/privacy/retention/policies/${policyId}/execute`, {
      executed_by: executedBy,
    }),

  getRetentionSummary: () =>
    apiClient.get<{
      summary: any[];
      policies: RetentionPolicy[];
      recommendations: string[];
    }>("/privacy/retention/summary"),

  // Data Deletion
  logDataDeletion: (data: {
    user_id?: string;
    user_email?: string;
    deletion_type: string;
    data_category?: string;
    table_name?: string;
    record_count?: number;
    deleted_by?: string;
  }) =>
    apiClient.post<{ id: string; message: string }>(
      "/privacy/deletion/log",
      data,
    ),

  // Data Anonymization
  anonymizeUserData: (userId: string, initiatedBy?: string) =>
    apiClient.post<{
      message: string;
      user_id: string;
      anonymized_at: string;
    }>(`/privacy/anonymize/${userId}`, {
      initiated_by: initiatedBy,
    }),

  // Convenience methods for GDPR flows
  exportPersonalData: () =>
    apiClient.get<any>("/privacy/user/export-data").then((r) => r.data),

  deleteAccount: (password: string) =>
    apiClient
      .post<{ message: string }>("/privacy/user/delete-account", { password })
      .then((r) => r.data),
};
