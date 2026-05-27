import { Queue } from 'bullmq';
import { createRedisConnection } from '../../config/redis';

/**
 * BullMQ Queue for sending emails asynchronously.
 * Each queue gets its own dedicated ioredis connection (BullMQ requirement).
 */
export const emailQueue = new Queue('email', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/**
 * Helper to enqueue a send-email job.
 */
export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add('send-email', data);
}
