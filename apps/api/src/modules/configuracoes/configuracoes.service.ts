import bcrypt from 'bcryptjs';
import path from 'path';
import { prisma } from '@fitmax/database';
import { logger } from '../../lib/logger';
import { AppError } from '../../middlewares/errorHandler';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove o campo password antes de expor os dados do admin — OWASP A02 */
function formatAdmin(admin: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  username: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id:        admin.id,
    email:     admin.email,
    name:      admin.name,
    phone:     admin.phone,
    username:  admin.username,
    avatarUrl: admin.avatarUrl,
    createdAt: admin.createdAt.toISOString(),
  };
}

function formatConvenio(c: {
  id: string;
  nome: string;
  categoria: string;
  ativo: boolean;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:          c.id,
    nome:        c.nome,
    categoria:   c.categoria,
    ativo:       c.ativo,
    criadoPorId: c.criadoPorId,
    createdAt:   c.createdAt.toISOString(),
    updatedAt:   c.updatedAt.toISOString(),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpdatePerfilDTO {
  adminId:   string;
  name?:     string;
  phone?:    string;
  username?: string;
  ip:        string;
  userAgent: string;
}

export interface UpdateNotifPrefsDTO {
  adminId:             string;
  novaConsulta?:       boolean;
  cancelamento?:       boolean;
  novoUsuario?:        boolean;
  assinaturaVencendo?: boolean;
  relatorioSemanal?:   boolean;
  canalEmail?:         boolean;
  canalWhatsapp?:      boolean;
  canalPush?:          boolean;
  ip:                  string;
  userAgent:           string;
}

export interface AlterarSenhaDTO {
  adminId:    string;
  senhaAtual: string;
  novaSenha:  string;
  ip:         string;
  userAgent:  string;
}

export interface CriarConvenioDTO {
  nome:        string;
  categoria:   string;
  adminId:     string;
  ip:          string;
  userAgent:   string;
}

export interface EditarConvenioDTO {
  nome?:       string;
  categoria?:  string;
  adminId:     string;
  ip:          string;
  userAgent:   string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ConfiguracoesService {

  // ── Perfil ────────────────────────────────────────────────────────────────

  /**
   * Retorna o perfil do admin autenticado.
   * OWASP A01 — admin só acessa o próprio registro via `adminId` do JWT.
   * OWASP A02 — o campo `password` é excluído explicitamente do select.
   */
  async getPerfil(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true, email: true, name: true,
        phone: true, username: true, avatarUrl: true, createdAt: true,
        // password: false — OWASP A02: nunca expõe o hash
      },
    });

    if (!admin) throw new AppError('Admin não encontrado', 404);

    return formatAdmin(admin);
  }

  /**
   * Atualiza dados pessoais do admin (nome, telefone, username).
   * OWASP A03 — Prisma ORM usa queries parametrizadas.
   * OWASP A09 — audit log da operação.
   */
  async updatePerfil(dto: UpdatePerfilDTO) {
    const { adminId, name, phone, username, ip, userAgent } = dto;

    // Verifica se o username já está em uso por outro admin (OWASP A03)
    if (username) {
      const existente = await prisma.admin.findFirst({
        where: { username, id: { not: adminId } },
      });
      if (existente) throw new AppError(`Username "@${username}" já está em uso`, 409);
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        ...(name     !== undefined && { name }),
        ...(phone    !== undefined && { phone }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true, email: true, name: true,
        phone: true, username: true, avatarUrl: true, createdAt: true,
      },
    });

    logger.info(
      { event: 'perfil_atualizado', adminId, campos: { name, phone, username }, ip, userAgent },
      `✅ Perfil do admin ${adminId} atualizado`
    );

    return formatAdmin(admin);
  }

  /**
   * Atualiza a URL do avatar do admin após upload.
   * OWASP A04 — o arquivo foi validado (MIME + tamanho) antes de chegar aqui.
   * OWASP A09 — audit log.
   */
  async updateAvatar(adminId: string, filePath: string, ip: string, userAgent: string) {
    // Monta URL pública relativa — o Express serve /uploads estaticamente
    const avatarUrl = `/uploads/avatars/${path.basename(filePath)}`;

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { avatarUrl },
      select: {
        id: true, email: true, name: true,
        phone: true, username: true, avatarUrl: true, createdAt: true,
      },
    });

    logger.info(
      { event: 'avatar_atualizado', adminId, avatarUrl, ip, userAgent },
      `🖼️  Avatar do admin ${adminId} atualizado`
    );

    return { avatarUrl: admin.avatarUrl };
  }

  // ── Notificações ─────────────────────────────────────────────────────────

  /**
   * Retorna as preferências de notificação do admin.
   * Cria com valores default (upsert) se ainda não existir.
   */
  async getNotifPrefs(adminId: string) {
    const prefs = await prisma.adminNotifPrefs.upsert({
      where:  { adminId },
      update: {},
      create: { adminId },
    });

    // Remove adminId da resposta — o cliente já o conhece via JWT
    const { adminId: _, updatedAt, ...campos } = prefs;
    return { ...campos, updatedAt: updatedAt.toISOString() };
  }

  /**
   * Atualiza as preferências de notificação (partial update).
   * OWASP A03 — apenas campos booleanos permitidos; Zod valida antes.
   * OWASP A09 — audit log.
   */
  async updateNotifPrefs(dto: UpdateNotifPrefsDTO) {
    const { adminId, ip, userAgent, ...campos } = dto;

    const prefs = await prisma.adminNotifPrefs.upsert({
      where:  { adminId },
      update: campos,
      create: { adminId, ...campos },
    });

    logger.info(
      { event: 'notif_prefs_atualizadas', adminId, campos, ip, userAgent },
      `🔔 Preferências de notificação do admin ${adminId} atualizadas`
    );

    const { adminId: _, updatedAt, ...rest } = prefs;
    return { ...rest, updatedAt: updatedAt.toISOString() };
  }

  // ── Segurança ─────────────────────────────────────────────────────────────

  /**
   * Altera a senha do admin.
   * OWASP A02 — valida senha atual com bcrypt.compare (timing-safe).
   * OWASP A02 — hash com bcrypt cost 12 antes de persistir.
   * OWASP A07 — rate limiter aplicado na rota (passwordLimiter).
   * OWASP A09 — audit log com WARN (operação sensível).
   */
  async alterarSenha(dto: AlterarSenhaDTO) {
    const { adminId, senhaAtual, novaSenha, ip, userAgent } = dto;

    // Busca o admin com o hash da senha atual
    const admin = await prisma.admin.findUnique({
      where:  { id: adminId },
      select: { id: true, email: true, password: true },
    });

    if (!admin) throw new AppError('Admin não encontrado', 404);

    // OWASP A02 — timing-safe compare via bcrypt
    const senhaCorreta = await bcrypt.compare(senhaAtual, admin.password);
    if (!senhaCorreta) {
      logger.warn(
        { event: 'senha_atual_incorreta', adminId, ip, userAgent },
        `⚠️  Tentativa de troca de senha com senha atual incorreta — admin ${adminId}`
      );
      throw new AppError('Senha atual incorreta', 401);
    }

    // Impede reutilização da mesma senha (OWASP A07)
    const mesmaSenha = await bcrypt.compare(novaSenha, admin.password);
    if (mesmaSenha) throw new AppError('A nova senha não pode ser igual à senha atual', 400);

    // OWASP A02 — bcrypt cost 12 (mínimo recomendado para segurança adequada)
    const hash = await bcrypt.hash(novaSenha, 12);

    await prisma.admin.update({
      where: { id: adminId },
      data:  { password: hash },
    });

    logger.warn(
      { event: 'senha_alterada', adminId, ip, userAgent },
      `🔑 Senha do admin ${adminId} alterada com sucesso`
    );

    return { message: 'Senha alterada com sucesso' };
  }

  // ── Convênios ─────────────────────────────────────────────────────────────

  /**
   * Lista todos os convênios com estatísticas calculadas.
   * OWASP A03 — queries parametrizadas via Prisma ORM.
   */
  async listConvenios() {
    const lista = await prisma.convenio.findMany({
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });

    const formatted = lista.map(formatConvenio);
    const total     = formatted.length;
    const ativos    = formatted.filter(c => c.ativo).length;

    return {
      convenios: formatted,
      stats: { total, ativos, inativos: total - ativos },
    };
  }

  /**
   * Cria um novo convênio.
   * OWASP A03 — valida duplicata de nome (case-insensitive).
   * OWASP A09 — audit log.
   */
  async criarConvenio(dto: CriarConvenioDTO) {
    const { nome, categoria, adminId, ip, userAgent } = dto;

    const existente = await prisma.convenio.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' } },
    });
    if (existente) throw new AppError(`Já existe um convênio com o nome "${nome}"`, 409);

    const convenio = await prisma.convenio.create({
      data: { nome, categoria, criadoPorId: adminId },
    });

    logger.info(
      { event: 'convenio_criado', convenioId: convenio.id, nome, categoria, adminId, ip, userAgent },
      `✅ Convênio "${nome}" criado pelo admin ${adminId}`
    );

    return formatConvenio(convenio);
  }

  /**
   * Edita um convênio existente (partial update).
   * OWASP A03 — valida unicidade do nome se alterado.
   * OWASP A09 — audit log.
   */
  async editarConvenio(id: string, dto: EditarConvenioDTO) {
    const { adminId, ip, userAgent, nome, categoria } = dto;

    const convenio = await prisma.convenio.findUnique({ where: { id } });
    if (!convenio) throw new AppError('Convênio não encontrado', 404);

    // Valida duplicata de nome se foi alterado (case-insensitive)
    if (nome && nome.toLowerCase() !== convenio.nome.toLowerCase()) {
      const existente = await prisma.convenio.findFirst({
        where: { nome: { equals: nome, mode: 'insensitive' }, id: { not: id } },
      });
      if (existente) throw new AppError(`Já existe um convênio com o nome "${nome}"`, 409);
    }

    const atualizado = await prisma.convenio.update({
      where: { id },
      data: {
        ...(nome      !== undefined && { nome }),
        ...(categoria !== undefined && { categoria }),
      },
    });

    logger.info(
      { event: 'convenio_editado', convenioId: id, nome, categoria, adminId, ip, userAgent },
      `✏️  Convênio "${convenio.nome}" editado pelo admin ${adminId}`
    );

    return formatConvenio(atualizado);
  }

  /**
   * Alterna o status ativo/inativo de um convênio.
   * OWASP A09 — audit log.
   */
  async toggleConvenio(id: string, adminId: string, ip: string, userAgent: string) {
    const convenio = await prisma.convenio.findUnique({ where: { id } });
    if (!convenio) throw new AppError('Convênio não encontrado', 404);

    const novoStatus = !convenio.ativo;

    const atualizado = await prisma.convenio.update({
      where: { id },
      data:  { ativo: novoStatus },
    });

    logger.info(
      { event: 'convenio_toggle', convenioId: id, nome: convenio.nome, ativo: novoStatus, adminId, ip, userAgent },
      `🔄 Convênio "${convenio.nome}" ${novoStatus ? 'ativado' : 'desativado'} pelo admin ${adminId}`
    );

    return formatConvenio(atualizado);
  }

  /**
   * Exclui permanentemente um convênio.
   * OWASP A09 — log ANTES do delete (garante trilha mesmo se o delete falhar).
   */
  async excluirConvenio(id: string, adminId: string, ip: string, userAgent: string) {
    const convenio = await prisma.convenio.findUnique({ where: { id } });
    if (!convenio) throw new AppError('Convênio não encontrado', 404);

    logger.warn(
      { event: 'convenio_exclusao_iniciada', convenioId: id, nome: convenio.nome, adminId, ip, userAgent },
      `⚠️  Exclusão do convênio "${convenio.nome}" iniciada pelo admin ${adminId}`
    );

    await prisma.convenio.delete({ where: { id } });

    logger.warn(
      { event: 'convenio_excluido', convenioId: id, nome: convenio.nome, adminId, ip, userAgent },
      `🗑️  Convênio "${convenio.nome}" excluído permanentemente pelo admin ${adminId}`
    );

    return { deleted: true, id, nome: convenio.nome };
  }
}
