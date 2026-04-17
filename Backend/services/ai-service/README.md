# AI Service

AI-powered tutoring, code analysis, and educational content generation for TechLearn LMS.

## Features

### 🤖 AI Pair Programmer (Tutor)
- **Socratic Method Teaching**: Guides students to discover solutions through questions
- **Progressive Hints**: 3-level hint system (approach → strategy → pseudocode)
- **Code Review Mode**: Educational feedback on student code
- **Context-Aware**: Remembers conversation and code history
- **Anti-Cheating**: Never provides complete solutions to homework
- **Multiple Modes**: Socratic, Direct, Hints, Review

### 🎤 Code Viva / Explanation Mode
- **Video Explanation Analysis**: Students explain their code via video
- **Transcription**: Automatic speech-to-text (Whisper API)
- **Comprehension Testing**: AI evaluates if students truly understand their code
- **Red Flag Detection**: Identifies when students can't explain code they submitted
- **Detailed Scoring**: Logic, data structures, algorithms, edge cases, terminology
- **Improvement Plans**: Personalized study recommendations

### 📚 AI Content Generator
- **Course Outlines**: Complete course structures with modules and lessons
- **Lesson Creation**: Video scripts, text content, code tutorials
- **Quiz Generation**: Multiple choice, true/false, code completion, output prediction
- **Assignment Creation**: Project requirements, rubrics, test cases, starter code
- **Learning Paths**: Step-by-step progression from topic A to goal B
- **Quality Validation**: Automated content quality scoring

## Tech Stack

- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express.js
- **AI Provider**: OpenAI GPT-4 Turbo
- **Transcription**: OpenAI Whisper (for video analysis)
- **Queue**: Bull (Redis-based)
- **Validation**: Zod

## Prerequisites

- Node.js 20+
- Redis (for queue management)
- OpenAI API key

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
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
```

### 3. Start Service

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
│  │  AI Chat   │  │  Viva Mode │  │  Content Creator   │  │
│  │  Widget    │  │  Recorder  │  │  Dashboard         │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬─────────────┘  │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼──────────────┐
│              AI Service (Express)                           │
│  ┌───────────────────┐  ┌──────────────────────────────┐  │
│  │ AI Tutor          │  │  Code Viva Service           │  │
│  │ Service           │  │  - Video transcription       │  │
│  │ - Chat sessions   │  │  - Explanation analysis      │  │
│  │ - Code review     │  │  - Comprehension scoring     │  │
│  │ - Hints           │  │  - Red flag detection        │  │
│  └───────────────────┘  └──────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Content Generator Service                             │ │
│  │ - Course outlines                                     │ │
│  │ - Lesson generation                                   │ │
│  │ - Quiz creation                                       │ │
│  │ - Assignment generation                               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  OpenAI GPT-4 API                           │
│  ┌──────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │  Chat    │  │  Whisper   │  │  Text Analysis         │ │
│  │  API     │  │  (Speech)  │  │  & Generation          │ │
│  └──────────┘  └────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### AI Tutor

```http
POST   /api/tutor/chat              # Chat with AI tutor
GET    /api/tutor/sessions/:id      # Get session details
GET    /api/tutor/user/:userId      # Get user's sessions
POST   /api/tutor/sessions/:id/end  # End session
```

### Code Viva

```http
POST   /api/viva/analyze             # Analyze code explanation
POST   /api/viva/transcribe          # Transcribe video
GET    /api/viva/explanations/:id    # Get explanation details
GET    /api/viva/user/:userId        # Get user's explanations
GET    /api/viva/flagged             # Get flagged explanations
POST   /api/viva/improvement/:id     # Generate improvement plan
POST   /api/viva/discrepancies       # Detect code vs explanation gaps
```

### Content Generation

```http
POST   /api/content/course           # Generate course outline
POST   /api/content/lesson           # Generate lesson content
POST   /api/content/quiz             # Generate quiz
POST   /api/content/assignment       # Generate assignment
POST   /api/content/learning-path    # Generate learning path
POST   /api/content/enhance          # Improve existing content
POST   /api/content/validate         # Validate content quality
```

## Usage Examples

### AI Tutor

```typescript
// Start tutoring session
const response = await fetch('/api/tutor/chat', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    message: 'I need help with this sorting algorithm',
    code: 'def sort(arr):\n  # my code',
    language: 'python',
    problemContext: 'Implementing quicksort',
    mode: 'socratic' // or 'hints', 'direct', 'review'
  })
});

