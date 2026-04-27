"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultaStatus = "agendada" | "pendente" | "a_confirmar" | "em_andamento";

interface Consulta {
  id: number;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  data: string;
  avatar: string;
  status: ConsultaStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const consultaEmAndamento = {
  nome: "Dra. Letícia Marques",
  especialidade: "Endocrinologista",
  horario: "14:30 — 15:30",
  avatar: "https://picsum.photos/200/200?random=50",
};

const consultas: Consulta[] = [
  {
    id: 1,
    horario: "09:00",
    nome: "Dr. Roberto Alves",
    especialidade: "Ortopedia",
    modalidade: "Presencial",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=21",
    status: "agendada",
  },
  {
    id: 2,
    horario: "11:00",
    nome: "Dra. Ana Souza",
    especialidade: "Nutrição",
    modalidade: "Online",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=23",
    status: "pendente",
  },
  {
    id: 3,
    horario: "14:30",
    nome: "Dra. Letícia Marques",
    especialidade: "Endocrinologia",
    modalidade: "Presencial",
    data: "Hoje, 22/04",
    avatar: "https://picsum.photos/200/200?random=50",
    status: "em_andamento",
  },
  {
    id: 4,
    horario: "09:00",
    nome: "Dr. Vinícius Almeida",
    especialidade: "Nutrologia",
    modalidade: "Online",
    data: "Amanhã, 23/04",
    avatar: "https://picsum.photos/200/200?random=60",
    status: "a_confirmar",
  },
  {
    id: 5,
    horario: "16:00",
    nome: "Marcelo Strong",
    especialidade: "Fisioterapia",
    modalidade: "Presencial",
    data: "24/04",
    avatar: "https://picsum.photos/200/200?random=52",
    status: "agendada",
  },
  {
    id: 6,
    horario: "10:30",
    nome: "Bruno Silva",
    especialidade: "Medicina Esportiva",
    modalidade: "Online",
    data: "25/04",
    avatar: "https://picsum.photos/200/200?random=25",
    status: "pendente",
  },
  {
    id: 7,
    horario: "13:00",
    nome: "Dra. Camila Nery",
    especialidade: "Personal Trainer",
    modalidade: "Presencial",
    data: "26/04",
    avatar: "https://picsum.photos/200/200?random=22",
    status: "agendada",
  },
];

// ─── Status Config ─────────────────────────────────────────────────────────

const statusConfig: Record<
  ConsultaStatus,
  { label: string; bg: string; color: string; border: string; actionLabel?: string }
> = {
  agendada:    { label: "AGENDADA",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)",  actionLabel: "Reagendar" },
  pendente:    { label: "PENDENTE",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", border: "rgba(234,179,8,0.3)",   actionLabel: "Pagar" },
  a_confirmar: { label: "A CONFIRMAR",  bg: "transparent",             color: "#a1a1aa", border: "#3f3f46" },
  em_andamento:{ label: "EM ANDAMENTO", bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
};

const STATUS_FILTERS = ["Todas", "Agendadas", "Pendentes", "A Confirmar", "Em Andamento"];

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

const TrendingIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);

const MoneyIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="18" x2="12" y2="18" />
  </svg>
);

// ─── Row de consulta ──────────────────────────────────────────────────────────

function ConsultaRow({ c }: { c: Consulta }) {
  const cfg = statusConfig[c.status];
  const isAndamento = c.status === "em_andamento";
  return (
    <div className={`cns-row${isAndamento ? " cns-row--active" : ""}`}>
      {/* Horário */}
      <div className="cns-row__time">
        <span>{c.horario}</span>
        {isAndamento && <span className="cns-row__time-dot" />}
      </div>

      <div className="cns-row__sep" />

      {/* Avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.avatar} alt={c.nome} className="cns-row__avatar" />

      {/* Info */}
      <div className="cns-row__info">
        <p className="cns-row__name">{c.nome}</p>
        <p className="cns-row__meta">{c.especialidade} · {c.modalidade}</p>
        <p className="cns-row__date">
          <ClockIcon /> {c.data}
        </p>
      </div>

      {/* Status + action */}
      <div className="cns-row__actions">
        <span
          className="cns-badge"
          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
        >
          {cfg.label}
        </span>

        {cfg.actionLabel && (
          <button
            className="cns-action-btn"
            style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
          >
            {cfg.actionLabel}
          </button>
        )}

        <button className="cns-dots-btn" aria-label="Mais opções">
          <DotsIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultasPage() {
  const [filter, setFilter] = useState("Todas");

  const filtered = consultas.filter((c) => {
    if (filter === "Todas")        return true;
    if (filter === "Agendadas")    return c.status === "agendada";
    if (filter === "Pendentes")    return c.status === "pendente";
    if (filter === "A Confirmar")  return c.status === "a_confirmar";
    if (filter === "Em Andamento") return c.status === "em_andamento";
    return true;
  });

  return (
    <div className="cns-page">

      {/* ── Cabeçalho ── */}
      <div className="cns-header">
        <div>
          <h1 className="cns-header__title">Consultas</h1>
          <p className="cns-header__sub">Gerencie seus agendamentos e acompanhe o status de cada consulta</p>
        </div>

        <div className="cns-header__controls">
          <button className="cns-ctrl-btn" id="btn-filtro-periodo">
            <CalendarIcon />
            <span>22/04/2026 — 22/05/2026</span>
            <FilterIcon />
          </button>
          <button className="cns-ctrl-btn" id="btn-filtro-status">
            <span>Filtrar por status</span>
            <FilterIcon />
          </button>
          <button className="cns-primary-btn" id="btn-nova-consulta">
            + Nova Consulta
          </button>
        </div>
      </div>

      {/* ── Cards de Resumo ── */}
      <div className="cns-summary-row">

        {/* Bloco esquerdo: Resumo + Em Andamento */}
        <div className="cns-summary-left">

          {/* Resumo do Período */}
          <div className="cns-card">
            <p className="cns-card__label">Resumo do Período</p>
            <div className="cns-resumo-grid">
              <div className="cns-resumo-item">
                <div className="cns-resumo-item__icon">
                  <TrendingIcon />
                </div>
                <p className="cns-resumo-item__meta">Consultas</p>
                <p className="cns-resumo-item__value">7</p>
                <p className="cns-resumo-item__trend">+2 vs mês anterior</p>
              </div>
              <div className="cns-resumo-item">
                <div className="cns-resumo-item__icon">
                  <MoneyIcon />
                </div>
                <p className="cns-resumo-item__meta">Valor Investido</p>
                <p className="cns-resumo-item__value">R$970</p>
                <p className="cns-resumo-item__trend">+8% vs mês anterior</p>
              </div>
            </div>
          </div>

          {/* Em Andamento */}
          <div className="cns-card cns-card--live">
            <div className="cns-card--live__bar" />
            <div className="cns-card--live__content">
              <div className="cns-card--live__header">
                <span className="cns-card__label">Em Andamento</span>
                <span className="cns-live-badge">
                  <span className="cns-live-badge__dot" />
                  Ao vivo
                </span>
              </div>
              <div className="cns-card--live__body">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={consultaEmAndamento.avatar}
                  alt={consultaEmAndamento.nome}
                  className="cns-card--live__avatar"
                />
                <div className="cns-card--live__info">
                  <p className="cns-card--live__name">{consultaEmAndamento.nome}</p>
                  <p className="cns-card--live__spec">{consultaEmAndamento.especialidade}</p>
                  <p className="cns-card--live__time">
                    <ClockIcon /> {consultaEmAndamento.horario}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visão Geral do Dia */}
        <div className="cns-card cns-card--day">
          <p className="cns-card__label">Visão Geral do Dia</p>
          <div className="cns-day-list">
            {[
              { icon: "📅", label: "Total de Consultas", value: "3",     color: "#fafafa" },
              { icon: "✅", label: "Confirmadas",         value: "1",     color: "#10b981" },
              { icon: "⏳", label: "Pendentes",           value: "1",     color: "#facc15" },
              { icon: "⏱",  label: "Próxima em",          value: "2h",    color: "#60a5fa" },
            ].map((item, i) => (
              <div key={i} className="cns-day-item" id={`day-item-${i}`}>
                <div className="cns-day-item__left">
                  <span className="cns-day-item__icon">{item.icon}</span>
                  <span className="cns-day-item__label">{item.label}</span>
                </div>
                <span className="cns-day-item__value" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lista de Consultas ── */}
      <div className="cns-list-section">
        <div className="cns-list-header">
          <div>
            <h2 className="cns-list-header__title">Próximas Consultas</h2>
            <p className="cns-list-header__count">{filtered.length} consultas encontradas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="cns-filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-${f.toLowerCase().replace(/\s/g, "-")}`}
              className={`cns-filter-btn${filter === f ? " cns-filter-btn--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="cns-list">
          {filtered.length === 0 ? (
            <div className="cns-empty">
              <span className="cns-empty__icon">📭</span>
              <p>Nenhuma consulta encontrada para este filtro.</p>
            </div>
          ) : (
            filtered.map((c) => <ConsultaRow key={c.id} c={c} />)
          )}
        </div>
      </div>

    </div>
  );
}
