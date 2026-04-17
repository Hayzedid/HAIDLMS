# Integrity Service

Academic integrity and accountability system for TechLearn LMS. Prevents cheating, detects plagiarism, and ensures learner authenticity.

## Features

### 🎥 Active Video Accountability
- **Watch Detection**: Tracks active viewing vs idle time
- **Seek Restriction**: Prevents video skipping forward
- **Tab Monitoring**: Detects when learners leave the video
- **Comprehension Checkpoints**: Mini-quiz interrupts to verify understanding
- **Completion Verification**: Requires 85% watch time to pass

### 👁️ Live Proctored Assessments
- **Webcam Monitoring**: Captures periodic face snapshots
- **Screen Recording**: Records the assessment session
- **Browser Lockdown**: Prevents tab switching and new windows
- **Multiple Face Detection**: Flags sessions with unauthorized persons
- **Suspicious Behavior Tracking**: Automated red flags
- **Manual Review Interface**: Proctor dashboard for flagged sessions

### ⌨️ IDE Keystroke Recorder
- **Full Typing Capture**: Records every keystroke with timestamps
- **Replay Functionality**: Review code evolution over time
- **Copy-Paste Detection**: Flags excessive pasting
- **Typing Pattern Analysis**: Detects unusual typing speeds
- **Code Evolution Tracking**: Snapshots at regular intervals
- **Suspicious Pattern Flagging**: AI-based anomaly detection

### 🔍 Code Plagiarism Detection
- **Similarity Analysis**: Levenshtein distance algorithm
- **Cross-Cohort Comparison**: Checks against all submissions
- **Code Normalization**: Removes comments, whitespace for true comparison
- **AI Signature Detection**: Builds coding style fingerprints
- **External Source Matching**: GitHub/StackOverflow comparison (planned)
- **MOSS Integration**: Stanford's plagiarism detection (planned)

### 🔐 Biometric Identity Verification
- **Face Recognition**: Verifies identity before assessments
- **Photo ID Matching**: Compares live photo with stored ID
- **Periodic Re-verification**: Challenge questions during long exams
- **Profile Management**: Secure storage of biometric data
- **Match Score Threshold**: 60% confidence required

### 📊 Learner Accountability Dashboard
- **Integrity Score**: 0-100 score across all dimensions
- **Risk Level**: Low, Medium, High, Critical classification
- **Violation History**: Complete audit trail
- **Behavioral Flags**: Pattern-based red flags
- **Score Breakdown**: Video, Proctoring, Plagiarism, Behavior
- **Leaderboard**: Top integrity performers

## Tech Stack

- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Face Recognition**: face-api.js + TensorFlow.js
- **Image Processing**: Sharp
- **Text Similarity**: string-similarity
- **Validation**: Zod

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- (Optional) Redis for caching

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
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn_integrity
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
```

### 3. Initialize Database

```bash
npm run db:init
```

This creates:
- 20+ tables for all integrity features
- Functions for score calculation
- Views for flagged users
- Triggers for automatic updates

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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  Video     │  │  Proctored │  │  Code Editor       │  │
│  │  Player    │  │  Exam      │  │  with Tracking     │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬─────────────┘  │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼──────────────┐
│              Integrity Service (Express)                    │
│  ┌───────────────────┐  ┌──────────────────────────────┐  │
│  │ Video             │  │  Proctoring Service          │  │
│  │ Accountability    │  │  - Webcam capture            │  │
│  │ Service           │  │  - Face detection            │  │
│  │ - Watch tracking  │  │  - Event logging             │  │
│  │ - Checkpoints     │  └──────────────────────────────┘  │
│  └───────────────────┘                                     │
│                         ┌──────────────────────────────┐  │
│  ┌───────────────────┐  │  Plagiarism Service          │  │
│  │ Keystroke         │  │  - Code comparison           │  │
│  │ Service           │  │  - Similarity detection      │  │
│  │ - Event capture   │  │  - Pattern analysis          │  │
│  │ - Replay          │  └──────────────────────────────┘  │
│  └───────────────────┘                                     │
│                         ┌──────────────────────────────┐  │
│  ┌───────────────────┐  │  Biometric Service           │  │
│  │ Integrity Score   │  │  - Face verification         │  │
│  │ Service           │  │  - Profile management        │  │
│  │ - Score calc      │  │  - Match scoring             │  │
│  │ - Violations      │  └──────────────────────────────┘  │
│  └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────┐
│                       PostgreSQL                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │Video Sessions│  │Proctoring Sess│  │Keystroke Sess   │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Submissions │  │Biometric Prof │  │Integrity Scores │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

**video_watch_sessions** - Video viewing sessions
- Tracks watch time, completion %, violations
- Links to course/lesson

**video_watch_events** - Granular video events
- play, pause, seek, tab_blur, etc.
- Timestamp and position tracking

**comprehension_checkpoints** - Quiz interrupts
- Question, options, correct answer
- Tied to video timestamp

**proctoring_sessions** - Exam monitoring sessions
- Webcam/screen recording flags
- Suspicious event counts
- Violation logs

**proctoring_events** - Proctoring incidents
- Face detected, multiple faces, tab switch, etc.
- Severity: info, warning, critical

**face_snapshots** - Periodic face captures
- Image URL, face count, confidence
- Face encodings for matching

**biometric_profiles** - User identity data
- Photo ID, profile photo
- Face encodings, verification status

**keystroke_sessions** - Code typing sessions
- Total keystrokes, paste count
- Typing speed, pause patterns
- Suspicious flag

**keystroke_events** - Individual keystrokes
- Key, timestamp, cursor position
- Line/column number

**code_submissions** - Submitted code
- Code, language, file name
- Plagiarism status, similarity score

**plagiarism_matches** - Detected similarities
- Submission pair, similarity score
- Matching lines, algorithm used

**code_patterns** - Coding style signatures
- Variable/function naming patterns
- Indentation style, line length
- Comment frequency

**integrity_scores** - Overall user scores
- Overall, video, proctoring, plagiarism, behavior scores
- Violations count, risk level

**violation_logs** - All violations
- Type, severity, description
- Score penalty, related session

## API Endpoints

### Video Accountability

```http
POST   /api/video/sessions          # Start video session
POST   /api/video/events             # Track video event
PUT    /api/video/sessions/:id/end  # End session
GET    /api/video/sessions/:id      # Get session details
GET    /api/video/users/:userId     # Get user's sessions

