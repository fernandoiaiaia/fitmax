import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusAvaliacao = 'avaliado' | 'pendente' | 'nao_avaliavel';
export type PeriodoHistorico = 'tudo' | 'semana' | 'mes' | 'ano';

export interface ProfissionalHistoricoResumo {
  id:            string;
  nome:          string;
  avatarUrl:     string | null;
  especialidade: string | null;
  cidade:        string | null;
  uf:            string | null;
}

export interface ConsultaHistoricoResumo {
  id:              string;
  especialidade:   string;
  modalidade:      'PRESENCIAL' | 'ONLINE';
  dataHora:        string;           // ISO8601
  valorReais:      string;           // ex: "320.00"
  status:          string;
  statusAvaliacao: StatusAvaliacao;
  nota:            number | null;
  comentario:      string | null;
  criadoEm:        string;
  profissional:    ProfissionalHistoricoResumo;
}

export interface ProfissionalHistoricoDetalhe extends ProfissionalHistoricoResumo {
  telefone:             string | null;
  registroProfissional: string | null;
  username:             string | null;
}

export interface ConsultaHistoricoDetalhe extends Omit<ConsultaHistoricoResumo, 'profissional'> {
  taxaPlataforma: number;
  estornoMotivo:  string | null;
  profissional:   ProfissionalHistoricoDetalhe;
}

export interface HistoricoResumo {
  totalConsultas:        number;
  totalInvestidoReais:   string;
  avaliacoesFeitasCount: number;
  pendentesAvaliacao:    number;
}

export interface TimelineItem {
  id:                string;
  especialidade:     string;
  modalidade:        string;
  dataHora:          string;
  profissionalNome:  string;
  profissionalAvatar: string | null;
}

export interface AvaliacaoResult {
  id:           string;
  nota:         number;
  comentario:   string | null;
  criadoEm:    string;
  atualizadoEm: string;
}

export interface ListarHistoricoParams {
  periodo?: PeriodoHistorico;
  page?:    number;
  limit?:   number;
}

export interface ListarHistoricoResult {
  data: ConsultaHistoricoResumo[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Funções de API ───────────────────────────────────────────────────────────

/**
 * Lista consultas realizadas do cliente com filtro de período e paginação.
 * GET /api/client-portal/historico
 */
export async function listarHistorico(
  params?: ListarHistoricoParams,
): Promise<ListarHistoricoResult> {
  const { data } = await api.get('/client-portal/historico', { params });
  return data;
}

/**
 * Retorna as métricas do card de Resumo Geral.
 * GET /api/client-portal/historico/resumo
 */
export async function resumoHistorico(): Promise<HistoricoResumo> {
  const { data } = await api.get('/client-portal/historico/resumo');
  return data;
}

/**
 * Retorna as últimas 8 consultas para o widget de Linha do Tempo.
 * GET /api/client-portal/historico/timeline
 */
export async function timelineHistorico(): Promise<TimelineItem[]> {
  const { data } = await api.get('/client-portal/historico/timeline');
  return data;
}

/**
 * Retorna o detalhe completo de uma consulta específica do histórico.
 * GET /api/client-portal/historico/:id
 */
export async function detalheHistorico(id: string): Promise<ConsultaHistoricoDetalhe> {
  const { data } = await api.get(`/client-portal/historico/${id}`);
  return data;
}

/**
 * Cria ou atualiza a avaliação de uma consulta (1–5 ⭐).
 * POST /api/client-portal/historico/:id/avaliar
 */
export async function avaliarConsulta(
  id:          string,
  nota:        number,
  comentario?: string,
): Promise<AvaliacaoResult> {
  const { data } = await api.post(`/client-portal/historico/${id}/avaliar`, {
    nota,
    ...(comentario ? { comentario } : {}),
  });
  return data;
}
