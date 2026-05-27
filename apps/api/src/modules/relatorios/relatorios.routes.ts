import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RelatoriosController } from './relatorios.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const ctrl   = new RelatoriosController();

// ─── Rate Limits (OWASP A04) ──────────────────────────────────────────────────

/** Leitura de relatórios: 120 req/min */
const readLimit = rateLimit({
  windowMs: 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/** Exportar PDF: 10 req/min (geração de HTML é mais cara) */
const exportLimit = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Limite de exportações atingido. Aguarde 1 minuto.' },
});

// ─── Auth global (OWASP A01) ─────────────────────────────────────────────────
router.use(authenticate, authorize('admin'));

// ─── Rotas ───────────────────────────────────────────────────────────────────
router.get('/kpis',         readLimit,   ctrl.kpis);
router.get('/grafico',      readLimit,   ctrl.grafico);
router.get('/operacional',  readLimit,   ctrl.operacional);
router.get('/exportar-pdf', exportLimit, ctrl.exportarPdf);

export default router;
