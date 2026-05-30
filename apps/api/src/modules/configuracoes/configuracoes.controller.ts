import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConfiguracoesService } from './configuracoes.service';

const service = new ConfiguracoesService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extrai IP real e userAgent para audit log (OWASP A09) */
function getMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress
      ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

// ─── Schemas Zod (OWASP A03 — validação rigorosa de todos os inputs) ─────────

/**
 * Atualização de perfil — aceita qualquer subconjunto dos 3 campos.
 * username: apenas letras minúsculas, dígitos e underscore, sem @.
 * phone: formato brasileiro (10 ou 11 dígitos com ou sem máscara).
 */
const updatePerfilSchema = z
  .object({
    name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim().optional(),
    phone:    z
      .string()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/, 'Telefone inválido. Ex: (11) 99000-0000')
      .optional()
      .or(z.literal(''))
      .or(z.null()),
    username: z
      .string()
      .min(3, 'Username deve ter ao menos 3 caracteres')
      .max(30)
      .regex(/^[a-z0-9_]+$/, 'Username só pode conter letras minúsculas, números e _')
      .optional()
      .or(z.literal(''))
      .or(z.null()),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

/**
 * Preferências de notificação — todos booleanos opcionais, ao menos 1 obrigatório.
 */
const updateNotifPrefsSchema = z
  .object({
    novaConsulta:       z.boolean().optional(),
    cancelamento:       z.boolean().optional(),
    novoUsuario:        z.boolean().optional(),
    assinaturaVencendo: z.boolean().optional(),
    relatorioSemanal:   z.boolean().optional(),
    canalEmail:         z.boolean().optional(),
    canalWhatsapp:      z.boolean().optional(),
    canalPush:          z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

/**
 * Troca de senha:
 * - senhaAtual: obrigatória
 * - novaSenha: mín 8 chars (validação de força é client-side, min de segurança é server-side)
 * - confirmar: deve coincidir com novaSenha
 */
const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha:  z
      .string()
      .min(8, 'A nova senha deve ter ao menos 8 caracteres')
      .max(128, 'Senha muito longa'),
    confirmar:  z.string(),
  })
  .refine(data => data.novaSenha === data.confirmar, {
    message: 'A confirmação de senha não coincide com a nova senha',
    path: ['confirmar'],
  });

const CATEGORIAS_CONVENIO = ['Nacional', 'Regional', 'Empresarial', 'Odontológico', 'Outro'] as const;

/** Criação de convênio — nome + categoria obrigatórios */
const criarConvenioSchema = z.object({
  nome:      z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim(),
  categoria: z.enum(CATEGORIAS_CONVENIO, {
    errorMap: () => ({ message: `Categoria deve ser uma de: ${CATEGORIAS_CONVENIO.join(', ')}` }),
  }),
});

/** Edição de convênio — aceita subconjunto */
const editarConvenioSchema = criarConvenioSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para editar',
  });

/** UUID no parâmetro :id — OWASP A03 */
const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

/** Criação de novo administrador */
const criarAdminSchema = z.object({
  email:    z.string().email('E-mail inválido').max(254).toLowerCase().trim(),
  name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim().optional(),
  password: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres')
    .max(128, 'Senha muito longa'),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class ConfiguracoesController {

  // ── Perfil ────────────────────────────────────────────────────────────────

  /** GET /api/admin/configuracoes/perfil */
  getPerfil = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const perfil  = await service.getPerfil(adminId);
      res.json(perfil);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/admin/configuracoes/perfil */
  updatePerfil = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const campos  = updatePerfilSchema.parse(req.body);
      const meta    = getMeta(req);
      const perfil  = await service.updatePerfil({ adminId, ...campos, ...meta });
      res.json(perfil);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/admin/configuracoes/perfil/avatar
   * Arquivo já processado pelo multer antes de chegar aqui.
   * OWASP A04 — validação de tipo e tamanho feita no middleware multer (routes).
   */
  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'Nenhum arquivo enviado' });
        return;
      }
      const adminId = req.user!.sub;
      const meta    = getMeta(req);
      const result  = await service.updateAvatar(adminId, req.file.path, meta.ip, meta.userAgent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Notificações ─────────────────────────────────────────────────────────

  /** GET /api/admin/configuracoes/notificacoes */
  getNotifPrefs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const prefs   = await service.getNotifPrefs(adminId);
      res.json(prefs);
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/admin/configuracoes/notificacoes */
  updateNotifPrefs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user!.sub;
      const campos  = updateNotifPrefsSchema.parse(req.body);
      const meta    = getMeta(req);
      const prefs   = await service.updateNotifPrefs({ adminId, ...campos, ...meta });
      res.json(prefs);
    } catch (err) {
      next(err);
    }
  };

  // ── Segurança ─────────────────────────────────────────────────────────────

  /**
   * POST /api/admin/configuracoes/seguranca/senha
   * Rate limit estrito (passwordLimiter) aplicado na rota antes deste handler.
   */
  alterarSenha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId              = req.user!.sub;
      const { senhaAtual, novaSenha } = alterarSenhaSchema.parse(req.body);
      const meta                 = getMeta(req);
      const result               = await service.alterarSenha({ adminId, senhaAtual, novaSenha, ...meta });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Convênios ─────────────────────────────────────────────────────────────

  /** GET /api/admin/configuracoes/convenios */
  listConvenios = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listConvenios();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/configuracoes/convenios */
  criarConvenio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId           = req.user!.sub;
      const { nome, categoria } = criarConvenioSchema.parse(req.body);
      const meta              = getMeta(req);
      const convenio          = await service.criarConvenio({ nome, categoria, adminId, ...meta });
      res.status(201).json(convenio);
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/admin/configuracoes/convenios/:id */
  editarConvenio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id }            = uuidParamSchema.parse(req.params);
      const adminId           = req.user!.sub;
      const campos            = editarConvenioSchema.parse(req.body);
      const meta              = getMeta(req);
      const convenio          = await service.editarConvenio(id, { adminId, ...campos, ...meta });
      res.json(convenio);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/admin/configuracoes/convenios/:id/toggle */
  toggleConvenio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id }   = uuidParamSchema.parse(req.params);
      const adminId  = req.user!.sub;
      const meta     = getMeta(req);
      const convenio = await service.toggleConvenio(id, adminId, meta.ip, meta.userAgent);
      res.json(convenio);
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /api/admin/configuracoes/convenios/:id */
  excluirConvenio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id }  = uuidParamSchema.parse(req.params);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);
      const result  = await service.excluirConvenio(id, adminId, meta.ip, meta.userAgent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  // ── Gestão de Administradores ─────────────────────────────────────────────────

  /** GET /api/admin/configuracoes/admins */
  listAdmins = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await service.listAdmins();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/configuracoes/admins */
  criarAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const criadoPorId = req.user!.sub;
      const dto         = criarAdminSchema.parse(req.body);
      const meta        = getMeta(req);
      const admin       = await service.criarAdmin(dto, criadoPorId, meta.ip, meta.userAgent);
      res.status(201).json(admin);
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /api/admin/configuracoes/admins/:id */
  excluirAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id }   = uuidParamSchema.parse(req.params);
      const requesterId = req.user!.sub;
      const meta        = getMeta(req);
      const result      = await service.excluirAdmin(id, requesterId, meta.ip, meta.userAgent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
