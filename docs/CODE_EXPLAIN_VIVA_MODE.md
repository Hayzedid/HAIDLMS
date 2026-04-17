# Code Explain / Viva Mode

## Overview

The **Code Explain / Viva Mode** feature enables instructors to request asynchronous video explanations from students to verify code authorship and understanding. This anti-plagiarism measure requires students to record screen-captured videos explaining their code logic, design decisions, and implementation details.

## Why This Feature Matters

### The Plagiarism Problem

Traditional automated plagiarism detection tools like MOSS can identify code similarity, but they cannot definitively prove whether a student wrote the code themselves or copied it. Students can:
- Copy code from GitHub, Stack Overflow, or ChatGPT
- Pay others to complete assignments
- Share code with classmates
- Use sophisticated obfuscation techniques to evade detection

### The Solution: Viva Voce (Oral Examination)

Academic vivas have been used for centuries to verify student understanding. Our **Code Explain Mode** brings this proven method to the digital age by requiring students to:
1. Record a video of themselves explaining their code
2. Walk through their logic and design decisions step-by-step
3. Answer specific questions about their implementation
4. Demonstrate genuine understanding, not just recitation

Students who wrote the code themselves can easily explain it. Students who copied code will struggle to explain design decisions, edge cases, and why they chose specific approaches.

## Architecture

### Database Schema

```sql
-- Core table for viva requests
CREATE TABLE viva_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  problem_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  selection_type viva_selection_type NOT NULL,
  reason TEXT,
  instructions TEXT,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  status viva_request_status NOT NULL DEFAULT 'pending',
  video_url TEXT,
  video_duration_seconds INT,
  video_transcript TEXT,
  student_notes TEXT,
  reviewed_by UUID,
  explanation_score DECIMAL(5,2),
  comprehension_level VARCHAR(20),
  review_notes TEXT,
  authenticity_verified BOOLEAN,
  is_late BOOLEAN DEFAULT FALSE,
  is_incomplete BOOLEAN DEFAULT FALSE,
  requires_resubmit BOOLEAN DEFAULT FALSE
);

-- Configurable selection rules
CREATE TABLE viva_selection_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  problem_id UUID,
  random_percentage DECIMAL(5,2),
  plagiarism_threshold DECIMAL(5,4),
  min_similarity_score DECIMAL(5,4),
  deadline_hours INT NOT NULL DEFAULT 48
);

-- Notification queue for students
CREATE TABLE viva_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viva_request_id UUID NOT NULL REFERENCES viva_requests(id),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
);

-- Grading rubric
CREATE TABLE viva_rubric (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  criteria_name VARCHAR(200) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  description TEXT
);

-- Statistics for assessment-level insights
CREATE TABLE viva_statistics (
  assessment_id UUID PRIMARY KEY,
  total_requests INT DEFAULT 0,
  total_submitted INT DEFAULT 0,
  total_graded INT DEFAULT 0,
  total_expired INT DEFAULT 0,
  avg_submission_hours DECIMAL(6,2),
  avg_explanation_score DECIMAL(5,2),
  authenticity_verified_count INT
);
```

### Microservices

**Integrity Service** (`integrity-service`)
- Manages viva request lifecycle
- Handles video submission and review
- Calculates statistics and generates reports
- Enforces deadlines and marks expired requests

**Notification Service** (`notification-service`)
- Sends email/Slack notifications to students
- Sends deadline reminders
- Alerts instructors when videos are submitted

**Course Service** (`course-service`)
- Links viva requests to assessments and submissions
- Retrieves student/instructor information

## Selection Strategies

### 1. Random Selection

Randomly select a percentage of students to request explanations from. This creates uncertainty - students never know if they'll be selected, encouraging all students to write their own code.

**API Endpoint:**
```typescript
POST /api/viva/select/random
{
  "assessmentId": "uuid",
  "problemId": "uuid",
  "percentage": 20,
  "instructions": "Explain your solution to the linked list reversal problem...",
  "deadlineHours": 48
}
```

