import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import multer from 'multer';
import {
  uploadFile,
  generatePresignedUploadUrl,
  validateFileType,
  validateFileSize,
} from '../services/storage.service';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

// Middleware for different file types
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);

// ── Upload Image ──────────────────────────────────────────────────────────
export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validateFileType(req.file, allowedTypes)) {
    res.status(400).json({ success: false, message: 'Invalid file type. Only images allowed.' });
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!validateFileSize(req.file, maxSize)) {
    res.status(400).json({ success: false, message: 'File too large. Max 5MB for images.' });
    return;
  }

  try {
    const result = await uploadFile(req.file, 'images');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[course-service] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ── Upload Video ──────────────────────────────────────────────────────────
export const uploadVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!validateFileType(req.file, allowedTypes)) {
    res.status(400).json({ success: false, message: 'Invalid file type. Only videos allowed.' });
    return;
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (!validateFileSize(req.file, maxSize)) {
    res.status(400).json({ success: false, message: 'File too large. Max 100MB for videos.' });
    return;
  }

  try {
    const result = await uploadFile(req.file, 'videos');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[course-service] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ── Upload Audio ──────────────────────────────────────────────────────────
export const uploadAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
  if (!validateFileType(req.file, allowedTypes)) {
    res.status(400).json({ success: false, message: 'Invalid file type. Only audio files allowed.' });
    return;
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (!validateFileSize(req.file, maxSize)) {
    res.status(400).json({ success: false, message: 'File too large. Max 50MB for audio.' });
    return;
  }

  try {
    const result = await uploadFile(req.file, 'audio');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[course-service] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ── Upload Document ───────────────────────────────────────────────────────
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (!validateFileType(req.file, allowedTypes)) {
    res.status(400).json({ success: false, message: 'Invalid file type. Only documents allowed.' });
    return;
  }

  const maxSize = 20 * 1024 * 1024; // 20MB
  if (!validateFileSize(req.file, maxSize)) {
    res.status(400).json({ success: false, message: 'File too large. Max 20MB for documents.' });
    return;
  }

  try {
    const result = await uploadFile(req.file, 'documents');
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[course-service] Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ── Get Presigned Upload URL ──────────────────────────────────────────────
export const getPresignedUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fileName, fileType, folder } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ success: false, message: 'fileName and fileType required' });
    return;
  }

  try {
    const result = await generatePresignedUploadUrl(fileName, fileType, folder);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[course-service] Presigned URL error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
};
