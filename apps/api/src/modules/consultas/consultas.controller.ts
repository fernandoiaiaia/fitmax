import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConsultasService } from './consultas.service';

const service = new ConsultasService();

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
  search:   z.string().max(200).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom deve ser YYYY-MM-DD').optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo deve ser YYYY-MM-DD').optional(),
  status:   z.enum(['PENDENTE', 'PAGO', 'ESTORNO']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

const kpisQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const repasseBodySchema = z.object({
  ids: z
    .array(z.string().uuid('Cada ID deve ser um UUID válido'))
    .min(1, 'Selecione ao menos 1 consulta')
    .max(50, 'Máximo de 50 consultas por repasse'),
});

const estornoBodySchema = z.object({
  motivo: z.string().min(3, 'Motivo deve ter ao menos 3 caracteres').max(500),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class ConsultasController {

  /** GET /api/admin/consultas */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = listQuerySchema.parse(req.query);
      const result  = await service.list(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/admin/consultas/kpis */
  kpis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateFrom, dateTo } = kpisQuerySchema.parse(req.query);
      const result = await service.kpis(dateFrom, dateTo);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/admin/consultas/:id */
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const consulta = await service.findById(id);
      if (!consulta) {
        res.status(404).json({ error: 'Consulta não encontrada' });
        return;
      }
      res.json(consulta);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/consultas/repasse */
  processarRepasse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = repasseBodySchema.parse(req.body);
      const adminId = req.user!.sub;
      const meta    = getMeta(req);

      const result = await service.processarRepasse({ ids, adminId, ...meta });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/admin/consultas/:id/estorno */
  solicitarEstorno = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id }     = uuidParamSchema.parse(req.params);
      const { motivo } = estornoBodySchema.parse(req.body);
      const adminId    = req.user!.sub;
      const meta       = getMeta(req);

      const result = await service.solicitarEstorno({ id, motivo, adminId, ...meta });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
