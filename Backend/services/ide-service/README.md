# IDE Service

Secure code execution service with Docker sandboxing, test automation, and plagiarism detection for the TechLearn LMS platform.

## Features

- **Secure Code Execution**: Docker-based sandboxing with resource limits (CPU, memory, timeout)
- **Multi-Language Support**: Python, JavaScript, TypeScript, Java, C++, Go, Rust, Ruby, PHP, C#
- **Automated Testing**: Define test cases with input/output validation
- **Code Templates**: Starter code and solutions for coding lessons
- **Keystroke Analytics**: Track coding patterns for integrity analysis
- **Plagiarism Detection**: MOSS integration for similarity checking
- **Real-time Feedback**: WebSocket support for live output streaming

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Sandboxing**: Docker + Dockerode
- **Validation**: Zod
- **Authentication**: JWT

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Docker Engine (running and accessible)
- Docker images for supported languages (auto-pulled on first use)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT verification
- `IDE_SERVICE_PORT`: Service port (default: 4003)

### 3. Initialize Database

```bash
npm run db:init
```

This creates tables for:
- `code_submissions`: Student code submissions
- `code_executions`: Execution logs
- `test_cases`: Test definitions for lessons
- `code_templates`: Starter code templates
- `keystroke_data`: Typing analytics
- `plagiarism_reports`: MOSS results
- `execution_stats`: Aggregated metrics

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

## API Endpoints

### Student Endpoints

#### Execute Code (Non-Graded)
```http
POST /api/ide/execute
Authorization: Bearer <token>

{
  "language": "python",
  "code": "print('Hello, World!')",
  "stdin": "",
  "timeoutMs": 30000,
  "memoryLimitMB": 256
}
```

**Response:**
```json
{
  "executionId": "uuid",
  "status": "completed",
  "output": {
    "stdout": "Hello, World!",
    "stderr": "",
    "exitCode": 0
  },
  "metrics": {
    "executionTimeMs": 125,
    "memoryUsedKB": 2048
  },
  "timedOut": false
}
```

#### Submit Code for Grading
```http
POST /api/ide/submit
Authorization: Bearer <token>

{
  "lessonId": "uuid",
  "courseId": "uuid",
  "language": "python",
  "code": "def add(a, b):\n    return a + b",
  "fileName": "solution.py"
}
```

**Response:**
```json
{
  "submissionId": "uuid",
  "passed": true,
  "score": 100,
  "attemptNumber": 2,
  "tests": {
    "passed": 5,
    "failed": 0,
    "total": 5
  },
  "results": [
    {
      "name": "Test basic addition",
      "passed": true,
      "points": 20,
      "maxPoints": 20,
      "input": "1 2",
      "expectedOutput": "3",
      "actualOutput": "3",
      "executionTimeMs": 42
    }
  ],
  "executionTimeMs": 210
}
```

#### Run Tests (Preview)
```http
POST /api/ide/test
Authorization: Bearer <token>

{
  "lessonId": "uuid",
  "language": "python",
  "code": "def add(a, b):\n    return a + b"
}
```

Only runs visible test cases (hidden tests excluded).

#### Get Submission Details
```http
GET /api/ide/submissions/:id
Authorization: Bearer <token>
```

#### List User Submissions
```http
GET /api/ide/submissions?lessonId=uuid
Authorization: Bearer <token>
```

#### Get Code Template
```http
GET /api/ide/templates/:lessonId/:language
Authorization: Bearer <token>
```

### Instructor Endpoints

All instructor endpoints require `instructor` or `admin` role.

#### Create Test Case
```http
POST /api/ide/admin/test-cases
Authorization: Bearer <token>

{
  "lessonId": "uuid",
  "name": "Test basic addition",
  "description": "Tests add() with positive numbers",
  "displayOrder": 1,
  "stdin": "1 2",
  "expectedStdout": "3",
  "expectedExitCode": 0,
  "isHidden": false,
  "ignoreWhitespace": true,
  "timeoutMs": 5000,
  "points": 20
}
```

#### Get Test Cases
```http
GET /api/ide/admin/test-cases/:lessonId
Authorization: Bearer <token>
```

#### Update Test Case
```http
PATCH /api/ide/admin/test-cases/:id
Authorization: Bearer <token>

{
  "points": 25,
  "isHidden": true
}
```

#### Delete Test Case
```http
DELETE /api/ide/admin/test-cases/:id
Authorization: Bearer <token>
```

#### Create Code Template
```http
POST /api/ide/admin/templates
Authorization: Bearer <token>

{
  "lessonId": "uuid",
  "language": "python",
  "starterCode": "# Write your solution here\ndef add(a, b):\n    pass",
  "solutionCode": "def add(a, b):\n    return a + b",
  "testCommand": "python -m pytest",
  "buildCommand": null
}
```

#### Get Templates
```http
GET /api/ide/admin/templates/:lessonId
Authorization: Bearer <token>
```

