import { Router } from 'express';
import * as githubController from '../controllers/github.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/github/parse
 * @desc    Parse GitHub URL to extract owner, repo, branch, path
 * @access  Private (any authenticated user)
 * @body    { url: string }
 */
router.post('/parse', githubController.parseGitHubUrl);

/**
 * @route   POST /api/github/process
 * @desc    Main endpoint: Process GitHub URL and return complete repo data
 * @access  Private (any authenticated user)
 * @body    { url: string, includeContent?: boolean }
 */
router.post('/process', githubController.processGitHubUrl);

/**
 * @route   GET /api/github/:owner/:repo
 * @desc    Get repository information
 * @access  Private (any authenticated user)
 */
router.get('/:owner/:repo', githubController.getRepoInfo);

/**
 * @route   GET /api/github/:owner/:repo/structure
 * @desc    Get repository structure (files and directories)
 * @access  Private (any authenticated user)
 * @query   { branch?: string, path?: string }
 */
router.get('/:owner/:repo/structure', githubController.getRepoStructure);

/**
 * @route   GET /api/github/:owner/:repo/file
 * @desc    Get file content from repository
 * @access  Private (any authenticated user)
 * @query   { path: string, branch?: string }
 */
router.get('/:owner/:repo/file', githubController.getFileContent);

/**
 * @route   POST /api/github/:owner/:repo/download
 * @desc    Download multiple files from repository
 * @access  Private (any authenticated user)
 * @body    { paths: string[], branch?: string }
 */
router.post('/:owner/:repo/download', githubController.downloadFiles);

/**
 * @route   GET /api/github/:owner/:repo/code
 * @desc    Get only code files from repository
 * @access  Private (any authenticated user)
 * @query   { branch?: string, path?: string, includeContent?: boolean }
 */
router.get('/:owner/:repo/code', githubController.getCodeFiles);

/**
 * @route   GET /api/github/:owner/:repo/docs
 * @desc    Get documentation files from repository
 * @access  Private (any authenticated user)
 * @query   { branch?: string, path?: string }
 */
router.get('/:owner/:repo/docs', githubController.getDocFiles);

/**
 * @route   GET /api/github/:owner/:repo/search
 * @desc    Search repository by file extension
 * @access  Private (any authenticated user)
 * @query   { extension: string, branch?: string, path?: string }
 */
router.get('/:owner/:repo/search', githubController.searchByExtension);

export default router;
