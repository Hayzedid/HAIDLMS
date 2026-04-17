import { Router } from 'express';
import {
  enrollInCourse,
  getMyEnrollments,
  getCourseStudents,
  getEnrollmentDetails,
  dropEnrollment,
} from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post('/courses/:courseId/enroll', enrollInCourse);
router.get('/my-enrollments', getMyEnrollments);
router.get('/courses/:courseId/enrollment', getEnrollmentDetails);
router.delete('/courses/:courseId/enrollment', dropEnrollment);

// Instructor routes
router.get(
  '/courses/:courseId/students',
  authorize('instructor', 'admin'),
  getCourseStudents
);

export default router;
