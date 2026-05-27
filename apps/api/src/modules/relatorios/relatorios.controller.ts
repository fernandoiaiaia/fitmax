import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RelatoriosService } from './relatorios.service';

const service = new RelatoriosService();

// ─── Schemas Zod (OWASP A03) ─────────────────────────────────────────────────

const NOW_YEAR = new Date().getFullYear();

const periodoSchema = z.object({
  ano: z.coerce.number().int().min(2020).max(NOW_YEAR + 1).default(NOW_YEAR),
  mes: z.coerce.number().int().min(1).max(12).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export class RelatoriosController {

  /** GET /api/admin/relatorios/kpis */
  kpis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ano, mes } = periodoSchema.parse(req.query);
      res.json(await service.kpis(ano, mes));
    } catch (err) { next(err); }
  };

  /** GET /api/admin/relatorios/grafico */
  grafico = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ano, mes } = periodoSchema.parse(req.query);
      res.json(await service.grafico(ano, mes));
    } catch (err) { next(err); }
  };

  /** GET /api/admin/relatorios/operacional */
  operacional = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.operacional());
    } catch (err) { next(err); }
  };

  /** GET /api/admin/relatorios/exportar-pdf */
  exportarPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ano, mes } = periodoSchema.parse(req.query);
      const html = await service.exportarPdf(ano, mes);
      // OWASP A05 — sem attachment para evitar sniffing; apenas inline print
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(html);
    } catch (err) { next(err); }
  };
}
