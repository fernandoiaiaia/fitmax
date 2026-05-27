import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PublicacoesController } from './publicacoes.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const ctrl   = new PublicacoesController();

// ─── Rate Limits (OWASP A04) ──────────────────────────────────────────────────

/** Leitura: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/** Moderação: 10 req/min por IP — ação de moderação crítica */
const moderacaoLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de ações de moderação atingido. Aguarde 1 minuto.' },
});

// ─── Middleware global (OWASP A01 — Broken Access Control) ───────────────────
router.use(authenticate, authorize('admin'));

// ─── Rotas de Leitura ─────────────────────────────────────────────────────────
// IMPORTANTE: /contadores deve vir ANTES de /:id
router.get('/contadores', readLimit, ctrl.contadores);
router.get('/',           readLimit, ctrl.list);

// ─── Rotas de Moderação ───────────────────────────────────────────────────────
router.post('/:id/banir',   moderacaoLimit, ctrl.banir);
router.post('/:id/aprovar', moderacaoLimit, ctrl.aprovar);

export default router;
