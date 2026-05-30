import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';
import { ConsultaStatusAgenda } from '@prisma/client';

// ─── Mapeamento de Status ─────────────────────────────────────────────────
// statusAgenda é o campo que controla a visão do paciente.
// status (PENDENTE|PAGO|ESTORNO) é financeiro e permanece separado.
// A UX do cliente usa um fluxo mais legível mapeado a partir do statusAgenda.

const STATUS_FLUXO: Record<ConsultaStatusAgenda, string> = {
  AGENDADA:   'consulta_confirmada',
  CONFIRMADA: 'consulta_confirmada',
  CANCELADA:  'consulta_cancelada',
  CONCLUIDA:  'consulta_concluida',
  AUSENTE:    'consulta_ausente',   // cliente não compareceu
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

/** Verifica ownership e lança 404 se a consulta não pertencer ao cliente.
 *  Retorna 404 (não 403) para não vazar a existência da consulta (OWASP A01). */
async function assertOwnership(consultaId: string, clientId: string) {
  const consulta = await prisma.consulta.findUnique({
    where: { id: consultaId },
    select: { clienteId: true, status: true },
  });

  if (!consulta || consulta.clienteId !== clientId) {
    throw new AppError('Consulta não encontrada', 404);
  }

  return consulta;
}

function formatConsulta(c: {
  id: string;
  especialidade: string;
  tipo: string;
  dataHora: Date;
  valorCentavos: number;
  taxaPlataforma: number;
  status: string;
  statusAgenda: ConsultaStatusAgenda;
  repasseEm: Date | null;
  estornoMotivo: string | null;
  createdAt: Date;
  profissional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    especialidade: string | null;
    cidade: string | null;
    uf: string | null;
  };
}) {
  return {
    id:             c.id,
    especialidade:  c.especialidade,
    tipo:           c.tipo,
    dataHora:       c.dataHora.toISOString(),
    valorReais:     centavosParaReais(c.valorCentavos),
    taxaPlataforma: c.taxaPlataforma,
    // statusFluxo agora derivado do statusAgenda (campo de agenda), não do financeiro
    statusFluxo:    STATUS_FLUXO[c.statusAgenda],
    repasseEm:      c.repasseEm?.toISOString() ?? null,
    estornoMotivo:  c.estornoMotivo,
    criadoEm:       c.createdAt.toISOString(),
    profissional: {
      id:           c.profissional.id,
      name:         c.profissional.name,
      avatarUrl:    c.profissional.avatarUrl,
      especialidade: c.profissional.especialidade,
      cidade:       c.profissional.cidade,
      uf:           c.profissional.uf,
    },
  };
}

const PROFISSIONAL_SELECT = {
  id:           true,
  name:         true,
  avatarUrl:    true,
  especialidade: true,
  cidade:       true,
  uf:           true,
} as const;

// ─── Schemas de Validação (OWASP A03) ─────────────────────────────────────────

export const listarConsultasSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido (YYYY-MM-DD)').optional(),
  status:   z.enum(['PENDENTE', 'PAGO', 'ESTORNO']).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
});

export const statsSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const agendarConsultaSchema = z.object({
  // OWASP A03 — profissionalId deve ser UUID válido
  profissionalId: z.string().uuid('profissionalId inválido'),
  especialidade:  z.string().min(2).max(100).trim(),
  // OWASP A04 — tipo restrito a valores conhecidos
  tipo:           z.enum(['PRESENCIAL', 'ONLINE']),
  // OWASP A04 — dataHora deve ser no futuro
  dataHora:       z.string().datetime({ message: 'dataHora deve ser ISO8601' }).refine(
    v => new Date(v) > new Date(),
    { message: 'dataHora deve ser uma data futura' },
  ),
  observacao:     z.string().max(500).trim().optional(),
  // Valor em centavos — sem float (OWASP A02)
  valorCentavos:  z.number().int().min(1).max(100_000_00, 'Valor máximo excedido'),
});

export const cancelarConsultaSchema = z.object({
  motivo: z.string().max(500).trim().optional(),
});

export const reagendarConsultaSchema = z.object({
  novaDataHora: z.string().datetime({ message: 'novaDataHora deve ser ISO8601' }).refine(
    v => new Date(v) > new Date(),
    { message: 'novaDataHora deve ser uma data futura' },
  ),
});

// ─── Service ─────────────────────────────────────────────────────────────────

export class ConsultasClientService {

  /**
   * Lista as consultas do cliente autenticado com filtros e paginação.
   * OWASP A01 — WHERE clienteId = req.user.sub (anti-IDOR)
   * OWASP A03 — inputs validados via Zod antes de chegar aqui
   */
  async listar(clientId: string, input: z.infer<typeof listarConsultasSchema>) {
    const { dateFrom, dateTo, status, page, limit } = input;
    const skip = (page - 1) * limit;

    // OWASP A01 — clienteId fixado pelo JWT, nunca pelo caller
    const where: Record<string, unknown> = { clienteId: clientId };

    if (status) where.status = status;

    if (dateFrom || dateTo) {
      const dataHora: Record<string, Date> = {};
      if (dateFrom) dataHora.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)   dataHora.lte = new Date(`${dateTo}T23:59:59.999Z`);
      where.dataHora = dataHora;
    }

