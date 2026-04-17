# Analytics Service

Comprehensive analytics and metrics tracking service for the TechLearn LMS platform with real-time dashboards, learning insights, and predictive analytics.

## Features

- **Event Tracking**: Capture user actions across the platform
- **Learning Sessions**: Track time spent and engagement
- **Real-time Analytics**: WebSocket connections for live dashboard updates
- **User Analytics**: Engagement scores, health scores, streaks, velocity
- **Course Analytics**: Completion rates, drop-off points, performance metrics
- **Learning Insights**: AI-driven recommendations and predictions
- **Student Dashboards**: Personalized progress and performance views
- **Instructor Dashboards**: Course performance and student insights
- **Admin Dashboards**: Platform-wide metrics and trends
- **At-Risk Detection**: Identify struggling students early
- **Materialized Views**: Pre-computed aggregations for fast queries
- **Batch Processing**: Efficient event collection and storage

## Tech Stack

- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ (with materialized views)
- **Cache**: Redis 6+
- **WebSocket**: ws library
- **Scheduling**: node-cron
- **Validation**: Zod
- **Analytics**: Custom SM-2 inspired algorithms

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- 4GB+ RAM recommended

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn_analytics
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
PORT=4006
FRONTEND_URL=http://localhost:5173
```

### 3. Initialize Database

```bash
npm run db:init
```

This creates:
- 9 tables (events, learning_sessions, user_analytics, course_analytics, user_learning_metrics, lesson_analytics, instructor_analytics, platform_analytics, daily_metrics_snapshot)
- 3 materialized views (mv_active_users_30d, mv_top_courses, mv_users_at_risk)
- Helper functions (calculate_engagement_score, calculate_health_score)
- Automatic triggers for timestamp updates

### 4. Start Service

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 5. Start Background Worker (Optional)

For automated aggregations:
```bash
npm run worker
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Analytics   │  │  Dashboard   │  │  Course Insights   │  │
│  │  Tracking    │  │  Page        │  │  Page              │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘  │
└─────────┼──────────────────┼───────────────────────┼───────────┘
          │                  │ HTTP/WebSocket        │
┌─────────▼──────────────────▼───────────────────────▼───────────┐
│              Analytics Service (Express + WebSocket)            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Event Tracking   │  │    Metrics       │  │  Dashboard   ││
│  │    Service       │  │  Calculation     │  │ Aggregation  ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           │                     │                     │        │
│  ┌────────▼─────────────────────▼─────────────────────▼──────┐│
│  │           Real-time Analytics WebSocket                   ││
│  │  - Live metric updates     - Subscriptions                ││
│  │  - Alert notifications     - Heartbeat monitoring         ││
│  └───────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       PostgreSQL                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Events     │  │  Sessions    │  │  User Analytics      │ │
│  │   (Raw)      │  │  (Time)      │  │  (Aggregated)        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │       Materialized Views (Fast Query Cache)              │  │
│  │  - Active users    - Top courses    - At-risk users     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Event Tracking

#### Track Single Event
```http
POST /api/tracking/event
Authorization: Bearer <token>

{
  "eventType": "lesson_complete",
  "courseId": "uuid",
  "lessonId": "uuid",
  "properties": {
    "score": 95,
    "timeSpent": 1200
  },
  "pageUrl": "https://...",
  "pageLoadTime": 1234
}
```

#### Track Batch Events
```http
POST /api/tracking/batch
Authorization: Bearer <token>

{
  "events": [
    { "eventType": "page_view", "courseId": "uuid" },
    { "eventType": "video_play", "lessonId": "uuid" }
  ]
}
```

#### Get User Events
```http
GET /api/tracking/events?eventType=lesson_complete&limit=50&offset=0
Authorization: Bearer <token>
```

