"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsultaDia {
  id: number;
  data: string;       // "YYYY-MM-DD"
  horario: string;
  paciente: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  valor: number;
  status: "realizada" | "cancelada";
}

// ─── Mock Data — consultas do mês ────────────────────────────────────────────

const consultasMock: ConsultaDia[] = [
  { id: 1,  data: "2026-04-23", horario: "09:00", paciente: "Fernanda Lima",     especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 2,  data: "2026-04-23", horario: "11:00", paciente: "Guilherme Augusto", especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 3,  data: "2026-04-23", horario: "13:00", paciente: "Mariana Ferreira",  especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 4,  data: "2026-04-23", horario: "15:30", paciente: "Ricardo Nunes",     especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 5,  data: "2026-04-22", horario: "09:00", paciente: "Beatriz Santos",    especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 6,  data: "2026-04-22", horario: "11:30", paciente: "Carlos Eduardo",    especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 7,  data: "2026-04-21", horario: "10:00", paciente: "Lucas Mendes",      especialidade: "Check-up",           modalidade: "Presencial", valor: 420, status: "cancelada" },
  { id: 8,  data: "2026-04-20", horario: "14:00", paciente: "Ana Paula Ramos",   especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 9,  data: "2026-04-19", horario: "09:30", paciente: "Thiago Oliveira",   especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 10, data: "2026-04-18", horario: "16:00", paciente: "Camila Torres",     especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
  { id: 11, data: "2026-04-17", horario: "08:30", paciente: "Paulo Ramos",       especialidade: "Cardiologia",        modalidade: "Presencial", valor: 350, status: "realizada" },
  { id: 12, data: "2026-04-16", horario: "10:00", paciente: "Sofia Mendes",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "cancelada" },
  { id: 13, data: "2026-04-15", horario: "14:30", paciente: "Roberto Lima",      especialidade: "Check-up Cardíaco",  modalidade: "Presencial", valor: 420, status: "realizada" },
  { id: 14, data: "2026-04-14", horario: "11:00", paciente: "Lara Cardoso",      especialidade: "Cardiologia",        modalidade: "Online",     valor: 280, status: "realizada" },
  { id: 15, data: "2026-04-10", horario: "09:00", paciente: "Diego Souza",       especialidade: "Avaliação Cardíaca", modalidade: "Presencial", valor: 500, status: "realizada" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = "2026-04-23";

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR")}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent = false,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rel-stat${accent ? " rel-stat--accent" : ""}`}>
      <div className="rel-stat__icon">{icon}</div>
      <p className="rel-stat__label">{label}</p>
      <p className="rel-stat__value">{value}</p>
      {sub && <p className="rel-stat__sub">{sub}</p>}
    </div>
  );
}

// ─── Bar de progresso ─────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="rel-progress">
      <div className="rel-progress__fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PRESETS = ["Hoje", "7 dias", "15 dias", "Mês", "Personalizado"];

export default function RelatoriosPage() {
  const [preset, setPreset] = useState("Mês");
  const [dataInicio, setDataInicio] = useState("2026-04-01");
  const [dataFim, setDataFim] = useState(TODAY);

  // Compute date range from preset
  function applyPreset(p: string) {
    setPreset(p);
    const today = new Date(TODAY);
    if (p === "Hoje") {
      setDataInicio(TODAY); setDataFim(TODAY);
    } else if (p === "7 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 6);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "15 dias") {
      const d = new Date(today); d.setDate(d.getDate() - 14);
      setDataInicio(d.toISOString().slice(0, 10)); setDataFim(TODAY);
    } else if (p === "Mês") {
      setDataInicio("2026-04-01"); setDataFim(TODAY);
    }
    // "Personalizado" — manter os date pickers
  }

  // Filter by date range
  const filtered = useMemo(() =>
    consultasMock.filter((c) => c.data >= dataInicio && c.data <= dataFim),
    [dataInicio, dataFim]
  );

  // ── Stats do período ──
  const realizadas   = filtered.filter((c) => c.status === "realizada");
  const canceladas   = filtered.filter((c) => c.status === "cancelada");
  const faturamento  = realizadas.reduce((s, c) => s + c.valor, 0);
  const lucroLiquido = Math.round(faturamento * 0.72); // 72% líquido (simulado)
  const ticketMedio  = realizadas.length > 0 ? Math.round(faturamento / realizadas.length) : 0;
  const taxaCancelamento = filtered.length > 0 ? Math.round((canceladas.length / filtered.length) * 100) : 0;

  // ── Operação do Dia ──
  const hoje         = consultasMock.filter((c) => c.data === TODAY);
  const hojeFeit     = hoje.filter((c) => c.status === "realizada");
  const hojeCanc     = hoje.filter((c) => c.status === "cancelada");

  // ── Distribuição por especialidade ──
  const porEspecialidade = realizadas.reduce<Record<string, number>>((acc, c) => {
    acc[c.especialidade] = (acc[c.especialidade] ?? 0) + c.valor;
    return acc;
  }, {});
  const maxEsp = Math.max(...Object.values(porEspecialidade), 1);

  // ── Distribuição por modalidade ──
  const presencial = realizadas.filter((c) => c.modalidade === "Presencial").length;
  const online     = realizadas.filter((c) => c.modalidade === "Online").length;
  const totalMod   = presencial + online;

  return (
    <div className="rel-page">

      {/* ── Cabeçalho ── */}
      <div className="rel-header">
        <div>
          <h1 className="rel-header__title">Relatórios</h1>
          <p className="rel-header__sub">Acompanhe o desempenho financeiro e operacional do período.</p>
        </div>
      </div>

      {/* ── Filtro de período ── */}
      <div className="rel-filter-bar">
        <div className="rel-filter-bar__presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              id={`preset-${p.toLowerCase().replace(/\s/g, "-")}`}
              className={`rel-preset-btn${preset === p ? " rel-preset-btn--active" : ""}`}
              onClick={() => applyPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="rel-filter-bar__dates">
          <div className="rel-date-input">
            <CalIcon />
            <label className="rel-date-input__label" htmlFor="date-inicio">De</label>
            <input
              id="date-inicio"
              type="date"
              className="rel-date-input__field"
              value={dataInicio}
              max={dataFim}
              onChange={(e) => { setDataInicio(e.target.value); setPreset("Personalizado"); }}
            />
          </div>
          <span className="rel-filter-bar__sep">—</span>
          <div className="rel-date-input">
            <CalIcon />
            <label className="rel-date-input__label" htmlFor="date-fim">Até</label>
            <input
              id="date-fim"
              type="date"
              className="rel-date-input__field"
              value={dataFim}
              min={dataInicio}
              max={TODAY}
              onChange={(e) => { setDataFim(e.target.value); setPreset("Personalizado"); }}
            />
          </div>
        </div>
      </div>

      {/* ── Grid principal ── */}
      <div className="rel-body">

        {/* Coluna esquerda */}
        <div className="rel-main">

          {/* ── Resumo Financeiro ── */}
          <section className="rel-section">
            <h2 className="rel-section__title">Resumo Financeiro</h2>
            <p className="rel-section__sub">
              {formatDateBR(dataInicio)} — {formatDateBR(dataFim)}
            </p>

            <div className="rel-stats-grid">
              <StatCard
                icon={<TrendUpIcon />}
                label="Faturamento Total"
                value={formatCurrency(faturamento)}
                sub={`${realizadas.length} consultas realizadas`}
                accent
              />
              <StatCard
                icon={<MoneyIcon />}
                label="Lucro Líquido"
                value={formatCurrency(lucroLiquido)}
                sub="72% do faturamento bruto"
                accent
              />
              <StatCard
                icon={<CheckCircleIcon />}
                label="Ticket Médio"
                value={formatCurrency(ticketMedio)}
                sub="por consulta realizada"
              />
              <StatCard
                icon={<XCircleIcon />}
                label="Taxa de Cancelamento"
                value={`${taxaCancelamento}%`}
                sub={`${canceladas.length} consultas canceladas`}
              />
            </div>
          </section>

          {/* ── Operação do Dia ── */}
          <section className="rel-section">
            <h2 className="rel-section__title">Operação do Dia</h2>
            <p className="rel-section__sub">
              Hoje, {formatDateBR(TODAY)}
            </p>

            <div className="rel-day-grid">
              {/* Consultas realizadas */}
              <div className="rel-day-card rel-day-card--green">
                <div className="rel-day-card__icon-wrap rel-day-card__icon-wrap--green">
                  <CheckCircleIcon />
                </div>
                <div className="rel-day-card__info">
                  <p className="rel-day-card__label">Consultas Realizadas</p>
                  <p className="rel-day-card__value">{hojeFeit.length}</p>
                  <p className="rel-day-card__sub">de {hoje.length} agendadas</p>
                </div>
              </div>

              {/* Consultas canceladas */}
              <div className="rel-day-card rel-day-card--red">
                <div className="rel-day-card__icon-wrap rel-day-card__icon-wrap--red">
                  <XCircleIcon />
                </div>
                <div className="rel-day-card__info">
                  <p className="rel-day-card__label">Consultas Canceladas</p>
                  <p className="rel-day-card__value">{hojeCanc.length}</p>
                  <p className="rel-day-card__sub">taxa: {hoje.length > 0 ? Math.round((hojeCanc.length / hoje.length) * 100) : 0}%</p>
                </div>
              </div>
            </div>

            {/* Lista do dia */}
            {hoje.length > 0 && (
              <div className="rel-day-list">
                {hoje.map((c) => (
                  <div key={c.id} className="rel-day-item">
                    <div className="rel-day-item__time">
                      <ClockIcon />
                      <span>{c.horario}</span>
                    </div>
                    <div className="rel-day-item__info">
                      <p className="rel-day-item__name">
                        <UserIcon /> {c.paciente}
                      </p>
                      <p className="rel-day-item__meta">{c.especialidade} · {c.modalidade}</p>
                    </div>
                    <div className="rel-day-item__right">
                      <span className="rel-day-item__valor">{formatCurrency(c.valor)}</span>
                      <span
                        className="rel-day-item__badge"
                        style={
                          c.status === "realizada"
                            ? { background: "rgba(16,185,129,0.12)", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }
                            : { background: "rgba(239,68,68,0.12)",  color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }
                        }
                      >
                        {c.status === "realizada" ? "Realizada" : "Cancelada"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar: distribuições ── */}
        <aside className="rel-sidebar">

          {/* Por especialidade */}
          <div className="rel-dist-card">
            <p className="rel-dist-card__title">Faturamento por Especialidade</p>
            <div className="rel-dist-list">
              {Object.entries(porEspecialidade)
                .sort(([, a], [, b]) => b - a)
                .map(([esp, val]) => (
                  <div key={esp} className="rel-dist-item">
                    <div className="rel-dist-item__header">
                      <span className="rel-dist-item__label">{esp}</span>
                      <span className="rel-dist-item__val">{formatCurrency(val)}</span>
                    </div>
                    <ProgressBar value={val} max={maxEsp} color="#10b981" />
                  </div>
                ))}
            </div>
          </div>

          {/* Por modalidade */}
          <div className="rel-dist-card">
            <p className="rel-dist-card__title">Modalidade de Atendimento</p>
            <div className="rel-mod-grid">
              <div className="rel-mod-item">
                <div className="rel-mod-item__circle rel-mod-item__circle--green" />
                <p className="rel-mod-item__label">Presencial</p>
                <p className="rel-mod-item__value">{presencial}</p>
                <p className="rel-mod-item__pct">
                  {totalMod > 0 ? Math.round((presencial / totalMod) * 100) : 0}%
                </p>
              </div>
              <div className="rel-mod-item">
                <div className="rel-mod-item__circle rel-mod-item__circle--blue" />
                <p className="rel-mod-item__label">Online</p>
                <p className="rel-mod-item__value">{online}</p>
                <p className="rel-mod-item__pct">
                  {totalMod > 0 ? Math.round((online / totalMod) * 100) : 0}%
                </p>
              </div>
            </div>
            {/* Barra visual */}
            <div className="rel-mod-bar">
              <div
                className="rel-mod-bar__green"
                style={{ width: `${totalMod > 0 ? (presencial / totalMod) * 100 : 50}%` }}
              />
              <div
                className="rel-mod-bar__blue"
                style={{ width: `${totalMod > 0 ? (online / totalMod) * 100 : 50}%` }}
              />
            </div>
          </div>

          {/* Período resumido */}
          <div className="rel-dist-card">
            <p className="rel-dist-card__title">Período Selecionado</p>
            <div className="rel-period-info">
              <div className="rel-period-info__row">
                <span>Consultas no período</span>
                <strong>{filtered.length}</strong>
              </div>
              <div className="rel-period-info__row">
                <span>Realizadas</span>
                <strong style={{ color: "#10b981" }}>{realizadas.length}</strong>
              </div>
              <div className="rel-period-info__row">
                <span>Canceladas</span>
                <strong style={{ color: "#f87171" }}>{canceladas.length}</strong>
              </div>
              <div className="rel-period-info__row">
                <span>Faturamento bruto</span>
                <strong style={{ color: "#10b981" }}>{formatCurrency(faturamento)}</strong>
              </div>
              <div className="rel-period-info__row">
                <span>Lucro líquido</span>
                <strong style={{ color: "#10b981" }}>{formatCurrency(lucroLiquido)}</strong>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
