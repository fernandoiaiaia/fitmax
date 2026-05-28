import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../../config/env';
import { passwordLimiter } from '../../../middlewares/rateLimiter';
import { PerfilClientController } from './perfil-client.controller';

const router     = Router();
const controller = new PerfilClientController();

// ─── Rate Limiter do Módulo (OWASP A07) ──────────────────────────────────────
/**
 * 30 requisições por minuto por IP.
 * Previne scraping de dados de perfil e spam de atualizações.
 */
const perfilLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  standardHeaders: 'draft-7',
  legacyHeaders:   false,
  message:         { error: 'Muitas requisições. Tente novamente em breve.' },
  skip:            () => env.NODE_ENV === 'test',
});

router.use(perfilLimiter);

// ─── Multer — Upload de Avatar (OWASP A04) ────────────────────────────────────
/**
 * Limite: 2MB | MIME: jpeg/png/webp | Filename: UUID (anti path-traversal)
 * Espelha a configuração do módulo admin/configuracoes — padrão do projeto.
 */
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'avatars');

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    // OWASP A03 — filename UUID gerado no servidor (anti path-traversal / colisão)
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const avatarUpload = multer({
  storage:    avatarStorage,
  limits:     { fileSize: 2 * 1024 * 1024 }, // 2 MB — OWASP A04
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Envie uma imagem JPEG, PNG ou WebP.'));
    }
  },
});

// Garante que o diretório de uploads existe
import fs from 'fs';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Rotas de Perfil ─────────────────────────────────────────────────────────

/**
 * GET /api/client-portal/perfil/perfil
 * Dados do perfil do cliente (sem password, sem cpf).
 */
router.get('/perfil', controller.getPerfil);

/**
 * PATCH /api/client-portal/perfil/perfil
 * Atualiza nome, email, telefone, username, objetivo.
 * OWASP A03 — validado via Zod no controller
 */
router.patch('/perfil', controller.updatePerfil);

/**
 * POST /api/client-portal/perfil/perfil/avatar
 * Upload de foto de perfil (multipart/form-data, field: "avatar").
 * OWASP A04 — multer inline com tratamento de erro amigável.
 *
 * IMPORTANTE: declarado ANTES de '/:id' para não conflitar.
 */
router.post('/perfil/avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      // MulterError (tamanho) ou Error customizado (tipo inválido)
      const msg = (err as Error).message ?? 'Erro no upload do arquivo';
      res.status(400).json({ error: msg });
      return;
    }
    controller.updateAvatar(req, res, next);
  });
});

/**
 * DELETE /api/client-portal/perfil/perfil
 * Soft delete da conta (status = INATIVO).
 * OWASP A07 — requer senhaAtual no body para confirmar a exclusão.
 */
router.delete('/perfil', controller.excluirConta);

// ─── Rota de Plano ────────────────────────────────────────────────────────────

/**
 * GET /api/client-portal/perfil/plano
 * Informações do plano atual (nome, preço, features, data de renovação).
 */
router.get('/plano',    controller.getPlano);
router.patch('/plano',  controller.alterarPlano);
router.delete('/plano', controller.cancelarPlano);


// ─── Rotas de Notificações ────────────────────────────────────────────────────

/**
 * GET /api/client-portal/perfil/notificacoes
 * Preferências de notificação — cria com defaults se primeira vez.
 */
router.get('/notificacoes', controller.getNotifPrefs);

/**
 * PUT /api/client-portal/perfil/notificacoes
 * Salva preferências de notificação.
 * OWASP A03 — booleanos validados via Zod
 */
router.put('/notificacoes', controller.updateNotifPrefs);

// ─── Rota de Segurança / Senha ────────────────────────────────────────────────

/**
 * POST /api/client-portal/perfil/seguranca/senha
 * Altera senha do cliente.
 * OWASP A02 — bcrypt compare + hash no service
 * OWASP A07 — passwordLimiter: 5 req / 15 min (anti brute-force)
 */
router.post('/seguranca/senha', passwordLimiter, controller.alterarSenha);

export { router as perfilClientRouter };
