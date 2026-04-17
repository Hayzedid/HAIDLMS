import { pool } from '../db/pool';
import axios from 'axios';

/**
 * Learning Health Dashboard Service
 * Aggregates data from multiple services to calculate composite health scores
 * and identify at-risk learners requiring intervention
 */

interface HealthComponent {
  name: string;
  score: number;
  weight: number;
  status: 'healthy' | 'warning' | 'critical';
  details: any;
}

interface CompositeHealthScore {
  userId: string;
  courseId: string;
  overallScore: number;
  components: HealthComponent[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interventionRecommended: boolean;
  lastCalculated: Date;
}

interface AtRiskLearner {
  userId: string;
  courseId: string;
  healthScore: number;
  riskLevel: string;
  flags: string[];
  recommendations: string[];
}

export class LearningHealthService {
  // Service endpoints (from environment or config)
  private courseServiceUrl = process.env.COURSE_SERVICE_URL || 'http://localhost:4002';
  private ideServiceUrl = process.env.IDE_SERVICE_URL || 'http://localhost:4003';
  private notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

  /**
   * Calculate composite health score for a user in a course
   * Aggregates data from 5 sources
   */
  async calculateCompositeHealthScore(userId: string, courseId: string): Promise<CompositeHealthScore> {
    try {
      const components: HealthComponent[] = [];

      // 1. Video Accountability (Weight: 20%)
      const videoHealth = await this.getVideoAccountabilityHealth(userId, courseId);
      components.push(videoHealth);

      // 2. Spaced Repetition Performance (Weight: 15%)
      const repetitionHealth = await this.getSpacedRepetitionHealth(userId);
      components.push(repetitionHealth);

      // 3. IDE Integrity (Weight: 25%)
      const ideIntegrityHealth = await this.getIDEIntegrityHealth(userId, courseId);
      components.push(ideIntegrityHealth);

      // 4. Assessment Performance (Weight: 30%)
      const assessmentHealth = await this.getAssessmentHealth(userId, courseId);
      components.push(assessmentHealth);

      // 5. Peer Review Performance (Weight: 10%)
      const peerReviewHealth = await this.getPeerReviewHealth(userId, courseId);
      components.push(peerReviewHealth);

      // Calculate weighted average
      const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
      const weightedSum = components.reduce((sum, c) => sum + (c.score * c.weight), 0);
      const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore, components);

      // Determine if intervention is needed
      const interventionRecommended = this.shouldRecommendIntervention(overallScore, components);

      return {
        userId,
        courseId,
        overallScore,
        components,
        riskLevel,
        interventionRecommended,
        lastCalculated: new Date(),
      };
    } catch (error) {
      console.error('[LearningHealthService] Calculate composite score error:', error);
      throw error;
    }
  }

  /**
   * Get video accountability health component
   */
  private async getVideoAccountabilityHealth(userId: string, courseId: string): Promise<HealthComponent> {
    try {
      const response = await axios.get(
        `${this.courseServiceUrl}/api/video-accountability/user/${userId}/stats`,
        { params: { courseId }, timeout: 5000 }
      );

      const stats = response.data.data;

      // Calculate score based on video completion and interaction
      let score = 0;
      if (stats.totalVideosWatched > 0) {
        const avgCompletionRate = stats.avgCompletionPercentage || 0;
        const interactionScore = Math.min(100, (stats.totalInteractions / stats.totalVideosWatched) * 20);
        score = (avgCompletionRate * 0.7) + (interactionScore * 0.3);
      }

      return {
        name: 'Video Accountability',
        score: Math.min(100, score),
        weight: 0.20,
        status: score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical',
        details: {
          videosWatched: stats.totalVideosWatched,
          avgCompletion: stats.avgCompletionPercentage,
          interactions: stats.totalInteractions,
          flaggedForSkipping: stats.flaggedForSkipping,
        },
      };
    } catch (error) {
      console.warn('[LearningHealthService] Video accountability fetch failed:', error);
      return {
        name: 'Video Accountability',
        score: 50,
        weight: 0.20,
        status: 'warning',
        details: { error: 'Data unavailable' },
      };
    }
  }

