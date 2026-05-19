import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { liveClassesController } from '../controllers/live-classes.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Live Classes
 *   description: Virtual classroom and live class management endpoints
 */

// All live class routes require authentication
router.use(authenticate);

// ========================================
// LIVE CLASSES
// ========================================

/**
 * @swagger
 * /api/live-classes:
 *   post:
 *     summary: Create a new live class
 *     tags: [Live Classes]
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
 *               - scheduledStartTime
 *               - scheduledEndTime
 *             properties:
 *               courseId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               classType:
 *                 type: string
 *                 enum: [lecture, tutorial, workshop, office_hours, lab]
 *               scheduledStartTime:
 *                 type: string
 *                 format: date-time
 *               scheduledEndTime:
 *                 type: string
 *                 format: date-time
 *               timezone:
 *                 type: string
 *               isRecurring:
 *                 type: boolean
 *               accessType:
 *                 type: string
 *                 enum: [public, enrolled, invited, paid]
 *               maxParticipants:
 *                 type: integer
 *               enableRecording:
 *                 type: boolean
 *               enableChat:
 *                 type: boolean
 *               enableScreenSharing:
 *                 type: boolean
 *               enableWhiteboard:
 *                 type: boolean
 *               enableBreakoutRooms:
 *                 type: boolean
 *               enablePolls:
 *                 type: boolean
 *               enableQa:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Live class created successfully
 */
router.post('/', liveClassesController.createLiveClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes:
 *   get:
 *     summary: List live classes
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: instructorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: classType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, ended, cancelled]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
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
 *         description: Live classes retrieved successfully
 */
