import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PainelPage from '../app/painel/page';
import { api } from '../lib/api';

// Mock do Axios helper
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockDashboardData = {
  feed: [
    { id: 'pub-1', imagemUrl: '/pub1.png' },
    { id: 'pub-2', imagemUrl: '/pub2.png' },
  ],
  consultas: [
    {
      id: 'cons-1',
      dataHora: '2026-06-02T10:00:00.000Z',
      profissional: {
        name: 'Dra. Ana Souza',
        especialidade: 'Nutrição',
        avatarUrl: '/avatar1.png',
      },
    },
  ],
  agenda: [
    {
      id: 'agenda-1',
      dataHora: new Date().toISOString(), // hoje
      profissional: {
        name: 'Dr. Roberto Alves',
        especialidade: 'Ortopedia',
        avatarUrl: '/avatar2.png',
      },
    },
  ],
};

describe('Web-Client Painel (Dashboard) Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Cria uma promise que fica pendente para reter o loading state
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    render(<PainelPage />);
    expect(screen.getByText('Carregando sua visão geral...')).toBeInTheDocument();
  });

  it('renders all widgets correctly with populated API data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockDashboardData });

    const { container } = render(<PainelPage />);

    // Aguarda finalizar o loading e montar
    await waitFor(() => {
      expect(screen.queryByText('Carregando sua visão geral...')).not.toBeInTheDocument();
    });

    // 1. Títulos de Seção e Cabeçalhos
    expect(screen.getByText('Sua Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Destaques do Feed')).toBeInTheDocument();
    expect(screen.getByText('Consultas Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Sua Agenda')).toBeInTheDocument();

    // 2. Elementos do Feed Widget
    expect(screen.getByText('As novidades mais recentes')).toBeInTheDocument();
    const feedImages = container.querySelectorAll('img');
    // Temos imagem do feed e imagens de avatares das consultas/agenda
    expect(feedImages.length).toBeGreaterThanOrEqual(2);

    // 3. Elementos do Widget de Consultas Pendentes
    expect(screen.getByText('Dra. Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Nutrição')).toBeInTheDocument();
    expect(screen.getByText('1 marcadas')).toBeInTheDocument();

    // 4. Elementos do Widget de Agenda
    expect(screen.getByText('Ortopedia')).toBeInTheDocument();
  });

  it('renders elegant empty fallback states when arrays are empty', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { feed: [], consultas: [], agenda: [] },
    });

    render(<PainelPage />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando sua visão geral...')).not.toBeInTheDocument();
    });

    // Validar mensagens de fallback vazio
    expect(screen.getByText('Nenhum post no feed ainda.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma consulta pendente.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum evento para hoje.')).toBeInTheDocument();
  });
});
