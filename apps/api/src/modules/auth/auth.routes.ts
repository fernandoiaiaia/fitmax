import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';

const router = Router();
const authController = new AuthController();

// POST /api/auth/admin/login — rate limited (OWASP A07)
router.post('/admin/login', authLimiter, authController.loginAdmin);

// POST /api/auth/admin/refresh — renew access token using httpOnly cookie
router.post('/admin/refresh', authController.refreshToken);

// POST /api/auth/admin/logout — revoke refresh token
router.post('/admin/logout', authController.logout);

// GET /api/auth/me — requires valid access token
router.get('/me', authenticate, authController.me);

export { router as authRouter };
