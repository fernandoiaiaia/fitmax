import { Router } from 'express';
import { ClientController } from './client.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const clientController = new ClientController();

// Admin or professional can list all clients
router.get('/', authenticate, authorize('admin', 'professional'), clientController.findAll);
router.get('/:id', authenticate, authorize('admin', 'professional', 'client'), clientController.findById);

// Registration — public (no auth required)
router.post('/', clientController.create);

// Update — admin or the client themselves
router.put('/:id', authenticate, authorize('admin', 'client'), clientController.update);

// Delete — admin only
router.delete('/:id', authenticate, authorize('admin'), clientController.delete);

export { router as clientRouter };
