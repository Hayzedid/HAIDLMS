# Backend Testing Guide

Complete testing guide for the newly implemented backend features:
- **Peer Code Review System** (23 endpoints)
- **Learning Health Dashboard** (9 endpoints)
- **Clipboard & Keystroke Tracking** (16 endpoints)

---

## 📋 Prerequisites

### 1. Database Setup

Each service requires its database schema to be loaded:

```bash
# Course Service (Peer Review)
psql -U postgres -d techlearn_course -f Backend/services/course-service/src/db/peer-review-schema.sql

# IDE Service (Clipboard & Keystroke)
psql -U postgres -d techlearn_ide -f Backend/services/ide-service/src/db/clipboard-keystroke-schema.sql

# Analytics Service (Learning Health)
# Uses existing schema - no new tables needed
```

### 2. Verify Database Schema

Run the verification script to ensure all tables exist:

```bash
psql -U postgres -d techlearn_course -f Backend/verify-database.sql
psql -U postgres -d techlearn_ide -f Backend/verify-database.sql
psql -U postgres -d techlearn_analytics -f Backend/verify-database.sql
```

Expected output:
```
✅ review_rubrics exists
✅ rubric_criteria exists
✅ code_reviews exists
...
```

### 3. Environment Variables

Ensure services have required environment variables:

**course-service/.env**:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/techlearn_course
COURSE_SERVICE_PORT=4002
```

**ide-service/.env**:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/techlearn_ide
IDE_SERVICE_PORT=4003
```

**analytics-service/.env**:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/techlearn_analytics
PORT=4006
COURSE_SERVICE_URL=http://localhost:4002
IDE_SERVICE_URL=http://localhost:4003
NOTIFICATION_SERVICE_URL=http://localhost:4004
```

### 4. Install Dependencies

```bash
# Course service
cd Backend/services/course-service
npm install

# IDE service
cd Backend/services/ide-service
npm install

# Analytics service
cd Backend/services/analytics-service
npm install
```

---

## 🚀 Starting Services

Open 3 terminal windows:

**Terminal 1: Course Service**
```bash
cd Backend/services/course-service
npm run dev
```

**Terminal 2: IDE Service**
```bash
cd Backend/services/ide-service
npm run dev
```

**Terminal 3: Analytics Service**
```bash
cd Backend/services/analytics-service
npm run dev
```

Verify all services are running:
```bash
curl http://localhost:4002/health  # Course service
curl http://localhost:4003/health  # IDE service
curl http://localhost:4006/health  # Analytics service
```

---

## 🧪 Testing Methods

### Option 1: Automated Test Script (Recommended)

Run the Node.js test script:

```bash
cd Backend
node test-backend.js
```

This will:
- ✅ Test all health endpoints
- ✅ Test peer review CRUD operations
- ✅ Test learning health dashboard endpoints
- ✅ Test clipboard & keystroke tracking
- ✅ Generate a summary report

Expected output:
```
╔═══════════════════════════════════════════════════════════╗
║  Backend API Testing Suite                                ║
║  Testing: Peer Review & Learning Health Dashboard         ║
╚═══════════════════════════════════════════════════════════╝

🏥 Testing Health Checks...
  ✅ PASS - course-service health check
      Status: healthy
  ✅ PASS - ide-service health check
      Status: healthy
  ✅ PASS - analytics-service health check
      Status: healthy

📝 Testing Peer Review API...
  ✅ PASS - Create review rubric
      Rubric ID: 123e4567-e89b-12d3-a456-426614174000
  ✅ PASS - Get course rubrics
      Found 1 rubrics
  ...

╔═══════════════════════════════════════════════════════════╗
║  Test Results Summary                                     ║
╚═══════════════════════════════════════════════════════════╝
✅ Passed:  32
❌ Failed:  0
⏭️  Skipped: 3
📊 Total:   35