**Algorithm:**
```typescript
// Get all submissions without existing viva requests
const allSubmissions = await getSubmissions(assessmentId, problemId);
const eligibleSubmissions = allSubmissions.filter(s => !hasVivaRequest(s.id));

// Shuffle and select percentage
const shuffled = shuffle(eligibleSubmissions);
const selectCount = Math.ceil((shuffled.length * percentage) / 100);
const selected = shuffled.slice(0, selectCount);

// Create viva requests
for (const submission of selected) {
  await createVivaRequest({
    submissionId: submission.id,
    userId: submission.userId,
    selectionType: 'random',
    instructions,
    deadlineHours,
  });
}
```

**Use Cases:**
- Large classes where reviewing everyone is impractical
- Creating accountability without accusing specific students
- Establishing a culture of integrity

**Recommended Percentages:**
- 10-15%: Light touch, psychological deterrent
- 20-30%: Moderate accountability
- 50%+: High-stakes assessments

### 2. Flagged Selection

Automatically request explanations from students flagged by plagiarism detection (MOSS similarity > threshold).

**API Endpoint:**
```typescript
POST /api/viva/select/flagged
{
  "assessmentId": "uuid",
  "problemId": "uuid",
  "similarityThreshold": 0.75,
  "instructions": "Your submission was flagged for high similarity. Please explain your code...",
  "deadlineHours": 48
}
```

**Algorithm:**
```typescript
// Get flagged submissions
const flaggedSubmissions = await pool.query(`
  SELECT cs.id as submission_id, cs.user_id, cs.similarity_score
  FROM code_submissions cs
  WHERE cs.assessment_id = $1 
    AND cs.problem_id = $2
    AND cs.is_flagged = true
    AND cs.similarity_score >= $3
`, [assessmentId, problemId, similarityThreshold]);

// Create viva requests
for (const submission of flaggedSubmissions.rows) {
  await createVivaRequest({
    submissionId: submission.submission_id,
    userId: submission.user_id,
    selectionType: 'flagged',
    reason: `High similarity score (${Math.round(submission.similarity_score * 100)}%)`,
    instructions,
    deadlineHours,
  });
}
```

**Use Cases:**
- Following up on MOSS plagiarism detection
- Investigating suspicious submissions
- Giving students a chance to prove authorship

**Thresholds:**
- 0.60-0.70: Low confidence, may be coincidental
- 0.75-0.85: Medium confidence, likely copied
- 0.90+: High confidence, almost certainly plagiarized

### 3. Manual Selection

Instructors manually request explanations from specific students.

**API Endpoint:**
```typescript
POST /api/viva/requests
{
  "submissionId": "uuid",
  "userId": "uuid",
  "assessmentId": "uuid",
  "problemId": "uuid",
  "selectionType": "manual",
  "reason": "Unusual coding style for this student",
  "instructions": "Explain your approach to the dynamic programming solution...",
  "deadlineHours": 72
}
```

**Use Cases:**
- Investigating individual suspicions
- Following up on inconsistent work quality
- Verifying advanced solutions from novice students

### 4. All Students

Request explanations from all students (rare, but useful for high-stakes exams).

**Use Case:**
- Final exams worth 40%+ of grade
- Capstone projects
- Certification assessments

## Student Workflow

### 1. Notification

Students receive notifications via:
- Email: "You have been selected to explain your code for Assignment 3"
- In-app notification badge
- Dashboard alert with countdown timer

### 2. Dashboard View

Students see:
- Pending requests with due dates
- Overdue requests (highlighted in red)
- Instructions from instructor
- Tips for recording

### 3. Recording

**Recommended Tools:**
- OBS Studio (free, professional)
- Loom (easy, cloud-based)
- Zoom (record yourself)
- Native screen recording (macOS/Windows)

**Recording Checklist:**
- Show your screen with code visible
- Walk through your logic step-by-step
- Explain key design decisions
- Demonstrate your understanding of edge cases
- Answer the instructor's specific questions
- Keep it under 10 minutes (unless instructed otherwise)

### 4. Upload

Students upload video files:
- Max file size: 500MB
- Accepted formats: MP4, MOV, AVI, WebM
- Direct S3 upload with presigned URL
- Optional: Add text notes

