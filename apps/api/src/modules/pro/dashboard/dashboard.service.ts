import { prisma } from '@fitmax/database';

// Status map: Consulta DB status → visão do profissional
const STATUS_PRO_MAP: Record<string, string> = {
  PENDENTE: 'agendada',
  PAGO:     'concluida',
  ESTORNO:  'cancelada',
};

export class DashboardProService {

  /**
   * Resumo geral do dia para o dashboard do profissional.
   * OWASP A01 — profissionalId sempre vem do token JWT (nunca do body).
   */
  async summary(profissionalId: string) {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    const [consultasHoje, proximasConsultas, publicacoes, slotsDisponiveis] = await Promise.all([
      // Consultas do dia com agrupamento por status
      prisma.consulta.groupBy({
        by: ['status'],
        where: {
          profissionalId,
          dataHora: { gte: inicioDia, lte: fimDia },
        },
        _count: { id: true },
      }),

      // Próximas 3 consultas (a partir de agora)
      prisma.consulta.findMany({
        where: {
          profissionalId,
          dataHora: { gte: new Date() },
          status: 'PENDENTE',
        },
        select: {
          id: true,
          dataHora: true,
          especialidade: true,
          tipo: true,
          status: true,
          cliente: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { dataHora: 'asc' },
        take: 3,
      }),

      // Últimas 2 publicações ativas do feed (de todos)
      prisma.publicacao.findMany({
        where: { status: 'ATIVA' },
        select: {
          id: true,
          topico: true,
          imagemUrl: true,
          aspectRatio: true,
          likes: true,
          createdAt: true,
          profissional: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),

      // Slots disponíveis do dia
      prisma.disponibilidade.count({
        where: {
          profissionalId,
          dia: hoje.toISOString().slice(0, 10),
          estado: 'DISPONIVEL',
        },
      }),
    ]);

    // Agrega contadores de consultas do dia
    const contagemDia = { agendada: 0, concluida: 0, cancelada: 0 };
    for (const g of consultasHoje) {
      const key = STATUS_PRO_MAP[g.status] as keyof typeof contagemDia;
      if (key) contagemDia[key] += g._count.id;
    }

    return {
      dia: hoje.toISOString().slice(0, 10),
      consultas: {
        ...contagemDia,
        total: consultasHoje.reduce((acc, g) => acc + g._count.id, 0),
      },
      proximasConsultas: proximasConsultas.map(c => ({
        id:            c.id,
        dataHora:      c.dataHora.toISOString(),
        especialidade: c.especialidade,
        modalidade:    c.tipo,
        status:        STATUS_PRO_MAP[c.status] ?? c.status,
        paciente: {
          id:        c.cliente.id,
          nome:      c.cliente.name,
          avatarUrl: c.cliente.avatarUrl,
        },
      })),
      feedDestaques: publicacoes.map(p => ({
        id:          p.id,
        topico:      p.topico,
        imagemUrl:   p.imagemUrl,
        aspectRatio: p.aspectRatio,
        likes:       p.likes,
        criadoEm:   p.createdAt.toISOString(),
        profissional: {
          id:        p.profissional.id,
          nome:      p.profissional.name,
          avatarUrl: p.profissional.avatarUrl,
        },
      })),
      slotsDisponiveisHoje: slotsDisponiveis,
    };
  }
}
