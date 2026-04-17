import { Router } from 'express';
import { userManagementController } from '../controllers/user-management.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: Advanced user administration, bulk operations, and data export
 */

// ========================================
// USER PROFILES
// ========================================

/**
 * @swagger
 * /api/user-management/profile/me:
 *   post:
 *     summary: Create or update my profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               timezone:
 *                 type: string
 *               language:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *               company:
 *                 type: string
 *               industry:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *               linkedinUrl:
 *                 type: string
 *               githubUrl:
 *                 type: string
 *               portfolioUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created successfully
 */
router.post('/profile/me', authenticate, userManagementController.createUserProfile.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/profile/me:
 *   get:
 *     summary: Get my profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile/me', authenticate, userManagementController.getMyProfile.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/profile/me:
 *   put:
 *     summary: Update my profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile/me', authenticate, userManagementController.updateMyProfile.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile/:userId', authenticate, userManagementController.getUserProfile.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/search:
 *   get:
 *     summary: Search users
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, deleted, pending_verification]
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: minLoginCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: lastLoginAfter
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           description: Comma-separated tag names
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
 *         description: Users retrieved successfully
 */
router.get('/users/search', authenticate, userManagementController.searchUsers.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/attention:
 *   get:
 *     summary: Get users requiring attention
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users/attention', authenticate, userManagementController.getUsersRequiringAttention.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/status:
 *   put:
 *     summary: Update user status
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - status
 *               - reason
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, deleted]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.put('/users/:userId/status', authenticate, userManagementController.updateUserStatus.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/login/record:
 *   post:
 *     summary: Record login
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Login recorded successfully
 */
router.post('/login/record', authenticate, userManagementController.recordLogin.bind(userManagementController));

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * @swagger
 * /api/user-management/bulk-operations:
 *   post:
 *     summary: Create bulk operation
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operationType
 *               - targetUserIds
 *             properties:
 *               operationType:
 *                 type: string
 *                 enum: [activate, deactivate, suspend, delete, reset_password, unlock, verify_email, change_role]
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Bulk operation created successfully
 */
router.post('/bulk-operations', authenticate, userManagementController.createBulkOperation.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/bulk-operations:
 *   get:
 *     summary: List bulk operations
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: initiatedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [queued, processing, completed, failed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bulk operations retrieved successfully
 */
router.get('/bulk-operations', authenticate, userManagementController.listBulkOperations.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/bulk-operations/{operationId}:
 *   get:
 *     summary: Get bulk operation details
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulk operation retrieved successfully
 */
router.get('/bulk-operations/:operationId', authenticate, userManagementController.getBulkOperation.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/bulk-operations/{operationId}/execute:
 *   post:
 *     summary: Execute bulk operation
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: operationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulk operation executed successfully
 */
router.post('/bulk-operations/:operationId/execute', authenticate, userManagementController.executeBulkOperation.bind(userManagementController));

// ========================================
// IMPERSONATION
// ========================================

/**
 * @swagger
 * /api/user-management/impersonation/start:
 *   post:
 *     summary: Start impersonation session
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - impersonatedUserId
 *               - reason
 *               - justification
 *             properties:
 *               impersonatedUserId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 enum: [support, debugging, training, compliance_check, emergency_access]
 *               justification:
 *                 type: string
 *               ticketNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Impersonation session started successfully
 */
router.post('/impersonation/start', authenticate, userManagementController.startImpersonation.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/impersonation/{sessionId}/end:
 *   post:
 *     summary: End impersonation session
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actionsPerformed:
 *                 type: integer
 *               pagesVisited:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Impersonation session ended successfully
 */
router.post('/impersonation/:sessionId/end', authenticate, userManagementController.endImpersonation.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/impersonation/sessions:
 *   get:
 *     summary: List impersonation sessions
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: impersonatorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: impersonatedUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Impersonation sessions retrieved successfully
 */
router.get('/impersonation/sessions', authenticate, userManagementController.listImpersonationSessions.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/impersonation/{sessionId}:
 *   get:
 *     summary: Get impersonation session details
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Impersonation session retrieved successfully
 */
router.get('/impersonation/:sessionId', authenticate, userManagementController.getImpersonationSession.bind(userManagementController));

// ========================================
// USER DATA EXPORTS
// ========================================

/**
 * @swagger
 * /api/user-management/data-exports:
 *   post:
 *     summary: Create user data export
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exportType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: If not provided, exports data for current user
 *               exportType:
 *                 type: string
 *                 enum: [full_profile, learning_data, activity_log, certificates, all]
 *               includeSections:
 *                 type: array
 *                 items:
 *                   type: string
 *               format:
 *                 type: string
 *                 enum: [json, csv, pdf]
 *               isGdprRequest:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Data export created successfully
 */
router.post('/data-exports', authenticate, userManagementController.createUserDataExport.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/data-exports/me:
 *   get:
 *     summary: List my data exports
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data exports retrieved successfully
 */
router.get('/data-exports/me', authenticate, userManagementController.listMyDataExports.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/data-exports/{exportId}:
 *   get:
 *     summary: Get data export details
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data export retrieved successfully
 */
router.get('/data-exports/:exportId', authenticate, userManagementController.getUserDataExport.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/data-exports/{exportId}/download:
 *   post:
 *     summary: Track data export download
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download tracked successfully
 */
router.post('/data-exports/:exportId/download', authenticate, userManagementController.downloadDataExport.bind(userManagementController));

// ========================================
// USER TAGS
// ========================================

/**
 * @swagger
 * /api/user-management/tags:
 *   post:
 *     summary: Create user tag
 *     tags: [User Management]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 */
router.post('/tags', authenticate, userManagementController.createUserTag.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/tags:
 *   get:
 *     summary: List user tags
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 */
router.get('/tags', authenticate, userManagementController.listUserTags.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/tags/{tagId}:
 *   post:
 *     summary: Assign tag to user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Tag assigned successfully
 */
router.post('/users/:userId/tags/:tagId', authenticate, userManagementController.assignTagToUser.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/tags/{tagId}:
 *   delete:
 *     summary: Remove tag from user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag removed successfully
 */
router.delete('/users/:userId/tags/:tagId', authenticate, userManagementController.removeTagFromUser.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/tags:
 *   get:
 *     summary: Get user tags
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 */
router.get('/users/:userId/tags', authenticate, userManagementController.getUserTags.bind(userManagementController));

// ========================================
// USER NOTES
// ========================================

/**
 * @swagger
 * /api/user-management/users/{userId}/notes:
 *   post:
 *     summary: Create user note
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - content
 *             properties:
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               isFlagged:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Note created successfully
 */
router.post('/users/:userId/notes', authenticate, userManagementController.createUserNote.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/notes:
 *   get:
 *     summary: Get user notes
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 */
router.get('/users/:userId/notes', authenticate, userManagementController.getUserNotes.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/notes/{noteId}:
 *   put:
 *     summary: Update user note
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
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
 *         description: Note updated successfully
 */
router.put('/notes/:noteId', authenticate, userManagementController.updateUserNote.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/notes/{noteId}:
 *   delete:
 *     summary: Delete user note
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted successfully
 */
router.delete('/notes/:noteId', authenticate, userManagementController.deleteUserNote.bind(userManagementController));

// ========================================
// USER GROUPS
// ========================================

/**
 * @swagger
 * /api/user-management/groups:
 *   post:
 *     summary: Create user group
 *     tags: [User Management]
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
 *               - organizationId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               isDynamic:
 *                 type: boolean
 *               dynamicCriteria:
 *                 type: object
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post('/groups', authenticate, userManagementController.createUserGroup.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/groups:
 *   get:
 *     summary: List user groups
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 */
router.get('/groups', authenticate, userManagementController.listUserGroups.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/groups/{groupId}/members/{userId}:
 *   post:
 *     summary: Add user to group
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: User added to group successfully
 */
router.post('/groups/:groupId/members/:userId', authenticate, userManagementController.addUserToGroup.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove user from group
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from group successfully
 */
router.delete('/groups/:groupId/members/:userId', authenticate, userManagementController.removeUserFromGroup.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/groups/{groupId}/members:
 *   get:
 *     summary: Get group members
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group members retrieved successfully
 */
router.get('/groups/:groupId/members', authenticate, userManagementController.getGroupMembers.bind(userManagementController));

// ========================================
// STATISTICS & ACTIONS
// ========================================

/**
 * @swagger
 * /api/user-management/users/{userId}/actions:
 *   get:
 *     summary: Get account actions history
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account actions retrieved successfully
 */
router.get('/users/:userId/actions', authenticate, userManagementController.getAccountActions.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/{userId}/activity-summary:
 *   get:
 *     summary: Get user activity summary
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity summary retrieved successfully
 */
router.get('/users/:userId/activity-summary', authenticate, userManagementController.getUserActivitySummary.bind(userManagementController));

/**
 * @swagger
 * /api/user-management/users/active-summary:
 *   get:
 *     summary: Get active users summary
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Active users summary retrieved successfully
 */
router.get('/users/active-summary', authenticate, userManagementController.getActiveUsersSummary.bind(userManagementController));

export default router;