router.get('/', liveClassesController.listLiveClasses.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/upcoming:
 *   get:
 *     summary: Get upcoming live classes
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Upcoming classes retrieved successfully
 */
router.get('/upcoming', liveClassesController.getUpcomingClasses.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{id}:
 *   get:
 *     summary: Get live class details
 *     tags: [Live Classes]
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
 *         description: Live class retrieved successfully
 */
router.get('/:id', liveClassesController.getLiveClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{id}:
 *   put:
 *     summary: Update live class
 *     tags: [Live Classes]
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
 *         description: Live class updated successfully
 */
router.put('/:id', liveClassesController.updateLiveClass.bind(liveClassesController));

router.delete('/:id', liveClassesController.deleteLiveClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{id}/start:
 *   post:
 *     summary: Start a live class
 *     tags: [Live Classes]
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
 *         description: Live class started successfully
 */
router.post('/:id/start', liveClassesController.startLiveClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{id}/end:
 *   post:
 *     summary: End a live class
 *     tags: [Live Classes]
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
 *         description: Live class ended successfully
 */
router.post('/:id/end', liveClassesController.endLiveClass.bind(liveClassesController));

// ========================================
// PARTICIPANTS
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/register:
 *   post:
 *     summary: Register for a live class
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Registered for class successfully
 */
router.post('/:classId/register', liveClassesController.registerForClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/join:
 *   post:
 *     summary: Join a live class
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined class successfully
 */
router.post('/:classId/join', liveClassesController.joinClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/leave:
 *   post:
 *     summary: Leave a live class
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left class successfully
 */
router.post('/:classId/leave', liveClassesController.leaveClass.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/participants:
 *   get:
 *     summary: Get class participants
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPresent
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 */
router.get('/:classId/participants', liveClassesController.getClassParticipants.bind(liveClassesController));

router.get('/:classId/participants/active', liveClassesController.getActiveParticipants.bind(liveClassesController));
router.put('/:classId/participants/:userId', liveClassesController.updateParticipant.bind(liveClassesController));

// ========================================
// BREAKOUT ROOMS
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/breakout-rooms:
 *   post:
 *     summary: Create a breakout room
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               - name
 *               - roomNumber
 *             properties:
 *               name:
 *                 type: string
 *               roomNumber:
 *                 type: integer
 *               description:
 *                 type: string
 *               assignmentMethod:
 *                 type: string
 *                 enum: [manual, automatic, self-select]
 *               maxParticipants:
 *                 type: integer
 *               durationMinutes:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Breakout room created successfully
 */
router.post('/:classId/breakout-rooms', liveClassesController.createBreakoutRoom.bind(liveClassesController));

router.get('/:classId/breakout-rooms', liveClassesController.getBreakoutRooms.bind(liveClassesController));
router.post('/breakout-rooms/:roomId/assign', liveClassesController.assignToBreakoutRoom.bind(liveClassesController));
router.post('/breakout-rooms/:roomId/open', liveClassesController.openBreakoutRoom.bind(liveClassesController));
router.post('/breakout-rooms/:roomId/close', liveClassesController.closeBreakoutRoom.bind(liveClassesController));

// ========================================
// WHITEBOARD
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/whiteboard:
 *   post:
 *     summary: Create a whiteboard session
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               roomId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Whiteboard session created successfully
 */
router.post('/:classId/whiteboard', liveClassesController.createWhiteboardSession.bind(liveClassesController));

router.get('/whiteboard/:sessionId', liveClassesController.getWhiteboardSession.bind(liveClassesController));
router.put('/whiteboard/:sessionId', liveClassesController.updateWhiteboardCanvas.bind(liveClassesController));

// ========================================
// CHAT
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/chat:
 *   post:
 *     summary: Send a chat message
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               content:
 *                 type: string
 *               roomId:
 *                 type: string
 *               messageType:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               recipientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/:classId/chat', liveClassesController.sendChatMessage.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/chat:
 *   get:
 *     summary: Get chat messages
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: beforeMessageId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:classId/chat', liveClassesController.getChatMessages.bind(liveClassesController));

router.delete('/chat/:messageId', liveClassesController.deleteChatMessage.bind(liveClassesController));

// ========================================
// POLLS
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/polls:
 *   post:
 *     summary: Create a poll
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               pollType:
 *                 type: string
 *                 enum: [multiple_choice, multiple_answer, yes_no, rating, open_text]
 *               options:
 *                 type: array
 *               isAnonymous:
 *                 type: boolean
 *               allowMultipleAnswers:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Poll created successfully
 */
router.post('/:classId/polls', liveClassesController.createPoll.bind(liveClassesController));

router.post('/polls/:pollId/start', liveClassesController.startPoll.bind(liveClassesController));
router.post('/polls/:pollId/close', liveClassesController.closePoll.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/polls/{pollId}/respond:
 *   post:
 *     summary: Submit a poll response
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
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
 *               selectedOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *               textResponse:
 *                 type: string
 *               ratingValue:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Response submitted successfully
 */
router.post('/polls/:pollId/respond', liveClassesController.submitPollResponse.bind(liveClassesController));

router.get('/polls/:pollId/results', liveClassesController.getPollResults.bind(liveClassesController));

// ========================================
// Q&A
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/questions:
 *   post:
 *     summary: Ask a question
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               isAnonymous:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Question asked successfully
 */
router.post('/:classId/questions', liveClassesController.askQuestion.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/questions:
 *   get:
 *     summary: Get class questions
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, answered, dismissed]
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 */
router.get('/:classId/questions', liveClassesController.getClassQuestions.bind(liveClassesController));

router.post('/questions/:questionId/answer', liveClassesController.answerQuestion.bind(liveClassesController));
router.post('/questions/:questionId/upvote', liveClassesController.upvoteQuestion.bind(liveClassesController));

// ========================================
// HAND RAISES
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/raise-hand:
 *   post:
 *     summary: Raise hand
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hand raised successfully
 */
router.post('/:classId/raise-hand', liveClassesController.raiseHand.bind(liveClassesController));

router.post('/:classId/lower-hand', liveClassesController.lowerHand.bind(liveClassesController));
router.get('/:classId/raised-hands', liveClassesController.getRaisedHands.bind(liveClassesController));
router.post('/hand-raises/:handRaiseId/acknowledge', liveClassesController.acknowledgeHand.bind(liveClassesController));

// ========================================
// RECORDINGS
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/recordings:
 *   post:
 *     summary: Create a class recording
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               - recordingUrl
 *               - recordedAt
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               recordingUrl:
 *                 type: string
 *               duration:
 *                 type: integer
 *               fileSize:
 *                 type: integer
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Recording created successfully
 */
router.post('/:classId/recordings', liveClassesController.createRecording.bind(liveClassesController));

/**
 * @swagger
 * /api/live-classes/{classId}/recordings:
 *   get:
 *     summary: Get class recordings
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recordings retrieved successfully
 */
router.get('/:classId/recordings', liveClassesController.getClassRecordings.bind(liveClassesController));

router.post('/recordings/:recordingId/track-view', liveClassesController.trackRecordingView.bind(liveClassesController));

// ========================================
// ANALYTICS
// ========================================

/**
 * @swagger
 * /api/live-classes/{classId}/analytics:
 *   get:
 *     summary: Get class analytics
 *     tags: [Live Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/:classId/analytics', liveClassesController.getClassAnalytics.bind(liveClassesController));

export default router;
