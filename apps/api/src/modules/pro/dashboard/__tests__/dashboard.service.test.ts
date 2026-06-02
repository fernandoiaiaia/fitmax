import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardProService } from '../dashboard.service';
import { prisma } from '@fitmax/database';

// Mock do prisma client
vi.mock('@fitmax/database', () => ({
  prisma: {
    consulta: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    publicacao: {
      findMany: vi.fn(),
    },
    disponibilidade: {
      count: vi.fn(),
    },
  },
}));

describe('DashboardProService (Backend Unit Tests)', () => {
  const service = new DashboardProService();
  const mockProId = 'pro-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly fetches, aggregates and formats dashboard summary data', async () => {
    const mockHoje = new Date();

    // 1. Mock do groupBy para consultas de hoje (PENDENTE = agendada, PAGO = concluida)
    vi.mocked(prisma.consulta.groupBy).mockResolvedValueOnce([
      { status: 'PENDENTE', _count: { id: 2 } },
      { status: 'PAGO', _count: { id: 1 } },
    ] as any);

    // 2. Mock do findMany para próximas consultas pendentes
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([
      {
        id: 'c-1',
        dataHora: new Date(mockHoje.getTime() + 3600000), // daqui a 1 hora
        especialidade: 'Fisioterapia',
        tipo: 'PRESENCIAL',
        status: 'PENDENTE',
        cliente: {
          id: 'cli-1',
          name: 'Carlos Mendes',
          avatarUrl: '/carlos.png',
        },
      },
    ] as any);

    // 3. Mock do findMany para publicações do feed ativas
    vi.mocked(prisma.publicacao.findMany).mockResolvedValueOnce([
      {
        id: 'pub-1',
        topico: 'Dicas de Corrida',
        imagemUrl: '/running.png',
        aspectRatio: '16:9',
        likes: 12,
        createdAt: new Date(),
        profissional: {
          id: 'pro-1',
          name: 'Dra. Ana Souza',
          avatarUrl: '/ana.png',
        },
      },
    ] as any);

    // 4. Mock de count de disponibilidades
    vi.mocked(prisma.disponibilidade.count).mockResolvedValueOnce(5);

    const result = await service.summary(mockProId);

    // Assertions
    // A. Formato da data de hoje (YYYY-MM-DD)
    expect(result.dia).toBe(mockHoje.toISOString().slice(0, 10));

    // B. Agrupamento e contagem de consultas
    expect(result.consultas.total).toBe(3);
    expect(result.consultas.agendada).toBe(2);
    expect(result.consultas.concluida).toBe(1);
    expect(result.consultas.cancelada).toBe(0);

    // C. Mapeamento de próximas consultas
    expect(result.proximasConsultas.length).toBe(1);
    expect(result.proximasConsultas[0]).toEqual({
      id: 'c-1',
      dataHora: expect.any(String),
      especialidade: 'Fisioterapia',
      modalidade: 'PRESENCIAL',
      status: 'agendada',
      paciente: {
        id: 'cli-1',
        nome: 'Carlos Mendes',
        avatarUrl: '/carlos.png',
      },
    });

    // D. Mapeamento de destaques do feed
    expect(result.feedDestaques.length).toBe(1);
    expect(result.feedDestaques[0]).toEqual({
      id: 'pub-1',
      topico: 'Dicas de Corrida',
      imagemUrl: '/running.png',
      aspectRatio: '16:9',
      likes: 12,
      criadoEm: expect.any(String),
      profissional: {
        id: 'pro-1',
        nome: 'Dra. Ana Souza',
        avatarUrl: '/ana.png',
      },
    });

    // E. Slots de agenda
    expect(result.slotsDisponiveisHoje).toBe(5);

    // F. Garante que os filtros do prisma foram construídos corretamente
    expect(prisma.consulta.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        profissionalId: mockProId,
      }),
    }));
    expect(prisma.disponibilidade.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        profissionalId: mockProId,
        estado: 'DISPONIVEL',
      }),
    }));
  });

  it('handles empty states elegantly when no consultations or publications exist', async () => {
    vi.mocked(prisma.consulta.groupBy).mockResolvedValueOnce([]);
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.publicacao.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.disponibilidade.count).mockResolvedValueOnce(0);

    const result = await service.summary(mockProId);

    expect(result.consultas.total).toBe(0);
    expect(result.consultas.agendada).toBe(0);
    expect(result.consultas.concluida).toBe(0);
    expect(result.proximasConsultas.length).toBe(0);
    expect(result.feedDestaques.length).toBe(0);
    expect(result.slotsDisponiveisHoje).toBe(0);
  });
});
