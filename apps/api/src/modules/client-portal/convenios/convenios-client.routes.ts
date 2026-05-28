import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../../lib/prisma';
import rateLimit from 'express-rate-limit';

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', limiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const convenios = await prisma.convenio.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        categoria: true,
        ativo: true,
      }
    });
    res.json(convenios);
  } catch (err) {
    next(err);
  }
});

export { router as conveniosClientRouter };