POST   /api/video/checkpoints        # Create checkpoint
GET    /api/video/checkpoints/:lessonId  # Get lesson checkpoints
POST   /api/video/checkpoints/response   # Submit answer
```

### Proctoring

```http
POST   /api/proctoring/sessions      # Start proctored exam
POST   /api/proctoring/events        # Track proctoring event
PUT    /api/proctoring/sessions/:id/end  # End exam
POST   /api/proctoring/snapshots     # Save face snapshot
GET    /api/proctoring/sessions/:id  # Get session details
GET    /api/proctoring/flagged       # Get flagged sessions
PUT    /api/proctoring/review/:id    # Update proctor review
```

### Keystroke Recording

```http
POST   /api/keystroke/sessions       # Start typing session
POST   /api/keystroke/events         # Track keystroke
POST   /api/keystroke/snapshots      # Save code snapshot
PUT    /api/keystroke/sessions/:id/end  # End session
GET    /api/keystroke/sessions/:id   # Get session
GET    /api/keystroke/sessions/:id/replay  # Get replay data
GET    /api/keystroke/suspicious     # Get flagged sessions
```

### Plagiarism Detection

```http
POST   /api/plagiarism/submit        # Submit code
POST   /api/plagiarism/check/:id     # Run plagiarism check
GET    /api/plagiarism/submissions/:id  # Get submission
GET    /api/plagiarism/matches/:id   # Get plagiarism matches
GET    /api/plagiarism/flagged       # Get flagged submissions
PUT    /api/plagiarism/review/:id    # Update review
```

### Biometric Verification

```http
POST   /api/biometric/profile        # Create/update profile
POST   /api/biometric/verify         # Verify face
GET    /api/biometric/profile/:userId  # Get profile
GET    /api/biometric/attempts/:userId  # Get verification attempts
PUT    /api/biometric/verify/:userId    # Admin verify profile
```

### Integrity Scores

```http
GET    /api/integrity/score/:userId  # Get user score
POST   /api/integrity/recalculate/:userId  # Recalculate score
GET    /api/integrity/violations/:userId   # Get violations
POST   /api/integrity/violation      # Log violation
GET    /api/integrity/flagged        # Get flagged users
GET    /api/integrity/leaderboard    # Get top performers
```

## Usage Examples

### Video Accountability

```typescript
// Start video session
const session = await fetch('/api/video/sessions', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    courseId: 'uuid',
    lessonId: 'uuid',
    videoUrl: 'https://...',
    videoDuration: 600 // seconds
  })
});

// Track events
await fetch('/api/video/events', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: session.id,
    eventType: 'play',
    timestampMs: 5000,
    durationMs: 2000
  })
});

// End session
await fetch(`/api/video/sessions/${session.id}/end`, {
  method: 'PUT'
});
```

### Live Proctoring

```typescript
// Start proctored exam
const proctoringSession = await fetch('/api/proctoring/sessions', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    assessmentId: 'uuid',
    assessmentType: 'exam',
    webcamEnabled: true,
    screenRecordingEnabled: true,
    browserLockdownEnabled: true,
    faceVerificationRequired: true
  })
});

