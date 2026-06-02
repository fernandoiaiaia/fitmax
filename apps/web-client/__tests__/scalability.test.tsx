// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import { Suspense } from 'react';
import ConsultasPage from '../app/painel/consultas/page';
import AgendarConsultaPage from '../app/painel/consultas/agendar/page';
import {
  listarConsultas,
  statsConsultas,
  agendarConsulta,
  listarEspecialidades,
  listarProfissionais,
  buscarDisponibilidade,
  listarConvenios,
} from '../lib/consultas-api';

// Mock do next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      const params: Record<string, string> = {
        nome: 'Dra. Patricia',
        especialidade: 'Nutrição',
        data: 'Hoje',
        horario: '14:00',
        modalidade: 'Online',
        status: 'agendada',
        avatar: '',
      };
      return params[key] || null;
    },
  }),
}));

// Mock das funções de API do paciente
vi.mock('../lib/consultas-api', () => ({
  listarConsultas: vi.fn(),
  statsConsultas: vi.fn(),
  agendarConsulta: vi.fn(),
  reagendarConsulta: vi.fn(),
  listarProfissionais: vi.fn(),
  listarEspecialidades: vi.fn(),
  buscarDisponibilidade: vi.fn(),
  listarConvenios: vi.fn(),
}));

const mockStats = {
  totalConsultas: 10,
  totalInvestidoReais: '2500.00',
  consultasHoje: 1,
  confirmadas: 8,
  pendentes: 1,
  proximaEm: '14:00',
};

// Helper para gerar consultas fictícias massivas
const generateMockConsultas = (count: number) => {
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      id: `c-${i}`,
      dataHora: '2026-06-02T14:00:00.000Z',
      profissional: {
        id: `p-${i}`,
        name: `Profissional Escalável ${i}`,
        avatarUrl: null,
        especialidade: 'Nutrição',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      especialidade: 'Nutrição',
      tipo: 'ONLINE',
      valorReais: '250.00',
      taxaPlataforma: 15,
      statusFluxo: 'consulta_confirmada' as any,
      repasseEm: null,
      estornoMotivo: null,
      criadoEm: '2026-06-01T12:00:00.000Z',
    });
  }
  return {
    data: list,
    meta: { total: count, page: 1, limit: count, totalPages: 1 },
  };
};

describe('Web-Client Frontend Scalability, Performance & Concurrency Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('Stress Test: Renders 1,000 patient consultations efficiently in less than 5000ms', async () => {
    const mockList = generateMockConsultas(1000);
    vi.mocked(listarConsultas).mockResolvedValueOnce(mockList);
    vi.mocked(statsConsultas).mockResolvedValueOnce(mockStats);

    const startTime = performance.now();

    render(<ConsultasPage />);

    // Espera até sair do loading
    const listCountHeader = await screen.findByText('1000 consultas encontradas');
    expect(listCountHeader).toBeDefined();

    const titleElements = screen.getAllByText(/Profissional Escalável/);
    expect(titleElements.length).toBe(1000);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`[PERFORMANCE] Rendered 1,000 patient rows in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(5000);
  });

  it('Debounce Stress: Search input restricts professional lookup API calls to exactly 1 request during typing flood', async () => {
    vi.useFakeTimers();
    vi.mocked(listarConsultas).mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
    vi.mocked(statsConsultas).mockResolvedValue(mockStats);

    render(<ConsultasPage />);

    // Aguarda inicialização
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    vi.mocked(listarConsultas).mockClear();

    const searchInput = screen.getByPlaceholderText('Buscar por profissional...');
    expect(searchInput).toBeDefined();

    // Event Flooding: 30 digitações extremamente rápidas
    const textToType = 'Dra. Patricia Nutricionista Especialista';
    for (let i = 0; i < textToType.length; i++) {
      const val = textToType.substring(0, i + 1);
      fireEvent.change(searchInput, { target: { value: val } });
    }

    // O debounce de 300ms deve reter qualquer chamada imediata
    expect(listarConsultas).not.toHaveBeenCalled();

    // Avança 200ms
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(listarConsultas).not.toHaveBeenCalled();

    // Avança mais 100ms (total 300ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Deve ter sido chamado exatamente uma vez com o termo final
    expect(listarConsultas).toHaveBeenCalledTimes(1);
    expect(listarConsultas).toHaveBeenCalledWith(expect.objectContaining({ search: 'Dra. Patricia Nutricionista Especialista' }));
  });

  it('Concurrency Protection: Blocks redundant scheduling submissions during network latency', async () => {
    // 1. Mock de todas as etapas do agendamento
    vi.mocked(listarConvenios).mockResolvedValue([]);
    vi.mocked(listarEspecialidades).mockResolvedValue(['Cardiologia']);
    vi.mocked(listarProfissionais).mockResolvedValue([
      {
        id: 'pro-1',
        name: 'Dr. Roberto',
        avatarUrl: null,
        especialidade: 'Cardiologia',
        cidade: 'São Paulo',
        uf: 'SP',
        registroProfissional: 'CRM 12345',
      },
    ]);
    vi.mocked(buscarDisponibilidade).mockResolvedValue([
      { hora: '10:00', modalidade: 'Online', endereco: 'Rua Verde, 100', ocupado: false },
    ]);

    // Mock do agendarConsulta com latência de rede
    let resolvePromise: (value: any) => void = () => {};
    const apiCallPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(agendarConsulta).mockImplementation(() => apiCallPromise as any);

    render(
      <Suspense fallback={null}>
        <AgendarConsultaPage />
      </Suspense>
    );

    // Passo 0: Escolher Online
    const onlineCard = await screen.findByText('Online');
    fireEvent.click(onlineCard);
    const nextBtn0 = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn0);

    // Passo 1: Convênio (Particular)
    const naoBtn = await screen.findByRole('button', { name: /^Não$/i });
    fireEvent.click(naoBtn);
    const nextBtn1 = await screen.findByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn1);

    // Passo 2: Especialidade
    const espCard = await screen.findByText('Cardiologia');
    fireEvent.click(espCard);
    const nextBtn2 = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn2);

    // Passo 3: Profissional
    const proCard = await screen.findByText('Dr. Roberto');
    fireEvent.click(proCard);
    const nextBtn3 = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn3);

    // Passo 4: Data e Hora
    // Seleciona o dia 15 (um dia futuro garantido)
    const dayBtn = await screen.findByText('15');
    fireEvent.click(dayBtn);
    const timeBtn = await screen.findByText('10:00');
    fireEvent.click(timeBtn);
    const nextBtn4 = screen.getByRole('button', { name: /Confirmar Agendamento/i });
    fireEvent.click(nextBtn4);

    // Passo 5: Solicitar Agendamento
    const submitBtn = await screen.findByRole('button', { name: /Solicitar Agendamento/i });
    expect(submitBtn).toBeDefined();

    // Eventos de cliques múltiplos rápidos
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    // O botão deve ficar desabilitado e a API deve ser chamada exatamente uma vez
    expect(agendarConsulta).toHaveBeenCalledTimes(1);
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

    // Resolve a chamada de rede pendente
    await act(async () => {
      resolvePromise({ id: 'c-new', statusFluxo: 'consulta_solicitada' });
      await Promise.resolve();
    });

    // Passo 6: Verifica tela de sucesso
    await waitFor(() => {
      expect(screen.getByText('Consulta Solicitada!')).toBeDefined();
    });
  });
});
