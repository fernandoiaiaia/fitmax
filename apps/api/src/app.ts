import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { helmetMiddleware, corsMiddleware } from './middlewares/security';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

const app = express();

// ─── Security (OWASP A05) — must be first ────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);

// ─── Request ID — for distributed tracing / audit correlation ────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', uuidv4());
  next();
});

// ─── Core Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));     // 1MB limit prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());                      // needed for httpOnly refresh token cookie

// ─── Rate Limiting (OWASP A07) ───────────────────────────────────────────────
// Exclui logout e refresh do limite global: bloquear logout deixa o cookie ativo
// (auth bypass); bloquear refresh quebra a restauração de sessão.
app.use('/api', (req, res, next) => {
  const exempt = ['/api/auth/admin/logout', '/api/auth/admin/refresh'];
  if (exempt.some(p => req.path === p || req.originalUrl.includes(p))) {
    return next();
  }
  return apiLimiter(req, res, next);
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Static Files — Avatar uploads ───────────────────────────────────────────
// Serve /uploads publicamente para que as URLs de avatar retornadas pela API
// sejam acessíveis pelo frontend sem autenticação.
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export { app };
