import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserStatus = 'ATIVO' | 'INATIVO' | 'BANIDO';
export type UserTipo   = 'cliente' | 'profissional';

export interface UsuarioItem {
  id:                   string;
  nome:                 string;
  email:                string;
  cpf:                  string | null;
  avatarUrl:            string | null;
  status:               UserStatus;
  plano:                string | null;
  tipo:                 UserTipo;
  especialidade:        string | null;
  registroProfissional: string | null;
  createdAt:            string;
}

export interface UsuariosResponse {
  data: UsuarioItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Resumo {
  total:           number;
  ativos:          number;
  inativos:        number;
  banidos:         number;
  profissionaisPro: number;
}

export interface RecenteItem {
  id:          string;
  nome:        string;
  avatarUrl:   string | null;
  tipo:        UserTipo;
  especialidade: string | null;
  createdAt:   string;
}

export interface ListFilters {
  search?: string;
  status?: UserStatus;
  tipo?:   UserTipo;
  page?:   number;
  limit?:  number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formata ISO date para "07/04/2025" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchUsuarios(filters: ListFilters): Promise<UsuariosResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.tipo)   params.set('tipo',   filters.tipo);
  params.set('page',  String(filters.page  ?? 1));
  params.set('limit', String(filters.limit ?? 50));
  const { data } = await api.get<UsuariosResponse>(`/admin/usuarios?${params}`);
  return data;
}

export async function fetchResumo(): Promise<Resumo> {
  const { data } = await api.get<Resumo>('/admin/usuarios/resumo');
  return data;
}

export async function fetchRecentes(limit = 6): Promise<RecenteItem[]> {
  const { data } = await api.get<RecenteItem[]>(`/admin/usuarios/recentes?limit=${limit}`);
  return data;
}

export async function toggleStatus(
  id: string,
  tipo: UserTipo,
  novoStatus: 'ATIVO' | 'INATIVO',
): Promise<void> {
  await api.patch(`/admin/usuarios/${id}/status`, { tipo, novoStatus });
}

export async function banirUsuario(id: string, tipo: UserTipo, motivo?: string): Promise<void> {
  await api.post(`/admin/usuarios/${id}/banir`, { tipo, motivo });
}

export async function restaurarUsuario(id: string, tipo: UserTipo): Promise<void> {
  await api.post(`/admin/usuarios/${id}/restaurar`, { tipo });
}