#### Update Template
```http
PATCH /api/ide/admin/templates/:id
Authorization: Bearer <token>

{
  "starterCode": "# Updated starter code"
}
```

#### Delete Template
```http
DELETE /api/ide/admin/templates/:id
Authorization: Bearer <token>
```

#### Get Execution Statistics
```http
GET /api/ide/admin/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

## Supported Languages

| Language   | Docker Image                    | Notes                          |
|------------|---------------------------------|--------------------------------|
| Python     | `python:3.11-alpine`            | Python 3.11                    |
| JavaScript | `node:20-alpine`                | Node.js 20                     |
| TypeScript | `node:20-alpine`                | Uses ts-node                   |
| Java       | `openjdk:17-alpine`             | OpenJDK 17                     |
| C++        | `gcc:12-alpine`                 | GCC 12                         |
| Go         | `golang:1.21-alpine`            | Go 1.21                        |
| Rust       | `rust:1.75-alpine`              | Rust 1.75                      |
| Ruby       | `ruby:3.2-alpine`               | Ruby 3.2                       |
| PHP        | `php:8.2-cli-alpine`            | PHP 8.2                        |
| C#         | `mcr.microsoft.com/dotnet/sdk:8.0-alpine` | .NET 8.0          |

## Security

### Sandbox Constraints

Each execution runs in an isolated Docker container with:

- **Memory Limit**: 256MB default (configurable, max 1GB)
- **CPU Limit**: 50% of one core
- **Timeout**: 30 seconds default (configurable, max 60s)
- **No Network Access**: `NetworkMode: 'none'`
- **Read-Only Root**: Prevents system modifications
- **Auto-Remove**: Containers automatically cleaned up

### Code Validation

- Max code size: 50KB
- Input validation with Zod schemas
- JWT authentication on all endpoints
- Rate limiting recommended (configure at API gateway)

### Plagiarism Detection

Integration with MOSS (Measure of Software Similarity):
- Automatic code comparison across submissions
- Similarity scoring (0-100%)
- External source matching
- Manual review workflow for flagged submissions

## Database Schema

### code_submissions
Stores student code submissions with test results and grading information.

### code_executions
Logs all code executions with performance metrics and container details.

### test_cases
Defines test cases for coding challenges with input/output validation rules.

### code_templates
Starter code and solutions for each lesson and language combination.

### keystroke_data
Captures typing patterns for integrity analysis (session-based).

### plagiarism_reports
MOSS similarity results with manual review status.

### execution_stats
Daily aggregated statistics by language for monitoring and analytics.

## WebSocket

### Keystroke Streaming

Connect to `ws://localhost:4003/ws/keystrokes` for real-time keystroke events:

```javascript
const ws = new WebSocket('ws://localhost:4003/ws/keystrokes');

ws.send(JSON.stringify({
  sessionId: 'uuid',
  submissionId: 'uuid',
  keystroke: {
    timestamp: Date.now(),
    key: 'a',
    type: 'press',
    position: { line: 1, column: 5 }
  }
}));
```

## Monitoring

### Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "service": "ide-service",
  "database": "connected",
  "docker": "connected"
}
```

### Metrics

- Execution counts by language (daily aggregation)
- Average/max execution time and memory usage
- Success/failure/timeout rates
- Container lifecycle events

## Development

### Run Tests
```bash
npm test
```

### Database Migrations

Schema changes should be applied via migrations (to be implemented).

For now, re-run:
```bash
npm run db:init
```

### Docker Image Pre-pulling

Pre-pull images to avoid delays on first execution:

```bash
docker pull python:3.11-alpine
docker pull node:20-alpine
docker pull openjdk:17-alpine
# ... etc
```

## Troubleshooting

### Docker daemon not accessible

Ensure Docker is running:
```bash
docker ps
```

If not running, start Docker Desktop or Docker daemon.

### Container timeout issues

Check Docker performance settings and increase resource allocation if needed.

### Database connection failed

Verify PostgreSQL is running and connection string is correct:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Monaco)   │
└─────┬───────┘
      │ HTTP/WS
┌─────▼────────────────────────────────────┐
│          IDE Service                      │
│  ┌────────────┐  ┌──────────────────┐   │
│  │ Express    │  │ WebSocket Server │   │
│  │ API        │  │ (Keystrokes)     │   │
│  └─────┬──────┘  └──────────────────┘   │
│        │                                  │
│  ┌─────▼──────────────┐                  │
│  │ Docker Sandbox     │                  │
│  │ - Execute code     │                  │
│  │ - Enforce limits   │                  │
│  │ - Capture output   │                  │
│  └─────┬──────────────┘                  │
└────────┼───────────────────────────────┬─┘
         │                               │
    ┌────▼─────┐                  ┌──────▼──────┐
    │  Docker  │                  │ PostgreSQL  │
    │  Daemon  │                  │  Database   │
    └──────────┘                  └─────────────┘
```

## License

Proprietary - TechLearn LMS Platform
