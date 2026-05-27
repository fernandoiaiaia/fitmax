import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UsuariosController } from './usuarios.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const ctrl   = new UsuariosController();

// ─── Rate Limits (OWASP A04) ──────────────────────────────────────────────────

/** Leitura: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000, max: 60,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/** Toggle ativo/inativo: 30 req/min */
const toggleLimit = rateLimit({
  windowMs: 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Limite de alterações de status atingido. Aguarde 1 minuto.' },
});

/** Banir / Restaurar: 10 req/min (ação crítica) */
const moderacaoLimit = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Limite de ações de moderação atingido. Aguarde 1 minuto.' },
});

// ─── Middleware global (OWASP A01) ────────────────────────────────────────────
router.use(authenticate, authorize('admin'));

// ─── Rotas de Leitura ─────────────────────────────────────────────────────────
// IMPORTANTE: rotas estáticas (/resumo, /recentes) ANTES de /:id
router.get('/resumo',   readLimit, ctrl.resumo);
router.get('/recentes', readLimit, ctrl.recentes);
router.get('/',         readLimit, ctrl.list);

// ─── Rotas de Moderação ───────────────────────────────────────────────────────
router.patch('/:id/status',    toggleLimit,    ctrl.toggleStatus);
router.post('/:id/banir',      moderacaoLimit, ctrl.banir);
router.post('/:id/restaurar',  moderacaoLimit, ctrl.restaurar);

export default router;
