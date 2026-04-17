import { Router } from 'express';
import { enterpriseController } from '../controllers/enterprise.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enterprise
 *   description: Enterprise organization management endpoints
 */

// ========================================
// ORGANIZATIONS
// ========================================

/**
 * @swagger
 * /api/enterprise/organizations:
 *   post:
 *     summary: Create new organization (Admin only)
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - contactEmail
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization created successfully
 */
router.post(
  '/organizations',
  authenticate,
  authorizeRoles('admin'),
  enterpriseController.createOrganization.bind(enterpriseController)
);

/**
 * @swagger
 * /api/enterprise/organizations:
 *   get:
 *     summary: List all organizations (Admin only)
 *     tags: [Enterprise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
 */
router.get(
  '/organizations',
  authenticate,
  authorizeRoles('admin'),
  enterpriseController.listOrganizations.bind(enterpriseController)
);

/**
 * @swagger
 * /api/enterprise/organizations/{id}:
 *   get:
 *     summary: Get organization details
 *     tags: [Enterprise]
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
 *         description: Organization retrieved successfully
 */
router.get(
  '/organizations/:id',
  authenticate,
  enterpriseController.getOrganization.bind(enterpriseController)
);

/**
 * @swagger
 * /api/enterprise/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Enterprise]
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
 *         description: Organization updated successfully
 */
router.put(
  '/organizations/:id',
  authenticate,
  enterpriseController.updateOrganization.bind(enterpriseController)
);

/**
 * @swagger
 * /api/enterprise/organizations/{id}:
 *   delete:
 *     summary: Delete organization (Admin only)
 *     tags: [Enterprise]
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
 *         description: Organization deleted successfully
 */
router.delete(
  '/organizations/:id',
  authenticate,
  authorizeRoles('admin'),
  enterpriseController.deleteOrganization.bind(enterpriseController)
);

// ========================================
// ORGANIZATION SETTINGS
// ========================================

router.get(
  '/organizations/:id/settings',
  authenticate,
  enterpriseController.getOrganizationSettings.bind(enterpriseController)
);

router.put(
  '/organizations/:id/settings',
  authenticate,
  enterpriseController.updateOrganizationSettings.bind(enterpriseController)
);

// ========================================
// DEPARTMENTS
// ========================================

router.post(
  '/departments',
  authenticate,
  enterpriseController.createDepartment.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/departments',
  authenticate,
  enterpriseController.listDepartments.bind(enterpriseController)
);

router.get(
  '/departments/:id',
  authenticate,
  enterpriseController.getDepartment.bind(enterpriseController)
);

router.put(
  '/departments/:id',
  authenticate,
  enterpriseController.updateDepartment.bind(enterpriseController)
);

router.delete(
  '/departments/:id',
  authenticate,
  enterpriseController.deleteDepartment.bind(enterpriseController)
);

// ========================================
// TEAMS
// ========================================

router.post(
  '/teams',
  authenticate,
  enterpriseController.createTeam.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/teams',
  authenticate,
  enterpriseController.listTeams.bind(enterpriseController)
);

router.get(
  '/teams/:id',
  authenticate,
  enterpriseController.getTeam.bind(enterpriseController)
);

router.put(
  '/teams/:id',
  authenticate,
  enterpriseController.updateTeam.bind(enterpriseController)
);

router.delete(
  '/teams/:id',
  authenticate,
  enterpriseController.deleteTeam.bind(enterpriseController)
);

router.post(
  '/teams/:id/members',
  authenticate,
  enterpriseController.addTeamMember.bind(enterpriseController)
);

router.delete(
  '/teams/:id/members/:userId',
  authenticate,
  enterpriseController.removeTeamMember.bind(enterpriseController)
);

router.get(
  '/teams/:id/members',
  authenticate,
  enterpriseController.getTeamMembers.bind(enterpriseController)
);

// ========================================
// ORGANIZATION MEMBERS
// ========================================

router.post(
  '/organizations/:organizationId/members',
  authenticate,
  enterpriseController.addOrganizationMember.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/members',
  authenticate,
  enterpriseController.getOrganizationMembers.bind(enterpriseController)
);

router.put(
  '/organizations/:organizationId/members/:userId',
  authenticate,
  enterpriseController.updateOrganizationMember.bind(enterpriseController)
);

router.delete(
  '/organizations/:organizationId/members/:userId',
  authenticate,
  enterpriseController.removeOrganizationMember.bind(enterpriseController)
);

// ========================================
// LICENSES
// ========================================

router.post(
  '/licenses',
  authenticate,
  authorizeRoles('admin'),
  enterpriseController.createLicense.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/licenses',
  authenticate,
  enterpriseController.getLicenses.bind(enterpriseController)
);

router.post(
  '/licenses/:licenseId/assign',
  authenticate,
  enterpriseController.assignLicense.bind(enterpriseController)
);

router.delete(
  '/licenses/:licenseId/revoke/:userId',
  authenticate,
  enterpriseController.revokeLicense.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/licenses/availability',
  authenticate,
  enterpriseController.checkLicenseAvailability.bind(enterpriseController)
);

// ========================================
// ORGANIZATION COURSES
// ========================================

router.post(
  '/organizations/:organizationId/courses/:courseId',
  authenticate,
  enterpriseController.addCourseToOrganization.bind(enterpriseController)
);

router.delete(
  '/organizations/:organizationId/courses/:courseId',
  authenticate,
  enterpriseController.removeCourseFromOrganization.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/courses',
  authenticate,
  enterpriseController.getOrganizationCourses.bind(enterpriseController)
);

// ========================================
// INVITATIONS
// ========================================

router.post(
  '/organizations/:organizationId/invitations',
  authenticate,
  enterpriseController.createInvitation.bind(enterpriseController)
);

router.post(
  '/invitations/:token/accept',
  authenticate,
  enterpriseController.acceptInvitation.bind(enterpriseController)
);

router.delete(
  '/invitations/:invitationId',
  authenticate,
  enterpriseController.cancelInvitation.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/invitations',
  authenticate,
  enterpriseController.getOrganizationInvitations.bind(enterpriseController)
);

// ========================================
// ANALYTICS
// ========================================

router.post(
  '/organizations/:organizationId/analytics/aggregate',
  authenticate,
  authorizeRoles('admin'),
  enterpriseController.aggregateOrganizationAnalytics.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/analytics',
  authenticate,
  enterpriseController.getOrganizationAnalytics.bind(enterpriseController)
);

router.get(
  '/organizations/:organizationId/audit-log',
  authenticate,
  enterpriseController.getAuditLog.bind(enterpriseController)
);

// ========================================
// HELPER ENDPOINTS
// ========================================

router.get(
  '/my-organization',
  authenticate,
  enterpriseController.getUserOrganization.bind(enterpriseController)
);

export default router;