### 5. Submission

After submission:
- Status changes to "submitted"
- Instructor is notified
- Student can view submission timestamp
- Late submissions are flagged

## Instructor Workflow

### 1. Selection

Instructor chooses selection strategy:
- Random: Click "Select 20% randomly"
- Flagged: Click "Select all flagged submissions"
- Manual: Click "Request from student X"

### 2. Configuration

Set parameters:
- Instructions: "Explain your approach to..."
- Deadline: 48 hours (configurable)
- Notification channels: Email + Slack

### 3. Review Dashboard

View pending reviews:
- List of submitted videos
- Student info, submission time, video duration
- Late submission indicators
- Flagged submission indicators

### 4. Video Review

Watch video and evaluate:
- **Explanation Score** (0-100): Overall quality of explanation
- **Comprehension Level** (poor/fair/good/excellent): Student's understanding
- **Review Notes**: Detailed feedback
- **Authenticity Verified**: Checkbox if student clearly wrote the code
- **Requires Resubmit**: If explanation was insufficient

### 5. Grading

Incorporate viva score into final grade:
```
Final Score = Code Functionality (70%) + Viva Explanation (30%)
```

Or use as pass/fail gate:
```
if (vivaScore < 60 || !authenticityVerified) {
  finalGrade = Math.min(finalGrade, 50); // Cap at 50% if can't explain
}
```

## API Documentation

### Create Viva Request

```typescript
POST /api/viva/requests
Authorization: Bearer <instructor_token>

Request Body:
{
  "submissionId": "uuid",
  "userId": "uuid",
  "assessmentId": "uuid",
  "problemId": "uuid",
  "selectionType": "manual" | "random" | "flagged" | "all",
  "reason": "High similarity score (85%)",
  "instructions": "Explain your recursive approach...",
  "deadlineHours": 48
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "dueAt": "2026-04-13T12:00:00Z",
    ...
  }
}
```

### Random Selection

```typescript
POST /api/viva/select/random
Authorization: Bearer <instructor_token>

Request Body:
{
  "assessmentId": "uuid",
  "problemId": "uuid",
  "percentage": 20,
  "instructions": "Explain your solution...",
  "deadlineHours": 48
}

Response:
{
  "success": true,
  "data": [ /* array of created viva requests */ ],
  "count": 8
}
```

### Flagged Selection

```typescript
POST /api/viva/select/flagged
Authorization: Bearer <instructor_token>

Request Body:
{
  "assessmentId": "uuid",
  "problemId": "uuid",
  "similarityThreshold": 0.75,
  "instructions": "Your code was flagged. Please explain...",
  "deadlineHours": 48
}

Response:
{
  "success": true,
  "data": [ /* array of created viva requests */ ],
  "count": 3
}
```

### Submit Video Explanation

```typescript
POST /api/viva/requests/:vivaRequestId/submit
Authorization: Bearer <student_token>

Request Body:
{
  "videoUrl": "https://s3.amazonaws.com/bucket/video.mp4",
  "videoDurationSeconds": 420,
  "studentNotes": "I explain my DP approach starting at 1:30"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "submitted",
    "submittedAt": "2026-04-12T10:30:00Z",
    ...
  },
  "message": "Video explanation submitted successfully"
}
```

### Review Video Explanation

```typescript
POST /api/viva/requests/:vivaRequestId/review
Authorization: Bearer <instructor_token>

Request Body:
{
  "explanationScore": 85,
  "comprehensionLevel": "good",
  "reviewNotes": "Student demonstrated solid understanding of the algorithm...",
  "authenticityVerified": true,
  "requiresResubmit": false
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "graded",
    "reviewedAt": "2026-04-12T14:00:00Z",
    ...
  },
  "message": "Review completed successfully"
}
```

### Get Student Pending Requests

```typescript
GET /api/viva/student/pending
Authorization: Bearer <student_token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "assessmentId": "uuid",
      "instructions": "Explain your approach...",
      "dueAt": "2026-04-13T12:00:00Z",
      "status": "pending",
      ...
    }
  ],
  "count": 2
}
```

