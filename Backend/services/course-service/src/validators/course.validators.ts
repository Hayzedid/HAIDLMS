import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  coverImageUrl: z.string().url().optional(),
  trailerVideoUrl: z.string().url().optional(),
  estimatedDurationHours: z.number().positive().optional(),
  priceCents: z.number().int().min(0).default(0),
  enrollmentLimit: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().default('en'),
});

export const updateCourseSchema = createCourseSchema.partial();

export const publishCourseSchema = z.object({
  status: z.enum(['published', 'draft', 'archived']),
});

export const createModuleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0),
  durationMinutes: z.number().int().positive().optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  lessonType: z.enum(['video', 'text', 'code', 'quiz', 'audio']),
  displayOrder: z.number().int().min(0),
  durationMinutes: z.number().int().positive().optional(),
  videoUrl: z.string().url().optional(),
  videoProvider: z.string().optional(),
  contentMarkdown: z.string().optional(),
  codeTemplate: z.string().optional(),
  codeSolution: z.string().optional(),
  quizData: z.any().optional(),
  audioUrl: z.string().url().optional(),
  isPreview: z.boolean().default(false),
  requireCompletion: z.boolean().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

export const completeLessonSchema = z.object({
  completionPercent: z.number().min(0).max(100).default(100),
  timeSpentSeconds: z.number().int().min(0).default(0),
  lastPositionSeconds: z.number().int().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional(),
});

export const respondToReviewSchema = z.object({
  instructorResponse: z.string().max(1000),
});
