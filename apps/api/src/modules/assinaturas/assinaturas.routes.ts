import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AssinaturasController } from './assinaturas.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const ctrl   = new AssinaturasController();

// ─── Rate Limits (OWASP A04 — proteção proporcional à criticidade) ───────────

/** Leitura: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/** Criação e edição: 10 req/min por IP */
const writeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de criação/edição atingido. Aguarde 1 minuto.' },
});

/** Toggle: 20 req/min por IP */
const toggleLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de alterações atingido. Aguarde 1 minuto.' },
});

/** Exclusão: 5 req/min — operação irreversível, limite mínimo (OWASP A04) */
const deleteLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de exclusões atingido. Aguarde 1 minuto.' },
});

// ─── Middleware global do módulo (OWASP A01 — somente admin autenticado) ──────

router.use(authenticate, authorize('admin'));

// ─── Rotas ───────────────────────────────────────────────────────────────────

// IMPORTANTE: /toggle deve vir ANTES de /:id para não ser capturada como parâmetro
router.get('/',               readLimit,   ctrl.list);
router.post('/',              writeLimit,  ctrl.criar);
router.patch('/:id/toggle',   toggleLimit, ctrl.toggle);
router.put('/:id',            writeLimit,  ctrl.editar);
router.delete('/:id',         deleteLimit, ctrl.excluir);

export default router;