### Get Assessment Statistics

```typescript
GET /api/viva/assessment/:assessmentId/stats
Authorization: Bearer <instructor_token>

Response:
{
  "success": true,
  "data": {
    "assessmentId": "uuid",
    "totalRequests": 25,
    "totalSubmitted": 22,
    "totalGraded": 18,
    "totalExpired": 3,
    "avgSubmissionHours": 28.5,
    "avgExplanationScore": 78.3,
    "authenticityVerifiedCount": 20
  }
}
```

## Frontend Components

### StudentVivaDashboard

```typescript
import StudentVivaDashboard from '@/components/viva/StudentVivaDashboard';

<StudentVivaDashboard 
  userId={currentUser.id}
  onVideoRecorded={(url) => console.log('Recorded:', url)}
/>
```

**Features:**
- Displays pending and overdue requests
- Shows countdown timers for due dates
- Video file upload with validation
- Preview uploaded videos
- Add optional text notes
- Submit button with loading state

### InstructorVivaDashboard

```typescript
import InstructorVivaDashboard from '@/components/viva/InstructorVivaDashboard';

<InstructorVivaDashboard 
  instructorId={currentUser.id}
  assessmentId={assessment.id}
/>
```

**Features:**
- Assessment statistics dashboard
- List of submitted videos needing review
- Video player with playback controls
- Review form with score, comprehension level, notes
- Authenticity verification checkbox
- Waive requirement option
- Filter by status (pending/submitted/graded)

## Best Practices

### For Instructors

1. **Set Clear Instructions**
   ```
   Good: "Explain your recursive backtracking approach, focusing on:
   - Why you chose recursion over iteration
   - How you handle the base case
   - Your pruning strategy
   - Time complexity analysis"
   
   Bad: "Explain your code."
   ```

2. **Give Adequate Time**
   - Simple problems: 24-48 hours
   - Complex projects: 72-96 hours
   - Consider time zones and student schedules

3. **Use Strategic Selection**
   - Don't always select randomly - students will adapt
   - Combine random (20%) + flagged (100%) for best results
   - Occasionally select high-performing students to normalize it

4. **Provide Rubric**
   - Share evaluation criteria in advance
   - Example: "Clarity (40%), Technical depth (30%), Design justification (30%)"

5. **Review Fairly**
   - Watch entire video before scoring
   - Look for genuine understanding, not polished presentation
   - Minor mistakes are OK if concepts are clear
   - Focus on "Can they explain WHY?" not just "WHAT?"

### For Students

1. **Prepare Before Recording**
   - Review your code thoroughly
   - Practice explaining it aloud
   - Prepare answers to "why" questions
   - Have your IDE and code ready

2. **Recording Tips**
   - Use a quiet environment
   - Test your audio before recording
   - Zoom in on code (make font large)
   - Use cursor/highlighting to guide viewer
   - Speak clearly and at moderate pace

3. **Content Structure**
   ```
   1. Overview (30 sec): "I solved this using a BFS approach because..."
   2. High-level walkthrough (2 min): Main components and flow
   3. Deep dive (3-5 min): Key functions, edge cases, design decisions
   4. Complexity analysis (1 min): Time/space complexity
   5. Reflection (30 sec): Challenges, alternative approaches
   ```

4. **What to Avoid**
   - Reading code line-by-line without explanation
   - Memorized scripts (be natural)
   - Skipping over difficult parts
   - Blaming ChatGPT/GitHub/StackOverflow

## Security Considerations

### Video Storage

- Use presigned S3 URLs for secure upload
- Set expiration on upload URLs (15 minutes)
- Store videos in private S3 bucket
- Generate presigned download URLs for instructors
- Consider retention policy (delete after semester?)

### Access Control

- Students can only view their own requests
- Instructors can only view requests for their assessments
- Admins have full access
- Implement row-level security in database

### Academic Integrity

- Log all video views (detect if students share reviews)
- Watermark videos with student ID
- Consider requiring face-cam (optional, privacy concerns)
- Store submission timestamps with timezone

