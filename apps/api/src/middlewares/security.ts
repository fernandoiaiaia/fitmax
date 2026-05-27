import helmet from 'helmet';
import cors from 'cors';
import { RequestHandler } from 'express';
import { env } from '../config/env';

/**
 * OWASP A05 — Security Misconfiguration
 * Helmet sets secure HTTP headers:
 *  - Content-Security-Policy
 *  - X-Frame-Options: DENY
 *  - X-Content-Type-Options: nosniff
 *  - Strict-Transport-Security (HSTS)
 *  - Referrer-Policy
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * CORS — allow only known origins.
 * Credentials: true is needed for cookies (refresh token).
 */
const allowedOrigins: string[] = [
  'http://localhost:3002', // web-admin dev
  'http://localhost:3003', // web-pro dev
  'http://localhost:3004', // web-client dev
  ...(env.NODE_ENV === 'production' ? [
    // Add production origins here
  ] : []),
];

export const corsMiddleware: RequestHandler = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true, // required for httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400, // preflight cache: 24h
}) as RequestHandler;
