import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RelatoriosProService } from './relatorios.service';

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const periodSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(firstOfMonth()),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(today()),
});

export class RelatoriosProController {
  private svc = new RelatoriosProService();

  /** GET /api/pro/relatorios/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD */
  kpis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { from, to } = periodSchema.parse(req.query);
      const result = await this.svc.kpis(
        profissionalId,
        from,
        to,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/relatorios/dia */
  dia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const result = await this.svc.dia(
        profissionalId,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/relatorios/modalidade?from=&to= */
  modalidade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { from, to } = periodSchema.parse(req.query);
      const result = await this.svc.modalidade(
        profissionalId,
        from,
        to,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/relatorios/especialidade?from=&to= */
  especialidade = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { from, to } = periodSchema.parse(req.query);
      const result = await this.svc.especialidade(
        profissionalId,
        from,
        to,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };
}
