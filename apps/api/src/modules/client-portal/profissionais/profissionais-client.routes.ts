import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';

const router = Router();

const readLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde 1 minuto.' },
});

/**
 * GET /api/client-portal/profissionais
 * Lista profissionais ATIVOS para o fluxo de agendamento.
 * OWASP A05 — select explícito: nunca expõe password, email ou dados sensíveis.
 */
router.get('/', readLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { especialidade } = req.query;
    const where: Record<string, unknown> = { status: 'ATIVO' };
    if (especialidade && typeof especialidade === 'string') {
      where.especialidade = { contains: especialidade, mode: 'insensitive' };
    }

    const profissionais = await prisma.professional.findMany({
      where,
      select: {
        id:                   true,
        name:                 true,
        avatarUrl:            true,
        especialidade:        true,
        cidade:               true,
        uf:                   true,
        registroProfissional: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ data: profissionais });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/client-portal/profissionais/:id/disponibilidade?data=YYYY-MM-DD
 * Retorna os horários JÁ OCUPADOS de um profissional em uma data específica.
 * Usado pelo calendário para bloquear slots tomados.
 * OWASP A05 — retorna apenas as horas (strings), sem IDs de clientes.
 */
const disponibilidadeSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve ser YYYY-MM-DD'),
});

router.get('/:id/disponibilidade', readLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = disponibilidadeSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ error: 'Parâmetro inválido', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { id } = req.params;
    const { data } = parsed.data;

    // O app é Brazil-only (UTC-3, sem horário de verão desde 2019).
    // O usuário vê "14:00" como hora local → salvo no banco como 17:00 UTC.
    // A janela de consulta cobre o dia local completo no fuso UTC-3:
    //   2026-05-28 00:00 BRT = 2026-05-28T03:00:00Z
    //   2026-05-28 23:59 BRT = 2026-05-29T02:59:59Z
    const BRT_OFFSET_HOURS = 3; // UTC-3
    const inicio = new Date(`${data}T00:00:00.000Z`);
    inicio.setUTCHours(inicio.getUTCHours() + BRT_OFFSET_HOURS);
    const fim = new Date(`${data}T23:59:59.999Z`);
    fim.setUTCHours(fim.getUTCHours() + BRT_OFFSET_HOURS);

    const consultas = await prisma.consulta.findMany({
      where: {
        profissionalId: id,
        status:         { not: 'ESTORNO' }, // ignora canceladas
        dataHora:       { gte: inicio, lte: fim },
      },
      select: { dataHora: true },
    });

    // Converte UTC → horário local BRT (UTC-3) para casar com os slots da UI
    const horariosOcupados = consultas.map(c => {
      const utcH = c.dataHora.getUTCHours();
      const utcM = c.dataHora.getUTCMinutes();
      const localH = ((utcH - BRT_OFFSET_HOURS) + 24) % 24;
      return `${localH.toString().padStart(2, '0')}:${utcM.toString().padStart(2, '0')}`;
    });

    res.json({ data: horariosOcupados });
  } catch (err) {
    next(err);
  }
});


export { router as profissionaisClientRouter };
