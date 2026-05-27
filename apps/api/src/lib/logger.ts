import pino from 'pino';
import { env } from '../config/env';

/**
 * Pino logger singleton.
 * - Development: pretty-printed, human-readable output.
 * - Production: structured JSON, suitable for log aggregation (Datadog, Grafana, etc.).
 */
export const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: ['req.headers.authorization', 'body.password', 'body.token'],
  },
  env.NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
);
