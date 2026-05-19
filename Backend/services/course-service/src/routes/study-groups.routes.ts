import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { studyGroupsController } from '../controllers/study-groups.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Study Groups
 *   description: Collaborative learning and study groups endpoints
 */

// All study group routes require authentication
router.use(authenticate);

// ========================================
// STUDY GROUPS
// ========================================

/**
 * @swagger
 * /api/study-groups:
 *   post:
 *     summary: Create a new study group
 *     tags: [Study Groups]
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
 *               courseId:
 *                 type: string
 *               groupType:
 *                 type: string
 *                 enum: [study, project, accountability]
 *               isPrivate:
 *                 type: boolean
 *               requiresApproval:
 *                 type: boolean
 *               maxMembers:
 *                 type: integer
 *               learningGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetCompletionDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Study group created successfully
 */
router.post('/', studyGroupsController.createStudyGroup.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups:
 *   get:
 *     summary: List study groups
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: groupType
 *         schema:
 *           type: string
 *           enum: [study, project, accountability]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, completed, archived]
 *       - in: query
 *         name: isPrivate
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
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
 *         description: Study groups retrieved successfully
 */
router.get('/', studyGroupsController.listStudyGroups.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{id}:
 *   get:
 *     summary: Get study group details
 *     tags: [Study Groups]
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
 *         description: Study group retrieved successfully
 */
router.get('/:id', studyGroupsController.getStudyGroup.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{id}:
 *   put:
 *     summary: Update study group
 *     tags: [Study Groups]
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
 *         description: Study group updated successfully
 */
router.put('/:id', studyGroupsController.updateStudyGroup.bind(studyGroupsController));

router.delete('/:id', studyGroupsController.deleteStudyGroup.bind(studyGroupsController));

// ========================================
// MEMBERS
// ========================================

/**
 * @swagger
 * /api/study-groups/{groupId}/members:
 *   post:
 *     summary: Add member to study group
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, invited, pending]
 *     responses:
 *       201:
 *         description: Member added successfully
 */
router.post('/:groupId/members', studyGroupsController.addMember.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{groupId}/members:
 *   get:
 *     summary: List group members
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 */
router.get('/:groupId/members', studyGroupsController.listMembers.bind(studyGroupsController));

router.delete('/:groupId/members/:userId', studyGroupsController.removeMember.bind(studyGroupsController));
router.put('/:groupId/members/:userId', studyGroupsController.updateMember.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{groupId}/invite:
 *   post:
 *     summary: Invite users to study group
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitations sent successfully
 */
router.post('/:groupId/invite', studyGroupsController.inviteMember.bind(studyGroupsController));

// ========================================
// SESSIONS
// ========================================

/**
 * @swagger
 * /api/study-groups/{groupId}/sessions:
 *   post:
 *     summary: Create a study session
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - title
 *               - scheduledStartTime
 *               - scheduledEndTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sessionType:
 *                 type: string
 *                 enum: [study, discussion, practice, review, project]
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *               scheduledEndTime:
 *                 type: string
 *                 format: date-time
 *               meetingLink:
 *                 type: string
 *               meetingPassword:
 *                 type: string
 *               location:
 *                 type: string
 *               maxAttendees:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Session created successfully
 */
router.post('/:groupId/sessions', studyGroupsController.createSession.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{groupId}/sessions:
 *   get:
 *     summary: List study sessions
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get('/:groupId/sessions', studyGroupsController.listSessions.bind(studyGroupsController));

router.get('/sessions/:sessionId', studyGroupsController.getSession.bind(studyGroupsController));
router.put('/sessions/:sessionId', studyGroupsController.updateSession.bind(studyGroupsController));
router.delete('/sessions/:sessionId', studyGroupsController.deleteSession.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/sessions/{sessionId}/rsvp:
 *   post:
 *     summary: RSVP for a study session
 *     tags: [Study Groups]
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
 *             required:
 *               - rsvpStatus
 *             properties:
 *               rsvpStatus:
 *                 type: string
 *                 enum: [going, maybe, not_going]
 *     responses:
 *       200:
 *         description: RSVP recorded successfully
 */
router.post('/sessions/:sessionId/rsvp', studyGroupsController.rsvpSession.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/sessions/{sessionId}/checkin:
 *   post:
 *     summary: Check in to a study session
 *     tags: [Study Groups]
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
 *         description: Checked in successfully
 */
router.post('/sessions/:sessionId/checkin', studyGroupsController.checkInSession.bind(studyGroupsController));

router.get('/sessions/:sessionId/attendance', studyGroupsController.getSessionAttendance.bind(studyGroupsController));

// ========================================
// RESOURCES
// ========================================

/**
 * @swagger
 * /api/study-groups/{groupId}/resources:
 *   post:
 *     summary: Add a resource to the study group
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - title
 *               - resourceType
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               resourceType:
 *                 type: string
 *                 enum: [note, document, video, link, flashcard, quiz]
 *               url:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Resource created successfully
 */
router.post('/:groupId/resources', studyGroupsController.createResource.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{groupId}/resources:
 *   get:
 *     summary: List group resources
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 */
router.get('/:groupId/resources', studyGroupsController.listResources.bind(studyGroupsController));

router.put('/resources/:resourceId', studyGroupsController.updateResource.bind(studyGroupsController));
router.delete('/resources/:resourceId', studyGroupsController.deleteResource.bind(studyGroupsController));

// ========================================
// COLLABORATIVE NOTES
// ========================================

/**
 * @swagger
 * /api/study-groups/{groupId}/notes:
 *   post:
 *     summary: Create a collaborative note
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 */
router.post('/:groupId/notes', studyGroupsController.createNote.bind(studyGroupsController));

router.get('/:groupId/notes', studyGroupsController.listNotes.bind(studyGroupsController));
router.put('/notes/:noteId', studyGroupsController.updateNote.bind(studyGroupsController));
router.get('/notes/:noteId/history', studyGroupsController.getNoteHistory.bind(studyGroupsController));

// ========================================
// TASKS
// ========================================

/**
 * @swagger
 * /api/study-groups/{groupId}/tasks:
 *   post:
 *     summary: Create a group task
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/:groupId/tasks', studyGroupsController.createTask.bind(studyGroupsController));

router.get('/:groupId/tasks', studyGroupsController.listTasks.bind(studyGroupsController));
router.put('/tasks/:taskId', studyGroupsController.updateTask.bind(studyGroupsController));
router.post('/tasks/:taskId/complete', studyGroupsController.completeTask.bind(studyGroupsController));

// ========================================
// ACCOUNTABILITY PARTNERS
// ========================================

/**
 * @swagger
 * /api/study-groups/accountability-partners:
 *   post:
 *     summary: Create accountability partnership
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *             properties:
 *               partnerId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *               checkInFrequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, custom]
 *     responses:
 *       201:
 *         description: Partnership created successfully
 */
router.post('/accountability-partners', studyGroupsController.createAccountabilityPartnership.bind(studyGroupsController));

router.get('/accountability-partners', studyGroupsController.listAccountabilityPartnerships.bind(studyGroupsController));

// ========================================
// STUDY LOGS
// ========================================

/**
 * @swagger
 * /api/study-groups/study-logs:
 *   post:
 *     summary: Log study session
 *     tags: [Study Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studyDate
 *               - durationMinutes
 *             properties:
 *               groupId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               studyDate:
 *                 type: string
 *                 format: date
 *               durationMinutes:
 *                 type: integer
 *               topicsCovered:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               moodRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Study log created successfully
 */
router.post('/study-logs', studyGroupsController.createStudyLog.bind(studyGroupsController));

router.get('/study-logs', studyGroupsController.listStudyLogs.bind(studyGroupsController));

// ========================================
// ANALYTICS
// ========================================

router.post('/:groupId/analytics/aggregate', studyGroupsController.aggregateAnalytics.bind(studyGroupsController));

/**
 * @swagger
 * /api/study-groups/{groupId}/stats:
 *   get:
 *     summary: Get study group statistics
 *     tags: [Study Groups]
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
 *         description: Statistics retrieved successfully
 */
router.get('/:groupId/stats', studyGroupsController.getGroupStats.bind(studyGroupsController));

router.get('/:groupId/members/:userId/activity', studyGroupsController.getMemberActivity.bind(studyGroupsController));

export default router;
