import { Request, Response, NextFunction } from 'express';
import { DashboardProService } from './dashboard.service';

export class DashboardProController {
  private svc = new DashboardProService();

  /** GET /api/pro/dashboard/summary */
  summary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profissionalId = req.user!.sub; // OWASP A01 — do token, nunca do body
      const data = await this.svc.summary(profissionalId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}
