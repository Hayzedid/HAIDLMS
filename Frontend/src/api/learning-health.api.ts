import apiClient from './client';

export interface HealthComponent {
  name: string;
  score: number;
  weight: number;
  status: 'healthy' | 'warning' | 'critical';
  details: any;
}

export interface CompositeHealthScore {
  userId: string;
  courseId: string;
  overallScore: number;
  components: HealthComponent[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interventionRecommended: boolean;
  lastCalculated: string;
}

export interface AtRiskLearner {
  userId: string;
  courseId: string;
  healthScore: number;
  riskLevel: string;
  flags: string[];
  recommendations: string[];
}

export interface InstructorNudge {
  userId: string;
  courseId: string;
  riskLevel: string;
  healthScore: number;
  message: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  components: Array<{
    name: string;
    score: number;
    status: string;
  }>;
  generatedAt: string;
}

export interface DashboardSummary {
  courseId: string;
  totalEnrolled: number;
  healthyCount: number;
  atRiskCount: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  atRiskPercentage: string;
  topAtRiskLearners: AtRiskLearner[];
  generatedAt: string;
}

const ANALYTICS_SERVICE_URL = import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:4006';

export const learningHealthApi = {
  // Health Score
  async getUserHealthScore(
    userId: string,
    courseId: string
  ): Promise<CompositeHealthScore> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/health-score`
    );
    return response.data.data;
  },

  async getComponentBreakdown(
    userId: string,
    courseId: string
  ): Promise<{
    overallScore: number;
    components: Array<{
      name: string;
      score: number;
      weight: number;
      status: string;
      weightedScore: number;
    }>;
    riskLevel: string;
  }> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/component-breakdown`
    );
    return response.data.data;
  },

  // At-Risk Learners
  async getAtRiskLearners(
    courseId: string,
    riskLevel?: 'critical' | 'high' | 'medium'
  ): Promise<AtRiskLearner[]> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/at-risk-learners`,
      { params: { riskLevel } }
    );
    return response.data.data;
  },

  // Instructor Nudges
  async generateInstructorNudge(
    userId: string,
    courseId: string
  ): Promise<InstructorNudge | null> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/instructor-nudge`
    );
    return response.data.data;
  },

  async getInterventionRecommendations(courseId: string): Promise<InstructorNudge[]> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/interventions`
    );
    return response.data.data;
  },

  // Dashboard Summary
  async getDashboardSummary(courseId: string): Promise<DashboardSummary> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/dashboard-summary`
    );
    return response.data.data;
  },

  // Health Score Updates
  async updateHealthScore(userId: string, courseId: string): Promise<void> {
    await apiClient.post(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/update-health-score`
    );
  },

  async batchUpdateHealthScores(courseId: string): Promise<{
    totalUsers: number;
    updated: number;
    failed: number;
  }> {
    const response = await apiClient.post(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/courses/${courseId}/batch-update`
    );
    return response.data.data;
  },

  // Trends
  async getHealthScoreTrends(
    userId: string,
    courseId: string,
    days = 30
  ): Promise<{
    current: CompositeHealthScore;
    historical: any[];
    message: string;
  }> {
    const response = await apiClient.get(
      `${ANALYTICS_SERVICE_URL}/api/learning-health/users/${userId}/courses/${courseId}/trends`,
      { params: { days } }
    );
    return response.data.data;
  },
};