// Track events
await fetch('/api/proctoring/events', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: proctoringSession.id,
    eventType: 'tab_switch',
    severity: 'warning',
    description: 'User switched tabs'
  })
});

// Save face snapshot
await fetch('/api/proctoring/snapshots', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: proctoringSession.id,
    userId: 'uuid',
    imageUrl: '/storage/snapshot.jpg',
    faceDetected: true,
    faceCount: 1,
    confidenceScore: 0.95
  })
});
```

### Keystroke Recording

```typescript
// Start keystroke session
const keystrokeSession = await fetch('/api/keystroke/sessions', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    assessmentId: 'uuid',
    problemId: 'uuid',
    language: 'python'
  })
});

// Track keystrokes
document.addEventListener('keydown', async (e) => {
  await fetch('/api/keystroke/events', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: keystrokeSession.id,
      eventType: 'keydown',
      key: e.key,
      timestampMs: Date.now(),
      cursorPosition: editor.getCursorPosition(),
      codeLength: editor.getValue().length
    })
  });
});

// End session
await fetch(`/api/keystroke/sessions/${keystrokeSession.id}/end`, {
  method: 'PUT',
  body: JSON.stringify({
    finalCode: editor.getValue()
  })
});
```

### Plagiarism Detection

```typescript
// Submit code for checking
const submission = await fetch('/api/plagiarism/submit', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    assessmentId: 'uuid',
    problemId: 'uuid',
    language: 'python',
    code: 'def hello():\n  print("hello")',
    keystrokeSessionId: 'uuid'
  })
});

// Check plagiarism
await fetch(`/api/plagiarism/check/${submission.id}`, {
  method: 'POST',
  body: JSON.stringify({
    checkExternal: true
  })
});

// Get matches
const matches = await fetch(`/api/plagiarism/matches/${submission.id}`);
```

### Biometric Verification

```typescript
// Create profile
await fetch('/api/biometric/profile', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    profilePhotoUrl: '/storage/profile.jpg',
    photoIdUrl: '/storage/id.jpg'
  })
});

// Verify face
const verification = await fetch('/api/biometric/verify', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    sessionId: 'uuid',
    imageData: 'base64_image_data',
    attemptType: 'initial'
  })
});

if (verification.verified) {
  // Allow access to exam
}
```

## Integrity Score Calculation

### Video Accountability Score (20%)
- Based on completion rate and violation count
- Penalties: Excessive seeking (-30%), low completion (-20%)

### Proctoring Score (30%)
- Based on flagged sessions and suspicious events
- Penalties: Flagged session (-50%), suspicious events (-5% each)

### Plagiarism Score (30%)
- Based on plagiarized and suspicious submissions
- Penalties: Plagiarized (-60%), suspicious (-20%)

### Behavior Score (20%)
- Based on all violations
- Penalties: Critical (-15%), Major (-5%), Minor (-1%)

### Risk Levels
- **Low**: Score > 85, no critical violations
- **Medium**: Score 70-85
- **High**: Score 50-70
- **Critical**: Score < 50 or any critical violation

## Security Best Practices

### Data Privacy
- Encrypt face encodings at rest
- Secure storage of images
- GDPR compliance for biometric data
- User consent for monitoring

### Access Control
- Role-based permissions for reviewing violations
- Audit logs for all admin actions
- Encrypted API communication

### Storage Management
- Regular cleanup of old snapshots
- Configurable retention periods
- Disk space monitoring

## Monitoring

### Key Metrics
- **Flagged sessions per day**
- **Plagiarism detection rate**
- **Average integrity score**
- **Violation frequency by type**
- **False positive rate**

### Alerts
- Multiple flagged sessions in short time
- Critical violations
- System errors (face detection failures)

## Troubleshooting

### Face Detection Not Working
1. Check webcam permissions
2. Verify TensorFlow.js models loaded
3. Check lighting conditions
4. Review confidence threshold settings

### High False Positive Rate
1. Adjust similarity thresholds
2. Review code normalization rules
3. Check for common library code
4. Tune typing speed thresholds

### Performance Issues
1. Enable Redis caching
2. Batch keystroke events
3. Optimize database indexes
4. Use connection pooling

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` with SSL
- [ ] Set `JWT_SECRET` (strong, random)
- [ ] Configure `OPENAI_API_KEY` for AI analysis
- [ ] Set up file storage (S3 or similar)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Configure log aggregation
- [ ] Database backups
- [ ] Test all integrity features
- [ ] Train admin/proctor staff
- [ ] Document incident response procedures

## License

Proprietary - TechLearn LMS Platform
