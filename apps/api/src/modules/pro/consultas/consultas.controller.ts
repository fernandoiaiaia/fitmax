import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConsultasProService, statusProSchema } from './consultas.service';

const listQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
  status:   statusProSchema.optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
});

const updateStatusBodySchema = z.object({
  status: statusProSchema,
});

export class ConsultasProController {
  private svc = new ConsultasProService();

  /** GET /api/pro/consultas */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const filters = listQuerySchema.parse(req.query);
      const result = await this.svc.list(profissionalId, filters);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/consultas/summary */
  summary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { dateFrom, dateTo } = z.object({
        dateFrom: z.string().optional(),
        dateTo:   z.string().optional(),
      }).parse(req.query);
      const result = await this.svc.summary(profissionalId, dateFrom, dateTo);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/consultas/:id */
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { id } = req.params;
      const result = await this.svc.findById(profissionalId, id);
      if (!result) {
        res.status(404).json({ error: 'Consulta não encontrada' });
        return;
      }
      res.json(result);
    } catch (err) { next(err); }
  };

  /** PATCH /api/pro/consultas/:id/status */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { id } = req.params;
      const { status } = updateStatusBodySchema.parse(req.body);
      const result = await this.svc.updateStatus(
        profissionalId, id, status,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/consultas/resumo-periodo?dateFrom=&dateTo= */
  resumoPeriodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const today = new Date().toISOString().slice(0, 10);
      const firstOfMonth = `${today.slice(0, 7)}-01`;
      const { dateFrom, dateTo } = z.object({
        dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(firstOfMonth),
        dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(today),
      }).parse(req.query);
      const result = await this.svc.resumoPeriodo(profissionalId, dateFrom, dateTo);
      res.json(result);
    } catch (err) { next(err); }
  };

  /** PATCH /api/pro/consultas/:id/reagendar */
  reagendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { id } = req.params;
      const { novaDataHora } = z.object({
        // OWASP A03 — validação estrita da data ISO
        novaDataHora: z.string().datetime({ message: 'novaDataHora deve ser ISO 8601 válido' }),
      }).parse(req.body);
      const result = await this.svc.reagendar(
        profissionalId, id, new Date(novaDataHora),
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };
}