    const [data, total] = await Promise.all([
      prisma.consulta.findMany({
        where,
        select: {
          id:            true,
          especialidade: true,
          tipo:          true,
          dataHora:      true,
          valorCentavos: true,
          taxaPlataforma: true,
          status:        true,
          statusAgenda:  true,
          repasseEm:     true,
          estornoMotivo: true,
          createdAt:     true,
          profissional:  { select: PROFISSIONAL_SELECT },
        },
        orderBy: { dataHora: 'asc' },
        skip,
        take: limit,
      }),
      prisma.consulta.count({ where }),
    ]);

    return {
      data: data.map(formatConsulta),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Retorna os cards de resumo da tela principal de consultas.
   * OWASP A01 — agrega apenas dados do clientId do JWT.
   * OWASP A04 — endpoint separado com rate limit mais restrito.
   */
  async stats(clientId: string, input: z.infer<typeof statsSchema>) {
    const { dateFrom, dateTo } = input;
    const now = new Date();

    // OWASP A01 — clienteId sempre do JWT
    const baseWhere: Record<string, unknown> = { clienteId: clientId };

    if (dateFrom || dateTo) {
      const dataHora: Record<string, Date> = {};
      if (dateFrom) dataHora.gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo)   dataHora.lte = new Date(`${dateTo}T23:59:59.999Z`);
      baseWhere.dataHora = dataHora;
    }

    // Inicio e fim do dia atual
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [grupos, consultasHoje, proxima] = await Promise.all([
      // Agrega por status (valor investido + contagem)
      prisma.consulta.groupBy({
        by: ['status'],
        where: baseWhere,
        _sum:   { valorCentavos: true },
        _count: { id: true },
      }),
      // Consultas de hoje
      prisma.consulta.count({
        where: {
          clienteId: clientId,
          dataHora: { gte: startOfDay, lte: endOfDay },
        },
      }),
      // Próxima consulta futura (para "próxima em X horas")
      prisma.consulta.findFirst({
        where: {
          clienteId: clientId,
          dataHora: { gte: now },
          status: { not: 'ESTORNO' },
        },
        orderBy: { dataHora: 'asc' },
        select: { dataHora: true },
      }),
    ]);

    let totalConsultas = 0;
    let totalInvestidoCentavos = 0;
    let pendentes = 0;
    let confirmadas = 0;

    for (const g of grupos) {
      totalConsultas += g._count.id;
      totalInvestidoCentavos += g._sum.valorCentavos ?? 0;
      // usa statusAgenda para contar, não o status financeiro
      if (g.status === 'PENDENTE') pendentes  = g._count.id;
      if (g.status === 'PAGO')     confirmadas = g._count.id;
    }

    // Calcula "próxima em X horas/min"
    let proximaEm: string | null = null;
    if (proxima) {
      const diffMs   = proxima.dataHora.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60_000);
      if (diffMins < 60)  proximaEm = `${diffMins}min`;
      else                proximaEm = `${Math.floor(diffMins / 60)}h`;
    }

