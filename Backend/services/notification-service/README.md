# Notification Service

Multi-channel notification delivery system with spaced repetition learning reminders for the TechLearn LMS platform.

## Features

- **Multi-Channel Delivery**: Email, Slack, In-App, Push, SMS
- **Email Service**: SendGrid integration with Handlebars templates
- **Slack Integration**: Rich message blocks via Webhooks
- **In-App Notifications**: Real-time WebSocket delivery
- **Spaced Repetition**: SM-2 algorithm for optimal review scheduling
- **Template System**: Versioned templates with variable substitution
- **Queue Management**: Bull + Redis for async job processing
- **User Preferences**: Granular control over notification channels
- **Quiet Hours**: Respect user's do-not-disturb settings
- **Notification Logs**: Track delivery status and analytics

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Queue**: Bull + Redis
- **Email**: SendGrid
- **WebSocket**: ws library
- **Templates**: Handlebars
- **Validation**: Zod

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- SendGrid API key (or AWS SES)
- Slack Webhook URLs (optional)

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
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn_notifications
REDIS_HOST=localhost
REDIS_PORT=6379
SENDGRID_API_KEY=SG.your-key-here
JWT_SECRET=your-secret-key
NOTIFICATION_SERVICE_PORT=4005
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=noreply@techlearn.com
```

### 3. Initialize Database

```bash
npm run db:init
```

This creates:
- 6 tables (notifications, notification_preferences, notification_templates, notification_logs, spaced_repetition_schedule, notification_queue_stats)
- Automatic triggers for statistics
- 11 default notification templates

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

### 5. Start Queue Worker

In a separate terminal:
```bash
npm run worker
```

This processes queued notifications in the background.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│  ┌──────────────┐  ┌─────────────────────────────┐    │
│  │Notification  │  │  Notification Preferences   │    │
│  │Bell & Center │  │  Settings Panel             │    │
│  └──────┬───────┘  └─────────────────────────────┘    │
└─────────┼──────────────────────────────────────────────┘
          │ HTTP/WebSocket
┌─────────▼──────────────────────────────────────────────┐
│         Notification Service (Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │Notification  │  │   Template   │  │   Spaced    │ │
│  │   Router     │  │   Manager    │  │ Repetition  │ │
│  └──────┬───────┘  └──────────────┘  └─────────────┘ │
│         │                                              │
│  ┌──────▼───────────────────────────────────────────┐ │
│  │    Bull Queue (Priority + Rate Limiting)         │ │
│  │  - notifications  - emails                       │ │
│  │  - slack          - spaced-repetition            │ │
│  └──────┬───────────────────────────────────────────┘ │
└─────────┼──────────────────────────────────────────────┘
          │
    ┌─────▼─────┐  ┌──────────┐  ┌────────────┐
    │  Workers  │  │   Redis  │  │ PostgreSQL │
    │(Background│  │  (Queue) │  │    (DB)    │
    │Processing)│  └──────────┘  └────────────┘
    └───────────┘
         │
    ┌────▼─────┐  ┌──────────┐  ┌────────────┐
    │ SendGrid │  │  Slack   │  │  In-App WS │
    └──────────┘  └──────────┘  └────────────┘
```

## API Endpoints

### Notification Management

#### Send Notification
```http
POST /api/notifications/send
Authorization: Bearer <token>

{
  "userId": "uuid",
  "type": "course_enrollment",
  "channel": "email",  // or ["email", "in_app", "slack"]
  "priority": "normal",
  "templateName": "course_enrollment_email",
  "templateVariables": {
    "userName": "John Doe",
    "courseName": "JavaScript Fundamentals",
    "courseUrl": "https://..."
  }
}
```

#### Broadcast to Multiple Users
```http
POST /api/notifications/broadcast
Authorization: Bearer <token>

{
  "userIds": ["uuid1", "uuid2", "uuid3"],
  "type": "announcement",
  "channel": ["email", "in_app"],
  "subject": "New Feature Released!",
  "body": "Check out our new code playground..."
}
```

#### Get In-App Notifications
```http
GET /api/notifications/in-app?limit=20&offset=0&includeRead=false
Authorization: Bearer <token>
```

#### Get Unread Count
```http
GET /api/notifications/in-app/unread-count
Authorization: Bearer <token>
```

#### Mark as Read
```http
POST /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
POST /api/notifications/in-app/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### User Preferences

#### Get Preferences
```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

#### Update Preferences
```http
PATCH /api/notifications/preferences
Authorization: Bearer <token>

{
  "emailEnabled": true,
  "slackEnabled": true,
  "inAppEnabled": true,
  "slackWebhookUrl": "https://hooks.slack.com/...",
  "quietHoursStart": "22:00:00",
  "quietHoursEnd": "08:00:00",
  "timezone": "America/New_York"
}
```

### Spaced Repetition

#### Initialize Schedule
```http
POST /api/spaced-repetition/schedules
Authorization: Bearer <token>

{
  "userId": "uuid",
  "contentId": "lesson-uuid",
  "contentType": "lesson"
}
```

