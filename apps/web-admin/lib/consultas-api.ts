import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConsultaItem {
  id: string;
  especialidade: string;
  tipo: 'PRESENCIAL' | 'ONLINE';
  dataHora: string;
  valorReais: string;
  repasseReais: string;
  taxaPlataforma: number;
  status: 'PENDENTE' | 'PAGO' | 'ESTORNO';
  repasseEm: string | null;
  estornoMotivo: string | null;
  profissional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    especialidade: string | null;
  };
  cliente: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface ConsultasResponse {
  data: ConsultaItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KpisResponse {
  totalRepassadoReais: string;
  totalPendenteReais: string;
  totalEstornoReais: string;
  totalMovimentadoReais: string;
}

export interface ListFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'PENDENTE' | 'PAGO' | 'ESTORNO';
  page?: number;
  limit?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchConsultas(filters: ListFilters): Promise<ConsultasResponse> {
  const params = new URLSearchParams();
  if (filters.search)   params.set('search',   filters.search);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo)   params.set('dateTo',   filters.dateTo);
  if (filters.status)   params.set('status',   filters.status);
  params.set('page',  String(filters.page  ?? 1));
  params.set('limit', String(filters.limit ?? 50));

  const { data } = await api.get<ConsultasResponse>(`/admin/consultas?${params.toString()}`);
  return data;
}

export async function fetchKpis(dateFrom?: string, dateTo?: string): Promise<KpisResponse> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo)   params.set('dateTo',   dateTo);
  const { data } = await api.get<KpisResponse>(`/admin/consultas/kpis?${params.toString()}`);
  return data;
}

export async function processarRepasse(ids: string[]): Promise<{ processadas: number; ids: string[] }> {
  const { data } = await api.post('/admin/consultas/repasse', { ids });
  return data;
}