    return {
      totalConsultas,
      totalInvestidoReais: centavosParaReais(totalInvestidoCentavos),
      consultasHoje,
      confirmadas,
      pendentes,
      proximaEm,
    };
  }

  /**
   * Detalhe de uma consulta.
   * OWASP A01 — verifica ownership antes de retornar qualquer dado.
   */
  async findById(consultaId: string, clientId: string) {
    // Verifica ownership (lança 404 se não pertencer ao cliente)
    await assertOwnership(consultaId, clientId);

    // OWASP A05 — select explícito: nunca retorna password ou dados sensíveis
    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId },
      select: {
        id:            true,
        especialidade: true,
        tipo:          true,
        dataHora:      true,
        valorCentavos: true,
        taxaPlataforma: true,
        status:        true,
        statusAgenda:  true,
        repasseEm:     true,
        estornoMotivo: true,
        createdAt:     true,
        profissional:  {
          select: {
            ...PROFISSIONAL_SELECT,
            telefone:             true,
            registroProfissional: true,
            username:             true,
          },
        },
      },
    });

    if (!consulta) throw new AppError('Consulta não encontrada', 404);

    return {
      ...formatConsulta(consulta),
      profissional: {
        ...formatConsulta(consulta).profissional,
        telefone:             consulta.profissional.telefone,
        registroProfissional: consulta.profissional.registroProfissional,
        username:             consulta.profissional.username,
      },
    };
  }

  /**
   * Cria uma nova consulta (agendamento pelo paciente).
   * OWASP A01 — clienteId fixado pelo JWT
   * OWASP A03 — valida profissionalId no banco antes de inserir
   * OWASP A04 — dataHora futura validada no schema
   * OWASP A09 — log de auditoria
   */
  async agendar(
    clientId: string,
    input: z.infer<typeof agendarConsultaSchema>,
    meta: { ip: string; userAgent: string },
  ) {
    const { profissionalId, especialidade, tipo, dataHora, valorCentavos } = input;

    // OWASP A03 — verifica que o profissional existe e está ativo
    const profissional = await prisma.professional.findUnique({
      where: { id: profissionalId },
      select: { id: true, status: true },
    });

    if (!profissional || profissional.status !== 'ATIVO') {
      throw new AppError('Profissional não encontrado ou inativo', 422);
    }

    const consulta = await prisma.consulta.create({
      data: {
        // OWASP A01 — clienteId sempre do JWT, nunca do body
        clienteId:    clientId,
        profissionalId,
        especialidade,
        tipo:         tipo as 'PRESENCIAL' | 'ONLINE',
        dataHora:     new Date(dataHora),
        valorCentavos,
        taxaPlataforma: 10, // default da plataforma
        status:       'PENDENTE',
        statusAgenda: 'AGENDADA', // status de agenda inicial ao agendar
      },
      select: {
        id:            true,
        especialidade: true,
        tipo:          true,
        dataHora:      true,
        valorCentavos: true,
        taxaPlataforma: true,
        status:        true,
        statusAgenda:  true,
        repasseEm:     true,
        estornoMotivo: true,
        createdAt:     true,
        profissional:  { select: PROFISSIONAL_SELECT },
      },
    });

    // OWASP A09 — audit log de operação de escrita
    logger.info({
      event:         'consulta_agendada',
      clientId,
      profissionalId,
      consultaId:    consulta.id,
      tipo,
      dataHora,
      ip:            meta.ip,
      userAgent:     meta.userAgent,
    }, `✅ Consulta agendada: cliente ${clientId} → profissional ${profissionalId}`);

    return formatConsulta(consulta);
  }

  /**
   * Cancela uma consulta PENDENTE do cliente.
   * OWASP A01 — verifica ownership
   * OWASP A04 — só cancela PENDENTE (não permite cancelar o que já foi pago)
   * OWASP A09 — log de auditoria
   */
  async cancelar(
    consultaId: string,
    clientId: string,
    input: z.infer<typeof cancelarConsultaSchema>,
    meta: { ip: string; userAgent: string },
  ) {
    const consulta = await assertOwnership(consultaId, clientId);

    // OWASP A04 — regra de negócio: só cancela PENDENTE
    if (consulta.status !== 'PENDENTE') {
      throw new AppError(
        'Apenas consultas com pagamento pendente podem ser canceladas pelo paciente',
        422,
      );
    }

    const motivo = input.motivo
      ? `cancelado_pelo_cliente: ${input.motivo}`
      : 'cancelado_pelo_cliente';

    const atualizada = await prisma.consulta.update({
      where: { id: consultaId },
      data:  {
        status:       'ESTORNO',
        estornoMotivo: motivo,
        statusAgenda: 'CANCELADA', // marca cancelamento na visão de agenda (independente do financeiro)
      },
      select: { id: true, status: true, statusAgenda: true, estornoMotivo: true },
    });

    // OWASP A09 — audit log
    logger.warn({
      event:      'consulta_cancelada',
      clientId,
      consultaId,
      motivo,
      ip:         meta.ip,
      userAgent:  meta.userAgent,
    }, `⚠️  Consulta ${consultaId} cancelada pelo cliente ${clientId}`);

    return { ...atualizada, statusFluxo: STATUS_FLUXO[atualizada.statusAgenda] };
  }

  /**
   * Reagenda uma consulta PENDENTE para nova data.
   * OWASP A01 — verifica ownership
   * OWASP A03 — novaDataHora validada como ISO8601 futura no schema
   * OWASP A09 — log de auditoria
   */
  async reagendar(
    consultaId: string,
    clientId: string,
    input: z.infer<typeof reagendarConsultaSchema>,
    meta: { ip: string; userAgent: string },
  ) {
    const consulta = await assertOwnership(consultaId, clientId);

    // OWASP A04 — só reagenda PENDENTE
    if (consulta.status !== 'PENDENTE') {
      throw new AppError(
        'Apenas consultas com pagamento pendente podem ser reagendadas',
        422,
      );
    }

    const atualizada = await prisma.consulta.update({
      where: { id: consultaId },
      data:  { dataHora: new Date(input.novaDataHora) },
      select: {
        id:            true,
        especialidade: true,
        tipo:          true,
        dataHora:      true,
        valorCentavos: true,
        taxaPlataforma: true,
        status:        true,
        statusAgenda:  true,
        repasseEm:     true,
        estornoMotivo: true,
        createdAt:     true,
        profissional:  { select: PROFISSIONAL_SELECT },
      },
    });

    // OWASP A09 — audit log
    logger.info({
      event:        'consulta_reagendada',
      clientId,
      consultaId,
      novaDataHora: input.novaDataHora,
      ip:           meta.ip,
      userAgent:    meta.userAgent,
    }, `📅 Consulta ${consultaId} reagendada pelo cliente ${clientId}`);

    return formatConsulta(atualizada);
  }
}
