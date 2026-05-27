import { Worker } from 'bullmq';
import { createRedisConnection } from '../../config/redis';
import { logger } from '../../lib/logger';
import type { EmailJobData } from '../queues';

/**
 * BullMQ Worker that processes jobs from the "email" queue.
 *
 * In production, replace the stub below with an actual email provider
 * (e.g., Nodemailer, Resend, SendGrid).
 */
export function startEmailWorker(): Worker {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job) => {
      logger.info({ jobId: job.id, to: job.data.to }, 'Processing email job');

      // TODO: integrate real email provider
      // await mailer.send({ to: job.data.to, subject: job.data.subject, html: job.data.body });

      logger.info({ jobId: job.id }, 'Email sent successfully (stub)');
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Email job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Email job failed');
  });

  return worker;
}
