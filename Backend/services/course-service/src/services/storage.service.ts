import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'techlearn-media';

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

/**
 * Upload file to S3
 */
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    url,
    key,
    size: file.size,
    mimeType: file.mimetype,
  };
};

/**
 * Delete file from S3
 */
export const deleteFile = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Generate presigned URL for uploading directly from client
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> => {
  const ext = path.extname(fileName);
  const key = `${folder}/${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
    ACL: 'public-read',
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

  return { url, key };
};

/**
 * Get public URL for a key
 */
export const getPublicUrl = (key: string): string => {
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

/**
 * Validate file type
 */
export const validateFileType = (
  file: Express.Multer.File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.mimetype);
};

/**
 * Validate file size (in bytes)
 */
export const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};