#### Get Event Counts
```http
GET /api/tracking/events/counts?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Active Session
```http
GET /api/tracking/session
Authorization: Bearer <token>
```

#### End Session
```http
POST /api/tracking/session/end
Authorization: Bearer <token>
```

### Dashboards

#### Get Student Dashboard
```http
GET /api/dashboard/student
Authorization: Bearer <token>
```

Returns:
```json
{
  "data": {
    "overview": {
      "engagementScore": 78.5,
      "healthScore": 82.3,
      "totalTimeMinutes": 1440,
      "coursesEnrolled": 5,
      "coursesCompleted": 2,
      "lessonsCompleted": 45,
      "streakDays": 7,
      "longestStreak": 14
    },
    "activeCourses": [...],
    "recentActivity": [...],
    "streakCalendar": [...],
    "weeklyTrend": [...]
  }
}
```

#### Get Instructor Dashboard
```http
GET /api/dashboard/instructor
Authorization: Bearer <token>
```

#### Get Admin Dashboard
```http
GET /api/dashboard/admin
Authorization: Bearer <token>
```

#### Get Time Series Data
```http
GET /api/dashboard/timeseries?metric=active_users&startDate=2024-01-01&endDate=2024-12-31&granularity=day
Authorization: Bearer <token>
```

Supported metrics:
- `active_users` - Daily/weekly/monthly active users
- `total_events` - Total event count
- `lesson_completions` - Lesson completion count
- `course_enrollments` - New enrollments
- `learning_time` - Total learning time

#### Get Comparison Data
```http
GET /api/dashboard/comparison?days=30
Authorization: Bearer <token>
```

### Analytics

#### Get User Analytics
```http
GET /api/analytics/user
Authorization: Bearer <token>
```

Returns:
```json
{
  "data": {
    "engagementScore": 78.5,
    "healthScore": 82.3,
    "streakDays": 7,
    "longestStreak": 14,
    "completionRate": 40.0,
    "learningVelocity": 3.5,
    "timeMetrics": {
      "totalMinutes": 1440,
      "avgSessionMinutes": 45.2,
      "avgDailyMinutes": 60.5,
      "peakHour": 19
    },
    "trends": {
      "engagementTrend": 1,
      "performanceTrend": 0
    }
  }
}
```

#### Get Course Analytics
```http
GET /api/analytics/course/:courseId
Authorization: Bearer <token>
```

#### Get Learning Insights
```http
GET /api/analytics/course/:courseId/insights
Authorization: Bearer <token>
```

Returns:
```json
{
  "data": {
    "metrics": {...},
    "insights": [
      {
        "type": "warning",
        "title": "At Risk",
        "message": "You may need additional support...",
        "suggestions": [
          "Review difficult concepts",
          "Increase study frequency"
        ]
      }
    ],
    "estimatedCompletionDate": "2024-06-15T00:00:00Z",
    "predictedSuccessRate": 75.5
  }
}
```

#### Get Learning Path Recommendations
```http
GET /api/analytics/course/:courseId/recommendations
Authorization: Bearer <token>
```

#### Update Learning Metrics
```http
POST /api/analytics/course/:courseId/metrics/update
Authorization: Bearer <token>
```

#### Get Retention Metrics
```http
GET /api/analytics/retention?days=30
Authorization: Bearer <token>
```

#### Get At-Risk Users
```http
GET /api/analytics/at-risk?healthScore=40&engagementScore=30
Authorization: Bearer <token>
```

## WebSocket

### Connect to Real-time Analytics

```javascript
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:4006/ws/analytics?token=${token}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connected':
      console.log('Connected to analytics service');
      break;
      
    case 'metric_update':
      console.log(`Metric ${message.metric} updated:`, message.data);
      updateDashboard(message.metric, message.data);
      break;
      
    case 'alert':
      console.log('Alert:', message.title, message.message);
      showAlert(message);
      break;
  }
};

// Subscribe to metrics
ws.send(JSON.stringify({
  type: 'subscribe',
  metrics: ['engagement_score', 'health_score', 'active_session']
}));

// Request immediate update
ws.send(JSON.stringify({
  type: 'request_update',
  metric: 'engagement_score'
}));

