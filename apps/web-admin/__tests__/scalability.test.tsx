import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import UsuariosAdminPage from '../app/painel/usuarios/page';
import * as usuariosApi from '../lib/usuarios-api';

// Mock das chamadas de API
vi.mock('../lib/usuarios-api', () => ({
  fetchUsuarios: vi.fn(),
  fetchResumo: vi.fn(),
  fetchRecentes: vi.fn(),
  toggleStatus: vi.fn(),
  banirUsuario: vi.fn(),
  restaurarUsuario: vi.fn(),
  formatDate: (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR');
  },
}));

// Função auxiliar para gerar usuários fictícios em grande volume
const generateMockUsers = (count: number): usuariosApi.UsuarioItem[] => {
  const users: usuariosApi.UsuarioItem[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-${i}`,
      nome: `Usuário Escalável ${i}`,
      email: `user.${i}@fitmax.com`,
      cpf: `123.456.789-${String(i % 100).padStart(2, '0')}`,
      avatarUrl: null,
      status: i % 3 === 0 ? 'ATIVO' : i % 3 === 1 ? 'INATIVO' : 'BANIDO',
      plano: i % 2 === 0 ? 'Plano Pro' : null,
      tipo: i % 2 === 0 ? 'profissional' : 'cliente',
      especialidade: i % 2 === 0 ? 'Personal Trainer' : null,
      registroProfissional: i % 2 === 0 ? 'CREF-12345' : null,
      createdAt: '2026-01-01T12:00:00.000Z',
    });
  }
  return users;
};

// Resumo padrão mockado
const mockResumo: usuariosApi.Resumo = {
  total: 2000,
  ativos: 667,
  inativos: 667,
  banidos: 666,
  profissionaisPro: 1000,
};

// Últimos cadastros padrão mockados
const mockRecentes: usuariosApi.RecenteItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `recent-${i}`,
  nome: `Recente ${i}`,
  avatarUrl: null,
  tipo: i % 2 === 0 ? 'profissional' : 'cliente',
  especialidade: i % 2 === 0 ? 'Nutricionista' : null,
  createdAt: '2026-05-30T10:00:00.000Z',
}));

describe('Front-End Scalability & Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Stress Test: Renders 1,000 users efficiently without breaking', async () => {
    const mockUsers = generateMockUsers(1000);
    
    vi.mocked(usuariosApi.fetchUsuarios).mockResolvedValue({
      data: mockUsers,
      meta: { total: 1000, page: 1, limit: 1000, totalPages: 1 },
    });
    vi.mocked(usuariosApi.fetchResumo).mockResolvedValue(mockResumo);
    vi.mocked(usuariosApi.fetchRecentes).mockResolvedValue(mockRecentes);

    // Mede tempo de carregamento e renderização inicial
    const startTime = performance.now();

    render(<UsuariosAdminPage />);

    // Espera até que a lista de usuários seja renderizada (saindo do estado de loading)
    await screen.findByText('Gestão de Usuários');
    
    // Verifica se os elementos e a lista estão presentes
    const titleElements = screen.getAllByText(/Usuário Escalável/);
    expect(titleElements.length).toBe(1000);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERFORMANCE] Rendered 1,000 components in ${duration.toFixed(2)}ms`);
    
    // O tempo limite razoável para 1000 componentes DOM complexos em ambiente JSDOM virtualizado é de ~5000ms
    expect(duration).toBeLessThan(5000); 
  });

  it('Debounce Stress: Handles rapid typing (event flooding) in search box correctly', async () => {
    vi.useFakeTimers();

    vi.mocked(usuariosApi.fetchUsuarios).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 1 },
    });
    vi.mocked(usuariosApi.fetchResumo).mockResolvedValue(mockResumo);
    vi.mocked(usuariosApi.fetchRecentes).mockResolvedValue(mockRecentes);

    render(<UsuariosAdminPage />);

    // Aguarda carregar a renderização inicial
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nome, CPF ou e-mail...');

    // Limpa chamadas iniciais para focar estritamente no debounce
    vi.mocked(usuariosApi.fetchUsuarios).mockClear();

    // Simula "Event Flooding" - digitação ultra rápida de 50 caracteres (um por um)
    const textToType = 'fitmax_scalability_test_query';
    for (let i = 0; i < textToType.length; i++) {
      const partialSearchValue = textToType.substring(0, i + 1);
      fireEvent.change(searchInput, { target: { value: partialSearchValue } });
    }

    // A busca não deve ter sido chamada ainda devido ao debounce de 300ms
    expect(usuariosApi.fetchUsuarios).not.toHaveBeenCalled();

    // Avança 200ms (ainda não deve rodar)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(usuariosApi.fetchUsuarios).not.toHaveBeenCalled();

    // Avança mais 100ms (total de 300ms do debounce)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Deve ter disparado EXATAMENTE UMA chamada para a API com o texto completo
    expect(usuariosApi.fetchUsuarios).toHaveBeenCalledTimes(1);
    expect(usuariosApi.fetchUsuarios).toHaveBeenCalledWith(expect.objectContaining({
      search: 'fitmax_scalability_test_query',
    }));
  });

  it('Concurrency Protection: Prevents double/multiple rapid clicks from sending redundant API requests', async () => {
    const singleUser = generateMockUsers(1);
    
    vi.mocked(usuariosApi.fetchUsuarios).mockResolvedValue({
      data: singleUser,
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });
    vi.mocked(usuariosApi.fetchResumo).mockResolvedValue(mockResumo);
    vi.mocked(usuariosApi.fetchRecentes).mockResolvedValue(mockRecentes);

    // Cria uma promise pendente para simular latência de rede no toggleStatus
    let resolvePromise: (value: any) => void = () => {};
    const apiCallPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(usuariosApi.toggleStatus).mockImplementation(() => apiCallPromise as any);

    render(<UsuariosAdminPage />);

    // Espera renderizar o usuário
    const activeToggleBtn = await screen.findByTitle('Desativar');
    expect(activeToggleBtn).toBeInTheDocument();

    // Dispara múltiplos cliques concorrentes ultrarrápidos (ex: clique duplo ou triplo acidental)
    fireEvent.click(activeToggleBtn);
    fireEvent.click(activeToggleBtn);
    fireEvent.click(activeToggleBtn);

    // O status do botão deve ter ido para desabilitado e a API deve ter sido chamada somente UMA vez
    expect(usuariosApi.toggleStatus).toHaveBeenCalledTimes(1);
    expect(activeToggleBtn).toBeDisabled();

    // Resolve a API pendente
    await act(async () => {
      resolvePromise(null);
      // Aguarda o esvaziamento da fila de microtarefas (toggleStatus -> loadData -> finally)
      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
      }
    });

    // UI deve destravar após a resolução
    await waitFor(() => {
      const btn = screen.getByTitle('Desativar');
      expect(btn).not.toBeDisabled();
    });
  });
});
