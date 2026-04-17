import { Request, Response } from 'express';
import { courseAnalyticsService } from '../services/course-analytics.service';

export class CourseAnalyticsController {
  // ========================================
  // COURSE METRICS
  // ========================================

  async getCourseMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const metrics = await courseAnalyticsService.getCourseMetrics(courseId, days);
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getCourseMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course metrics' });
    }
  }

  async getAllCoursesMetrics(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const metrics = await courseAnalyticsService.getAllCoursesMetrics(date);

      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('[getAllCoursesMetrics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get all courses metrics' });
    }
  }

  // ========================================
  // ENROLLMENT TRENDS
  // ========================================

  async getEnrollmentTrends(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : 12;

      const trends = await courseAnalyticsService.getEnrollmentTrends(courseId, weeks);
      res.json({ success: true, data: trends });
    } catch (error: any) {
      console.error('[getEnrollmentTrends] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get enrollment trends' });
    }
  }

  // ========================================
  // COURSE COMPLETION ANALYTICS
  // ========================================

  async getCourseCompletionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const analytics = await courseAnalyticsService.getCourseCompletionAnalytics(courseId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getCourseCompletionAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get completion analytics' });
    }
  }

  async getCoursePerformanceOverview(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.query.courseId as string;
      const overview = await courseAnalyticsService.getCoursePerformanceOverview(courseId);

      res.json({ success: true, data: overview });
    } catch (error: any) {
      console.error('[getCoursePerformanceOverview] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get performance overview' });
    }
  }

  async getTopPerformingCourses(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const courses = await courseAnalyticsService.getTopPerformingCourses(limit);

      res.json({ success: true, data: courses });
    } catch (error: any) {
      console.error('[getTopPerformingCourses] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get top performing courses' });
    }
  }

  async getCoursesNeedingAttention(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const courses = await courseAnalyticsService.getCoursesNeedingAttention(limit);

      res.json({ success: true, data: courses });
    } catch (error: any) {
      console.error('[getCoursesNeedingAttention] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get courses needing attention' });
    }
  }

  // ========================================
  // MODULE ANALYTICS
  // ========================================

  async getModuleAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;
      const analytics = await courseAnalyticsService.getModuleAnalytics(moduleId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getModuleAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get module analytics' });
    }
  }

  async getCourseModulesAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const analytics = await courseAnalyticsService.getCourseModulesAnalytics(courseId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getCourseModulesAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course modules analytics' });
    }
  }

  // ========================================
  // LESSON ANALYTICS
  // ========================================

  async getLessonAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const analytics = await courseAnalyticsService.getLessonAnalytics(lessonId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getLessonAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get lesson analytics' });
    }
  }

  async getModuleLessonsAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.params;
      const analytics = await courseAnalyticsService.getModuleLessonsAnalytics(moduleId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getModuleLessonsAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get module lessons analytics' });
    }
  }

  async getTopViewedLessons(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const lessons = await courseAnalyticsService.getTopViewedLessons(courseId, limit);
      res.json({ success: true, data: lessons });
    } catch (error: any) {
      console.error('[getTopViewedLessons] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get top viewed lessons' });
    }
  }

  // ========================================
  // ASSESSMENT ANALYTICS
  // ========================================

  async getAssessmentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { assessmentId } = req.params;
      const analytics = await courseAnalyticsService.getAssessmentAnalytics(assessmentId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getAssessmentAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get assessment analytics' });
    }
  }

  async getCourseAssessmentsAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const analytics = await courseAnalyticsService.getCourseAssessmentsAnalytics(courseId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getCourseAssessmentsAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course assessments analytics' });
    }
  }

  // ========================================
  // DROPOUT ANALYSIS
  // ========================================

  async recordDropout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const {
        courseId,
        enrollmentId,
        progressPercentage,
        lastLessonId,
        lastModuleId,
        dropoutReason,
        feedback
      } = req.body;

      if (!courseId || !enrollmentId || progressPercentage === undefined) {
        res.status(400).json({
          success: false,
          message: 'courseId, enrollmentId, and progressPercentage are required'
        });
        return;
      }

      const dropout = await courseAnalyticsService.recordDropout({
        userId,
        courseId,
        enrollmentId,
        progressPercentage,
        lastLessonId,
        lastModuleId,
        dropoutReason,
        feedback
      });

      res.json({ success: true, data: dropout });
    } catch (error: any) {
      console.error('[recordDropout] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to record dropout' });
    }
  }

  async getCourseDropouts(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const dropouts = await courseAnalyticsService.getCourseDropouts(courseId, limit);
      res.json({ success: true, data: dropouts });
    } catch (error: any) {
      console.error('[getCourseDropouts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course dropouts' });
    }
  }

  async getDropoutAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const analysis = await courseAnalyticsService.getDropoutAnalysisByCourse(courseId);

      res.json({ success: true, data: analysis });
    } catch (error: any) {
      console.error('[getDropoutAnalysis] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get dropout analysis' });
    }
  }

  // ========================================
  // INSTRUCTOR ANALYTICS
  // ========================================

  async getMyInstructorAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const analytics = await courseAnalyticsService.getInstructorAnalytics(userId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getMyInstructorAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get instructor analytics' });
    }
  }

  async getInstructorAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const analytics = await courseAnalyticsService.getInstructorAnalytics(instructorId);

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error('[getInstructorAnalytics] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get instructor analytics' });
    }
  }

  async getTopInstructors(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const instructors = await courseAnalyticsService.getTopInstructors(limit);

      res.json({ success: true, data: instructors });
    } catch (error: any) {
      console.error('[getTopInstructors] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get top instructors' });
    }
  }

  // ========================================
  // CONTENT EFFECTIVENESS
  // ========================================

  async getContentNeedingImprovement(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const content = await courseAnalyticsService.getContentNeedingImprovement(courseId);

      res.json({ success: true, data: content });
    } catch (error: any) {
      console.error('[getContentNeedingImprovement] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get content needing improvement' });
    }
  }

  // ========================================
  // COHORT ANALYSIS
  // ========================================

  async createCohort(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, cohortName, cohortStartDate, cohortEndDate } = req.body;

      if (!courseId || !cohortName || !cohortStartDate || !cohortEndDate) {
        res.status(400).json({
          success: false,
          message: 'courseId, cohortName, cohortStartDate, and cohortEndDate are required'
        });
        return;
      }

      const cohort = await courseAnalyticsService.createCohort({
        courseId,
        cohortName,
        cohortStartDate: new Date(cohortStartDate),
        cohortEndDate: new Date(cohortEndDate)
      });

      res.json({ success: true, data: cohort });
    } catch (error: any) {
      console.error('[createCohort] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create cohort' });
    }
  }

  async getCourseCohorts(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const cohorts = await courseAnalyticsService.getCourseCohorts(courseId);

      res.json({ success: true, data: cohorts });
    } catch (error: any) {
      console.error('[getCourseCohorts] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get course cohorts' });
    }
  }

  // ========================================
  // POPULAR CONTENT
  // ========================================

  async getPopularContent(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const contentType = req.query.contentType as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const content = await courseAnalyticsService.getPopularContent(courseId, contentType, limit);
      res.json({ success: true, data: content });
    } catch (error: any) {
      console.error('[getPopularContent] Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get popular content' });
    }
  }
}

export const courseAnalyticsController = new CourseAnalyticsController();