// Unsubscribe
ws.send(JSON.stringify({
  type: 'unsubscribe',
  metrics: ['active_session']
}));
```

## Event Types

```typescript
type EventType =
  // Page Navigation
  | 'page_view' | 'course_view' | 'lesson_view'
  
  // Learning Actions
  | 'lesson_start' | 'lesson_complete' | 'module_complete'
  | 'course_enroll' | 'course_complete'
  
  // Assessment Events
  | 'assessment_start' | 'assessment_submit' | 'assessment_complete'
  | 'quiz_attempt'
  
  // Content Interaction
  | 'video_play' | 'video_pause' | 'video_complete'
  | 'code_run' | 'code_submit'
  
  // IDE Events
  | 'ide_open' | 'ide_save' | 'ide_execute'
  
  // Social Events
  | 'comment_create' | 'comment_reply' | 'discussion_view'
  
  // Search and Discovery
  | 'search' | 'filter_apply' | 'course_preview'
  
  // Other
  | 'login' | 'logout' | 'error' | 'feedback_submit';
```

## Metrics Explained

### Engagement Score (0-100)

Calculated based on:
- **Session frequency** (25%) - How often the user learns
- **Time spent** (25%) - Total learning time
- **Event count** (25%) - Number of interactions
- **Lesson completions** (25%) - Completed lessons

Formula:
```typescript
engagementScore = 
  min(sessionCount * 2, 25) +
  min(totalMinutes / 10, 25) +
  min(eventCount / 5, 25) +
  min(lessonsCompleted * 5, 25)
```

### Health Score (0-100)

Calculated based on:
- **Engagement score** (40%) - Overall activity level
- **Completion rate** (20%) - % of enrolled courses completed
- **Streak days** (20%) - Consecutive learning days
- **Assessment performance** (20%) - Average assessment scores

Formula:
```typescript
healthScore = 
  engagementScore * 0.4 +
  completionRate * 0.2 +
  min(streakDays * 2, 20) +
  avgAssessmentScore * 0.2
```

### Learning Velocity

Lessons completed per week over the last 4 weeks:
```typescript
velocity = totalLessonsCompleted / 4
```

### Predicted Success Rate (0-100)

ML-inspired prediction of course completion likelihood:
- **Progress** (30%) - Current completion percentage
- **Engagement** (30%) - Engagement score
- **Performance** (20%) - Assessment scores
- **Velocity** (20%) - Learning pace

### Trends

Trend indicators compare last 7 days vs previous 7 days:
- **+1**: Improving (>10% increase)
- **0**: Stable (±10%)
- **-1**: Declining (>10% decrease)

## Frontend Integration

### Track Events

```typescript
import { trackEvent } from '@/api/analytics.api';

// Track page view
await trackEvent({
  eventType: 'page_view',
  pageUrl: window.location.href,
});

// Track lesson completion
await trackEvent({
  eventType: 'lesson_complete',
  courseId: 'course-uuid',
  lessonId: 'lesson-uuid',
  properties: {
    timeSpent: 1200,
    score: 95,
  },
});
```

### Load Dashboard

```typescript
import { getStudentDashboard } from '@/api/analytics.api';

const response = await getStudentDashboard();
const dashboard = response.data.data;

console.log('Engagement:', dashboard.overview.engagementScore);
console.log('Health:', dashboard.overview.healthScore);
console.log('Streak:', dashboard.overview.streakDays);
```

### Real-time Updates

```typescript
import { connectAnalyticsWebSocket, subscribeToMetrics } from '@/api/analytics.api';

const ws = connectAnalyticsWebSocket(token, (message) => {
  if (message.type === 'metric_update') {
    setMetric(message.metric, message.data);
  }
});

subscribeToMetrics(ws, [
  'engagement_score',
  'health_score',
  'active_session',
]);
```

## Performance Optimization

### Materialized Views

Refresh materialized views for fast dashboard queries:

```bash
# Manual refresh
psql $DATABASE_URL -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_users_30d"

