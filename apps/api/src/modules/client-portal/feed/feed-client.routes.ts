import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { FeedClientController } from './feed-client.controller';

const router = Router();
const ctrl   = new FeedClientController();

// ─── Rate Limits (OWASP A04 — proteção por operação) ─────────────────────────

/** Leitura: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Muitas requisições de leitura. Aguarde 1 minuto.' },
});

/** Curtir: 30 req/min — evita spam de toggle curtida */
const curtirLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Muitas curtidas. Aguarde 1 minuto.' },
});

/** Comentar: 10 req/min — anti-flood de comentários */
const comentarLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Limite de comentários atingido. Aguarde 1 minuto.' },
});

/** Denunciar: 5 req/hora — anti-abuso de denúncias */
const denunciarLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Limite de denúncias atingido. Tente novamente em 1 hora.' },
});

// ─── Rotas ────────────────────────────────────────────────────────────────────
// IMPORTANTE: rotas estáticas (/comentarios) devem vir ANTES de /:id

// Leitura
router.get('/',                        readLimit,  ctrl.list);              // GET  /feed
router.get('/:id/comentarios',         readLimit,  ctrl.listarComentarios); // GET  /feed/:id/comentarios

// Escrita (requer cliente autenticado — auth aplicado no client-portal.routes.ts)
router.post('/:id/curtir',             curtirLimit,    ctrl.curtir);        // POST /feed/:id/curtir
router.post('/:id/comentar',           comentarLimit,  ctrl.comentar);      // POST /feed/:id/comentar
router.post('/:id/denunciar',          denunciarLimit, ctrl.denunciar);     // POST /feed/:id/denunciar

export { router as feedClientRouter };
