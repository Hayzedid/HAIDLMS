# GitHub Repository Integration

This service allows you to read and import content from public GitHub repositories using just the repository URL.

## Features

- ✅ Parse GitHub URLs to extract owner, repo, branch, and path
- ✅ Fetch repository information (stars, forks, description, etc.)
- ✅ Get complete repository structure (files and directories)
- ✅ Read file contents (with automatic base64 decoding)
- ✅ Filter files by type (code files, documentation, etc.)
- ✅ Search files by extension
- ✅ Download multiple files at once
- ✅ Works with public repositories (no authentication required)
- ✅ Optional GitHub token support for increased rate limits

## API Endpoints

### 1. Process GitHub URL (Main Endpoint)

The simplest way to get repository data:

```http
POST /api/github/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://github.com/owner/repo",
  "includeContent": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "info": {
      "name": "repo-name",
      "full_name": "owner/repo-name",
      "description": "Repository description",
      "default_branch": "main",
      "language": "TypeScript",
      "size": 1234,
      "stargazers_count": 100,
      "topics": ["nodejs", "typescript"]
    },
    "files": [
      {
        "name": "README.md",
        "path": "README.md",
        "type": "file",
        "size": 5432,
        "download_url": "https://..."
      }
    ],
    "branch": "main"
  }
}
```

### 2. Parse GitHub URL

Extract components from a GitHub URL:

```http
POST /api/github/parse
Authorization: Bearer <token>

{
  "url": "https://github.com/facebook/react/tree/main/packages"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "owner": "facebook",
    "repo": "react",
    "branch": "main",
    "path": "packages"
  }
}
```

### 3. Get Repository Info

```http
GET /api/github/:owner/:repo
Authorization: Bearer <token>
```

### 4. Get Repository Structure

```http
GET /api/github/:owner/:repo/structure?branch=main&path=src
Authorization: Bearer <token>
```

### 5. Get File Content

```http
GET /api/github/:owner/:repo/file?path=src/index.ts&branch=main
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "// File content here...",
    "encoding": "utf-8",
    "size": 1234
  }
}
```

### 6. Download Multiple Files

```http
POST /api/github/:owner/:repo/download
Authorization: Bearer <token>

{
  "paths": [
    "src/index.ts",
    "src/utils.ts",
    "package.json"
  ],
  "branch": "main"
}
```

### 7. Get Code Files Only

Get all code files from a repository (filters by extension):

```http
GET /api/github/:owner/:repo/code?includeContent=true
Authorization: Bearer <token>
```

### 8. Get Documentation Files

Get all markdown, txt, and doc files:

```http
GET /api/github/:owner/:repo/docs
Authorization: Bearer <token>
```

### 9. Search by Extension

```http
GET /api/github/:owner/:repo/search?extension=.ts
Authorization: Bearer <token>
```

## Supported URL Formats

The service can parse various GitHub URL formats:

```
https://github.com/owner/repo
https://github.com/owner/repo/tree/branch
https://github.com/owner/repo/tree/branch/path/to/folder
https://github.com/owner/repo/blob/branch/path/to/file.ext
```

## Rate Limits

- **Without token**: 60 requests per hour per IP
- **With token**: 5000 requests per hour

### Setting up GitHub Token (Optional)

1. Create a personal access token at: https://github.com/settings/tokens
2. No special permissions needed for public repos
3. Add to your `.env` file:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

## Usage Examples

### Import Course Materials from GitHub

```typescript
// Frontend example
import { processGitHubUrl } from '@/api/github.api';

const importFromGitHub = async () => {
  const repoUrl = 'https://github.com/microsoft/TypeScript';
  
  const result = await processGitHubUrl(repoUrl, true);
  
  console.log('Repository:', result.info.name);
  console.log('Files:', result.files.length);
  console.log('Code files:', result.filesWithContent);
};
```

### Get Specific Files

```typescript
import { getFileContent } from '@/api/github.api';

const getReadme = async () => {
  const content = await getFileContent(
    'facebook',
    'react',
    'README.md',
    'main'
  );
  
  console.log(content.content);
};
```

### Download Student Assignments

```typescript
import { downloadFiles } from '@/api/github.api';

const checkAssignment = async (studentRepo: string) => {
  const parsed = await parseGitHubUrl(studentRepo);
  
  const files = await downloadFiles(
    parsed.owner,
    parsed.repo,
    ['src/index.ts', 'tests/index.test.ts'],
    parsed.branch
  );
  
  files.forEach(file => {
    console.log(`File: ${file.path}`);
    console.log(`Size: ${file.size} bytes`);
    console.log(`Content: ${file.content}`);
  });
};
```

### Filter Code Files

```typescript
import { getCodeFiles } from '@/api/github.api';

const analyzeCode = async () => {
  const result = await getCodeFiles(
    'vercel',
    'next.js',
    'canary',
    'packages/next/src',
    true
  );
  
  console.log(`Found ${result.total} code files`);
  result.codeFiles.forEach(file => {
    console.log(`- ${file.path} (${file.size} bytes)`);
  });
};
```

## Error Handling

The API returns appropriate HTTP status codes:

- `400` - Bad request (invalid URL, missing parameters)
- `404` - Repository not found or is private
- `429` - Rate limit exceeded
- `500` - Server error

Example error response:

```json
{
  "success": false,
  "message": "Repository not found or is private"
}
```

## Limitations

- Only works with **public repositories**
- Maximum 100 files per download request
- File content limited to reasonable sizes (large files use download_url)
- Recursive directory traversal limited to depth of 10
- Code file content fetching limited to first 50 files

## Use Cases

1. **Course Content Import**: Import code examples and tutorials from GitHub
2. **Assignment Submission**: Students can submit GitHub repo links
3. **Code Review**: Fetch and analyze student code submissions
4. **Template Library**: Build a library of code templates from GitHub
5. **Documentation Import**: Import README and documentation files
6. **Example Projects**: Showcase real-world projects from GitHub

## Security Notes

- All requests require authentication (Bearer token)
- Only public repositories are accessible
- No write operations supported
- Rate limiting prevents abuse
- File size limits prevent memory issues

## Frontend Integration

The frontend API client provides TypeScript types and easy-to-use functions:

```typescript
import * as githubApi from '@/api/github.api';

// All functions are fully typed
const repo: githubApi.GitHubStructure = await githubApi.processGitHubUrl(url);
```

See `Frontend/src/api/github.api.ts` for complete TypeScript definitions.
