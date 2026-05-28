import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AgendaProService, salvarDisponibilidadeSchema, recorrenciaSchema } from './agenda.service';

export class AgendaProController {
  private svc = new AgendaProService();

  /** GET /api/pro/agenda/dia?data=YYYY-MM-DD */
  getDia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { data } = z.object({
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().slice(0, 10)),
      }).parse(req.query);
      const result = await this.svc.getDia(
        profissionalId,
        data,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json({ dia: data, slots: result });
    } catch (err) { next(err); }
  };

  /** GET /api/pro/agenda/mes?ano=YYYY&mes=MM */
  getMes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { ano, mes } = z.object({
        ano: z.coerce.number().int().min(2024),
        mes: z.coerce.number().int().min(1).max(12),
      }).parse(req.query);
      const result = await this.svc.getMes(
        profissionalId,
        ano,
        mes,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** PUT /api/pro/agenda/disponibilidade */
  salvarDisponibilidade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const dto = salvarDisponibilidadeSchema.parse(req.body);
      const result = await this.svc.salvarDisponibilidade(
        profissionalId, dto,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** PATCH /api/pro/agenda/recorrencia */
  aplicarRecorrencia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const dto = recorrenciaSchema.parse(req.body);
      const result = await this.svc.aplicarRecorrencia(
        profissionalId, dto,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' },
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** PATCH /api/pro/agenda/consulta/:id/status */
  atualizarStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const consultaId = req.params.id;
      const { status } = z.object({
        status: z.enum(['confirmada', 'pendente', 'em_andamento', 'cancelada']),
      }).parse(req.body);

      const result = await this.svc.atualizarStatusConsulta(
        profissionalId,
        consultaId,
        status,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };
}