// Continue conversation
await fetch('/api/tutor/chat', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: response.sessionId,
    userId: 'uuid',
    message: 'Should I use recursion?'
  })
});
```

**Example Interactions:**

**Socratic Mode:**
```
Student: "My sorting function isn't working"
AI: "Let's debug together. What do you expect your function to do?"
Student: "Sort numbers from lowest to highest"
AI: "Good! Now, walk me through what your code actually does, line by line."
Student: "It loops through... wait, I think I see the issue"
AI: "Excellent! What did you discover?"
```

**Hints Mode:**
```
Student: "How do I reverse a linked list?"
AI: "Hint 1 (Approach): Think about what information you need to keep track of as you traverse the list."
Student: "Still stuck"
AI: "Hint 2 (Strategy): You'll need at least two pointers - one for the current node and one for the previous node. Consider what happens to the 'next' pointer."
Student: "Can I get more help?"
AI: "Hint 3 (Key Insight): Here's pseudocode: while current exists: save next node, reverse pointer, move forward. What would this look like in code?"
```

**Review Mode:**
```
Student: "Can you review my code?"
AI: {
  overall: "Solid implementation with room for improvement",
  strengths: [
    "Good variable naming",
    "Handles base cases correctly"
  ],
  improvements: [
    "Consider edge case: empty array",
    "This loop could be optimized using .filter()"
  ],
  bugs: [
    {
      line: 5,
      severity: "high",
      description: "Off-by-one error in loop condition",
      suggestion: "Change 'i < arr.length' to 'i <= arr.length'"
    }
  ]
}
```

### Code Viva

```typescript
// Submit code explanation
const explanation = await fetch('/api/viva/analyze', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'uuid',
    submissionId: 'uuid',
    code: 'function fibonacci(n) { ... }',
    language: 'javascript',
    transcription: 'So this function calculates fibonacci numbers...'
    // OR videoData: 'base64_video_data' for auto-transcription
  })
});

// Response
{
  id: 'uuid',
  score: 75,
  comprehensionLevel: 'good',
  analysis: {
    understandsLogic: true,
    understandsDataStructures: true,
    understandsAlgorithm: true,
    canExplainEdgeCases: false,
    usesCorrectTerminology: true,
    overallComprehension: 75,
    strengths: [
      'Clearly explained the recursive approach',
      'Correct terminology (base case, recursive call)'
    ],
    weaknesses: [
      'Did not mention time complexity',
      'Missed edge case for negative numbers'
    ],
    suggestions: [
      'Study Big-O notation and algorithmic complexity',
      'Practice identifying edge cases systematically'
    ]
  },
  redFlags: [
    'Did not explain why base case is n <= 1',
    'Explanation shorter than 50 words'
  ]
}

// Get improvement plan
const plan = await fetch(`/api/viva/improvement/${explanation.id}`, {
  method: 'POST'
});

{
  areasToStudy: [
    'Time and space complexity analysis',
    'Edge case identification strategies',
    'Recursion depth and stack overflow'
  ],
  practiceProblems: [
    'Implement factorial with complexity analysis',
    'Find all edge cases in binary search',
    'Optimize fibonacci with memoization'
  ],
  resources: [
    'Big-O Cheat Sheet',
    'Recursion Visualization Tool',
    'Edge Cases in Algorithms Guide'
  ]
}
```

**Red Flags Detected:**
- "I think it just works" (vague)
- "I'm not sure why this part is here" (lacks understanding)
- "Basically it does stuff" (no detail)
- Contradicts themselves
- Can't explain variable names
- Incorrect terminology
- Very short explanation (< 50 words)

### Content Generation

```typescript
// Generate course outline
const course = await fetch('/api/content/course', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'Data Structures and Algorithms',
    level: 'intermediate',
    duration: '12 weeks',
    targetAudience: 'CS students with basic programming knowledge',
    learningObjectives: [
      'Understand and implement common data structures',
      'Analyze time and space complexity',
      'Solve algorithmic problems efficiently'
    ],
    prerequisites: ['Basic programming in Python or JavaScript']
  })
});

// Response
{
  title: 'Data Structures and Algorithms',
  description: '...',
  level: 'intermediate',
  duration: '12 weeks',
  modules: [
    {
      title: 'Arrays and Linked Lists',
      description: '...',
      estimatedDuration: '2 weeks',
      lessons: [
        {
          title: 'Introduction to Arrays',
          type: 'video',
          estimatedDuration: '30 minutes',
          content: 'Lesson outline...'
        },
        // ... more lessons
      ]
    },
    // ... more modules
  ]
}

// Generate quiz
const quiz = await fetch('/api/content/quiz', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'Binary Trees',
    difficulty: 'medium',
    questionCount: 10,
    questionTypes: [
      { type: 'multiple_choice', count: 5 },
      { type: 'code_output', count: 3 },
      { type: 'code_completion', count: 2 }
    ]
  })
});

