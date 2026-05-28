import { prisma } from '@fitmax/database';
import { ConsultaStatus } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// ─── Status Map ──────────────────────────────────────────────────────────────

/** Mapeia o status financeiro do banco para a visão do profissional */
export const STATUS_PRO_MAP: Record<string, string> = {
  PENDENTE: 'agendada',
  PAGO:     'concluida',
  ESTORNO:  'cancelada',
};

/** Status aceitáveis para atualização pelo profissional */
export const statusProSchema = z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']);
export type StatusPro = z.infer<typeof statusProSchema>;

/** Mapa reverso: visão do profissional → status financeiro DB */
const STATUS_DB_MAP: Record<StatusPro, ConsultaStatus> = {
  agendada:     ConsultaStatus.PENDENTE,
  em_andamento: ConsultaStatus.PENDENTE, // ainda pendente financeiramente
  concluida:    ConsultaStatus.PAGO,
  cancelada:    ConsultaStatus.ESTORNO,
};

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface ListConsultasProFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: StatusPro;
  page: number;
  limit: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centavosParaReais(v: number) {
  return (v / 100).toFixed(2);
}

function formatConsultaPro(c: {
  id: string; especialidade: string; tipo: string; dataHora: Date;
  valorCentavos: number; status: string;
  cliente: { id: string; name: string; avatarUrl: string | null };
}) {
  return {
    id:            c.id,
    especialidade: c.especialidade,
    modalidade:    c.tipo,
    dataHora:      c.dataHora.toISOString(),
    valorReais:    centavosParaReais(c.valorCentavos),
    status:        STATUS_PRO_MAP[c.status] ?? c.status,
    paciente: {
      id:        c.cliente.id,
      nome:      c.cliente.name,
      avatarUrl: c.cliente.avatarUrl,
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ConsultasProService {

  /** Lista paginada das consultas do profissional — OWASP A01: filtrado por profissionalId do token */
  async list(profissionalId: string, filters: ListConsultasProFilters) {
    const { page, limit, dateFrom, dateTo, status } = filters;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { profissionalId };

    if (status) where.status = STATUS_DB_MAP[status];

    if (dateFrom || dateTo) {
      where.dataHora = {};
      if (dateFrom) where.dataHora.gte = new Date(`${dateFrom}T00:00:00`);
      if (dateTo)   where.dataHora.lte = new Date(`${dateTo}T23:59:59`);
    }

    const [data, total] = await Promise.all([
      prisma.consulta.findMany({
        where,
        select: {
          id: true, especialidade: true, tipo: true,
          dataHora: true, valorCentavos: true, status: true,
          cliente: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { dataHora: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consulta.count({ where }),
    ]);

    return {
      data: data.map(formatConsultaPro),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** KPIs de consultas do profissional */
  async summary(profissionalId: string, dateFrom?: string, dateTo?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { profissionalId };
    if (dateFrom || dateTo) {
      where.dataHora = {};
      if (dateFrom) where.dataHora.gte = new Date(`${dateFrom}T00:00:00`);
      if (dateTo)   where.dataHora.lte = new Date(`${dateTo}T23:59:59`);
    }

    const grupos = await prisma.consulta.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const counts = { agendada: 0, concluida: 0, cancelada: 0, total: 0 };
    for (const g of grupos) {
      const key = STATUS_PRO_MAP[g.status] as keyof typeof counts | undefined;
      if (key && key !== 'total') counts[key] += g._count.id;
      counts.total += g._count.id;
    }

    return counts;
  }

  /** Detalhe de uma consulta — valida ownership (OWASP A01) */
  async findById(profissionalId: string, id: string) {
    const c = await prisma.consulta.findFirst({
      where: { id, profissionalId }, // dupla verificação de ownership
      select: {
        id: true, especialidade: true, tipo: true, dataHora: true,
        valorCentavos: true, taxaPlataforma: true, status: true,
        estornoMotivo: true, createdAt: true,
        cliente: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });

    if (!c) return null;

    return {
      ...formatConsultaPro(c),
      taxaPlataforma:   c.taxaPlataforma,
      estornoMotivo:    c.estornoMotivo,
      criadoEm:         c.createdAt.toISOString(),
      paciente:         { ...c.cliente, nome: c.cliente.name },
    };
  }

  /**
   * Atualiza status de uma consulta pelo profissional.
   * OWASP A01 — verifica ownership antes de qualquer escrita.
   * OWASP A09 — audit log de toda mudança de status.
   */
  async updateStatus(
    profissionalId: string,
    id: string,
    novoStatus: StatusPro,
    meta: { ip: string; userAgent: string },
  ) {
    // 1. Verifica ownership
    const consulta = await prisma.consulta.findFirst({
      where: { id, profissionalId },
      select: { id: true, status: true },
    });

    if (!consulta) {
      throw Object.assign(new Error('Consulta não encontrada'), { statusCode: 404 });
    }

    const dbStatus = STATUS_DB_MAP[novoStatus];
    const statusAnterior = STATUS_PRO_MAP[consulta.status] ?? consulta.status;

    // Regras de transição permitidas
    const allowed: Record<string, string[]> = {
      agendada:     ['em_andamento', 'cancelada'],
      em_andamento: ['concluida', 'cancelada'],
      concluida:    [],
      cancelada:    [],
    };

    if (!allowed[statusAnterior]?.includes(novoStatus)) {
      throw Object.assign(
        new Error(`Transição inválida: ${statusAnterior} → ${novoStatus}`),
        { statusCode: 422 },
      );
    }

    const atualizada = await prisma.consulta.update({
      where: { id },
      data: { status: dbStatus },
      select: { id: true, status: true },
    });

    // OWASP A09 — audit log
    logger.info({
      event: 'consulta_status_atualizado_pro',
      profissionalId,
      consultaId: id,
      statusAnterior,
      novoStatus,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Consulta ${id}: ${statusAnterior} → ${novoStatus}`);

    return {
      id:     atualizada.id,
      status: STATUS_PRO_MAP[atualizada.status] ?? atualizada.status,
    };
  }

  /**
   * KPIs do período com comparação vs período anterior.
   * OWASP A01 — profissionalId do JWT.
   */
  async resumoPeriodo(profissionalId: string, dateFrom: string, dateTo: string) {
    const from = new Date(`${dateFrom}T00:00:00`);
    const to   = new Date(`${dateTo}T23:59:59`);

    // Calcula o período anterior de mesmo tamanho
    const diffMs    = to.getTime() - from.getTime();
    const prevTo    = new Date(from.getTime() - 1);
    const prevFrom  = new Date(prevTo.getTime() - diffMs);

    const [atual, anterior] = await Promise.all([
      prisma.consulta.aggregate({
        where: { profissionalId, dataHora: { gte: from, lte: to } },
        _count: { id: true },
        _sum:   { valorCentavos: true },
      }),
      prisma.consulta.aggregate({
        where: { profissionalId, dataHora: { gte: prevFrom, lte: prevTo } },
        _count: { id: true },
        _sum:   { valorCentavos: true },
      }),
    ]);

    const agora   = atual._count.id ?? 0;
    const antAg   = anterior._count.id ?? 0;
    const agoraVal = atual._sum.valorCentavos ?? 0;
    const antVal   = anterior._sum.valorCentavos ?? 0;

    const variacaoPctAg  = antAg > 0   ? parseFloat((((agora   - antAg)   / antAg)   * 100).toFixed(1)) : null;
    const variacaoPctVal = antVal > 0  ? parseFloat((((agoraVal - antVal)  / antVal)  * 100).toFixed(1)) : null;

    return {
      agendamentos:            agora,
      valorGeradoReais:        centavosParaReais(agoraVal),
      tempoMedioMinutos:       null,  // campo não existe no schema — future iteration
      periodoAnterior: {
        agendamentos:     antAg,
        valorGeradoReais: centavosParaReais(antVal),
      },
      variacaoPctAgendamentos: variacaoPctAg,
      variacaoPctValor:        variacaoPctVal,
    };
  }

  /**
   * Reagenda uma consulta para nova data/hora.
   * OWASP A01 — ownership check antes de qualquer escrita.
   * OWASP A08 — só consultas PENDENTE podem ser reagendadas.
   * OWASP A09 — audit log.
   */
  async reagendar(
    profissionalId: string,
    id: string,
    novaDataHora: Date,
    meta: { ip: string; userAgent: string },
  ) {
    // 1. Ownership
    const consulta = await prisma.consulta.findFirst({
      where: { id, profissionalId },
      select: { id: true, status: true, dataHora: true },
    });

    if (!consulta) {
      throw Object.assign(new Error('Consulta não encontrada'), { statusCode: 404 });
    }

    // 2. Só agendadas (PENDENTE) podem ser reagendadas
    if (consulta.status !== 'PENDENTE') {
      throw Object.assign(
        new Error('Apenas consultas agendadas podem ser reagendadas'),
        { statusCode: 422 },
      );
    }

    // 3. Nova data deve ser futura
    if (novaDataHora <= new Date()) {
      throw Object.assign(
        new Error('A nova data deve ser no futuro'),
        { statusCode: 422 },
      );
    }

    const atualizada = await prisma.consulta.update({
      where: { id },
      data: { dataHora: novaDataHora },
      select: { id: true, dataHora: true, status: true },
    });

    // OWASP A09 — audit log
    logger.info({
      event: 'consulta_reagendada',
      profissionalId,
      consultaId: id,
      dataAnterior: consulta.dataHora.toISOString(),
      novaDataHora: novaDataHora.toISOString(),
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Consulta ${id} reagendada para ${novaDataHora.toISOString()}`);

    return {
      id:        atualizada.id,
      dataHora:  atualizada.dataHora.toISOString(),
      status:    STATUS_PRO_MAP[atualizada.status] ?? atualizada.status,
    };
  }
}
