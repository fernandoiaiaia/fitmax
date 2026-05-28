import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

/**
 * Verifica ownership da consulta e lança 404 se não pertencer ao cliente.
 * Retorna 404 (não 403) para não vazar a existência da consulta (OWASP A01).
 */
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

/**
 * Calcula o intervalo de datas baseado no período solicitado.
 */
function calcularIntervalo(periodo: string): { gte?: Date; lte?: Date } | undefined {
  const agora = new Date();
  if (periodo === 'semana') {
    const inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - 7);
    return { gte: inicio, lte: agora };
  }
  if (periodo === 'mes') {
    const inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - 30);
    return { gte: inicio, lte: agora };
  }
  if (periodo === 'ano') {
    const inicio = new Date(agora);
    inicio.setFullYear(inicio.getFullYear() - 1);
    return { gte: inicio, lte: agora };
  }
  return undefined; // 'tudo' — sem filtro
}

/**
 * Formata uma consulta para a resposta da API.
 * OWASP A05 — campos explícitos, nunca retorna password ou dados sensíveis.
 */
function formatConsulta(c: {
  id: string;
  especialidade: string;
  tipo: string;
  dataHora: Date;
  valorCentavos: number;
  status: string;
  createdAt: Date;
  profissional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    especialidade: string | null;
    cidade: string | null;
    uf: string | null;
  };
  avaliacao?: { nota: number; comentario: string | null } | null;
}) {
  // Determina o statusAvaliacao para a UI
  let statusAvaliacao: 'avaliado' | 'pendente' | 'nao_avaliavel';
  if (c.status !== 'PAGO') {
    statusAvaliacao = 'nao_avaliavel'; // só avalia consultas pagas
  } else if (c.avaliacao) {
    statusAvaliacao = 'avaliado';
  } else {
    statusAvaliacao = 'pendente';
  }

  return {
    id:              c.id,
    especialidade:   c.especialidade,
    modalidade:      c.tipo,
    dataHora:        c.dataHora.toISOString(),
    valorReais:      centavosParaReais(c.valorCentavos),
    status:          c.status,
    statusAvaliacao,
    nota:            c.avaliacao?.nota ?? null,
    comentario:      c.avaliacao?.comentario ?? null,
    criadoEm:        c.createdAt.toISOString(),
    profissional: {
      id:            c.profissional.id,
      nome:          c.profissional.name,
      avatarUrl:     c.profissional.avatarUrl,
      especialidade: c.profissional.especialidade,
      cidade:        c.profissional.cidade,
      uf:            c.profissional.uf,
    },
  };
}

const PROFISSIONAL_SELECT = {
  id:            true,
  name:          true,
  avatarUrl:     true,
  especialidade: true,
  cidade:        true,
  uf:            true,
} as const;

const AVALIACAO_SELECT = {
  nota:       true,
  comentario: true,
} as const;

const CONSULTA_FULL_SELECT = {
  id:            true,
  especialidade: true,
  tipo:          true,
  dataHora:      true,
  valorCentavos: true,
  status:        true,
  createdAt:     true,
  profissional:  { select: PROFISSIONAL_SELECT },
  avaliacao:     { select: AVALIACAO_SELECT },
} as const;

// ─── Schemas Zod (OWASP A03) ─────────────────────────────────────────────────

export const listarHistoricoSchema = z.object({
  // OWASP A03 — enum restrito: só aceita valores válidos de período
  periodo: z.enum(['tudo', 'semana', 'mes', 'ano']).default('tudo'),
  page:    z.coerce.number().int().min(1).default(1),
  // OWASP A04 — limite máximo fixo de 50
  limit:   z.coerce.number().int().min(1).max(50).default(20),
});

export const avaliarConsultaSchema = z.object({
  // OWASP A03 — nota restrita a inteiros 1-5
  nota:       z.number().int().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
  // OWASP A03 — comentário sanitizado e limitado
  comentario: z.string().max(500, 'Comentário máximo de 500 caracteres').trim().optional(),
});

// ─── Service ─────────────────────────────────────────────────────────────────

export class HistoricoClientService {

