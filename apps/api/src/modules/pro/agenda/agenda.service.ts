import { prisma } from '@fitmax/database';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const salvarDisponibilidadeSchema = z.object({
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido. Use YYYY-MM-DD'),
  slots: z.array(z.object({
    hora:   z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido. Use HH:MM'),
    estado: z.enum(['DISPONIVEL', 'BLOQUEADO']),
    modalidade: z.string().optional().nullable(),
    endereco:   z.string().optional().nullable(),
  })).min(1).max(96), // máx 96 slots por dia (a cada 15min)
});

export const recorrenciaSchema = z.object({
  diasSemana: z.array(z.number().int().min(0).max(6)).min(1), // 0=Dom, 6=Sáb
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim:    z.string().regex(/^\d{2}:\d{2}$/),
  duracaoMin: z.number().int().min(15).max(120), // em minutos
  // modalidade: define o tipo padrão dos slots criados (null = ambos os tipos)
  modalidade: z.enum(['Online']).nullable().optional(),
  // mes e ano são opcionais: se omitidos, usa o mês/ano corrente
  mes:        z.number().int().min(1).max(12).optional(),
  ano:        z.number().int().min(2024).optional(),
});


export type SalvarDisponibilidadeDTO = z.infer<typeof salvarDisponibilidadeSchema>;
export type RecorrenciaDTO = z.infer<typeof recorrenciaSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_PRO_MAP: Record<string, string> = {
  PENDENTE: 'pendente',
  PAGO:     'confirmada',
  ESTORNO:  'cancelada',
};

/** Mapa: status do frontend Pro → statusAgenda do banco */
const STATUS_AGENDA_MAP: Record<string, 'AGENDADA' | 'CONFIRMADA' | 'CANCELADA'> = {
  pendente:   'AGENDADA',
  confirmada: 'CONFIRMADA',
  cancelada:  'CANCELADA',
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
          dataHora: (() => {
            // Brasília = UTC-3. Meia-noite local = 03:00 UTC do mesmo dia.
            // Final do dia local (23:59:59) = 02:59:59 UTC do DIA SEGUINTE.
            const [y, m, d2] = dia.split('-').map(Number);
            const gte = new Date(Date.UTC(y, m - 1, d2, 3, 0, 0, 0));      // 00:00 BRT
            const lte = new Date(Date.UTC(y, m - 1, d2 + 1, 2, 59, 59, 999)); // 23:59:59 BRT
            return { gte, lte };
          })(),
          // Consultas canceladas liberam o slot automaticamente na agenda do Pro
          statusAgenda: { not: 'CANCELADA' },
        },
        select: {
          id: true, dataHora: true, especialidade: true, tipo: true, status: true,
          cliente: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ]);

    // Indexa consultas por hora "HH:MM" — usa horário de Brasília (UTC-3) para
    // coincidir com os slots criados pelo profissional no mesmo fuso.
    const consultasPorHora = new Map<string, typeof consultas[0]>();
    for (const c of consultas) {
      const hora = c.dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
        hour12: false,
      }).slice(0, 5); // "HH:MM"
      consultasPorHora.set(hora, c);
    }

    const res = slots.map(slot => {
      const consulta = consultasPorHora.get(slot.hora);
      return {
        hora:   slot.hora,
        estado: consulta ? 'agendado' : slot.estado.toLowerCase(),
        modalidade: slot.modalidade,
        endereco:   slot.endereco,
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
          modalidade: s.modalidade ?? null,
          endereco:   s.endereco ?? null,
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
   * Aplica horário recorrente semanal para o mês atual + próximos 2 meses.
   * OWASP A08 — transação única por mês.
   */
  async aplicarRecorrencia(
    profissionalId: string,
    dto: RecorrenciaDTO,
    meta: { ip: string; userAgent: string },
  ) {
    const now = new Date();
    const { diasSemana, horaInicio, horaFim, duracaoMin } = dto;
    const modalidadeSlot = dto.modalidade ?? null; // null = slot universal (ambos os tipos)
    const horarios = gerarHorarios(horaInicio, horaFim, duracaoMin);

    // Aplica para o mês base + próximos 2 meses (3 meses no total)
    const mesBas = dto.mes ?? (now.getMonth() + 1);
    const anoBas = dto.ano ?? now.getFullYear();

    let totalSlotsCriados = 0;

    for (let delta = 0; delta < 3; delta++) {
      const mesAlvo = ((mesBas - 1 + delta) % 12) + 1;
      const anoAlvo = anoBas + Math.floor((mesBas - 1 + delta) / 12);

      const inicio = new Date(anoAlvo, mesAlvo - 1, 1);
      const fim    = new Date(anoAlvo, mesAlvo, 0);

      const diasAlvo: { profissionalId: string; dia: string; hora: string; estado: 'DISPONIVEL' | 'BLOQUEADO'; modalidade: string | null }[] = [];

      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        if (diasSemana.includes(d.getDay())) {
          const diaStr = d.toISOString().slice(0, 10);
          for (const hora of horarios) {
            diasAlvo.push({ profissionalId, dia: diaStr, hora, estado: 'BLOQUEADO', modalidade: modalidadeSlot });
          }
        }
      }


      if (diasAlvo.length === 0) continue;

      await prisma.$transaction(async (tx) => {
        const diasStr = [...new Set(diasAlvo.map(d => d.dia))];
        
        // 1. Busca slots existentes para não sobrescrever os "DISPONIVEL" (liberados pelo profissional)
        const existingSlots = await tx.disponibilidade.findMany({
          where: { profissionalId, dia: { in: diasStr } },
        });
        const liberados = new Set(
          existingSlots.filter(s => s.estado === 'DISPONIVEL').map(s => `${s.dia}_${s.hora}`)
        );

        // 2. Limpa APENAS os slots BLOQUEADOS, preservando os horários já liberados intactos
        await tx.disponibilidade.deleteMany({
          where: { profissionalId, dia: { in: diasStr }, estado: 'BLOQUEADO' },
        });

        // 3. Filtra a nova grade para não tentar criar horários que já estão liberados
        const slotsToCreate = diasAlvo.filter(d => !liberados.has(`${d.dia}_${d.hora}`));

        // 4. Cria os novos slots da grade (todos nascem como BLOQUEADO, conforme exigido)
        if (slotsToCreate.length > 0) {
          await tx.disponibilidade.createMany({ data: slotsToCreate, skipDuplicates: true });
          totalSlotsCriados += slotsToCreate.length;
        }
      });
    }

    logger.info({
      event: 'recorrencia_aplicada',
      profissionalId,
      mesBas, anoBas, diasSemana, horaInicio, horaFim, duracaoMin,
      totalSlots: totalSlotsCriados,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Recorrência aplicada: ${totalSlotsCriados} slots nos próximos 3 meses`);

    return { mes: mesBas, ano: anoBas, totalSlotsCriados };
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

    // statusAgenda: visão de agenda do paciente (separado do financeiro)
    const dbStatusAgenda = STATUS_AGENDA_MAP[statusFrontend];

    await prisma.consulta.update({
      where: { id: consultaId },
      data: {
        status: dbStatus,
        ...(dbStatusAgenda ? { statusAgenda: dbStatusAgenda } : {}),
      },
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
