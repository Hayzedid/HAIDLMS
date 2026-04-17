# IDE Components

React components for the TechLearn in-browser code editor powered by Monaco Editor.

## Components

### IDEInterface

Main IDE interface with code editor, output console, test results, and control buttons.

**Usage:**

```tsx
import { IDEInterface } from '@/components/ide';

function MyLesson() {
  return (
    <IDEInterface
      lessonId="lesson-uuid"
      courseId="course-uuid"
      initialLanguage="python"
      initialCode="print('Hello, World!')"
      onSubmissionComplete={(result) => {
        console.log('Score:', result.score);
        console.log('Passed:', result.passed);
      }}
    />
  );
}
```

**Props:**

- `lessonId` (string, required): Lesson UUID
- `courseId` (string, required): Course UUID
- `initialLanguage` (Language, optional): Starting language (default: 'python')
- `initialCode` (string, optional): Initial code in editor
- `readOnly` (boolean, optional): Disable editing (default: false)
- `onSubmissionComplete` (callback, optional): Called when submission is graded

**Features:**

- Monaco Editor with syntax highlighting
- 10 language support (Python, JS, TS, Java, C++, Go, Rust, Ruby, PHP, C#)
- Run code with normal or streaming output
- Test code against visible test cases
- Submit code for grading with all tests
- Input field for stdin
- Split-panel layout with resizable sections

### CodeEditor

Monaco code editor wrapper with language-specific configuration.

**Usage:**

```tsx
import { CodeEditor } from '@/components/ide';

function MyEditor() {
  const [code, setCode] = useState('print("Hello")');

  return (
    <CodeEditor
      language="python"
      value={code}
      onChange={setCode}
      height="500px"
      theme="vs-dark"
    />
  );
}
```

**Props:**

- `language` (Language, required): Programming language
- `value` (string, required): Current code
- `onChange` (callback, required): Called on code change
- `readOnly` (boolean, optional): Disable editing
- `height` (string, optional): Editor height (default: '500px')
- `theme` ('vs-dark' | 'light', optional): Color theme (default: 'vs-dark')
- `onMount` (callback, optional): Called when editor mounts

### OutputConsole

Terminal-style output console with color-coded message types.

**Usage:**

```tsx
import { OutputConsole, OutputLine } from '@/components/ide';

function MyConsole() {
  const [lines, setLines] = useState<OutputLine[]>([
    { type: 'stdout', content: 'Hello, World!', timestamp: Date.now() },
    { type: 'stderr', content: 'Warning: deprecated', timestamp: Date.now() },
    { type: 'success', content: '✓ Completed', timestamp: Date.now() },
  ]);

  return <OutputConsole lines={lines} height="300px" showTimestamps />;
}
```

**Props:**

- `lines` (OutputLine[], required): Array of output messages
- `height` (string, optional): Console height (default: '300px')
- `showTimestamps` (boolean, optional): Show message timestamps

**OutputLine Types:**

- `stdout`: Standard output (light gray)
- `stderr`: Standard error (red)
- `error`: Error messages (bright red)
- `success`: Success messages (green)
- `system`: System messages (blue)

### TestResults

Visual display of test case results with pass/fail status.

**Usage:**

```tsx
import { TestResults } from '@/components/ide';

function MyResults() {
  return (
    <TestResults
      results={[
        {
          name: 'Test basic addition',
          passed: true,
          points: 20,
          maxPoints: 20,
          executionTimeMs: 45,
        },
        {
          name: 'Test edge case',
          passed: false,
          points: 0,
          maxPoints: 20,
          expectedOutput: '10',
          actualOutput: '0',
          executionTimeMs: 38,
        },
      ]}
      totalTests={2}
      passedTests={1}
      failedTests={1}
      score={50}
      executionTime={83}
    />
  );
}
```

**Props:**

- `results` (TestResult[], required): Array of test results
- `totalTests` (number, required): Total number of tests
- `passedTests` (number, required): Number of passed tests
- `failedTests` (number, required): Number of failed tests
- `score` (number, optional): Overall score (0-100)
- `executionTime` (number, optional): Total execution time in ms
- `showHidden` (boolean, optional): Show hidden test details

## API Integration

The IDE components use the `ideApi` from `@/api/ide.api.ts`:

```tsx
import { ideApi, Language } from '@/api/ide.api';

// Execute code
const result = await ideApi.executeCode({
  language: 'python',
  code: 'print("Hello")',
  stdin: '',
  timeoutMs: 30000,
});

// Submit for grading
const submission = await ideApi.submitCode({
  lessonId: 'lesson-uuid',
  courseId: 'course-uuid',
  language: 'python',
  code: 'def add(a, b): return a + b',
});

// Run tests
const tests = await ideApi.runTests({
  lessonId: 'lesson-uuid',
  language: 'python',
  code: 'def add(a, b): return a + b',
});

// Get template
const template = await ideApi.getTemplate('lesson-uuid', 'python');
```

## WebSocket Streaming

For real-time execution output:

```tsx
import { ideApi } from '@/api/ide.api';

// Start streaming execution
const response = await ideApi.executeCodeStream({
  language: 'python',
  code: 'print("Streaming test")',
});

const executionId = response.data.data.executionId;

// Connect to WebSocket
const ws = ideApi.connectExecutionStream(executionId, (message) => {
  switch (message.type) {
    case 'status':
      console.log('Status:', message.data);
      break;
    case 'stdout':
      console.log('Output:', message.data);
      break;
    case 'complete':
      console.log('Done:', message.data);
      break;
  }
});

// Clean up
ws.close();
```

## Keystroke Tracking

For integrity monitoring:

```tsx
import { ideApi } from '@/api/ide.api';

// Connect to keystroke tracking
const ws = ideApi.connectKeystrokeStream('session-uuid', 'user-uuid');

// Send keystrokes
ideApi.sendKeystroke(ws, {
  key: 'a',
  keystrokeType: 'press',
  position: { line: 1, column: 5 },
});

// Auto-saves on disconnect
ws.close();
```

## Supported Languages

```typescript
type Language =
  | 'python'      // Python 3.11
  | 'javascript'  // Node.js 20
  | 'typescript'  // TypeScript via ts-node
  | 'java'        // Java 17
  | 'cpp'         // C++ (GCC 12)
  | 'go'          // Go 1.21
  | 'rust'        // Rust 1.75
  | 'ruby'        // Ruby 3.2
  | 'php'         // PHP 8.2
  | 'csharp';     // C# (.NET 8.0)
```

## Environment Variables

Add to `.env`:

```env
VITE_IDE_SERVICE_URL=localhost:4003
```

For production:
```env
VITE_IDE_SERVICE_URL=ide.example.com
```

## Styling

Components use inline styles for portability. To customize:

1. **Colors**: Modify inline style objects in each component
2. **Theme**: Pass `theme="light"` to CodeEditor
3. **Layout**: Adjust flex properties and dimensions

## Examples

### Lesson Integration

```tsx
// In LessonViewer.tsx
{currentLesson.lessonType === 'code' && (
  <IDEInterface
    lessonId={currentLesson.id}
    courseId={courseId}
    initialLanguage={currentLesson.programmingLanguage}
    initialCode={currentLesson.codeTemplate}
    onSubmissionComplete={(result) => {
      if (result.passed) {
        markLessonComplete();
      }
    }}
  />
)}
```

### Standalone Playground

```tsx
// In CodePlayground.tsx
<IDEInterface
  lessonId="playground"
  courseId="playground"
  initialLanguage="python"
/>
```

### Custom Integration

```tsx
import { CodeEditor, OutputConsole, TestResults } from '@/components/ide';

function CustomIDE() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);

  const runCode = async () => {
    const result = await ideApi.executeCode({
      language: 'python',
      code,
    });
    
    setOutput([
      { type: 'stdout', content: result.data.data.output.stdout, timestamp: Date.now() }
    ]);
  };

  return (
    <div>
      <CodeEditor language="python" value={code} onChange={setCode} />
      <button onClick={runCode}>Run</button>
      <OutputConsole lines={output} />
    </div>
  );
}
```

## Troubleshooting

### Monaco Editor not loading

Ensure `@monaco-editor/react` is installed:
```bash
npm install @monaco-editor/react
```

### WebSocket connection failed

Check `VITE_IDE_SERVICE_URL` in `.env` and ensure IDE service is running:
```bash
curl http://localhost:4003/health
```

### Code execution timeout

Increase `timeoutMs` in execute request:
```tsx
await ideApi.executeCode({
  language: 'python',
  code: 'import time; time.sleep(10)',
  timeoutMs: 60000, // 60 seconds
});
```

### Test results not showing

Ensure test cases exist for the lesson:
```bash
curl http://localhost:4003/api/ide/admin/test-cases/:lessonId
```

## Best Practices

1. **Always provide initial code**: Load template or default code
2. **Handle submission results**: Show feedback to students
3. **Use streaming for long-running code**: Better UX for interactive programs
4. **Clear output between runs**: Call `clearOutput()` before execution
5. **Save code periodically**: Store drafts in local storage
6. **Validate before submit**: Run tests first, then submit
7. **Show loading states**: Disable buttons during execution
8. **Handle errors gracefully**: Display user-friendly error messages

## License

Proprietary - TechLearn LMS Platform
