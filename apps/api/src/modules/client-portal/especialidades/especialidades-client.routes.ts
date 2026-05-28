import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../../lib/prisma';

const router = Router();

const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/**
 * GET /api/client-portal/especialidades
 * Retorna as especialidades únicas dos profissionais ATIVOS.
 * Usado para popular o grid de especialidades no fluxo de agendamento.
 * OWASP A05 — sem dados sensíveis, apenas strings de especialidade.
 */
router.get('/', readLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profissionais = await prisma.professional.findMany({
      where: { status: 'ATIVO', especialidade: { not: null } },
      select: { especialidade: true },
      distinct: ['especialidade'],
      orderBy: { especialidade: 'asc' },
    });

    const especialidades = profissionais
      .map(p => p.especialidade)
      .filter((e): e is string => !!e);

    res.json({ data: especialidades });
  } catch (err) {
    next(err);
  }
});

export { router as especialidadesClientRouter };
