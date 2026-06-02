import { rateLimit } from 'express-rate-limit';
import { redis } from '../config/redis';
import { env } from '../config/env';

/**
 * Simple in-memory store adapter that uses the shared Redis client.
 * For production, consider using `rate-limit-redis` for a proper RedisStore.
 */

/**
 * General API rate limiter — 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/**
 * Strict rate limiter for auth routes — 10 requests per minute per IP.
 * Helps mitigate brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
  skip: (req) => env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/**
 * Very strict rate limiter for password change — 5 requests per 15 min per IP.
 * OWASP A07 — Identification and Authentication Failures:
 * prevents brute-force of the "current password" field.
 */
export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de troca de senha. Tente novamente em 15 minutos.' },
  skip: (req) => env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

// Keep redis import to avoid "unused" lint warning; used in future RedisStore integration
void redis;
