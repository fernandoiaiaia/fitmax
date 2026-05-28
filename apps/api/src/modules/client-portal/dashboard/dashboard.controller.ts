import { Request, Response, NextFunction } from 'express';
import { DashboardClientService } from './dashboard.service';

export class DashboardClientController {
  private dashboardService = new DashboardClientService();

  /**
   * GET /api/client-portal/dashboard
   */
  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.sub; // IDOR protection: get clientId from JWT
      const overview = await this.dashboardService.getOverview(clientId);
      res.json(overview);
    } catch (err) {
      next(err);
    }
  };
}
