import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ConsultasController } from './consultas.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const ctrl   = new ConsultasController();

// ─── Rate Limits (OWASP A04 — proteção de endpoints críticos) ───────────────

/** Leitura: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/** Repasse: 5 req/min por IP — operação financeira crítica */
const repasseLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de repasses atingido. Aguarde 1 minuto.' },
});

/** Estorno: 10 req/min por IP */
const estornoLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de estornos atingido. Aguarde 1 minuto.' },
});

// ─── Middleware global da rota ─────────────────────────────────────────────
// OWASP A01 — Broken Access Control: todas as rotas exigem admin autenticado

router.use(authenticate, authorize('admin'));

// ─── Rotas de Leitura ─────────────────────────────────────────────────────

// IMPORTANTE: /kpis deve vir ANTES de /:id para não ser capturada como parâmetro
router.get('/kpis',  readLimit, ctrl.kpis);
router.get('/',      readLimit, ctrl.list);
router.get('/:id',   readLimit, ctrl.findById);

// ─── Rotas de Escrita ─────────────────────────────────────────────────────

router.post('/repasse',      repasseLimit, ctrl.processarRepasse);
router.post('/:id/estorno',  estornoLimit, ctrl.solicitarEstorno);

export default router;
