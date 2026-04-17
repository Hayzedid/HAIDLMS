import apiClient from './client';
/**
 * Parse GitHub URL
 */
export const parseGitHubUrl = async (url) => {
    const response = await apiClient.post('/github/parse', { url });
    return response.data.data;
};
/**
 * Process GitHub URL and get complete repository data
 * Main function for importing from GitHub
 */
export const processGitHubUrl = async (url, includeContent = false) => {
    const response = await apiClient.post('/github/process', {
        url,
        includeContent,
    });
    return response.data.data;
};
/**
 * Get repository information
 */
export const getRepoInfo = async (owner, repo) => {
    const response = await apiClient.get(`/github/${owner}/${repo}`);
    return response.data.data;
};
/**
 * Get repository structure
 */
export const getRepoStructure = async (owner, repo, branch, path) => {
    const params = new URLSearchParams();
    if (branch)
        params.append('branch', branch);
    if (path)
        params.append('path', path);
    const response = await apiClient.get(`/github/${owner}/${repo}/structure?${params.toString()}`);
    return response.data.data;
};
/**
 * Get file content
 */
export const getFileContent = async (owner, repo, path, branch) => {
    const params = new URLSearchParams({ path });
    if (branch)
        params.append('branch', branch);
    const response = await apiClient.get(`/github/${owner}/${repo}/file?${params.toString()}`);
    return response.data.data;
};
/**
 * Download multiple files
 */
export const downloadFiles = async (owner, repo, paths, branch) => {
    const response = await apiClient.post(`/github/${owner}/${repo}/download`, {
        paths,
        branch,
    });
    return response.data.data;
};
/**
 * Get only code files
 */
export const getCodeFiles = async (owner, repo, branch, path, includeContent) => {
    const params = new URLSearchParams();
    if (branch)
        params.append('branch', branch);
    if (path)
        params.append('path', path);
    if (includeContent)
        params.append('includeContent', 'true');
    const response = await apiClient.get(`/github/${owner}/${repo}/code?${params.toString()}`);
    return response.data.data;
};
/**
 * Get documentation files
 */
export const getDocFiles = async (owner, repo, branch, path) => {
    const params = new URLSearchParams();
    if (branch)
        params.append('branch', branch);
    if (path)
        params.append('path', path);
    const response = await apiClient.get(`/github/${owner}/${repo}/docs?${params.toString()}`);
    return response.data.data;
};
/**
 * Search files by extension
 */
export const searchByExtension = async (owner, repo, extension, branch, path) => {
    const params = new URLSearchParams({ extension });
    if (branch)
        params.append('branch', branch);
    if (path)
        params.append('path', path);
    const response = await apiClient.get(`/github/${owner}/${repo}/search?${params.toString()}`);
    return response.data.data;
};
