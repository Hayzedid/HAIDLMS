import { Router } from 'express';
import {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadDocument,
  getPresignedUrl,
  uploadSingle,
} from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();

// All upload routes require instructor/admin
router.use(authenticate, authorize('instructor', 'admin'));

router.post('/image', uploadSingle, uploadImage);
router.post('/video', uploadSingle, uploadVideo);
router.post('/audio', uploadSingle, uploadAudio);
router.post('/document', uploadSingle, uploadDocument);
router.post('/presigned-url', getPresignedUrl);

export default router;
