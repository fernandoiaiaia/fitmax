import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PublicacoesService } from './publicacoes.service';

const service = new PublicacoesService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress
      ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

// ─── Schemas Zod (OWASP A03 — validação rigorosa de inputs) ──────────────────

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['ATIVA', 'DENUNCIADA', 'BANIDA']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

const banirBodySchema = z.object({
  motivo: z.string().max(500).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class PublicacoesController {

  /** GET /api/admin/publicacoes */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = listQuerySchema.parse(req.query);
      const result  = await service.list(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/admin/publicacoes/contadores */
  contadores = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.contadores();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/publicacoes/:id/banir */
  banir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id }     = uuidParamSchema.parse(req.params);
      const { motivo } = banirBodySchema.parse(req.body);
      const adminId    = req.user!.sub;
      const meta       = getMeta(req);

      const result = await service.banir({ id, motivo, adminId, ...meta });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/publicacoes/:id/aprovar */
  aprovar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);

      const result = await service.aprovar({ id, adminId, ...meta });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
