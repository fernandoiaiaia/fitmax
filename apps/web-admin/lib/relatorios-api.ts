import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpisData {
  faturamentoBruto: number;   // centavos
  totalRepassado:   number;   // centavos
  pendente:         number;   // centavos
  estornos:         number;   // centavos
  receitaFitMax:    number;   // centavos
  taxaMediaPct:     number;
  deltaFatPct:      number | null;
  periodoLabel:     string;
}

export interface GraficoData {
  meses:       string[];
  faturamento: number[];  // centavos
  repasses:    number[];  // centavos
}

export interface OperacionalData {
  usuarios:    { total: number; ativos: number; clientes: number; profissionais: number };
  consultas:   { total: number; realizadas: number; pendentes: number; canceladas: number };
  publicacoes: { total: number; ativas: number; denunciadas: number; banidas: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte centavos para "R$ 1.400,00" */
export function fmtCentavos(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

/** Converte centavos para valor inteiro no padrão do gráfico (sem decimais) */
export function centavosParaGrafico(centavos: number): number {
  return Math.round(centavos / 100);
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchKpis(ano: number, mes?: number): Promise<KpisData> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (mes) params.set('mes', String(mes));
  const { data } = await api.get<KpisData>(`/admin/relatorios/kpis?${params}`);
  return data;
}

export async function fetchGrafico(ano: number, mes?: number): Promise<GraficoData> {
  const params = new URLSearchParams({ ano: String(ano) });
  if (mes) params.set('mes', String(mes));
  const { data } = await api.get<GraficoData>(`/admin/relatorios/grafico?${params}`);
  return data;
}

export async function fetchOperacional(): Promise<OperacionalData> {
  const { data } = await api.get<OperacionalData>('/admin/relatorios/operacional');
  return data;
}

/** Abre o PDF em nova aba — o servidor gera o HTML imprimível */
export function exportarPdf(ano: number, mes?: number): void {
  const params = new URLSearchParams({ ano: String(ano) });
  if (mes) params.set('mes', String(mes));
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  // Importa tokenStore em runtime para evitar import circular
  import('./api').then(({ tokenStore }) => {
    const token = tokenStore.get();
    fetch(`${baseUrl}/admin/relatorios/exportar-pdf?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.text())
      .then(html => {
        const w = window.open('', '_blank', 'width=950,height=750');
        if (!w) return;
        w.document.write(html);
        w.document.close();
        w.focus();
      })
      .catch(() => console.error('Erro ao exportar PDF'));
  });
}
