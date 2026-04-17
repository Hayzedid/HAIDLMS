# Frontend Integration Guide

This document outlines the new frontend features integrated into the HAIDLMS platform.

## New Features

### 1. AI Socratic Tutor
**Route:** `/ai-tutor`  
**Access:** Students only  
**Components:**
- `AISocraticTutorChat` - Chat interface with Socratic method AI
- `ErrorExplanation` - Get guided help with coding errors

**Features:**
- Real-time chat with AI tutor using Socratic questioning
- Error explanation with step-by-step guidance
- Context-aware responses (lesson, assessment, IDE, general)
- No direct answers - encourages critical thinking

**API Endpoints Used:**
- `POST /api/ai/chat/start` - Start new chat session
- `POST /api/ai/chat/:sessionId/message` - Send message
- `POST /api/ai/explain-error` - Get error explanation

---

### 2. Peer Code Review System
**Route:** `/peer-review`  
**Access:** Students only  
**Components:**
- `PeerReviewInterface` - Complete review interface with rubric scoring
- `PeerReviewPage` - Main page with pending and submitted reviews

**Features:**
- View pending reviews assigned to you
- Review code with line-by-line comments
- Score submissions based on rubric criteria
- View your submitted reviews history
- Collusion detection warnings

**API Endpoints Used:**
- `GET /api/peer-review/pending/:userId` - Get pending reviews
- `GET /api/peer-review/assignments/:userId` - Get reviewer assignments
- `GET /api/peer-review/rubrics/:rubricId` - Get rubric details
- `POST /api/peer-review/reviews/:reviewId/criteria` - Submit criterion score
- `POST /api/peer-review/reviews/:reviewId/comments` - Add comment
- `POST /api/peer-review/reviews/:reviewId/submit` - Submit review

---

### 3. Learning Health Dashboard

#### Student View
**Route:** `/health/:courseId`  
**Access:** Students only  
**Component:** `StudentHealthDashboard`

**Features:**
- Overall health score (0-100)
- Risk level indicator (low/medium/high/critical)
- Component breakdown:
  - Video Accountability (25% weight)
  - Spaced Repetition (20% weight)
  - IDE Integrity (20% weight)
  - Assessment Performance (20% weight)
  - Peer Review (15% weight)
- Personalized recommendations
- Detailed metrics for each component

**API Endpoints Used:**
- `GET /api/learning-health/user/:userId/course/:courseId` - Get user health score

#### Instructor View
**Route:** `/instructor/health/:courseId`  
**Access:** Instructors only  
**Component:** `InstructorHealthDashboard`

**Features:**
- Course-wide health summary
- Risk distribution chart
- List of at-risk learners with filters
- AI-generated intervention nudges
- Priority-based recommendations

**API Endpoints Used:**
- `GET /api/learning-health/course/:courseId/summary` - Get dashboard summary
- `GET /api/learning-health/course/:courseId/at-risk` - Get at-risk learners
- `POST /api/learning-health/nudge/:userId/course/:courseId` - Generate instructor nudge

---

### 4. Academic Integrity Dashboard
**Routes:**
- `/instructor/integrity` - All integrity flags
- `/instructor/integrity/:assessmentId` - Filtered by assessment

**Access:** Instructors only  
**Component:** `IntegrityReviewDashboard`

**Features:**
- View all integrity flags
- Filter by severity (critical/high/medium/low)
- Filter by review status (reviewed/unreviewed)
- Detailed session information:
  - Keystroke patterns
  - Clipboard attempt logs
  - Typing speed metrics
  - Suspicious burst detection
- Review interface with action options:
  - No action (false positive)
  - Warning issued
  - Grade penalty
  - Academic integrity violation
  - Requires further investigation

**API Endpoints Used:**
- `GET /api/integrity/flags` - Get integrity flags
- `GET /api/integrity/session/:sessionId` - Get session details
- `GET /api/integrity/session/:sessionId/attempts` - Get clipboard attempts
- `POST /api/integrity/flags/:flagId/review` - Submit flag review

---

## Environment Configuration

Add these variables to your `.env` file:

```bash
# AI Service
VITE_AI_SERVICE_URL=http://localhost:3005

# Course Service (handles peer review & health)
VITE_COURSE_SERVICE_URL=http://localhost:3001

# IDE Service (handles integrity monitoring)
VITE_IDE_SERVICE_URL=http://localhost:3003
```

---

