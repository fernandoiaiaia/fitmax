import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../middlewares/errorHandler';

export class DashboardClientService {
  async getOverview(clientId: string) {
    // 1. Destaques do Feed: 4 publicações mais recentes ativas
    const feed = await prisma.publicacao.findMany({
      where: { status: 'ATIVA' },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        imagemUrl: true,
      },
    });

    // 2. Consultas Pendentes: próximas 3 consultas futuras
    const now = new Date();
    const consultasPendentes = await prisma.consulta.findMany({
      where: {
        clienteId: clientId,
        status: 'PENDENTE',
        dataHora: { gte: now },
      },
      orderBy: { dataHora: 'asc' },
      take: 3,
      include: {
        profissional: {
          select: {
            name: true,
            especialidade: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 3. Agenda de Hoje: todas as consultas do cliente marcadas para hoje
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const agendaHoje = await prisma.consulta.findMany({
      where: {
        clienteId: clientId,
        dataHora: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { dataHora: 'asc' },
      include: {
        profissional: {
          select: {
            name: true,
            especialidade: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      feed,
      consultas: consultasPendentes,
      agenda: agendaHoje,
    };
  }
}
