# GitHub Repository Integration Feature ✅

## Overview

A complete feature that allows reading and importing content from **public GitHub repositories** using just the repository URL.

## What's Implemented

### Backend Service (Course Service)
Located in: `Backend/services/course-service/src/`

#### 1. GitHub Service (`services/github.service.ts`)
- ✅ Parse GitHub URLs (extract owner, repo, branch, path)
- ✅ Fetch repository information via GitHub API
- ✅ Get complete repository structure (files & directories)
- ✅ Read file contents (auto-decode base64)
- ✅ Recursive directory traversal
- ✅ Filter files by type (code, docs, etc.)
- ✅ Search by file extension
- ✅ Download multiple files at once
- ✅ Optional GitHub token support for rate limit increase

#### 2. GitHub Controller (`controllers/github.controller.ts`)
RESTful endpoints for all GitHub operations:
- `POST /api/github/parse` - Parse GitHub URL
- `POST /api/github/process` - Main import endpoint
- `GET /api/github/:owner/:repo` - Get repo info
- `GET /api/github/:owner/:repo/structure` - Get file structure
- `GET /api/github/:owner/:repo/file` - Get file content
- `POST /api/github/:owner/:repo/download` - Download multiple files
- `GET /api/github/:owner/:repo/code` - Get code files only
- `GET /api/github/:owner/:repo/docs` - Get documentation files
- `GET /api/github/:owner/:repo/search` - Search by extension

#### 3. GitHub Routes (`routes/github.routes.ts`)
All routes are protected (require authentication)

### Frontend Integration
Located in: `Frontend/src/`

#### 1. API Client (`api/github.api.ts`)
TypeScript client with full type definitions:
- All backend endpoints wrapped
- Type-safe function calls
- Proper error handling

#### 2. React Component (`components/github/GitHubImporter.tsx`)
Ready-to-use UI component:
- URL input field
- Include content checkbox
- Loading states
- Error handling
- Beautiful file tree display
- Repository info display

### Configuration

#### Environment Variables
Added to `Backend/.env.example`:
```bash
# Optional: Increases rate limit from 60 to 5000 req/hour
GITHUB_TOKEN=ghp_your_token_here
```

#### Dependencies
Updated `Backend/services/course-service/package.json`:
- Added `axios` for HTTP requests

#### Service Registration
Updated `Backend/services/course-service/src/index.ts`:
- Registered GitHub routes at `/api/github`

## Supported URL Formats

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/branch
https://github.com/owner/repo/tree/branch/path/to/folder
https://github.com/owner/repo/blob/branch/path/to/file.ext
```

## Usage Examples

### 1. Simple Import (Frontend)
```typescript
import { processGitHubUrl } from '@/api/github.api';

const data = await processGitHubUrl('https://github.com/facebook/react');
console.log(`Repository: ${data.info.full_name}`);
console.log(`Files: ${data.files.length}`);
```

### 2. Get File Content
```typescript
import { getFileContent } from '@/api/github.api';

const readme = await getFileContent('facebook', 'react', 'README.md');
console.log(readme.content);
```

### 3. Using the React Component
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

### 4. Backend API Call
```bash
curl -X POST http://localhost:4000/api/github/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/microsoft/TypeScript",
    "includeContent": false
  }'
```

## Features

✅ **No Authentication Required** - Works with public repos out of the box  
✅ **Rate Limiting** - 60 req/hr (or 5000 with token)  
✅ **Type Safety** - Full TypeScript support  
✅ **Error Handling** - Proper error messages and status codes  
✅ **File Filtering** - Get only code files, docs, or search by extension  
✅ **Recursive Loading** - Handles nested directory structures  
✅ **Large File Support** - Uses download URLs for files > 1MB  
✅ **UI Component** - Ready-to-use React component  

## Use Cases

1. **Course Content Import** - Import code examples from GitHub repos
2. **Student Assignments** - Students submit GitHub repo links
3. **Code Review** - Fetch and analyze student code
4. **Template Library** - Build code template collection
5. **Documentation Import** - Import README and docs
6. **Example Projects** - Showcase real-world projects

## API Rate Limits

| Scenario | Requests/Hour |
|----------|---------------|
| Without token | 60 |
| With GitHub token | 5,000 |

## Testing the Feature

### 1. Install Dependencies
```bash
cd Backend/services/course-service
npm install
```

### 2. Start Services
```bash
# Terminal 1: Start infrastructure
cd Backend
docker-compose up -d

# Terminal 2: Start course service
cd Backend/services/course-service
npm run dev

# Terminal 3: Start frontend (optional)
cd Frontend
npm run dev
```

### 3. Test API
```bash
# Parse URL
curl -X POST http://localhost:4002/api/github/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/vercel/next.js"}'

# Process repository
curl -X POST http://localhost:4002/api/github/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/vercel/next.js", "includeContent": false}'
```

### 4. Test Frontend Component
Navigate to the page where you've included `<GitHubImporter />`

## Files Created/Modified

### New Files:
- ✅ `Backend/services/course-service/src/services/github.service.ts`
- ✅ `Backend/services/course-service/src/controllers/github.controller.ts`
- ✅ `Backend/services/course-service/src/routes/github.routes.ts`
- ✅ `Frontend/src/api/github.api.ts`
- ✅ `Frontend/src/components/github/GitHubImporter.tsx`
- ✅ `Backend/services/course-service/GITHUB_INTEGRATION.md` (Documentation)
- ✅ `GITHUB_INTEGRATION_FEATURE.md` (This file)

### Modified Files:
- ✅ `Backend/services/course-service/src/index.ts` (Added route)
- ✅ `Backend/services/course-service/package.json` (Added axios)
- ✅ `Backend/.env.example` (Added GITHUB_TOKEN)

## Security

- All endpoints require authentication
- Only public repositories accessible
- No write operations
- Rate limiting prevents abuse
- File size limits prevent memory issues
- Input validation on all endpoints

## Next Steps (Optional Enhancements)

- [ ] Cache repository data in Redis
- [ ] Webhook support for repo updates
- [ ] Private repo support (requires user OAuth)
- [ ] Batch import multiple repos
- [ ] Save imported repos to database
- [ ] Compare repo versions
- [ ] Create lessons from repo files automatically

## Documentation

Complete API documentation available at:
`Backend/services/course-service/GITHUB_INTEGRATION.md`

## Support

The feature is fully functional and ready to use. All endpoints are properly typed, documented, and error-handled.
