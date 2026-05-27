import { api } from './api';

// ─── Types (espelham o retorno da API) ────────────────────────────────────────

export type PlanoPeriodo = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export interface PlanoItem {
  id: string;
  nome: string;
  tipo: PlanoPeriodo;
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
  valor: number;      // em reais — a API converte para centavos
  consultas: number;
  taxa: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Lista todos os planos com estatísticas. */
export async function fetchAssinaturas(): Promise<AssinaturasResponse> {
  const { data } = await api.get<AssinaturasResponse>('/admin/assinaturas');
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
