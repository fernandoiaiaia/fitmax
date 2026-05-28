import { prisma } from '@fitmax/database';
import { z } from 'zod';
import { logger } from '../../../lib/logger';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const criarPublicacaoSchema = z.object({
  topico:      z.string().min(3).max(100),
  caption:     z.string().min(1).max(2200),
  // Aceita URL HTTPS externa (OWASP A10 — anti-SSRF) OU data URL de imagem do dispositivo
  // OWASP A03 — data URLs limitadas a ~1 MB (base64 ≈ 1.4M chars)
  imagemUrl: z.string().refine(
    v => {
      if (v.startsWith('data:image/')) {
        return v.length <= 1_400_000; // ~1 MB
      }
      try {
        const url = new URL(v);
        return url.protocol === 'https:' &&
          !/(localhost|127\.\d+\.\d+\.\d+|10\.\d+|172\.(1[6-9]|2\d|3[01])\.)/.test(v);
      } catch { return false; }
    },
    { message: 'imagemUrl deve ser uma URL HTTPS válida ou uma imagem do dispositivo (data:image/)' },
  ),
  aspectRatio: z.number().min(0.5).max(2.0).default(1.0),
});

export const comentarSchema = z.object({
  // OWASP A03 — tamanho máximo previne payload oversized
  texto: z.string().min(1).max(500).trim(),
});

export type CriarPublicacaoDTO = z.infer<typeof criarPublicacaoSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

export class FeedProService {

