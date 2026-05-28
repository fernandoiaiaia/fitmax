import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rateLimiter';

// ─── Controllers ──────────────────────────────────────────────────────────────
import { DashboardProController }  from './dashboard/dashboard.controller';
import { ConsultasProController }  from './consultas/consultas.controller';
import { AgendaProController }     from './agenda/agenda.controller';
import { FeedProController }       from './feed/feed.controller';
import { HistoricoProController }  from './historico/historico.controller';
import { RelatoriosProController } from './relatorios/relatorios.controller';
import { ConfigProController }     from './config/config.controller';
import { prisma } from '@fitmax/database';

const router = Router();

// ─── Guard global ─────────────────────────────────────────────────────────────
router.use(authenticate);
router.use(authorize('professional'));

// ─── Me (perfil do profissional logado) ──────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const pro = await prisma.professional.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true, name: true, especialidade: true, email: true, plano: true,
        registroProfissional: true, avatarUrl: true, cidade: true, uf: true,
        telefone: true, username: true, convenios: true, notificacoes: true,
        _count: { select: { consultas: true } },
      },
    });
    if (!pro) { res.status(404).json({ error: 'Profissional não encontrado' }); return; }
    res.json(pro);
  } catch (err) { next(err); }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboard = new DashboardProController();
router.get('/dashboard/summary', dashboard.summary);

// ─── Consultas ────────────────────────────────────────────────────────────────
const consultas = new ConsultasProController();
// ⚠️  Rotas literais ANTES de /:id para evitar conflito de parâmetros
router.get('/consultas/summary',              consultas.summary);
router.get('/consultas/resumo-periodo',       consultas.resumoPeriodo);
router.get('/consultas',                      consultas.list);
router.get('/consultas/:id',                  consultas.findById);
// Escritas com rate-limit (OWASP A05)
router.patch('/consultas/:id/status',         authLimiter, consultas.updateStatus);
router.patch('/consultas/:id/reagendar',      authLimiter, consultas.reagendar);


// ─── Agenda ───────────────────────────────────────────────────────────────────
const agenda = new AgendaProController();
router.get('/agenda/dia',                agenda.getDia);
router.get('/agenda/mes',                agenda.getMes);
// Rate limit nas escritas da agenda (OWASP A05)
router.put('/agenda/disponibilidade',    authLimiter, agenda.salvarDisponibilidade);
router.patch('/agenda/recorrencia',      authLimiter, agenda.aplicarRecorrencia);
router.patch('/agenda/consulta/:id/status', authLimiter, agenda.atualizarStatus);

// ─── Feed ─────────────────────────────────────────────────────────────────────
const feed = new FeedProController();
// Rotas literais ANTES de /:id
router.get('/feed/minhas',                  feed.listMinhas);
router.get('/feed',                         feed.list);
router.post('/feed',                        authLimiter, feed.criar);
// Rotas com parâmetro
router.delete('/feed/:id',                  feed.deletar);
router.post('/feed/:id/curtir',             authLimiter, feed.curtir);      // toggle
router.post('/feed/:id/comentar',           authLimiter, feed.comentar);    // novo
router.get('/feed/:id/comentarios',         feed.listarComentarios);        // novo

// ─── Histórico ────────────────────────────────────────────────────────────────
const historico = new HistoricoProController();
router.get('/historico/resumo', historico.resumo);
router.get('/historico',        historico.list);

// ─── Relatórios ───────────────────────────────────────────────────────────────
const relatorios = new RelatoriosProController();
router.get('/relatorios/kpis',          relatorios.kpis);
router.get('/relatorios/dia',           relatorios.dia);
router.get('/relatorios/modalidade',    relatorios.modalidade);
router.get('/relatorios/especialidade', relatorios.especialidade);

// ─── Configurações ────────────────────────────────────────────────────────────
const config = new ConfigProController();
router.put('/config/perfil',       config.atualizarPerfil);
router.patch('/config/senha',      authLimiter, config.atualizarSenha);
router.patch('/config/plano',      config.atualizarPlano);
router.put('/config/notificacoes', config.atualizarNotificacoes);
router.delete('/config/conta',     config.excluirConta);

export { router as proRouter };