Success Rate: 100.0%
```

### Option 2: REST Client (VS Code Extension)

1. Install **REST Client** extension in VS Code
2. Open `Backend/test-api-endpoints.http`
3. Click "Send Request" above any request

### Option 3: Postman

1. Import `Backend/test-api-endpoints.http` into Postman
2. Set variables:
   - `baseUrl`: http://localhost
   - `courseServicePort`: 4002
   - `ideServicePort`: 4003
   - `analyticsServicePort`: 4006
3. Run collection

### Option 4: cURL Commands

```bash
# Test peer review - Create rubric
curl -X POST http://localhost:4002/api/peer-review/rubrics \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "00000000-0000-0000-0000-000000000001",
    "name": "Python Code Review Rubric",
    "minReviewsRequired": 2
  }'

# Test learning health - Get health score
curl http://localhost:4006/api/learning-health/users/USER_ID/courses/COURSE_ID/health-score

# Test clipboard tracking - Log attempt
curl -X POST http://localhost:4003/api/clipboard/log-attempt \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "sessionId": "SESSION_ID",
    "attemptType": "paste",
    "source": "keyboard_shortcut",
    "blocked": true,
    "detectedBy": "clipboard_api"
  }'
```

---

## 📊 API Endpoint Reference

### Peer Code Review System (23 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/peer-review/rubrics` | Create rubric |
| GET | `/api/peer-review/rubrics/:id` | Get rubric |
| GET | `/api/peer-review/courses/:courseId/rubrics` | Get course rubrics |
| POST | `/api/peer-review/rubrics/:id/criteria` | Create criterion |
| GET | `/api/peer-review/rubrics/:id/criteria` | Get criteria |
| POST | `/api/peer-review/rubrics/:id/assign` | Assign reviewers |
| GET | `/api/peer-review/reviewers/:userId/assignments` | Get assignments |
| POST | `/api/peer-review/reviews/:id/start` | Start review |
| POST | `/api/peer-review/reviews/:id/scores` | Submit score |
| POST | `/api/peer-review/reviews/:id/comments` | Add comment |
| GET | `/api/peer-review/reviews/:id/comments` | Get comments |
| POST | `/api/peer-review/reviews/:id/submit` | Submit review |
| GET | `/api/peer-review/reviews/:id` | Get review |
| GET | `/api/peer-review/submissions/:id/reviews` | Get submission reviews |
| GET | `/api/peer-review/reviewers/:userId/stats` | Get reviewer stats |
| POST | `/api/peer-review/reviews/:id/rate` | Rate helpfulness |
| POST | `/api/peer-review/reviews/:id/dispute` | Create dispute |
| GET | `/api/peer-review/disputes` | Get disputes |
| POST | `/api/peer-review/disputes/:id/resolve` | Resolve dispute |
| GET | `/api/peer-review/pending-reviews` | Get pending reviews |
| GET | `/api/peer-review/awaiting-reviews` | Get awaiting reviews |
| GET | `/api/peer-review/high-quality-reviewers` | Get top reviewers |

### Learning Health Dashboard (9 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learning-health/users/:userId/courses/:courseId/health-score` | Get health score |
| GET | `/api/learning-health/users/:userId/courses/:courseId/component-breakdown` | Component details |
| GET | `/api/learning-health/courses/:courseId/at-risk-learners` | At-risk list |
| GET | `/api/learning-health/users/:userId/courses/:courseId/instructor-nudge` | Generate nudge |
| GET | `/api/learning-health/courses/:courseId/dashboard-summary` | Dashboard summary |
| POST | `/api/learning-health/users/:userId/courses/:courseId/update-health-score` | Update score |
| POST | `/api/learning-health/courses/:courseId/batch-update` | Batch update |
| GET | `/api/learning-health/users/:userId/courses/:courseId/trends` | Health trends |
| GET | `/api/learning-health/courses/:courseId/interventions` | Interventions |