#### Record Review
```http
POST /api/spaced-repetition/schedules/:scheduleId/review
Authorization: Bearer <token>

{
  "quality": 4  // 0-5 (SM-2 algorithm)
}
```

**Quality Scale:**
- 5 = Perfect response
- 4 = Correct after hesitation
- 3 = Correct with difficulty
- 2 = Incorrect but familiar
- 1 = Incorrect
- 0 = Complete blackout

#### Get Due Reviews
```http
GET /api/spaced-repetition/reviews/due
Authorization: Bearer <token>
```

#### Get Upcoming Reviews
```http
GET /api/spaced-repetition/reviews/upcoming?days=7
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/spaced-repetition/stats
Authorization: Bearer <token>
```

### Template Management

#### List Templates
```http
GET /api/templates
Authorization: Bearer <token>
```

#### Get Template by ID
```http
GET /api/templates/:id
Authorization: Bearer <token>
```

#### Create Template
```http
POST /api/templates
Authorization: Bearer <instructor-token>

{
  "name": "custom_template_email",
  "type": "course_update",
  "channel": "email",
  "subjectTemplate": "Update: {{courseName}}",
  "bodyTemplate": "<h2>Hi {{userName}},</h2><p>{{message}}</p>",
  "variables": [
    { "name": "userName", "description": "Student name", "required": true },
    { "name": "courseName", "description": "Course title", "required": true },
    { "name": "message", "description": "Update message", "required": true }
  ],
  "defaultPriority": "normal"
}
```

#### Test Template
```http
POST /api/templates/:id/test
Authorization: Bearer <instructor-token>

{
  "variables": {
    "userName": "Test User",
    "courseName": "Test Course",
    "message": "This is a test message"
  }
}
```

## WebSocket

### Connect to In-App Notifications

```javascript
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:4005/ws/notifications?token=${token}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connected':
      console.log('Connected to notification service');
      break;
      
    case 'notification':
      // New notification received
      console.log('New notification:', message.data);
      showNotification(message.data);
      break;
      
    case 'unread_count':
      // Unread count updated
      updateBadge(message.data.count);
      break;
  }
};

// Send messages
ws.send(JSON.stringify({
  type: 'mark_read',
  notificationId: 'notification-uuid'
}));

ws.send(JSON.stringify({
  type: 'mark_all_read'
}));
```

## Notification Types

```typescript
type NotificationType =
  | 'course_enrollment'     // User enrolled in course
  | 'lesson_completed'      // Lesson marked complete
  | 'assignment_due'        // Assignment deadline approaching
  | 'certificate_issued'    // Certificate earned
  | 'comment_reply'         // Reply to user's comment
  | 'course_update'         // Course content updated
  | 'announcement'          // Platform announcement
  | 'review_reminder'       // Generic review reminder
  | 'spaced_repetition'     // SM-2 scheduled review
  | 'payment_success'       // Payment processed
  | 'payment_failed'        // Payment failed
  | 'system_alert';         // System notification
```

## Channels

### Email (SendGrid)

- Template-based with Handlebars
- Bulk sending support (1000/batch)
- Delivery tracking
- Rate limiting: 100/sec

**Configuration:**
```env
SENDGRID_API_KEY=SG.your-key
EMAIL_FROM=noreply@techlearn.com
```

### Slack (Webhooks)

- Rich message blocks
- Action buttons
- Color-coded by type
- Rate limiting: 10/sec

**Per-user configuration:**
```json
{
  "slackWebhookUrl": "https://hooks.slack.com/services/...",
  "slackChannel": "#course-updates"
}
```

### In-App (WebSocket)

- Real-time delivery
- Unread count sync
- Mark as read support
- Persistent storage in DB

### Push Notifications (FCM)

Coming soon - placeholder implemented

### SMS (Twilio)

Coming soon - placeholder implemented

## Spaced Repetition (SM-2 Algorithm)

The service implements the SuperMemo SM-2 algorithm for optimal review scheduling:

**Algorithm:**
1. First repetition: 1 day
2. Second repetition: 6 days
3. Subsequent: I(n) = I(n-1) × EF

**Easiness Factor (EF):**
- Starts at 2.5
- Adjusted based on quality (0-5)
- Formula: EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
- Minimum: 1.3

**Quality < 3:**
- Resets to first repetition (1 day)
- Maintains adjusted EF

**Example Schedule:**
```
Review 1: Quality 4 → Next: 1 day  (EF: 2.5)
Review 2: Quality 5 → Next: 6 days (EF: 2.6)
Review 3: Quality 4 → Next: 15 days (EF: 2.7)
Review 4: Quality 3 → Next: 37 days (EF: 2.56)
```

## Template System

### Built-in Templates

11 default templates are created on initialization:

