import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../../middlewares/auth';
import { passwordLimiter } from '../../middlewares/rateLimiter';
import { ConfiguracoesController } from './configuracoes.controller';

const router = Router();
const controller = new ConfiguracoesController();

// ─── Multer — Upload de Avatar ───────────────────────────────────────────────
/**
 * OWASP A04 — Insecure Design:
 *  - Limite de 2MB por arquivo
 *  - Apenas MIME types de imagem aceitos (jpeg, png, webp)
 *  - Filename gerado com UUID para evitar path traversal / colisão
 */
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
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Envie uma imagem JPEG, PNG ou WebP.'));
    }
  },
});

// ─── Guard global: todas as rotas exigem token de admin ─────────────────────
// OWASP A01 — Broken Access Control
router.use(authenticate, authorize('admin'));

// ─── Perfil ──────────────────────────────────────────────────────────────────
router.get('/perfil',   controller.getPerfil);
router.patch('/perfil', controller.updatePerfil);

/**
 * POST /api/admin/configuracoes/perfil/avatar
 * O multer é chamado manualmente para capturar erros (tipo inválido, tamanho)
 * e retornar 400 com mensagem amigável em vez de 500 genérico.
 */
router.post('/perfil/avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      // MulterError (tamanho) ou Error customizado (tipo inválido)
      const msg = err.message ?? 'Erro no upload do arquivo';
      res.status(400).json({ error: msg });
      return;
    }
    controller.updateAvatar(req, res, next);
  });
});


// ─── Notificações ────────────────────────────────────────────────────────────
router.get('/notificacoes',   controller.getNotifPrefs);
router.put('/notificacoes',   controller.updateNotifPrefs);

// ─── Segurança ────────────────────────────────────────────────────────────────
// passwordLimiter: 5 req / 15 min — OWASP A07
router.post('/seguranca/senha', passwordLimiter, controller.alterarSenha);

// ─── Convênios ────────────────────────────────────────────────────────────────
router.get('/convenios',                  controller.listConvenios);
router.post('/convenios',                 controller.criarConvenio);
router.put('/convenios/:id',              controller.editarConvenio);
router.patch('/convenios/:id/toggle',     controller.toggleConvenio);
router.delete('/convenios/:id',           controller.excluirConvenio);

// ─── Administradores ──────────────────────────────────────────────────────────
// OWASP A07 — criação de admin usa o mesmo rate limiter estrito de senha
router.get('/admins',         controller.listAdmins);
router.post('/admins',        passwordLimiter, controller.criarAdmin);
router.delete('/admins/:id',  controller.excluirAdmin);

export default router;


