import { Request, Response } from 'express';
import { portfolioService } from '../services/portfolio.service';

export class PortfolioController {
  // ========================================
  // PUBLIC ENDPOINTS
  // ========================================

  /**
   * @swagger
   * /api/portfolio/{username}:
   *   get:
   *     summary: Get public portfolio by username
   *     tags: [Portfolio]
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *         description: Custom URL slug or username
   *     responses:
   *       200:
   *         description: Portfolio data retrieved successfully
   *       404:
   *         description: Portfolio not found or not public
   */
  async getPublicPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      const portfolio = await portfolioService.getPortfolioByUsername(username);

      res.status(200).json({
        success: true,
        data: portfolio,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Portfolio not found',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/{username}/view:
   *   post:
   *     summary: Track portfolio view
   *     tags: [Portfolio]
   *     parameters:
   *       - in: path
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               referrer:
   *                 type: string
   *     responses:
   *       200:
   *         description: View tracked successfully
   */
  async trackView(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      const { referrer } = req.body;

      // Get user ID from username
      const portfolio = await portfolioService.getPortfolioByUsername(username);

      // Extract viewer info from request
      const viewerIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const viewerUserAgent = req.headers['user-agent'];

      // Determine referrer source
      let referrerSource = 'direct';
      if (referrer) {
        if (referrer.includes('linkedin.com')) referrerSource = 'linkedin';
        else if (referrer.includes('github.com')) referrerSource = 'github';
        else if (referrer.includes('google.com')) referrerSource = 'google';
        else if (referrer.includes('twitter.com')) referrerSource = 'twitter';
        else referrerSource = 'other';
      }

      await portfolioService.trackView({
        portfolioUserId: portfolio.user.id,
        viewerIp,
        viewerUserAgent,
        referrerUrl: referrer,
        referrerSource,
      });

      res.status(200).json({
        success: true,
        message: 'View tracked',
      });
    } catch (error: any) {
      // Silent fail for view tracking
      res.status(200).json({
        success: true,
        message: 'View tracking skipped',
      });
    }
  }

  // ========================================
  // AUTHENTICATED ENDPOINTS
  // ========================================

  /**
   * @swagger
   * /api/portfolio/settings:
   *   get:
   *     summary: Get current user's portfolio settings
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Settings retrieved successfully
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const settings = await portfolioService.getPortfolioSettings(userId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get settings',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/settings:
   *   put:
   *     summary: Update portfolio settings
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               isPublic:
   *                 type: boolean
   *               customUrlSlug:
   *                 type: string
   *               displayName:
   *                 type: string
   *               headline:
   *                 type: string
   *               bio:
   *                 type: string
   *               location:
   *                 type: string
   *               linkedinUrl:
   *                 type: string
   *               githubUrl:
   *                 type: string
   *               personalWebsite:
   *                 type: string
   *               themeColor:
   *                 type: string
   *     responses:
   *       200:
   *         description: Settings updated successfully
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const settings = req.body;

      // Validate custom URL slug if provided
      if (settings.customUrlSlug) {
        const isAvailable = await portfolioService.checkSlugAvailability(
          settings.customUrlSlug,
          userId
        );

        if (!isAvailable) {
          res.status(400).json({
            success: false,
            message: 'Custom URL slug is already taken',
          });
          return;
        }
      }

      const updatedSettings = await portfolioService.updatePortfolioSettings(
        userId,
        settings
      );

      res.status(200).json({
        success: true,
        data: updatedSettings,
        message: 'Portfolio settings updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update settings',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/slug-available/{slug}:
   *   get:
   *     summary: Check if custom URL slug is available
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Availability status
   */
  async checkSlugAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const userId = (req as any).user.id;

      const isAvailable = await portfolioService.checkSlugAvailability(slug, userId);

      res.status(200).json({
        success: true,
        data: { available: isAvailable },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check availability',
      });
    }
  }

  // ========================================
  // PROJECTS
  // ========================================

  /**
   * @swagger
   * /api/portfolio/projects:
   *   get:
   *     summary: Get current user's projects
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Projects retrieved successfully
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const projects = await portfolioService.getProjects(userId);

      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get projects',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/projects/{id}:
   *   get:
   *     summary: Get project by ID
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Project retrieved successfully
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const project = await portfolioService.getProjectById(id, userId);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Project not found',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/projects:
   *   post:
   *     summary: Create a new project
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - description
   *               - technologies
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               detailedDescription:
   *                 type: string
   *               technologies:
   *                 type: array
   *                 items:
   *                   type: string
   *               liveUrl:
   *                 type: string
   *               repositoryUrl:
   *                 type: string
   *               thumbnailUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: Project created successfully
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const projectData = {
        ...req.body,
        userId,
      };

      const project = await portfolioService.createProject(projectData);

      // Create activity entry
      await portfolioService.createActivity({
        userId,
        activityType: 'project_published',
        activityTitle: `Published project: ${project.title}`,
        relatedProjectId: project.id,
        iconName: 'code',
        iconColor: '#3b82f6',
      });

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create project',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/projects/{id}:
   *   put:
   *     summary: Update a project
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Project updated successfully
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updates = req.body;

      const project = await portfolioService.updateProject(id, userId, updates);

      res.status(200).json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update project',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/projects/{id}:
   *   delete:
   *     summary: Delete a project
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Project deleted successfully
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await portfolioService.deleteProject(id, userId);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete project',
      });
    }
  }

  // ========================================
  // SKILLS & COMPETENCY
  // ========================================

  /**
   * @swagger
   * /api/portfolio/skills:
   *   get:
   *     summary: Get current user's competency scores
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Skills retrieved successfully
   */
  async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const skills = await portfolioService.getCompetencyScores(userId);

      res.status(200).json({
        success: true,
        data: skills,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get skills',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/skills:
   *   post:
   *     summary: Update competency score
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - skillName
   *               - proficiencyLevel
   *               - proficiencyScore
   *             properties:
   *               skillName:
   *                 type: string
   *               proficiencyLevel:
   *                 type: string
   *               proficiencyScore:
   *                 type: number
   *     responses:
   *       200:
   *         description: Skill updated successfully
   */
  async updateSkill(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const skillData = {
        ...req.body,
        userId,
      };

      const skill = await portfolioService.updateCompetencyScore(skillData);

      res.status(200).json({
        success: true,
        data: skill,
        message: 'Skill updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update skill',
      });
    }
  }

  // ========================================
  // ACTIVITY
  // ========================================

  /**
   * @swagger
   * /api/portfolio/activity:
   *   get:
   *     summary: Get current user's activity timeline
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Activity retrieved successfully
   */
  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const activity = await portfolioService.getActivity(userId, limit);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get activity',
      });
    }
  }

  // ========================================
  // ENDORSEMENTS
  // ========================================

  /**
   * @swagger
   * /api/portfolio/endorsements/{userId}:
   *   get:
   *     summary: Get endorsements for a user
   *     tags: [Portfolio]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Endorsements retrieved successfully
   */
  async getEndorsements(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const endorsements = await portfolioService.getEndorsements(userId);

      res.status(200).json({
        success: true,
        data: endorsements,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get endorsements',
      });
    }
  }

  /**
   * @swagger
   * /api/portfolio/endorsements:
   *   post:
   *     summary: Endorse a peer's skill
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - portfolioUserId
   *               - skillName
   *             properties:
   *               portfolioUserId:
   *                 type: string
   *               skillName:
   *                 type: string
   *               endorsementMessage:
   *                 type: string
   *               workedTogetherOn:
   *                 type: string
   *     responses:
   *       201:
   *         description: Endorsement created successfully
   */
  async createEndorsement(req: Request, res: Response): Promise<void> {
    try {
      const endorserUserId = (req as any).user.id;
      const endorsementData = {
        ...req.body,
        endorserUserId,
      };

      // Prevent self-endorsement
      if (endorsementData.portfolioUserId === endorserUserId) {
        res.status(400).json({
          success: false,
          message: 'You cannot endorse yourself',
        });
        return;
      }

      const endorsement = await portfolioService.createEndorsement(endorsementData);

      res.status(201).json({
        success: true,
        data: endorsement,
        message: 'Endorsement created successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create endorsement',
      });
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * @swagger
   * /api/portfolio/analytics:
   *   get:
   *     summary: Get portfolio analytics
   *     tags: [Portfolio]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Analytics retrieved successfully
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const [stats, viewAnalytics] = await Promise.all([
        portfolioService.getPortfolioStats(userId),
        portfolioService.getViewAnalytics(userId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          stats,
          viewAnalytics,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get analytics',
      });
    }
  }
}

export const portfolioController = new PortfolioController();