  /**
   * Get spaced repetition health component
   */
  private async getSpacedRepetitionHealth(userId: string): Promise<HealthComponent> {
    try {
      const response = await axios.get(
        `${this.notificationServiceUrl}/api/spaced-repetition/user/${userId}/stats`,
        { timeout: 5000 }
      );

      const stats = response.data.data;

      // Calculate score based on response rate and accuracy
      const responseRate = stats.totalReviewed > 0
        ? (stats.totalReviewed / stats.totalDue) * 100
        : 0;
      const accuracy = stats.correctCount > 0
        ? (stats.correctCount / stats.totalReviewed) * 100
        : 0;

      const score = (responseRate * 0.4) + (accuracy * 0.6);

      return {
        name: 'Spaced Repetition',
        score: Math.min(100, score),
        weight: 0.15,
        status: score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical',
        details: {
          totalDue: stats.totalDue,
          totalReviewed: stats.totalReviewed,
          correctCount: stats.correctCount,
          currentStreak: stats.currentStreak,
          responseRate: responseRate.toFixed(1),
          accuracy: accuracy.toFixed(1),
        },
      };
    } catch (error) {
      console.warn('[LearningHealthService] Spaced repetition fetch failed:', error);
      return {
        name: 'Spaced Repetition',
        score: 50,
        weight: 0.15,
        status: 'warning',
        details: { error: 'Data unavailable' },
      };
    }
  }

  /**
   * Get IDE integrity health component
   */
  private async getIDEIntegrityHealth(userId: string, courseId: string): Promise<HealthComponent> {
    try {
      // Get clipboard attempts
      const clipboardResponse = await axios.get(
        `${this.ideServiceUrl}/api/clipboard/stats/${userId}`,
        { timeout: 5000 }
      );

      const clipboardStats = clipboardResponse.data.data;

      // Get integrity flags
      const flagsResponse = await axios.get(
        `${this.ideServiceUrl}/api/keystroke/integrity-flags`,
        { params: { userId }, timeout: 5000 }
      );

      const flags = flagsResponse.data.data;

      // Calculate score (lower is worse)
      let score = 100;

      // Penalize blocked clipboard attempts
      if (clipboardStats.blocked_attempts > 0) {
        const blockedPenalty = Math.min(30, clipboardStats.blocked_attempts * 5);
        score -= blockedPenalty;
      }

      // Penalize integrity flags
      const criticalFlags = flags.filter((f: any) => f.severity === 'critical').length;
      const highFlags = flags.filter((f: any) => f.severity === 'high').length;
      score -= (criticalFlags * 20 + highFlags * 10);

      score = Math.max(0, score);

      return {
        name: 'IDE Integrity',
        score,
        weight: 0.25,
        status: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
        details: {
          totalClipboardAttempts: clipboardStats.total_attempts,
          blockedAttempts: clipboardStats.blocked_attempts,
          pasteAttempts: clipboardStats.paste_attempts,
          integrityFlags: flags.length,
          criticalFlags,
          highFlags,
        },
      };
    } catch (error) {
      console.warn('[LearningHealthService] IDE integrity fetch failed:', error);
      return {
        name: 'IDE Integrity',
        score: 75,
        weight: 0.25,
        status: 'healthy',
        details: { error: 'Data unavailable' },
      };
    }
  }

