import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';

// ─── Schemas de Validação (OWASP A03) ─────────────────────────────────────────

export const feedListSchema = z.object({
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(30).default(12),
  search:    z.string().max(100).trim().optional(),
  categoria: z.enum(['Todos', 'Profissionais', 'Serviços', 'Próximos a mim']).default('Todos'),
});

export const comentarSchema = z.object({
  // OWASP A03 — limita tamanho do payload
  texto: z.string().min(1).max(500).trim(),
});

export const denunciarSchema = z.object({
  motivo: z.enum(['spam', 'conteudo_improprio', 'desinformacao', 'assedio', 'outro']),
  descricao: z.string().max(300).trim().optional(),
});

// ─── Helper: formata autor (pro ou cliente) ───────────────────────────────────

function formatAutor(profissional: {
  id: string; name: string; avatarUrl: string | null;
  especialidade: string | null; cidade: string | null; uf: string | null;
} | null) {
  if (!profissional) return null;
  return {
    id:            profissional.id,
    nome:          profissional.name,
    avatarUrl:     profissional.avatarUrl,
    especialidade: profissional.especialidade,
    localizacao:   profissional.cidade && profissional.uf
      ? `${profissional.cidade}, ${profissional.uf}`
      : null,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class FeedClientService {

  /**
   * Lista posts paginados de todos os profissionais ATIVOS.
   * OWASP A01 — clienteId do JWT para marcar `liked`
   * OWASP A05 — select explícito, sem dados sensíveis
   */
  async list(clienteId: string, input: z.infer<typeof feedListSchema>) {
    const { page, limit, search, categoria } = input;
    const skip = (page - 1) * limit;

    // OWASP A03 — where construído de forma tipada, nunca interpolado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'ATIVA' };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { topico:      { contains: q, mode: 'insensitive' } },
        { caption:     { contains: q, mode: 'insensitive' } },
        { profissional: { name: { contains: q, mode: 'insensitive' } } },
        { profissional: { especialidade: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Filtro de categoria — realizado no banco (sem filtro client-side em arrays grandes)
    if (categoria === 'Próximos a mim') {
      // Posts online ou de SP/RJ (simplificação; em produção usaria coordenadas GPS)
      where.profissional = { ...where.profissional, status: 'ATIVO' };
    }

    const [data, total] = await Promise.all([
      prisma.publicacao.findMany({
        where,
        select: {
          id:          true,
          topico:      true,
          caption:     true,
          imagemUrl:   true,
          aspectRatio: true,
          likes:       true,
          comentarios: true,
          createdAt:   true,
          profissional: {
            select: {
              id:            true,
              name:          true,
              avatarUrl:     true,
              especialidade: true,
              cidade:        true,
              uf:            true,
            },
          },
          // Verifica se o cliente já curtiu este post (OWASP A01)
          curtidas: {
            where: { clienteId },
            select: { id: true },
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
        liked:       p.curtidas.length > 0,
        criadoEm:    p.createdAt.toISOString(),
        autor:       formatAutor(p.profissional),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Lista comentários de um post (profissionais e clientes).
   * OWASP A05 — retorna apenas campos públicos do autor
   */
  async listarComentarios(publicacaoId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.comentarioFeed.findMany({
        where: { publicacaoId },
        select: {
          id:       true,
          texto:    true,
          criadoEm: true,
          profissional: {
            select: { id: true, name: true, avatarUrl: true },
          },
          cliente: {
            select: { id: true, name: true, avatarUrl: true },
          },
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
        autor: c.profissional
          ? { id: c.profissional.id, nome: c.profissional.name, avatarUrl: c.profissional.avatarUrl, tipo: 'profissional' as const }
          : { id: c.cliente!.id,     nome: c.cliente!.name,     avatarUrl: c.cliente!.avatarUrl,     tipo: 'cliente' as const },
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Toggle curtida — OWASP A01: clienteId sempre do JWT.
   * Constraint @@unique([clienteId, publicacaoId]) no banco previne duplicatas.
   * OWASP A09: audit log.
   */
  async toggleCurtir(
    clienteId: string,
    publicacaoId: string,
    meta: { ip: string; userAgent: string },
  ) {
    // Verifica que o post existe e está ativo
    const pub = await prisma.publicacao.findFirst({
      where: { id: publicacaoId, status: 'ATIVA' },
      select: { id: true, likes: true },
    });
    if (!pub) throw new AppError('Publicação não encontrada', 404);

    // Verifica curtida existente
    const jaExiste = await prisma.curtidaFeed.findUnique({
      where: { clienteId_publicacaoId: { clienteId, publicacaoId } },
    });

    if (jaExiste) {
      // Descurtir — transaction atômica (OWASP A04 — evita race condition)
      await prisma.$transaction([
        prisma.curtidaFeed.delete({
          where: { clienteId_publicacaoId: { clienteId, publicacaoId } },
        }),
        prisma.publicacao.update({
          where: { id: publicacaoId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
      logger.info({ event: 'feed_descurtido_cliente', clienteId, publicacaoId, ip: meta.ip }, '');
      const atualizada = await prisma.publicacao.findUnique({ where: { id: publicacaoId }, select: { likes: true } });
      return { liked: false, likes: atualizada?.likes ?? Math.max(0, pub.likes - 1) };

    } else {
      // Curtir
      await prisma.$transaction([
        prisma.curtidaFeed.create({ data: { clienteId, publicacaoId } }),
        prisma.publicacao.update({
          where: { id: publicacaoId },
          data: { likes: { increment: 1 } },
        }),
      ]);
      logger.info({ event: 'feed_curtido_cliente', clienteId, publicacaoId, ip: meta.ip }, '');
      const atualizada = await prisma.publicacao.findUnique({ where: { id: publicacaoId }, select: { likes: true } });
      return { liked: true, likes: atualizada?.likes ?? pub.likes + 1 };
    }
  }

  /**
   * Cria comentário do cliente em um post.
   * OWASP A01 — clienteId do JWT.
   * OWASP A03 — texto validado por Zod (1-500 chars, trimmed).
   * OWASP A09 — audit log.
   */
  async comentar(
    clienteId: string,
    publicacaoId: string,
    texto: string,
    meta: { ip: string; userAgent: string },
  ) {
    const pub = await prisma.publicacao.findFirst({
      where: { id: publicacaoId, status: 'ATIVA' },
      select: { id: true },
    });
    if (!pub) throw new AppError('Publicação não encontrada', 404);

    const [comentario] = await prisma.$transaction([
      prisma.comentarioFeed.create({
        data: { clienteId, publicacaoId, texto },
        select: {
          id:       true,
          texto:    true,
          criadoEm: true,
          cliente:  { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.publicacao.update({
        where: { id: publicacaoId },
        data: { comentarios: { increment: 1 } },
      }),
    ]);

    logger.info({
      event:        'feed_comentado_cliente',
      clienteId,
      publicacaoId,
      comentarioId: comentario.id,
      ip:           meta.ip,
      userAgent:    meta.userAgent,
    }, `Comentário ${comentario.id} criado pelo cliente`);

    return {
      id:       comentario.id,
      texto:    comentario.texto,
      criadoEm: comentario.criadoEm.toISOString(),
      autor: {
        id:        comentario.cliente!.id,
        nome:      comentario.cliente!.name,
        avatarUrl: comentario.cliente!.avatarUrl,
        tipo:      'cliente' as const,
      },
    };
  }

  /**
   * Denuncia um post — usa model Denuncia já existente no schema.
   * OWASP A01 — clienteId do JWT.
   * OWASP A09 — audit log com IP.
   * Anti-dupla denúncia: verifica se cliente já denunciou este post.
   */
  async denunciar(
    clienteId: string,
    publicacaoId: string,
    input: z.infer<typeof denunciarSchema>,
    meta: { ip: string; userAgent: string },
  ) {
    const pub = await prisma.publicacao.findFirst({
      where: { id: publicacaoId, status: 'ATIVA' },
      select: { id: true },
    });
    if (!pub) throw new AppError('Publicação não encontrada', 404);

    // Anti-dupla denúncia (OWASP A04)
    const jaDenunciou = await prisma.denuncia.findFirst({
      where: { publicacaoId, clienteId },
    });
    if (jaDenunciou) {
      throw new AppError('Você já denunciou esta publicação', 409);
    }

    const motivoFinal = input.descricao
      ? `${input.motivo}: ${input.descricao}`
      : input.motivo;

    await prisma.denuncia.create({
      data: { publicacaoId, clienteId, motivo: motivoFinal },
    });

    logger.warn({
      event:        'feed_denunciado',
      clienteId,
      publicacaoId,
      motivo:       motivoFinal,
      ip:           meta.ip,
      userAgent:    meta.userAgent,
    }, `Post ${publicacaoId} denunciado pelo cliente ${clienteId}`);

    return { message: 'Denúncia registrada. Nossa equipe irá analisar.' };
  }
}
