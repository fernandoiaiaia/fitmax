import { Router } from 'express';
import { ProfessionalController } from './professional.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const professionalController = new ProfessionalController();

// GET routes — admin or the professional themselves
router.get('/me', authenticate, authorize('professional'), professionalController.findMe); // deve vir ANTES de /:id
router.get('/', authenticate, authorize('admin'), professionalController.findAll);
router.get('/:id', authenticate, authorize('admin', 'professional'), professionalController.findById);

// Admin-only mutations
router.post('/', authenticate, authorize('admin'), professionalController.create);
router.put('/:id', authenticate, authorize('admin', 'professional'), professionalController.update);
router.delete('/:id', authenticate, authorize('admin'), professionalController.delete);

export { router as professionalRouter };