## API Client Architecture

All API calls are centralized in `/src/api/` directory:

- `ai-tutor.api.ts` - AI Socratic Tutor endpoints
- `peer-review.api.ts` - Peer review system endpoints
- `learning-health.api.ts` - Learning health dashboard endpoints
- `clipboard-keystroke.api.ts` - Integrity monitoring endpoints

Each API client:
- Uses singleton pattern with axios instances
- Includes full TypeScript type definitions
- Handles authentication tokens automatically
- Provides typed request/response interfaces

---

## Component Structure

```
Frontend/src/
├── api/
│   ├── ai-tutor.api.ts
│   ├── peer-review.api.ts
│   ├── learning-health.api.ts
│   ├── clipboard-keystroke.api.ts
│   └── index.ts
├── components/
│   ├── ai-tutor/
│   │   ├── AISocraticTutorChat.tsx
│   │   ├── ErrorExplanation.tsx
│   │   └── index.ts
│   ├── peer-review/
│   │   ├── PeerReviewInterface.tsx
│   │   └── index.ts
│   ├── health/
│   │   ├── StudentHealthDashboard.tsx
│   │   ├── InstructorHealthDashboard.tsx
│   │   └── index.ts
│   └── integrity/
│       ├── IntegrityReviewDashboard.tsx
│       └── index.ts
└── pages/
    ├── ai-tutor/
    │   └── AITutorPage.tsx
    ├── peer-review/
    │   └── PeerReviewPage.tsx
    ├── health/
    │   ├── StudentHealthPage.tsx
    │   └── InstructorHealthPage.tsx
    └── integrity/
        └── IntegrityDashboardPage.tsx
```

---

## Testing Checklist

### AI Tutor
- [ ] Start a new chat session
- [ ] Send messages and receive Socratic responses
- [ ] Test error explanation with code snippet
- [ ] Verify AI doesn't provide direct answers
- [ ] Check different context types (lesson/assessment/general)

### Peer Review
- [ ] View pending reviews list
- [ ] Start a review and see the code
- [ ] Add line-specific comments
- [ ] Score criteria based on rubric
- [ ] Submit overall review
- [ ] View submitted reviews history

### Learning Health (Student)
- [ ] View overall health score
- [ ] Check component breakdown
- [ ] Verify risk level indicator
- [ ] Review personalized recommendations
- [ ] Refresh health data

### Learning Health (Instructor)
- [ ] View course-wide summary
- [ ] Check risk distribution
- [ ] Filter at-risk learners
- [ ] Generate intervention nudge
- [ ] Review component scores for individual students

### Integrity Dashboard
- [ ] View all integrity flags
- [ ] Filter by severity
- [ ] Filter by review status
- [ ] Open flag details
- [ ] Review session metrics
- [ ] Submit review with action taken
- [ ] Verify flag marked as reviewed

---

## Navigation Integration

To add links to these features in your navigation menu:

### Student Navigation
```tsx
<Link to="/ai-tutor">🤖 AI Tutor</Link>
<Link to="/peer-review">📝 Peer Reviews</Link>
<Link to={`/health/${courseId}`}>📊 My Health</Link>
```

### Instructor Navigation
```tsx
<Link to={`/instructor/health/${courseId}`}>📊 Course Health</Link>
<Link to="/instructor/integrity">🔒 Integrity Flags</Link>
```

---

## Troubleshooting

### API Connection Issues
- Verify all service URLs in `.env` are correct
- Check that backend services are running
- Ensure CORS is configured properly on backend

### Authentication Issues
- Verify `useAuth()` hook is working correctly
- Check that JWT tokens are being sent in headers
- Ensure protected routes are properly configured

### Type Errors
- Run `npm run type-check` to verify TypeScript compilation
- Check that all API response interfaces match backend DTOs
- Ensure component props are correctly typed

### Styling Issues
- Verify Tailwind CSS classes are available
- Check that custom colors are defined in `tailwind.config.js`
- Ensure responsive breakpoints work on different screen sizes

---

## Next Steps

1. **Add Navigation Links**: Update `StudentDashboard.tsx` and `InstructorDashboard.tsx` to include links to new features
2. **Test API Integration**: Use test data from backend testing resources
3. **Add Error Boundaries**: Wrap components in error boundaries for better error handling
4. **Performance Optimization**: Consider lazy loading for large components
5. **Accessibility**: Add ARIA labels and keyboard navigation support
