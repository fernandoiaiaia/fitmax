import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { DashboardClientController } from './dashboard/dashboard.controller';
import { consultasClientRouter } from './consultas/consultas-client.routes';
import { profissionaisClientRouter } from './profissionais/profissionais-client.routes';
import { especialidadesClientRouter } from './especialidades/especialidades-client.routes';
import { conveniosClientRouter } from './convenios/convenios-client.routes';
import { feedClientRouter } from './feed/feed-client.routes';
import { historicoClientRouter } from './historico/historico-client.routes';
import { perfilClientRouter } from './perfil/perfil-client.routes';
import { PerfilClientController } from './perfil/perfil-client.controller';

const router = Router();
const dashboardController = new DashboardClientController();
const perfilController    = new PerfilClientController();

// ─── Rotas públicas (sem autenticação) ───────────────────────────────────────
// Profissionais e especialidades são dados de catálogo — acessíveis a todos
// para que o fluxo de agendamento funcione mesmo antes do login.

router.use('/profissionais',  profissionaisClientRouter);
router.use('/especialidades', especialidadesClientRouter);
router.use('/convenios',      conveniosClientRouter);

// GET /api/client-portal/planos — lista planos ativos (pública, sem auth)
router.get('/planos', perfilController.listarPlanos);

// ─── Rotas protegidas — exigem cliente autenticado (OWASP A01) ───────────────
// A partir daqui, todas as rotas requerem JWT de cliente válido.

router.use(authenticate, authorize('client'));

// GET /api/client-portal/dashboard
router.get('/dashboard', dashboardController.getOverview);

// /api/client-portal/consultas — painel de consultas do paciente
router.use('/consultas', consultasClientRouter);

// /api/client-portal/feed — feed de posts dos profissionais
router.use('/feed', feedClientRouter);

// /api/client-portal/historico — histórico de consultas realizadas pelo paciente
router.use('/historico', historicoClientRouter);

// /api/client-portal/perfil — configurações do cliente (perfil, plano, notificações, senha)
router.use('/perfil', perfilClientRouter);

export { router as clientPortalRouter };

