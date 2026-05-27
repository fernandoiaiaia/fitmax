import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UsuariosService } from './usuarios.service';

const service = new UsuariosService();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMeta(req: Request) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket?.remoteAddress ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
  };
}

// ─── Schemas Zod (OWASP A03 — validação rigorosa de inputs) ──────────────────

const listQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'BANIDO']).optional(),
  tipo:   z.enum(['cliente', 'profissional']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

const recentesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

const tipoBodySchema = z.object({
  tipo:   z.enum(['cliente', 'profissional']),
  motivo: z.string().max(500).optional(),
});

const toggleBodySchema = z.object({
  tipo:       z.enum(['cliente', 'profissional']),
  novoStatus: z.enum(['ATIVO', 'INATIVO']),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class UsuariosController {

  /** GET /api/admin/usuarios */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = listQuerySchema.parse(req.query);
      const result  = await service.list(filters);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/admin/usuarios/resumo */
  resumo = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.resumo());
    } catch (err) { next(err); }
  };

  /** GET /api/admin/usuarios/recentes */
  recentes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit } = recentesQuerySchema.parse(req.query);
      res.json(await service.recentes(limit));
    } catch (err) { next(err); }
  };

  /** PATCH /api/admin/usuarios/:id/status */
  toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id }              = uuidParamSchema.parse(req.params);
      const { tipo, novoStatus }= toggleBodySchema.parse(req.body);
      const adminId             = req.user!.sub;
      const meta                = getMeta(req);
      res.json(await service.toggleStatus({ id, tipo, novoStatus, adminId, ...meta }));
    } catch (err) { next(err); }
  };

  /** POST /api/admin/usuarios/:id/banir */
  banir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id }         = uuidParamSchema.parse(req.params);
      const { tipo, motivo } = tipoBodySchema.parse(req.body);
      const adminId        = req.user!.sub;
      const meta           = getMeta(req);
      res.json(await service.banir({ id, tipo, motivo, adminId, ...meta }));
    } catch (err) { next(err); }
  };

  /** POST /api/admin/usuarios/:id/restaurar */
  restaurar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id }   = uuidParamSchema.parse(req.params);
      const { tipo } = tipoBodySchema.parse(req.body);
      const adminId  = req.user!.sub;
      const meta     = getMeta(req);
      res.json(await service.restaurar({ id, tipo, adminId, ...meta }));
    } catch (err) { next(err); }
  };
}
