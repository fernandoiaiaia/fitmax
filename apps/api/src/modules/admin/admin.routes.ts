import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const adminController = new AdminController();

// All admin routes require a valid token + admin role
router.use(authenticate, authorize('admin'));

router.get('/', adminController.findAll);
router.get('/:id', adminController.findById);
router.post('/', adminController.create);
router.delete('/:id', adminController.delete);

export { router as adminRouter };
