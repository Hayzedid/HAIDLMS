# GitHub Integration - Quick Start Guide 🚀

## What You Can Do

Import content from any **public GitHub repository** using just the URL:

```
https://github.com/facebook/react
https://github.com/microsoft/TypeScript
https://github.com/vercel/next.js/tree/canary/examples
```

## Installation (2 Steps)

### Step 1: Install Dependencies
```bash
cd Backend/services/course-service
npm install
```

### Step 2: Optional - Add GitHub Token
Edit `Backend/.env` (or create from `.env.example`):
```bash
# Optional: Increases rate limit from 60 to 5000 requests/hour
GITHUB_TOKEN=ghp_your_token_here
```

**Get a token**: https://github.com/settings/tokens (no special permissions needed)

## Testing

### Test 1: Backend API (via curl)

Start the service:
```bash
cd Backend/services/course-service
npm run dev
```

Test endpoint:
```bash
curl -X POST http://localhost:4002/api/github/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/vercel/next.js"}'
```

### Test 2: Using the Test Script

```bash
cd Backend/services/course-service
node test-github.js
```

### Test 3: Frontend Component

Add to your React app:
```tsx
import GitHubImporter from '@/components/github/GitHubImporter';

function MyPage() {
  return (
    <GitHubImporter
      onImportComplete={(data) => {
        console.log('Imported:', data);
      }}
    />
  );
}
```

## Quick Examples

### Example 1: Simple Import
```typescript
import { processGitHubUrl } from '@/api/github.api';

const data = await processGitHubUrl('https://github.com/facebook/react');

console.log(`Repo: ${data.info.full_name}`);
console.log(`Stars: ${data.info.stargazers_count}`);
console.log(`Files: ${data.files.length}`);
```

### Example 2: Get File Content
```typescript
import { getFileContent } from '@/api/github.api';

const readme = await getFileContent('facebook', 'react', 'README.md');
console.log(readme.content);
```

### Example 3: Get Only Code Files
```typescript
import { getCodeFiles } from '@/api/github.api';

const result = await getCodeFiles('vercel', 'next.js', 'canary', 'packages', true);

console.log(`Found ${result.total} code files`);
result.filesWithContent?.forEach(file => {
  console.log(`${file.path}: ${file.size} bytes`);
});
```

## API Endpoints

All endpoints require authentication (Bearer token).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/github/parse` | Parse GitHub URL |
| POST | `/api/github/process` | **Main import endpoint** |
| GET | `/api/github/:owner/:repo` | Get repository info |
| GET | `/api/github/:owner/:repo/structure` | Get file structure |
| GET | `/api/github/:owner/:repo/file` | Get file content |
| POST | `/api/github/:owner/:repo/download` | Download multiple files |
| GET | `/api/github/:owner/:repo/code` | Get code files only |
| GET | `/api/github/:owner/:repo/docs` | Get documentation files |
| GET | `/api/github/:owner/:repo/search` | Search by extension |

## Use Cases in LMS

### 1. Import Course Materials
```typescript
// Instructor imports React tutorial from GitHub
const tutorial = await processGitHubUrl(
  'https://github.com/facebook/react/tree/main/packages'
);
// Creates lessons from each file
```

### 2. Student Assignment Submission
```typescript
// Student submits their project via GitHub URL
const submission = await processGitHubUrl(
  'https://github.com/student123/my-project',
  true // include file contents
);
// Automatically grade and check for plagiarism
```

### 3. Code Template Library
```typescript
// Build a library of code templates
const templates = await getCodeFiles('microsoft', 'TypeScript', 'main', 'src');
// Store templates for student use
```

### 4. Live Code Examples
```typescript
// Embed GitHub code in lessons
const example = await getFileContent('vercel', 'next.js', 'examples/blog/pages/index.js');
// Display in Monaco editor
```

## Components Included

### 1. GitHubImporter Component
Location: `Frontend/src/components/github/GitHubImporter.tsx`

Ready-to-use UI for importing repositories.

### 2. ImportFromGitHub Page
Location: `Frontend/src/pages/instructor/ImportFromGitHub.tsx`

Complete example showing:
- Repository import
- File selection
- Lesson creation workflow

## Features

✅ Parse any GitHub URL format  
✅ Get repository info (stars, forks, language)  
✅ Fetch complete file structure  
✅ Read file contents (auto-decoded)  
✅ Filter by file type (code, docs)  
✅ Search by extension  
✅ Download multiple files  
✅ TypeScript types included  
✅ Error handling built-in  
✅ Rate limiting support  

## Architecture

```
Frontend                Backend                 GitHub API
─────────              ─────────               ───────────
GitHubImporter  ─────► github.api.ts  ─────►  GitHub REST API
   Component           (Client)                    v3

                       github.controller.ts
                       (Routes)

                       github.service.ts
                       (Business Logic)
```

## Rate Limits

| Configuration | Requests/Hour |
|---------------|---------------|
| No token | 60 |
| With token | 5,000 |

## Security

- ✅ Authentication required for all endpoints
- ✅ Only public repositories accessible
- ✅ No write operations
- ✅ Input validation
- ✅ File size limits
- ✅ Rate limiting

## Troubleshooting

### "Repository not found or is private"
- Repository must be public
- Check URL format
- Verify repository exists

### "Rate limit exceeded"
- Add `GITHUB_TOKEN` to `.env`
- Wait 1 hour for rate limit reset

### "Authentication required"
- Endpoints require Bearer token
- Login via `/api/auth/login` first
- Include token in Authorization header

## Documentation

- **Full API Docs**: `Backend/services/course-service/GITHUB_INTEGRATION.md`
- **Feature Overview**: `GITHUB_INTEGRATION_FEATURE.md`

## Next Steps

1. ✅ Feature is ready to use
2. Add to your routing:
   ```tsx
   <Route path="/instructor/import-github" element={<ImportFromGitHub />} />
   ```
3. Test with your favorite repository
4. Customize the workflow for your needs

## Support

All files are documented with JSDoc comments. Check the source code for detailed information.

**Created**: 2026-04-11  
**Status**: ✅ Production Ready
