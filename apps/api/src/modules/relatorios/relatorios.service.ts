import { prisma } from '@fitmax/database';

// ─── Types ────────────────────────────────────────────────────────────────────

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_COMPLETOS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export interface KpisResult {
  faturamentoBruto: number;   // centavos
  totalRepassado:   number;   // centavos
  pendente:         number;   // centavos
  estornos:         number;   // centavos
  receitaFitMax:    number;   // centavos
  taxaMediaPct:     number;   // ex: 4.2
  deltaFatPct:      number | null;
  periodoLabel:     string;
}

export interface GraficoResult {
  meses:       string[];
  faturamento: number[];  // centavos por mês
  repasses:    number[];  // centavos por mês
}

export interface OperacionalResult {
  usuarios:    { total: number; ativos: number; clientes: number; profissionais: number };
  consultas:   { total: number; realizadas: number; pendentes: number; canceladas: number };
  publicacoes: { total: number; ativas: number; denunciadas: number; banidas: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Intervalo de datas para o filtro de período */
function buildPeriod(ano: number, mes?: number): { gte: Date; lt: Date } {
  if (mes) {
    const start = new Date(ano, mes - 1, 1);
    const end   = new Date(ano, mes, 1);
    return { gte: start, lt: end };
  }
  return { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) };
}

/** Agrega valorCentavos de consultas num período e status */
async function somarConsultas(
  period: { gte: Date; lt: Date },
  status: ('PAGO' | 'ESTORNO' | 'PENDENTE')[],
): Promise<number> {
  const res = await prisma.consulta.aggregate({
    where: { status: { in: status }, dataHora: period },
    _sum: { valorCentavos: true },
  });
  return res._sum.valorCentavos ?? 0;
}

/** Total repassado num período */
async function somarRepasses(period: { gte: Date; lt: Date }): Promise<number> {
  const res = await prisma.repasse.aggregate({
    where: { processadoEm: period },
    _sum: { valorCentavos: true },
  });
  return res._sum.valorCentavos ?? 0;
}

/** Receita FitMax = SUM(valorCentavos * taxaPlataforma / 100) para consultas PAGO */
async function calcReceitaFitmax(period: { gte: Date; lt: Date }): Promise<number> {
  const consultas = await prisma.consulta.findMany({
    where: { status: 'PAGO', dataHora: period },
    select: { valorCentavos: true, taxaPlataforma: true },
  });
  return consultas.reduce((acc, c) => acc + Math.round(c.valorCentavos * c.taxaPlataforma / 100), 0);
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class RelatoriosService {

  /** KPIs financeiros — alimenta os 5 cards do topo */
  async kpis(ano: number, mes?: number): Promise<KpisResult> {
    const period     = buildPeriod(ano, mes);
    const periodPrev = buildPeriod(ano - 1, mes);

    const [
      faturamentoBruto,
      estornos,
      totalRepassado,
      receitaFitMax,
      fatAnoAnterior,
    ] = await Promise.all([
      somarConsultas(period,     ['PAGO', 'ESTORNO']),
      somarConsultas(period,     ['ESTORNO']),
      somarRepasses(period),
      calcReceitaFitmax(period),
      somarConsultas(periodPrev, ['PAGO', 'ESTORNO']),
    ]);

    const pendente = Math.max(faturamentoBruto - totalRepassado - estornos, 0);

    // Taxa média = receitaFitMax / faturamentoBruto em %
    const taxaMediaPct = faturamentoBruto > 0
      ? parseFloat(((receitaFitMax / faturamentoBruto) * 100).toFixed(1))
      : 0;

    // Delta % vs ano anterior (A05: não expõe dados de outros admins)
    const deltaFatPct = fatAnoAnterior > 0
      ? parseFloat((((faturamentoBruto - fatAnoAnterior) / fatAnoAnterior) * 100).toFixed(1))
      : null;

    const periodoLabel = mes
      ? `${MESES_COMPLETOS[mes - 1]} ${ano}`
      : `Ano ${ano}`;

    return { faturamentoBruto, totalRepassado, pendente, estornos, receitaFitMax, taxaMediaPct, deltaFatPct, periodoLabel };
  }

  /** Dados mensais para o gráfico de linha */
  async grafico(ano: number, mes?: number): Promise<GraficoResult> {
    // Se filtrar por mês, retorna apenas aquele mês; caso contrário, todos os 12
    const indices = mes ? [mes - 1] : Array.from({ length: 12 }, (_, i) => i);

    const [fatPorMes, repPorMes] = await Promise.all([
      Promise.all(indices.map(i => somarConsultas(buildPeriod(ano, i + 1), ['PAGO', 'ESTORNO']))),
      Promise.all(indices.map(i => somarRepasses(buildPeriod(ano, i + 1)))),
    ]);

    return {
      meses:       indices.map(i => MESES_LABEL[i]),
      faturamento: fatPorMes,
      repasses:    repPorMes,
    };
  }

  /** Cards operacionais — usuários, consultas, publicações */
  async operacional(): Promise<OperacionalResult> {
    const [
      totalClientes, totalProfs,
      ativosC, ativosP,
      totalConsultas, realizadas, pendentes, canceladas,
      totalPubs, ativas, denunciadas, banidas,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.professional.count(),
      prisma.client.count({ where: { status: 'ATIVO' } }),
      prisma.professional.count({ where: { status: 'ATIVO' } }),
      prisma.consulta.count(),
      prisma.consulta.count({ where: { status: 'PAGO' } }),
      prisma.consulta.count({ where: { status: 'PENDENTE' } }),
      prisma.consulta.count({ where: { status: 'ESTORNO' } }),
      prisma.publicacao.count(),
      prisma.publicacao.count({ where: { status: 'ATIVA' } }),
      prisma.publicacao.count({ where: { status: 'DENUNCIADA' } }),
      prisma.publicacao.count({ where: { status: 'BANIDA' } }),
    ]);

    return {
      usuarios: {
        total:          totalClientes + totalProfs,
        ativos:         ativosC + ativosP,
        clientes:       totalClientes,
        profissionais:  totalProfs,
      },
      consultas: {
        total:      totalConsultas,
        realizadas,
        pendentes,
        canceladas,
      },
      publicacoes: {
        total: totalPubs,
        ativas,
        denunciadas,
        banidas,
      },
    };
  }

  /** Exportar PDF — agrega tudo e retorna HTML imprimível */
  async exportarPdf(ano: number, mes?: number): Promise<string> {
    const [kpisData, graficoData, opData] = await Promise.all([
      this.kpis(ano, mes),
      this.grafico(ano, mes),
      this.operacional(),
    ]);

    const fmt = (v: number) => `R$ ${(v / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const now  = new Date().toLocaleString('pt-BR');

    // Linhas do gráfico em texto (simplificado para impressão)
    const graficoRows = graficoData.meses.map((m, i) =>
      `<tr><td>${m}</td><td>${fmt(graficoData.faturamento[i])}</td><td>${fmt(graficoData.repasses[i])}</td></tr>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>FitMax · Relatório ${kpisData.periodoLabel}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#111; margin:0; padding:32px; }
    h1 { color:#10b981; margin-bottom:4px; } h2 { color:#444; font-size:15px; margin:0 0 24px; }
    .kpis { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:32px; }
    .kpi  { border:1px solid #e5e7eb; border-radius:10px; padding:16px 20px; min-width:160px; }
    .kpi .label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; }
    .kpi .value { font-size:22px; font-weight:700; color:#10b981; margin:4px 0 2px; }
    .kpi .delta { font-size:11px; color:#9ca3af; }
    table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px; }
    th { background:#f9fafb; color:#374151; font-size:11px; text-align:left; padding:8px 12px; border-bottom:1px solid #e5e7eb; }
    td { padding:8px 12px; border-bottom:1px solid #f3f4f6; }
    .ops { display:flex; gap:16px; flex-wrap:wrap; }
    .ops-card { border:1px solid #e5e7eb; border-radius:10px; padding:16px; min-width:180px; }
    .ops-card h3 { margin:0 0 10px; font-size:13px; color:#374151; }
    .ops-row { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #f3f4f6; }
    footer { margin-top:40px; font-size:11px; color:#9ca3af; border-top:1px solid #f3f4f6; padding-top:12px; }
    @media print { body { padding:16px; } }
  </style>
</head>
<body>
  <h1>FitMax — Relatórios & Analytics</h1>
  <h2>Período: ${kpisData.periodoLabel} &nbsp;·&nbsp; Gerado em ${now}</h2>

  <div class="kpis">
    <div class="kpi"><div class="label">Faturamento Bruto</div><div class="value">${fmt(kpisData.faturamentoBruto)}</div><div class="delta">${kpisData.deltaFatPct !== null ? `↑ ${kpisData.deltaFatPct}% vs. ano anterior` : '—'}</div></div>
    <div class="kpi"><div class="label">Total Repassado</div><div class="value">${fmt(kpisData.totalRepassado)}</div><div class="delta">${kpisData.faturamentoBruto > 0 ? Math.round(kpisData.totalRepassado / kpisData.faturamentoBruto * 100) : 0}% do faturamento</div></div>
    <div class="kpi"><div class="label">Pendente de Repasse</div><div class="value">${fmt(kpisData.pendente)}</div></div>
    <div class="kpi"><div class="label">Estornos</div><div class="value">${fmt(kpisData.estornos)}</div></div>
    <div class="kpi"><div class="label">Receita FitMax</div><div class="value">${fmt(kpisData.receitaFitMax)}</div><div class="delta">Taxa média: ${kpisData.taxaMediaPct}%</div></div>
  </div>

  <h3>Faturamento Mensal</h3>
  <table>
    <thead><tr><th>Mês</th><th>Faturamento</th><th>Repasses</th></tr></thead>
    <tbody>${graficoRows}</tbody>
  </table>

  <h3>Operacional</h3>
  <div class="ops">
    <div class="ops-card"><h3>Usuários (${opData.usuarios.total} total)</h3>
      <div class="ops-row"><span>Clientes</span><b>${opData.usuarios.clientes}</b></div>
      <div class="ops-row"><span>Profissionais</span><b>${opData.usuarios.profissionais}</b></div>
      <div class="ops-row"><span>Ativos</span><b>${opData.usuarios.ativos}</b></div>
    </div>
    <div class="ops-card"><h3>Consultas (${opData.consultas.total} total)</h3>
      <div class="ops-row"><span>Realizadas</span><b>${opData.consultas.realizadas}</b></div>
      <div class="ops-row"><span>Pendentes</span><b>${opData.consultas.pendentes}</b></div>
      <div class="ops-row"><span>Canceladas</span><b>${opData.consultas.canceladas}</b></div>
    </div>
    <div class="ops-card"><h3>Publicações (${opData.publicacoes.total} total)</h3>
      <div class="ops-row"><span>Ativas</span><b>${opData.publicacoes.ativas}</b></div>
      <div class="ops-row"><span>Denunciadas</span><b>${opData.publicacoes.denunciadas}</b></div>
      <div class="ops-row"><span>Banidas</span><b>${opData.publicacoes.banidas}</b></div>
    </div>
  </div>

  <footer>FitMax Admin · Relatório gerado automaticamente em ${now} · Dados confidenciais</footer>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  }
}
