import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusFluxo = 'pagamento_pendente' | 'consulta_confirmada' | 'consulta_cancelada';

export interface ProfissionalResumo {
  id: string;
  name: string;
  avatarUrl: string | null;
  especialidade: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface ConsultaResumo {
  id: string;
  especialidade: string;
  tipo: string;
  dataHora: string;
  valorReais: string;
  taxaPlataforma: number;
  statusFluxo: StatusFluxo;
  repasseEm: string | null;
  estornoMotivo: string | null;
  criadoEm: string;
  profissional: ProfissionalResumo;
}

export interface ConsultaDetalhe extends ConsultaResumo {
  profissional: ProfissionalResumo & {
    telefone: string | null;
    registroProfissional: string | null;
    username: string | null;
  };
}

export interface ConsultaStats {
  totalConsultas: number;
  totalInvestidoReais: string;
  consultasHoje: number;
  confirmadas: number;
  pendentes: number;
  proximaEm: string | null;
}

export interface ListarParams {
  dateFrom?: string;
  dateTo?: string;
  status?: 'PENDENTE' | 'PAGO' | 'ESTORNO';
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListarResult {
  data: ConsultaResumo[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Funções de API ───────────────────────────────────────────────────────────

export async function listarConsultas(params?: ListarParams): Promise<ListarResult> {
  const { data } = await api.get('/client-portal/consultas', { params });
  return data;
}

export async function statsConsultas(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<ConsultaStats> {
  const { data } = await api.get('/client-portal/consultas/stats', { params });
  return data;
}

export async function detalheConsulta(id: string): Promise<ConsultaDetalhe> {
  const { data } = await api.get(`/client-portal/consultas/${id}`);
  return data;
}

export async function agendarConsulta(body: {
  profissionalId: string;
  especialidade: string;
  tipo: 'PRESENCIAL' | 'ONLINE';
  dataHora: string;
  valorCentavos: number;
  observacao?: string;
}): Promise<ConsultaResumo> {
  const { data } = await api.post('/client-portal/consultas', body);
  return data;
}

export async function cancelarConsulta(
  id: string,
  motivo?: string,
): Promise<{ id: string; statusFluxo: string }> {
  const { data } = await api.post(`/client-portal/consultas/${id}/cancelar`, { motivo });
  return data;
}

export async function reagendarConsulta(
  id: string,
  novaDataHora: string,
): Promise<ConsultaResumo> {
  const { data } = await api.post(`/client-portal/consultas/${id}/reagendar`, { novaDataHora });
  return data;
}

export interface ProfissionalDisponivel {
  id: string;
  name: string;
  avatarUrl: string | null;
  especialidade: string | null;
  cidade: string | null;
  uf: string | null;
  registroProfissional: string | null;
}

export async function listarProfissionais(especialidade?: string): Promise<ProfissionalDisponivel[]> {
  const params = especialidade ? { especialidade } : undefined;
  const { data } = await api.get('/client-portal/profissionais', { params });
  return data.data;
}

export async function listarEspecialidades(): Promise<string[]> {
  const { data } = await api.get('/client-portal/especialidades');
  return data.data;
}

/**
 * Retorna os horários já ocupados (HH:MM) de um profissional numa data.
 * Usado pelo calendário para bloquear slots tomados.
 * @param profissionalId UUID do profissional
 * @param data string no formato YYYY-MM-DD
 */
export async function buscarDisponibilidade(
  profissionalId: string,
  data: string,
  tipo?: 'Presencial' | 'Online',
): Promise<{ hora: string; modalidade: string; endereco: string; ocupado: boolean }[]> {
  const { data: res } = await api.get(`/client-portal/profissionais/${profissionalId}/disponibilidade`, {
    params: { data, ...(tipo ? { tipo } : {}) },
  });
  return res.data;
}

export async function listarConvenios(): Promise<{ id: string | number; nome: string; categoria: string; ativo: boolean }[]> {
  const { data } = await api.get('/client-portal/convenios');
  return data;
}
