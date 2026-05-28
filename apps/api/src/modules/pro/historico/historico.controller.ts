import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HistoricoProService } from './historico.service';

const periodoSchema = z.enum(['semana', 'mes', 'ano', 'tudo']).default('mes');

export class HistoricoProController {
  private svc = new HistoricoProService();

  /** GET /api/pro/historico?periodo=mes&page=1&limit=20 */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { periodo, page, limit } = z.object({
        periodo: periodoSchema,
        page:    z.coerce.number().int().min(1).default(1),
        limit:   z.coerce.number().int().min(1).max(50).default(20),
      }).parse(req.query);
      const result = await this.svc.list(
        profissionalId,
        periodo,
        page,
        limit,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };

  /** GET /api/pro/historico/resumo?periodo=mes */
  resumo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub;
      const { periodo } = z.object({ periodo: periodoSchema }).parse(req.query);
      const result = await this.svc.resumo(
        profissionalId,
        periodo,
        { ip: req.ip ?? '', userAgent: req.headers['user-agent'] ?? '' }
      );
      res.json(result);
    } catch (err) { next(err); }
  };
}