// Response
{
  title: 'Binary Trees Assessment',
  questions: [
    {
      id: 'uuid',
      type: 'multiple_choice',
      question: 'What is the time complexity of searching in a balanced BST?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      correctAnswer: 'O(log n)',
      explanation: 'In a balanced BST, we eliminate half the tree at each step...',
      points: 2,
      difficulty: 'medium'
    },
    {
      id: 'uuid',
      type: 'code_output',
      question: 'What will this code print?',
      codeSnippet: 'def inorder(root):\n  if root:\n    inorder(root.left)\n    print(root.val)\n    inorder(root.right)\n\n# Tree: 5 -> 3, 7\ninorder(root)',
      correctAnswer: '3 5 7',
      explanation: 'Inorder traversal visits left, root, right...',
      points: 3,
      difficulty: 'medium',
      language: 'python'
    }
    // ... more questions
  ],
  totalPoints: 25,
  passingScore: 18,
  timeLimit: 45
}
```

## Tutor Modes

### Socratic Mode (Default)
- **Philosophy**: Lead students to discover answers through questions
- **Best for**: Homework, practice problems, concept clarification
- **Never**: Provides direct solutions
- **Example**: "What have you tried so far?" "Why did you choose that approach?"

### Hints Mode
- **Philosophy**: Progressive revelation of information
- **Levels**:
  - Level 1: High-level approach (e.g., "Think about using two pointers")
  - Level 2: Specific strategy (e.g., "Start from both ends and move inward")
  - Level 3: Pseudocode/key insight (e.g., "while left < right: compare and swap")
- **Best for**: When students are stuck after trying
- **Stops at**: Pseudocode - never actual code

### Direct Mode
- **Philosophy**: Clear explanations with examples
- **Best for**: Learning new concepts, not homework
- **Includes**: Explanations, examples, analogies
- **Avoids**: Complete homework solutions

### Review Mode
- **Philosophy**: Educational code feedback
- **Provides**: Bug detection, performance tips, best practices
- **Format**: Structured review with strengths and improvements
- **Educational**: Explains why, not just what to fix

## Viva Mode Scoring

### Comprehension Criteria (20 points each)
1. **Logic Understanding**: Can explain flow and control structures
2. **Data Structures**: Knows what data structures are used and why
3. **Algorithm**: Understands the algorithmic approach
4. **Edge Cases**: Mentions or understands boundary conditions
5. **Terminology**: Uses correct programming vocabulary

### Overall Score Calculation
```
overallComprehension = AI evaluation (0-100)
criteriaScore = (criteria met) × 6 points
finalScore = (overallComprehension × 0.7) + criteriaScore
```

### Comprehension Levels
- **Excellent** (85-100): Deep understanding, can teach others
- **Good** (70-84): Solid grasp, minor gaps
- **Fair** (50-69): Basic understanding, significant gaps
- **Poor** (<50): Cannot explain own code

## Content Quality Validation

All generated content is evaluated on:

1. **Clarity** (0-1): Is it easy to understand?
2. **Educational Value** (0-1): Does it teach effectively?
3. **Accuracy** (0-1): Is the information correct?
4. **Engagement** (0-1): Will students stay interested?
5. **Completeness** (0-1): Does it cover the topic thoroughly?

**Quality Threshold**: 0.7 (configurable)

Content below threshold is flagged for review or regeneration.

## Rate Limiting

To prevent abuse and manage costs:

```env
AI_REQUESTS_PER_MINUTE=20
AI_REQUESTS_PER_DAY=1000
```

Limits are per-user and enforced via Redis.

## Security Best Practices

### API Key Management
- Never commit API keys
- Rotate keys regularly
- Use environment variables
- Monitor usage and costs

### Content Safety
- Filter inappropriate content requests
- Log all AI interactions
- Review flagged content
- Implement content policies

### Data Privacy
- Don't send PII to AI providers
- Anonymize code examples
- Secure video storage
- Clear old sessions

## Monitoring

### Key Metrics
- AI response time
- Token usage per request
- Error rate
- Session duration
- Content quality scores
- Viva comprehension scores

### Cost Management
- Track OpenAI API costs
- Set budget alerts
- Optimize prompts for token efficiency
- Cache common responses

### Alerts
- High error rate
- Slow response times
- API quota approaching
- Quality threshold violations

## Troubleshooting

### AI Not Responding
1. Check `OPENAI_API_KEY` is set
2. Verify API key is valid
3. Check OpenAI service status
4. Review rate limits

### Poor Quality Generations
1. Adjust temperature (lower = more focused)
2. Improve prompt engineering
3. Increase max_tokens if truncated
4. Try different model (GPT-4 vs GPT-3.5)

### Viva Mode Issues
1. Ensure transcription quality
2. Check video format/size
3. Verify Whisper API access
4. Review transcription accuracy

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure `OPENAI_API_KEY`
- [ ] Set up Redis
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up logging (DataDog, Sentry)
- [ ] Monitor costs and usage
- [ ] Configure content filters
- [ ] Test all AI features
- [ ] Document incident response
- [ ] Train support team

## License

Proprietary - TechLearn LMS Platform