  /** Lista paginada de publicações ATIVAS de todos os profissionais */
  async list(profissionalId: string, page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'ATIVA' };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { topico:   { contains: q, mode: 'insensitive' } },
        { caption:  { contains: q, mode: 'insensitive' } },
        { profissional: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        select: {
          id: true, topico: true, caption: true, imagemUrl: true,
          aspectRatio: true, likes: true, comentarios: true, createdAt: true,
          profissional: {
            select: { id: true, name: true, avatarUrl: true, especialidade: true },
          },
          // Verifica se o profissional logado já curtiu cada post
          curtidas: {
            where: { profissionalId },
            select: { profissionalId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicacao.count({ where }),
    ]);

    return {
      data: data.map(p => ({
        id:          p.id,
        topico:      p.topico,
        caption:     p.caption,
        imagemUrl:   p.imagemUrl,
        aspectRatio: p.aspectRatio,
        likes:       p.likes,
        comentarios: p.comentarios,
        liked:       p.curtidas.length > 0,  // true se o usuário logado já curtiu
        isOwner:     p.profissional.id === profissionalId,
        criadoEm:    p.createdAt.toISOString(),
        autor: {
          id:            p.profissional.id,
          nome:          p.profissional.name,
          avatarUrl:     p.profissional.avatarUrl,
          especialidade: p.profissional.especialidade,
          // cidade removed as it does not exist on Professional
        },
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Publicações do próprio profissional */
  async listMinhas(profissionalId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.publicacao.findMany({
        where: { profissionalId },
        select: {
          id: true, topico: true, imagemUrl: true, aspectRatio: true,
          likes: true, comentarios: true, status: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.publicacao.count({ where: { profissionalId } }),
    ]);

    return {
      data: data.map(p => ({ ...p, criadoEm: p.createdAt.toISOString() })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Cria nova publicação — OWASP A09 audit log */
  async criar(
    profissionalId: string,
    dto: CriarPublicacaoDTO,
    meta: { ip: string; userAgent: string },
  ) {
    const pub = await prisma.publicacao.create({
      data: {
        profissionalId,
        topico:      dto.topico,
        caption:     dto.caption,
        imagemUrl:   dto.imagemUrl,
        aspectRatio: dto.aspectRatio,
        status:      'ATIVA',
      },
      select: {
        id: true, topico: true, caption: true, imagemUrl: true,
        aspectRatio: true, likes: true, comentarios: true, createdAt: true,
        profissional: {
          select: { id: true, name: true, avatarUrl: true, especialidade: true },
        },
      },
    });

    logger.info({
      event: 'publicacao_criada',
      profissionalId,
      publicacaoId: pub.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Nova publicação: ${pub.id}`);

    return {
      id:          pub.id,
      topico:      pub.topico,
      caption:     pub.caption,
      imagemUrl:   pub.imagemUrl,
      aspectRatio: pub.aspectRatio,
      likes:       pub.likes,
      comentarios: pub.comentarios,
      liked:       false,
      isOwner:     true,
      criadoEm:    pub.createdAt.toISOString(),
      autor: {
        id:            pub.profissional.id,
        nome:          pub.profissional.name,
        avatarUrl:     pub.profissional.avatarUrl,
        especialidade: pub.profissional.especialidade,
        // cidade removed as it does not exist on Professional
      },
    };
  }

  /**
   * Remove publicação — OWASP A01: verifica ownership antes de deletar.
   * OWASP A09 — audit log.
   */
  async deletar(
    profissionalId: string,
    id: string,
    meta: { ip: string; userAgent: string },
  ) {
    // 1. Verifica ownership
    const pub = await prisma.publicacao.findFirst({
      where: { id, profissionalId },
      select: { id: true, status: true },
    });

    if (!pub) {
      throw Object.assign(new Error('Publicação não encontrada'), { statusCode: 404 });
    }

    await prisma.publicacao.delete({ where: { id } });

    logger.info({
      event: 'publicacao_deletada',
      profissionalId,
      publicacaoId: id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Publicação ${id} removida pelo profissional`);

    return { id };
  }

  /**
   * Toggle curtida — OWASP A01: controlado por profissionalId do JWT.
   * Usa @@id composto para evitar duplicatas no banco.
   * OWASP A09: audit log.
   */
  async toggleCurtir(
    profissionalId: string,
    publicacaoId: string,
    meta: { ip: string; userAgent: string },
  ) {
    // 1. Verifica se publicação existe
    const pub = await prisma.publicacao.findFirst({
      where: { id: publicacaoId, status: 'ATIVA' },
      select: { id: true, likes: true },
    });

    if (!pub) {
      throw Object.assign(new Error('Publicação não encontrada'), { statusCode: 404 });
    }

    // 2. Verifica curtida existente
    const jaExiste = await prisma.curtidaFeed.findUnique({
      where: { profissionalId_publicacaoId: { profissionalId, publicacaoId } },
    });

    if (jaExiste) {
      // Descurtir
      await prisma.$transaction([
        prisma.curtidaFeed.delete({
          where: { profissionalId_publicacaoId: { profissionalId, publicacaoId } },
        }),
        prisma.publicacao.update({
          where: { id: publicacaoId },
          data: { likes: { decrement: 1 } },
        }),
      ]);

      logger.info({ event: 'feed_descurtido', profissionalId, publicacaoId, ip: meta.ip }, '');

      const atualizada = await prisma.publicacao.findUnique({
        where: { id: publicacaoId }, select: { likes: true },
      });
      return { liked: false, likes: atualizada?.likes ?? Math.max(0, pub.likes - 1) };

    } else {
      // Curtir
      await prisma.$transaction([
        prisma.curtidaFeed.create({ data: { profissionalId, publicacaoId } }),
        prisma.publicacao.update({
          where: { id: publicacaoId },
          data: { likes: { increment: 1 } },
        }),
      ]);

      logger.info({ event: 'feed_curtido', profissionalId, publicacaoId, ip: meta.ip }, '');

      const atualizada = await prisma.publicacao.findUnique({
        where: { id: publicacaoId }, select: { likes: true },
      });
      return { liked: true, likes: atualizada?.likes ?? pub.likes + 1 };
    }
  }

  /**
   * Cria comentário em uma publicação.
   * OWASP A01: profissionalId do JWT.
   * OWASP A03: texto validado por Zod (1-500 chars).
   * OWASP A09: audit log.
   */
  async comentar(
    profissionalId: string,
    publicacaoId: string,
    texto: string,
    meta: { ip: string; userAgent: string },
  ) {
    const pub = await prisma.publicacao.findFirst({
      where: { id: publicacaoId, status: 'ATIVA' },
      select: { id: true },
    });

    if (!pub) {
      throw Object.assign(new Error('Publicação não encontrada'), { statusCode: 404 });
    }

    const [comentario] = await prisma.$transaction([
      prisma.comentarioFeed.create({
        data: { profissionalId, publicacaoId, texto },
        select: {
          id: true, texto: true, criadoEm: true,
          profissional: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.publicacao.update({
        where: { id: publicacaoId },
        data: { comentarios: { increment: 1 } },
      }),
    ]);

    logger.info({
      event: 'feed_comentado',
      profissionalId,
      publicacaoId,
      comentarioId: comentario.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }, `Comentário ${comentario.id} criado`);

    return {
      id:       comentario.id,
      texto:    comentario.texto,
      criadoEm: comentario.criadoEm.toISOString(),
      autor: {
        id:        comentario.profissional.id,
        nome:      comentario.profissional.name,
        avatarUrl: comentario.profissional.avatarUrl,
      },
    };
  }

  /** Lista comentários de uma publicação — paginado */
  async listarComentarios(publicacaoId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.comentarioFeed.findMany({
        where: { publicacaoId },
        select: {
          id: true, texto: true, criadoEm: true,
          profissional: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { criadoEm: 'asc' },
        skip,
        take: limit,
      }),
      prisma.comentarioFeed.count({ where: { publicacaoId } }),
    ]);

    return {
      data: data.map(c => ({
        id:       c.id,
        texto:    c.texto,
        criadoEm: c.criadoEm.toISOString(),
        autor: {
          id:        c.profissional.id,
          nome:      c.profissional.name,
          avatarUrl: c.profissional.avatarUrl,
        },
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
