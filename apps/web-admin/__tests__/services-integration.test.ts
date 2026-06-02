import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUsuarios, toggleStatus } from '../lib/usuarios-api';
import { fetchAssinaturas, criarPlano } from '../lib/assinaturas-api';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Backend Services Integration (Data Fetching)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Usuarios Service', () => {
    it('fetchUsuarios correctly formats complex query params', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [], meta: {} } } as any);

      await fetchUsuarios({ search: 'João e Maria', status: 'ATIVO', page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/admin/usuarios?'));
      const calledUrl = vi.mocked(api.get).mock.calls[0][0];
      // URLSearchParams encodes spaces as '+'
      expect(calledUrl).toContain('search=Jo%C3%A3o+e+Maria');
      expect(calledUrl).toContain('status=ATIVO');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
    });

    it('toggleStatus sends the correct PATCH payload', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} } as any);

      await toggleStatus('uuid-123', 'cliente', 'INATIVO');

      expect(api.patch).toHaveBeenCalledWith('/admin/usuarios/uuid-123/status', {
        tipo: 'cliente',
        novoStatus: 'INATIVO',
      });
    });
  });

  describe('Assinaturas Service', () => {
    it('fetchAssinaturas applies optional audience parameter', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { planos: [], stats: {} } } as any);

      await fetchAssinaturas('CLIENTE');

      expect(api.get).toHaveBeenCalledWith('/admin/assinaturas', {
        params: { audiencia: 'CLIENTE' }
      });
    });

    it('criarPlano sends the complete POST payload', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'plano-1' } } as any);

      const payload = {
        nome: 'Plano Pro',
        tipo: 'MENSAL' as const,
        audiencia: 'PROFISSIONAL' as const,
        valor: 99.9,
        consultas: 5,
        taxa: 10
      };

      await criarPlano(payload);

      expect(api.post).toHaveBeenCalledWith('/admin/assinaturas', payload);
    });
  });
});
