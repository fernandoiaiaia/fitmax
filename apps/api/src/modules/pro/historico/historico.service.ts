import { prisma } from '@fitmax/database';
import { logger } from '../../../lib/logger';

// ─── Status map ───────────────────────────────────────────────────────────────

const STATUS_PRO_MAP: Record<string, string> = {
  PENDENTE: 'agendada',
  PAGO:     'concluida',
  ESTORNO:  'cancelada',
};

const STATUS_PAGAMENTO_MAP: Record<string, string> = {
  PAGO:    'pago',
  PENDENTE: 'pendente',
  ESTORNO: 'reembolsado',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centavosParaReais(v: number) {
  return (v / 100).toFixed(2);
}

function periodoWhere(periodo: string, profissionalId: string) {
  const hoje = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { profissionalId };

  if (periodo === 'semana') {
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - 7);
    where.dataHora = { gte: inicio };
  } else if (periodo === 'mes') {
    where.dataHora = { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) };
  } else if (periodo === 'ano') {
    where.dataHora = { gte: new Date(hoje.getFullYear(), 0, 1) };
  }
  // 'tudo' → sem filtro de data

  return where;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class HistoricoProService {

  /** Lista de consultas concluídas/pagas filtradas por período */
  async list(profissionalId: string, periodo: string, page: number, limit: number, meta: { ip: string; userAgent: string }) {
    const skip = (page - 1) * limit;
    const where = periodoWhere(periodo, profissionalId);
    // Histórico = somente consultas finalizadas (PAGO ou ESTORNO)
    where.status = { in: ['PAGO', 'ESTORNO'] };

    const [data, total] = await Promise.all([
      prisma.consulta.findMany({
        where,
        select: {
          id: true, dataHora: true, especialidade: true, tipo: true,
          valorCentavos: true, status: true,
          cliente: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { dataHora: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consulta.count({ where }),
    ]);

    logger.info({
      event: 'historico_lista_acessada',
      profissionalId,
      periodo,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou a lista de histórico de atendimentos');

    return {
      data: data.map(c => ({
        id:               c.id,
        dataHora:         c.dataHora.toISOString(),
        especialidade:    c.especialidade,
        modalidade:       c.tipo,
        valorReais:       centavosParaReais(c.valorCentavos),
        statusConsulta:   STATUS_PRO_MAP[c.status] ?? c.status,
        statusPagamento:  STATUS_PAGAMENTO_MAP[c.status] ?? c.status,
        paciente: {
          id:        c.cliente.id,
          nome:      c.cliente.name,
          avatarUrl: c.cliente.avatarUrl,
        },
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Resumo financeiro do período */
  async resumo(profissionalId: string, periodo: string, meta: { ip: string; userAgent: string }) {
    const whereBase = periodoWhere(periodo, profissionalId);

    const [pagos, pendentes, reembolsados] = await Promise.all([
      prisma.consulta.aggregate({
        where: { ...whereBase, status: 'PAGO' },
        _sum: { valorCentavos: true },
        _count: { id: true },
      }),
      prisma.consulta.count({ where: { ...whereBase, status: 'PENDENTE' } }),
      prisma.consulta.count({ where: { ...whereBase, status: 'ESTORNO' } }),
    ]);

    logger.info({
      event: 'historico_resumo_financeiro_acessado',
      profissionalId,
      periodo,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou o resumo financeiro');

    return {
      totalAtendimentos: (pagos._count.id ?? 0) + reembolsados,
      totalRecebidoReais: centavosParaReais(pagos._sum.valorCentavos ?? 0),
      pendentesDePagamento: pendentes,
      reembolsados,
    };
  }
}