  /**
   * Lista as consultas realizadas do cliente com filtro de período e paginação.
   * OWASP A01 — WHERE clienteId = jwt.sub (anti-IDOR hardcoded)
   * OWASP A03 — inputs validados via Zod
   * OWASP A04 — limit máximo de 50
   * OWASP A05 — select explícito
   */
  async listar(clientId: string, input: z.infer<typeof listarHistoricoSchema>) {
    const { periodo, page, limit } = input;
    const skip = (page - 1) * limit;

    // OWASP A01 — clienteId SEMPRE fixado pelo JWT, nunca pelo caller
    const where: Record<string, unknown> = {
      clienteId: clientId,
      // OWASP A04 — histórico contém apenas consultas já realizadas (PAGO ou ESTORNO)
      status: { in: ['PAGO', 'ESTORNO'] },
    };

    const intervalo = calcularIntervalo(periodo);
    if (intervalo) where.dataHora = intervalo;

    const [data, total] = await Promise.all([
      prisma.consulta.findMany({
        where,
        select: CONSULTA_FULL_SELECT,
        orderBy: { dataHora: 'desc' },
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
   * Retorna as métricas do card de Resumo Geral da sidebar.
   * OWASP A01 — tudo agrupado por clientId do JWT.
   */
  async resumo(clientId: string) {
    // OWASP A01 — clienteId do JWT sempre
    const [grupos, pendentesAvaliacao] = await Promise.all([
      // Agrupa por status para calcular totais e gasto
      prisma.consulta.groupBy({
        by: ['status'],
        where: { clienteId: clientId },
        _sum:   { valorCentavos: true },
        _count: { id: true },
      }),
      // Consultas PAGO sem avaliação — pendentes de avaliação
      prisma.consulta.count({
        where: {
          clienteId: clientId,
          status:    'PAGO',
          avaliacao: null, // sem avaliação vinculada
        },
      }),
    ]);

    let totalConsultas   = 0;
    let totalCentavos    = 0;
    let avaliacoesFeitasCount = 0;

    for (const g of grupos) {
      if (g.status === 'PAGO' || g.status === 'ESTORNO') {
        totalConsultas += g._count.id;
      }
      if (g.status === 'PAGO') {
        totalCentavos += g._sum.valorCentavos ?? 0;
      }
    }

    // Conta avaliações já feitas pelo cliente
    avaliacoesFeitasCount = await prisma.avaliacaoConsulta.count({
      where: { clienteId: clientId },
    });

    return {
      totalConsultas,
      totalInvestidoReais:   centavosParaReais(totalCentavos),
      avaliacoesFeitasCount,
      pendentesAvaliacao,
    };
  }

  /**
   * Retorna as últimas 8 consultas para o widget de Linha do Tempo.
   * OWASP A01 — clienteId do JWT.
   * OWASP A04 — limite fixo de 8 no service, não configurável por query param.
   */
  async timeline(clientId: string) {
    // OWASP A04 — limite fixo de 8, hardcoded
    const TIMELINE_LIMIT = 8;

    const items = await prisma.consulta.findMany({
      where: {
        clienteId: clientId,
        status:    { in: ['PAGO', 'ESTORNO'] },
      },
      // OWASP A05 — select mínimo necessário para o widget
      select: {
        id:           true,
        especialidade: true,
        tipo:          true,
        dataHora:      true,
        profissional:  { select: { name: true, avatarUrl: true } },
      },
      orderBy: { dataHora: 'desc' },
      take:    TIMELINE_LIMIT,
    });

    return items.map(item => ({
      id:            item.id,
      especialidade: item.especialidade,
      modalidade:    item.tipo,
      dataHora:      item.dataHora.toISOString(),
      profissionalNome:   item.profissional.name,
      profissionalAvatar: item.profissional.avatarUrl,
    }));
  }

  /**
   * Retorna o detalhe completo de uma consulta do histórico.
   * OWASP A01 — verifica ownership antes de retornar qualquer dado.
   * OWASP A05 — select explícito, sem dados sensíveis.
   */
  async findById(consultaId: string, clientId: string) {
    // OWASP A01 — retorna 404 (não 403) para não vazar existência (anti-IDOR)
    await assertOwnership(consultaId, clientId);

    const consulta = await prisma.consulta.findUnique({
      where: { id: consultaId },
      // OWASP A05 — select explícito com campos expandidos para a tela de detalhe
      select: {
        id:             true,
        especialidade:  true,
        tipo:           true,
        dataHora:       true,
        valorCentavos:  true,
        taxaPlataforma: true,
        status:         true,
        estornoMotivo:  true,
        createdAt:      true,
        profissional: {
          select: {
            ...PROFISSIONAL_SELECT,
            telefone:             true,
            registroProfissional: true,
            username:             true,
          },
        },
        avaliacao: { select: AVALIACAO_SELECT },
      },
    });

    if (!consulta) throw new AppError('Consulta não encontrada', 404);

    // statusAvaliacao calculado
    let statusAvaliacao: 'avaliado' | 'pendente' | 'nao_avaliavel';
    if (consulta.status !== 'PAGO') {
      statusAvaliacao = 'nao_avaliavel';
    } else if (consulta.avaliacao) {
      statusAvaliacao = 'avaliado';
    } else {
      statusAvaliacao = 'pendente';
    }

    return {
      id:             consulta.id,
      especialidade:  consulta.especialidade,
      modalidade:     consulta.tipo,
      dataHora:       consulta.dataHora.toISOString(),
      valorReais:     centavosParaReais(consulta.valorCentavos),
      taxaPlataforma: consulta.taxaPlataforma,
      status:         consulta.status,
      statusAvaliacao,
      nota:           consulta.avaliacao?.nota ?? null,
      comentario:     consulta.avaliacao?.comentario ?? null,
      estornoMotivo:  consulta.estornoMotivo,
      criadoEm:       consulta.createdAt.toISOString(),
      profissional: {
        id:                   consulta.profissional.id,
        nome:                 consulta.profissional.name,
        avatarUrl:            consulta.profissional.avatarUrl,
        especialidade:        consulta.profissional.especialidade,
        cidade:               consulta.profissional.cidade,
        uf:                   consulta.profissional.uf,
        telefone:             consulta.profissional.telefone,
        registroProfissional: consulta.profissional.registroProfissional,
        username:             consulta.profissional.username,
      },
    };
  }

  /**
   * Cria ou atualiza a avaliação de uma consulta.
   * OWASP A01 — verifica ownership antes de escrever
   * OWASP A03 — nota (1-5) e comentário (max 500) validados via Zod
   * OWASP A04 — só permite avaliar consultas com status PAGO
   * OWASP A08 — upsert garante idempotência (uma avaliação por consulta)
   * OWASP A09 — log de auditoria com ip e userAgent
   */
  async avaliar(
    consultaId: string,
    clientId: string,
    input: z.infer<typeof avaliarConsultaSchema>,
    meta: { ip: string; userAgent: string },
  ) {
    // OWASP A01 — verifica que a consulta pertence ao cliente (lança 404 se não)
    const consulta = await assertOwnership(consultaId, clientId);

    // OWASP A04 — regra de negócio: só avalia consulta PAGO
    if (consulta.status !== 'PAGO') {
      throw new AppError('Apenas consultas concluídas (PAGO) podem ser avaliadas', 422);
    }

    // OWASP A08 — upsert: idempotente, permite atualizar avaliação existente
    const avaliacao = await prisma.avaliacaoConsulta.upsert({
      where:  { consultaId },
      update: { nota: input.nota, comentario: input.comentario ?? null },
      create: {
        consultaId,
        // OWASP A01 — clienteId sempre do JWT, nunca do body
        clienteId: clientId,
        nota:      input.nota,
        comentario: input.comentario ?? null,
      },
      select: {
        id:          true,
        nota:        true,
        comentario:  true,
        criadoEm:   true,
        atualizadoEm: true,
      },
    });

    // OWASP A09 — audit log de operação de escrita
    logger.info({
      event:      'avaliacao_criada',
      clientId,
      consultaId,
      nota:       input.nota,
      ip:         meta.ip,
      userAgent:  meta.userAgent,
    }, `⭐ Avaliação ${avaliacao.id} criada/atualizada: cliente ${clientId} → consulta ${consultaId} (nota: ${input.nota})`);

    return avaliacao;
  }
}
