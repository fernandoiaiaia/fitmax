"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusAvaliacao = "avaliado" | "pendente" | "nao_avaliavel";

interface ConsultaHistorico {
  id: number;
  data: string;
  dataISO: string;
  horario: string;
  nome: string;
  especialidade: string;
  modalidade: "Presencial" | "Online";
  avatar: string;
  valor: string;
  statusAvaliacao: StatusAvaliacao;
  nota?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const historico: ConsultaHistorico[] = [
  {
    id: 1,
    data: "15/02/2026", dataISO: "2026-02",
    horario: "14:30",
    nome: "Dra. Letícia Marques",
    especialidade: "Endocrinologia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=50",
    valor: "R$ 320", statusAvaliacao: "pendente",
  },
  {
    id: 2,
    data: "14/02/2026", dataISO: "2026-02",
    horario: "09:00",
    nome: "Dr. Roberto Alves",
    especialidade: "Ortopedia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=21",
    valor: "R$ 280", statusAvaliacao: "avaliado", nota: 5,
  },
  {
    id: 3,
    data: "13/02/2026", dataISO: "2026-02",
    horario: "11:00",
    nome: "Dra. Ana Souza",
    especialidade: "Nutrição", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=23",
    valor: "R$ 180", statusAvaliacao: "avaliado", nota: 5,
  },
  {
    id: 4,
    data: "12/02/2026", dataISO: "2026-02",
    horario: "16:00",
    nome: "Bruno Silva",
    especialidade: "Medicina Esportiva", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=25",
    valor: "R$ 220", statusAvaliacao: "avaliado", nota: 4,
  },
  {
    id: 5,
    data: "01/02/2026", dataISO: "2026-02",
    horario: "08:00",
    nome: "Dr. Vinícius Almeida",
    especialidade: "Nutrologia", modalidade: "Online",
    avatar: "https://picsum.photos/200/200?random=60",
    valor: "R$ 250", statusAvaliacao: "pendente",
  },
  {
    id: 6,
    data: "29/01/2026", dataISO: "2026-01",
    horario: "09:00",
    nome: "Marcelo Strong",
    especialidade: "Fisioterapia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=52",
    valor: "R$ 150", statusAvaliacao: "avaliado", nota: 3,
  },
  {
    id: 7,
    data: "20/01/2026", dataISO: "2026-01",
    horario: "14:00",
    nome: "Dra. Camila Nery",
    especialidade: "Personal Trainer", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=22",
    valor: "R$ 120", statusAvaliacao: "nao_avaliavel",
  },
  {
    id: 8,
    data: "10/01/2026", dataISO: "2026-01",
    horario: "11:30",
    nome: "Dr. Roberto Alves",
    especialidade: "Ortopedia", modalidade: "Presencial",
    avatar: "https://picsum.photos/200/200?random=21",
    valor: "R$ 280", statusAvaliacao: "avaliado", nota: 5,
  },
];

const timeline = historico
  .slice()
  .sort((a, b) => b.id - a.id)
  .map((c) => ({
    data: c.data,
    descricao: `${c.especialidade} · ${c.modalidade}`,
    profissional: c.nome,
    statusAvaliacao: c.statusAvaliacao,
  }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mesLabels: Record<string, string> = {
  "2026-02": "Fevereiro 2026",
  "2026-01": "Janeiro 2026",
  "2025-12": "Dezembro 2025",
};

function agruparPorMes(items: ConsultaHistorico[]) {
  const grupos: Record<string, ConsultaHistorico[]> = {};
  for (const item of items) {
    if (!grupos[item.dataISO]) grupos[item.dataISO] = [];
    grupos[item.dataISO].push(item);
  }
  return grupos;
}

const avaliacaoConfig: Record<
  StatusAvaliacao,
  { label: string; bg: string; color: string; border: string }
> = {
  avaliado:     { label: "AVALIADO",     bg: "rgba(16,185,129,0.12)",  color: "#10b981", border: "rgba(16,185,129,0.3)" },
  pendente:     { label: "PENDENTE",     bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  nao_avaliavel:{ label: "N/A",          bg: "rgba(161,161,170,0.1)",  color: "#71717a", border: "rgba(161,161,170,0.2)" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "#facc15" : "none"} stroke={filled ? "#facc15" : "#3f3f46"} strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function StarRating({ nota }: { nota: number }) {
  return (
    <div className="hist-stars">
      {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= nota} />)}
    </div>
  );
}

// ─── Consulta Card ────────────────────────────────────────────────────────────

function ConsultaCard({ c }: { c: ConsultaHistorico }) {
  const aval = avaliacaoConfig[c.statusAvaliacao];
  return (
    <div className="hist-card">
      {/* Header: data + badge avaliação */}
      <div className="hist-card__header">
        <div className="hist-card__date">
          <CalendarIcon />
          <span>{c.data}</span>
          <span className="hist-card__date-sep">·</span>
          <span>{c.horario}</span>
        </div>
        <span
          className="hist-pay-badge"
          style={{ background: aval.bg, color: aval.color, borderColor: aval.border }}
        >
          {aval.label}
        </span>
      </div>

      {/* Body: profissional + valor */}
      <div className="hist-card__body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.avatar} alt={c.nome} className="hist-card__avatar" />
        <div className="hist-card__info">
          <p className="hist-card__name">{c.nome}</p>
          <p className="hist-card__meta">{c.especialidade} · {c.modalidade}</p>
          {c.nota && (
            <div className="hist-card__nota">
              <StarRating nota={c.nota} />
              <span>Sua avaliação</span>
            </div>
          )}
        </div>
        <div className="hist-card__valor">
          <p className="hist-card__valor-label">Valor</p>
          <p className="hist-card__valor-num">{c.valor}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="hist-card__footer">
        <button className="hist-details-btn" id={`btn-detalhes-${c.id}`}>
          <ExternalLinkIcon />
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PERIODOS = ["Semana", "Mês", "Ano", "Tudo"];

export default function HistoricoPage() {
  const [periodo, setPeriodo] = useState("Mês");

  const grupos = agruparPorMes(historico);
  const meses = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

  const totalGasto = historico
    .reduce((acc, c) => acc + parseInt(c.valor.replace(/\D/g, "")), 0);

  const avaliados  = historico.filter((c) => c.statusAvaliacao === "avaliado").length;
  const pendentes  = historico.filter((c) => c.statusAvaliacao === "pendente").length;

  return (
    <div className="hist-page">

      {/* ── Cabeçalho ── */}
      <div className="hist-header">
        <div>
          <h1 className="hist-header__title">Histórico</h1>
          <p className="hist-header__sub">Consultas realizadas, avaliações e linha do tempo de atendimentos.</p>
        </div>
        <div className="hist-period-filters">
          {PERIODOS.map((p) => (
            <button
              key={p}
              id={`filter-periodo-${p.toLowerCase()}`}
              className={`hist-period-btn${periodo === p ? " hist-period-btn--active" : ""}`}
              onClick={() => setPeriodo(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="hist-body">

        {/* Coluna esquerda: consultas agrupadas por mês */}
        <div className="hist-list">
          <h2 className="hist-list__title">Consultas Realizadas</h2>

          {meses.map((mesKey) => {
            const items = grupos[mesKey];
            const label = mesLabels[mesKey] ?? mesKey;
            return (
              <div key={mesKey} className="hist-mes-group">
                <div className="hist-mes-label">
                  <span className="hist-mes-label__text">{label}</span>
                  <div className="hist-mes-label__line" />
                  <span className="hist-mes-label__count">{items.length} consultas</span>
                </div>
                <div className="hist-mes-cards">
                  {items.map((c) => <ConsultaCard key={c.id} c={c} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coluna direita: timeline + resumo */}
        <aside className="hist-sidebar">

          {/* Linha do tempo */}
          <div className="hist-tl-card">
            <div className="hist-tl-card__bar" />
            <div className="hist-tl-card__inner">
              <h3 className="hist-sidebar__title">Linha do tempo</h3>
              <div className="hist-timeline">
                {timeline.slice(0, 8).map((item, idx) => {
                  const isLast = idx === Math.min(timeline.length, 8) - 1;
                  return (
                    <div key={idx} className="hist-tl-item">
                      <div className="hist-tl-track">
                        <div className="hist-tl-dot" />
                        {!isLast && <div className="hist-tl-line" />}
                      </div>
                      <div className={`hist-tl-content${isLast ? "" : " hist-tl-content--spaced"}`}>
                        <p className="hist-tl-content__date">{item.data}</p>
                        <p className="hist-tl-content__desc">{item.descricao}</p>
                        <p className="hist-tl-content__paciente">{item.profissional}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="hist-tl-more" id="btn-ver-historico-completo">
                Ver histórico completo <ChevronDownIcon />
              </button>
            </div>
          </div>

          {/* Resumo Geral */}
          <div className="hist-summary">
            <p className="hist-sidebar__title">Resumo Geral</p>
            <div className="hist-summary__list">
              {[
                { label: "Total de consultas",      value: String(historico.length),             color: "#fafafa" },
                { label: "Total investido",          value: `R$ ${totalGasto.toLocaleString("pt-BR")}`, color: "#10b981" },
                { label: "Avaliações feitas",        value: String(avaliados),                    color: "#a78bfa" },
                { label: "Pendentes de avaliação",   value: String(pendentes),                    color: "#facc15" },
              ].map((item, i, arr) => (
                <div
                  key={i}
                  className={`hist-summary__row${i < arr.length - 1 ? " hist-summary__row--border" : ""}`}
                >
                  <span className="hist-summary__label">{item.label}</span>
                  <span className="hist-summary__value" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </div>

    </div>
  );
}
