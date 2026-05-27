import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicacaoItem {
  id: string;
  topico: string;
  caption: string;
  imagemUrl: string;
  aspectRatio: number;
  likes: number;
  comentarios: number;
  status: 'ATIVA' | 'DENUNCIADA' | 'BANIDA';
  motivoBan: string | null;
  moderadoEm: string | null;
  createdAt: string;
  totalDenuncias: number;
  profissional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    especialidade: string | null;
    registroProfissional: string | null;
  };
}

export interface PublicacoesResponse {
  data: PublicacaoItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Contadores {
  ATIVA: number;
  DENUNCIADA: number;
  BANIDA: number;
  total: number;
}

export interface ListFilters {
  search?: string;
  status?: 'ATIVA' | 'DENUNCIADA' | 'BANIDA';
  page?: number;
  limit?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte ISO date para "Há X horas/dias" */
export function toRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(diff / 86_400_000);
  if (min < 60)  return `Há ${min} min`;
  if (h   < 24)  return `Há ${h} hora${h !== 1 ? 's' : ''}`;
  if (d   === 1) return 'Ontem';
  return `Há ${d} dias`;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchPublicacoes(filters: ListFilters): Promise<PublicacoesResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  params.set('page',  String(filters.page  ?? 1));
  params.set('limit', String(filters.limit ?? 50));

  const { data } = await api.get<PublicacoesResponse>(`/admin/publicacoes?${params}`);
  return data;
}

export async function fetchContadores(): Promise<Contadores> {
  const { data } = await api.get<Contadores>('/admin/publicacoes/contadores');
  return data;
}

export async function banirPublicacao(id: string, motivo?: string): Promise<void> {
  await api.post(`/admin/publicacoes/${id}/banir`, { motivo });
}

export async function aprovarPublicacao(id: string): Promise<void> {
  await api.post(`/admin/publicacoes/${id}/aprovar`);
}
