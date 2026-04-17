import { Router } from 'express';
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from '../controllers/module.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createModuleSchema,
  updateModuleSchema,
} from '../validators/course.validators';

const router = Router();

// All module routes require instructor/admin
router.use(authenticate, authorize('instructor', 'admin'));

router.post('/courses/:courseId/modules', validate(createModuleSchema), createModule);
router.patch('/modules/:id', validate(updateModuleSchema), updateModule);
router.delete('/modules/:id', deleteModule);
router.post('/courses/:courseId/modules/reorder', reorderModules);

export default router;
