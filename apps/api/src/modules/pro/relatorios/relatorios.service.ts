import { prisma } from '@fitmax/database';
import { logger } from '../../../lib/logger';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centavosParaReais(v: number) {
  return (v / 100).toFixed(2);
}

function buildPeriodFilter(from: string, to: string) {
  return {
    gte: new Date(`${from}T00:00:00`),
    lte: new Date(`${to}T23:59:59`),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class RelatoriosProService {

  /**
   * KPIs financeiros do profissional no período.
   * OWASP A01 — profissionalId do token, sem exposição de dados de outros profissionais.
   */
  async kpis(profissionalId: string, from: string, to: string, meta: { ip: string; userAgent: string }) {
    const period = buildPeriodFilter(from, to);

    const [realizadas, canceladas] = await Promise.all([
      prisma.consulta.aggregate({
        where: { profissionalId, status: 'PAGO', dataHora: period },
        _sum:   { valorCentavos: true },
        _count: { id: true },
      }),
      prisma.consulta.count({
        where: { profissionalId, status: 'ESTORNO', dataHora: period },
      }),
    ]);

    const totalConsultas = (realizadas._count.id ?? 0) + canceladas;
    const faturamentoCentavos = realizadas._sum.valorCentavos ?? 0;
    // Taxa da plataforma padrão = 10% (lucro do pro = 90%)
    const lucroLiquidoCentavos = Math.round(faturamentoCentavos * 0.90);
    const ticketMedioCentavos  = realizadas._count.id > 0
      ? Math.round(faturamentoCentavos / realizadas._count.id)
      : 0;
    const taxaCancelamento = totalConsultas > 0
      ? parseFloat(((canceladas / totalConsultas) * 100).toFixed(1))
      : 0;

    logger.info({
      event: 'relatorio_kpis_acessado',
      profissionalId,
      periodo: { from, to },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou o relatório de KPIs financeiros');

    return {
      periodo:              { from, to },
      faturamentoReais:     centavosParaReais(faturamentoCentavos),
      lucroLiquidoReais:    centavosParaReais(lucroLiquidoCentavos),
      ticketMedioReais:     centavosParaReais(ticketMedioCentavos),
      taxaCancelamentoPct:  taxaCancelamento,
      totalRealizadas:      realizadas._count.id ?? 0,
      totalCanceladas:      canceladas,
    };
  }

  /** Consultas de hoje — operação do dia */
  async dia(profissionalId: string, meta: { ip: string; userAgent: string }) {
    const hoje = new Date();
    const period = buildPeriodFilter(
      hoje.toISOString().slice(0, 10),
      hoje.toISOString().slice(0, 10),
    );

    const consultas = await prisma.consulta.findMany({
      where: { profissionalId, dataHora: period },
      select: {
        id: true, dataHora: true, especialidade: true, tipo: true,
        valorCentavos: true, status: true,
        cliente: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { dataHora: 'asc' },
    });

    const realizadas = consultas.filter(c => c.status === 'PAGO').length;
    const canceladas = consultas.filter(c => c.status === 'ESTORNO').length;

    logger.info({
      event: 'relatorio_dia_acessado',
      profissionalId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou a operação do dia');

    return {
      data: hoje.toISOString().slice(0, 10),
      total: consultas.length,
      realizadas,
      canceladas,
      taxaCancelamento: consultas.length > 0
        ? parseFloat(((canceladas / consultas.length) * 100).toFixed(1))
        : 0,
      consultas: consultas.map(c => ({
        id:            c.id,
        dataHora:      c.dataHora.toISOString(),
        especialidade: c.especialidade,
        modalidade:    c.tipo,
        valorReais:    centavosParaReais(c.valorCentavos),
        status:        c.status === 'PAGO' ? 'realizada' : c.status === 'ESTORNO' ? 'cancelada' : 'pendente',
        paciente:      { id: c.cliente.id, nome: c.cliente.name, avatarUrl: c.cliente.avatarUrl },
      })),
    };
  }

  /** Presencial vs. Online no período */
  async modalidade(profissionalId: string, from: string, to: string, meta: { ip: string; userAgent: string }) {
    const period = buildPeriodFilter(from, to);
    const where = { profissionalId, status: 'PAGO' as const, dataHora: period };

    const [online] = await Promise.all([
      prisma.consulta.aggregate({
        where: { ...where, tipo: 'ONLINE' },
        _count: { id: true },
        _sum: { valorCentavos: true },
      })
    ]);

    const totalCount = online._count.id ?? 0;

    logger.info({
      event: 'relatorio_modalidade_acessado',
      profissionalId,
      periodo: { from, to },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou o relatório de modalidade');

    return {
      presencial: {
        total:      0,
        faturamento: "0,00",
        pct:        0,
      },
      online: {
        total:      online._count.id ?? 0,
        faturamento: centavosParaReais(online._sum.valorCentavos ?? 0),
        pct:        totalCount > 0 ? parseFloat((((online._count.id ?? 0) / totalCount) * 100).toFixed(1)) : 0,
      },
    };
  }

  /** Faturamento por especialidade no período */
  async especialidade(profissionalId: string, from: string, to: string, meta: { ip: string; userAgent: string }) {
    const period = buildPeriodFilter(from, to);

    const grupos = await prisma.consulta.groupBy({
      by: ['especialidade'],
      where: { profissionalId, status: 'PAGO', dataHora: period },
      _sum:   { valorCentavos: true },
      _count: { id: true },
      orderBy: { _sum: { valorCentavos: 'desc' } },
    });

    logger.info({
      event: 'relatorio_especialidade_acessado',
      profissionalId,
      periodo: { from, to },
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, 'Profissional acessou o relatório de faturamento por especialidade');

    return grupos.map(g => ({
      especialidade:  g.especialidade,
      totalConsultas: g._count.id,
      faturamento:    centavosParaReais(g._sum.valorCentavos ?? 0),
    }));
  }
}
