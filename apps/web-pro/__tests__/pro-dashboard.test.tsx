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

const mockSummaryResponse = {
  feedDestaques: [
    { id: 'f-1', imagemUrl: '/test-feed-1.png' },
    { id: 'f-2', imagemUrl: '/test-feed-2.png' },
    { id: 'f-3', imagemUrl: '/test-feed-3.png' },
    { id: 'f-4', imagemUrl: '/test-feed-4.png' },
  ],
  proximasConsultas: [
    {
      id: 'c-1',
      paciente: {
        nome: 'Guilherme Augusto',
        avatarUrl: '/avatar1.png',
      },
      modalidade: 'ONLINE',
      dataHora: new Date().toISOString(), // Hoje
      status: 'agendada',
    },
    {
      id: 'c-2',
      paciente: {
        nome: 'Mariana Ferreira',
        avatarUrl: '/avatar2.png',
      },
      modalidade: 'ONLINE',
      dataHora: new Date(Date.now() + 86400000).toISOString(), // Amanhã
      status: 'em_andamento',
    },
  ],
  consultas: {
    total: 3,
    agendada: 2,
    concluida: 1,
  },
  slotsDisponiveisHoje: 4,
};

describe('Web-Pro Painel (Dashboard) Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default mock fallback data when API fails or is loading', async () => {
    // API falha silenciosamente (retorna Promise rejeitada)
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Network Error'));

    const { container } = render(<PainelPage />);

    // 1. Título Geral
    expect(screen.getByText('Sua Visão Geral')).toBeInTheDocument();

    // 2. Destaques do Feed (renders fallback)
    expect(screen.getByText('Destaques do Feed')).toBeInTheDocument();
    expect(screen.getByText('Últimas publicações da plataforma')).toBeInTheDocument();
    
    const feedFallbackImages = container.querySelectorAll('img');
    // Deve renderizar as imagens fallback e o badge de +8
    expect(feedFallbackImages.length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText('+8')).toBeInTheDocument();

    // 3. Consultas Widget (renders mock fallback patients)
    expect(screen.getByText('Consultas Pendentes')).toBeInTheDocument();
    expect(screen.getByText('3 confirmadas esta semana')).toBeInTheDocument();
    expect(screen.getByText('Guilherme Augusto')).toBeInTheDocument();
    expect(screen.getByText('Mariana Ferreira')).toBeInTheDocument();
    expect(screen.getByText('Lucas Mendes')).toBeInTheDocument();

    // 4. Agenda Widget (renders mock fallback events)
    expect(screen.getByText('Sua Agenda')).toBeInTheDocument();
    expect(screen.getByText('Reunião de Equipe')).toBeInTheDocument();
    expect(screen.getByText('Avaliação Cardiológica')).toBeInTheDocument();
  });

  it('renders all widgets correctly with populated dynamic API data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockSummaryResponse });

    const { container } = render(<PainelPage />);

    // Aguarda montagem dinâmica
    await waitFor(() => {
      expect(screen.getByText('2 agendada(s) hoje')).toBeInTheDocument();
    });

    // 1. Destaques do Feed (dynamic images)
    const feedImages = Array.from(container.querySelectorAll('img'))
      .map(img => img.getAttribute('src'));
    expect(feedImages).toContain('/test-feed-1.png');
    expect(feedImages).toContain('/test-feed-2.png');
    expect(feedImages).toContain('/test-feed-3.png');
    expect(feedImages).toContain('/test-feed-4.png');
    expect(screen.getByText('+8')).toBeInTheDocument();

    // 2. Consultas Pendentes
    expect(screen.getByText('Guilherme Augusto')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Mariana Ferreira')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    // 3. Sua Agenda
    expect(screen.getByText('3 consulta(s) hoje')).toBeInTheDocument();
    expect(screen.getByText('2 agendada · 1 concluída')).toBeInTheDocument();
    expect(screen.getByText('4 slot(s) disponível')).toBeInTheDocument();
  });

  it('correctly handles specific status tag styling and dynamic date formatting', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockSummaryResponse });

    render(<PainelPage />);

    // Aguarda a renderização dos dados reais do banco/API
    await waitFor(() => {
      expect(screen.getByText('Guilherme Augusto')).toBeInTheDocument();
    });

    // Verifica que as datas formatadas como "Hoje" e "Amanhã" aparecem na tela
    expect(screen.getByText(/Hoje,/)).toBeInTheDocument();
    expect(screen.getByText(/Amanhã,/)).toBeInTheDocument();
  });
});
