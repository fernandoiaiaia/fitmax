import { prisma } from '@fitmax/database';
import { logger } from '../../lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListPublicacoesFilters {
  search?: string;
  status?: 'ATIVA' | 'DENUNCIADA' | 'BANIDA';
  page: number;
  limit: number;
}

export interface ModerarDTO {
  id: string;
  adminId: string;
  ip: string;
  userAgent: string;
}

export interface BanirDTO extends ModerarDTO {
  motivo?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INCLUDE_PROF = {
  profissional: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      especialidade: true,
      registroProfissional: true,
    },
  },
};

function formatPublicacao(p: {
  id: string;
  topico: string;
  caption: string;
  imagemUrl: string;
  aspectRatio: number;
  likes: number;
  comentarios: number;
  status: string;
  motivoBan: string | null;
  moderadoEm: Date | null;
  createdAt: Date;
  profissional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    especialidade: string | null;
    registroProfissional: string | null;
  };
  _count?: { denuncias: number };
}) {
  return {
    id:             p.id,
    topico:         p.topico,
    caption:        p.caption,
    imagemUrl:      p.imagemUrl,
    aspectRatio:    p.aspectRatio,
    likes:          p.likes,
    comentarios:    p.comentarios,
    status:         p.status,
    motivoBan:      p.motivoBan,
    moderadoEm:     p.moderadoEm?.toISOString() ?? null,
    createdAt:      p.createdAt.toISOString(),
    totalDenuncias: p._count?.denuncias ?? 0,
    profissional: {
      id:                   p.profissional.id,
      name:                 p.profissional.name,
      avatarUrl:            p.profissional.avatarUrl,
      especialidade:        p.profissional.especialidade,
      registroProfissional: p.profissional.registroProfissional,
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class PublicacoesService {

  /** Lista paginada com filtros (OWASP A03 — Prisma parameterized queries) */
  async list(filters: ListPublicacoesFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { profissional: { name:  { contains: q, mode: 'insensitive' } } },
        { topico:               { contains: q, mode: 'insensitive' } },
        { caption:              { contains: q, mode: 'insensitive' } },
        { profissional: { registroProfissional: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        include: {
          ...INCLUDE_PROF,
          _count: { select: { denuncias: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicacao.count({ where }),
    ]);

    return {
      data: data.map(formatPublicacao),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Contadores por status em uma única query (OWASP A04 — query eficiente) */
  async contadores() {
    const grupos = await prisma.publicacao.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const result: Record<string, number> = { ATIVA: 0, DENUNCIADA: 0, BANIDA: 0, total: 0 };
    for (const g of grupos) {
      result[g.status] = g._count.id;
      result['total'] += g._count.id;
    }
    return result;
  }

  /**
   * Bane uma publicação (ATIVA ou DENUNCIADA → BANIDA)
   * OWASP A09 — audit log com adminId, ip, userAgent
   */
  async banir(dto: BanirDTO) {
    const { id, motivo, adminId, ip, userAgent } = dto;

    const pub = await prisma.publicacao.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!pub) {
      throw Object.assign(new Error('Publicação não encontrada'), { statusCode: 404 });
    }
    if (pub.status === 'BANIDA') {
      throw Object.assign(new Error('Publicação já está banida'), { statusCode: 422 });
    }

    const agora = new Date();
    const atualizada = await prisma.publicacao.update({
      where: { id },
      data: {
        status:        'BANIDA',
        motivoBan:     motivo ?? null,
        moderadoPorId: adminId,
        moderadoEm:    agora,
      },
      select: { id: true, status: true, motivoBan: true, moderadoEm: true },
    });

    logger.warn({
      event:      'publicacao_banida',
      adminId,
      publicacaoId: id,
      motivo,
      ip,
      userAgent,
    }, `⛔ Publicação ${id} banida pelo admin ${adminId}`);

    return atualizada;
  }

  /**
   * Aprova/restaura uma publicação (BANIDA ou DENUNCIADA → ATIVA)
   * OWASP A09 — audit log
   */
  async aprovar(dto: ModerarDTO) {
    const { id, adminId, ip, userAgent } = dto;

    const pub = await prisma.publicacao.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!pub) {
      throw Object.assign(new Error('Publicação não encontrada'), { statusCode: 404 });
    }
    if (pub.status === 'ATIVA') {
      throw Object.assign(new Error('Publicação já está ativa'), { statusCode: 422 });
    }

    const agora = new Date();
    const atualizada = await prisma.publicacao.update({
      where: { id },
      data: {
        status:        'ATIVA',
        motivoBan:     null,
        moderadoPorId: adminId,
        moderadoEm:    agora,
      },
      select: { id: true, status: true, moderadoEm: true },
    });

    logger.info({
      event:      'publicacao_aprovada',
      adminId,
      publicacaoId: id,
      statusAnterior: pub.status,
      ip,
      userAgent,
    }, `✅ Publicação ${id} aprovada/restaurada pelo admin ${adminId}`);

    return atualizada;
  }
}
