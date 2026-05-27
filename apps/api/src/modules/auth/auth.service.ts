import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { redis } from '../../config/redis';
import { logger } from '../../lib/logger';
import { AppError } from '../../middlewares/errorHandler';
import { signAccessToken, signRefreshToken } from '../../middlewares/auth';

// ─── Constants (OWASP A07 — Identification & Authentication Failures) ─────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

// ─── Redis key helpers ────────────────────────────────────────────────────────
const lockoutKey = (email: string) => `lockout:admin:${email}`;
const attemptsKey = (email: string) => `attempts:admin:${email}`;
const refreshKey = (jti: string) => `refresh:admin:${jti}`;

export class AuthService {
  /**
   * OWASP A07 — Check if account is locked out.
   */
  private async assertNotLockedOut(email: string): Promise<void> {
    const locked = await redis.get(lockoutKey(email));
    if (locked) {
      throw new AppError('Account temporarily locked. Try again in 15 minutes.', 429);
    }
  }

  /**
   * OWASP A07 — Track failed login attempts; lock after MAX_LOGIN_ATTEMPTS.
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    const key = attemptsKey(email);
    const attempts = await redis.incr(key);

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(key, LOCKOUT_DURATION_SECONDS);
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await redis.setex(lockoutKey(email), LOCKOUT_DURATION_SECONDS, '1');
      await redis.del(key);
    }
  }

  /**
   * Clear failed attempts on successful login.
   */
  private async clearFailedAttempts(email: string): Promise<void> {
    await redis.del(attemptsKey(email));
  }

  /**
   * OWASP A09 — Audit log for login events.
   */
  private auditLog(
    event: 'login_success' | 'login_failure' | 'logout' | 'token_refresh',
    data: { email?: string; adminId?: string; ip: string; userAgent: string; reason?: string },
  ): void {
    logger.info({ event, ...data, timestamp: new Date().toISOString() }, `Auth: ${event}`);
  }

  /**
   * Admin login with lockout, audit logging and dual-token generation.
   * OWASP A02, A04, A07, A09
   */
  async loginAdmin(dto: LoginDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    // Check lockout first (OWASP A07)
    await this.assertNotLockedOut(dto.email);

    const admin = await prisma.admin.findUnique({ where: { email: dto.email } });

    // OWASP A07 — generic error message; never reveal if email exists
    if (!admin) {
      await this.recordFailedAttempt(dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'user_not_found' });
      throw new AppError('Credenciais inválidas', 401);
    }

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) {
      await this.recordFailedAttempt(dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'wrong_password' });
      throw new AppError('Credenciais inválidas', 401);
    }

    // Success — clear failed attempts
    await this.clearFailedAttempts(dto.email);

    // Generate tokens (OWASP A04 — short-lived access token)
    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: admin.id, role: 'admin' });
    const refreshToken = signRefreshToken({ sub: admin.id, role: 'admin' }, jti);

    // Store refresh token JTI in Redis for revocation (OWASP A04)
    await redis.setex(refreshKey(jti), REFRESH_TOKEN_TTL_SECONDS, admin.id);

    this.auditLog('login_success', { email: dto.email, adminId: admin.id, ...meta });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /**
   * Rotate refresh token — invalidates old JTI, issues new pair.
   * OWASP A04 — token rotation prevents stolen refresh token reuse.
   */
  async refreshAdminToken(
    oldRefreshToken: string,
    meta: { ip: string; userAgent: string },
  ): Promise<AuthTokens> {
    let payload: { sub: string; role: 'admin' | 'professional' | 'client'; jti: string; type: string };

    try {
      const { default: jwt } = await import('jsonwebtoken');
      const { env } = await import('../../config/env');
      payload = jwt.verify(oldRefreshToken, env.JWT_SECRET) as typeof payload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    // Verify JTI exists in Redis (not revoked)
    const stored = await redis.get(refreshKey(payload.jti));
    if (!stored) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    // Revoke old token (rotation)
    await redis.del(refreshKey(payload.jti));

    // Issue new pair
    const newJti = uuidv4();
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    const refreshToken = signRefreshToken({ sub: payload.sub, role: payload.role }, newJti);

    await redis.setex(refreshKey(newJti), REFRESH_TOKEN_TTL_SECONDS, payload.sub);

    this.auditLog('token_refresh', { adminId: payload.sub, ...meta });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /**
   * Logout — revoke refresh token in Redis.
   */
  async logoutAdmin(
    refreshToken: string,
    meta: { ip: string; userAgent: string },
  ): Promise<void> {
    try {
      const { default: jwt } = await import('jsonwebtoken');
      const { env } = await import('../../config/env');
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { jti: string; sub: string };
      await redis.del(refreshKey(payload.jti));
      this.auditLog('logout', { adminId: payload.sub, ...meta });
    } catch {
      // Ignore invalid tokens on logout — just clear the cookie
    }
  }
}
