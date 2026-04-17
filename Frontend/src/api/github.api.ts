import apiClient from './client';

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  url: string;
  download_url: string | null;
}

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  topics: string[];
  license: {
    name: string;
    spdx_id: string;
  } | null;
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

export interface GitHubStructure {
  info: GitHubRepoInfo;
  files: GitHubFile[];
  branch: string;
  filesWithContent?: Array<{
    path: string;
    content: string;
    size: number;
  }>;
}

/**
 * Parse GitHub URL
 */
export const parseGitHubUrl = async (url: string): Promise<ParsedGitHubUrl> => {
  const response = await apiClient.post('/github/parse', { url });
  return response.data.data;
};

/**
 * Process GitHub URL and get complete repository data
 * Main function for importing from GitHub
 */
export const processGitHubUrl = async (
  url: string,
  includeContent: boolean = false
): Promise<GitHubStructure> => {
  const response = await apiClient.post('/github/process', {
    url,
    includeContent,
  });
  return response.data.data;
};

/**
 * Get repository information
 */
export const getRepoInfo = async (
  owner: string,
  repo: string
): Promise<GitHubRepoInfo> => {
  const response = await apiClient.get(`/github/${owner}/${repo}`);
  return response.data.data;
};

/**
 * Get repository structure
 */
export const getRepoStructure = async (
  owner: string,
  repo: string,
  branch?: string,
  path?: string
): Promise<GitHubStructure> => {
  const params = new URLSearchParams();
  if (branch) params.append('branch', branch);
  if (path) params.append('path', path);

  const response = await apiClient.get(
    `/github/${owner}/${repo}/structure?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Get file content
 */
export const getFileContent = async (
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; encoding: string; size: number }> => {
  const params = new URLSearchParams({ path });
  if (branch) params.append('branch', branch);

  const response = await apiClient.get(
    `/github/${owner}/${repo}/file?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Download multiple files
 */
export const downloadFiles = async (
  owner: string,
  repo: string,
  paths: string[],
  branch?: string
): Promise<Array<{ path: string; content: string; size: number }>> => {
  const response = await apiClient.post(`/github/${owner}/${repo}/download`, {
    paths,
    branch,
  });
  return response.data.data;
};

/**
 * Get only code files
 */
export const getCodeFiles = async (
  owner: string,
  repo: string,
  branch?: string,
  path?: string,
  includeContent?: boolean
): Promise<{
  info: GitHubRepoInfo;
  codeFiles: GitHubFile[];
  filesWithContent?: Array<{ path: string; content: string; size: number }>;
  total: number;
}> => {
  const params = new URLSearchParams();
  if (branch) params.append('branch', branch);
  if (path) params.append('path', path);
  if (includeContent) params.append('includeContent', 'true');

  const response = await apiClient.get(
    `/github/${owner}/${repo}/code?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Get documentation files
 */
export const getDocFiles = async (
  owner: string,
  repo: string,
  branch?: string,
  path?: string
): Promise<{
  info: GitHubRepoInfo;
  docFiles: GitHubFile[];
  total: number;
}> => {
  const params = new URLSearchParams();
  if (branch) params.append('branch', branch);
  if (path) params.append('path', path);

  const response = await apiClient.get(
    `/github/${owner}/${repo}/docs?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Search files by extension
 */
export const searchByExtension = async (
  owner: string,
  repo: string,
  extension: string,
  branch?: string,
  path?: string
): Promise<{
  info: GitHubRepoInfo;
  files: GitHubFile[];
  total: number;
  extension: string;
}> => {
  const params = new URLSearchParams({ extension });
  if (branch) params.append('branch', branch);
  if (path) params.append('path', path);

  const response = await apiClient.get(
    `/github/${owner}/${repo}/search?${params.toString()}`
  );
  return response.data.data;
};
