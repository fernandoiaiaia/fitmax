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

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

// ─── Redis key helpers ────────────────────────────────────────────────────────
const lockoutKey = (prefix: string, email: string) => `lockout:${prefix}:${email}`;
const attemptsKey = (prefix: string, email: string) => `attempts:${prefix}:${email}`;
const refreshKey = (prefix: string, jti: string) => `refresh:${prefix}:${jti}`;

export class AuthService {
  /**
   * OWASP A07 — Check if account is locked out.
   */
  private async assertNotLockedOut(prefix: string, email: string): Promise<void> {
    try {
      const locked = await redis.get(lockoutKey(prefix, email));
      if (locked) {
        throw new AppError('Account temporarily locked. Try again in 15 minutes.', 429);
      }
    } catch (redisErr) {
      if (redisErr instanceof AppError) throw redisErr;
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível para checagem de Lockout. Continuando via banco de dados.', redisErr.message);
    }
  }

  /**
   * OWASP A07 — Track failed login attempts; lock after MAX_LOGIN_ATTEMPTS.
   */
  private async recordFailedAttempt(prefix: string, email: string): Promise<void> {
    try {
      const key = attemptsKey(prefix, email);
      const attempts = await redis.incr(key);

      // Set expiry on first attempt
      if (attempts === 1) {
        await redis.expire(key, LOCKOUT_DURATION_SECONDS);
      }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await redis.setex(lockoutKey(prefix, email), LOCKOUT_DURATION_SECONDS, '1');
        await redis.del(key);
      }
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao gravar falha de login.', redisErr.message);
    }
  }

  /**
   * Clear failed attempts on successful login.
   */
  private async clearFailedAttempts(prefix: string, email: string): Promise<void> {
    try {
      await redis.del(attemptsKey(prefix, email));
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao limpar tentativas.', redisErr.message);
    }
  }

  /**
   * OWASP A09 — Audit log for login events.
   */
  private auditLog(
    event: 'login_success' | 'login_failure' | 'logout' | 'token_refresh',
    data: { email?: string; adminId?: string; proId?: string; clientId?: string; ip: string; userAgent: string; reason?: string },
  ): void {
    logger.info({ event, ...data, timestamp: new Date().toISOString() }, `Auth: ${event}`);
  }

  /**
   * Admin login with lockout, audit logging and dual-token generation.
   * OWASP A02, A04, A07, A09
   */
  async loginAdmin(dto: LoginDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    // Check lockout first (OWASP A07)
    await this.assertNotLockedOut('admin', dto.email);

    const admin = await prisma.admin.findUnique({ where: { email: dto.email } });

    // OWASP A07 — generic error message; never reveal if email exists
    if (!admin) {
      await this.recordFailedAttempt('admin', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'user_not_found' });
      throw new AppError('Credenciais inválidas', 401);
    }

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) {
      await this.recordFailedAttempt('admin', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'wrong_password' });
      throw new AppError('Credenciais inválidas', 401);
    }

    // Success — clear failed attempts
    await this.clearFailedAttempts('admin', dto.email);

    // Generate tokens (OWASP A04 — short-lived access token)
    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: admin.id, role: 'admin' });
    const refreshToken = signRefreshToken({ sub: admin.id, role: 'admin' }, jti);

    // Store refresh token JTI in Redis for revocation (OWASP A04)
    try {
      await redis.setex(refreshKey('admin', jti), REFRESH_TOKEN_TTL_SECONDS, admin.id);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar refresh token.', redisErr.message);
    }

    this.auditLog('login_success', { email: dto.email, adminId: admin.id, ...meta });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /**
   * Professional login with lockout, audit logging and dual-token generation.
   * OWASP A02, A04, A07, A09
   */
  async loginProfessional(dto: LoginDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    await this.assertNotLockedOut('pro', dto.email);

    const pro = await prisma.professional.findUnique({ where: { email: dto.email } });

    if (!pro) {
      await this.recordFailedAttempt('pro', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'user_not_found' });
      throw new AppError('Credenciais inválidas', 401);
    }

    if (pro.status !== 'ATIVO') {
      await this.recordFailedAttempt('pro', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'account_inactive' });
      throw new AppError('Sua conta não está ativa. Contate o suporte.', 403);
    }

    const valid = await bcrypt.compare(dto.password, pro.password);
    if (!valid) {
      await this.recordFailedAttempt('pro', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'wrong_password' });
      throw new AppError('Credenciais inválidas', 401);
    }

    await this.clearFailedAttempts('pro', dto.email);

    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: pro.id, role: 'professional' });
    const refreshToken = signRefreshToken({ sub: pro.id, role: 'professional' }, jti);

    try {
      await redis.setex(refreshKey('pro', jti), REFRESH_TOKEN_TTL_SECONDS, pro.id);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar refresh token.', redisErr.message);
    }

    this.auditLog('login_success', { email: dto.email, proId: pro.id, ...meta });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /**
   * Client login with lockout, audit logging and dual-token generation.
   * OWASP A02, A04, A07, A09
   */
  async loginClient(dto: LoginDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    await this.assertNotLockedOut('client', dto.email);

    const client = await prisma.client.findUnique({ where: { email: dto.email } });

    if (!client) {
      await this.recordFailedAttempt('client', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'user_not_found' });
      throw new AppError('Credenciais inválidas', 401);
    }

    if (client.status !== 'ATIVO') {
      await this.recordFailedAttempt('client', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'account_inactive' });
      throw new AppError('Sua conta não está ativa. Contate o suporte.', 403);
    }

    const valid = await bcrypt.compare(dto.password, client.password);
    if (!valid) {
      await this.recordFailedAttempt('client', dto.email);
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'wrong_password' });
      throw new AppError('Credenciais inválidas', 401);
    }

    await this.clearFailedAttempts('client', dto.email);

    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: client.id, role: 'client' });
    const refreshToken = signRefreshToken({ sub: client.id, role: 'client' }, jti);

    try {
      await redis.setex(refreshKey('client', jti), REFRESH_TOKEN_TTL_SECONDS, client.id);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar refresh token.', redisErr.message);
    }

    this.auditLog('login_success', { email: dto.email, ...meta, reason: 'client_login' });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  /**
   * Client registration.
   */
  async registerClient(dto: RegisterDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    const existing = await prisma.client.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'registration_email_in_use' });
      throw new AppError('E-mail já está em uso', 400);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const client = await prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        status: 'ATIVO',
      }
    });

    this.auditLog('login_success', { email: dto.email, clientId: client.id, ...meta, reason: 'client_registration' });

    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: client.id, role: 'client' });
    const refreshTokenStr = signRefreshToken({ sub: client.id, role: 'client' }, jti);

    try {
      await redis.setex(refreshKey('client', jti), REFRESH_TOKEN_TTL_SECONDS, client.id);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar refresh token.', redisErr.message);
    }

    return { accessToken, refreshToken: refreshTokenStr, expiresIn: 15 * 60 };
  }

  /**
   * Professional registration.
   */
  async registerProfessional(dto: RegisterDto, meta: { ip: string; userAgent: string }): Promise<AuthTokens> {
    const existing = await prisma.professional.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.auditLog('login_failure', { email: dto.email, ...meta, reason: 'registration_email_in_use' });
      throw new AppError('E-mail já está em uso', 400);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const pro = await prisma.professional.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        status: 'ATIVO',
      }
    });

    this.auditLog('login_success', { email: dto.email, proId: pro.id, ...meta, reason: 'registration' });

    const jti = uuidv4();
    const accessToken = signAccessToken({ sub: pro.id, role: 'professional' });
    const refreshTokenStr = signRefreshToken({ sub: pro.id, role: 'professional' }, jti);

    try {
      await redis.setex(refreshKey('pro', jti), REFRESH_TOKEN_TTL_SECONDS, pro.id);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar refresh token.', redisErr.message);
    }

    return { accessToken, refreshToken: refreshTokenStr, expiresIn: 15 * 60 };
  }

  /**
   * Rotate refresh token — invalidates old JTI, issues new pair.
   * OWASP A04 — token rotation prevents stolen refresh token reuse.
   */
  async refreshToken(
    oldRefreshToken: string,
    meta: { ip: string; userAgent: string },
  ): Promise<AuthTokens> {
    let payload: { sub: string; role: 'admin' | 'professional' | 'client'; jti: string; type: string };

    try {
      const { default: jwt } = await import('jsonwebtoken');
      const { env } = await import('../../config/env');
      payload = jwt.verify(oldRefreshToken, env.JWT_SECRET) as typeof payload;
    } catch (err) {
      console.error('JWT Verify Failed. Token length:', oldRefreshToken?.length, 'Error:', err);
      throw new AppError(`Invalid or expired refresh token: ${(err as any).message}`, 401);
    }

    if (payload.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const prefix = payload.role === 'admin' ? 'admin' : payload.role === 'client' ? 'client' : 'pro';

    // Verify JTI exists in Redis (not revoked)
    let stored: string | null = payload.sub;
    try {
      stored = await redis.get(refreshKey(prefix, payload.jti));
      if (!stored) {
        throw new AppError('Refresh token has been revoked', 401);
      }
    } catch (redisErr) {
      if (redisErr instanceof AppError) throw redisErr;
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível para checagem de JTI. Continuando via criptografia JWT local.', redisErr.message);
    }

    // Grace period for rotation (OWASP A04): 
    // Instead of deleting the old token immediately, we set a short 30-second TTL.
    // This prevents the user from being locked out if they hit F5 and the browser 
    // aborts the connection before receiving the new Set-Cookie header.
    try {
      await redis.expire(refreshKey(prefix, payload.jti), 30);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao expirar token antigo.', redisErr.message);
    }

    // Issue new pair
    const newJti = uuidv4();
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    const refreshTokenStr = signRefreshToken({ sub: payload.sub, role: payload.role }, newJti);

    try {
      await redis.setex(refreshKey(prefix, newJti), REFRESH_TOKEN_TTL_SECONDS, payload.sub);
    } catch (redisErr) {
      console.warn('⚠️ Alerta (Resiliência): Redis indisponível ao armazenar novo refresh token.', redisErr.message);
    }

    this.auditLog('token_refresh', { 
      [payload.role === 'admin' ? 'adminId' : payload.role === 'client' ? 'clientId' : 'proId']: payload.sub, 
      ...meta 
    });

    return { accessToken, refreshToken: refreshTokenStr, expiresIn: 15 * 60 };
  }

  /**
   * Logout — revoke refresh token in Redis.
   */
  async logout(
    refreshToken: string,
    meta: { ip: string; userAgent: string },
  ): Promise<void> {
    try {
      const { default: jwt } = await import('jsonwebtoken');
      const { env } = await import('../../config/env');
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as { jti: string; sub: string; role: string };
      const prefix = payload.role === 'admin' ? 'admin' : payload.role === 'client' ? 'client' : 'pro';
      await redis.del(refreshKey(prefix, payload.jti));
      this.auditLog('logout', { 
        [payload.role === 'admin' ? 'adminId' : payload.role === 'client' ? 'clientId' : 'proId']: payload.sub, 
        ...meta 
      });
    } catch {
      // Ignore invalid tokens on logout — just clear the cookie
    }
  }
}