### Clipboard & Keystroke Tracking (16 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clipboard/log-attempt` | Log attempt |
| GET | `/api/clipboard/session/:sessionId` | Get session attempts |
| GET | `/api/clipboard/assessment/:assessmentId` | Get assessment attempts |
| GET | `/api/clipboard/stats/:userId` | Get user stats |
| POST | `/api/keystroke/start-session` | Start session |
| POST | `/api/keystroke/end-session/:sessionId` | End session |
| POST | `/api/keystroke/log-events` | Log events (batch) |
| GET | `/api/keystroke/session/:sessionId` | Get session |
| GET | `/api/keystroke/events/:sessionId` | Get events |
| GET | `/api/keystroke/patterns/:userId` | Get typing patterns |
| GET | `/api/keystroke/integrity-concerns` | Get concerns |
| GET | `/api/keystroke/pattern-deviations` | Get deviations |
| POST | `/api/keystroke/flag-session` | Flag session |
| GET | `/api/keystroke/integrity-flags` | Get flags |
| POST | `/api/keystroke/review-flag/:flagId` | Review flag |

---

## 🔍 Testing Checklist

### Peer Review System
- [ ] Create a review rubric
- [ ] Add criteria to rubric
- [ ] Assign reviewers using round-robin algorithm
- [ ] Start a review
- [ ] Submit criterion scores
- [ ] Add line comments
- [ ] Submit complete review
- [ ] Rate review helpfulness
- [ ] Create a dispute
- [ ] Resolve dispute
- [ ] View pending reviews
- [ ] View high-quality reviewers

### Learning Health Dashboard
- [ ] Calculate health score for a user
- [ ] View component breakdown
- [ ] Get at-risk learners list
- [ ] Generate instructor nudge
- [ ] View dashboard summary
- [ ] Batch update health scores

### Clipboard & Keystroke Tracking
- [ ] Log clipboard paste attempt
- [ ] Get clipboard statistics
- [ ] Start keystroke session
- [ ] Log keystroke events
- [ ] End session
- [ ] Get typing patterns
- [ ] Flag session for review
- [ ] View integrity flags

---

## 🐛 Troubleshooting

### Service Won't Start

**Error**: `ECONNREFUSED` or port already in use
```bash
# Check what's using the port
lsof -i :4002  # or :4003, :4006

# Kill process if needed
kill -9 <PID>
```

### Database Connection Failed

**Error**: `connection refused` or `role does not exist`
```bash
# Check PostgreSQL is running
pg_isready

# Create databases if missing
createdb techlearn_course
createdb techlearn_ide
createdb techlearn_analytics

# Load schemas
psql -d techlearn_course -f Backend/services/course-service/src/db/peer-review-schema.sql
```

### Tables Don't Exist

**Error**: `relation "review_rubrics" does not exist`
```bash
# Run schema files in correct order
cd Backend/services/course-service/src/db
psql -d techlearn_course -f schema.sql
psql -d techlearn_course -f peer-review-schema.sql
```

### External Service Unavailable (Learning Health)

**Error**: `Failed to get health score`

This is expected if dependent services aren't running. Learning Health Dashboard requires:
- course-service (video accountability, peer reviews)
- ide-service (clipboard, keystroke)
- notification-service (spaced repetition)

Start all services or mock the responses.

---

## 📈 Expected Test Results

### With All Services Running
- **Pass Rate**: 90-100%
- **Failed**: 0-3 (usually integration-dependent endpoints)
- **Skipped**: 2-5 (tests requiring prior data)

### With Only Core Services Running
- **Pass Rate**: 70-80%
- **Failed**: 5-10 (learning health endpoints)
- **Skipped**: 2-5

---

## 🎯 Next Steps

After testing backend:

1. **Load Test Data**: Create sample courses, users, submissions
2. **Test Authentication**: Add JWT token generation
3. **Frontend Integration**: Connect UI components to these APIs
4. **End-to-End Testing**: Test complete workflows
5. **Performance Testing**: Test with concurrent requests

---

## 📚 Additional Resources

- **API Documentation**: See `Backend/test-api-endpoints.http` for all request examples
- **Database Schema**: See `*-schema.sql` files in each service
- **Service Documentation**: See README.md in each service directory
- **Implementation Status**: See `IMPLEMENTATION_STATUS_REPORT.md`
