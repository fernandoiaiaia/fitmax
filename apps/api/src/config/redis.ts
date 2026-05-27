import Redis from 'ioredis';
import { env } from './env';

/**
 * Shared ioredis connection used by BullMQ queues, workers and rate limiters.
 * BullMQ requires a separate connection per Queue/Worker, so we export
 * a factory function instead of a single instance for those.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.info('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

/**
 * Factory: creates a fresh ioredis connection for BullMQ Queues/Workers.
 * Each Queue and Worker must have its own dedicated connection.
 */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
