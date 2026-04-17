import { Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';
import { learningAnalyticsService } from '../services/learning-analytics.service';

/**
 * Get user analytics
 */
export async function getUserAnalytics(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const engagementScore = await metricsService.calculateUserEngagementScore(userId);
    const healthScore = await metricsService.calculateUserHealthScore(userId);
    const streak = await metricsService.calculateStreakDays(userId);
    const completionRate = await metricsService.calculateCompletionRate(userId);
    const velocity = await metricsService.calculateLearningVelocity(userId);
    const timeMetrics = await metricsService.calculateTimeMetrics(userId);
    const trends = await metricsService.calculateTrends(userId);

    res.json({
      data: {
        engagementScore,
        healthScore,
        streakDays: streak.current,
        longestStreak: streak.longest,
        completionRate,
        learningVelocity: velocity,
        timeMetrics,
        trends,
      },
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
}

/**
 * Get course analytics
 */
export async function getCourseAnalytics(req: Request, res: Response) {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const completionRate = await metricsService.calculateCourseCompletionRate(courseId);
    const avgScore = await metricsService.calculateCourseAvgAssessmentScore(courseId);
    const dropoutAnalysis = await metricsService.calculateCourseDropoutAnalysis(courseId);
    const dropOffPoints = await learningAnalyticsService.getCourseDropOffPoints(courseId);
    const strugglingStudents = await learningAnalyticsService.getStrugglingStudents(courseId);
    const topPerformers = await learningAnalyticsService.getTopPerformers(courseId);

    res.json({
      data: {
        completionRate,
        avgAssessmentScore: avgScore,
        dropoutRate: dropoutAnalysis.dropoutRate,
        avgDropoutPoint: dropoutAnalysis.avgDropoutPoint,
        dropOffPoints,
        strugglingStudents,
        topPerformers,
      },
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({ error: 'Failed to get course analytics' });
  }
}

/**
 * Get learning insights for a course
 */
export async function getLearningInsights(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const insights = await learningAnalyticsService.getLearningInsights(userId, courseId);

    res.json({ data: insights });
  } catch (error) {
    console.error('Get learning insights error:', error);
    res.status(500).json({ error: 'Failed to get learning insights' });
  }
}

/**
 * Get learning path recommendations
 */
export async function getLearningPathRecommendations(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const recommendations = await learningAnalyticsService.getLearningPathRecommendations(
      userId,
      courseId
    );

    res.json({ data: recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}

/**
 * Update user learning metrics
 */
export async function updateLearningMetrics(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    await learningAnalyticsService.updateUserLearningMetrics(userId, courseId);

    res.json({ message: 'Learning metrics updated' });
  } catch (error) {
    console.error('Update learning metrics error:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
}

/**
 * Get retention metrics
 */
export async function getRetentionMetrics(req: Request, res: Response) {
  try {
    const { days } = req.query;

    const retention = await metricsService.calculateRetentionRate(
      days ? parseInt(days as string, 10) : undefined
    );

    res.json({ data: retention });
  } catch (error) {
    console.error('Get retention metrics error:', error);
    res.status(500).json({ error: 'Failed to get retention metrics' });
  }
}

/**
 * Get at-risk users
 */
export async function getAtRiskUsers(req: Request, res: Response) {
  try {
    const { healthScore, engagementScore, daysInactive } = req.query;

    const userIds = await metricsService.identifyAtRiskUsers({
      healthScore: healthScore ? parseFloat(healthScore as string) : undefined,
      engagementScore: engagementScore ? parseFloat(engagementScore as string) : undefined,
      daysInactive: daysInactive ? parseInt(daysInactive as string, 10) : undefined,
    });

    res.json({ data: { userIds, count: userIds.length } });
  } catch (error) {
    console.error('Get at-risk users error:', error);
    res.status(500).json({ error: 'Failed to get at-risk users' });
  }
}