# Or use the function
psql $DATABASE_URL -c "SELECT refresh_analytics_views()"
```

Schedule with cron (recommended every 15 minutes):
```bash
*/15 * * * * psql $DATABASE_URL -c "SELECT refresh_analytics_views()"
```

### Event Batching

Events are automatically batched in memory:
- Batch size: 100 events (configurable via `BATCH_SIZE`)
- Flush interval: 5 seconds (configurable via `BATCH_INTERVAL_MS`)

### Session Management

- Sessions auto-expire after 30 minutes of inactivity
- Cleanup runs every 5 minutes
- Graceful shutdown flushes all pending events

## Monitoring

### Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "service": "analytics-service",
  "database": "connected",
  "websocket": {
    "totalConnections": 42,
    "connectedUsers": 38,
    "subscriptionCount": 156
  },
  "timestamp": "2024-03-10T12:34:56.789Z"
}
```

### Database Queries

Monitor slow queries:
```sql
-- Top 10 slowest queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Event Tracking Stats

```sql
-- Events per hour (last 24 hours)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as events
FROM events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Most common event types
SELECT 
  event_type,
  COUNT(*) as count
FROM events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;
```

## Troubleshooting

### Events not being tracked

**Check event batch:**
```bash
# Events are batched in memory - check if they're flushing
tail -f logs/analytics.log | grep "Flushed"
```

**Force flush on shutdown:**
- Press Ctrl+C gracefully
- Service will flush remaining events before exit

### Dashboard loading slowly

**Refresh materialized views:**
```bash
psql $DATABASE_URL -c "SELECT refresh_analytics_views()"
```

**Check query performance:**
```sql
EXPLAIN ANALYZE 
SELECT * FROM user_analytics WHERE user_id = 'uuid';
```

**Add missing indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_events_user_created 
  ON events(user_id, created_at DESC);
```

### WebSocket not connecting

**Check token:**
- JWT must be valid and not expired
- Token passed as query parameter: `?token=...`

**Check CORS:**
- Verify `FRONTEND_URL` in `.env`
- WebSocket origin must match

### Database connection issues

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT NOW()"
```

**Check connection pool:**
```sql
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections
FROM pg_stat_activity
WHERE datname = 'techlearn_analytics';
```

## Development

### Run Tests

```bash
npm test
```

### Database Migrations

For schema changes:
1. Modify `src/db/schema.sql`
2. Create migration script
3. Run: `npm run db:migrate`

### Add New Event Type

1. Add to `event_type` enum in `schema.sql`
2. Update TypeScript types in `event-tracking.service.ts`
3. Add icon mapping in frontend

### Add New Metric

1. Create calculation function in `metrics.service.ts`
2. Add database column if storing
3. Update dashboard services
4. Add WebSocket subscription support

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `JWT_SECRET` (strong random value)
- [ ] Set `DATABASE_URL` with connection pooling
- [ ] Configure `REDIS_HOST` and `REDIS_PORT`
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring (DataDog, New Relic)
- [ ] Configure log aggregation (ELK, Splunk)
- [ ] Set up alerts (PagerDuty)
- [ ] Schedule materialized view refresh (cron)
- [ ] Set up database backups
- [ ] Configure connection pooling (pgBouncer)
- [ ] Enable database query logging
- [ ] Set up Redis persistence

### Scaling

**Horizontal Scaling:**
- Run multiple service instances behind load balancer
- Use sticky sessions for WebSocket connections
- Share Redis for session coordination
- Use connection pooler (pgBouncer) for database

**Vertical Scaling:**
- Increase batch size for events
- Add database read replicas
- Enable Redis clustering
- Optimize materialized view refresh frequency

### Performance Tuning

**Database:**
```sql
-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '4GB';

-- Increase effective cache size
ALTER SYSTEM SET effective_cache_size = '12GB';

-- Enable parallel query
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
```

**Application:**
```env
# Increase batch size
BATCH_SIZE=500
BATCH_INTERVAL_MS=10000

# Adjust session timeout
SESSION_TIMEOUT_MINUTES=60
```

## License

Proprietary - TechLearn LMS Platform
