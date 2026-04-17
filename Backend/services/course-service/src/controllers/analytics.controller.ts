import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  // ACTIVITY TRACKING
  async trackActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await analyticsService.trackActivity({ ...req.body, userId });
      res.status(201).json({ success: true, message: 'Activity tracked successfully' });
    } catch (error: any) {
      console.error('[trackActivity] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStudentActivities(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { courseId, limit } = req.query;

      const activities = await analyticsService.getStudentActivities(
        userId,
        courseId as string,
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.json({ success: true, data: activities });
    } catch (error: any) {
      console.error('[getStudentActivities] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // COURSE ANALYTICS
  async getCourseDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const dashboard = await analyticsService.getCourseDashboard(courseId);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('[getCourseDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCourseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await analyticsService.getCourseAnalytics(
        courseId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getCourseAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCoursePerformanceTrend(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { days } = req.query;

      const trend = await analyticsService.getCoursePerformanceTrend(
        courseId,
        days ? parseInt(days as string, 10) : undefined
      );

      res.json({ success: true, data: trend });
    } catch (error: any) {
      console.error('[getCoursePerformanceTrend] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async aggregateCourseAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { date } = req.body;

      await analyticsService.aggregateCourseAnalytics(
        courseId,
        date ? new Date(date) : undefined
      );

      res.json({ success: true, message: 'Analytics aggregated successfully' });
    } catch (error: any) {
      console.error('[aggregateCourseAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // STUDENT PERFORMANCE
  async getStudentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const performance = await analyticsService.getStudentPerformance(userId, courseId);

      if (!performance) {
        res.status(404).json({ success: false, message: 'Performance data not found' });
        return;
      }

      res.json({ success: true, data: performance });
    } catch (error: any) {
      console.error('[getStudentPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStudentPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      await analyticsService.updateStudentPerformance(userId, courseId);
      res.json({ success: true, message: 'Student performance updated successfully' });
    } catch (error: any) {
      console.error('[updateStudentPerformance] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAtRiskStudents(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const students = await analyticsService.getAtRiskStudents(courseId);
      res.json({ success: true, data: students });
    } catch (error: any) {
      console.error('[getAtRiskStudents] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markStudentsAtRisk(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      await analyticsService.markStudentsAtRisk(courseId);
      res.json({ success: true, message: 'At-risk students marked successfully' });
    } catch (error: any) {
      console.error('[markStudentsAtRisk] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // LESSON ANALYTICS
  async getLessonAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { days } = req.query;

      const analytics = await analyticsService.getLessonAnalytics(
        lessonId,
        days ? parseInt(days as string, 10) : undefined
      );

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getLessonAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async aggregateLessonAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { date } = req.body;

      await analyticsService.aggregateLessonAnalytics(
        lessonId,
        date ? new Date(date) : undefined
      );

      res.json({ success: true, message: 'Lesson analytics aggregated successfully' });
    } catch (error: any) {
      console.error('[aggregateLessonAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ASSESSMENT ANALYTICS
  async getAssessmentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { days } = req.query;

      const analytics = await analyticsService.getAssessmentAnalytics(
        assessmentId,
        days ? parseInt(days as string, 10) : undefined
      );

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getAssessmentAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async aggregateAssessmentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const { date } = req.body;

      await analyticsService.aggregateAssessmentAnalytics(
        assessmentId,
        date ? new Date(date) : undefined
      );

      res.json({ success: true, message: 'Assessment analytics aggregated successfully' });
    } catch (error: any) {
      console.error('[aggregateAssessmentAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ENGAGEMENT METRICS
  async getStudentEngagement(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const engagement = await analyticsService.getStudentEngagement(userId);
      res.json({ success: true, data: engagement });
    } catch (error: any) {
      console.error('[getStudentEngagement] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async calculateEngagementScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId } = req.params;
      const score = await analyticsService.calculateEngagementScore(userId, courseId);
      res.json({ success: true, data: { score } });
    } catch (error: any) {
      console.error('[calculateEngagementScore] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getEngagementTrend(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { days } = req.query;

      const trend = await analyticsService.getEngagementTrend(
        courseId,
        days ? parseInt(days as string, 10) : undefined
      );

      res.json({ success: true, data: trend });
    } catch (error: any) {
      console.error('[getEngagementTrend] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // LEARNING PATTERNS
  async getLearningPatterns(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const patterns = await analyticsService.getLearningPatterns(userId);

      if (!patterns) {
        res.status(404).json({ success: false, message: 'Learning patterns not found' });
        return;
      }

      res.json({ success: true, data: patterns });
    } catch (error: any) {
      console.error('[getLearningPatterns] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async analyzeLearningPatterns(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      await analyticsService.analyzeLearningPatterns(userId);
      res.json({ success: true, message: 'Learning patterns analyzed successfully' });
    } catch (error: any) {
      console.error('[analyzeLearningPatterns] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // RETENTION & CHURN
  async getRetentionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const metrics = await analyticsService.getRetentionMetrics(courseId);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getRetentionMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async calculateCohortRetention(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { cohortStartDate, cohortEndDate } = req.body;

      if (!cohortStartDate || !cohortEndDate) {
        res.status(400).json({ success: false, message: 'Missing cohort dates' });
        return;
      }

      await analyticsService.calculateCohortRetention(
        courseId,
        new Date(cohortStartDate),
        new Date(cohortEndDate)
      );

      res.json({ success: true, message: 'Cohort retention calculated successfully' });
    } catch (error: any) {
      console.error('[calculateCohortRetention] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // REPORTING
  async getInstructorDashboard(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = (req as any).user?.userId;
      if (!instructorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const dashboard = await analyticsService.getInstructorDashboard(instructorId);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      console.error('[getInstructorDashboard] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async exportAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { format } = req.query;

      const data = await analyticsService.exportAnalyticsData(
        courseId,
        format as 'json' | 'csv' || 'json'
      );

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[exportAnalyticsData] Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
