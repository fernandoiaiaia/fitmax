import Redis from 'ioredis';
import { env } from './env';
import { chaosState } from '../chaos';

/**
 * Shared ioredis connection used by BullMQ queues, workers and rate limiters.
 */
const redisInstance = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redisInstance.on('connect', () => {
  console.info('✅ Redis connected');
});

redisInstance.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Proxy interceptor to simulate Redis connection outages dynamically
export const redis = new Proxy(redisInstance, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);

    // If it's a function and Redis Chaos is active, throw a connection error
    if (typeof value === 'function' && chaosState.redisOffline) {
      if (prop !== 'on' && prop !== 'quit' && prop !== 'disconnect') {
        return async function() {
          throw new Error('Redis connection lost (Chaos Simulation active)');
        };
      }
    }

    return value;
  }
});

/**
 * Factory: creates a fresh ioredis connection for BullMQ Queues/Workers.
 */
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
