import Bull, { Job, Queue } from 'bull';
import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Redis clients for Bull
const createRedisClient = (type: string) => {
  const client = new Redis(redisConfig);
  client.on('error', (err) => {
    console.error(`[queue] Redis ${type} error:`, err);
  });
  return client;
};

// ── Notification Queue ─────────────────────────────────────────────────────

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  channel: string;
  priority: string;
  subject?: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
}

export const notificationQueue: Queue<NotificationJobData> = new Bull('notifications', {
  createClient: (type) => createRedisClient(type),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
});

// ── Email Queue ────────────────────────────────────────────────────────────

export interface EmailJobData {
  notificationId: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<any>;
}

export const emailQueue: Queue<EmailJobData> = new Bull('emails', {
  createClient: (type) => createRedisClient(type),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
  limiter: {
    max: 100, // Max 100 emails
    duration: 1000, // Per second
  },
});

// ── Slack Queue ────────────────────────────────────────────────────────────

export interface SlackJobData {
  notificationId: string;
  webhookUrl: string;
  message: any;
  type: string;
  data: Record<string, any>;
}

export const slackQueue: Queue<SlackJobData> = new Bull('slack', {
  createClient: (type) => createRedisClient(type),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
  limiter: {
    max: 10, // Max 10 messages
    duration: 1000, // Per second
  },
});

// ── Spaced Repetition Queue ────────────────────────────────────────────────

export interface SpacedRepetitionJobData {
  userId: string;
  contentId: string;
  contentType: string;
  scheduleId: string;
}

export const spacedRepetitionQueue: Queue<SpacedRepetitionJobData> = new Bull('spaced-repetition', {
  createClient: (type) => createRedisClient(type),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

// ── Queue Helper Functions ─────────────────────────────────────────────────

/**
 * Add notification to queue with priority
 */
export async function queueNotification(
  data: NotificationJobData,
  options?: {
    delay?: number; // ms
    priority?: number; // 1-10 (1 = highest priority)
    jobId?: string;
  }
): Promise<Job<NotificationJobData>> {
  const priority = data.priority === 'urgent' ? 1 : data.priority === 'high' ? 3 : data.priority === 'low' ? 8 : 5;

  return notificationQueue.add(data, {
    priority,
    delay: options?.delay,
    jobId: options?.jobId,
  });
}

/**
 * Add email to queue
 */
export async function queueEmail(data: EmailJobData, options?: { delay?: number }): Promise<Job<EmailJobData>> {
  return emailQueue.add(data, {
    delay: options?.delay,
  });
}

/**
 * Add Slack message to queue
 */
export async function queueSlackMessage(
  data: SlackJobData,
  options?: { delay?: number }
): Promise<Job<SlackJobData>> {
  return slackQueue.add(data, {
    delay: options?.delay,
  });
}

/**
 * Schedule spaced repetition reminder
 */
export async function scheduleSpacedRepetition(
  data: SpacedRepetitionJobData,
  sendAt: Date
): Promise<Job<SpacedRepetitionJobData>> {
  const delay = sendAt.getTime() - Date.now();

  return spacedRepetitionQueue.add(data, {
    delay: Math.max(0, delay),
    jobId: `sr-${data.scheduleId}`,
  });
}

/**
 * Cancel scheduled spaced repetition
 */
export async function cancelSpacedRepetition(scheduleId: string): Promise<boolean> {
  try {
    const job = await spacedRepetitionQueue.getJob(`sr-${scheduleId}`);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (error) {
    console.error('[queue] Failed to cancel spaced repetition:', error);
    return false;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName: string): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  let queue: Queue;

  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'emails':
      queue = emailQueue;
      break;
    case 'slack':
      queue = slackQueue;
      break;
    case 'spaced-repetition':
      queue = spacedRepetitionQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Pause queue
 */
export async function pauseQueue(queueName: string): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'emails':
      queue = emailQueue;
      break;
    case 'slack':
      queue = slackQueue;
      break;
    case 'spaced-repetition':
      queue = spacedRepetitionQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.pause();
  console.log(`[queue] ${queueName} queue paused`);
}

/**
 * Resume queue
 */
export async function resumeQueue(queueName: string): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'emails':
      queue = emailQueue;
      break;
    case 'slack':
      queue = slackQueue;
      break;
    case 'spaced-repetition':
      queue = spacedRepetitionQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.resume();
  console.log(`[queue] ${queueName} queue resumed`);
}

/**
 * Clean completed and failed jobs
 */
export async function cleanQueue(queueName: string, age: number = 24 * 3600 * 1000): Promise<void> {
  let queue: Queue;

  switch (queueName) {
    case 'notifications':
      queue = notificationQueue;
      break;
    case 'emails':
      queue = emailQueue;
      break;
    case 'slack':
      queue = slackQueue;
      break;
    case 'spaced-repetition':
      queue = spacedRepetitionQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  await queue.clean(age, 'completed');
  await queue.clean(age, 'failed');

  console.log(`[queue] ${queueName} cleaned (age: ${age}ms)`);
}

// Event listeners for monitoring
notificationQueue.on('completed', (job) => {
  console.log(`[queue:notifications] Job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[queue:notifications] Job ${job?.id} failed:`, err.message);
});

emailQueue.on('completed', (job) => {
  console.log(`[queue:emails] Job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[queue:emails] Job ${job?.id} failed:`, err.message);
});

slackQueue.on('completed', (job) => {
  console.log(`[queue:slack] Job ${job.id} completed`);
});

slackQueue.on('failed', (job, err) => {
  console.error(`[queue:slack] Job ${job?.id} failed:`, err.message);
});

spacedRepetitionQueue.on('completed', (job) => {
  console.log(`[queue:spaced-repetition] Job ${job.id} completed`);
});

spacedRepetitionQueue.on('failed', (job, err) => {
  console.error(`[queue:spaced-repetition] Job ${job?.id} failed:`, err.message);
});

console.log('[queue] ✅ All queues initialized');
