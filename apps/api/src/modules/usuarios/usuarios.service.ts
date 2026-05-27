import { prisma } from '@fitmax/database';
import { logger } from '../../lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserTipo = 'cliente' | 'profissional';

export interface ListUsuariosFilters {
  search?:  string;
  status?:  'ATIVO' | 'INATIVO' | 'BANIDO';
  tipo?:    UserTipo;
  page:     number;
  limit:    number;
}

export interface ModerarUsuarioDTO {
  id:        string;
  tipo:      UserTipo;
  adminId:   string;
  ip:        string;
  userAgent: string;
}

export interface BanirUsuarioDTO extends ModerarUsuarioDTO {
  motivo?: string;
}

export interface ToggleStatusDTO extends ModerarUsuarioDTO {
  novoStatus: 'ATIVO' | 'INATIVO';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** OWASP A05 — mascarar CPF em listagens: "***.***.678-90" */
function mascararCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  return cpf.replace(/^(\d{3}\.\d{3}\.)(\d{3}-\d{2})$/, '***.***.`$2`')
    .replace(/`/g, '');
}

function formatUsuario(
  u: { id: string; name: string; email: string; cpf: string | null; avatarUrl: string | null; status: string; plano: string | null; createdAt: Date },
  tipo: UserTipo,
  extra?: { especialidade?: string | null; registroProfissional?: string | null },
) {
  return {
    id:                   u.id,
    nome:                 u.name,
    email:                u.email,
    cpf:                  mascararCpf(u.cpf),
    avatarUrl:            u.avatarUrl,
    status:               u.status,
    plano:                u.plano,
    tipo,
    especialidade:        extra?.especialidade    ?? null,
    registroProfissional: extra?.registroProfissional ?? null,
    createdAt:            u.createdAt.toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class UsuariosService {

  /** Lista unificada de clientes + profissionais com filtros server-side */
  async list(filters: ListUsuariosFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { name:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { cpf:   { contains: q, mode: 'insensitive' } },
      ];
    }

    const incluirClientes      = !filters.tipo || filters.tipo === 'cliente';
    const incluirProfissionais = !filters.tipo || filters.tipo === 'profissional';

    const [clientes, profissionais, totalClientes, totalProfs] = await Promise.all([
      incluirClientes ? prisma.client.findMany({
        where,
        select: { id: true, name: true, email: true, cpf: true, avatarUrl: true, status: true, plano: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }) : Promise.resolve([]),
      incluirProfissionais ? prisma.professional.findMany({
        where,
        select: { id: true, name: true, email: true, cpf: true, avatarUrl: true, status: true, plano: true, createdAt: true, especialidade: true, registroProfissional: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }) : Promise.resolve([]),
      incluirClientes      ? prisma.client.count({ where })       : Promise.resolve(0),
      incluirProfissionais ? prisma.professional.count({ where }) : Promise.resolve(0),
    ]);

    const data = [
      ...clientes.map(c => formatUsuario(c, 'cliente')),
      ...profissionais.map(p => formatUsuario(p, 'profissional', { especialidade: p.especialidade, registroProfissional: p.registroProfissional })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = totalClientes + totalProfs;

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Resumo geral para badges e sidebar (Promise.all para eficiência — OWASP A04) */
  async resumo() {
    const [totalC, totalP, ativosC, ativosP, inativosC, inativosP, banidosC, banidosP] = await Promise.all([
      prisma.client.count(),
      prisma.professional.count(),
      prisma.client.count({ where: { status: 'ATIVO' } }),
      prisma.professional.count({ where: { status: 'ATIVO' } }),
      prisma.client.count({ where: { status: 'INATIVO' } }),
      prisma.professional.count({ where: { status: 'INATIVO' } }),
      prisma.client.count({ where: { status: 'BANIDO' } }),
      prisma.professional.count({ where: { status: 'BANIDO' } }),
    ]);
    return {
      total:           totalC + totalP,
      ativos:          ativosC + ativosP,
      inativos:        inativosC + inativosP,
      banidos:         banidosC + banidosP,
      profissionaisPro: totalP,
    };
  }

  /** Últimos cadastros (timeline sidebar) */
  async recentes(limit: number) {
    const [clientes, profissionais] = await Promise.all([
      prisma.client.findMany({
        select: { id: true, name: true, avatarUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.professional.findMany({
        select: { id: true, name: true, avatarUrl: true, especialidade: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return [
      ...clientes.map(c => ({ id: c.id, nome: c.name, avatarUrl: c.avatarUrl, tipo: 'cliente' as const, especialidade: null, createdAt: c.createdAt.toISOString() })),
      ...profissionais.map(p => ({ id: p.id, nome: p.name, avatarUrl: p.avatarUrl, tipo: 'profissional' as const, especialidade: p.especialidade, createdAt: p.createdAt.toISOString() })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /** Toggle ATIVO ↔ INATIVO (protege BANIDO) */
  async toggleStatus(dto: ToggleStatusDTO) {
    const { id, tipo, novoStatus, adminId, ip, userAgent } = dto;

    if (tipo === 'cliente') {
      const u = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário banido não pode ser ativado/desativado por este endpoint'), { statusCode: 422 });
      return prisma.client.update({ where: { id }, data: { status: novoStatus }, select: { id: true, status: true } });
    } else {
      const u = await prisma.professional.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário banido não pode ser ativado/desativado por este endpoint'), { statusCode: 422 });
      return prisma.professional.update({ where: { id }, data: { status: novoStatus }, select: { id: true, status: true } });
    }
    logger.info({ event: 'usuario_status_alterado', adminId, userId: id, tipo, novoStatus, ip, userAgent });
  }

  /** Banir usuário (OWASP A09 — audit log completo) */
  async banir(dto: BanirUsuarioDTO) {
    const { id, tipo, motivo, adminId, ip, userAgent } = dto;
    const agora = new Date();

    let resultado;
    if (tipo === 'cliente') {
      const u = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário já está banido'), { statusCode: 422 });
      resultado = await prisma.client.update({
        where: { id },
        data: { status: 'BANIDO', banidoPorId: adminId, banidoEm: agora, motivoBan: motivo ?? null },
        select: { id: true, status: true, banidoEm: true },
      });
    } else {
      const u = await prisma.professional.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status === 'BANIDO') throw Object.assign(new Error('Usuário já está banido'), { statusCode: 422 });
      resultado = await prisma.professional.update({
        where: { id },
        data: { status: 'BANIDO', banidoPorId: adminId, banidoEm: agora, motivoBan: motivo ?? null },
        select: { id: true, status: true, banidoEm: true },
      });
    }

    logger.warn({ event: 'usuario_banido', adminId, userId: id, tipo, motivo, ip, userAgent },
      `⛔ Usuário ${id} (${tipo}) banido pelo admin ${adminId}`);

    return resultado;
  }

  /** Restaurar usuário banido → ATIVO */
  async restaurar(dto: ModerarUsuarioDTO) {
    const { id, tipo, adminId, ip, userAgent } = dto;

    let resultado;
    if (tipo === 'cliente') {
      const u = await prisma.client.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status !== 'BANIDO') throw Object.assign(new Error('Usuário não está banido'), { statusCode: 422 });
      resultado = await prisma.client.update({
        where: { id },
        data: { status: 'ATIVO', banidoPorId: null, banidoEm: null, motivoBan: null },
        select: { id: true, status: true },
      });
    } else {
      const u = await prisma.professional.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!u) throw Object.assign(new Error('Usuário não encontrado'), { statusCode: 404 });
      if (u.status !== 'BANIDO') throw Object.assign(new Error('Usuário não está banido'), { statusCode: 422 });
      resultado = await prisma.professional.update({
        where: { id },
        data: { status: 'ATIVO', banidoPorId: null, banidoEm: null, motivoBan: null },
        select: { id: true, status: true },
      });
    }

    logger.info({ event: 'usuario_restaurado', adminId, userId: id, tipo, ip, userAgent },
      `✅ Usuário ${id} (${tipo}) restaurado pelo admin ${adminId}`);

    return resultado;
  }
}
