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
  tipo: z.enum(['Presencial', 'Online']).optional(),
});

router.get('/:id/disponibilidade', readLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = disponibilidadeSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(422).json({ error: 'Parâmetro inválido', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { id } = req.params;
    const { data, tipo } = parsed.data;

    // 1. Buscar disponibilidades ativas no banco para esse profissional no dia
    //    - Slots sem modalidade (null) são universais → aparecem para qualquer tipo
    //    - Slots com modalidade explícita → filtrados pelo tipo solicitado pelo cliente
    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        profissionalId: id,
        dia: data,
        estado: 'DISPONIVEL',
        ...(tipo ? {
          OR: [
            { modalidade: null },
            { modalidade: tipo },
          ],
        } : {}),
      },
      orderBy: { hora: 'asc' },
    });

    // 2. Buscar consultas agendadas
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

    // Converte UTC → horário local BRT (UTC-3)
    const horariosOcupados = new Set(consultas.map(c => {
      const utcH = c.dataHora.getUTCHours();
      const utcM = c.dataHora.getUTCMinutes();
      const localH = ((utcH - BRT_OFFSET_HOURS) + 24) % 24;
      return `${localH.toString().padStart(2, '0')}:${utcM.toString().padStart(2, '0')}`;
    }));

    // 3. Montar a resposta com slots reais
    const slots = disponibilidades.map(d => ({
      hora: d.hora,
      modalidade: d.modalidade ?? null,
      endereco: d.endereco ?? '',
      ocupado: horariosOcupados.has(d.hora),
    }));

    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
});


export { router as profissionaisClientRouter };
