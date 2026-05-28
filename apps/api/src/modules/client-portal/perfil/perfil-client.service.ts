import { z } from 'zod';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';
import { logger } from '../../../lib/logger';
import { AppError } from '../../../middlewares/errorHandler';

// ─── Catálogo de Planos (dados estáticos do cliente) ─────────────────────────
// O campo Client.plano armazena o nome; preço e features são mapeados aqui.
// Quando houver uma tabela de planos para clientes, substituir por query.

const CATALOGO_PLANOS: Record<string, {
  nome: string; preco: string; periodo: string; features: string[];
}> = {
  Plus: {
    nome:     'Plus',
    preco:    'R$ 29',
    periodo:  '/mês',
    features: [
      'Consultas ilimitadas',
      'Histórico completo',
      'Avaliações e favoritos',
      'Suporte prioritário',
    ],
  },
  Premium: {
    nome:     'Premium',
    preco:    'R$ 59',
    periodo:  '/mês',
    features: [
      'Tudo do Plus',
      'Consulta de emergência',
      'Acesso antecipado',
      'Gerenciador familiar',
    ],
  },
};

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
    // OWASP A03 — telefone formato brasileiro
    phone:    z
      .string()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/, 'Telefone inválido. Ex: (11) 99000-0000')
      .optional(),
    // OWASP A03 — username: sem caracteres especiais que permitam injeção
    username: z
      .string()
      .min(3, 'Username deve ter ao menos 3 caracteres')
      .max(30)
      .regex(/^[a-z0-9_]+$/, 'Username só pode conter letras minúsculas, números e _')
      .optional(),
    // OWASP A03 — objetivo restrito a valores conhecidos
    objetivo: z.enum(OBJETIVOS).optional(),
  })
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLIENT_SELECT = {
  id:        true,
  name:      true,
  email:     true,
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
    // OWASP A03 — verifica unicidade do username se foi enviado
    if (campos.username) {
      const existente = await prisma.client.findFirst({
        where: { username: campos.username, NOT: { id: clientId } },
        select: { id: true },
      });
      if (existente) throw new AppError('Username já está em uso', 409);
    }

    // OWASP A03 — verifica unicidade do email se foi enviado
    if (campos.email) {
      const existente = await prisma.client.findFirst({
        where: { email: campos.email, NOT: { id: clientId } },
        select: { id: true },
      });
      if (existente) throw new AppError('E-mail já está em uso', 409);
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
   * OWASP A01 — clientId do JWT
   * OWASP A05 — select mínimo necessário
   */
  async getPlano(clientId: string) {
    const client = await prisma.client.findUnique({
      where:  { id: clientId },
      select: { plano: true, createdAt: true },
    });

    if (!client) throw new AppError('Cliente não encontrado', 404);

    const nomePlano = client.plano ?? 'Plus';
    const catalogo  = CATALOGO_PLANOS[nomePlano] ?? CATALOGO_PLANOS['Plus'];

    return {
      planoAtual: nomePlano,
      ...catalogo,
      membrosDesde: client.createdAt.toISOString(),
    };
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
}
