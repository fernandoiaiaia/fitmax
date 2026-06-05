import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardClientService } from '../dashboard.service';
import { prisma } from '../../../../lib/prisma';

// Mock do prisma client
vi.mock('../../../../lib/prisma', () => ({
  prisma: {
    consulta: {
      findMany: vi.fn(),
    },
    publicacao: {
      findMany: vi.fn(),
    },
  },
}));

describe('DashboardClientService (Backend Patient Unit Tests)', () => {
  const service = new DashboardClientService();
  const mockClientId = 'client-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly retrieves and maps patient dashboard overview data', async () => {
    const mockNow = new Date();

    // 1. Mock do findMany para destaques do feed (4 publicações mais recentes)
    vi.mocked(prisma.publicacao.findMany).mockResolvedValueOnce([
      { id: 'pub-1', imagemUrl: '/pub1.png' },
      { id: 'pub-2', imagemUrl: '/pub2.png' },
    ] as any);

    // 2. Mock do findMany para consultas pendentes (próximas 3 consultas futuras)
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([
      {
        id: 'cons-1',
        dataHora: new Date(mockNow.getTime() + 3600000), // daqui a 1 hora
        especialidade: 'Nutrição',
        tipo: 'ONLINE',
        status: 'PENDENTE',
        profissional: {
          name: 'Dra. Ana Souza',
          especialidade: 'Nutrição',
          avatarUrl: '/avatar1.png',
        },
      },
    ] as any);

    // 3. Mock do findMany para agenda de hoje
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([
      {
        id: 'cons-today',
        dataHora: new Date(mockNow.getTime() + 7200000), // daqui a 2 horas (ainda hoje)
        especialidade: 'Fisioterapia',
        tipo: 'ONLINE',
        status: 'PENDENTE',
        profissional: {
          name: 'Dr. Roberto Alves',
          especialidade: 'Fisioterapia',
          avatarUrl: '/avatar2.png',
        },
      },
    ] as any);

    const result = await service.getOverview(mockClientId);

    // Assertions
    expect(result.feed.length).toBe(2);
    expect(result.feed[0]).toEqual({ id: 'pub-1', imagemUrl: '/pub1.png' });

    expect(result.consultas.length).toBe(1);
    expect(result.consultas[0].profissional.name).toBe('Dra. Ana Souza');
    expect(result.consultas[0].especialidade).toBe('Nutrição');

    expect(result.agenda.length).toBe(1);
    expect(result.agenda[0].profissional.name).toBe('Dr. Roberto Alves');

    // Verifica que filtros do prisma foram montados com clientId correto
    expect(prisma.consulta.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        clienteId: mockClientId,
        status: 'PENDENTE',
      }),
    }));

    expect(prisma.consulta.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({
        clienteId: mockClientId,
      }),
    }));
  });

  it('handles empty fallback states gracefully when database has no events', async () => {
    vi.mocked(prisma.publicacao.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([]); // consultas pendentes
    vi.mocked(prisma.consulta.findMany).mockResolvedValueOnce([]); // agenda de hoje

    const result = await service.getOverview(mockClientId);

    expect(result.feed.length).toBe(0);
    expect(result.consultas.length).toBe(0);
    expect(result.agenda.length).toBe(0);
  });
});
