import { Request, Response, NextFunction } from 'express';
import {
  PerfilClientService,
  updatePerfilSchema,
  excluirContaSchema,
  notifPrefsSchema,
  alterarSenhaSchema,
} from './perfil-client.service';

const service = new PerfilClientService();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai IP real mesmo atrás de proxy (OWASP A09 — rastreabilidade). */
function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function getMeta(req: Request) {
  return { ip: getIp(req), userAgent: req.headers['user-agent'] ?? 'unknown' };
}

// ─── Controller ───────────────────────────────────────────────────────────────

export class PerfilClientController {

  /**
   * GET /api/client-portal/perfil/perfil
   * Dados do perfil do cliente autenticado.
   * OWASP A01 — clientId do JWT
   */
  getPerfil = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;
      const result   = await service.getPerfil(clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/client-portal/perfil/perfil
   * Atualiza dados pessoais (nome, email, telefone, username, objetivo).
   * OWASP A01 — clientId do JWT
   * OWASP A03 — body validado via Zod
   */
  updatePerfil = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;

      // OWASP A03 — valida e sanitiza body
      const parsed = updatePerfilSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await service.updatePerfil(clientId, parsed.data, getMeta(req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/client-portal/perfil/perfil/avatar
   * Upload de foto de perfil — arquivo já processado pelo multer.
   * OWASP A04 — validação de MIME e tamanho feita no middleware multer (routes)
   */
  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(422).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const clientId = req.user!.sub;
      const meta     = getMeta(req);
      const result   = await service.updateAvatar(clientId, req.file.path, meta.ip, meta.userAgent);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/client-portal/perfil/perfil
   * Exclusão de conta (soft delete — status = INATIVO).
   * OWASP A07 — requer senhaAtual no body para confirmar
   */
  excluirConta = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;

      // OWASP A03 — valida body (senhaAtual obrigatória)
      const parsed = excluirContaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      await service.excluirConta(clientId, parsed.data.senhaAtual, getMeta(req));
      // 204 No Content — conta desativada, sem body
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/perfil/plano
   * Informações do plano atual do cliente.
   */
  getPlano = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;
      const result   = await service.getPlano(clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/client-portal/perfil/notificacoes
   * Preferências de notificação (cria defaults se primeira vez — idempotente).
   */
  getNotifPrefs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;
      const result   = await service.getNotifPrefs(clientId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/client-portal/perfil/notificacoes
   * Salva preferências de notificação.
   * OWASP A03 — body validado via Zod (todos booleanos, ao menos 1)
   */
  updateNotifPrefs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;

      const parsed = notifPrefsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await service.updateNotifPrefs(clientId, parsed.data, getMeta(req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/client-portal/perfil/seguranca/senha
   * Altera senha do cliente.
   * OWASP A02 — bcrypt compare + hash
   * OWASP A07 — passwordLimiter aplicado no router (5 req/15min)
   */
  alterarSenha = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.user!.sub;

      const parsed = alterarSenhaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          error:   'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { senhaAtual, novaSenha } = parsed.data;
      const result = await service.alterarSenha(clientId, senhaAtual, novaSenha, getMeta(req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
