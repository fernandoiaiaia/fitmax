import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;       // user id
  role: 'admin' | 'professional' | 'client';
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshPayload {
  sub: string;
  role: 'admin' | 'professional' | 'client';
  type: 'refresh';
  jti: string; // unique token id — stored in Redis for revocation
  iat?: number;
  exp?: number;
}

/**
 * Generates a short-lived access token (15 min).
 * OWASP A04 — Insecure Design: short expiry limits blast radius if leaked.
 */
export function signAccessToken(payload: Pick<JwtPayload, 'sub' | 'role'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: '15m' },
  );
}

/**
 * Generates a long-lived refresh token (7 days).
 * Must be stored httpOnly in a cookie — never exposed to JS.
 */
export function signRefreshToken(
  payload: Pick<RefreshPayload, 'sub' | 'role'>,
  jti: string,
): string {
  return jwt.sign(
    { ...payload, type: 'refresh', jti },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

/**
 * Middleware: validates Bearer access token and attaches decoded payload to req.user.
 * OWASP A01 — Broken Access Control: every protected route must call this.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: restricts access to specific roles.
 * Must be used AFTER `authenticate`.
 * OWASP A01 — Broken Access Control
 */
export function authorize(...roles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}
