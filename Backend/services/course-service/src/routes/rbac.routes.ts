import { Router } from 'express';
import { rbacController } from '../controllers/rbac.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-Based Access Control management
 */

// All RBAC routes require authentication
router.use(authenticate);

// ========================================
// ROLES
// ========================================

/**
 * @swagger
 * /api/rbac/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [RBAC]
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
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentRoleId:
 *                 type: string
 *               scope:
 *                 type: string
 *                 enum: [system, organization, course, custom]
 *               organizationId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Role created successfully
 */
router.post('/roles', rbacController.createRole.bind(rbacController));

/**
 * @swagger
 * /api/rbac/roles:
 *   get:
 *     summary: List all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isSystemRole
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get('/roles', rbacController.listRoles.bind(rbacController));

/**
 * @swagger
 * /api/rbac/roles/{roleId}:
 *   get:
 *     summary: Get role details
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 */
router.get('/roles/:roleId', rbacController.getRole.bind(rbacController));

router.put('/roles/:roleId', rbacController.updateRole.bind(rbacController));
router.delete('/roles/:roleId', rbacController.deleteRole.bind(rbacController));

/**
 * @swagger
 * /api/rbac/roles/{roleId}/hierarchy:
 *   get:
 *     summary: Get role hierarchy
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role hierarchy retrieved successfully
 */
router.get('/roles/:roleId/hierarchy', rbacController.getRoleHierarchy.bind(rbacController));

// ========================================
// PERMISSIONS
// ========================================

/**
 * @swagger
 * /api/rbac/permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [RBAC]
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
 *               - resource
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               resource:
 *                 type: string
 *               action:
 *                 type: string
 *               category:
 *                 type: string
 *               conditions:
 *                 type: object
 *               isDangerous:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Permission created successfully
 */
router.post('/permissions', rbacController.createPermission.bind(rbacController));

/**
 * @swagger
 * /api/rbac/permissions:
 *   get:
 *     summary: List all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isDangerous
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 */
router.get('/permissions', rbacController.listPermissions.bind(rbacController));

router.get('/permissions/:permissionId', rbacController.getPermission.bind(rbacController));

// ========================================
// ROLE-PERMISSION ASSIGNMENTS
// ========================================

/**
 * @swagger
 * /api/rbac/roles/{roleId}/permissions/{permissionId}:
 *   post:
 *     summary: Assign permission to role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customConditions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Permission assigned successfully
 */
router.post('/roles/:roleId/permissions/:permissionId', rbacController.assignPermissionToRole.bind(rbacController));

router.delete('/roles/:roleId/permissions/:permissionId', rbacController.removePermissionFromRole.bind(rbacController));

/**
 * @swagger
 * /api/rbac/roles/{roleId}/permissions:
 *   get:
 *     summary: Get role permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
 */
router.get('/roles/:roleId/permissions', rbacController.getRolePermissions.bind(rbacController));

/**
 * @swagger
 * /api/rbac/roles/{roleId}/permissions/bulk:
 *   post:
 *     summary: Bulk assign permissions to role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 */
router.post('/roles/:roleId/permissions/bulk', rbacController.bulkAssignPermissionsToRole.bind(rbacController));

// ========================================
// USER-ROLE ASSIGNMENTS
// ========================================

/**
 * @swagger
 * /api/rbac/users/{userId}/roles/{roleId}:
 *   post:
 *     summary: Assign role to user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scopeType:
 *                 type: string
 *               scopeId:
 *                 type: string
 *               startsAt:
 *                 type: string
 *                 format: date-time
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role assigned successfully
 */
router.post('/users/:userId/roles/:roleId', rbacController.assignRoleToUser.bind(rbacController));

/**
 * @swagger
 * /api/rbac/user-roles/{userRoleId}/revoke:
 *   post:
 *     summary: Revoke user role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userRoleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - revokeReason
 *             properties:
 *               revokeReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role revoked successfully
 */
router.post('/user-roles/:userRoleId/revoke', rbacController.revokeUserRole.bind(rbacController));

/**
 * @swagger
 * /api/rbac/users/{userId}/roles:
 *   get:
 *     summary: Get user roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: User roles retrieved successfully
 */
router.get('/users/:userId/roles', rbacController.getUserRoles.bind(rbacController));

router.get('/roles/:roleId/users', rbacController.getRoleUsers.bind(rbacController));

// ========================================
// PERMISSION GRANTS
// ========================================

/**
 * @swagger
 * /api/rbac/users/{userId}/permissions/{permissionId}/grant:
 *   post:
 *     summary: Grant permission directly to user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isGranted:
 *                 type: boolean
 *               scopeType:
 *                 type: string
 *               scopeId:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission granted successfully
 */
router.post('/users/:userId/permissions/:permissionId/grant', rbacController.grantPermissionToUser.bind(rbacController));

router.delete('/users/:userId/permissions/:permissionId/grant', rbacController.revokePermissionGrant.bind(rbacController));

router.get('/users/:userId/permission-grants', rbacController.getUserPermissionGrants.bind(rbacController));

// ========================================
// PERMISSION CHECKING
// ========================================

/**
 * @swagger
 * /api/rbac/users/{userId}/check-permission:
 *   get:
 *     summary: Check if user has permission
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: permissionSlug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission check result
 */
router.get('/users/:userId/check-permission', rbacController.checkUserPermission.bind(rbacController));

/**
 * @swagger
 * /api/rbac/users/{userId}/permissions:
 *   get:
 *     summary: Get all user permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 */
router.get('/users/:userId/permissions', rbacController.getUserPermissions.bind(rbacController));

// ========================================
// MAINTENANCE & REPORTS
// ========================================

router.post('/maintenance/expire-roles', rbacController.expireUserRoles.bind(rbacController));
router.post('/maintenance/cleanup-cache', rbacController.cleanupPermissionCache.bind(rbacController));

router.get('/reports/role-permissions-summary', rbacController.getRolePermissionsSummary.bind(rbacController));
router.get('/reports/user-permissions-overview', rbacController.getUserPermissionsOverview.bind(rbacController));
router.get('/reports/permission-audit-log', rbacController.getPermissionAuditLog.bind(rbacController));

export default router;
