import axios from 'axios';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  url: string;
  download_url: string | null;
  content?: string;
  encoding?: string;
}

interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  topics: string[];
  license: {
    name: string;
    spdx_id: string;
  } | null;
}

interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

export class GitHubService {
  private readonly apiBase = 'https://api.github.com';
  private readonly headers: Record<string, string>;

  constructor() {
    // GitHub token is optional for public repos but increases rate limit
    this.headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'TechLearn-LMS',
    };

    // Add token if available (increases rate limit from 60 to 5000 req/hour)
    if (process.env.GITHUB_TOKEN) {
      this.headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
  }

  /**
   * Parse GitHub URL to extract owner, repo, branch, and path
   */
  parseGitHubUrl(url: string): ParsedGitHubUrl {
    // Remove .git suffix if present
    const cleanUrl = url.replace(/\.git$/, '');

    // Match various GitHub URL patterns:
    // https://github.com/owner/repo
    // https://github.com/owner/repo/tree/branch/path/to/file
    // https://github.com/owner/repo/blob/branch/path/to/file.ext
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)\/(tree|blob)\/([^\/]+)\/(.+)/,
      /github\.com\/([^\/]+)\/([^\/]+)\/(tree|blob)\/([^\/]+)\/?$/,
      /github\.com\/([^\/]+)\/([^\/]+)\/?$/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const [, owner, repo, , branch, path] = match;
        return {
          owner,
          repo,
          branch: branch || undefined,
          path: path || undefined,
        };
      }
    }

    throw new Error('Invalid GitHub URL format');
  }

  /**
   * Get repository information
   */
  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    const url = `${this.apiBase}/repos/${owner}/${repo}`;
    const response = await axios.get(url, { headers: this.headers });
    return response.data;
  }

  /**
   * Get default branch for a repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const repoInfo = await this.getRepoInfo(owner, repo);
    return repoInfo.default_branch;
  }

  /**
   * Get contents of a file or directory
   */
  async getContents(
    owner: string,
    repo: string,
    path: string = '',
    branch?: string
  ): Promise<GitHubFile | GitHubFile[]> {
    let url = `${this.apiBase}/repos/${owner}/${repo}/contents/${path}`;

    if (branch) {
      url += `?ref=${branch}`;
    }

    const response = await axios.get(url, { headers: this.headers });
    return response.data;
  }

  /**
   * Get file content (decoded if base64)
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch?: string
  ): Promise<{ content: string; encoding: string; size: number }> {
    const file = await this.getContents(owner, repo, path, branch);

    if (Array.isArray(file)) {
      throw new Error('Path is a directory, not a file');
    }

    if (file.type !== 'file') {
      throw new Error('Path is not a file');
    }

    // If file is too large, use download_url
    if (file.size > 1000000 && file.download_url) {
      const response = await axios.get(file.download_url);
      return {
        content: response.data,
        encoding: 'raw',
        size: file.size,
      };
    }

    // Decode base64 content
    if (file.content && file.encoding === 'base64') {
      const decoded = Buffer.from(file.content, 'base64').toString('utf-8');
      return {
        content: decoded,
        encoding: 'utf-8',
        size: file.size,
      };
    }

    return {
      content: file.content || '',
      encoding: file.encoding || 'utf-8',
      size: file.size,
    };
  }

  /**
   * Recursively get all files in a directory
   */
  async getDirectoryTree(
    owner: string,
    repo: string,
    path: string = '',
    branch?: string,
    maxDepth: number = 10,
    currentDepth: number = 0
  ): Promise<GitHubFile[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const contents = await this.getContents(owner, repo, path, branch);
    const items = Array.isArray(contents) ? contents : [contents];
    const result: GitHubFile[] = [];

    for (const item of items) {
      result.push(item);

      if (item.type === 'dir') {
        const subItems = await this.getDirectoryTree(
          owner,
          repo,
          item.path,
          branch,
          maxDepth,
          currentDepth + 1
        );
        result.push(...subItems);
      }
    }

    return result;
  }

  /**
   * Get repository structure with files and directories
   */
  async getRepoStructure(
    owner: string,
    repo: string,
    branch?: string,
    path?: string
  ): Promise<{
    info: GitHubRepoInfo;
    files: GitHubFile[];
    branch: string;
  }> {
    const info = await this.getRepoInfo(owner, repo);
    const targetBranch = branch || info.default_branch;
    const files = await this.getDirectoryTree(owner, repo, path || '', targetBranch);

    return {
      info,
      files,
      branch: targetBranch,
    };
  }

  /**
   * Download multiple files with their content
   */
  async downloadFiles(
    owner: string,
    repo: string,
    paths: string[],
    branch?: string
  ): Promise<Array<{ path: string; content: string; size: number }>> {
    const results = [];

    for (const path of paths) {
      try {
        const fileData = await this.getFileContent(owner, repo, path, branch);
        results.push({
          path,
          content: fileData.content,
          size: fileData.size,
        });
      } catch (error) {
        console.error(`Failed to download ${path}:`, error);
        results.push({
          path,
          content: '',
          size: 0,
        });
      }
    }

    return results;
  }

  /**
   * Search for files by extension or pattern
   */
  filterFilesByExtension(files: GitHubFile[], extension: string): GitHubFile[] {
    return files.filter(
      (file) => file.type === 'file' && file.name.endsWith(extension)
    );
  }

  /**
   * Get programming language files
   */
  getCodeFiles(files: GitHubFile[]): GitHubFile[] {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.r',
      '.sql', '.sh', '.bash', '.html', '.css', '.scss', '.vue',
    ];

    return files.filter((file) =>
      file.type === 'file' &&
      codeExtensions.some((ext) => file.name.endsWith(ext))
    );
  }

  /**
   * Get documentation files (markdown, txt, pdf)
   */
  getDocFiles(files: GitHubFile[]): GitHubFile[] {
    const docExtensions = ['.md', '.txt', '.pdf', '.doc', '.docx'];
    return files.filter((file) =>
      file.type === 'file' &&
      docExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  /**
   * Main entry point: process GitHub URL and return structure
   */
  async processGitHubUrl(url: string, includeContent: boolean = false) {
    const parsed = this.parseGitHubUrl(url);
    const structure = await this.getRepoStructure(
      parsed.owner,
      parsed.repo,
      parsed.branch,
      parsed.path
    );

    // Optionally include file contents
    if (includeContent) {
      const codeFiles = this.getCodeFiles(structure.files);
      const filePaths = codeFiles.slice(0, 50).map((f) => f.path); // Limit to 50 files
      const filesWithContent = await this.downloadFiles(
        parsed.owner,
        parsed.repo,
        filePaths,
        structure.branch
      );

      return {
        ...structure,
        filesWithContent,
      };
    }

    return structure;
  }
}

export const githubService = new GitHubService();
