import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});



// Cookie config (OWASP A02 — Cryptographic Failures)
// sameSite: 'lax' em dev (portas diferentes = origens diferentes no browser)
// sameSite: 'strict' em prod (mesmo domínio, máxima proteção CSRF)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Força false para garantir que o cookie funcione no localhost sem HTTPS
  sameSite: 'lax' as const, // Garante envio cross-site e top-level navigations em dev
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function getMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress
      ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

export class AuthController {
  private authService = new AuthService();

  /**
   * POST /api/auth/admin/login
   * Returns accessToken in body + sets refreshToken as httpOnly cookie.
   */
  loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const tokens = await this.authService.loginAdmin(dto, getMeta(req));

      // Set refresh token as httpOnly cookie (OWASP A02)
      res.cookie('fitmax_admin_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      // Return access token in body (stored in memory by the client)
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/pro/login
   */
  loginProfessional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const tokens = await this.authService.loginProfessional(dto, getMeta(req));

      res.cookie('fitmax_pro_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/pro/register
   */
  registerProfessional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = registerSchema.parse(req.body);
      const tokens = await this.authService.registerProfessional(dto, getMeta(req));

      res.cookie('fitmax_pro_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/admin/refresh
   * Reads refreshToken from httpOnly cookie and issues a new pair.
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_admin_refresh as string | undefined;

      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken, getMeta(req));

      res.cookie('fitmax_admin_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/pro/refresh
   */
  refreshProfessional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_pro_refresh as string | undefined;

      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken, getMeta(req));

      res.cookie('fitmax_pro_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/admin/logout
   * Revokes refresh token and clears cookie.
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_admin_refresh as string | undefined;

      if (refreshToken) {
        await this.authService.logout(refreshToken, getMeta(req));
      }

      // Clear cookie regardless
      res.clearCookie('fitmax_admin_refresh', { path: '/' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/pro/logout
   */
  logoutProfessional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_pro_refresh as string | undefined;

      if (refreshToken) {
        await this.authService.logout(refreshToken, getMeta(req));
      }

      res.clearCookie('fitmax_pro_refresh', { path: '/' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/client/login
   */
  loginClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = loginSchema.parse(req.body);
      const tokens = await this.authService.loginClient(dto, getMeta(req));

      res.cookie('fitmax_client_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/client/register
   */
  registerClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = registerSchema.parse(req.body);
      const tokens = await this.authService.registerClient(dto, getMeta(req));

      res.cookie('fitmax_client_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/client/refresh
   */
  refreshClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_client_refresh as string | undefined;

      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken, getMeta(req));

      res.cookie('fitmax_client_refresh', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/auth/client/logout
   */
  logoutClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.fitmax_client_refresh as string | undefined;

      if (refreshToken) {
        await this.authService.logout(refreshToken, getMeta(req));
      }

      res.clearCookie('fitmax_client_refresh', { path: '/' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/auth/me
   * Returns decoded user from access token.
   */
  me = (req: Request, res: Response) => {
    res.json({ user: req.user });
  };
}
