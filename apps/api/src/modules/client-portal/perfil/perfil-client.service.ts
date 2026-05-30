import { z } from 'zod';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';

// ─── Helper: formata um Plano do banco para o shape do cliente ───────────────

function formatarPeriodo(tipo: string): string {
  const mapa: Record<string, string> = {
    MENSAL:     '/mês',
    TRIMESTRAL: '/trimestre',
    SEMESTRAL:  '/semestre',
    ANUAL:      '/ano',
  };
  return mapa[tipo] ?? '/mês';
}

function formatarValor(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(0)}`;
}

const OBJETIVOS = [
  'Hipertrofia', 'Emagrecimento', 'Saúde Geral',
  'Performance', 'Reabilitação', 'Flexibilidade',
] as const;

// ─── Schemas Zod (OWASP A03) ──────────────────────────────────────────────────

export const updatePerfilSchema = z
  .object({
    name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100).trim().optional(),
    // OWASP A03 — email normalizado e validado
    email:    z.string().email('E-mail inválido').max(254).toLowerCase().trim().optional(),
    telefone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/, 'Telefone inválido. Ex: (11) 99000-0000').or(z.literal("")).transform(v => v === "" ? null : v).optional().nullable(),
    username: z.string().min(3, 'Username deve ter ao menos 3 caracteres').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username só pode conter letras, números e underline').or(z.literal("")).transform(v => v === "" ? null : v).optional().nullable(),
    // OWASP A03 — objetivo restrito a valores conhecidos
    objetivo: z.enum(OBJETIVOS).optional(),
  })
  .strip()  // descarta campos extras não reconhecidos
  .refine(d => Object.keys(d).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

export const excluirContaSchema = z.object({
  // OWASP A07 — confirmação de senha obrigatória antes de excluir conta
  senhaAtual: z.string().min(1, 'Informe sua senha para confirmar a exclusão'),
});

export const notifPrefsSchema = z
  .object({
    confirmacao:        z.boolean().optional(),
    lembrete:           z.boolean().optional(),
    cancelamento:       z.boolean().optional(),
    novosProfissionais: z.boolean().optional(),
    dicas:              z.boolean().optional(),
    canalEmail:         z.boolean().optional(),
    canalWhatsapp:      z.boolean().optional(),
    canalPush:          z.boolean().optional(),
  })
  .refine(d => Object.keys(d).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    // OWASP A02 — mínimo de segurança server-side
    novaSenha:  z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres').max(128),
    confirmar:  z.string(),
  })
  .refine(d => d.novaSenha === d.confirmar, {
    message: 'A confirmação de senha não coincide com a nova senha',
    path: ['confirmar'],
  });

export const alterarPlanoSchema = z.object({
  // OWASP A03 — planoId validado como UUID no servidor; não confiamos no nome
  planoId: z.string().uuid('planoId deve ser um UUID válido'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLIENT_SELECT = {
  id:        true,
  name:      true,
  email:     true,
  telefone:  true,
  username:  true,
  avatarUrl: true,
  objetivo:  true,
  plano:     true,
  status:    true,
  createdAt: true,
  // OWASP A05 — nunca retornar password, cpf, banidoPorId
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PerfilClientService {

  /**
   * Retorna os dados de perfil do cliente autenticado.
   * OWASP A01 — WHERE id = jwt.sub
   * OWASP A05 — select explícito: sem password, cpf, banimento
   */
  async getPerfil(clientId: string) {
    const client = await prisma.client.findUnique({
      where:  { id: clientId },
      select: CLIENT_SELECT,
    });

    if (!client) throw new AppError('Cliente não encontrado', 404);
    return client;
  }

  /**
   * Atualiza dados pessoais do cliente.
   * OWASP A01 — WHERE id = jwt.sub (clientId nunca vem do body)
   * OWASP A03 — campos validados via Zod antes de chegar aqui
   * OWASP A09 — audit log
   */
  async updatePerfil(
    clientId: string,
    campos:   z.infer<typeof updatePerfilSchema>,
    meta:     { ip: string; userAgent: string },
  ) {
    // OWASP A03 — verifica unicidade do email se foi enviado
    if (campos.email) {
      const existente = await prisma.client.findFirst({
        where: { email: campos.email, NOT: { id: clientId } },
        select: { id: true },
      });
      if (existente) throw new AppError('E-mail já está em uso', 409);
    }

    // OWASP A03 — verifica unicidade do username se foi enviado
    if (campos.username) {
      const existente = await prisma.client.findFirst({
        where: { username: { equals: campos.username, mode: 'insensitive' }, NOT: { id: clientId } },
        select: { id: true },
      });
      if (existente) throw new AppError('Nome de usuário já está em uso', 409);
    }

    const updated = await prisma.client.update({
      where:  { id: clientId },
      data:   campos,
      select: CLIENT_SELECT,
    });

    // OWASP A09 — audit log de operação de escrita
    logger.info({
      event:    'perfil_atualizado',
      clientId,
      campos:   Object.keys(campos),
      ip:       meta.ip,
      userAgent: meta.userAgent,
    }, `✏️  Perfil atualizado: cliente ${clientId}`);

    return updated;
  }

  /**
   * Atualiza o avatar do cliente.
   * OWASP A04 — validação de MIME e tamanho feita pelo multer no router
   * OWASP A03 — filename UUID gerado no servidor (anti path-traversal)
   * OWASP A09 — audit log
   */
  async updateAvatar(
    clientId: string,
    filePath: string,
    ip:       string,
    userAgent: string,
  ) {
    // Monta URL pública relativa ao servidor
    const filename  = path.basename(filePath);
    const avatarUrl = `/uploads/avatars/${filename}`;

    const updated = await prisma.client.update({
      where:  { id: clientId },
      data:   { avatarUrl },
      select: { id: true, avatarUrl: true },
    });

    // OWASP A09 — audit log
    logger.info({
      event:    'avatar_atualizado',
      clientId,
      avatarUrl,
      ip,
      userAgent,
    }, `🖼️  Avatar atualizado: cliente ${clientId}`);

    return updated;
  }

  /**
   * Soft delete da conta do cliente.
   * OWASP A01 — clientId do JWT, não do body
   * OWASP A07 — exige confirmação de senha antes de excluir
   * OWASP A09 — soft delete (status = INATIVO) preserva histórico e audit trail
   */
  async excluirConta(
    clientId:   string,
    senhaAtual: string,
    meta:       { ip: string; userAgent: string },
  ) {
    // Busca senha atual para verificação
    const client = await prisma.client.findUnique({
      where:  { id: clientId },
      select: { password: true, status: true },
    });

    if (!client) throw new AppError('Cliente não encontrado', 404);

    if (client.status !== 'ATIVO') {
      throw new AppError('Conta já está inativa', 422);
    }

    // OWASP A02 — bcrypt.compare antes de qualquer operação destrutiva
    const senhaValida = await bcrypt.compare(senhaAtual, client.password);
    if (!senhaValida) {
      throw new AppError('Senha incorreta', 401);
    }

    // OWASP A09 — soft delete: preserva dados para auditoria
    await prisma.client.update({
      where: { id: clientId },
      data:  { status: 'INATIVO' },
    });

    // OWASP A09 — audit log crítico
    logger.warn({
      event:    'conta_excluida',
      clientId,
      ip:       meta.ip,
      userAgent: meta.userAgent,
    }, `🗑️  Conta desativada (soft delete): cliente ${clientId}`);
  }

  /**
   * Retorna informações do plano atual do cliente.
   * Busca o registro real na tabela Plano pelo nome armazenado em Client.plano.
   * OWASP A01 — clientId do JWT
   * OWASP A05 — select mínimo necessário
   */
  async getPlano(clientId: string) {
    const client = await prisma.client.findUnique({
      where:  { id: clientId },
      select: { plano: true, createdAt: true },
    });

    if (!client) throw new AppError('Cliente não encontrado', 404);

    const nomePlano = client.plano ?? null;

    // Busca o plano real no banco pelo nome (case-insensitive)
    const planoDb = nomePlano
      ? await prisma.plano.findFirst({
          where: { nome: { equals: nomePlano, mode: 'insensitive' }, ativo: true },
        })
      : null;

    return {
      planoAtual:   planoDb?.nome   ?? nomePlano ?? null,
      id:           planoDb?.id     ?? null,
      valor:        planoDb ? formatarValor(planoDb.valorCentavos) : null,
      valorCentavos: planoDb?.valorCentavos ?? null,
      periodo:      planoDb ? formatarPeriodo(planoDb.tipo) : null,
      tipo:         planoDb?.tipo   ?? null,
      consultas:    planoDb?.consultas ?? null,
      taxa:         planoDb?.taxa   ?? null,
      membrosDesde: client.createdAt.toISOString(),
    };
  }

  /**
   * Lista todos os planos ativos disponíveis para o cliente.
   * Retorna apenas planos com audiencia = CLIENTE.
   * OWASP A05 — não expõe criadoPorId nem campos internos
   */
  async listarPlanos() {
    const planos = await prisma.plano.findMany({
      where:   { ativo: true, audiencia: 'CLIENTE' },
      orderBy: { valorCentavos: 'asc' },
      select: {
        id:            true,
        nome:          true,
        tipo:          true,
        valorCentavos: true,
        consultas:     true,
        taxa:          true,
      },
    });

    return planos.map(p => ({
      id:            p.id,
      nome:          p.nome,
      tipo:          p.tipo,
      valor:         formatarValor(p.valorCentavos),
      valorCentavos: p.valorCentavos,
      periodo:       formatarPeriodo(p.tipo),
      consultas:     p.consultas,
      taxa:          p.taxa,
    }));
  }

  /**
   * Retorna preferências de notificação.
   * OWASP A01 — clientId do JWT
   * OWASP A08 — upsert na leitura: cria com defaults se não existe (idempotência)
   */
  async getNotifPrefs(clientId: string) {
    // upsert: primeira leitura cria o registro com defaults
    const prefs = await prisma.clientNotifPrefs.upsert({
      where:  { clienteId: clientId },
      update: {},          // sem mudanças — apenas leitura idempotente
      create: { clienteId: clientId },
    });

    return prefs;
  }

  /**
   * Salva preferências de notificação.
   * OWASP A01 — clientId do JWT
   * OWASP A03 — campos validados via Zod
   * OWASP A08 — upsert garante idempotência
   * OWASP A09 — audit log
   */
  async updateNotifPrefs(
    clientId: string,
    prefs:    z.infer<typeof notifPrefsSchema>,
    meta:     { ip: string; userAgent: string },
  ) {
    const updated = await prisma.clientNotifPrefs.upsert({
      where:  { clienteId: clientId },
      update: prefs,
      create: { clienteId: clientId, ...prefs },
    });

    // OWASP A09 — audit log
    logger.info({
      event:    'notif_prefs_atualizadas',
      clientId,
      campos:   Object.keys(prefs),
      ip:       meta.ip,
      userAgent: meta.userAgent,
    }, `🔔 Preferências de notificação atualizadas: cliente ${clientId}`);

    return updated;
  }

  /**
   * Altera a senha do cliente.
   * OWASP A01 — clientId do JWT, nunca do body
   * OWASP A02 — bcrypt.compare + bcrypt.hash(12)
   * OWASP A07 — rate limit (passwordLimiter) aplicado no router
   * OWASP A09 — audit log
   */
  async alterarSenha(
    clientId:   string,
    senhaAtual: string,
    novaSenha:  string,
    meta:       { ip: string; userAgent: string },
  ) {
    const client = await prisma.client.findUnique({
      where:  { id: clientId },
      select: { password: true },
    });

    if (!client) throw new AppError('Cliente não encontrado', 404);

    // OWASP A02 — verifica senha atual com bcrypt
    const senhaValida = await bcrypt.compare(senhaAtual, client.password);
    if (!senhaValida) {
      // OWASP A09 — log de tentativa de troca de senha com senha errada
      logger.warn({
        event:    'senha_alteracao_falhou',
        clientId,
        ip:       meta.ip,
        userAgent: meta.userAgent,
      }, `⚠️  Tentativa de troca de senha com senha incorreta: cliente ${clientId}`);

      throw new AppError('Senha atual incorreta', 401);
    }

    // OWASP A02 — hash com bcrypt rounds = 12
    const novoHash = await bcrypt.hash(novaSenha, 12);

    await prisma.client.update({
      where: { id: clientId },
      data:  { password: novoHash },
    });

    // OWASP A09 — audit log de troca de senha bem-sucedida
    logger.info({
      event:    'senha_alterada',
      clientId,
      ip:       meta.ip,
      userAgent: meta.userAgent,
    }, `🔑 Senha alterada: cliente ${clientId}`);

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Altera o plano de assinatura do cliente.
   * OWASP A01 — clientId do JWT
   * OWASP A03 — planoId validado como UUID + verificação de existência no banco
   * OWASP A09 — audit log
   */
  async alterarPlano(
    clientId: string,
    planoId:  string,
    meta:     { ip: string; userAgent: string },
  ) {
    // OWASP A03 — verifica se o plano existe, está ativo e é para CLIENTE
    const plano = await prisma.plano.findFirst({
      where: { id: planoId, ativo: true, audiencia: 'CLIENTE' },
      select: { id: true, nome: true },
    });

    if (!plano) throw new AppError('Plano não encontrado ou indisponível', 404);

    // OWASP A01 — WHERE id = jwt.sub
    await prisma.client.update({
      where: { id: clientId },
      data:  { plano: plano.nome },
    });

    // OWASP A09 — audit log
    logger.info({
      event:    'plano_alterado',
      clientId,
      planoId,
      planoNome: plano.nome,
      ip:        meta.ip,
      userAgent: meta.userAgent,
    }, `⭐ Plano alterado para "${plano.nome}": cliente ${clientId}`);

    return { sucesso: true, plano: plano.nome };
  }

  /**
   * Cancela (remove) o plano atual do cliente (define plano = null).
   * OWASP A01 — clientId do JWT
   * OWASP A09 — audit log
   */
  async cancelarPlano(
    clientId: string,
    meta:     { ip: string; userAgent: string },
  ) {
    await prisma.client.update({
      where: { id: clientId },
      data:  { plano: null },
    });

    logger.info({
      event:    'plano_cancelado',
      clientId,
      ip:        meta.ip,
      userAgent: meta.userAgent,
    }, `❌ Assinatura cancelada: cliente ${clientId}`);

    return { sucesso: true, plano: null };
  }
}
