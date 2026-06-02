import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ConsultasClientController } from './consultas-client.controller';

const router = Router();
const ctrl   = new ConsultasClientController();

// ─── Rate Limits (OWASP A04 — proteção por endpoint) ─────────────────────────

/** Leitura geral: 60 req/min por IP */
const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/** Stats: 30 req/min — evita scraping de dados financeiros (OWASP A04) */
const statsLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições de estatísticas. Aguarde 1 minuto.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/** Agendamento: 5 por hora — anti-spam de novos agendamentos (OWASP A04) */
const agendarLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de agendamentos atingido. Tente novamente em 1 hora.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/** Cancelamento: 10 por hora — evita abusos (OWASP A04) */
const cancelarLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de cancelamentos atingido. Tente novamente em 1 hora.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

/** Reagendamento: 10 por hora */
const reagendarLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de reagendamentos atingido. Tente novamente em 1 hora.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true',
});

// ─── Rotas ────────────────────────────────────────────────────────────────────
// IMPORTANTE: /stats deve vir ANTES de /:id para não ser capturada como parâmetro

// Leitura
router.get('/stats', statsLimit,  ctrl.stats);       // GET  /consultas/stats
router.get('/',      readLimit,   ctrl.listar);       // GET  /consultas
router.get('/:id',   readLimit,   ctrl.findById);     // GET  /consultas/:id

// Escrita
router.post('/',                  agendarLimit,   ctrl.agendar);     // POST /consultas
router.post('/:id/cancelar',      cancelarLimit,  ctrl.cancelar);    // POST /consultas/:id/cancelar
router.post('/:id/reagendar',     reagendarLimit, ctrl.reagendar);   // POST /consultas/:id/reagendar

export { router as consultasClientRouter };
