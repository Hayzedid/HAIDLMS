export enum CourseStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text',
  CODE = 'code',
  QUIZ = 'quiz',
  AUDIO = 'audio',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  EXPIRED = 'expired',
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  iconUrl?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  skillLevel: SkillLevel;
  status: CourseStatus;
  instructorId: string;
  coverImageUrl?: string;
  trailerVideoUrl?: string;
  estimatedDurationHours?: number;
  priceCents: number;
  isFeatured: boolean;
  enrollmentLimit?: number;
  tags?: string[];
  language: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithStats extends Course {
  category?: Category;
  totalEnrollments?: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  displayOrder: number;
  durationMinutes?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  lessonType: LessonType;
  displayOrder: number;
  durationMinutes?: number;
  videoUrl?: string;
  videoProvider?: string;
  contentMarkdown?: string;
  codeTemplate?: string;
  codeSolution?: string;
  quizData?: any;
  audioUrl?: string;
  attachments?: any;
  isPreview: boolean;
  isPublished: boolean;
  requireCompletion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  progressPercent: number;
  paymentId?: string;
  amountPaidCents?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  userId: string;
  isCompleted: boolean;
  completionPercent: number;
  timeSpentSeconds: number;
  lastPositionSeconds?: number;
  attempts: number;
  score?: number;
  passed?: boolean;
  firstAccessedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  enrollmentId: string;
  rating: number;
  reviewText?: string;
  isPublished: boolean;
  instructorResponse?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseStats {
  courseId: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageRating?: number;
  totalReviews: number;
  averageCompletionTimeHours?: number;
  lastUpdatedAt: Date;
}
