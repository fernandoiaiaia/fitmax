import { prisma } from '@fitmax/database';
import { logger } from '../../lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListConsultasFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'PENDENTE' | 'PAGO' | 'ESTORNO';
  page: number;
  limit: number;
}

export interface ProcessarRepasseDTO {
  ids: string[];
  adminId: string;
  ip: string;
  userAgent: string;
}

export interface SolicitarEstornoDTO {
  id: string;
  motivo: string;
  adminId: string;
  ip: string;
  userAgent: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte centavos para string em reais (ex: 35000 → "350.00") */
function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

function buildConsultaWhere(filters: ListConsultasFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.dataHora = {};
    if (filters.dateFrom) where.dataHora.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo)   where.dataHora.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { profissional: { name: { contains: q, mode: 'insensitive' } } },
      { cliente:      { name: { contains: q, mode: 'insensitive' } } },
      { especialidade: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

function formatConsulta(c: {
  id: string;
  especialidade: string;
  tipo: string;
  dataHora: Date;
  valorCentavos: number;
  taxaPlataforma: number;
  status: string;
  repasseEm: Date | null;
  estornoMotivo: string | null;
  profissional: { id: string; name: string; avatarUrl: string | null; especialidade: string | null };
  cliente: { id: string; name: string; avatarUrl: string | null };
}) {
  const repasseCentavos = Math.round(c.valorCentavos * (1 - c.taxaPlataforma / 100));
  return {
    id:             c.id,
    especialidade:  c.especialidade,
    tipo:           c.tipo,
    dataHora:       c.dataHora.toISOString(),
    valorReais:     centavosParaReais(c.valorCentavos),
    repasseReais:   centavosParaReais(repasseCentavos),
    taxaPlataforma: c.taxaPlataforma,
    status:         c.status,
    repasseEm:      c.repasseEm?.toISOString() ?? null,
    estornoMotivo:  c.estornoMotivo,
    profissional: {
      id:           c.profissional.id,
      name:         c.profissional.name,
      avatarUrl:    c.profissional.avatarUrl,
      especialidade: c.profissional.especialidade,
    },
    cliente: {
      id:       c.cliente.id,
      name:     c.cliente.name,
      avatarUrl: c.cliente.avatarUrl,
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

const INCLUDE_RELATIONS = {
  profissional: { select: { id: true, name: true, avatarUrl: true, especialidade: true } },
  cliente:      { select: { id: true, name: true, avatarUrl: true } },
};

export class ConsultasService {

  /** Lista paginada de consultas com filtros (OWASP A03 — Prisma parameterized) */
  async list(filters: ListConsultasFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;
    const where = buildConsultaWhere(filters);

    const [data, total] = await Promise.all([
      prisma.consulta.findMany({
        where,
        include: INCLUDE_RELATIONS,
        orderBy: { dataHora: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consulta.count({ where }),
    ]);

    return {
      data: data.map(formatConsulta),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** KPIs financeiros agrupados por status */
  async kpis(dateFrom?: string, dateTo?: string) {
    const where = buildConsultaWhere({ dateFrom, dateTo, page: 1, limit: 1 });

    // Agrega por status em uma única query
    const grupos = await prisma.consulta.groupBy({
      by: ['status'],
      where,
      _sum: { valorCentavos: true },
      _count: { id: true },
    });

    let totalRepassadoCentavos = 0;
    let totalPendenteCentavos  = 0;
    let totalEstornoCentavos   = 0;
    let totalMovimentadoCentavos = 0;

    for (const g of grupos) {
      const soma = g._sum.valorCentavos ?? 0;
      totalMovimentadoCentavos += soma;
      if (g.status === 'PAGO')     totalRepassadoCentavos = soma;
      if (g.status === 'PENDENTE') totalPendenteCentavos  = soma;
      if (g.status === 'ESTORNO')  totalEstornoCentavos   = soma;
    }

    return {
      totalRepassadoReais:    centavosParaReais(totalRepassadoCentavos),
      totalPendenteReais:     centavosParaReais(totalPendenteCentavos),
      totalEstornoReais:      centavosParaReais(totalEstornoCentavos),
      totalMovimentadoReais:  centavosParaReais(totalMovimentadoCentavos),
    };
  }

  /** Detalhe completo de uma consulta */
  async findById(id: string) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      include: {
        ...INCLUDE_RELATIONS,
        repasses: {
          select: {
            id: true,
            valorCentavos: true,
            processadoEm: true,
            admin: { select: { id: true, email: true } },
          },
          orderBy: { processadoEm: 'desc' },
        },
      },
    });

    if (!consulta) return null;

    const repasseCentavos = Math.round(consulta.valorCentavos * (1 - consulta.taxaPlataforma / 100));
    return {
      ...formatConsulta(consulta),
      repasses: consulta.repasses.map(r => ({
        id:           r.id,
        valorReais:   centavosParaReais(r.valorCentavos),
        processadoEm: r.processadoEm.toISOString(),
        admin:        r.admin,
      })),
      repasseCalculadoReais: centavosParaReais(repasseCentavos),
    };
  }

  /**
   * Processa repasse em lote (OWASP A01 — somente admin autenticado)
   * Usa transação para garantir atomicidade (OWASP A04 — operação financeira crítica)
   */
  async processarRepasse(dto: ProcessarRepasseDTO) {
    const { ids, adminId, ip, userAgent } = dto;

    // Valida que todas existem e são PENDENTE antes de iniciar a transação
    const consultas = await prisma.consulta.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, valorCentavos: true, taxaPlataforma: true },
    });

    if (consultas.length !== ids.length) {
      const encontradas = consultas.map(c => c.id);
      const naoEncontradas = ids.filter(id => !encontradas.includes(id));
      throw Object.assign(new Error(`Consultas não encontradas: ${naoEncontradas.join(', ')}`), { statusCode: 404 });
    }

    const naoElegiveis = consultas.filter(c => c.status !== 'PENDENTE');
    if (naoElegiveis.length > 0) {
      throw Object.assign(
        new Error(`As seguintes consultas não estão PENDENTE: ${naoElegiveis.map(c => c.id).join(', ')}`),
        { statusCode: 422 }
      );
    }

    // Transação atômica: atualiza status + cria Repasse
    const agora = new Date();
    await prisma.$transaction(
      consultas.map(c => {
        const repasseVal = Math.round(c.valorCentavos * (1 - c.taxaPlataforma / 100));
        return prisma.consulta.update({
          where: { id: c.id },
          data: {
            status: 'PAGO',
            statusAgenda: 'CONFIRMADA', // confirma na visão de agenda ao processar repasse
            repasseEm: agora,
            repasses: {
              create: {
                adminId,
                valorCentavos: repasseVal,
                processadoEm: agora,
              },
            },
          },
        });
      })
    );

    // OWASP A09 — Audit log de operação financeira crítica
    logger.info({
      event:        'repasse_processado',
      adminId,
      consultasIds: ids,
      total:        ids.length,
      ip,
      userAgent,
    }, `✅ Repasse processado para ${ids.length} consulta(s) pelo admin ${adminId}`);

    return { processadas: ids.length, ids };
  }

  /**
   * Solicita estorno de uma consulta PAGA
   */
  async solicitarEstorno(dto: SolicitarEstornoDTO) {
    const { id, motivo, adminId, ip, userAgent } = dto;

    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!consulta) {
      throw Object.assign(new Error('Consulta não encontrada'), { statusCode: 404 });
    }

    if (consulta.status !== 'PAGO') {
      throw Object.assign(
        new Error(`Apenas consultas com status PAGO podem ser estornadas. Status atual: ${consulta.status}`),
        { statusCode: 422 }
      );
    }

    const atualizada = await prisma.consulta.update({
      where: { id },
      data: {
        status: 'ESTORNO',
        estornoMotivo: motivo,
        statusAgenda: 'CANCELADA', // marca cancelamento na visão de agenda (independente do financeiro)
      },
      select: { id: true, status: true, estornoMotivo: true },
    });

    // OWASP A09 — Audit log
    logger.warn({
      event:   'estorno_solicitado',
      adminId,
      consultaId: id,
      motivo,
      ip,
      userAgent,
    }, `⚠️  Estorno solicitado para consulta ${id} pelo admin ${adminId}`);

    return atualizada;
  }
}
