import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  FeedClientService,
  feedListSchema,
  comentarSchema,
  denunciarSchema,
} from './feed-client.service';

const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

/** Extrai IP real mesmo atrás de proxy (OWASP A09 — rastreabilidade) */
function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function getMeta(req: Request) {
  return { ip: getIp(req), userAgent: req.headers['user-agent'] ?? '' };
}

export class FeedClientController {
  private svc = new FeedClientService();

  /**
   * GET /api/client-portal/feed
   * Feed paginado com busca e filtro de categoria.
   * OWASP A01 — clienteId sempre do JWT
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // OWASP A01 — clienteId do JWT, nunca de query/body
      const clienteId = req.user!.sub;

      // OWASP A03 — valida e sanitiza query params
      const parsed = feedListSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({ error: 'Parâmetros inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await this.svc.list(clienteId, parsed.data);
      res.json(result);
    } catch (err) { next(err); }
  };

  /**
   * GET /api/client-portal/feed/:id/comentarios
   * Lista comentários paginados de um post.
   */
  listarComentarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = paginationSchema.parse(req.query);
      const result = await this.svc.listarComentarios(req.params.id, page, limit);
      res.json(result);
    } catch (err) { next(err); }
  };

  /**
   * POST /api/client-portal/feed/:id/curtir
   * Toggle curtida (idempotente).
   * OWASP A01 — clienteId do JWT
   */
  curtir = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clienteId = req.user!.sub;
      const result = await this.svc.toggleCurtir(clienteId, req.params.id, getMeta(req));
      res.json(result);
    } catch (err) { next(err); }
  };

  /**
   * POST /api/client-portal/feed/:id/comentar
   * Cria comentário do cliente no post.
   * OWASP A03 — texto validado por Zod
   */
  comentar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clienteId = req.user!.sub;

      const parsed = comentarSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await this.svc.comentar(clienteId, req.params.id, parsed.data.texto, getMeta(req));
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  /**
   * POST /api/client-portal/feed/:id/denunciar
   * Registra denúncia do cliente.
   * OWASP A01 — clienteId do JWT; A04 — anti-dupla denúncia; A09 — audit log
   */
  denunciar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clienteId = req.user!.sub;

      const parsed = denunciarSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        return;
      }

      const result = await this.svc.denunciar(clienteId, req.params.id, parsed.data, getMeta(req));
      res.json(result);
    } catch (err) { next(err); }
  };
}