## Analytics & Insights

### Instructor Insights

**Submission Patterns:**
- Average submission time: 28 hours (healthy)
- Average submission time: 46 hours (students procrastinating)
- Spike in last 2 hours: cramming/panic

**Authenticity Indicators:**
- High authenticity rate (>80%): deterrent is working
- Low authenticity rate (<50%): widespread plagiarism problem
- Correlation with MOSS scores: validate detection accuracy

**Comprehension Distribution:**
```
Excellent: 25%
Good: 40%
Fair: 25%
Poor: 10%
```

### Student Insights

**Notification Effectiveness:**
- Track open rates for emails
- Track dashboard visit rates
- A/B test notification copy

**Deadline Extension Requests:**
- Track how many students request extensions
- Correlate with difficulty of assignment
- Adjust default deadlines if >30% need extensions

## Competitive Advantage

### Comparison to Existing Solutions

| Feature | Our System | Turnitin | MOSS | Proctorio |
|---------|-----------|----------|------|-----------|
| Code plagiarism detection | ✅ (MOSS integration) | ❌ | ✅ | ❌ |
| Video explanations | ✅ | ❌ | ❌ | ⚠️ (live only) |
| Async workflow | ✅ | N/A | N/A | ❌ |
| Random selection | ✅ | ❌ | ❌ | ❌ |
| Plagiarism-triggered | ✅ | ❌ | ❌ | ❌ |
| Instructor review interface | ✅ | ⚠️ (limited) | ❌ | ✅ |
| Student dashboard | ✅ | ❌ | ❌ | ❌ |
| Statistics & insights | ✅ | ⚠️ | ❌ | ✅ |

### Unique Value Propositions

1. **Scalable Oral Examination**: Traditional vivas require scheduling 1-on-1 meetings. Our async approach scales to 1000+ students.

2. **Psychological Deterrent**: The possibility of being randomly selected encourages all students to write their own code, not just those caught.

3. **Evidence-Based**: Unlike MOSS (similarity detection), video explanations provide definitive proof of understanding or lack thereof.

4. **Fair Process**: Students flagged by MOSS get a chance to prove they wrote the code themselves before being accused.

5. **Integration**: Seamlessly integrates with MOSS plagiarism detection, proctoring, and grading systems.

## Roadmap

### Phase 1: MVP (Complete)
- ✅ Database schema
- ✅ Service layer
- ✅ REST API
- ✅ Student dashboard
- ✅ Instructor dashboard
- ✅ Random/flagged/manual selection

### Phase 2: Enhanced Features
- [ ] Live screen recording (browser-based)
- [ ] AI-powered video analysis (detect script reading, fake explanations)
- [ ] Auto-transcription with speech-to-text
- [ ] Keyword detection in transcripts (plagiarism indicators)
- [ ] Multi-channel notifications (email, Slack, SMS)

### Phase 3: Advanced Analytics
- [ ] Plagiarism prediction model (ML on video features)
- [ ] Student risk scoring (combine viva + MOSS + proctoring data)
- [ ] Instructor efficiency metrics (time spent reviewing)
- [ ] Comparative analysis (class-wide comprehension trends)

### Phase 4: Enterprise Features
- [ ] Bulk selection rules (configure once, apply to all assessments)
- [ ] Rubric templates with weighted criteria
- [ ] Peer review mode (students review each other's explanations)
- [ ] Integration with university LMS (Canvas, Blackboard)
- [ ] FERPA compliance audit logs

## Conclusion

The **Code Explain / Viva Mode** addresses the fundamental weakness of automated plagiarism detection: it verifies not just similarity, but actual understanding. By requiring students to explain their code, we create:

1. **Deterrence**: Students know they might have to explain any submission
2. **Detection**: Students who can't explain clearly didn't write the code
3. **Fairness**: Evidence-based process before academic integrity violations
4. **Scalability**: Async video allows checking 100s of students without scheduling chaos

This feature is a core competitive differentiator for our LMS, positioning us as the **#1 choice for coding bootcamps and computer science programs** that take academic integrity seriously.
