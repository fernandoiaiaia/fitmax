import { Router, Request, Response, NextFunction } from 'express';
import { ClientController } from './client.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const clientController = new ClientController();

// ── /me — deve vir ANTES de /:id para não ser capturado como param ────────────
// GET /api/clients/me → retorna o perfil do cliente autenticado
router.get(
  '/me',
  authenticate,
  authorize('client'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // OWASP A01 — id sempre do JWT, nunca de query/body
      req.params.id = req.user!.sub;
      return clientController.findById(req, res, next);
    } catch (err) {
      next(err);
    }
  },
);

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

