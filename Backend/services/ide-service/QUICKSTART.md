# IDE Service Quick Start

Get the IDE Service up and running in 5 minutes.

## Prerequisites

- Docker Engine running
- PostgreSQL 14+ running
- Node.js 20+ installed

## 1. Install Dependencies

```bash
cd Backend/services/ide-service
npm install
```

## 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn_ide
JWT_SECRET=your-secret-key-here
IDE_SERVICE_PORT=4003
```

## 3. Initialize Database

```bash
npm run db:init
```

This creates:
- 7 tables (submissions, executions, test_cases, templates, keystrokes, plagiarism, stats)
- Automatic triggers for progress tracking
- Indexes for performance

## 4. Start Service

```bash
npm run dev
```

Service starts on `http://localhost:4003`

## 5. Test It

### Health Check
```bash
curl http://localhost:4003/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ide-service",
  "database": "connected",
  "docker": "connected"
}
```

### Execute Code

First, get a JWT token from auth-service, then:

```bash
curl -X POST http://localhost:4003/api/ide/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello from Docker!\")",
    "timeoutMs": 30000
  }'
```

Expected response:
```json
{
  "executionId": "uuid",
  "status": "completed",
  "output": {
    "stdout": "Hello from Docker!",
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

## 6. WebSocket Test

### Execution Streaming

```javascript
// Connect to execution WebSocket
const executionId = 'uuid-from-execute-stream-endpoint';
const ws = new WebSocket(`ws://localhost:4003/ws/execution?executionId=${executionId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'status':
      console.log('Status:', message.data);
      break;
    case 'stdout':
      console.log('Output:', message.data);
      break;
    case 'stderr':
      console.error('Error:', message.data);
      break;
    case 'complete':
      console.log('Completed:', message.data);
      break;
  }
};

// Then call execute-stream endpoint
fetch('http://localhost:4003/api/ide/execute-stream', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    language: 'python',
    code: 'print("Streaming test")'
  })
});
```

### Keystroke Tracking

```javascript
const ws = new WebSocket('ws://localhost:4003/ws/keystrokes');

// Initialize session
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'init',
    sessionId: 'uuid',
    userId: 'user-uuid'
  }));
};

// Send keystrokes
ws.send(JSON.stringify({
  type: 'keystroke',
  timestamp: Date.now(),
  key: 'a',
  keystrokeType: 'press',
  position: { line: 1, column: 5 }
}));

// Data auto-saves on disconnect
```

## 7. Create Test Cases (Instructor)

```bash
curl -X POST http://localhost:4003/api/ide/admin/test-cases \
  -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson-uuid",
    "name": "Test basic addition",
    "stdin": "1 2",
    "expectedStdout": "3",
    "expectedExitCode": 0,
    "isHidden": false,
    "points": 20
  }'
```

## 8. Create Code Template (Instructor)

```bash
curl -X POST http://localhost:4003/api/ide/admin/templates \
  -H "Authorization: Bearer INSTRUCTOR_JWT_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "lessonId": "lesson-uuid",
    "language": "python",
    "starterCode": "# Write your solution here\ndef add(a, b):\n    pass",
    "solutionCode": "def add(a, b):\n    return a + b"
  }'
```

## Supported Languages

```bash
curl http://localhost:4003/api/ide/languages
```

Returns: `python`, `javascript`, `typescript`, `java`, `cpp`, `go`, `rust`, `ruby`, `php`, `csharp`

## Troubleshooting

### Docker not connecting
```bash
# Check Docker is running
docker ps

# Test Docker access
docker run hello-world
```

### Database not connecting
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Re-initialize database
npm run db:init
```

### Container execution fails
```bash
# Pull required images manually
docker pull python:3.11-alpine
docker pull node:20-alpine
docker pull openjdk:17-alpine
```

### Port already in use
Change `IDE_SERVICE_PORT` in `.env`:
```env
IDE_SERVICE_PORT=4004
```

## Next Steps

1. **Frontend Integration**: See `INTEGRATION.md` for Monaco Editor setup
2. **Production**: Configure resource limits, rate limiting, and monitoring
3. **Security**: Update JWT_SECRET, enable HTTPS, configure CORS
4. **Scaling**: Add Redis for WebSocket session management

## API Reference

Full API documentation: [README.md](./README.md)

## Support

- Health endpoint: `http://localhost:4003/health`
- Logs: Check console output
- Issues: Contact platform team
