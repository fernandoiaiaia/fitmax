import { api } from './api';

// ─── Types (espelham o retorno da API) ────────────────────────────────────────

export type PlanoPeriodo   = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
export type PlanoAudiencia = 'CLIENTE' | 'PROFISSIONAL';

export interface PlanoItem {
  id: string;
  nome: string;
  tipo: PlanoPeriodo;
  audiencia: PlanoAudiencia;
  valor: number;        // em reais (ex: 140.00)
  valorCentavos: number;
  consultas: number;
  taxa: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssinaturasStats {
  total: number;
  ativos: number;
  inativos: number;
  receitaPotencial: number; // soma dos valores ativos em reais
}

export interface AssinaturasResponse {
  planos: PlanoItem[];
  stats: AssinaturasStats;
}

export interface CriarPlanoPayload {
  nome: string;
  tipo: PlanoPeriodo;
  audiencia: PlanoAudiencia;
  valor: number;      // em reais — a API converte para centavos
  consultas: number;
  taxa: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Lista planos por audiência com estatísticas. */
export async function fetchAssinaturas(audiencia?: PlanoAudiencia): Promise<AssinaturasResponse> {
  const params = audiencia ? { audiencia } : {};
  const { data } = await api.get<AssinaturasResponse>('/admin/assinaturas', { params });
  return data;
}

/** Cria um novo plano de assinatura. */
export async function criarPlano(payload: CriarPlanoPayload): Promise<PlanoItem> {
  const { data } = await api.post<PlanoItem>('/admin/assinaturas', payload);
  return data;
}

/** Alterna o status ativo/inativo de um plano. */
export async function togglePlano(id: string): Promise<PlanoItem> {
  const { data } = await api.patch<PlanoItem>(`/admin/assinaturas/${id}/toggle`);
  return data;
}

/** Exclui permanentemente um plano. */
export async function excluirPlano(id: string): Promise<{ deleted: boolean; id: string; nome: string }> {
  const { data } = await api.delete(`/admin/assinaturas/${id}`);
  return data;
}
