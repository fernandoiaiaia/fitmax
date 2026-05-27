import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Cookie config (OWASP A02 — Cryptographic Failures)
// sameSite: 'lax' em dev (portas diferentes = origens diferentes no browser)
// sameSite: 'strict' em prod (mesmo domínio, máxima proteção CSRF)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                                          // não acessível via document.cookie
  secure: env.NODE_ENV === 'production',                   // HTTPS only em prod
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,                        // 7 dias em ms
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
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

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
   * POST /api/auth/admin/refresh
   * Reads refreshToken from httpOnly cookie and issues a new pair.
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        res.status(401).json({ error: 'No refresh token provided' });
        return;
      }

      const tokens = await this.authService.refreshAdminToken(refreshToken, getMeta(req));

      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
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
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (refreshToken) {
        await this.authService.logoutAdmin(refreshToken, getMeta(req));
      }

      // Clear cookie regardless
      res.clearCookie('refreshToken', { path: '/' });
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
