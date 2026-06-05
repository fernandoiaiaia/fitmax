import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ConsultasPage from '../app/painel/consultas/page';
import ConsultaDetalhePage from '../app/painel/consultas/agendar/page';
import { api } from '../lib/api';

// Mock do next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      const params: Record<string, string> = {
        id: "42",
        nome: "Mariana Ferreira",
        especialidade: "Cardiologia",
        data: "Hoje, 23/04",
        horario: "13:00",
        modalidade: "Online",
        status: "a_confirmar",
        avatar: "",
        dataHoraISO: "2026-04-23T13:00:00.000Z",
      };
      return params[key] || null;
    }
  }),
}));

// Mock do Axios cliente
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Helper para gerar consultas fictícias massivas
const generateMockConsultas = (count: number) => {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      id: i,
      dataHora: '2026-04-23T09:00:00.000Z',
      paciente: {
        nome: `Paciente Escalável ${i}`,
        avatarUrl: null,
      },
      especialidade: 'Cardiologia',
      modalidade: 'ONLINE',
      status: 'agendada',
    });
  }
  return list;
};

const mockSummary = {
  total: 20,
  agendada: 15,
  cancelada: 5,
};

const mockResumoPeriodo = {
  agendamentos: 20,
  variacaoPctAgendamentos: 10,
  valorGeradoReais: 5000,
  variacaoPctValor: 15,
  tempoMedioMinutos: 30,
};

describe('Web-Pro Frontend Scalability, Performance & Debounce Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Stress Test: Renders 1,000 consultas efficiently in less than 5000ms', async () => {
    const mockList = generateMockConsultas(1000);

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/pro/consultas/summary')) {
        return Promise.resolve({ data: mockSummary });
      }
      if (url.includes('/pro/consultas/resumo-periodo')) {
        return Promise.resolve({ data: mockResumoPeriodo });
      }
      return Promise.resolve({ data: { data: mockList } });
    });

    const startTime = performance.now();

    render(<ConsultasPage />);

    // Espera até que a página saia do estado de loading e exiba a lista de consultas
    const listCountHeader = await screen.findByText('1000 consultas encontradas');
    expect(listCountHeader).toBeInTheDocument();

    const titleElements = screen.getAllByText(/Paciente Escalável/);
    expect(titleElements.length).toBe(1000);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERFORMANCE] Rendered 1,000 components in ${duration.toFixed(2)}ms`);

    // A renderização massiva de 1000 linhas DOM complexas no JSDOM deve ser inferior a 5000ms
    expect(duration).toBeLessThan(5000);
  });

  it('Debounce Stress: Search input restricts API calls to exactly 1 request during event flooding', async () => {
    vi.useFakeTimers();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/pro/consultas/summary')) {
        return Promise.resolve({ data: mockSummary });
      }
      if (url.includes('/pro/consultas/resumo-periodo')) {
        return Promise.resolve({ data: mockResumoPeriodo });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<ConsultasPage />);

    // Aguarda a renderização inicial
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Limpa mocks para isolar estritamente o evento de digitação rápida
    vi.mocked(api.get).mockClear();

    const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
    expect(searchInput).toBeInTheDocument();

    // Event Flooding - Simula digitação extremamente rápida de 30 caracteres
    const textToType = 'Guilherme Augusto Escalabilidade';
    for (let i = 0; i < textToType.length; i++) {
      const partialValue = textToType.substring(0, i + 1);
      fireEvent.change(searchInput, { target: { value: partialValue } });
    }

    // O debounce de 300ms deve segurar qualquer requisição à API de consultas imediatamente
    const getCalls = vi.mocked(api.get).mock.calls.filter(c => c[0].includes('/pro/consultas?'));
    expect(getCalls.length).toBe(0);

    // Avança 200ms (ainda não disparou)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    const getCallsMid = vi.mocked(api.get).mock.calls.filter(c => c[0].includes('/pro/consultas?'));
    expect(getCallsMid.length).toBe(0);

    // Avança mais 100ms (total de 300ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Deve ter chamado exatamente 1 vez com o parâmetro de busca completo
    const finalCalls = vi.mocked(api.get).mock.calls.filter(c => c[0].includes('/pro/consultas?'));
    expect(finalCalls.length).toBe(1);
    expect(finalCalls[0][0]).toContain('search=Guilherme Augusto Escalabilidade');
  });

  it('Concurrency Protection: Blocks redundant click events during network latency', async () => {
    // Cria uma promise pendente para simular latência de rede na chamada PATCH
    let resolvePromise: (value: any) => void = () => {};
    const apiCallPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(api.patch).mockImplementation(() => apiCallPromise as any);

    render(<ConsultaDetalhePage />);

    // Clica no card Confirmar para abrir a tela de confirmação
    const menuCard = await screen.findByText('Confirmar');
    fireEvent.click(menuCard);

    // Encontra o botão de ação principal
    const confirmBtn = await screen.findByText('Confirmar ✅');
    expect(confirmBtn).toBeInTheDocument();

    // Dispara múltiplos cliques concorrentes ultrarrápidos (ex: duplo ou triplo clique)
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    // O botão deve ser desabilitado imediatamente e a chamada de API disparada apenas 1 vez
    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(confirmBtn).toBeDisabled();

    // Resolve a API pendente
    await act(async () => {
      resolvePromise({ data: { success: true } });
      // Aguarda microtasks limparem
      await Promise.resolve();
    });

    // Comprova que após a resolução, o feedback de sucesso é renderizado
    await waitFor(() => {
      expect(screen.getByText('Consulta Confirmada!')).toBeInTheDocument();
    });
  });
});
