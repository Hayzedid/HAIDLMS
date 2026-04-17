import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { githubService } from '../services/github.service';

/**
 * Parse GitHub URL and return repository info
 */
export const parseGitHubUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        message: 'GitHub URL is required',
      });
      return;
    }

    const parsed = githubService.parseGitHubUrl(url);
    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse GitHub URL',
    });
  }
};

/**
 * Get repository information
 */
export const getRepoInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;

    const info = await githubService.getRepoInfo(owner, repo);
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch repository info',
    });
  }
};

/**
 * Get repository structure (files and directories)
 */
export const getRepoStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { branch, path } = req.query;

    const structure = await githubService.getRepoStructure(
      owner,
      repo,
      branch as string | undefined,
      path as string | undefined
    );

    res.json({
      success: true,
      data: structure,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch repository structure',
    });
  }
};

/**
 * Get file content from repository
 */
export const getFileContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { path, branch } = req.query;

    if (!path) {
      res.status(400).json({
        success: false,
        message: 'File path is required',
      });
      return;
    }

    const fileData = await githubService.getFileContent(
      owner,
      repo,
      path as string,
      branch as string | undefined
    );

    res.json({
      success: true,
      data: fileData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch file content',
    });
  }
};

/**
 * Process GitHub URL and return complete repository data
 * Main endpoint for importing from GitHub
 */
export const processGitHubUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url, includeContent = false } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        message: 'GitHub URL is required',
      });
      return;
    }

    const result = await githubService.processGitHubUrl(url, includeContent);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process GitHub URL';

    // Check for specific GitHub API errors
    if (message.includes('404')) {
      res.status(404).json({
        success: false,
        message: 'Repository not found or is private',
      });
      return;
    }

    if (message.includes('403') || message.includes('rate limit')) {
      res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Please try again later.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
};

/**
 * Download multiple files from repository
 */
export const downloadFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { paths, branch } = req.body;

    if (!paths || !Array.isArray(paths)) {
      res.status(400).json({
        success: false,
        message: 'Paths array is required',
      });
      return;
    }

    if (paths.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Maximum 100 files can be downloaded at once',
      });
      return;
    }

    const files = await githubService.downloadFiles(owner, repo, paths, branch);

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download files',
    });
  }
};

/**
 * Get only code files from repository
 */
export const getCodeFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { branch, path, includeContent = false } = req.query;

    const structure = await githubService.getRepoStructure(
      owner,
      repo,
      branch as string | undefined,
      path as string | undefined
    );

    const codeFiles = githubService.getCodeFiles(structure.files);

    // Optionally include content
    let filesWithContent;
    if (includeContent === 'true') {
      const filePaths = codeFiles.slice(0, 50).map((f) => f.path);
      filesWithContent = await githubService.downloadFiles(
        owner,
        repo,
        filePaths,
        structure.branch
      );
    }

    res.json({
      success: true,
      data: {
        info: structure.info,
        codeFiles,
        filesWithContent,
        total: codeFiles.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch code files',
    });
  }
};

/**
 * Get documentation files from repository
 */
export const getDocFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { branch, path } = req.query;

    const structure = await githubService.getRepoStructure(
      owner,
      repo,
      branch as string | undefined,
      path as string | undefined
    );

    const docFiles = githubService.getDocFiles(structure.files);

    res.json({
      success: true,
      data: {
        info: structure.info,
        docFiles,
        total: docFiles.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch documentation files',
    });
  }
};

/**
 * Search repository by file extension
 */
export const searchByExtension = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { owner, repo } = req.params;
    const { extension, branch, path } = req.query;

    if (!extension) {
      res.status(400).json({
        success: false,
        message: 'File extension is required',
      });
      return;
    }

    const structure = await githubService.getRepoStructure(
      owner,
      repo,
      branch as string | undefined,
      path as string | undefined
    );

    const ext = (extension as string).startsWith('.')
      ? extension as string
      : `.${extension}`;

    const filteredFiles = githubService.filterFilesByExtension(structure.files, ext);

    res.json({
      success: true,
      data: {
        info: structure.info,
        files: filteredFiles,
        total: filteredFiles.length,
        extension: ext,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to search files',
    });
  }
};
