import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { DashboardClientController } from './dashboard/dashboard.controller';

const router = Router();
const dashboardController = new DashboardClientController();

// All routes here are strictly for logged-in clients
router.use(authenticate, authorize('client'));

// GET /api/client-portal/dashboard
router.get('/dashboard', dashboardController.getOverview);

export { router as clientPortalRouter };
