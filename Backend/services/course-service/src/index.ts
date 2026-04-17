import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import courseRoutes from './routes/course.routes';
import moduleRoutes from './routes/module.routes';
import lessonRoutes from './routes/lesson.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import progressRoutes from './routes/progress.routes';
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';
import githubRoutes from './routes/github.routes';
import videoAccountabilityRoutes from './routes/video-accountability.routes';
import peerReviewRoutes from './routes/peer-review.routes';
import portfolioRoutes from './routes/portfolio.routes';
import careerOutcomeRoutes from './routes/career-outcome.routes';
import forumRoutes from './routes/forum.routes';
import notificationRoutes from './routes/notification.routes';
import enterpriseRoutes from './routes/enterprise.routes';
import messagingRoutes from './routes/messaging.routes';
import studyGroupsRoutes from './routes/study-groups.routes';
import liveClassesRoutes from './routes/live-classes.routes';
import reportingRoutes from './routes/reporting.routes';
import assessmentRoutes from './routes/assessment.routes';
import certificatesRoutes from './routes/certificates.routes';
import paymentsRoutes from './routes/payments.routes';
import pricingRoutes from './routes/pricing.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import financialRoutes from './routes/financial.routes';
import gamificationRoutes from './routes/gamification.routes';
import leaderboardsRoutes from './routes/leaderboards.routes';
import streaksRoutes from './routes/streaks.routes';
import engagementRoutes from './routes/engagement.routes';
import learningAnalyticsRoutes from './routes/learning-analytics.routes';
import courseAnalyticsRoutes from './routes/course-analytics.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import userManagementRoutes from './routes/user-management.routes';
import rbacRoutes from './routes/rbac.routes';
import auditLoggingRoutes from './routes/audit-logging.routes';
import securityRoutes from './routes/security.routes';
import aimlRoutes from './routes/ai-ml.routes';
import integrationsRoutes from './routes/integrations.routes';
import systemConfigRoutes from './routes/system-config.routes';
import localizationRoutes from './routes/localization.routes';
import analyticsRoutes from './routes/analytics.routes';
import backupRoutes from './routes/backup.routes';
import searchRoutes from './routes/search.routes';
import adminDashboardRoutes from './routes/admin-dashboard.routes';
import webhooksRoutes from './routes/webhooks.routes';
import queueRoutes from './routes/queue.routes';
import contentVersioningRoutes from './routes/content-versioning.routes';
import pool from './db/pool';

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 4002;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'course-service', status: 'ok' });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/courses', courseRoutes);
app.use('/api', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', progressRoutes);
app.use('/api', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/video-accountability', videoAccountabilityRoutes);
app.use('/api/peer-review', peerReviewRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/career-outcomes', careerOutcomeRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/study-groups', studyGroupsRoutes);
app.use('/api/live-classes', liveClassesRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/learning-analytics', learningAnalyticsRoutes);
app.use('/api/course-analytics', courseAnalyticsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/audit', auditLoggingRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/ai-ml', aimlRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/system-config', systemConfigRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/content-versioning', contentVersioningRoutes);

// ── Error Handler ─────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[course-service] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────
const shutdown = async () => {
  console.log('[course-service] Shutting down gracefully...');
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
  console.log(`[course-service] running on port ${PORT}`);
});

export default app;
