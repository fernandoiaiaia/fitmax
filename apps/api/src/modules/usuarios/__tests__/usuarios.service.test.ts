import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuariosService } from '../usuarios.service';
import { prisma } from '@fitmax/database';

// Mock do Prisma Client importado de @fitmax/database
vi.mock('@fitmax/database', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    professional: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('UsuariosService (Backend Unit Tests - web-admin)', () => {
  const service = new UsuariosService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====================================================
  // 1. Testes de Listagem e Máscara de CPF (OWASP A05)
  // ====================================================
  describe('list', () => {
    it('correctly fetches, merges, sorts and masks CPF in user listings', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Carlos Mendes',
        email: 'carlos@email.com',
        cpf: '123.456.789-00',
        avatarUrl: '/carlos.png',
        status: 'ATIVO',
        plano: 'PREMIUM',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
      };

      const mockPro = {
        id: 'pro-1',
        name: 'Dr. Rafael Costa',
        email: 'rafael@email.com',
        cpf: '987.654.321-99',
        avatarUrl: '/rafael.png',
        status: 'ATIVO',
        plano: null,
        especialidade: 'Cardiologia',
        registroProfissional: 'CRM 12345',
        createdAt: new Date('2026-06-01T11:00:00.000Z'), // mais recente
      };

      vi.mocked(prisma.client.findMany).mockResolvedValueOnce([mockClient] as any);
      vi.mocked(prisma.professional.findMany).mockResolvedValueOnce([mockPro] as any);
      vi.mocked(prisma.client.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.professional.count).mockResolvedValueOnce(1);

      const result = await service.list({ page: 1, limit: 10 });

      // Verificações
      expect(result.meta.total).toBe(2);
      expect(result.data.length).toBe(2);

      // Dr. Rafael Costa deve vir primeiro porque foi criado às 11:00 (descending order sort)
      expect(result.data[0].id).toBe('pro-1');
      expect(result.data[0].nome).toBe('Dr. Rafael Costa');
      expect(result.data[0].tipo).toBe('profissional');
      expect(result.data[0].especialidade).toBe('Cardiologia');
      expect(result.data[0].registroProfissional).toBe('CRM 12345');
      // CPF mascarado corretamente: "***.***.321-99"
      expect(result.data[0].cpf).toBe('***.***.321-99');

      // Carlos Mendes deve vir em segundo
      expect(result.data[1].id).toBe('client-1');
      expect(result.data[1].nome).toBe('Carlos Mendes');
      expect(result.data[1].tipo).toBe('cliente');
      expect(result.data[1].plano).toBe('PREMIUM');
      // CPF mascarado corretamente: "***.***.789-00"
      expect(result.data[1].cpf).toBe('***.***.789-00');
    });
  });

  // ====================================================
  // 2. Teste do Resumo Geral (Promise.all - OWASP A04)
  // ====================================================
  describe('resumo', () => {
    it('aggregates total, active, inactive, and banished counts across clients and professionals', async () => {
      // Mock das contagens do Promise.all
      vi.mocked(prisma.client.count)
        .mockResolvedValueOnce(10) // total clientes
        .mockResolvedValueOnce(7)  // ativos clientes
        .mockResolvedValueOnce(2)  // inativos clientes
        .mockResolvedValueOnce(1); // banidos clientes

      vi.mocked(prisma.professional.count)
        .mockResolvedValueOnce(5)  // total profissionais
        .mockResolvedValueOnce(4)  // ativos profissionais
        .mockResolvedValueOnce(1)  // inativos profissionais
        .mockResolvedValueOnce(0); // banidos profissionais

      const result = await service.resumo();

      expect(result.total).toBe(15);
      expect(result.ativos).toBe(11);
      expect(result.inativos).toBe(3);
      expect(result.banidos).toBe(1);
      expect(result.profissionaisPro).toBe(5);
    });
  });

  // ====================================================
  // 3. Testes do Alterador de Status (Toggle Status)
  // ====================================================
  describe('toggleStatus', () => {
    const dto = {
      id: 'user-1',
      tipo: 'cliente' as const,
      novoStatus: 'INATIVO' as const,
      adminId: 'admin-uuid',
      ip: '127.0.0.1',
      userAgent: 'Vitest',
    };

    it('successfully changes status from ATIVO to INATIVO for a client', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'ATIVO' } as any);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({ id: 'user-1', status: 'INATIVO' } as any);

      const result = await service.toggleStatus(dto);
      expect(result.status).toBe('INATIVO');
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'INATIVO' },
        select: { id: true, status: true },
      });
    });

    it('throws 422 error if trying to toggle status of a BANIDO user', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'BANIDO' } as any);

      await expect(service.toggleStatus(dto)).rejects.toMatchObject({
        statusCode: 422,
        message: 'Usuário banido não pode ser ativado/desativado por este endpoint',
      });
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('throws 404 error if user is not found', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce(null);

      await expect(service.toggleStatus(dto)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Usuário não encontrado',
      });
    });
  });

  // ====================================================
  // 4. Testes de Banimento (Banir)
  // ====================================================
  describe('banir', () => {
    const dto = {
      id: 'pro-1',
      tipo: 'profissional' as const,
      motivo: 'Comportamento inadequado',
      adminId: 'admin-uuid',
      ip: '127.0.0.1',
      userAgent: 'Vitest',
    };

    it('successfully banishes a professional and populates ban columns', async () => {
      vi.mocked(prisma.professional.findUnique).mockResolvedValueOnce({ id: 'pro-1', status: 'ATIVO' } as any);
      vi.mocked(prisma.professional.update).mockResolvedValueOnce({ id: 'pro-1', status: 'BANIDO' } as any);

      const result = await service.banir(dto);
      expect(result.status).toBe('BANIDO');
      expect(prisma.professional.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'pro-1' },
        data: expect.objectContaining({
          status: 'BANIDO',
          banidoPorId: 'admin-uuid',
          motivoBan: 'Comportamento inadequado',
          banidoEm: expect.any(Date),
        }),
      }));
    });

    it('throws 422 error if user is already banished', async () => {
      vi.mocked(prisma.professional.findUnique).mockResolvedValueOnce({ id: 'pro-1', status: 'BANIDO' } as any);

      await expect(service.banir(dto)).rejects.toMatchObject({
        statusCode: 422,
        message: 'Usuário já está banido',
      });
      expect(prisma.professional.update).not.toHaveBeenCalled();
    });

    it('throws 422 error if client is already banished', async () => {
      const clientDto = { ...dto, tipo: 'cliente' as const };
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'client-1', status: 'BANIDO' } as any);

      await expect(service.banir(clientDto)).rejects.toMatchObject({
        statusCode: 422,
        message: 'Usuário já está banido',
      });
      expect(prisma.client.update).not.toHaveBeenCalled();
    });
  });

  // ====================================================
  // 5. Testes de Restauração (Restaurar)
  // ====================================================
  describe('restaurar', () => {
    const dto = {
      id: 'client-1',
      tipo: 'cliente' as const,
      adminId: 'admin-uuid',
      ip: '127.0.0.1',
      userAgent: 'Vitest',
    };

    it('successfully restores a banished client back to ATIVO status', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'client-1', status: 'BANIDO' } as any);
      vi.mocked(prisma.client.update).mockResolvedValueOnce({ id: 'client-1', status: 'ATIVO' } as any);

      const result = await service.restaurar(dto);
      expect(result.status).toBe('ATIVO');
      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: {
          status: 'ATIVO',
          banidoPorId: null,
          banidoEm: null,
          motivoBan: null,
        },
        select: { id: true, status: true },
      });
    });

    it('throws 422 error if user is not banished', async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValueOnce({ id: 'client-1', status: 'ATIVO' } as any);

      await expect(service.restaurar(dto)).rejects.toMatchObject({
        statusCode: 422,
        message: 'Usuário não está banido',
      });
      expect(prisma.client.update).not.toHaveBeenCalled();
    });
  });
});