  /**
   * Get assessment health component
   */
  private async getAssessmentHealth(userId: string, courseId: string): Promise<HealthComponent> {
    try {
      // Query from local analytics database
      const result = await pool.query(
        `SELECT
          avg_assessment_score,
          assessments_attempted,
          assessments_passed
        FROM user_learning_metrics
        WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      if (result.rows.length === 0) {
        return {
          name: 'Assessment Performance',
          score: 50,
          weight: 0.30,
          status: 'warning',
          details: { message: 'No assessments completed yet' },
        };
      }

      const metrics = result.rows[0];
      const avgScore = parseFloat(metrics.avg_assessment_score || '0');
      const passRate = metrics.assessments_attempted > 0
        ? (metrics.assessments_passed / metrics.assessments_attempted) * 100
        : 0;

      // Weight avg score (70%) and pass rate (30%)
      const score = (avgScore * 0.7) + (passRate * 0.3);

      return {
        name: 'Assessment Performance',
        score,
        weight: 0.30,
        status: score >= 70 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
        details: {
          avgScore: avgScore.toFixed(1),
          attempted: metrics.assessments_attempted,
          passed: metrics.assessments_passed,
          passRate: passRate.toFixed(1),
        },
      };
    } catch (error) {
      console.error('[LearningHealthService] Assessment health fetch failed:', error);
      return {
        name: 'Assessment Performance',
        score: 50,
        weight: 0.30,
        status: 'warning',
        details: { error: 'Data unavailable' },
      };
    }
  }

  /**
   * Get peer review health component
   */
  private async getPeerReviewHealth(userId: string, courseId: string): Promise<HealthComponent> {
    try {
      const response = await axios.get(
        `${this.courseServiceUrl}/api/peer-review/reviewers/${userId}/stats`,
        { timeout: 5000 }
      );

      const stats = response.data.data;

      if (!stats) {
        return {
          name: 'Peer Review Participation',
          score: 50,
          weight: 0.10,
          status: 'warning',
          details: { message: 'No peer reviews yet' },
        };
      }

      // Calculate score based on completion rate, quality, and helpfulness
      const completionRate = stats.total_reviews_assigned > 0
        ? (stats.total_reviews_completed / stats.total_reviews_assigned) * 100
        : 0;
      const onTimeRate = parseFloat(stats.on_time_rate || '0');
      const helpfulness = parseFloat(stats.avg_helpfulness_rating || '0.5') * 100;

      const score = (completionRate * 0.4) + (onTimeRate * 0.3) + (helpfulness * 0.3);

      return {
        name: 'Peer Review Participation',
        score: Math.min(100, score),
        weight: 0.10,
        status: score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical',
        details: {
          completed: stats.total_reviews_completed,
          assigned: stats.total_reviews_assigned,
          completionRate: completionRate.toFixed(1),
          onTimeRate: onTimeRate.toFixed(1),
          avgHelpfulness: helpfulness.toFixed(1),
          collusionFlags: stats.collusion_flags,
        },
      };
    } catch (error) {
      console.warn('[LearningHealthService] Peer review fetch failed:', error);
      return {
        name: 'Peer Review Participation',
        score: 50,
        weight: 0.10,
        status: 'warning',
        details: { error: 'Data unavailable' },
      };
    }
  }

  /**
   * Determine risk level based on overall score and critical components
   */
  private determineRiskLevel(
    overallScore: number,
    components: HealthComponent[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Check for critical components
    const hasCritical = components.some(c => c.status === 'critical');
    const criticalCount = components.filter(c => c.status === 'critical').length;
    const warningCount = components.filter(c => c.status === 'warning').length;

    if (hasCritical && criticalCount >= 2) return 'critical';
    if (hasCritical || overallScore < 50) return 'high';
    if (warningCount >= 3 || overallScore < 65) return 'medium';
    return 'low';
  }

  /**
   * Determine if intervention should be recommended
   */
  private shouldRecommendIntervention(
    overallScore: number,
    components: HealthComponent[]
  ): boolean {
    // Recommend intervention if:
    // - Overall score < 60
    // - Any critical component
    // - 3+ warning components
    // - IDE integrity issues (indicates possible academic dishonesty)

    if (overallScore < 60) return true;

    const hasCritical = components.some(c => c.status === 'critical');
    if (hasCritical) return true;

    const warningCount = components.filter(c => c.status === 'warning').length;
    if (warningCount >= 3) return true;

    const ideComponent = components.find(c => c.name === 'IDE Integrity');
    if (ideComponent && ideComponent.score < 70) return true;

    return false;
  }

  /**
   * Get all at-risk learners for a course
   */
  async getAtRiskLearners(courseId: string): Promise<AtRiskLearner[]> {
    try {
      // Get all enrolled users for the course
      const enrolledResult = await pool.query(
        `SELECT DISTINCT user_id
        FROM user_learning_metrics
        WHERE course_id = $1`,
        [courseId]
      );

      const atRiskLearners: AtRiskLearner[] = [];

      for (const row of enrolledResult.rows) {
        const userId = row.user_id;

        // Calculate health score
        const healthData = await this.calculateCompositeHealthScore(userId, courseId);

        // Only include if medium risk or higher
        if (['medium', 'high', 'critical'].includes(healthData.riskLevel)) {
          const flags: string[] = [];
          const recommendations: string[] = [];

          // Analyze components to generate flags and recommendations
          healthData.components.forEach(component => {
            if (component.status === 'critical') {
              flags.push(`Critical: ${component.name} (${component.score.toFixed(0)}%)`);
              recommendations.push(this.getComponentRecommendation(component));
            } else if (component.status === 'warning') {
              flags.push(`Warning: ${component.name} (${component.score.toFixed(0)}%)`);
            }
          });

          atRiskLearners.push({
            userId,
            courseId,
            healthScore: healthData.overallScore,
            riskLevel: healthData.riskLevel,
            flags,
            recommendations,
          });
        }
      }

      // Sort by risk level and health score
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      atRiskLearners.sort((a, b) => {
        const orderDiff = riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
        if (orderDiff !== 0) return orderDiff;
        return a.healthScore - b.healthScore;
      });

      return atRiskLearners;
    } catch (error) {
      console.error('[LearningHealthService] Get at-risk learners error:', error);
      throw error;
    }
  }

  /**
   * Generate component-specific recommendation
   */
  private getComponentRecommendation(component: HealthComponent): string {
    switch (component.name) {
      case 'Video Accountability':
        return 'Watch videos completely without skipping critical sections';
      case 'Spaced Repetition':
        return 'Complete daily review sessions to improve retention';
      case 'IDE Integrity':
        return 'Follow academic integrity guidelines when coding';
      case 'Assessment Performance':
        return 'Review failed assessments and strengthen weak areas';
      case 'Peer Review Participation':
        return 'Provide thorough, timely peer reviews to strengthen learning';
      default:
        return 'Focus on improving this area';
    }
  }

  /**
   * Generate instructor nudge for at-risk learner
   */
  async generateInstructorNudge(userId: string, courseId: string): Promise<any> {
    try {
      const healthData = await this.calculateCompositeHealthScore(userId, courseId);

      if (!healthData.interventionRecommended) {
        return null;
      }

      // Get user learning metrics for context
      const metricsResult = await pool.query(
        `SELECT * FROM user_learning_metrics WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      const metrics = metricsResult.rows[0];

      // Generate nudge message
      const criticalComponents = healthData.components.filter(c => c.status === 'critical');
      const warningComponents = healthData.components.filter(c => c.status === 'warning');

      let nudgeMessage = `Student is at ${healthData.riskLevel} risk (Health Score: ${healthData.overallScore.toFixed(0)}%).\n\n`;

      if (criticalComponents.length > 0) {
        nudgeMessage += `Critical areas:\n`;
        criticalComponents.forEach(c => {
          nudgeMessage += `- ${c.name}: ${c.score.toFixed(0)}% - ${this.getComponentRecommendation(c)}\n`;
        });
      }

      if (warningComponents.length > 0) {
        nudgeMessage += `\nWarning areas:\n`;
        warningComponents.forEach(c => {
          nudgeMessage += `- ${c.name}: ${c.score.toFixed(0)}%\n`;
        });
      }

      nudgeMessage += `\nCourse Progress: ${metrics?.progress_percentage?.toFixed(1) || 0}%`;
      nudgeMessage += `\nLast Activity: ${metrics?.last_activity_at ? new Date(metrics.last_activity_at).toLocaleDateString() : 'Unknown'}`;

      return {
        userId,
        courseId,
        riskLevel: healthData.riskLevel,
        healthScore: healthData.overallScore,
        message: nudgeMessage,
        actionable: true,
        priority: healthData.riskLevel === 'critical' ? 'high' : healthData.riskLevel === 'high' ? 'medium' : 'low',
        components: healthData.components.map(c => ({
          name: c.name,
          score: c.score,
          status: c.status,
        })),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('[LearningHealthService] Generate instructor nudge error:', error);
      throw error;
    }
  }

  /**
   * Update user health score in analytics database
   */
  async updateUserHealthScore(userId: string, courseId: string): Promise<void> {
    try {
      const healthData = await this.calculateCompositeHealthScore(userId, courseId);

      await pool.query(
        `UPDATE user_analytics
        SET health_score = $2,
            updated_at = NOW()
        WHERE user_id = $1`,
        [userId, healthData.overallScore]
      );

      // Also update at_risk flag in user_learning_metrics
      await pool.query(
        `UPDATE user_learning_metrics
        SET at_risk = $3,
            updated_at = NOW()
        WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId, healthData.riskLevel !== 'low']
      );
    } catch (error) {
      console.error('[LearningHealthService] Update user health score error:', error);
      throw error;
    }
  }

  /**
   * Get dashboard summary for instructor
   */
  async getDashboardSummary(courseId: string): Promise<any> {
    try {
      const atRiskLearners = await this.getAtRiskLearners(courseId);

      // Get total enrolled count
      const enrolledResult = await pool.query(
        `SELECT COUNT(*) as total
        FROM user_learning_metrics
        WHERE course_id = $1`,
        [courseId]
      );

      const totalEnrolled = parseInt(enrolledResult.rows[0].total);

      // Calculate statistics
      const critical = atRiskLearners.filter(l => l.riskLevel === 'critical').length;
      const high = atRiskLearners.filter(l => l.riskLevel === 'high').length;
      const medium = atRiskLearners.filter(l => l.riskLevel === 'medium').length;
      const healthy = totalEnrolled - (critical + high + medium);

      return {
        courseId,
        totalEnrolled,
        healthyCount: healthy,
        atRiskCount: critical + high + medium,
        riskDistribution: {
          critical,
          high,
          medium,
          low: healthy,
        },
        atRiskPercentage: totalEnrolled > 0 ? ((critical + high + medium) / totalEnrolled * 100).toFixed(1) : 0,
        topAtRiskLearners: atRiskLearners.slice(0, 10),
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('[LearningHealthService] Get dashboard summary error:', error);
      throw error;
    }
  }
}

export const learningHealthService = new LearningHealthService();
