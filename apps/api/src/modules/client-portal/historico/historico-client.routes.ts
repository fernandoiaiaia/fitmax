import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../../config/env';
import { HistoricoClientController } from './historico-client.controller';

const router     = Router();
const controller = new HistoricoClientController();

/**
 * Rate limiter específico para o módulo de histórico.
 * OWASP A07 — 30 requisições por minuto por IP.
 * Previne scraping massivo dos dados de histórico do paciente.
 */
const historicoLimiter = rateLimit({
  windowMs:       60 * 1000, // 1 minuto
  max:            30,
  standardHeaders: 'draft-7',
  legacyHeaders:  false,
  message:        { error: 'Muitas requisições ao histórico. Tente novamente em breve.' },
  skip:           () => env.NODE_ENV === 'test',
});

router.use(historicoLimiter);

// ─── Rotas de Leitura (GET) ───────────────────────────────────────────────────

/**
 * GET /api/client-portal/historico
 * Lista paginada de consultas realizadas com filtro por período.
 * Query params: periodo (tudo|semana|mes|ano), page, limit
 */
router.get('/', controller.listar);

/**
 * GET /api/client-portal/historico/resumo
 * Métricas do card Resumo Geral da sidebar:
 * - Total de consultas
 * - Total investido (R$)
 * - Avaliações feitas
 * - Pendentes de avaliação
 *
 * IMPORTANTE: Esta rota deve ser declarada ANTES de '/:id'
 * para evitar que "resumo" seja interpretado como um UUID.
 */
router.get('/resumo', controller.resumo);

/**
 * GET /api/client-portal/historico/timeline
 * Últimas 8 consultas para o widget de Linha do Tempo da sidebar.
 *
 * IMPORTANTE: Esta rota deve ser declarada ANTES de '/:id'
 * para evitar que "timeline" seja interpretado como um UUID.
 */
router.get('/timeline', controller.timeline);

/**
 * GET /api/client-portal/historico/:id
 * Detalhe completo de uma consulta específica.
 * OWASP A01 — ownership verificado no service (retorna 404 se não pertencer ao cliente)
 */
router.get('/:id', controller.findById);

// ─── Rotas de Escrita (POST) ──────────────────────────────────────────────────

/**
 * POST /api/client-portal/historico/:id/avaliar
 * Cria ou atualiza a avaliação de uma consulta (1-5 ⭐ + comentário opcional).
 * OWASP A08 — upsert garante idempotência (uma avaliação por consulta)
 * OWASP A04 — só permite avaliar consultas com status PAGO
 */
router.post('/:id/avaliar', controller.avaliar);

export { router as historicoClientRouter };
