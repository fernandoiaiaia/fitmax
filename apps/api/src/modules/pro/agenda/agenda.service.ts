import { prisma } from '@fitmax/database';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const salvarDisponibilidadeSchema = z.object({
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido. Use YYYY-MM-DD'),
  slots: z.array(z.object({
    hora:   z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido. Use HH:MM'),
    estado: z.enum(['DISPONIVEL', 'BLOQUEADO']),
  })).min(1).max(48), // máx 48 slots por dia (a cada 30min)
});

export const recorrenciaSchema = z.object({
  diasSemana: z.array(z.number().int().min(0).max(6)).min(1), // 0=Dom, 6=Sáb
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim:    z.string().regex(/^\d{2}:\d{2}$/),
  duracaoMin: z.number().int().min(15).max(120), // em minutos
  mes:        z.number().int().min(1).max(12),
  ano:        z.number().int().min(2024),
});

export type SalvarDisponibilidadeDTO = z.infer<typeof salvarDisponibilidadeSchema>;
export type RecorrenciaDTO = z.infer<typeof recorrenciaSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_PRO_MAP: Record<string, string> = {
  PENDENTE: 'pendente',
  PAGO:     'confirmada',
  ESTORNO:  'cancelada',
};

function gerarHorarios(inicio: string, fim: string, duracaoMin: number): string[] {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fim.split(':').map(Number);
  const totalMinI = hI * 60 + mI;
  const totalMinF = hF * 60 + mF;
  const slots: string[] = [];
  for (let m = totalMinI; m < totalMinF; m += duracaoMin) {
    const h   = Math.floor(m / 60).toString().padStart(2, '0');
    const min = (m % 60).toString().padStart(2, '0');
    slots.push(`${h}:${min}`);
  }
  return slots;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class AgendaProService {

  /**
   * Retorna os slots do dia cruzando Disponibilidade + Consulta.
   * OWASP A01 — filtrado por profissionalId do token.
   */
  async getDia(profissionalId: string, dia: string, meta: { ip: string; userAgent: string }) {
    const [slots, consultas] = await Promise.all([
      prisma.disponibilidade.findMany({
        where: { profissionalId, dia },
        orderBy: { hora: 'asc' },
      }),
      prisma.consulta.findMany({
        where: {
          profissionalId,
          dataHora: {
            gte: new Date(`${dia}T00:00:00`),
            lte: new Date(`${dia}T23:59:59`),
          },
        },
        select: {
          id: true, dataHora: true, especialidade: true, tipo: true, status: true,
          cliente: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ]);

    // Indexa consultas por hora "HH:MM"
    const consultasPorHora = new Map<string, typeof consultas[0]>();
    for (const c of consultas) {
      const hora = c.dataHora.toISOString().slice(11, 16); // "HH:MM" UTC
      consultasPorHora.set(hora, c);
    }

    const res = slots.map(slot => {
      const consulta = consultasPorHora.get(slot.hora);
      return {
        hora:   slot.hora,
        estado: consulta ? 'agendado' : slot.estado.toLowerCase(),
        consulta: consulta ? {
          id:            consulta.id,
          especialidade: consulta.especialidade,
          modalidade:    consulta.tipo,
          status:        STATUS_PRO_MAP[consulta.status] ?? consulta.status,
          paciente: {
            id:        consulta.cliente.id,
            nome:      consulta.cliente.name,
            avatarUrl: consulta.cliente.avatarUrl,
          },
        } : null,
      };
    });

    logger.info({
      event: 'agenda_dia_acessada',
      profissionalId,
      dia,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Profissional acessou a agenda do dia ${dia} (PHI)`);

    return res;
  }

  /**
   * Mapa mensal — quais dias têm consulta ou disponibilidade.
   * Usado para colorir o calendário no front.
   */
  async getMes(profissionalId: string, ano: number, mes: number, meta: { ip: string; userAgent: string }) {
    const inicio = new Date(ano, mes - 1, 1);
    const fim    = new Date(ano, mes, 1);

    const [diasComDisponibilidade, diasComConsulta] = await Promise.all([
      // Dias distintos com slots disponíveis
      prisma.disponibilidade.findMany({
        where: {
          profissionalId,
          dia:   { gte: inicio.toISOString().slice(0, 10), lt: fim.toISOString().slice(0, 10) },
          estado: 'DISPONIVEL',
        },
        select: { dia: true },
        distinct: ['dia'],
      }),

      // Dias distintos com consultas
      prisma.consulta.findMany({
        where: {
          profissionalId,
          dataHora: { gte: inicio, lt: fim },
        },
        select: { dataHora: true },
      }),
    ]);

    const comDisponibilidade = new Set(diasComDisponibilidade.map(d => d.dia));
    const comConsulta = new Set(diasComConsulta.map(c => c.dataHora.toISOString().slice(0, 10)));

    const res = {
      ano,
      mes,
      dias: Array.from({ length: new Date(ano, mes, 0).getDate() }, (_, i) => {
        const dia = `${ano}-${String(mes).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        return {
          dia,
          temConsulta:      comConsulta.has(dia),
          temDisponibilidade: comDisponibilidade.has(dia),
        };
      }),
    };

    logger.info({
      event: 'agenda_mes_acessada',
      profissionalId,
      ano, mes,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Profissional acessou a visão mensal da agenda (${mes}/${ano})`);

    return res;
  }

  /**
   * Salva/upsert os slots de disponibilidade de um dia inteiro.
   * OWASP A08 — operação atômica em transação.
   * OWASP A09 — audit log.
   */
  async salvarDisponibilidade(
    profissionalId: string,
    dto: SalvarDisponibilidadeDTO,
    meta: { ip: string; userAgent: string },
  ) {
    const { dia, slots } = dto;

    // Transação: apaga os slots do dia e insere os novos
    await prisma.$transaction(async (tx) => {
      // Apaga apenas slots sem consulta associada
      await tx.disponibilidade.deleteMany({
        where: { profissionalId, dia },
      });

      await tx.disponibilidade.createMany({
        data: slots.map(s => ({
          profissionalId,
          dia,
          hora:   s.hora,
          estado: s.estado,
        })),
        skipDuplicates: true,
      });
    });

    // OWASP A09 — audit log
    logger.info({
      event: 'disponibilidade_salva',
      profissionalId,
      dia,
      totalSlots: slots.length,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Disponibilidade do dia ${dia} salva: ${slots.length} slots`);

    return { dia, totalSlots: slots.length };
  }

  /**
   * Aplica horário recorrente semanal para todos os dias do mês.
   * OWASP A08 — transação única para todo o mês.
   */
  async aplicarRecorrencia(
    profissionalId: string,
    dto: RecorrenciaDTO,
    meta: { ip: string; userAgent: string },
  ) {
    const { diasSemana, horaInicio, horaFim, duracaoMin, mes, ano } = dto;
    const horarios = gerarHorarios(horaInicio, horaFim, duracaoMin);

    const inicio = new Date(ano, mes - 1, 1);
    const fim    = new Date(ano, mes, 0); // último dia do mês

    // Coleta todos os dias do mês que batem com os diasSemana selecionados
    const diasAlvo: { profissionalId: string; dia: string; hora: string; estado: 'DISPONIVEL' }[] = [];

    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      if (diasSemana.includes(d.getDay())) {
        const diaStr = d.toISOString().slice(0, 10);
        for (const hora of horarios) {
          diasAlvo.push({ profissionalId, dia: diaStr, hora, estado: 'DISPONIVEL' });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Remove slots existentes do mês para não duplicar
      const diasStr = diasAlvo.map(d => d.dia);
      if (diasStr.length > 0) {
        await tx.disponibilidade.deleteMany({
          where: { profissionalId, dia: { in: [...new Set(diasStr)] } },
        });
      }
      await tx.disponibilidade.createMany({ data: diasAlvo, skipDuplicates: true });
    });

    logger.info({
      event: 'recorrencia_aplicada',
      profissionalId,
      mes, ano, diasSemana, horaInicio, horaFim, duracaoMin,
      totalSlots: diasAlvo.length,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Recorrência aplicada: ${diasAlvo.length} slots no mês ${mes}/${ano}`);

    return { mes, ano, totalSlotsCriados: diasAlvo.length };
  }

  /**
   * Atualiza o status de uma consulta da agenda.
   * OWASP A01 — garante que a consulta pertence ao profissionalId do token.
   * OWASP A09 — registra log de alteração de status.
   */
  async atualizarStatusConsulta(
    profissionalId: string,
    consultaId: string,
    statusFrontend: string,
    meta: { ip: string; userAgent: string },
  ) {
    const consulta = await prisma.consulta.findFirst({
      where: { id: consultaId, profissionalId },
    });

    if (!consulta) {
      logger.warn({
        event: 'tentativa_acesso_indevido',
        profissionalId,
        consultaId,
        ip: meta.ip,
        userAgent: meta.userAgent,
      }, 'Tentativa de alterar status de consulta de outro profissional (OWASP A01 bloqueado)');
      throw new Error('Consulta não encontrada ou acesso negado.');
    }

    // Mapeamento inverso do frontend para o DB
    let dbStatus: 'PENDENTE' | 'PAGO' | 'ESTORNO' = 'PENDENTE';
    if (statusFrontend === 'confirmada') dbStatus = 'PAGO';
    if (statusFrontend === 'cancelada') dbStatus = 'ESTORNO';

    await prisma.consulta.update({
      where: { id: consultaId },
      data: { status: dbStatus },
    });

    logger.info({
      event: 'status_consulta_alterado',
      profissionalId,
      consultaId,
      statusAnterior: consulta.status,
      novoStatus: statusFrontend,
      statusDB: dbStatus,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Status da consulta ${consultaId} alterado para ${statusFrontend}`);

    return { sucesso: true, novoStatus: statusFrontend };
  }
}
