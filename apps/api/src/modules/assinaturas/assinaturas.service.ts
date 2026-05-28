import { prisma } from '@fitmax/database';
import { logger } from '../../lib/logger';
import { AppError } from '../../middlewares/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanoPeriodo  = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type PlanoAudiencia = 'CLIENTE' | 'PROFISSIONAL';

export interface CriarPlanoDTO {
  nome: string;
  tipo: PlanoPeriodo;
  audiencia: PlanoAudiencia;
  valorCentavos: number;
  consultas: number;
  taxa: number;
  adminId: string;
  ip: string;
  userAgent: string;
}

export interface EditarPlanoDTO {
  nome?: string;
  tipo?: PlanoPeriodo;
  valorCentavos?: number;
  consultas?: number;
  taxa?: number;
  adminId: string;
  ip: string;
  userAgent: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte centavos para número float em reais (ex: 14000 → 140.00) */
function centavosParaReais(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

function formatPlano(p: {
  id: string;
  nome: string;
  tipo: string;
  audiencia: string;
  valorCentavos: number;
  consultas: number;
  taxa: number;
  ativo: boolean;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:            p.id,
    nome:          p.nome,
    tipo:          p.tipo as PlanoPeriodo,
    audiencia:     p.audiencia as PlanoAudiencia,
    valor:         centavosParaReais(p.valorCentavos),
    valorCentavos: p.valorCentavos,
    consultas:     p.consultas,
    taxa:          p.taxa,
    ativo:         p.ativo,
    createdAt:     p.createdAt.toISOString(),
    updatedAt:     p.updatedAt.toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class AssinaturasService {

  /**
   * Lista planos filtrados por audiência com estatísticas.
   * OWASP A03 — queries parametrizadas via Prisma ORM.
   */
  async list(audiencia?: PlanoAudiencia) {
    const where = audiencia ? { audiencia: audiencia as any } : {};

    const planos = await prisma.plano.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { createdAt: 'asc' }],
    });

    const formatted = planos.map(formatPlano);

    const total    = formatted.length;
    const ativos   = formatted.filter(p => p.ativo).length;
    const inativos = total - ativos;
    const receitaPotencialCentavos = formatted
      .filter(p => p.ativo)
      .reduce((acc, p) => acc + p.valorCentavos, 0);

    return {
      planos: formatted,
      stats: {
        total,
        ativos,
        inativos,
        receitaPotencial: centavosParaReais(receitaPotencialCentavos),
      },
    };
  }

  /**
   * Cria um novo plano de assinatura.
   * OWASP A09 — audit log com adminId, ip e userAgent.
   */
  async criar(dto: CriarPlanoDTO) {
    const { nome, tipo, audiencia, valorCentavos, consultas, taxa, adminId, ip, userAgent } = dto;

    // Verifica duplicidade de nome por audiência (mesmo nome pode existir para audiências diferentes)
    const existente = await prisma.plano.findFirst({
      where: {
        nome:      { equals: nome, mode: 'insensitive' },
        audiencia: audiencia as any,
      },
    });

    if (existente) {
      throw new AppError(`Já existe um plano de ${audiencia === 'CLIENTE' ? 'clientes' : 'profissionais'} com o nome "${nome}"`, 409);
    }

    const plano = await prisma.plano.create({
      data: {
        nome,
        tipo:      tipo as any,
        audiencia: audiencia as any,
        valorCentavos,
        consultas,
        taxa,
        criadoPorId: adminId,
      },
    });

    logger.info(
      { event: 'plano_criado', planoId: plano.id, nome, audiencia, adminId, ip, userAgent },
      `✅ Plano "${nome}" (${audiencia}) criado pelo admin ${adminId}`
    );

    return formatPlano(plano);
  }

  /**
   * Alterna o status ativo/inativo de um plano.
   * OWASP A09 — audit log.
   */
  async toggle(id: string, adminId: string, ip: string, userAgent: string) {
    const plano = await prisma.plano.findUnique({ where: { id } });

    if (!plano) {
      throw new AppError('Plano não encontrado', 404);
    }

    const novoStatus = !plano.ativo;

    const atualizado = await prisma.plano.update({
      where: { id },
      data: { ativo: novoStatus },
    });

    logger.info(
      {
        event: 'plano_toggle',
        planoId: id,
        nome: plano.nome,
        ativo: novoStatus,
        adminId,
        ip,
        userAgent,
      },
      `🔄 Plano "${plano.nome}" ${novoStatus ? 'ativado' : 'desativado'} pelo admin ${adminId}`
    );

    return formatPlano(atualizado);
  }

  /**
   * Edita os dados de um plano existente (partial update).
   * OWASP A09 — audit log.
   */
  async editar(id: string, dto: EditarPlanoDTO) {
    const { adminId, ip, userAgent, ...campos } = dto;

    const plano = await prisma.plano.findUnique({ where: { id } });

    if (!plano) {
      throw new AppError('Plano não encontrado', 404);
    }

    // Verifica duplicidade de nome se for alterar (case-insensitive)
    if (campos.nome && campos.nome.toLowerCase() !== plano.nome.toLowerCase()) {
      const existente = await prisma.plano.findFirst({
        where: {
          nome: { equals: campos.nome, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existente) {
        throw new AppError(`Já existe um plano com o nome "${campos.nome}"`, 409);
      }
    }

    const atualizado = await prisma.plano.update({
      where: { id },
      data: {
        ...(campos.nome          !== undefined && { nome: campos.nome }),
        ...(campos.tipo          !== undefined && { tipo: campos.tipo as any }), // eslint-disable-line
        ...(campos.valorCentavos !== undefined && { valorCentavos: campos.valorCentavos }),
        ...(campos.consultas     !== undefined && { consultas: campos.consultas }),
        ...(campos.taxa          !== undefined && { taxa: campos.taxa }),
      },
    });

    logger.info(
      { event: 'plano_editado', planoId: id, campos, adminId, ip, userAgent },
      `✏️  Plano "${plano.nome}" editado pelo admin ${adminId}`
    );

    return formatPlano(atualizado);
  }

  /**
   * Exclui permanentemente um plano.
   * OWASP A09 — audit log com WARN antes da operação irreversível.
   */
  async excluir(id: string, adminId: string, ip: string, userAgent: string) {
    const plano = await prisma.plano.findUnique({ where: { id } });

    if (!plano) {
      throw new AppError('Plano não encontrado', 404);
    }

    // OWASP A09 — Loga ANTES de deletar (garante trilha mesmo se o delete falhar)
    logger.warn(
      { event: 'plano_exclusao_iniciada', planoId: id, nome: plano.nome, adminId, ip, userAgent },
      `⚠️  Exclusão do plano "${plano.nome}" iniciada pelo admin ${adminId}`
    );

    await prisma.plano.delete({ where: { id } });

    logger.warn(
      { event: 'plano_excluido', planoId: id, nome: plano.nome, adminId, ip, userAgent },
      `🗑️  Plano "${plano.nome}" excluído permanentemente pelo admin ${adminId}`
    );

    return { deleted: true, id, nome: plano.nome };
  }
}
