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

// POST /api/auth/pro/register — professional sign up
router.post('/pro/register', authLimiter, authController.registerProfessional);

// POST /api/auth/pro/login — professional login
router.post('/pro/login', authLimiter, authController.loginProfessional);

// POST /api/auth/pro/refresh — professional refresh
router.post('/pro/refresh', authController.refreshProfessional);

// POST /api/auth/pro/logout — professional logout
router.post('/pro/logout', authController.logoutProfessional);

// POST /api/auth/client/register — client sign up
router.post('/client/register', authLimiter, authController.registerClient);

// POST /api/auth/client/login — client login
router.post('/client/login', authLimiter, authController.loginClient);

// POST /api/auth/client/refresh — client refresh
router.post('/client/refresh', authController.refreshClient);

// POST /api/auth/client/logout — client logout
router.post('/client/logout', authController.logoutClient);

// GET /api/auth/me — requires valid access token
router.get('/me', authenticate, authController.me);

export { router as authRouter };