1. **course_enrollment_email** - Welcome email for new enrollment
2. **course_enrollment_in_app** - In-app enrollment notification
3. **lesson_completed_email** - Lesson completion email
4. **lesson_completed_in_app** - In-app completion notification
5. **certificate_issued_email** - Certificate earned email
6. **review_reminder_email** - Generic review reminder
7. **review_reminder_in_app** - In-app review reminder
8. **assignment_due_email** - Assignment deadline email
9. **payment_success_email** - Payment confirmation
10. **spaced_repetition_email** - SM-2 review reminder
11. **spaced_repetition_in_app** - In-app SM-2 reminder

### Handlebars Helpers

Custom helpers available in templates:

- `{{formatDate date}}` - Format date (e.g., "January 15, 2024")
- `{{formatTime date}}` - Format time (e.g., "02:30 PM")
- `{{uppercase str}}` - Convert to uppercase
- `{{lowercase str}}` - Convert to lowercase
- `{{truncate str length}}` - Truncate with ellipsis

**Example:**
```handlebars
<h2>Hi {{uppercase userName}},</h2>
<p>You completed <strong>{{courseName}}</strong> on {{formatDate completionDate}}.</p>
<p>{{truncate description 100}}</p>
```

## Queue Management

### Queue Types

**1. Notifications Queue**
- Routes notifications to appropriate channel queues
- Priority-based processing (urgent > high > normal > low)
- Retry logic: 3 attempts with exponential backoff

**2. Email Queue**
- SendGrid delivery
- Rate limit: 100/sec
- Retry: 3 attempts

**3. Slack Queue**
- Webhook delivery
- Rate limit: 10/sec
- Retry: 2 attempts

**4. Spaced Repetition Queue**
- Scheduled review reminders
- Exact timing delivery
- No retry (reschedules on failure)

### Queue Commands

```bash
# View queue stats
curl http://localhost:4005/api/admin/queue/stats

# Pause queue
curl -X POST http://localhost:4005/api/admin/queue/pause/emails

# Resume queue
curl -X POST http://localhost:4005/api/admin/queue/resume/emails

# Clean old jobs
curl -X POST http://localhost:4005/api/admin/queue/clean/emails
```

## User Preferences

Users can control:

**Channels:**
- Email enabled/disabled
- In-app enabled/disabled
- Slack enabled/disabled
- Push enabled/disabled
- SMS enabled/disabled

**Per-Type Preferences:**
```json
{
  "course_enrollment": { "email": true, "in_app": true, "slack": false },
  "lesson_completed": { "email": false, "in_app": true, "slack": false }
}
```

**Email Settings:**
- Digest mode (daily/weekly)
- Quiet hours (start/end time)
- Timezone

**Integrations:**
- Slack webhook URL
- Slack channel
- Phone number (SMS)

## Monitoring

### Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "service": "notification-service",
  "database": "connected",
  "websocket": {
    "connectedUsers": 42,
    "totalConnections": 57
  }
}
```

### Statistics

```http
GET /api/notifications/stats?startDate=2024-01-01&endDate=2024-12-31
```

Returns daily aggregated stats:
- Total queued/sent/delivered/failed
- Average delivery time
- Open/click rates (for supported channels)

## Troubleshooting

### Email not sending

**Check SendGrid configuration:**
```bash
curl -X POST http://localhost:4005/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

**Verify API key:**
- Log in to SendGrid dashboard
- Check API key permissions
- Ensure sender email is verified

### WebSocket not connecting

**Check token:**
- Ensure JWT is valid and not expired
- Token must be passed as query param: `?token=...`

**Check CORS:**
- Verify CORS settings in `index.ts`
- Frontend URL must match

### Queue not processing

**Check Redis:**
```bash
redis-cli ping  # Should return PONG
```

**Check worker:**
```bash
npm run worker  # Must be running
```

**View queue:**
```bash
redis-cli KEYS bull:*
```

### Database connection issues

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**Re-initialize:**
```bash
npm run db:init
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

### Add New Notification Type

1. Add to `notification_type` enum in `schema.sql`
2. Create template in `src/db/init.ts`
3. Add formatting in `slack.service.ts`
4. Update frontend icon mapping

### Add New Channel

1. Create service in `src/services/`
2. Add queue in `src/queues/notification.queue.ts`
3. Add worker in `src/workers/notification.worker.ts`
4. Update preferences schema

## Production Deployment

### Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `JWT_SECRET`
- [ ] Set `SENDGRID_API_KEY`
- [ ] Configure `DATABASE_URL`
- [ ] Configure `REDIS_HOST`
- [ ] Set `FRONTEND_URL`
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up monitoring (DataDog, New Relic)
- [ ] Configure log aggregation (ELK, Splunk)
- [ ] Set up alerts (PagerDuty)
- [ ] Scale workers (multiple instances)
- [ ] Configure Redis persistence
- [ ] Set up database backups
- [ ] Configure rate limiting at gateway level

### Scaling

**Horizontal Scaling:**
- Run multiple service instances behind load balancer
- Run multiple worker instances for queue processing
- Use Redis Cluster for queue distribution

**Vertical Scaling:**
- Increase worker concurrency
- Optimize database queries
- Add database indexes
- Enable Redis caching

## License

Proprietary - TechLearn LMS Platform
