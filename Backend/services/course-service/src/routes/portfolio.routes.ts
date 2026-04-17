import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * Get public portfolio by username
 * GET /api/portfolio/:username
 */
router.get('/:username', portfolioController.getPublicPortfolio.bind(portfolioController));

/**
 * Track portfolio view
 * POST /api/portfolio/:username/view
 */
router.post('/:username/view', portfolioController.trackView.bind(portfolioController));

// ========================================
// AUTHENTICATED ROUTES
// ========================================

/**
 * Get current user's portfolio settings
 * GET /api/portfolio/settings
 */
router.get('/settings', authenticate, portfolioController.getSettings.bind(portfolioController));

/**
 * Update portfolio settings
 * PUT /api/portfolio/settings
 */
router.put('/settings', authenticate, portfolioController.updateSettings.bind(portfolioController));

/**
 * Check if custom URL slug is available
 * GET /api/portfolio/slug-available/:slug
 */
router.get('/slug-available/:slug', authenticate, portfolioController.checkSlugAvailability.bind(portfolioController));

// ========================================
// PROJECTS
// ========================================

/**
 * Get current user's projects
 * GET /api/portfolio/projects
 */
router.get('/projects', authenticate, portfolioController.getProjects.bind(portfolioController));

/**
 * Get project by ID
 * GET /api/portfolio/projects/:id
 */
router.get('/projects/:id', authenticate, portfolioController.getProjectById.bind(portfolioController));

/**
 * Create a new project
 * POST /api/portfolio/projects
 */
router.post('/projects', authenticate, portfolioController.createProject.bind(portfolioController));

/**
 * Update a project
 * PUT /api/portfolio/projects/:id
 */
router.put('/projects/:id', authenticate, portfolioController.updateProject.bind(portfolioController));

/**
 * Delete a project
 * DELETE /api/portfolio/projects/:id
 */
router.delete('/projects/:id', authenticate, portfolioController.deleteProject.bind(portfolioController));

// ========================================
// SKILLS & COMPETENCY
// ========================================

/**
 * Get current user's competency scores
 * GET /api/portfolio/skills
 */
router.get('/skills', authenticate, portfolioController.getSkills.bind(portfolioController));

/**
 * Update competency score
 * POST /api/portfolio/skills
 */
router.post('/skills', authenticate, portfolioController.updateSkill.bind(portfolioController));

// ========================================
// ACTIVITY
// ========================================

/**
 * Get current user's activity timeline
 * GET /api/portfolio/activity
 */
router.get('/activity', authenticate, portfolioController.getActivity.bind(portfolioController));

// ========================================
// ENDORSEMENTS
// ========================================

/**
 * Get endorsements for a user
 * GET /api/portfolio/endorsements/:userId
 */
router.get('/endorsements/:userId', portfolioController.getEndorsements.bind(portfolioController));

/**
 * Endorse a peer's skill
 * POST /api/portfolio/endorsements
 */
router.post('/endorsements', authenticate, portfolioController.createEndorsement.bind(portfolioController));

// ========================================
// ANALYTICS
// ========================================

/**
 * Get portfolio analytics
 * GET /api/portfolio/analytics
 */
router.get('/analytics', authenticate, portfolioController.getAnalytics.bind(portfolioController));

export default router;
