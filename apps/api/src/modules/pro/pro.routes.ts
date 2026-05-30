import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
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

// ─── Multer — Upload de Avatar do Profissional ───────────────────────────────
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'avatars');
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const avatarUpload = multer({
  storage: avatarStorage,
  limits:  { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo inválido. Envie uma imagem JPEG, PNG ou WebP.'));
  },
});

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
router.get('/config/convenios',    config.listarConvenios);
router.get('/config/planos',       config.listarPlanos);
router.put('/config/perfil',       config.atualizarPerfil);
router.patch('/config/senha',      authLimiter, config.atualizarSenha);
router.patch('/config/plano',      config.atualizarPlano);
router.put('/config/notificacoes', config.atualizarNotificacoes);
router.delete('/config/conta',     config.excluirConta);

// Upload de avatar do profissional
router.post('/config/perfil/avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? 'Erro no upload do arquivo' });
      return;
    }
    config.uploadAvatar(req, res, next);
  });
});

export { router as proRouter };
